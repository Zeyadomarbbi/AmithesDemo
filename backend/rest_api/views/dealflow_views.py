from uuid import UUID, uuid4
from collections import defaultdict
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from django.db import IntegrityError, connection, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models.core import Fund
from ..models.reference import Country, Currency

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None


SETUP_ALLOWED_TYPES = {"status", "stage", "source_type", "doc_type", "sector", "team_role"}


def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def is_supported_setup_type(value):
    return str(value or "").strip() in SETUP_ALLOWED_TYPES


DASHBOARD_SERIES_COLORS = ["#375A89", "#F9A8B4", "#FD9640", "#7B6FC6", "#4A5568", "#67C6E3"]
DASHBOARD_DONUT_COLORS = ["#E8734A", "#375A89", "#C8A97A", "#7B6FC6", "#D94F5C", "#F5C842", "#4A5568", "#67C6E3"]


def resolve_dealflow_user_id(email):
    if not email:
        return None

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id
            FROM dealflow.df_users
            WHERE lower(email) = lower(%s)
              AND is_active = TRUE
            LIMIT 1
            """,
            [email],
        )
        row = cursor.fetchone()
        return row[0] if row else None


def resolve_default_taxonomy_id(cursor, taxonomy_type, preferred_codes=(), preferred_names=()):
    cursor.execute(
        """
        SELECT id, code, name
        FROM dealflow.df_taxonomy_items
        WHERE type = %s
          AND is_active = TRUE
        ORDER BY display_order ASC NULLS LAST, name ASC
        """,
        [taxonomy_type],
    )
    rows = dictfetchall(cursor)
    if not rows:
        return None

    normalized_codes = {str(code).strip().lower() for code in preferred_codes if code}
    normalized_names = {str(name).strip().lower() for name in preferred_names if name}

    for row in rows:
        if str(row.get("code") or "").strip().lower() in normalized_codes:
            return row["id"]
        if str(row.get("name") or "").strip().lower() in normalized_names:
            return row["id"]

    return rows[0]["id"]


def normalize_uuid(value):
    try:
        return str(UUID(str(value).strip()))
    except (ValueError, TypeError, AttributeError):
        return None


def resolve_taxonomy_item_id(cursor, taxonomy_type, codes=(), names=()):
    normalized_codes = [str(code).strip().lower() for code in codes if str(code or "").strip()]
    normalized_names = [str(name).strip().lower() for name in names if str(name or "").strip()]

    for code in normalized_codes:
        cursor.execute(
            """
            SELECT id
            FROM dealflow.df_taxonomy_items
            WHERE type = %s
              AND is_active = TRUE
              AND lower(code) = %s
            ORDER BY display_order ASC NULLS LAST, name ASC
            LIMIT 1
            """,
            [taxonomy_type, code],
        )
        row = cursor.fetchone()
        if row:
            return str(row[0])

    for name in normalized_names:
        cursor.execute(
            """
            SELECT id
            FROM dealflow.df_taxonomy_items
            WHERE type = %s
              AND is_active = TRUE
              AND lower(name) = %s
            ORDER BY display_order ASC NULLS LAST, name ASC
            LIMIT 1
            """,
            [taxonomy_type, name],
        )
        row = cursor.fetchone()
        if row:
            return str(row[0])

    return None


def create_taxonomy_item(cursor, taxonomy_type, name, code=None, color=None):
    normalized_name = str(name or "").strip()
    normalized_code = str(code or "").strip() or None

    if not normalized_name:
        return None

    cursor.execute(
        """
        SELECT COALESCE(MAX(display_order), 0) + 1
        FROM dealflow.df_taxonomy_items
        WHERE type = %s
        """,
        [taxonomy_type],
    )
    next_display_order = cursor.fetchone()[0]
    taxonomy_id = uuid4()
    now = timezone.now()

    cursor.execute(
        """
        INSERT INTO dealflow.df_taxonomy_items (
            id,
            type,
            name,
            code,
            display_order,
            color,
            is_active,
            created_at,
            updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s, %s)
        """,
        [
            str(taxonomy_id),
            taxonomy_type,
            normalized_name,
            normalized_code,
            next_display_order,
            color,
            now,
            now,
        ],
    )
    return str(taxonomy_id)


def resolve_currency_taxonomy_id(cursor, value):
    if value in ("", None):
        return None

    as_uuid = normalize_uuid(value)
    if as_uuid:
        return as_uuid

    currency = Currency.objects.filter(currency_id=value).first()
    if not currency:
        return None

    taxonomy_id = resolve_taxonomy_item_id(
        cursor,
        "currency",
        codes=(currency.currency_code,),
        names=(currency.currency_name,),
    )
    if taxonomy_id:
        return taxonomy_id

    return create_taxonomy_item(
        cursor,
        "currency",
        name=currency.currency_name,
        code=currency.currency_code,
    )


def resolve_country_taxonomy_id(cursor, value):
    if value in ("", None):
        return None

    as_uuid = normalize_uuid(value)
    if as_uuid:
        return as_uuid

    country = Country.objects.filter(country_id=value).select_related("currency").first()
    if not country:
        return None

    taxonomy_id = resolve_taxonomy_item_id(
        cursor,
        "country",
        codes=(country.iso2_code, country.iso3_code),
        names=(country.country_name,),
    )
    if taxonomy_id:
        return taxonomy_id

    return create_taxonomy_item(
        cursor,
        "country",
        name=country.country_name,
        code=country.iso2_code,
    )


def resolve_dealflow_fund_id(cursor, value):
    if value in ("", None):
        return None

    as_uuid = normalize_uuid(value)
    if as_uuid:
        return as_uuid

    fund = Fund.objects.filter(fund_id=value, is_deleted=False).select_related("currency").first()
    if not fund:
        return None

    normalized_legal_name = str(fund.legal_name or "").strip()
    normalized_short_name = str(fund.short_name or "").strip()

    cursor.execute(
        """
        SELECT id
        FROM dealflow.df_funds
        WHERE lower(name) = lower(%s)
           OR lower(name) = lower(%s)
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 1
        """,
        [normalized_legal_name, normalized_short_name or normalized_legal_name],
    )
    row = cursor.fetchone()
    if row:
        return str(row[0])

    now = timezone.now()
    dealflow_fund_id = uuid4()
    currency_id = resolve_currency_taxonomy_id(cursor, getattr(fund, "currency_id", None))
    description_parts = [
        str(fund.fund_strategy or "").strip(),
        str(fund.management_company or "").strip(),
    ]
    description = " | ".join(part for part in description_parts if part) or None

    cursor.execute(
        """
        INSERT INTO dealflow.df_funds (
            id,
            name,
            currency_id,
            fund_size,
            description,
            created_at,
            updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        [
            str(dealflow_fund_id),
            normalized_legal_name or normalized_short_name,
            currency_id,
            None,
            description,
            now,
            now,
        ],
    )
    return str(dealflow_fund_id)


def serialize_deal_row(row):
    ticket_amount = row.get("ticket_amount")
    return {
        "id": row.get("deal_id"),
        "deal_id": row.get("deal_id"),
        "name": row.get("deal_name") or row.get("company_name") or "",
        "code": row.get("deal_code") or row.get("company_code") or "",
        "company_id": row.get("company_id"),
        "company": {
            "id": row.get("company_id"),
            "name": row.get("company_name") or "",
            "code": row.get("company_code") or "",
            "sector_id": row.get("sector_id"),
            "country_of_main_operation_id": row.get("country_of_main_operation_id"),
            "country_of_incorporation_id": row.get("country_of_incorporation_id"),
        },
        "fund_id": row.get("fund_id"),
        "fund": {
            "id": row.get("fund_id"),
            "name": row.get("fund_name") or "",
        } if row.get("fund_id") else None,
        "status_id": row.get("status_id"),
        "status": {
            "id": row.get("status_id"),
            "name": row.get("status_name") or "",
            "color": row.get("status_color"),
        } if row.get("status_id") else None,
        "stage_id": row.get("stage_id"),
        "stage": {
            "id": row.get("stage_id"),
            "name": row.get("stage_name") or "",
            "color": row.get("stage_color"),
        } if row.get("stage_id") else None,
        "currency_id": row.get("currency_id"),
        "currency": {
            "id": row.get("currency_id"),
            "name": row.get("currency_name") or "",
            "code": row.get("currency_code") or "",
        } if row.get("currency_id") else None,
        "sector_id": row.get("sector_id"),
        "sector": {
            "id": row.get("sector_id"),
            "name": row.get("sector_name") or "",
            "color": row.get("sector_color"),
        } if row.get("sector_id") else None,
        "country_id": row.get("country_id"),
        "country": {
            "id": row.get("country_id"),
            "name": row.get("country_name") or "",
            "code": (row.get("country_code") or "").lower(),
        } if row.get("country_id") else None,
        "ticket_amount": float(ticket_amount) if ticket_amount is not None else None,
        "created_by": row.get("created_by"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "stage_log": row.get("stage_log") or [],
    }


def serialize_deal_detail_row(row):
    ticket_amount = row.get("ticket_amount")
    return {
        "id": row.get("deal_id"),
        "deal_id": row.get("deal_id"),
        "name": row.get("deal_name") or "",
        "code": row.get("deal_code") or "",
        "company_id": row.get("company_id"),
        "company": {
            "id": row.get("company_id"),
            "name": row.get("company_name") or "",
            "code": row.get("company_code") or "",
            "sector_id": row.get("sector_id"),
            "business_activity": row.get("business_activity") or "",
            "website": row.get("website") or "",
            "registration_number": row.get("registration_number") or "",
            "sponsor": row.get("sponsor") or "",
            "legal_form_id": row.get("legal_form_id"),
            "country_of_incorporation_id": row.get("country_of_incorporation_id"),
            "country_of_main_operation_id": row.get("country_of_main_operation_id"),
            "address": row.get("address") or "",
            "zip_code": row.get("zip_code") or "",
            "city": row.get("city") or "",
            "address_country_id": row.get("address_country_id"),
        },
        "fund_id": row.get("fund_id"),
        "status_id": row.get("status_id"),
        "stage_id": row.get("stage_id"),
        "source_type_id": row.get("source_type_id"),
        "contact_id": row.get("contact_id"),
        "ticket_amount": float(ticket_amount) if ticket_amount is not None else None,
        "currency_id": row.get("currency_id"),
        "deal_date": row.get("deal_date"),
        "sourcing_relevant_information": row.get("sourcing_relevant_information") or "",
        "exit_type_id": row.get("exit_type_id"),
        "exit_relevant_information": row.get("exit_relevant_information") or "",
        "contact": {
            "id": row.get("contact_id"),
            "name": row.get("contact_name") or "",
        } if row.get("contact_id") or row.get("contact_name") else None,
        "fund": {
            "id": row.get("fund_id"),
            "name": row.get("fund_name") or "",
        } if row.get("fund_id") else None,
        "status": {
            "id": row.get("status_id"),
            "name": row.get("status_name") or "",
            "color": row.get("status_color"),
        } if row.get("status_id") else None,
        "stage": {
            "id": row.get("stage_id"),
            "name": row.get("stage_name") or "",
            "color": row.get("stage_color"),
        } if row.get("stage_id") else None,
        "source_type": {
            "id": row.get("source_type_id"),
            "name": row.get("source_type_name") or "",
            "color": row.get("source_type_color"),
        } if row.get("source_type_id") else None,
        "currency": {
            "id": row.get("currency_id"),
            "name": row.get("currency_name") or "",
            "code": row.get("currency_code") or "",
        } if row.get("currency_id") else None,
        "exit_type": {
            "id": row.get("exit_type_id"),
            "name": row.get("exit_type_name") or "",
            "color": row.get("exit_type_color"),
        } if row.get("exit_type_id") else None,
        "sector": {
            "id": row.get("sector_id"),
            "name": row.get("sector_name") or "",
            "color": row.get("sector_color"),
        } if row.get("sector_id") else None,
        "legal_form": {
            "id": row.get("legal_form_id"),
            "name": row.get("legal_form_name") or "",
        } if row.get("legal_form_id") else None,
        "country_of_incorporation": {
            "id": row.get("country_of_incorporation_id"),
            "name": row.get("country_of_incorporation_name") or "",
            "code": (row.get("country_of_incorporation_code") or "").lower(),
        } if row.get("country_of_incorporation_id") else None,
        "country_of_main_operation": {
            "id": row.get("country_of_main_operation_id"),
            "name": row.get("country_of_main_operation_name") or "",
            "code": (row.get("country_of_main_operation_code") or "").lower(),
        } if row.get("country_of_main_operation_id") else None,
        "address_country": {
            "id": row.get("address_country_id"),
            "name": row.get("address_country_name") or "",
            "code": (row.get("address_country_code") or "").lower(),
        } if row.get("address_country_id") else None,
        "created_by": row.get("created_by"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "team_members": row.get("team_members") or [],
    }


def normalize_keyword_query(value):
    return str(value or "").strip()


def build_ilike_term(value):
    normalized = normalize_keyword_query(value).lower()
    return f"%{normalized}%" if normalized else ""


def fetch_deal_list_rows(cursor, deal_ids=None, keyword=None):
    where_clauses = [
        "d.deleted_at IS NULL",
        "(c.deleted_at IS NULL OR c.id IS NULL)",
    ]
    params = []

    normalized_deal_ids = []
    for value in deal_ids or []:
        normalized = normalize_uuid(value)
        if normalized:
            normalized_deal_ids.append(normalized)
    if deal_ids is not None:
        if not normalized_deal_ids:
            return []
        where_clauses.append("d.id = ANY(%s::uuid[])")
        params.append(normalized_deal_ids)

    keyword_term = build_ilike_term(keyword)
    if keyword_term:
        where_clauses.append(
            """
            (
                LOWER(CONCAT_WS(' ',
                    d.name,
                    d.code,
                    c.name,
                    c.code,
                    f.name,
                    st.name,
                    ss.name,
                    cur.name,
                    cur.code,
                    sec.name,
                    geo.name,
                    d.sourcing_relevant_information,
                    d.exit_relevant_information,
                    c.business_activity,
                    c.website,
                    c.registration_number,
                    c.sponsor,
                    c.address,
                    c.city,
                    ct.name
                )) LIKE %s
                OR EXISTS (
                    SELECT 1
                    FROM dealflow.df_events e
                    WHERE e.deal_id = d.id
                      AND e.deleted_at IS NULL
                      AND LOWER(CONCAT_WS(' ', e.title, e.description)) LIKE %s
                )
                OR EXISTS (
                    SELECT 1
                    FROM dealflow.df_documents doc
                    WHERE doc.deal_id = d.id
                      AND doc.deleted_at IS NULL
                      AND LOWER(CONCAT_WS(' ', doc.name, doc.file_name, doc.file_extension, doc.file_url)) LIKE %s
                )
            )
            """
        )
        params.extend([keyword_term, keyword_term, keyword_term])

    where_sql = "\n                  AND ".join(where_clauses)
    cursor.execute(
        f"""
        SELECT
            d.id AS deal_id,
            d.name AS deal_name,
            d.code AS deal_code,
            d.company_id,
            d.fund_id,
            d.stage_id,
            d.status_id,
            d.currency_id,
            d.ticket_amount,
            d.created_by,
            d.created_at,
            d.updated_at,

            c.name AS company_name,
            c.code AS company_code,
            c.sector_id,
            c.country_of_main_operation_id,
            c.country_of_incorporation_id,

            ct.name AS contact_name,

            f.name AS fund_name,

            st.name AS stage_name,
            st.color AS stage_color,

            ss.name AS status_name,
            ss.color AS status_color,

            cur.name AS currency_name,
            cur.code AS currency_code,

            sec.name AS sector_name,
            sec.color AS sector_color,

            geo.id AS country_id,
            geo.name AS country_name,
            geo.code AS country_code

        FROM dealflow.df_deals d
        LEFT JOIN dealflow.df_companies c
            ON c.id = d.company_id
        LEFT JOIN dealflow.df_contacts ct
            ON ct.id = d.contact_id
        LEFT JOIN dealflow.df_funds f
            ON f.id = d.fund_id
        LEFT JOIN dealflow.df_taxonomy_items st
            ON st.id = d.stage_id
        LEFT JOIN dealflow.df_taxonomy_items ss
            ON ss.id = d.status_id
        LEFT JOIN dealflow.df_taxonomy_items cur
            ON cur.id = d.currency_id
        LEFT JOIN dealflow.df_taxonomy_items sec
            ON sec.id = c.sector_id
        LEFT JOIN dealflow.df_taxonomy_items geo
            ON geo.id = COALESCE(
                c.country_of_main_operation_id,
                c.country_of_incorporation_id,
                c.address_country_id
            )
        WHERE {where_sql}
        ORDER BY d.updated_at DESC NULLS LAST, d.created_at DESC NULLS LAST
        """,
        params,
    )
    return dictfetchall(cursor)


def resolve_dealflow_document_path(file_url):
    media_root = Path(settings.MEDIA_ROOT).resolve()
    normalized_candidates = []

    raw_value = str(file_url or "").strip()
    if raw_value:
        parsed = urlparse(raw_value)
        candidate = parsed.path if parsed.scheme else raw_value
        normalized_candidates.append(candidate)

    for candidate in normalized_candidates:
        cleaned = str(candidate or "").replace("\\", "/").strip()
        if not cleaned:
            continue
        if settings.MEDIA_URL and cleaned.startswith(settings.MEDIA_URL):
            cleaned = cleaned[len(settings.MEDIA_URL):]
        elif settings.MEDIA_URL:
            media_marker = settings.MEDIA_URL.rstrip("/")
            if media_marker and media_marker in cleaned:
                cleaned = cleaned.split(media_marker, 1)[-1]

        cleaned = cleaned.lstrip("/").strip()
        if not cleaned:
            continue

        candidate_path = Path(cleaned)
        resolved = candidate_path.resolve() if candidate_path.is_absolute() else (media_root / candidate_path).resolve()
        try:
            resolved.relative_to(media_root)
        except ValueError:
            continue
        if resolved.is_file():
            return resolved

    return None


@lru_cache(maxsize=128)
def read_pdf_text_cached(file_path, modified_at_ns):
    del modified_at_ns

    if PdfReader is None:
        return ""

    try:
        reader = PdfReader(file_path)
    except Exception:
        return ""

    extracted_pages = []
    for page in reader.pages:
        try:
            extracted_pages.append(page.extract_text() or "")
        except Exception:
            continue

    return "\n".join(extracted_pages).lower()


def fetch_pdf_keyword_match_ids(cursor, keyword):
    normalized_keyword = normalize_keyword_query(keyword).lower()
    if not normalized_keyword or PdfReader is None:
        return set()

    cursor.execute(
        """
        SELECT DISTINCT
            d.deal_id,
            d.file_url,
            d.file_name,
            d.file_extension
        FROM dealflow.df_documents d
        INNER JOIN dealflow.df_deals deal
            ON deal.id = d.deal_id
        WHERE d.deleted_at IS NULL
          AND deal.deleted_at IS NULL
          AND (
              lower(COALESCE(d.file_extension, '')) = 'pdf'
              OR lower(COALESCE(d.file_name, '')) LIKE '%%.pdf'
          )
        """
    )

    matched_deal_ids = set()
    for row in dictfetchall(cursor):
        file_path = resolve_dealflow_document_path(row.get("file_url"))
        if not file_path:
            continue

        try:
            extracted_text = read_pdf_text_cached(str(file_path), file_path.stat().st_mtime_ns)
        except OSError:
            continue

        if normalized_keyword in extracted_text:
            matched_deal_ids.add(str(row.get("deal_id")))

    return matched_deal_ids


def serialize_deal_team_member_row(row):
    return {
        "id": row.get("id"),
        "deal_id": row.get("deal_id"),
        "user_id": row.get("user_id"),
        "role_id": row.get("role_id"),
        "position_order": row.get("position_order"),
        "user": {
            "id": row.get("user_id"),
            "name": row.get("user_name") or "",
            "email": row.get("user_email") or "",
            "role": row.get("user_role") or "",
        } if row.get("user_id") else None,
        "role": {
            "id": row.get("role_id"),
            "name": row.get("role_name") or "",
            "code": row.get("role_code") or "",
            "color": row.get("role_color"),
        } if row.get("role_id") else None,
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def fetch_deal_team_members(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            dtm.id,
            dtm.deal_id,
            dtm.user_id,
            dtm.role_id,
            dtm.position_order,
            dtm.created_at,
            dtm.updated_at,
            u.name AS user_name,
            u.email AS user_email,
            u.role AS user_role,
            tr.name AS role_name,
            tr.code AS role_code,
            tr.color AS role_color
        FROM dealflow.df_deal_team_members dtm
        LEFT JOIN dealflow.df_users u
            ON u.id = dtm.user_id
        LEFT JOIN dealflow.df_taxonomy_items tr
            ON tr.id = dtm.role_id
        WHERE dtm.deal_id = %s
        ORDER BY dtm.position_order ASC NULLS LAST, dtm.created_at ASC NULLS LAST, u.name ASC
        """,
        [str(deal_id)],
    )
    return [serialize_deal_team_member_row(row) for row in dictfetchall(cursor)]


def serialize_event_row(row):
    return {
        "id": row.get("event_id"),
        "deal_id": row.get("deal_id"),
        "title": row.get("title") or "",
        "description": row.get("description") or "",
        "event_date": row.get("event_date"),
        "event_type_id": row.get("event_type_id"),
        "event_type": {
            "id": row.get("event_type_id"),
            "name": row.get("event_type_name") or "",
            "color": row.get("event_type_color"),
        } if row.get("event_type_id") else None,
        "created_by": row.get("created_by"),
        "created_by_user": {
            "id": row.get("created_by"),
            "name": row.get("created_by_name") or "",
        } if row.get("created_by") or row.get("created_by_name") else None,
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "documents_count": int(row.get("documents_count") or 0),
        "documents": row.get("documents") or [],
    }


def parse_stage_name_from_event_title(title):
    normalized = str(title or "").strip()
    prefixes = ("Stage changed to ", "Stage updated to ")
    for prefix in prefixes:
        if normalized.startswith(prefix):
            return normalized[len(prefix):].strip()
    return ""


def format_stage_log_display_date(value):
    if not value:
        return ""
    if hasattr(value, "strftime"):
        return value.strftime("%b %d, %Y")
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.strftime("%b %d, %Y")
    except Exception:
        return str(value)


def fetch_stage_log_map(cursor, deal_ids):
    normalized_deal_ids = [normalize_uuid(value) for value in (deal_ids or [])]
    normalized_deal_ids = [value for value in normalized_deal_ids if value]
    if not normalized_deal_ids:
        return {}

    cursor.execute(
        """
        SELECT
            e.id AS event_id,
            e.deal_id,
            e.title,
            e.event_date,
            e.created_by,
            e.created_at,
            e.updated_at,
            u.name AS created_by_name
        FROM dealflow.df_events e
        LEFT JOIN dealflow.df_users u
            ON u.id = e.created_by
        WHERE e.deal_id = ANY(%s::uuid[])
          AND e.deleted_at IS NULL
          AND (
              e.title LIKE 'Stage changed to %%'
              OR e.title LIKE 'Stage updated to %%'
          )
        ORDER BY e.event_date ASC NULLS LAST, e.created_at ASC NULLS LAST, e.updated_at ASC NULLS LAST
        """,
        [normalized_deal_ids],
    )

    stage_log_map = defaultdict(list)
    for row in dictfetchall(cursor):
        stage_name = parse_stage_name_from_event_title(row.get("title"))
        if not stage_name:
            continue
        deal_id = str(row.get("deal_id"))
        stage_log_map[deal_id].append(
            {
                "id": row.get("event_id"),
                "stage": stage_name,
                "date": format_stage_log_display_date(row.get("event_date")),
                "rawDate": row.get("event_date"),
                "changedBy": row.get("created_by_name") or "",
            }
        )
    return stage_log_map


def sync_deal_stage_from_stage_log(cursor, deal_id, fallback_stage_id=None):
    cursor.execute(
        """
        SELECT
            e.title,
            e.event_date,
            e.created_at
        FROM dealflow.df_events e
        WHERE e.deal_id = %s
          AND e.deleted_at IS NULL
          AND (
              e.title LIKE 'Stage changed to %%'
              OR e.title LIKE 'Stage updated to %%'
          )
        ORDER BY e.event_date DESC NULLS LAST, e.created_at DESC NULLS LAST
        LIMIT 1
        """,
        [str(deal_id)],
    )
    row = cursor.fetchone()

    next_stage_id = fallback_stage_id
    if row:
        stage_name = parse_stage_name_from_event_title(row[0])
        if stage_name:
            resolved_stage_id = resolve_taxonomy_item_id(cursor, "stage", names=(stage_name,))
            if resolved_stage_id:
                next_stage_id = resolved_stage_id

    if next_stage_id:
        cursor.execute(
            """
            UPDATE dealflow.df_deals
            SET
                stage_id = %s,
                updated_at = %s
            WHERE id = %s
              AND deleted_at IS NULL
            """,
            [next_stage_id, timezone.now(), str(deal_id)],
        )


def fetch_deal_events(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            e.id AS event_id,
            e.deal_id,
            e.title,
            e.description,
            e.event_date,
            e.event_type_id,
            e.created_by,
            e.created_at,
            e.updated_at,
            et.name AS event_type_name,
            et.color AS event_type_color,
            u.name AS created_by_name
        FROM dealflow.df_events e
        LEFT JOIN dealflow.df_taxonomy_items et
            ON et.id = e.event_type_id
        LEFT JOIN dealflow.df_users u
            ON u.id = e.created_by
        WHERE e.deal_id = %s
          AND e.deleted_at IS NULL
        ORDER BY e.event_date DESC NULLS LAST, e.created_at DESC NULLS LAST
        """,
        [str(deal_id)],
    )
    event_rows = dictfetchall(cursor)
    if not event_rows:
        return []

    event_ids = [str(row["event_id"]) for row in event_rows if row.get("event_id")]
    cursor.execute(
        """
        SELECT
            d.id,
            d.event_id,
            d.name,
            d.file_name,
            d.file_extension,
            d.file_url,
            d.document_date
        FROM dealflow.df_documents d
        WHERE d.event_id = ANY(%s::uuid[])
          AND d.deleted_at IS NULL
        ORDER BY d.document_date DESC NULLS LAST, d.created_at DESC NULLS LAST
        """,
        [event_ids],
    )
    document_rows = dictfetchall(cursor)
    documents_by_event = {}
    for document in document_rows:
        event_id = str(document.get("event_id"))
        documents_by_event.setdefault(event_id, []).append({
            "id": document.get("id"),
            "name": document.get("name") or document.get("file_name") or "",
            "file_name": document.get("file_name") or "",
            "file_extension": document.get("file_extension") or "",
            "file_url": document.get("file_url") or "",
            "document_date": document.get("document_date"),
        })

    serialized = []
    for row in event_rows:
        docs = documents_by_event.get(str(row.get("event_id")), [])
        row["documents"] = docs
        row["documents_count"] = len(docs)
        serialized.append(serialize_event_row(row))
    return serialized


def fetch_deal_company_id(cursor, deal_id):
    cursor.execute(
        """
        SELECT company_id
        FROM dealflow.df_deals
        WHERE id = %s
          AND deleted_at IS NULL
        LIMIT 1
        """,
        [str(deal_id)],
    )
    row = cursor.fetchone()
    return str(row[0]) if row and row[0] else None


def fetch_dashboard_filter_options(cursor):
    filter_types = {
        "statuses": "status",
        "stages": "stage",
    }
    filters_data = {}
    for key, taxonomy_type in filter_types.items():
        cursor.execute(
            """
            SELECT id, name, code, color, display_order
            FROM dealflow.df_taxonomy_items
            WHERE type = %s
              AND is_active = TRUE
            ORDER BY display_order ASC NULLS LAST, name ASC
            """,
            [taxonomy_type],
        )
        filters_data[key] = dictfetchall(cursor)

    cursor.execute(
        """
        SELECT id, name
        FROM dealflow.df_funds
        ORDER BY name ASC
        """
    )
    filters_data["funds"] = dictfetchall(cursor)
    return filters_data


def fetch_dashboard_base_rows(cursor, filters):
    clauses = [
        "d.deleted_at IS NULL",
        "(c.deleted_at IS NULL OR c.id IS NULL)",
    ]
    params = []

    status_id = normalize_uuid(filters.get("status_id"))
    stage_id = normalize_uuid(filters.get("stage_id"))
    fund_id = normalize_uuid(filters.get("fund_id"))

    if status_id:
        clauses.append("d.status_id = %s")
        params.append(status_id)
    if stage_id:
        clauses.append("d.stage_id = %s")
        params.append(stage_id)
    if fund_id:
        clauses.append("d.fund_id = %s")
        params.append(fund_id)

    where_sql = " AND ".join(clauses)

    cursor.execute(
        f"""
        SELECT
            d.id AS deal_id,
            d.ticket_amount,
            d.deal_date,
            d.created_at,
            d.fund_id,
            f.name AS fund_name,
            d.status_id,
            st.name AS status_name,
            st.code AS status_code,
            st.color AS status_color,
            d.stage_id,
            sg.name AS stage_name,
            sg.code AS stage_code,
            sg.color AS stage_color,
            sg.display_order AS stage_display_order,
            d.currency_id,
            cur.name AS currency_name,
            cur.color AS currency_color,
            d.deal_type_id,
            dt.name AS deal_type_name,
            dt.color AS deal_type_color,
            c.sector_id,
            sec.name AS sector_name,
            sec.color AS sector_color,
            COALESCE(c.country_of_main_operation_id, c.country_of_incorporation_id) AS country_id,
            co.name AS country_name,
            co.color AS country_color
        FROM dealflow.df_deals d
        LEFT JOIN dealflow.df_companies c
            ON c.id = d.company_id
        LEFT JOIN dealflow.df_funds f
            ON f.id = d.fund_id
        LEFT JOIN dealflow.df_taxonomy_items st
            ON st.id = d.status_id
        LEFT JOIN dealflow.df_taxonomy_items sg
            ON sg.id = d.stage_id
        LEFT JOIN dealflow.df_taxonomy_items cur
            ON cur.id = d.currency_id
        LEFT JOIN dealflow.df_taxonomy_items dt
            ON dt.id = d.deal_type_id
        LEFT JOIN dealflow.df_taxonomy_items sec
            ON sec.id = c.sector_id
        LEFT JOIN dealflow.df_taxonomy_items co
            ON co.id = COALESCE(c.country_of_main_operation_id, c.country_of_incorporation_id)
        WHERE {where_sql}
        ORDER BY COALESCE(d.deal_date, d.created_at) ASC NULLS LAST, d.created_at ASC
        """,
        params,
    )
    return dictfetchall(cursor)


def pick_dashboard_color(value, fallback_index, fallback_palette):
    if value:
        return value
    return fallback_palette[fallback_index % len(fallback_palette)]


def build_dashboard_group(rows, key_field, name_field, color_field=None, extra_fields=None):
    grouped = {}
    extra_fields = extra_fields or []

    for row in rows:
        key = row.get(key_field)
        if not key:
            continue
        if key not in grouped:
            grouped[key] = {
                "id": key,
                "name": row.get(name_field) or "Unknown",
                "value": 0,
                "total_ticket_amount": 0.0,
            }
            if color_field:
                grouped[key]["color"] = row.get(color_field)
            for field in extra_fields:
                grouped[key][field] = row.get(field)
        grouped[key]["value"] += 1
        grouped[key]["total_ticket_amount"] += float(row.get("ticket_amount") or 0)

    return list(grouped.values())


def build_dashboard_payload(rows, filters_data):
    total_ticket_values = [float(row.get("ticket_amount")) for row in rows if row.get("ticket_amount") is not None]
    live_deals = sum(1 for row in rows if str(row.get("status_code") or "").upper() == "LIVE")
    invested_deals = sum(
        1
        for row in rows
        if str(row.get("status_code") or "").upper() == "INVESTED"
        or str(row.get("stage_code") or "").upper() == "SIGNED"
    )
    dropped_deals = sum(
        1
        for row in rows
        if str(row.get("status_code") or "").upper() == "DROPPED"
        or str(row.get("stage_code") or "").upper() == "DROPPED"
    )

    sector_data = build_dashboard_group(rows, "sector_id", "sector_name", "sector_color")
    country_data = build_dashboard_group(rows, "country_id", "country_name", "country_color")
    currency_data = build_dashboard_group(rows, "currency_id", "currency_name", "currency_color")
    stage_data = build_dashboard_group(rows, "stage_id", "stage_name", "stage_color", ["stage_display_order"])
    stage_data.sort(
        key=lambda item: (
            item.get("stage_display_order") if item.get("stage_display_order") is not None else 10**9,
            item.get("name") or "",
        )
    )

    for index, item in enumerate(sector_data):
        item["color"] = pick_dashboard_color(item.get("color"), index, DASHBOARD_DONUT_COLORS)
    for index, item in enumerate(country_data):
        item["color"] = pick_dashboard_color(item.get("color"), index, DASHBOARD_DONUT_COLORS)
    for index, item in enumerate(currency_data):
        item["color"] = pick_dashboard_color(item.get("color"), index, DASHBOARD_DONUT_COLORS)
    for index, item in enumerate(stage_data):
        item["color"] = pick_dashboard_color(item.get("color"), index, DASHBOARD_DONUT_COLORS)

    monthly = defaultdict(lambda: defaultdict(int))
    month_order = []
    fund_names = []
    for row in rows:
        date_value = row.get("deal_date") or row.get("created_at")
        if not date_value:
            continue
        if hasattr(date_value, "strftime"):
            month_key = date_value.strftime("%b")
            month_sort = date_value.strftime("%Y-%m")
        else:
            parsed = datetime.fromisoformat(str(date_value).replace("Z", "+00:00"))
            month_key = parsed.strftime("%b")
            month_sort = parsed.strftime("%Y-%m")
        fund_name = row.get("fund_name") or "Unassigned"
        monthly[(month_sort, month_key)][fund_name] += 1
        if fund_name not in fund_names:
            fund_names.append(fund_name)
        if (month_sort, month_key) not in month_order:
            month_order.append((month_sort, month_key))

    top_funds = fund_names[:3]
    bar_data = []
    bar_totals = {fund_name: 0 for fund_name in top_funds}
    for month_sort, month_label in sorted(month_order):
        row_data = {"month": month_label}
        for fund_name in top_funds:
            value = monthly[(month_sort, month_label)].get(fund_name, 0)
            row_data[fund_name] = value
            bar_totals[fund_name] += value
        bar_data.append(row_data)

    fund_series = [
        {
            "key": fund_name,
            "name": fund_name,
            "color": DASHBOARD_SERIES_COLORS[index % len(DASHBOARD_SERIES_COLORS)],
            "total": bar_totals.get(fund_name, 0),
        }
        for index, fund_name in enumerate(top_funds)
    ]

    return {
        "filtersData": filters_data,
        "summary": {
            "totalDeals": len(rows),
            "totalTicketAmount": sum(total_ticket_values),
            "liveDeals": live_deals,
            "investedDeals": invested_deals,
            "droppedDeals": dropped_deals,
            "averageTicket": (sum(total_ticket_values) / len(total_ticket_values)) if total_ticket_values else 0,
        },
        "bySector": sector_data,
        "byCountry": country_data,
        "byCurrency": currency_data,
        "byStage": stage_data,
        "byMonth": bar_data,
        "barTotals": bar_totals,
        "fundSeries": fund_series,
    }


def normalize_numeric_or_none(value):
    if value in ("", None):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def serialize_cap_table_snapshot(row):
    return {
        "id": row.get("snapshot_id"),
        "deal_id": row.get("deal_id"),
        "company_id": row.get("company_id"),
        "name": row.get("name") or "",
        "snapshot_date": row.get("snapshot_date"),
        "created_by": row.get("created_by"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "entries": row.get("entries") or [],
    }


def serialize_cap_table_entry(row):
    def numeric_value(key):
        value = row.get(key)
        return float(value) if value is not None else None

    return {
        "id": row.get("entry_id"),
        "snapshot_id": row.get("snapshot_id"),
        "shareholder_name": row.get("shareholder_name") or "",
        "comment": row.get("comment") or "",
        "series_a_shares": numeric_value("series_a_shares"),
        "series_b_shares": numeric_value("series_b_shares"),
        "common_shares": numeric_value("common_shares"),
        "preferred_shares": numeric_value("preferred_shares"),
        "seed_shares": numeric_value("seed_shares"),
        "esop_shares": numeric_value("esop_shares"),
        "non_fully_diluted_percentage": numeric_value("non_fully_diluted_percentage"),
        "fully_diluted_percentage": numeric_value("fully_diluted_percentage"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def fetch_cap_table_with_entries(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            s.id AS snapshot_id,
            s.deal_id,
            s.company_id,
            s.name,
            s.snapshot_date,
            s.created_by,
            s.created_at,
            s.updated_at
        FROM dealflow.df_cap_table_snapshots s
        WHERE s.deal_id = %s
        ORDER BY s.snapshot_date ASC NULLS LAST, s.created_at ASC
        """,
        [str(deal_id)],
    )
    snapshot_rows = dictfetchall(cursor)
    if not snapshot_rows:
        return []

    snapshot_ids = [str(row["snapshot_id"]) for row in snapshot_rows if row.get("snapshot_id")]
    cursor.execute(
        """
        SELECT
            e.id AS entry_id,
            e.snapshot_id,
            e.shareholder_name,
            e.comment,
            e.series_a_shares,
            e.series_b_shares,
            e.common_shares,
            e.preferred_shares,
            e.seed_shares,
            e.esop_shares,
            e.non_fully_diluted_percentage,
            e.fully_diluted_percentage,
            e.created_at,
            e.updated_at
        FROM dealflow.df_cap_table_entries e
        WHERE e.snapshot_id = ANY(%s::uuid[])
        ORDER BY e.created_at ASC NULLS LAST, e.shareholder_name ASC
        """,
        [snapshot_ids],
    )
    entry_rows = dictfetchall(cursor)
    entries_by_snapshot = {}
    for entry in entry_rows:
        snapshot_id = str(entry.get("snapshot_id"))
        entries_by_snapshot.setdefault(snapshot_id, []).append(serialize_cap_table_entry(entry))

    snapshots = []
    for row in snapshot_rows:
        row["entries"] = entries_by_snapshot.get(str(row.get("snapshot_id")), [])
        snapshots.append(serialize_cap_table_snapshot(row))
    return snapshots


def cap_table_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
    cursor.execute(
        """
        SELECT id
        FROM dealflow.df_cap_table_snapshots
        WHERE id = %s
          AND deal_id = %s
        LIMIT 1
        """,
        [str(snapshot_id), str(deal_id)],
    )
    return cursor.fetchone() is not None


def cap_table_entry_belongs_to_deal(cursor, deal_id, entry_id):
    cursor.execute(
        """
        SELECT e.id, e.snapshot_id
        FROM dealflow.df_cap_table_entries e
        INNER JOIN dealflow.df_cap_table_snapshots s
            ON s.id = e.snapshot_id
        WHERE e.id = %s
          AND s.deal_id = %s
        LIMIT 1
        """,
        [str(entry_id), str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "snapshot_id": str(row[1])}


def serialize_document_row(row):
    file_extension = (row.get("file_extension") or "").upper()
    return {
        "id": row.get("document_id"),
        "deal_id": row.get("deal_id"),
        "event_id": row.get("event_id"),
        "company_id": row.get("company_id"),
        "doc_type_id": row.get("doc_type_id"),
        "doc_type": {
            "id": row.get("doc_type_id"),
            "name": row.get("doc_type_name") or "",
            "color": row.get("doc_type_color"),
        } if row.get("doc_type_id") else None,
        "name": row.get("name") or "",
        "file_name": row.get("file_name") or "",
        "file_extension": file_extension,
        "file_mime_type": row.get("file_mime_type") or "",
        "file_size": row.get("file_size"),
        "file_url": row.get("file_url") or "",
        "document_date": row.get("document_date"),
        "uploaded_by": row.get("uploaded_by"),
        "uploaded_by_user": {
            "id": row.get("uploaded_by"),
            "name": row.get("uploaded_by_name") or "",
        } if row.get("uploaded_by") or row.get("uploaded_by_name") else None,
        "uploaded_at": row.get("uploaded_at"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "event": {
            "id": row.get("event_id"),
            "title": row.get("event_title") or "",
        } if row.get("event_id") else None,
    }


def fetch_deal_documents(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            d.id AS document_id,
            d.deal_id,
            d.event_id,
            d.company_id,
            d.doc_type_id,
            d.name,
            d.file_name,
            d.file_extension,
            d.file_mime_type,
            d.file_size,
            d.file_url,
            d.document_date,
            d.uploaded_by,
            d.uploaded_at,
            d.created_at,
            d.updated_at,
            dt.name AS doc_type_name,
            dt.color AS doc_type_color,
            u.name AS uploaded_by_name,
            e.title AS event_title
        FROM dealflow.df_documents d
        LEFT JOIN dealflow.df_taxonomy_items dt
            ON dt.id = d.doc_type_id
        LEFT JOIN dealflow.df_users u
            ON u.id = d.uploaded_by
        LEFT JOIN dealflow.df_events e
            ON e.id = d.event_id
        WHERE d.deal_id = %s
          AND d.deleted_at IS NULL
        ORDER BY d.document_date DESC NULLS LAST, d.uploaded_at DESC NULLS LAST, d.created_at DESC NULLS LAST
        """,
        [str(deal_id)],
    )
    return [serialize_document_row(row) for row in dictfetchall(cursor)]


def serialize_kpi_period(row):
    return {
        "id": row.get("period_id"),
        "deal_id": row.get("deal_id"),
        "company_id": row.get("company_id"),
        "name": row.get("name") or "",
        "start_date": row.get("start_date"),
        "end_date": row.get("end_date"),
        "currency_id": row.get("currency_id"),
        "currency": {
            "id": row.get("currency_id"),
            "name": row.get("currency_name") or "",
            "code": row.get("currency_code") or "",
        } if row.get("currency_id") else None,
        "display_order": row.get("display_order"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "entries": row.get("entries") or [],
    }


def serialize_kpi_entry(row):
    value = row.get("value")
    return {
        "id": row.get("entry_id"),
        "period_id": row.get("period_id"),
        "deal_id": row.get("deal_id"),
        "company_id": row.get("company_id"),
        "kpi_name": row.get("kpi_name") or "",
        "kpi_category_id": row.get("kpi_category_id"),
        "kpi_category": {
            "id": row.get("kpi_category_id"),
            "name": row.get("kpi_category_name") or "",
            "color": row.get("kpi_category_color"),
        } if row.get("kpi_category_id") else None,
        "value": float(value) if value is not None else None,
        "unit": row.get("unit") or "",
        "display_order": row.get("display_order"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def fetch_kpis_with_entries(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            p.id AS period_id,
            p.deal_id,
            p.company_id,
            p.name,
            p.start_date,
            p.end_date,
            p.currency_id,
            p.display_order,
            p.created_at,
            p.updated_at,
            cur.name AS currency_name,
            cur.code AS currency_code
        FROM dealflow.df_kpi_periods p
        LEFT JOIN dealflow.df_taxonomy_items cur
            ON cur.id = p.currency_id
        WHERE p.deal_id = %s
        ORDER BY p.display_order ASC NULLS LAST, p.start_date ASC NULLS LAST, p.created_at ASC
        """,
        [str(deal_id)],
    )
    period_rows = dictfetchall(cursor)
    if not period_rows:
        return []

    period_ids = [str(row["period_id"]) for row in period_rows if row.get("period_id")]
    cursor.execute(
        """
        SELECT
            e.id AS entry_id,
            e.period_id,
            e.deal_id,
            e.company_id,
            e.kpi_name,
            e.kpi_category_id,
            e.value,
            e.unit,
            e.display_order,
            e.created_at,
            e.updated_at,
            kc.name AS kpi_category_name,
            kc.color AS kpi_category_color
        FROM dealflow.df_kpi_entries e
        LEFT JOIN dealflow.df_taxonomy_items kc
            ON kc.id = e.kpi_category_id
        WHERE e.period_id = ANY(%s::uuid[])
          AND e.deal_id = %s
        ORDER BY e.display_order ASC NULLS LAST, e.created_at ASC NULLS LAST, e.kpi_name ASC
        """,
        [period_ids, str(deal_id)],
    )
    entry_rows = dictfetchall(cursor)
    entries_by_period = {}
    for entry in entry_rows:
      period_id = str(entry.get("period_id"))
      entries_by_period.setdefault(period_id, []).append(serialize_kpi_entry(entry))

    periods = []
    for row in period_rows:
        row["entries"] = entries_by_period.get(str(row.get("period_id")), [])
        periods.append(serialize_kpi_period(row))
    return periods


def kpi_period_belongs_to_deal(cursor, deal_id, period_id):
    cursor.execute(
        """
        SELECT id
        FROM dealflow.df_kpi_periods
        WHERE id = %s
          AND deal_id = %s
        LIMIT 1
        """,
        [str(period_id), str(deal_id)],
    )
    return cursor.fetchone() is not None


def kpi_entry_belongs_to_deal(cursor, deal_id, entry_id):
    cursor.execute(
        """
        SELECT e.id, e.period_id
        FROM dealflow.df_kpi_entries e
        WHERE e.id = %s
          AND e.deal_id = %s
        LIMIT 1
        """,
        [str(entry_id), str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "period_id": str(row[1])}


def serialize_board_snapshot(row):
    return {
        "id": row.get("snapshot_id"),
        "deal_id": row.get("deal_id"),
        "company_id": row.get("company_id"),
        "name": row.get("name") or "",
        "snapshot_date": row.get("snapshot_date"),
        "created_by": row.get("created_by"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "members": row.get("members") or [],
    }


def serialize_board_member(row):
    seats = row.get("number_of_seats")
    return {
        "id": row.get("member_id"),
        "board_snapshot_id": row.get("board_snapshot_id"),
        "name": row.get("name") or "",
        "number_of_seats": int(seats) if seats is not None else None,
        "date_in": row.get("date_in"),
        "date_out": row.get("date_out"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def fetch_board_with_members(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            s.id AS snapshot_id,
            s.deal_id,
            s.company_id,
            s.name,
            s.snapshot_date,
            s.created_by,
            s.created_at,
            s.updated_at
        FROM dealflow.df_board_snapshots s
        WHERE s.deal_id = %s
        ORDER BY s.snapshot_date ASC NULLS LAST, s.created_at ASC
        """,
        [str(deal_id)],
    )
    snapshot_rows = dictfetchall(cursor)
    if not snapshot_rows:
        return []

    snapshot_ids = [str(row["snapshot_id"]) for row in snapshot_rows if row.get("snapshot_id")]
    cursor.execute(
        """
        SELECT
            m.id AS member_id,
            m.board_snapshot_id,
            m.name,
            m.number_of_seats,
            m.date_in,
            m.date_out,
            m.created_at,
            m.updated_at
        FROM dealflow.df_board_members m
        WHERE m.board_snapshot_id = ANY(%s::uuid[])
        ORDER BY m.date_in ASC NULLS LAST, m.created_at ASC NULLS LAST, m.name ASC
        """,
        [snapshot_ids],
    )
    member_rows = dictfetchall(cursor)
    members_by_snapshot = {}
    for member in member_rows:
        snapshot_id = str(member.get("board_snapshot_id"))
        members_by_snapshot.setdefault(snapshot_id, []).append(serialize_board_member(member))

    snapshots = []
    for row in snapshot_rows:
        row["members"] = members_by_snapshot.get(str(row.get("snapshot_id")), [])
        snapshots.append(serialize_board_snapshot(row))
    return snapshots


def board_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
    cursor.execute(
        """
        SELECT id
        FROM dealflow.df_board_snapshots
        WHERE id = %s
          AND deal_id = %s
        LIMIT 1
        """,
        [str(snapshot_id), str(deal_id)],
    )
    return cursor.fetchone() is not None


def board_member_belongs_to_deal(cursor, deal_id, member_id):
    cursor.execute(
        """
        SELECT m.id, m.board_snapshot_id
        FROM dealflow.df_board_members m
        INNER JOIN dealflow.df_board_snapshots s
            ON s.id = m.board_snapshot_id
        WHERE m.id = %s
          AND s.deal_id = %s
        LIMIT 1
        """,
        [str(member_id), str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "board_snapshot_id": str(row[1])}


def fetch_deal_detail(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            d.id AS deal_id,
            d.name AS deal_name,
            d.code AS deal_code,
            d.company_id,
            d.fund_id,
            d.stage_id,
            d.status_id,
            d.source_type_id,
            d.contact_id,
            d.ticket_amount,
            d.currency_id,
            d.deal_date,
            d.sourcing_relevant_information,
            d.exit_type_id,
            d.exit_relevant_information,
            d.created_by,
            d.created_at,
            d.updated_at,

            c.name AS company_name,
            c.code AS company_code,
            c.sector_id,
            c.business_activity,
            c.website,
            c.registration_number,
            c.sponsor,
            c.legal_form_id,
            c.country_of_incorporation_id,
            c.country_of_main_operation_id,
            c.address,
            c.zip_code,
            c.city,
            c.address_country_id,

            ct.name AS contact_name,

            f.name AS fund_name,

            st.name AS stage_name,
            st.color AS stage_color,
            ss.name AS status_name,
            ss.color AS status_color,
            src.name AS source_type_name,
            src.color AS source_type_color,
            cur.name AS currency_name,
            cur.code AS currency_code,
            ex.name AS exit_type_name,
            ex.color AS exit_type_color,

            sec.name AS sector_name,
            sec.color AS sector_color,
            lf.name AS legal_form_name,

            coi.name AS country_of_incorporation_name,
            coi.code AS country_of_incorporation_code,
            cmo.name AS country_of_main_operation_name,
            cmo.code AS country_of_main_operation_code,
            ac.name AS address_country_name,
            ac.code AS address_country_code

        FROM dealflow.df_deals d
        LEFT JOIN dealflow.df_companies c
            ON c.id = d.company_id
        LEFT JOIN dealflow.df_contacts ct
            ON ct.id = d.contact_id
        LEFT JOIN dealflow.df_funds f
            ON f.id = d.fund_id
        LEFT JOIN dealflow.df_taxonomy_items st
            ON st.id = d.stage_id
        LEFT JOIN dealflow.df_taxonomy_items ss
            ON ss.id = d.status_id
        LEFT JOIN dealflow.df_taxonomy_items src
            ON src.id = d.source_type_id
        LEFT JOIN dealflow.df_taxonomy_items cur
            ON cur.id = d.currency_id
        LEFT JOIN dealflow.df_taxonomy_items ex
            ON ex.id = d.exit_type_id
        LEFT JOIN dealflow.df_taxonomy_items sec
            ON sec.id = c.sector_id
        LEFT JOIN dealflow.df_taxonomy_items lf
            ON lf.id = c.legal_form_id
        LEFT JOIN dealflow.df_taxonomy_items coi
            ON coi.id = c.country_of_incorporation_id
        LEFT JOIN dealflow.df_taxonomy_items cmo
            ON cmo.id = c.country_of_main_operation_id
        LEFT JOIN dealflow.df_taxonomy_items ac
            ON ac.id = c.address_country_id
        WHERE d.id = %s
          AND d.deleted_at IS NULL
          AND (c.deleted_at IS NULL OR c.id IS NULL)
        LIMIT 1
        """,
        [str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    data = dict(zip([col[0] for col in cursor.description], row))
    data["team_members"] = fetch_deal_team_members(cursor, deal_id)
    return data


class DealflowDealListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        keyword = normalize_keyword_query(request.GET.get("keyword"))

        with connection.cursor() as cursor:
            rows = fetch_deal_list_rows(cursor, keyword=keyword)

            if keyword:
                existing_ids = {str(row.get("deal_id")) for row in rows if row.get("deal_id")}
                pdf_match_ids = fetch_pdf_keyword_match_ids(cursor, keyword)
                missing_pdf_match_ids = [deal_id for deal_id in pdf_match_ids if deal_id not in existing_ids]
                if missing_pdf_match_ids:
                    rows.extend(fetch_deal_list_rows(cursor, deal_ids=missing_pdf_match_ids))
            stage_log_map = fetch_stage_log_map(cursor, [row.get("deal_id") for row in rows])
            for row in rows:
                row["stage_log"] = stage_log_map.get(str(row.get("deal_id")), [])

        return Response([serialize_deal_row(row) for row in rows], status=status.HTTP_200_OK)

    def post(self, request):
        company_name = str(request.data.get("company_name") or "").strip()
        code_name = str(request.data.get("code_name") or "").strip()

        if not company_name:
            return Response({"error": "Company name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not code_name:
            return Response({"error": "Code name is required."}, status=status.HTTP_400_BAD_REQUEST)

        created_by = resolve_dealflow_user_id(getattr(request.user, "email", None))
        now = timezone.now()
        company_id = uuid4()
        deal_id = uuid4()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    default_deal_type_id = resolve_default_taxonomy_id(
                        cursor, "deal_type", preferred_codes=("investment",), preferred_names=("investment",)
                    )
                    default_stage_id = resolve_default_taxonomy_id(
                        cursor, "stage", preferred_codes=("briefing", "sourcing"), preferred_names=("briefing", "sourcing")
                    )
                    default_status_id = resolve_default_taxonomy_id(
                        cursor, "status", preferred_codes=("live",), preferred_names=("live",)
                    )

                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_companies (
                            id,
                            name,
                            code,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        [str(company_id), company_name, code_name, now, now],
                    )

                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_deals (
                            id,
                            name,
                            code,
                            company_id,
                            deal_type_id,
                            stage_id,
                            status_id,
                            created_by,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(deal_id),
                            company_name,
                            code_name,
                            str(company_id),
                            default_deal_type_id,
                            default_stage_id,
                            default_status_id,
                            created_by,
                            now,
                            now,
                        ],
                    )

                    cursor.execute(
                        """
                        SELECT
                            d.id AS deal_id,
                            d.name AS deal_name,
                            d.code AS deal_code,
                            d.company_id,
                            d.fund_id,
                            d.stage_id,
                            d.status_id,
                            d.currency_id,
                            d.ticket_amount,
                            d.created_by,
                            d.created_at,
                            d.updated_at,

                            c.name AS company_name,
                            c.code AS company_code,
                            c.sector_id,
                            c.country_of_main_operation_id,
                            c.country_of_incorporation_id,

                            f.name AS fund_name,

                            st.name AS stage_name,
                            st.color AS stage_color,

                            ss.name AS status_name,
                            ss.color AS status_color,

                            cur.name AS currency_name,
                            cur.code AS currency_code,

                            sec.name AS sector_name,
                            sec.color AS sector_color,

                            geo.id AS country_id,
                            geo.name AS country_name,
                            geo.code AS country_code

                        FROM dealflow.df_deals d
                        LEFT JOIN dealflow.df_companies c
                            ON c.id = d.company_id
                        LEFT JOIN dealflow.df_funds f
                            ON f.id = d.fund_id
                        LEFT JOIN dealflow.df_taxonomy_items st
                            ON st.id = d.stage_id
                        LEFT JOIN dealflow.df_taxonomy_items ss
                            ON ss.id = d.status_id
                        LEFT JOIN dealflow.df_taxonomy_items cur
                            ON cur.id = d.currency_id
                        LEFT JOIN dealflow.df_taxonomy_items sec
                            ON sec.id = c.sector_id
                        LEFT JOIN dealflow.df_taxonomy_items geo
                            ON geo.id = COALESCE(
                                c.country_of_main_operation_id,
                                c.country_of_incorporation_id,
                                c.address_country_id
                            )
                        WHERE d.id = %s
                        LIMIT 1
                        """,
                        [str(deal_id)],
                    )
                    row = cursor.fetchone()
                    if not row:
                        raise IntegrityError("Deal creation succeeded but no row was returned.")
                    created_row = dict(zip([col[0] for col in cursor.description], row))

        except IntegrityError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(serialize_deal_row(created_row), status=status.HTTP_201_CREATED)


class DealflowTaxonomyListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        taxonomy_type = str(request.GET.get("type") or "").strip()

        with connection.cursor() as cursor:
            if taxonomy_type:
                cursor.execute(
                    """
                    SELECT id, type, name, code, display_order, color, is_active
                    FROM dealflow.df_taxonomy_items
                    WHERE type = %s
                      AND is_active = TRUE
                    ORDER BY display_order ASC NULLS LAST, name ASC
                    """,
                    [taxonomy_type],
                )
            else:
                cursor.execute(
                    """
                    SELECT id, type, name, code, display_order, color, is_active
                    FROM dealflow.df_taxonomy_items
                    WHERE is_active = TRUE
                    ORDER BY type ASC, display_order ASC NULLS LAST, name ASC
                    """
                )
            rows = dictfetchall(cursor)

        return Response(rows, status=status.HTTP_200_OK)


class DealflowFundListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, currency_id, fund_size, description, created_at, updated_at
                FROM dealflow.df_funds
                ORDER BY name ASC
                """
            )
            rows = dictfetchall(cursor)
        return Response(rows, status=status.HTTP_200_OK)


class DealflowUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, email, role, is_active, created_at, updated_at
                FROM dealflow.df_users
                WHERE is_active = TRUE
                ORDER BY name ASC, email ASC
                """
            )
            rows = dictfetchall(cursor)
        return Response(rows, status=status.HTTP_200_OK)

    def post(self, request):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        email = str(payload.get("email") or "").strip() or None
        role = str(payload.get("role") or "").strip() or "Member"

        if not name:
            return Response({"error": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not role:
            return Response({"error": "Role is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        user_id = uuid4()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if email:
                        cursor.execute(
                            """
                            SELECT id
                            FROM dealflow.df_users
                            WHERE lower(email) = lower(%s)
                            LIMIT 1
                            """,
                            [email],
                        )
                        if cursor.fetchone():
                            return Response(
                                {"error": "A user with this email already exists."},
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_users (
                            id,
                            name,
                            email,
                            role,
                            is_active,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, TRUE, %s, %s)
                        """,
                        [str(user_id), name, email, role, now, now],
                    )

                    cursor.execute(
                        """
                        SELECT id, name, email, role, is_active, created_at, updated_at
                        FROM dealflow.df_users
                        WHERE id = %s
                        LIMIT 1
                        """,
                        [str(user_id)],
                    )
                    row = cursor.fetchone()
                    created = dict(zip([col[0] for col in cursor.description], row)) if row else None
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowSetupItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, taxonomy_type):
        if not is_supported_setup_type(taxonomy_type):
            return Response({"error": "Unsupported setup type."}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    type,
                    name,
                    code,
                    display_order,
                    color,
                    is_active,
                    created_at,
                    updated_at
                FROM dealflow.df_taxonomy_items
                WHERE type = %s
                ORDER BY display_order ASC NULLS LAST, name ASC
                """,
                [taxonomy_type],
            )
            rows = dictfetchall(cursor)

        return Response(rows, status=status.HTTP_200_OK)

    def post(self, request, taxonomy_type):
        if not is_supported_setup_type(taxonomy_type):
            return Response({"error": "Unsupported setup type."}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        code = str(payload.get("code") or "").strip().upper()
        color = str(payload.get("color") or "").strip() or None
        is_active = bool(payload.get("is_active", True))
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not code:
            return Response({"error": "Code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            display_order = None

        item_id = uuid4()
        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id
                        FROM dealflow.df_taxonomy_items
                        WHERE type = %s
                          AND lower(code) = lower(%s)
                        LIMIT 1
                        """,
                        [taxonomy_type, code],
                    )
                    if cursor.fetchone():
                        return Response(
                            {"error": "An item with this code already exists in this tab."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_taxonomy_items (
                            id,
                            type,
                            name,
                            code,
                            display_order,
                            color,
                            is_active,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(item_id),
                            taxonomy_type,
                            name,
                            code,
                            display_order,
                            color,
                            is_active,
                            now,
                            now,
                        ],
                    )
                    cursor.execute(
                        """
                        SELECT
                            id,
                            type,
                            name,
                            code,
                            display_order,
                            color,
                            is_active,
                            created_at,
                            updated_at
                        FROM dealflow.df_taxonomy_items
                        WHERE id = %s
                          AND type = %s
                        LIMIT 1
                        """,
                        [str(item_id), taxonomy_type],
                    )
                    row = cursor.fetchone()
                    created = dict(zip([col[0] for col in cursor.description], row)) if row else None
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowSetupItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, taxonomy_type, item_id):
        if not is_supported_setup_type(taxonomy_type):
            return Response({"error": "Unsupported setup type."}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        code = str(payload.get("code") or "").strip().upper()
        color = str(payload.get("color") or "").strip() or None
        is_active = payload.get("is_active")
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not code:
            return Response({"error": "Code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            display_order = None

        if is_active in (None, ""):
            is_active = True
        else:
            is_active = bool(is_active)

        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id
                        FROM dealflow.df_taxonomy_items
                        WHERE type = %s
                          AND lower(code) = lower(%s)
                          AND id <> %s
                        LIMIT 1
                        """,
                        [taxonomy_type, code, str(item_id)],
                    )
                    if cursor.fetchone():
                        return Response(
                            {"error": "An item with this code already exists in this tab."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    cursor.execute(
                        """
                        UPDATE dealflow.df_taxonomy_items
                        SET
                            name = %s,
                            code = %s,
                            display_order = %s,
                            color = %s,
                            is_active = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND type = %s
                        """,
                        [name, code, display_order, color, is_active, now, str(item_id), taxonomy_type],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Setup item not found."}, status=status.HTTP_404_NOT_FOUND)

                    cursor.execute(
                        """
                        SELECT
                            id,
                            type,
                            name,
                            code,
                            display_order,
                            color,
                            is_active,
                            created_at,
                            updated_at
                        FROM dealflow.df_taxonomy_items
                        WHERE id = %s
                          AND type = %s
                        LIMIT 1
                        """,
                        [str(item_id), taxonomy_type],
                    )
                    row = cursor.fetchone()
                    updated = dict(zip([col[0] for col in cursor.description], row)) if row else None
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(updated or {}, status=status.HTTP_200_OK)


class DealflowDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = {
            "status_id": request.GET.get("status_id"),
            "stage_id": request.GET.get("stage_id"),
            "fund_id": request.GET.get("fund_id"),
        }

        try:
            with connection.cursor() as cursor:
                filters_data = fetch_dashboard_filter_options(cursor)
                rows = fetch_dashboard_base_rows(cursor, filters)
                payload = build_dashboard_payload(rows, filters_data)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(payload, status=status.HTTP_200_OK)


class DealflowDealDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            row = fetch_deal_detail(cursor, deal_id)
        if not row:
            return Response({"error": "Deal not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_deal_detail_row(row), status=status.HTTP_200_OK)

    def patch(self, request, deal_id):
        now = timezone.now()

        with connection.cursor() as cursor:
            current_row = fetch_deal_detail(cursor, deal_id)

        if not current_row:
            return Response({"error": "Deal not found."}, status=status.HTTP_404_NOT_FOUND)

        company_id = current_row.get("company_id")
        if not company_id:
            return Response({"error": "Linked company not found for this deal."}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data or {}

        deal_name = str(payload.get("deal_name") or "").strip()
        code_name = str(payload.get("code_name") or "").strip()

        if not deal_name:
            return Response({"error": "Deal name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not code_name:
            return Response({"error": "Code name is required."}, status=status.HTTP_400_BAD_REQUEST)

        def nullable_uuid(key):
            value = payload.get(key)
            if value in ("", None):
                return None
            return normalize_uuid(value)

        def nullable_string(key):
            value = payload.get(key)
            if value is None:
                return ""
            return str(value).strip()

        def nullable_numeric(key):
            value = payload.get(key)
            if value in ("", None):
                return None
            return value

        raw_team_members = payload.get("team_members")
        team_members = []
        if isinstance(raw_team_members, list):
            for index, member in enumerate(raw_team_members, start=1):
                if not isinstance(member, dict):
                    continue
                user_id = normalize_uuid(member.get("user_id"))
                role_id = normalize_uuid(member.get("role_id"))
                if not user_id or not role_id:
                    continue
                try:
                    position_order = int(member.get("position_order")) if member.get("position_order") not in ("", None) else index
                except (TypeError, ValueError):
                    position_order = index
                team_members.append(
                    {
                        "id": normalize_uuid(member.get("id")) or str(uuid4()),
                        "user_id": user_id,
                        "role_id": role_id,
                        "position_order": position_order,
                    }
                )

        contact_name = nullable_string("contact_name")
        current_contact_id = current_row.get("contact_id")
        next_contact_id = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if contact_name:
                        if current_contact_id:
                            cursor.execute(
                                """
                                UPDATE dealflow.df_contacts
                                SET
                                    company_id = %s,
                                    name = %s,
                                    updated_at = %s
                                WHERE id = %s
                                """,
                                [str(company_id), contact_name, now, str(current_contact_id)],
                            )
                            next_contact_id = current_contact_id
                        else:
                            next_contact_id = uuid4()
                            cursor.execute(
                                """
                                INSERT INTO dealflow.df_contacts (
                                    id,
                                    company_id,
                                    name,
                                    created_at,
                                    updated_at
                                )
                                VALUES (%s, %s, %s, %s, %s)
                                """,
                                [str(next_contact_id), str(company_id), contact_name, now, now],
                            )
                    else:
                        next_contact_id = None

                    cursor.execute(
                        """
                        UPDATE dealflow.df_companies
                        SET
                            name = %s,
                            code = %s,
                            sector_id = %s,
                            business_activity = %s,
                            website = %s,
                            registration_number = %s,
                            sponsor = %s,
                            legal_form_id = %s,
                            country_of_incorporation_id = %s,
                            country_of_main_operation_id = %s,
                            address = %s,
                            zip_code = %s,
                            city = %s,
                            address_country_id = %s,
                            updated_at = %s
                        WHERE id = %s
                        """,
                        [
                            deal_name,
                            code_name,
                            nullable_uuid("sector_id"),
                            nullable_string("business_description"),
                            nullable_string("website"),
                            nullable_string("registration_number"),
                            nullable_string("sponsors"),
                            nullable_uuid("legal_form_id"),
                            resolve_country_taxonomy_id(cursor, payload.get("country_of_incorporation_id")),
                            resolve_country_taxonomy_id(cursor, payload.get("country_of_main_operation_id")),
                            nullable_string("address"),
                            nullable_string("zip_code"),
                            nullable_string("city"),
                            resolve_country_taxonomy_id(cursor, payload.get("address_country_id")),
                            now,
                            str(company_id),
                        ],
                    )

                    cursor.execute(
                        """
                        UPDATE dealflow.df_deals
                        SET
                            name = %s,
                            code = %s,
                            fund_id = %s,
                            stage_id = %s,
                            status_id = %s,
                            source_type_id = %s,
                            contact_id = %s,
                            ticket_amount = %s,
                            currency_id = %s,
                            sourcing_relevant_information = %s,
                            exit_type_id = %s,
                            exit_relevant_information = %s,
                            updated_at = %s
                        WHERE id = %s
                        """,
                        [
                            deal_name,
                            code_name,
                            resolve_dealflow_fund_id(cursor, payload.get("fund_id")),
                            nullable_uuid("stage_id"),
                            nullable_uuid("status_id"),
                            nullable_uuid("source_type_id"),
                            str(next_contact_id) if next_contact_id else None,
                            nullable_numeric("ticket_amount"),
                            resolve_currency_taxonomy_id(cursor, payload.get("currency_id")),
                            nullable_string("sourcing_relevant_information"),
                            nullable_uuid("exit_type_id"),
                            nullable_string("exit_relevant_information"),
                            now,
                            str(deal_id),
                        ],
                    )

                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_deal_team_members
                        WHERE deal_id = %s
                        """,
                        [str(deal_id)],
                    )
                    for member in team_members:
                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_deal_team_members (
                                id,
                                deal_id,
                                user_id,
                                role_id,
                                position_order,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """,
                            [
                                member["id"],
                                str(deal_id),
                                member["user_id"],
                                member["role_id"],
                                member["position_order"],
                                now,
                                now,
                            ],
                        )

                    refreshed_row = fetch_deal_detail(cursor, deal_id)
                    if not refreshed_row:
                        raise IntegrityError("Deal updated but could not be reloaded.")

        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serialize_deal_detail_row(refreshed_row), status=status.HTTP_200_OK)

    def delete(self, request, deal_id):
        now = timezone.now()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_deals
                        SET
                            deleted_at = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deleted_at IS NULL
                        """,
                        [now, now, str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Deal not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowDealEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            events = fetch_deal_events(cursor, deal_id)
        return Response(events, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        title = str(payload.get("title") or "").strip()
        event_date = payload.get("event_date")
        description = str(payload.get("description") or "").strip()
        event_type_id = normalize_uuid(payload.get("event_type_id"))
        document_payload = payload.get("document") or {}

        if not title:
            return Response({"error": "Event title is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not event_date:
            return Response({"error": "Event date is required."}, status=status.HTTP_400_BAD_REQUEST)

        event_id = uuid4()
        created_by = resolve_dealflow_user_id(getattr(request.user, "email", None))
        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    company_id = fetch_deal_company_id(cursor, deal_id)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_events (
                            id,
                            deal_id,
                            title,
                            description,
                            event_date,
                            event_type_id,
                            created_by,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(event_id),
                            str(deal_id),
                            title,
                            description,
                            event_date,
                            event_type_id,
                            created_by,
                            now,
                            now,
                        ],
                    )

                    file_name = str(document_payload.get("file_name") or "").strip()
                    if file_name:
                        document_id = uuid4()
                        display_name = str(document_payload.get("name") or file_name).strip() or file_name
                        file_extension = str(document_payload.get("file_extension") or "").strip() or None
                        file_mime_type = str(document_payload.get("file_mime_type") or "").strip() or None
                        file_size = document_payload.get("file_size")
                        try:
                            file_size = int(file_size) if file_size not in ("", None) else None
                        except (TypeError, ValueError):
                            file_size = None

                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_documents (
                                id,
                                deal_id,
                                event_id,
                                company_id,
                                name,
                                file_name,
                                file_extension,
                                file_mime_type,
                                file_size,
                                file_url,
                                document_date,
                                uploaded_by,
                                uploaded_at,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            [
                                str(document_id),
                                str(deal_id),
                                str(event_id),
                                company_id,
                                display_name,
                                file_name,
                                file_extension,
                                file_mime_type,
                                file_size,
                                None,
                                event_date,
                                created_by,
                                now,
                                now,
                                now,
                            ],
                        )

                    events = fetch_deal_events(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((event for event in events if str(event.get("id")) == str(event_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowDealEventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, event_id):
        payload = request.data or {}
        title = str(payload.get("title") or "").strip()
        event_date = payload.get("event_date")
        description = str(payload.get("description") or "").strip()
        event_type_id = normalize_uuid(payload.get("event_type_id"))

        if not title:
            return Response({"error": "Event title is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not event_date:
            return Response({"error": "Event date is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_events
                        SET
                            title = %s,
                            description = %s,
                            event_date = %s,
                            event_type_id = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                          AND deleted_at IS NULL
                        """,
                        [
                            title,
                            description,
                            event_date,
                            event_type_id,
                            now,
                            str(event_id),
                            str(deal_id),
                        ],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
                    events = fetch_deal_events(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((event for event in events if str(event.get("id")) == str(event_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, event_id):
        now = timezone.now()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE dealflow.df_events
                    SET
                        deleted_at = %s,
                        updated_at = %s
                    WHERE id = %s
                      AND deal_id = %s
                      AND deleted_at IS NULL
                    """,
                    [now, now, str(event_id), str(deal_id)],
                )
                if cursor.rowcount == 0:
                    return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowDealStageLogView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, deal_id):
        payload = request.data or {}
        stage_id = normalize_uuid(payload.get("stage_id"))
        event_date = payload.get("event_date")

        if not stage_id:
            return Response({"error": "Stage is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not event_date:
            return Response({"error": "Effective date is required."}, status=status.HTTP_400_BAD_REQUEST)

        created_by = resolve_dealflow_user_id(getattr(request.user, "email", None))
        now = timezone.now()
        event_id = uuid4()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    current_deal = fetch_deal_detail(cursor, deal_id)
                    if not current_deal:
                        return Response({"error": "Deal not found."}, status=status.HTTP_404_NOT_FOUND)

                    cursor.execute(
                        """
                        SELECT id, name
                        FROM dealflow.df_taxonomy_items
                        WHERE id = %s
                          AND type = 'stage'
                          AND is_active = TRUE
                        LIMIT 1
                        """,
                        [stage_id],
                    )
                    stage_row = cursor.fetchone()
                    if not stage_row:
                        return Response({"error": "Stage not found."}, status=status.HTTP_400_BAD_REQUEST)

                    stage_name = stage_row[1]
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_events (
                            id,
                            deal_id,
                            title,
                            description,
                            event_date,
                            event_type_id,
                            created_by,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(event_id),
                            str(deal_id),
                            f"Stage changed to {stage_name}",
                            "",
                            event_date,
                            None,
                            created_by,
                            now,
                            now,
                        ],
                    )
                    sync_deal_stage_from_stage_log(cursor, deal_id, fallback_stage_id=stage_id)
                    events = fetch_deal_events(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((event for event in events if str(event.get("id")) == str(event_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowDealStageLogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, event_id):
        payload = request.data or {}
        stage_id = normalize_uuid(payload.get("stage_id"))
        event_date = payload.get("event_date")

        if not stage_id:
            return Response({"error": "Stage is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not event_date:
            return Response({"error": "Effective date is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id, name
                        FROM dealflow.df_taxonomy_items
                        WHERE id = %s
                          AND type = 'stage'
                          AND is_active = TRUE
                        LIMIT 1
                        """,
                        [stage_id],
                    )
                    stage_row = cursor.fetchone()
                    if not stage_row:
                        return Response({"error": "Stage not found."}, status=status.HTTP_400_BAD_REQUEST)

                    stage_name = stage_row[1]
                    cursor.execute(
                        """
                        UPDATE dealflow.df_events
                        SET
                            title = %s,
                            description = %s,
                            event_date = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                          AND deleted_at IS NULL
                          AND (
                              title LIKE 'Stage changed to %%'
                              OR title LIKE 'Stage updated to %%'
                          )
                        """,
                        [f"Stage changed to {stage_name}", "", event_date, now, str(event_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Stage log entry not found."}, status=status.HTTP_404_NOT_FOUND)

                    sync_deal_stage_from_stage_log(cursor, deal_id, fallback_stage_id=stage_id)
                    events = fetch_deal_events(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((event for event in events if str(event.get("id")) == str(event_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, event_id):
        now = timezone.now()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_events
                        SET
                            deleted_at = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                          AND deleted_at IS NULL
                          AND (
                              title LIKE 'Stage changed to %%'
                              OR title LIKE 'Stage updated to %%'
                          )
                        """,
                        [now, now, str(event_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Stage log entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    sync_deal_stage_from_stage_log(cursor, deal_id)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowCapTableView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        return Response(snapshots, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        snapshot_date = payload.get("snapshot_date")

        if not name:
            return Response({"error": "Snapshot name is required."}, status=status.HTTP_400_BAD_REQUEST)

        created_by = resolve_dealflow_user_id(getattr(request.user, "email", None))
        now = timezone.now()
        snapshot_id = uuid4()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    company_id = fetch_deal_company_id(cursor, deal_id)
                    if not company_id:
                        return Response({"error": "Company not found for this deal."}, status=status.HTTP_400_BAD_REQUEST)

                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_cap_table_snapshots (
                            id,
                            deal_id,
                            company_id,
                            name,
                            snapshot_date,
                            created_by,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(snapshot_id),
                            str(deal_id),
                            company_id,
                            name,
                            snapshot_date,
                            created_by,
                            now,
                            now,
                        ],
                    )
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((snapshot for snapshot in snapshots if str(snapshot.get("id")) == str(snapshot_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowCapTableSnapshotDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, snapshot_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        snapshot_date = payload.get("snapshot_date")

        if not name:
            return Response({"error": "Snapshot name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_cap_table_snapshots
                        SET
                            name = %s,
                            snapshot_date = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [name, snapshot_date, now, str(snapshot_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((snapshot for snapshot in snapshots if str(snapshot.get("id")) == str(snapshot_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, snapshot_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not cap_table_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
                        return Response({"error": "Snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_cap_table_entries
                        WHERE snapshot_id = %s
                        """,
                        [str(snapshot_id)],
                    )
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_cap_table_snapshots
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [str(snapshot_id), str(deal_id)],
                    )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowCapTableEntriesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, deal_id, snapshot_id):
        payload = request.data or {}
        shareholder_name = str(payload.get("shareholder_name") or "").strip()
        comment = str(payload.get("comment") or "").strip()

        if not shareholder_name:
            return Response({"error": "Shareholder name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        entry_id = uuid4()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not cap_table_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
                        return Response({"error": "Snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_cap_table_entries (
                            id,
                            snapshot_id,
                            shareholder_name,
                            comment,
                            series_a_shares,
                            series_b_shares,
                            common_shares,
                            preferred_shares,
                            seed_shares,
                            esop_shares,
                            non_fully_diluted_percentage,
                            fully_diluted_percentage,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(entry_id),
                            str(snapshot_id),
                            shareholder_name,
                            comment,
                            normalize_numeric_or_none(payload.get("series_a_shares")),
                            normalize_numeric_or_none(payload.get("series_b_shares")),
                            normalize_numeric_or_none(payload.get("common_shares")),
                            normalize_numeric_or_none(payload.get("preferred_shares")),
                            normalize_numeric_or_none(payload.get("seed_shares")),
                            normalize_numeric_or_none(payload.get("esop_shares")),
                            normalize_numeric_or_none(payload.get("non_fully_diluted_percentage")),
                            normalize_numeric_or_none(payload.get("fully_diluted_percentage")),
                            now,
                            now,
                        ],
                    )
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created_snapshot = next((snapshot for snapshot in snapshots if str(snapshot.get("id")) == str(snapshot_id)), None)
        created_entry = next((entry for entry in (created_snapshot or {}).get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
        return Response(created_entry or {}, status=status.HTTP_201_CREATED)


class DealflowCapTableEntryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, entry_id):
        payload = request.data or {}
        shareholder_name = str(payload.get("shareholder_name") or "").strip()
        comment = str(payload.get("comment") or "").strip()

        if not shareholder_name:
            return Response({"error": "Shareholder name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = cap_table_entry_belongs_to_deal(cursor, deal_id, entry_id)
                    if not relation:
                        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        UPDATE dealflow.df_cap_table_entries
                        SET
                            shareholder_name = %s,
                            comment = %s,
                            series_a_shares = %s,
                            series_b_shares = %s,
                            common_shares = %s,
                            preferred_shares = %s,
                            seed_shares = %s,
                            esop_shares = %s,
                            non_fully_diluted_percentage = %s,
                            fully_diluted_percentage = %s,
                            updated_at = %s
                        WHERE id = %s
                        """,
                        [
                            shareholder_name,
                            comment,
                            normalize_numeric_or_none(payload.get("series_a_shares")),
                            normalize_numeric_or_none(payload.get("series_b_shares")),
                            normalize_numeric_or_none(payload.get("common_shares")),
                            normalize_numeric_or_none(payload.get("preferred_shares")),
                            normalize_numeric_or_none(payload.get("seed_shares")),
                            normalize_numeric_or_none(payload.get("esop_shares")),
                            normalize_numeric_or_none(payload.get("non_fully_diluted_percentage")),
                            normalize_numeric_or_none(payload.get("fully_diluted_percentage")),
                            now,
                            str(entry_id),
                        ],
                    )
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated_entry = None
        for snapshot in snapshots:
            updated_entry = next((entry for entry in snapshot.get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
            if updated_entry:
                break
        return Response(updated_entry or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, entry_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = cap_table_entry_belongs_to_deal(cursor, deal_id, entry_id)
                    if not relation:
                        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_cap_table_entries
                        WHERE id = %s
                        """,
                        [str(entry_id)],
                    )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowDealDocumentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            documents = fetch_deal_documents(cursor, deal_id)
        return Response(documents, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        file_name = str(payload.get("file_name") or "").strip()
        file_url = str(payload.get("file_url") or "").strip() or None
        doc_type_id = normalize_uuid(payload.get("doc_type_id"))
        event_id = normalize_uuid(payload.get("event_id"))
        document_date = payload.get("document_date")

        if not name:
            return Response({"error": "Document name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not file_name:
            return Response({"error": "A file is required."}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_by = resolve_dealflow_user_id(getattr(request.user, "email", None))
        now = timezone.now()
        document_id = uuid4()

        file_extension = str(payload.get("file_extension") or "").strip() or None
        file_mime_type = str(payload.get("file_mime_type") or "").strip() or None
        file_size = payload.get("file_size")
        try:
            file_size = int(file_size) if file_size not in ("", None) else None
        except (TypeError, ValueError):
            file_size = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    company_id = fetch_deal_company_id(cursor, deal_id)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_documents (
                            id,
                            deal_id,
                            event_id,
                            company_id,
                            doc_type_id,
                            name,
                            file_name,
                            file_extension,
                            file_mime_type,
                            file_size,
                            file_url,
                            document_date,
                            uploaded_by,
                            uploaded_at,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(document_id),
                            str(deal_id),
                            event_id,
                            company_id,
                            doc_type_id,
                            name,
                            file_name,
                            file_extension,
                            file_mime_type,
                            file_size,
                            file_url,
                            document_date,
                            uploaded_by,
                            now,
                            now,
                            now,
                        ],
                    )
                    documents = fetch_deal_documents(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((document for document in documents if str(document.get("id")) == str(document_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowDealDocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, document_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        doc_type_id = normalize_uuid(payload.get("doc_type_id"))
        document_date = payload.get("document_date")

        if not name:
            return Response({"error": "Document name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_documents
                        SET
                            name = %s,
                            doc_type_id = %s,
                            document_date = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                          AND deleted_at IS NULL
                        """,
                        [name, doc_type_id, document_date, now, str(document_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
                    documents = fetch_deal_documents(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((document for document in documents if str(document.get("id")) == str(document_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, document_id):
        now = timezone.now()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE dealflow.df_documents
                    SET
                        deleted_at = %s,
                        updated_at = %s
                    WHERE id = %s
                      AND deal_id = %s
                      AND deleted_at IS NULL
                    """,
                    [now, now, str(document_id), str(deal_id)],
                )
                if cursor.rowcount == 0:
                    return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowKpisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            periods = fetch_kpis_with_entries(cursor, deal_id)
        return Response(periods, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        start_date = payload.get("start_date")
        end_date = payload.get("end_date")
        currency_id = normalize_uuid(payload.get("currency_id"))
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "KPI period name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        period_id = uuid4()

        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            display_order = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    company_id = fetch_deal_company_id(cursor, deal_id)
                    if not company_id:
                        return Response({"error": "Company not found for this deal."}, status=status.HTTP_400_BAD_REQUEST)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_kpi_periods (
                            id,
                            deal_id,
                            company_id,
                            name,
                            start_date,
                            end_date,
                            currency_id,
                            display_order,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(period_id),
                            str(deal_id),
                            company_id,
                            name,
                            start_date,
                            end_date,
                            currency_id,
                            display_order,
                            now,
                            now,
                        ],
                    )
                    periods = fetch_kpis_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((period for period in periods if str(period.get("id")) == str(period_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowKpiPeriodDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, period_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        start_date = payload.get("start_date")
        end_date = payload.get("end_date")
        currency_id = normalize_uuid(payload.get("currency_id"))
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "KPI period name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            display_order = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_kpi_periods
                        SET
                            name = %s,
                            start_date = %s,
                            end_date = %s,
                            currency_id = %s,
                            display_order = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [name, start_date, end_date, currency_id, display_order, now, str(period_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "KPI period not found."}, status=status.HTTP_404_NOT_FOUND)
                    periods = fetch_kpis_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((period for period in periods if str(period.get("id")) == str(period_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, period_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not kpi_period_belongs_to_deal(cursor, deal_id, period_id):
                        return Response({"error": "KPI period not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_kpi_entries
                        WHERE period_id = %s
                        """,
                        [str(period_id)],
                    )
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_kpi_periods
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [str(period_id), str(deal_id)],
                    )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowKpiEntriesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, deal_id, period_id):
        payload = request.data or {}
        kpi_name = str(payload.get("kpi_name") or "").strip()
        kpi_category_id = normalize_uuid(payload.get("kpi_category_id"))
        value = normalize_numeric_or_none(payload.get("value"))
        unit = str(payload.get("unit") or "").strip()
        display_order = payload.get("display_order")

        if not kpi_name:
            return Response({"error": "KPI name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        entry_id = uuid4()
        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            display_order = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not kpi_period_belongs_to_deal(cursor, deal_id, period_id):
                        return Response({"error": "KPI period not found."}, status=status.HTTP_404_NOT_FOUND)
                    company_id = fetch_deal_company_id(cursor, deal_id)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_kpi_entries (
                            id,
                            deal_id,
                            company_id,
                            period_id,
                            kpi_name,
                            kpi_category_id,
                            value,
                            unit,
                            display_order,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(entry_id),
                            str(deal_id),
                            company_id,
                            str(period_id),
                            kpi_name,
                            kpi_category_id,
                            value,
                            unit,
                            display_order,
                            now,
                            now,
                        ],
                    )
                    periods = fetch_kpis_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created_entry = None
        for period in periods:
            created_entry = next((entry for entry in period.get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
            if created_entry:
                break
        return Response(created_entry or {}, status=status.HTTP_201_CREATED)


class DealflowKpiEntryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, entry_id):
        payload = request.data or {}
        kpi_name = str(payload.get("kpi_name") or "").strip()
        kpi_category_id = normalize_uuid(payload.get("kpi_category_id"))
        value = normalize_numeric_or_none(payload.get("value"))
        unit = str(payload.get("unit") or "").strip()
        display_order = payload.get("display_order")

        if not kpi_name:
            return Response({"error": "KPI name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            display_order = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = kpi_entry_belongs_to_deal(cursor, deal_id, entry_id)
                    if not relation:
                        return Response({"error": "KPI entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        UPDATE dealflow.df_kpi_entries
                        SET
                            kpi_name = %s,
                            kpi_category_id = %s,
                            value = %s,
                            unit = %s,
                            display_order = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [kpi_name, kpi_category_id, value, unit, display_order, now, str(entry_id), str(deal_id)],
                    )
                    periods = fetch_kpis_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated_entry = None
        for period in periods:
            updated_entry = next((entry for entry in period.get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
            if updated_entry:
                break
        return Response(updated_entry or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, entry_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = kpi_entry_belongs_to_deal(cursor, deal_id, entry_id)
                    if not relation:
                        return Response({"error": "KPI entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_kpi_entries
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [str(entry_id), str(deal_id)],
                    )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowBoardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            snapshots = fetch_board_with_members(cursor, deal_id)
        return Response(snapshots, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        snapshot_date = payload.get("snapshot_date")

        if not name:
            return Response({"error": "Board snapshot name is required."}, status=status.HTTP_400_BAD_REQUEST)

        created_by = resolve_dealflow_user_id(getattr(request.user, "email", None))
        now = timezone.now()
        snapshot_id = uuid4()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    company_id = fetch_deal_company_id(cursor, deal_id)
                    if not company_id:
                        return Response({"error": "Company not found for this deal."}, status=status.HTTP_400_BAD_REQUEST)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_board_snapshots (
                            id,
                            deal_id,
                            company_id,
                            name,
                            snapshot_date,
                            created_by,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(snapshot_id),
                            str(deal_id),
                            company_id,
                            name,
                            snapshot_date,
                            created_by,
                            now,
                            now,
                        ],
                    )
                    snapshots = fetch_board_with_members(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((snapshot for snapshot in snapshots if str(snapshot.get("id")) == str(snapshot_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowBoardSnapshotDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, snapshot_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        snapshot_date = payload.get("snapshot_date")

        if not name:
            return Response({"error": "Board snapshot name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_board_snapshots
                        SET
                            name = %s,
                            snapshot_date = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [name, snapshot_date, now, str(snapshot_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Board snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    snapshots = fetch_board_with_members(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((snapshot for snapshot in snapshots if str(snapshot.get("id")) == str(snapshot_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, snapshot_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not board_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
                        return Response({"error": "Board snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_board_members
                        WHERE board_snapshot_id = %s
                        """,
                        [str(snapshot_id)],
                    )
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_board_snapshots
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [str(snapshot_id), str(deal_id)],
                    )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowBoardMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, deal_id, snapshot_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        number_of_seats = payload.get("number_of_seats")
        date_in = payload.get("date_in")
        date_out = payload.get("date_out")

        if not name:
            return Response({"error": "Board member name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        member_id = uuid4()

        try:
            number_of_seats = int(number_of_seats) if number_of_seats not in ("", None) else None
        except (TypeError, ValueError):
            number_of_seats = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not board_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
                        return Response({"error": "Board snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_board_members (
                            id,
                            board_snapshot_id,
                            name,
                            number_of_seats,
                            date_in,
                            date_out,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(member_id),
                            str(snapshot_id),
                            name,
                            number_of_seats,
                            date_in,
                            date_out,
                            now,
                            now,
                        ],
                    )
                    snapshots = fetch_board_with_members(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created_member = None
        for snapshot in snapshots:
            created_member = next((member for member in snapshot.get("members", []) if str(member.get("id")) == str(member_id)), None)
            if created_member:
                break
        return Response(created_member or {}, status=status.HTTP_201_CREATED)


class DealflowBoardMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, member_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        number_of_seats = payload.get("number_of_seats")
        date_in = payload.get("date_in")
        date_out = payload.get("date_out")

        if not name:
            return Response({"error": "Board member name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            number_of_seats = int(number_of_seats) if number_of_seats not in ("", None) else None
        except (TypeError, ValueError):
            number_of_seats = None

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = board_member_belongs_to_deal(cursor, deal_id, member_id)
                    if not relation:
                        return Response({"error": "Board member not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        UPDATE dealflow.df_board_members
                        SET
                            name = %s,
                            number_of_seats = %s,
                            date_in = %s,
                            date_out = %s,
                            updated_at = %s
                        WHERE id = %s
                        """,
                        [name, number_of_seats, date_in, date_out, now, str(member_id)],
                    )
                    snapshots = fetch_board_with_members(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated_member = None
        for snapshot in snapshots:
            updated_member = next((member for member in snapshot.get("members", []) if str(member.get("id")) == str(member_id)), None)
            if updated_member:
                break
        return Response(updated_member or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, member_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = board_member_belongs_to_deal(cursor, deal_id, member_id)
                    if not relation:
                        return Response({"error": "Board member not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_board_members
                        WHERE id = %s
                        """,
                        [str(member_id)],
                    )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)
