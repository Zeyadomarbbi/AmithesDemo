import json
import os
from uuid import UUID, uuid4
from collections import defaultdict
from datetime import datetime
from functools import lru_cache
from pathlib import Path
import re
from urllib.parse import urlparse

from django.conf import settings
from django.db import IntegrityError, connection, transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from psycopg2.extras import Json
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


SETUP_ALLOWED_TYPES = {
    "status",
    "stage",
    "source_type",
    "doc_type",
    "sector",
    "team_role",
    "operation_type",
    "co_investor_type",
    "investment_instrument",
    "deal_type",
    "exit_route",
    "exit_counterparty",
    "exit_horizon",
    "esg_risk",
    "legal_form",
}


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


@lru_cache(maxsize=1)
def get_deal_stage_log_columns():
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'dealflow'
              AND table_name = 'df_deal_stage_logs'
            """
        )
        return {row[0] for row in cursor.fetchall()}


@lru_cache(maxsize=1)
def get_deal_event_columns():
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'dealflow'
              AND table_name = 'df_events'
            """
        )
        return {row[0] for row in cursor.fetchall()}


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
        cursor.execute(
            """
            SELECT id
            FROM dealflow.df_taxonomy_items
            WHERE id = %s
              AND type = 'currency'
            LIMIT 1
            """,
            [as_uuid],
        )
        if cursor.fetchone():
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
        cursor.execute(
            """
            SELECT id
            FROM dealflow.df_taxonomy_items
            WHERE id = %s
              AND type = 'country'
            LIMIT 1
            """,
            [as_uuid],
        )
        if cursor.fetchone():
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
        cursor.execute(
            """
            SELECT id
            FROM dealflow.df_funds
            WHERE id = %s
            LIMIT 1
            """,
            [as_uuid],
        )
        if cursor.fetchone():
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
    cash_in_amount = row.get("cash_in_amount")
    cash_out_amount = row.get("cash_out_amount")
    co_investor_ticket_amount = row.get("co_investor_ticket_amount")
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
        "operation_type_id": row.get("operation_type_id"),
        "contact_id": row.get("contact_id"),
        "ticket_amount": float(ticket_amount) if ticket_amount is not None else None,
        "currency_id": row.get("currency_id"),
        "deal_date": row.get("deal_date"),
        "pipeline_entry_date": row.get("pipeline_entry_date"),
        "status_reason": row.get("status_reason") or "",
        "countries_of_operations": row.get("countries_of_operations") or "",
        "operation_countries": row.get("operation_countries") or [],
        "value_creation_potential": row.get("value_creation_potential") or "",
        "sourcing_relevant_information": row.get("sourcing_relevant_information") or "",
        "cash_in_amount": float(cash_in_amount) if cash_in_amount is not None else None,
        "cash_out_amount": float(cash_out_amount) if cash_out_amount is not None else None,
        "investment_instrument_other_text": row.get("investment_instrument_other_text") or "",
        "co_investor": row.get("co_investor"),
        "co_investor_type_id": row.get("co_investor_type_id"),
        "co_investor_ticket_amount": float(co_investor_ticket_amount) if co_investor_ticket_amount is not None else None,
        "exit_route_id": row.get("exit_route_id"),
        "exit_counterparty_id": row.get("exit_counterparty_id"),
        "exit_counterparty_other": row.get("exit_counterparty_other") or "",
        "exit_horizon_id": row.get("exit_horizon_id"),
        "two_x_challenge": row.get("two_x_challenge") or "",
        "esg_risk_id": row.get("esg_risk_id"),
        "esg_notes": row.get("esg_notes") or "",
        "additional_notes": row.get("additional_notes") or "",
        "emerging_market_thesis": row.get("emerging_market_thesis") or "",
        "deal_type_id": row.get("deal_type_id"),
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
        "operation_type": {
            "id": row.get("operation_type_id"),
            "name": row.get("operation_type_name") or "",
            "color": row.get("operation_type_color"),
        } if row.get("operation_type_id") else None,
        "currency": {
            "id": row.get("currency_id"),
            "name": row.get("currency_name") or "",
            "code": row.get("currency_code") or "",
        } if row.get("currency_id") else None,
        "deal_type": {
            "id": row.get("deal_type_id"),
            "name": row.get("deal_type_name") or "",
            "color": row.get("deal_type_color"),
        } if row.get("deal_type_id") else None,
        "co_investor_type": {
            "id": row.get("co_investor_type_id"),
            "name": row.get("co_investor_type_name") or "",
            "color": row.get("co_investor_type_color"),
        } if row.get("co_investor_type_id") else None,
        "exit_route": {
            "id": row.get("exit_route_id"),
            "name": row.get("exit_route_name") or "",
            "color": row.get("exit_route_color"),
        } if row.get("exit_route_id") else None,
        "exit_counterparty": {
            "id": row.get("exit_counterparty_id"),
            "name": row.get("exit_counterparty_name") or "",
            "color": row.get("exit_counterparty_color"),
        } if row.get("exit_counterparty_id") else None,
        "exit_horizon": {
            "id": row.get("exit_horizon_id"),
            "name": row.get("exit_horizon_name") or "",
            "color": row.get("exit_horizon_color"),
        } if row.get("exit_horizon_id") else None,
        "esg_risk": {
            "id": row.get("esg_risk_id"),
            "name": row.get("esg_risk_name") or "",
            "color": row.get("esg_risk_color"),
        } if row.get("esg_risk_id") else None,
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
        "updated_by": {
            "id": row.get("updated_by"),
            "name": row.get("updated_by_name") or "",
        } if row.get("updated_by") or row.get("updated_by_name") else None,
        "updated_at": row.get("updated_at"),
        "investment_instruments": row.get("investment_instruments") or [],
        "team_members": row.get("team_members") or [],
        "external_contacts": row.get("external_contacts") or [],
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


def serialize_deal_external_contact_row(row):
    return {
        "id": row.get("id"),
        "deal_id": row.get("deal_id"),
        "name": row.get("name") or "",
        "role": row.get("role") or "",
        "email": row.get("email") or "",
        "phone": row.get("phone") or "",
        "notes": row.get("notes") or "",
        "display_order": row.get("display_order"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def fetch_deal_external_contacts(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            id,
            deal_id,
            name,
            role,
            email,
            phone,
            notes,
            display_order,
            created_at,
            updated_at
        FROM dealflow.df_deal_external_contacts
        WHERE deal_id = %s
        ORDER BY display_order ASC NULLS LAST, name ASC
        """,
        [str(deal_id)],
    )
    return [serialize_deal_external_contact_row(row) for row in dictfetchall(cursor)]


def serialize_event_row(row):
    return {
        "id": row.get("event_id"),
        "deal_id": row.get("deal_id"),
        "title": row.get("title") or "",
        "description": row.get("description") or "",
        "event_date": row.get("event_date"),
        "effective_date": row.get("effective_date") or row.get("event_date"),
        "source_type": row.get("source_type") or "MANUAL",
        "stage_log_id": row.get("stage_log_id"),
        "stage_id": row.get("stage_id"),
        "stage": {
            "id": row.get("stage_id"),
            "name": row.get("stage_name") or "",
            "color": row.get("stage_color"),
        } if row.get("stage_id") else None,
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


def build_stage_change_event_description(old_stage_name, new_stage_name):
    previous = str(old_stage_name or "").strip()
    current = str(new_stage_name or "").strip()
    if previous and current:
        return f"Stage changed from {previous} to {current}"
    if current:
        return f"Stage changed to {current}"
    return "Stage changed"


def fetch_stage_name_by_id(cursor, stage_id):
    normalized_stage_id = normalize_uuid(stage_id)
    if not normalized_stage_id:
        return ""

    cursor.execute(
        """
        SELECT name
        FROM dealflow.df_taxonomy_items
        WHERE id = %s
          AND type = 'stage'
        LIMIT 1
        """,
        [normalized_stage_id],
    )
    row = cursor.fetchone()
    return (row[0] or "") if row else ""


def fetch_deal_stage_id(cursor, deal_id):
    cursor.execute(
        """
        SELECT stage_id
        FROM dealflow.df_deals
        WHERE id = %s
          AND deleted_at IS NULL
        LIMIT 1
        """,
        [str(deal_id)],
    )
    row = cursor.fetchone()
    return str(row[0]) if row and row[0] else None


def create_stage_log_record(cursor, deal_id, stage_id, event_date, changed_by=None, note="", old_stage_id=None):
    current_stage_id = old_stage_id if old_stage_id is not None else fetch_deal_stage_id(cursor, deal_id)
    now = timezone.now()
    log_id = uuid4()
    stage_log_columns = get_deal_stage_log_columns()
    supports_updated_at = "updated_at" in stage_log_columns
    supports_note = "note" in stage_log_columns

    insert_columns = [
        "id",
        "deal_id",
        "old_stage_id",
        "new_stage_id",
        "changed_by",
        "changed_at",
        "created_at",
    ]
    insert_values = [
        str(log_id),
        str(deal_id),
        current_stage_id,
        stage_id,
        changed_by,
        event_date,
        now,
    ]
    if supports_updated_at:
        insert_columns.append("updated_at")
        insert_values.append(now)
    if supports_note:
        insert_columns.append("note")
        insert_values.append(str(note or "").strip())

    cursor.execute(
        f"""
        INSERT INTO dealflow.df_deal_stage_logs ({", ".join(insert_columns)})
        VALUES ({", ".join(["%s"] * len(insert_values))})
        """,
        insert_values,
    )
    sync_deal_stage_from_stage_log(cursor, deal_id, fallback_stage_id=stage_id)
    return str(log_id)


def sync_stage_log_event(cursor, deal_id, stage_log_id):
    event_columns = get_deal_event_columns()
    if not event_columns:
        return None

    cursor.execute(
        """
        SELECT
            log.id,
            log.deal_id,
            log.old_stage_id,
            old_stage.name AS old_stage_name,
            log.new_stage_id,
            new_stage.name AS new_stage_name,
            log.changed_by,
            log.changed_at
        FROM dealflow.df_deal_stage_logs log
        LEFT JOIN dealflow.df_taxonomy_items old_stage
            ON old_stage.id = log.old_stage_id
        LEFT JOIN dealflow.df_taxonomy_items new_stage
            ON new_stage.id = log.new_stage_id
        WHERE log.id = %s
          AND log.deal_id = %s
        LIMIT 1
        """,
        [str(stage_log_id), str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None

    changed_at = row[7]
    description = build_stage_change_event_description(row[3], row[5])
    title = "Stage Changed"
    now = timezone.now()
    existing_event_id = None

    if "stage_log_id" in event_columns:
        cursor.execute(
            """
            SELECT id
            FROM dealflow.df_events
            WHERE deal_id = %s
              AND stage_log_id = %s
              AND deleted_at IS NULL
            ORDER BY created_at DESC NULLS LAST
            LIMIT 1
            """,
            [str(deal_id), str(stage_log_id)],
        )
        existing = cursor.fetchone()
        existing_event_id = str(existing[0]) if existing and existing[0] else None

    if existing_event_id:
        set_clauses = [
            "title = %s",
            "description = %s",
            "event_date = %s",
            "updated_at = %s",
        ]
        params = [title, description, changed_at, now]
        if "effective_date" in event_columns:
            set_clauses.append("effective_date = %s")
            params.append(changed_at)
        if "source_type" in event_columns:
            set_clauses.append("source_type = %s")
            params.append("STAGE_LOG")
        if "stage_id" in event_columns:
            set_clauses.append("stage_id = %s")
            params.append(str(row[4]) if row[4] else None)
        if "created_by" in event_columns:
            set_clauses.append("created_by = %s")
            params.append(str(row[6]) if row[6] else None)
        cursor.execute(
            f"""
            UPDATE dealflow.df_events
            SET {", ".join(set_clauses)}
            WHERE id = %s
            """,
            [*params, existing_event_id],
        )
        return existing_event_id

    event_id = str(uuid4())
    insert_columns = ["id", "deal_id", "title", "description", "event_date", "created_at", "updated_at"]
    insert_values = [event_id, str(deal_id), title, description, changed_at, now, now]
    if "effective_date" in event_columns:
        insert_columns.append("effective_date")
        insert_values.append(changed_at)
    if "source_type" in event_columns:
        insert_columns.append("source_type")
        insert_values.append("STAGE_LOG")
    if "stage_log_id" in event_columns:
        insert_columns.append("stage_log_id")
        insert_values.append(str(stage_log_id))
    if "stage_id" in event_columns:
        insert_columns.append("stage_id")
        insert_values.append(str(row[4]) if row[4] else None)
    if "created_by" in event_columns:
        insert_columns.append("created_by")
        insert_values.append(str(row[6]) if row[6] else None)

    cursor.execute(
        f"""
        INSERT INTO dealflow.df_events ({", ".join(insert_columns)})
        VALUES ({", ".join(["%s"] * len(insert_values))})
        """,
        insert_values,
    )
    return event_id


def parse_boolean_query(value, default=False):
    if value is None:
        return default
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    return default


def parse_calendar_datetime_value(value):
    if value in (None, ""):
        return None

    parsed = parse_datetime(str(value).strip())
    if parsed is None:
        return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def normalize_calendar_attendees(value):
    if value in (None, ""):
        return []

    if isinstance(value, str):
        raw_items = re.split(r"[\n,;]+", value)
    elif isinstance(value, (list, tuple)):
        raw_items = value
    else:
        raw_items = [value]

    attendees = []
    for item in raw_items:
        normalized = str(item or "").strip()
        if normalized:
            attendees.append(normalized)
    return attendees


def fetch_deal_brief(cursor, deal_id):
    cursor.execute(
        """
        SELECT id, name, code
        FROM dealflow.df_deals
        WHERE id = %s
          AND deleted_at IS NULL
        LIMIT 1
        """,
        [str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "name": row[1] or "",
        "code": row[2] or "",
    }


def serialize_calendar_event_row(row):
    attendees = row.get("attendees")
    if isinstance(attendees, str):
        try:
            attendees = json.loads(attendees)
        except Exception:
            attendees = [attendees] if attendees.strip() else []
    elif attendees is None:
        attendees = []

    return {
        "id": row.get("id"),
        "provider": row.get("provider") or "",
        "external_event_id": row.get("external_event_id") or "",
        "subject": row.get("subject") or "",
        "body_preview": row.get("body_preview") or "",
        "start_datetime": row.get("start_datetime"),
        "end_datetime": row.get("end_datetime"),
        "timezone": row.get("timezone") or "",
        "location": row.get("location") or "",
        "meeting_link": row.get("meeting_link") or "",
        "organizer_name": row.get("organizer_name") or "",
        "organizer_email": row.get("organizer_email") or "",
        "attendees": attendees if isinstance(attendees, list) else [],
        "status": row.get("status") or "",
        "is_cancelled": bool(row.get("is_cancelled")),
        "deal_id": row.get("deal_id"),
        "deal": {
            "id": row.get("deal_id"),
            "name": row.get("deal_name") or "",
        } if row.get("deal_id") else None,
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def fetch_calendar_events(cursor, start_dt=None, end_dt=None, deal_id=None, provider=None, include_cancelled=False):
    where_clauses = ["1 = 1"]
    params = []

    if not include_cancelled:
        where_clauses.append("COALESCE(e.is_cancelled, FALSE) = FALSE")
    if deal_id:
        where_clauses.append("e.deal_id = %s")
        params.append(str(deal_id))
    if provider:
        where_clauses.append("UPPER(COALESCE(e.provider, '')) = UPPER(%s)")
        params.append(str(provider).strip())
    if start_dt and end_dt:
        where_clauses.append(
            """
            COALESCE(e.end_datetime, e.start_datetime) >= %s
            AND e.start_datetime <= %s
            """
        )
        params.extend([start_dt, end_dt])
    elif start_dt:
        where_clauses.append("COALESCE(e.end_datetime, e.start_datetime) >= %s")
        params.append(start_dt)
    elif end_dt:
        where_clauses.append("e.start_datetime <= %s")
        params.append(end_dt)

    where_sql = "\n          AND ".join(where_clauses)
    cursor.execute(
        f"""
        SELECT
            e.id,
            e.connection_id,
            e.provider,
            e.external_event_id,
            e.subject,
            e.body_preview,
            e.start_datetime,
            e.end_datetime,
            e.timezone,
            e.location,
            e.meeting_link,
            e.organizer_name,
            e.organizer_email,
            e.attendees,
            e.status,
            e.is_cancelled,
            e.deal_id,
            e.created_at,
            e.updated_at,
            d.name AS deal_name
        FROM dealflow.df_calendar_events e
        LEFT JOIN dealflow.df_deals d
            ON d.id = e.deal_id
           AND d.deleted_at IS NULL
        WHERE {where_sql}
        ORDER BY e.start_datetime ASC NULLS LAST, e.created_at ASC NULLS LAST
        """,
        params,
    )
    return [serialize_calendar_event_row(row) for row in dictfetchall(cursor)]


def fetch_calendar_event(cursor, event_id):
    cursor.execute(
        """
        SELECT
            e.id,
            e.connection_id,
            e.provider,
            e.external_event_id,
            e.subject,
            e.body_preview,
            e.start_datetime,
            e.end_datetime,
            e.timezone,
            e.location,
            e.meeting_link,
            e.organizer_name,
            e.organizer_email,
            e.attendees,
            e.status,
            e.is_cancelled,
            e.deal_id,
            e.created_at,
            e.updated_at,
            d.name AS deal_name
        FROM dealflow.df_calendar_events e
        LEFT JOIN dealflow.df_deals d
            ON d.id = e.deal_id
           AND d.deleted_at IS NULL
        WHERE e.id = %s
        LIMIT 1
        """,
        [str(event_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    columns = [col[0] for col in cursor.description]
    return serialize_calendar_event_row(dict(zip(columns, row)))


@lru_cache(maxsize=1)
def get_calendar_connection_columns():
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'dealflow'
              AND table_name = 'df_calendar_connections'
            """
        )
        return {row[0] for row in cursor.fetchall()}


def microsoft_calendar_is_configured():
    required_keys = [
        "MICROSOFT_TENANT_ID",
        "MICROSOFT_CLIENT_ID",
        "MICROSOFT_CLIENT_SECRET",
        "MICROSOFT_REDIRECT_URI",
    ]
    return all(str(os.getenv(key) or "").strip() for key in required_keys)


def fetch_active_microsoft_calendar_connection(cursor):
    columns = get_calendar_connection_columns()
    if "provider" not in columns:
        return None

    where_clauses = ["UPPER(COALESCE(provider, '')) = 'MICROSOFT'"]
    if "deleted_at" in columns:
        where_clauses.append("deleted_at IS NULL")
    if "is_active" in columns:
        where_clauses.append("is_active = TRUE")
    elif "connected" in columns:
        where_clauses.append("connected = TRUE")
    elif "status" in columns:
        where_clauses.append("LOWER(COALESCE(status, '')) IN ('active', 'connected')")

    cursor.execute(
        f"""
        SELECT id
        FROM dealflow.df_calendar_connections
        WHERE {' AND '.join(where_clauses)}
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 1
        """
    )
    row = cursor.fetchone()
    return str(row[0]) if row else None


def format_stage_log_display_date(value):
    if not value:
        return ""
    if hasattr(value, "strftime"):
        return value.strftime("%b %d, %Y, %I:%M %p")
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.strftime("%b %d, %Y, %I:%M %p")
    except Exception:
        return str(value)


def serialize_stage_log_row(row):
    display_source = row.get("changed_at") or row.get("created_at")
    return {
        "id": row.get("id"),
        "deal_id": row.get("deal_id"),
        "old_stage": {
            "id": row.get("old_stage_id"),
            "name": row.get("old_stage_name") or "",
            "color": row.get("old_stage_color"),
        } if row.get("old_stage_id") else None,
        "new_stage": {
            "id": row.get("new_stage_id"),
            "name": row.get("new_stage_name") or "",
            "color": row.get("new_stage_color"),
        } if row.get("new_stage_id") else None,
        "changed_by": {
            "id": row.get("changed_by"),
            "name": row.get("changed_by_name") or "",
        } if row.get("changed_by") or row.get("changed_by_name") else None,
        "changed_at": row.get("changed_at"),
        "created_at": row.get("created_at"),
        "note": row.get("note") or "",
        "display_date": format_stage_log_display_date(display_source),
    }


def fetch_deal_stage_logs(cursor, deal_id):
    stage_log_columns = get_deal_stage_log_columns()
    deleted_filter = "AND log.deleted_at IS NULL" if "deleted_at" in stage_log_columns else ""
    cursor.execute(
        f"""
        SELECT
            log.id,
            log.deal_id,
            log.old_stage_id,
            old_stage.name AS old_stage_name,
            old_stage.color AS old_stage_color,
            log.new_stage_id,
            new_stage.name AS new_stage_name,
            new_stage.color AS new_stage_color,
            log.changed_by,
            u.name AS changed_by_name,
            log.changed_at,
            log.created_at,
            log.note
        FROM dealflow.df_deal_stage_logs log
        LEFT JOIN dealflow.df_taxonomy_items old_stage
            ON old_stage.id = log.old_stage_id
        LEFT JOIN dealflow.df_taxonomy_items new_stage
            ON new_stage.id = log.new_stage_id
        LEFT JOIN dealflow.df_users u
            ON u.id = log.changed_by
        WHERE log.deal_id = %s
          {deleted_filter}
        ORDER BY COALESCE(log.changed_at, log.created_at) ASC, log.created_at ASC
        """,
        [str(deal_id)],
    )
    return [serialize_stage_log_row(row) for row in dictfetchall(cursor)]


def fetch_stage_log_map(cursor, deal_ids):
    normalized_deal_ids = [normalize_uuid(value) for value in (deal_ids or [])]
    normalized_deal_ids = [value for value in normalized_deal_ids if value]
    if not normalized_deal_ids:
        return {}

    stage_log_columns = get_deal_stage_log_columns()
    deleted_filter = "AND log.deleted_at IS NULL" if "deleted_at" in stage_log_columns else ""
    cursor.execute(
        f"""
        SELECT
            log.id,
            log.deal_id,
            log.old_stage_id,
            old_stage.name AS old_stage_name,
            old_stage.color AS old_stage_color,
            log.new_stage_id,
            new_stage.name AS new_stage_name,
            new_stage.color AS new_stage_color,
            log.changed_by,
            u.name AS changed_by_name,
            log.changed_at,
            log.created_at,
            log.note
        FROM dealflow.df_deal_stage_logs log
        LEFT JOIN dealflow.df_taxonomy_items old_stage
            ON old_stage.id = log.old_stage_id
        LEFT JOIN dealflow.df_taxonomy_items new_stage
            ON new_stage.id = log.new_stage_id
        LEFT JOIN dealflow.df_users u
            ON u.id = log.changed_by
        WHERE log.deal_id = ANY(%s::uuid[])
          {deleted_filter}
        ORDER BY COALESCE(log.changed_at, log.created_at) ASC, log.created_at ASC
        """,
        [normalized_deal_ids],
    )

    stage_log_map = defaultdict(list)
    for row in dictfetchall(cursor):
        deal_id = str(row.get("deal_id"))
        stage_log_map[deal_id].append(serialize_stage_log_row(row))
    return stage_log_map


def sync_deal_stage_from_stage_log(cursor, deal_id, fallback_stage_id=None):
    stage_log_columns = get_deal_stage_log_columns()
    deleted_filter = "AND deleted_at IS NULL" if "deleted_at" in stage_log_columns else ""
    cursor.execute(
        f"""
        SELECT
            new_stage_id
        FROM dealflow.df_deal_stage_logs
        WHERE deal_id = %s
          {deleted_filter}
        ORDER BY COALESCE(changed_at, created_at) DESC, created_at DESC
        LIMIT 1
        """,
        [str(deal_id)],
    )
    row = cursor.fetchone()

    next_stage_id = row[0] if row and row[0] else fallback_stage_id

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
    event_columns = get_deal_event_columns()
    effective_date_sql = "e.effective_date AS effective_date," if "effective_date" in event_columns else "e.event_date AS effective_date,"
    source_type_sql = "e.source_type AS source_type," if "source_type" in event_columns else "'MANUAL' AS source_type,"
    stage_log_id_sql = "e.stage_log_id AS stage_log_id," if "stage_log_id" in event_columns else "NULL AS stage_log_id,"
    stage_id_sql = "e.stage_id AS stage_id," if "stage_id" in event_columns else "NULL AS stage_id,"
    stage_name_sql = "st.name AS stage_name, st.color AS stage_color" if "stage_id" in event_columns else "NULL AS stage_name, NULL AS stage_color"
    stage_join_sql = "LEFT JOIN dealflow.df_taxonomy_items st ON st.id = e.stage_id" if "stage_id" in event_columns else ""
    cursor.execute(
        f"""
        SELECT
            e.id AS event_id,
            e.deal_id,
            e.title,
            e.description,
            e.event_date,
            {effective_date_sql}
            {source_type_sql}
            {stage_log_id_sql}
            {stage_id_sql}
            e.event_type_id,
            e.created_by,
            e.created_at,
            e.updated_at,
            et.name AS event_type_name,
            et.color AS event_type_color,
            u.name AS created_by_name,
            {stage_name_sql}
        FROM dealflow.df_events e
        LEFT JOIN dealflow.df_taxonomy_items et
            ON et.id = e.event_type_id
        LEFT JOIN dealflow.df_users u
            ON u.id = e.created_by
        {stage_join_sql}
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


def fetch_deal_investment_instruments(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            rel.id,
            rel.deal_id,
            rel.instrument_id,
            rel.created_at,
            t.name AS instrument_name,
            t.code AS instrument_code,
            t.color AS instrument_color
        FROM dealflow.df_deal_investment_instruments rel
        LEFT JOIN dealflow.df_taxonomy_items t
            ON t.id = rel.instrument_id
        WHERE rel.deal_id = %s
        ORDER BY t.display_order ASC NULLS LAST, t.name ASC
        """,
        [str(deal_id)],
    )
    return [
        {
            "id": row.get("instrument_id"),
            "instrument_id": row.get("instrument_id"),
            "name": row.get("instrument_name") or "",
            "code": row.get("instrument_code") or "",
            "color": row.get("instrument_color"),
        }
        for row in dictfetchall(cursor)
        if row.get("instrument_id")
    ]


def fetch_deal_operation_countries(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            rel.country_id,
            t.name AS country_name,
            t.code AS country_code
        FROM dealflow.df_deal_operation_countries rel
        LEFT JOIN dealflow.df_taxonomy_items t
            ON t.id = rel.country_id
        WHERE rel.deal_id = %s
        ORDER BY t.display_order ASC NULLS LAST, t.name ASC
        """,
        [str(deal_id)],
    )
    return [
        {
            "id": row.get("country_id"),
            "country_id": row.get("country_id"),
            "name": row.get("country_name") or "",
            "code": row.get("country_code") or "",
        }
        for row in dictfetchall(cursor)
        if row.get("country_id")
    ]


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


CAP_TABLE_DEFAULT_COLUMNS = [
    {"name": "Series A", "code": "SERIES_A", "column_type": "NUMBER", "is_percentage": False, "is_system": True, "display_order": 1},
    {"name": "Series B", "code": "SERIES_B", "column_type": "NUMBER", "is_percentage": False, "is_system": True, "display_order": 2},
    {"name": "Common", "code": "COMMON", "column_type": "NUMBER", "is_percentage": False, "is_system": True, "display_order": 3},
    {"name": "n.f.d (%)", "code": "NFD_PERCENTAGE", "column_type": "PERCENTAGE", "is_percentage": True, "is_system": True, "display_order": 4},
    {"name": "f.d (%)", "code": "FD_PERCENTAGE", "column_type": "PERCENTAGE", "is_percentage": True, "is_system": True, "display_order": 5},
    {"name": "Comment", "code": "COMMENT", "column_type": "TEXT", "is_percentage": False, "is_system": True, "display_order": 6},
]

LEGACY_CAP_TABLE_CODE_MAP = {
    "SERIES_A": ("series_a_shares", "NUMBER"),
    "SERIES_B": ("series_b_shares", "NUMBER"),
    "COMMON": ("common_shares", "NUMBER"),
    "PREFERRED": ("preferred_shares", "NUMBER"),
    "SEED": ("seed_shares", "NUMBER"),
    "ESOP": ("esop_shares", "NUMBER"),
    "NFD_PERCENTAGE": ("non_fully_diluted_percentage", "NUMBER"),
    "FD_PERCENTAGE": ("fully_diluted_percentage", "NUMBER"),
    "COMMENT": ("comment", "TEXT"),
}


def normalize_cap_table_column_type(value):
    normalized = str(value or "").strip().upper()
    return normalized if normalized in {"TEXT", "NUMBER", "PERCENTAGE"} else ""


def build_cap_table_column_code(name):
    normalized = str(name or "").strip().upper()
    normalized = re.sub(r"[^A-Z0-9]+", "_", normalized)
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized or "COLUMN"


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
        "columns": row.get("columns") or [],
        "entries": row.get("entries") or [],
        "totals": row.get("totals") or {},
    }


def serialize_cap_table_column(row):
    return {
        "id": row.get("column_id") or row.get("id"),
        "snapshot_id": row.get("snapshot_id"),
        "name": row.get("name") or "",
        "code": row.get("code") or "",
        "column_type": row.get("column_type") or "TEXT",
        "is_percentage": bool(row.get("is_percentage")),
        "is_system": bool(row.get("is_system")),
        "display_order": row.get("display_order"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def legacy_cap_table_value_for_column(entry_row, column):
    code = str(column.get("code") or "").strip().upper()
    mapping = LEGACY_CAP_TABLE_CODE_MAP.get(code)
    if not mapping:
        return None
    field_name, field_type = mapping
    value = entry_row.get(field_name)
    if value in ("", None):
        return None
    if field_type == "TEXT":
        return {"value_text": str(value), "value_number": None}
    try:
        return {"value_text": None, "value_number": float(value)}
    except (TypeError, ValueError):
        return {"value_text": None, "value_number": None}


def serialize_cap_table_entry(row, columns=None, values_by_column=None):
    normalized_values = {}
    for column in (columns or []):
        column_id = str(column.get("id"))
        current_value = (values_by_column or {}).get(column_id)
        if current_value is None:
            current_value = legacy_cap_table_value_for_column(row, column) or {"value_text": None, "value_number": None}
        normalized_values[column_id] = {
            "value_text": current_value.get("value_text"),
            "value_number": float(current_value.get("value_number")) if current_value.get("value_number") is not None else None,
        }

    return {
        "id": row.get("entry_id") or row.get("id"),
        "snapshot_id": row.get("snapshot_id"),
        "shareholder_name": row.get("shareholder_name") or "",
        "comment": row.get("comment") or "",
        "values": normalized_values,
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def build_cap_table_totals(columns, entries):
    totals = {}
    for column in columns:
        column_id = str(column.get("id"))
        if column.get("column_type") != "NUMBER":
            totals[column_id] = None
            continue
        total = 0.0
        has_value = False
        for entry in entries:
            value_number = ((entry.get("values") or {}).get(column_id) or {}).get("value_number")
            if value_number is None:
                continue
            has_value = True
            total += float(value_number)
        totals[column_id] = total if has_value else None
    return totals


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
        return {"snapshots": []}

    snapshot_ids = [str(row["snapshot_id"]) for row in snapshot_rows if row.get("snapshot_id")]
    cursor.execute(
        """
        SELECT
            c.id AS column_id,
            c.snapshot_id,
            c.name,
            c.code,
            c.column_type,
            c.is_percentage,
            c.is_system,
            c.display_order,
            c.created_at,
            c.updated_at
        FROM dealflow.df_cap_table_columns c
        WHERE c.snapshot_id = ANY(%s::uuid[])
        ORDER BY c.display_order ASC NULLS LAST, c.created_at ASC NULLS LAST
        """,
        [snapshot_ids],
    )
    column_rows = dictfetchall(cursor)
    columns_by_snapshot = defaultdict(list)
    for column in column_rows:
        columns_by_snapshot[str(column.get("snapshot_id"))].append(serialize_cap_table_column(column))

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
    entry_ids = [str(row["entry_id"]) for row in entry_rows if row.get("entry_id")]
    values_by_entry = defaultdict(dict)
    if entry_ids:
        cursor.execute(
            """
            SELECT
                v.id,
                v.entry_id,
                v.column_id,
                v.value_text,
                v.value_number,
                v.created_at,
                v.updated_at
            FROM dealflow.df_cap_table_entry_values v
            WHERE v.entry_id = ANY(%s::uuid[])
            """,
            [entry_ids],
        )
        for value_row in dictfetchall(cursor):
            values_by_entry[str(value_row.get("entry_id"))][str(value_row.get("column_id"))] = {
                "id": value_row.get("id"),
                "value_text": value_row.get("value_text"),
                "value_number": float(value_row.get("value_number")) if value_row.get("value_number") is not None else None,
            }

    entries_by_snapshot = defaultdict(list)
    for entry in entry_rows:
        snapshot_id = str(entry.get("snapshot_id"))
        snapshot_columns = columns_by_snapshot.get(snapshot_id, [])
        entries_by_snapshot[snapshot_id].append(
            serialize_cap_table_entry(entry, snapshot_columns, values_by_entry.get(str(entry.get("entry_id")), {}))
        )

    snapshots = []
    for row in snapshot_rows:
        snapshot_id = str(row.get("snapshot_id"))
        row["columns"] = columns_by_snapshot.get(snapshot_id, [])
        row["entries"] = entries_by_snapshot.get(snapshot_id, [])
        row["totals"] = build_cap_table_totals(row["columns"], row["entries"])
        snapshots.append(serialize_cap_table_snapshot(row))
    return {"snapshots": snapshots}


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


def cap_table_column_belongs_to_snapshot(cursor, deal_id, snapshot_id, column_id):
    cursor.execute(
        """
        SELECT c.id, c.is_system
        FROM dealflow.df_cap_table_columns c
        INNER JOIN dealflow.df_cap_table_snapshots s
            ON s.id = c.snapshot_id
        WHERE c.id = %s
          AND c.snapshot_id = %s
          AND s.deal_id = %s
        LIMIT 1
        """,
        [str(column_id), str(snapshot_id), str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "is_system": bool(row[1])}


def cap_table_entry_belongs_to_snapshot(cursor, deal_id, snapshot_id, entry_id):
    cursor.execute(
        """
        SELECT e.id
        FROM dealflow.df_cap_table_entries e
        INNER JOIN dealflow.df_cap_table_snapshots s
            ON s.id = e.snapshot_id
        WHERE e.id = %s
          AND e.snapshot_id = %s
          AND s.deal_id = %s
        LIMIT 1
        """,
        [str(entry_id), str(snapshot_id), str(deal_id)],
    )
    row = cursor.fetchone()
    return str(row[0]) if row else None


def create_default_cap_table_columns(cursor, snapshot_id, now):
    for column in CAP_TABLE_DEFAULT_COLUMNS:
        cursor.execute(
            """
            INSERT INTO dealflow.df_cap_table_columns (
                id,
                snapshot_id,
                name,
                code,
                column_type,
                is_percentage,
                is_system,
                display_order,
                created_at,
                updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                str(uuid4()),
                str(snapshot_id),
                column["name"],
                column["code"],
                column["column_type"],
                column["is_percentage"],
                column["is_system"],
                column["display_order"],
                now,
                now,
            ],
        )


def build_cap_table_values_payload(cursor, snapshot_id, payload):
    payload_values = payload.get("values") if isinstance(payload.get("values"), dict) else {}
    cursor.execute(
        """
        SELECT
            id,
            name,
            code,
            column_type,
            is_percentage
        FROM dealflow.df_cap_table_columns
        WHERE snapshot_id = %s
        ORDER BY display_order ASC NULLS LAST, created_at ASC NULLS LAST
        """,
        [str(snapshot_id)],
    )
    columns = [serialize_cap_table_column(row) for row in dictfetchall(cursor)]
    normalized = []
    for column in columns:
        column_id = str(column["id"])
        code = str(column.get("code") or "").strip().upper()
        raw_value = payload_values.get(column_id, payload_values.get(code))
        if raw_value is None and code in LEGACY_CAP_TABLE_CODE_MAP:
            legacy_field = LEGACY_CAP_TABLE_CODE_MAP[code][0]
            raw_value = payload.get(legacy_field)
        if raw_value == "" and column.get("column_type") in {"NUMBER", "PERCENTAGE"}:
            raw_value = None
        if column.get("column_type") == "TEXT":
            value_text = None if raw_value in (None, "") else str(raw_value)
            value_number = None
        else:
            value_text = None
            value_number = normalize_numeric_or_none(raw_value)
        normalized.append({
            "column": column,
            "value_text": value_text,
            "value_number": value_number,
        })
    return normalized


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


KPI_PERIOD_TYPES = {"QUARTERLY", "SEMI_ANNUALLY", "ANNUALLY"}
KPI_RAW_VALUE_KEYS = [
    "q1_value",
    "q2_value",
    "q3_value",
    "q4_value",
    "h1_value",
    "h2_value",
    "annual_y1_value",
    "annual_y2_value",
    "annual_y3_value",
    "annual_y4_value",
]


def normalize_kpi_period_type(value, fallback="QUARTERLY"):
    normalized = str(value or "").strip().upper()
    return normalized if normalized in KPI_PERIOD_TYPES else fallback


def serialize_kpi_period(row):
    return {
        "id": row.get("period_id") or row.get("id"),
        "deal_id": row.get("deal_id"),
        "company_id": row.get("company_id"),
        "name": row.get("name") or "",
        "year": row.get("year"),
        "currency_id": row.get("currency_id"),
        "currency": {
            "id": row.get("currency_id"),
            "name": row.get("currency_name") or "",
            "code": row.get("currency_code") or "",
        } if row.get("currency_id") else None,
        "display_order": row.get("display_order"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def build_kpi_raw_values(row):
    return {
        key: float(row.get(key)) if row.get(key) is not None else None
        for key in KPI_RAW_VALUE_KEYS
    }


def build_kpi_display_columns(period_year, display_period_type):
    normalized = normalize_kpi_period_type(display_period_type)
    if normalized == "SEMI_ANNUALLY":
        return [
            {"key": "h1_value", "label": "H1"},
            {"key": "h2_value", "label": "H2"},
        ]
    if normalized == "ANNUALLY":
        year = int(period_year or timezone.now().year)
        return [
            {"key": "annual_y1_value", "label": str(year - 3)},
            {"key": "annual_y2_value", "label": str(year - 2)},
            {"key": "annual_y3_value", "label": str(year - 1)},
            {"key": "annual_y4_value", "label": str(year)},
        ]
    return [
        {"key": "q1_value", "label": "Q1"},
        {"key": "q2_value", "label": "Q2"},
        {"key": "q3_value", "label": "Q3"},
        {"key": "q4_value", "label": "Q4"},
    ]


def build_kpi_display_values(row, display_period_type):
    period_type = normalize_kpi_period_type(row.get("period_type"))
    display_type = normalize_kpi_period_type(display_period_type)
    raw_values = build_kpi_raw_values(row)
    annual_tail_value = next(
        (
            raw_values[key]
            for key in ["annual_y4_value", "annual_y3_value", "annual_y2_value", "annual_y1_value"]
            if raw_values[key] is not None
        ),
        None,
    )

    if display_type == "QUARTERLY":
        if period_type == "QUARTERLY":
            return (
                {
                    "q1_value": raw_values["q1_value"],
                    "q2_value": raw_values["q2_value"],
                    "q3_value": raw_values["q3_value"],
                    "q4_value": raw_values["q4_value"],
                },
                False,
            )
        if period_type == "SEMI_ANNUALLY":
            return (
                {
                    "q1_value": None,
                    "q2_value": raw_values["h1_value"],
                    "q3_value": None,
                    "q4_value": raw_values["h2_value"],
                },
                False,
            )
        if period_type == "ANNUALLY":
            return (
                {
                    "q1_value": None,
                    "q2_value": None,
                    "q3_value": None,
                    "q4_value": annual_tail_value,
                },
                False,
            )
        return (
            {
                "q1_value": None,
                "q2_value": None,
                "q3_value": None,
                "q4_value": None,
            },
            True,
        )

    if display_type == "SEMI_ANNUALLY":
        if period_type == "SEMI_ANNUALLY":
            return (
                {
                    "h1_value": raw_values["h1_value"],
                    "h2_value": raw_values["h2_value"],
                },
                False,
            )
        if period_type == "QUARTERLY":
            h1 = None if raw_values["q1_value"] is None and raw_values["q2_value"] is None else float(raw_values["q1_value"] or 0) + float(raw_values["q2_value"] or 0)
            h2 = None if raw_values["q3_value"] is None and raw_values["q4_value"] is None else float(raw_values["q3_value"] or 0) + float(raw_values["q4_value"] or 0)
            return (
                {
                    "h1_value": h1,
                    "h2_value": h2,
                },
                False,
            )
        if period_type == "ANNUALLY":
            return (
                {
                    "h1_value": None,
                    "h2_value": annual_tail_value,
                },
                False,
            )
        return (
            {
                "h1_value": None,
                "h2_value": None,
            },
            True,
        )

    if period_type == "ANNUALLY":
        return (
            {
                "annual_y1_value": raw_values["annual_y1_value"],
                "annual_y2_value": raw_values["annual_y2_value"],
                "annual_y3_value": raw_values["annual_y3_value"],
                "annual_y4_value": raw_values["annual_y4_value"],
            },
            False,
        )

    if period_type == "QUARTERLY":
        annual_total = sum(float(raw_values[key] or 0) for key in ["q1_value", "q2_value", "q3_value", "q4_value"])
        annual_total = annual_total if any(raw_values[key] is not None for key in ["q1_value", "q2_value", "q3_value", "q4_value"]) else None
    elif period_type == "SEMI_ANNUALLY":
        annual_total = sum(float(raw_values[key] or 0) for key in ["h1_value", "h2_value"])
        annual_total = annual_total if any(raw_values[key] is not None for key in ["h1_value", "h2_value"]) else None
    else:
        annual_total = None

    return (
        {
            "annual_y1_value": None,
            "annual_y2_value": None,
            "annual_y3_value": None,
            "annual_y4_value": annual_total,
            "annual_value": annual_total,
        },
        False,
    )


def serialize_kpi_entry(row, display_period_type):
    raw_values = build_kpi_raw_values(row)
    display_values, cannot_disaggregate = build_kpi_display_values(row, display_period_type)
    return {
        "id": row.get("entry_id") or row.get("id"),
        "period_id": row.get("period_id"),
        "deal_id": row.get("deal_id"),
        "company_id": row.get("company_id"),
        "kpi_name": row.get("kpi_name") or "",
        "period_type": normalize_kpi_period_type(row.get("period_type")),
        "kpi_category_id": row.get("kpi_category_id"),
        "category": {
            "id": row.get("kpi_category_id"),
            "name": row.get("kpi_category_name") or "",
            "color": row.get("kpi_category_color"),
        } if row.get("kpi_category_id") else None,
        "currency_id": row.get("currency_id"),
        "currency": {
            "id": row.get("entry_currency_id"),
            "name": row.get("entry_currency_name") or "",
            "code": row.get("entry_currency_code") or "",
        } if row.get("entry_currency_id") else None,
        "unit": row.get("unit") or "",
        "kpi_order": row.get("kpi_order"),
        "display_order": row.get("display_order"),
        "raw_values": raw_values,
        "display_values": display_values,
        "cannot_disaggregate": cannot_disaggregate,
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def fetch_kpi_periods(cursor, deal_id):
    cursor.execute(
        """
        SELECT
            p.id AS period_id,
            p.deal_id,
            p.company_id,
            p.name,
            p.year,
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
        ORDER BY p.display_order ASC NULLS LAST, p.created_at ASC
        """,
        [str(deal_id)],
    )
    return [serialize_kpi_period(row) for row in dictfetchall(cursor)]


def fetch_kpi_period_entry_payload(cursor, deal_id, period_id, display_period_type="QUARTERLY"):
    cursor.execute(
        """
        SELECT
            p.id AS period_id,
            p.deal_id,
            p.company_id,
            p.name,
            p.year,
            p.currency_id,
            p.display_order,
            p.created_at,
            p.updated_at,
            cur.name AS currency_name,
            cur.code AS currency_code
        FROM dealflow.df_kpi_periods p
        LEFT JOIN dealflow.df_taxonomy_items cur
            ON cur.id = p.currency_id
        WHERE p.id = %s
          AND p.deal_id = %s
        LIMIT 1
        """,
        [str(period_id), str(deal_id)],
    )
    period_rows = dictfetchall(cursor)
    if not period_rows:
        return None
    period_row = period_rows[0]

    normalized_display_type = normalize_kpi_period_type(display_period_type)
    period = serialize_kpi_period(period_row)
    columns = build_kpi_display_columns(period.get("year"), normalized_display_type)

    cursor.execute(
        """
        SELECT
            e.id AS entry_id,
            e.period_id,
            e.deal_id,
            e.company_id,
            e.kpi_name,
            e.kpi_category_id,
            e.period_type,
            e.currency_id AS entry_currency_id,
            e.unit,
            e.kpi_order,
            e.display_order,
            e.q1_value,
            e.q2_value,
            e.q3_value,
            e.q4_value,
            e.h1_value,
            e.h2_value,
            e.annual_y1_value,
            e.annual_y2_value,
            e.annual_y3_value,
            e.annual_y4_value,
            e.created_at,
            e.updated_at,
            kc.name AS kpi_category_name,
            kc.color AS kpi_category_color,
            cur.name AS entry_currency_name,
            cur.code AS entry_currency_code
        FROM dealflow.df_kpi_entries e
        LEFT JOIN dealflow.df_taxonomy_items kc
            ON kc.id = e.kpi_category_id
        LEFT JOIN dealflow.df_taxonomy_items cur
            ON cur.id = e.currency_id
        WHERE e.period_id = %s
          AND e.deal_id = %s
        ORDER BY e.display_order ASC NULLS LAST, e.kpi_order ASC NULLS LAST, e.created_at ASC NULLS LAST, e.kpi_name ASC
        """,
        [str(period_id), str(deal_id)],
    )
    entries = [serialize_kpi_entry(row, normalized_display_type) for row in dictfetchall(cursor)]
    totals = {}
    for column in columns:
        key = column["key"]
        numeric_values = [entry.get("display_values", {}).get(key) for entry in entries]
        numeric_values = [float(value) for value in numeric_values if value is not None]
        totals[key] = sum(numeric_values) if numeric_values else None

    return {
        "period": period,
        "display_period_type": normalized_display_type,
        "columns": columns,
        "entries": entries,
        "totals": totals,
    }


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


def fetch_kpi_period_relation(cursor, deal_id, period_id):
    cursor.execute(
        """
        SELECT id, company_id, year
        FROM dealflow.df_kpi_periods
        WHERE id = %s
          AND deal_id = %s
        LIMIT 1
        """,
        [str(period_id), str(deal_id)],
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "company_id": str(row[1]) if row[1] else None, "year": row[2]}


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


def kpi_entry_belongs_to_period(cursor, deal_id, period_id, entry_id):
    cursor.execute(
        """
        SELECT e.id
        FROM dealflow.df_kpi_entries e
        INNER JOIN dealflow.df_kpi_periods p
            ON p.id = e.period_id
        WHERE e.id = %s
          AND e.period_id = %s
          AND p.deal_id = %s
        LIMIT 1
        """,
        [str(entry_id), str(period_id), str(deal_id)],
    )
    row = cursor.fetchone()
    return str(row[0]) if row else None


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
            d.deal_type_id,
            d.fund_id,
            d.stage_id,
            d.status_id,
            d.status_reason,
            d.source_type_id,
            d.operation_type_id,
            d.investment_instrument_other_text,
            d.contact_id,
            d.ticket_amount,
            d.cash_in_amount,
            d.cash_out_amount,
            d.currency_id,
            d.deal_date,
            d.pipeline_entry_date,
            d.countries_of_operations,
            d.value_creation_potential,
            d.sourcing_relevant_information,
            d.co_investor,
            d.co_investor_type_id,
            d.co_investor_ticket_amount,
            d.exit_route_id,
            d.exit_counterparty_id,
            d.exit_counterparty_other,
            d.exit_horizon_id,
            d.two_x_challenge,
            d.esg_risk_id,
            d.esg_notes,
            d.additional_notes,
            d.emerging_market_thesis,
            d.exit_type_id,
            d.exit_relevant_information,
            d.created_by,
            d.updated_by,
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
            op.name AS operation_type_name,
            op.color AS operation_type_color,
            cur.name AS currency_name,
            cur.code AS currency_code,
            dt.name AS deal_type_name,
            dt.color AS deal_type_color,
            cit.name AS co_investor_type_name,
            cit.color AS co_investor_type_color,
            er.name AS exit_route_name,
            er.color AS exit_route_color,
            ecp.name AS exit_counterparty_name,
            ecp.color AS exit_counterparty_color,
            eh.name AS exit_horizon_name,
            eh.color AS exit_horizon_color,
            esg.name AS esg_risk_name,
            esg.color AS esg_risk_color,
            ex.name AS exit_type_name,
            ex.color AS exit_type_color,
            uu.name AS updated_by_name,

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
        LEFT JOIN dealflow.df_taxonomy_items op
            ON op.id = d.operation_type_id
        LEFT JOIN dealflow.df_taxonomy_items cur
            ON cur.id = d.currency_id
        LEFT JOIN dealflow.df_taxonomy_items dt
            ON dt.id = d.deal_type_id
        LEFT JOIN dealflow.df_taxonomy_items cit
            ON cit.id = d.co_investor_type_id
        LEFT JOIN dealflow.df_taxonomy_items er
            ON er.id = d.exit_route_id
        LEFT JOIN dealflow.df_taxonomy_items ecp
            ON ecp.id = d.exit_counterparty_id
        LEFT JOIN dealflow.df_taxonomy_items eh
            ON eh.id = d.exit_horizon_id
        LEFT JOIN dealflow.df_taxonomy_items esg
            ON esg.id = d.esg_risk_id
        LEFT JOIN dealflow.df_taxonomy_items ex
            ON ex.id = d.exit_type_id
        LEFT JOIN dealflow.df_users uu
            ON uu.id = d.updated_by
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
    data["investment_instruments"] = fetch_deal_investment_instruments(cursor, deal_id)
    data["operation_countries"] = fetch_deal_operation_countries(cursor, deal_id)
    data["team_members"] = fetch_deal_team_members(cursor, deal_id)
    data["external_contacts"] = fetch_deal_external_contacts(cursor, deal_id)
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


class DealflowUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        email = str(payload.get("email") or "").strip() or None
        role = str(payload.get("role") or "").strip() or "Member"

        if not name:
            return Response({"error": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id
                        FROM dealflow.df_users
                        WHERE lower(email) = lower(%s)
                          AND id <> %s
                        LIMIT 1
                        """,
                        [email, str(user_id)],
                    )
                    if cursor.fetchone():
                        return Response(
                            {"error": "A user with this email already exists."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    cursor.execute(
                        """
                        UPDATE dealflow.df_users
                        SET
                            name = %s,
                            email = %s,
                            role = %s,
                            updated_at = %s
                        WHERE id = %s
                        """,
                        [name, email, role, now, str(user_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

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
                    updated = dict(zip([col[0] for col in cursor.description], row)) if row else None
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, user_id):
        now = timezone.now()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE dealflow.df_users
                    SET
                        is_active = FALSE,
                        updated_at = %s
                    WHERE id = %s
                    """,
                    [now, str(user_id)],
                )
                if cursor.rowcount == 0:
                    return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


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

    def delete(self, request, taxonomy_type, item_id):
        if not is_supported_setup_type(taxonomy_type):
            return Response({"error": "Unsupported setup type."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_taxonomy_items
                        WHERE id = %s
                          AND type = %s
                        """,
                        [str(item_id), taxonomy_type],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Setup item not found."}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response(
                {"error": "This value is already used in existing records and cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


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

        raw_investment_instrument_ids = payload.get("investment_instrument_ids")
        investment_instrument_ids = []
        if isinstance(raw_investment_instrument_ids, list):
            seen_instrument_ids = set()
            for value in raw_investment_instrument_ids:
                instrument_id = normalize_uuid(value)
                if instrument_id and instrument_id not in seen_instrument_ids:
                    investment_instrument_ids.append(instrument_id)
                    seen_instrument_ids.add(instrument_id)

        raw_operation_country_ids = payload.get("operation_country_ids")
        operation_country_ids = []
        if isinstance(raw_operation_country_ids, list):
            seen_operation_country_ids = set()
            for value in raw_operation_country_ids:
                normalized_country_id = normalize_uuid(value)
                if normalized_country_id and normalized_country_id not in seen_operation_country_ids:
                    operation_country_ids.append(normalized_country_id)
                    seen_operation_country_ids.add(normalized_country_id)

        contact_name = nullable_string("contact_name")
        current_contact_id = current_row.get("contact_id")
        next_contact_id = None
        updated_by = resolve_dealflow_user_id(getattr(request.user, "email", None))

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
                            deal_type_id = %s,
                            code = %s,
                            fund_id = %s,
                            stage_id = %s,
                            status_id = %s,
                            status_reason = %s,
                            source_type_id = %s,
                            operation_type_id = %s,
                            contact_id = %s,
                            ticket_amount = %s,
                            cash_in_amount = %s,
                            cash_out_amount = %s,
                            co_investor = %s,
                            co_investor_type_id = %s,
                            co_investor_ticket_amount = %s,
                            investment_instrument_other_text = %s,
                            currency_id = %s,
                            pipeline_entry_date = %s,
                            countries_of_operations = %s,
                            value_creation_potential = %s,
                            sourcing_relevant_information = %s,
                            exit_route_id = %s,
                            exit_counterparty_id = %s,
                            exit_counterparty_other = %s,
                            exit_horizon_id = %s,
                            two_x_challenge = %s,
                            esg_risk_id = %s,
                            esg_notes = %s,
                            additional_notes = %s,
                            emerging_market_thesis = %s,
                            exit_type_id = %s,
                            exit_relevant_information = %s,
                            updated_by = %s,
                            updated_at = %s
                        WHERE id = %s
                        """,
                        [
                            deal_name,
                            nullable_uuid("deal_type_id"),
                            code_name,
                            resolve_dealflow_fund_id(cursor, payload.get("fund_id")),
                            nullable_uuid("stage_id"),
                            nullable_uuid("status_id"),
                            nullable_string("status_reason"),
                            nullable_uuid("source_type_id"),
                            nullable_uuid("operation_type_id"),
                            str(next_contact_id) if next_contact_id else None,
                            nullable_numeric("ticket_amount"),
                            nullable_numeric("cash_in_amount"),
                            nullable_numeric("cash_out_amount"),
                            payload.get("co_investor"),
                            nullable_uuid("co_investor_type_id"),
                            nullable_numeric("co_investor_ticket_amount"),
                            nullable_string("investment_instrument_other_text"),
                            resolve_currency_taxonomy_id(cursor, payload.get("currency_id")),
                            payload.get("pipeline_entry_date"),
                            nullable_string("countries_of_operations"),
                            nullable_string("value_creation_potential"),
                            nullable_string("sourcing_relevant_information"),
                            nullable_uuid("exit_route_id"),
                            nullable_uuid("exit_counterparty_id"),
                            nullable_string("exit_counterparty_other"),
                            nullable_uuid("exit_horizon_id"),
                            nullable_string("two_x_challenge"),
                            nullable_uuid("esg_risk_id"),
                            nullable_string("esg_notes"),
                            nullable_string("additional_notes"),
                            nullable_string("emerging_market_thesis"),
                            nullable_uuid("exit_type_id"),
                            nullable_string("exit_relevant_information"),
                            updated_by,
                            now,
                            str(deal_id),
                        ],
                    )

                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_deal_investment_instruments
                        WHERE deal_id = %s
                        """,
                        [str(deal_id)],
                    )
                    for instrument_id in investment_instrument_ids:
                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_deal_investment_instruments (
                                id,
                                deal_id,
                                instrument_id,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s)
                            """,
                            [str(uuid4()), str(deal_id), instrument_id, now, now],
                        )

                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_deal_operation_countries
                        WHERE deal_id = %s
                        """,
                        [str(deal_id)],
                    )
                    for raw_country_id in operation_country_ids:
                        resolved_country_id = resolve_country_taxonomy_id(cursor, raw_country_id)
                        if not resolved_country_id:
                            continue
                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_deal_operation_countries (
                                id,
                                deal_id,
                                country_id,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s)
                            """,
                            [str(uuid4()), str(deal_id), resolved_country_id, now, now],
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
        stage_id = normalize_uuid(payload.get("stage_id"))
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
                    if stage_id:
                        cursor.execute(
                            """
                            SELECT id
                            FROM dealflow.df_taxonomy_items
                            WHERE id = %s
                              AND type = 'stage'
                              AND is_active = TRUE
                            LIMIT 1
                            """,
                            [stage_id],
                        )
                        if not cursor.fetchone():
                            return Response({"error": "Stage not found."}, status=status.HTTP_400_BAD_REQUEST)

                    event_columns = get_deal_event_columns()
                    stage_log_id = None
                    if stage_id:
                        stage_log_id = create_stage_log_record(
                            cursor,
                            deal_id,
                            stage_id,
                            event_date,
                            changed_by=created_by,
                            note=description,
                        )

                    insert_columns = [
                        "id",
                        "deal_id",
                        "title",
                        "description",
                        "event_date",
                        "event_type_id",
                        "created_by",
                        "created_at",
                        "updated_at",
                    ]
                    insert_values = [
                        str(event_id),
                        str(deal_id),
                        title,
                        description,
                        event_date,
                        event_type_id,
                        created_by,
                        now,
                        now,
                    ]
                    if "effective_date" in event_columns:
                        insert_columns.append("effective_date")
                        insert_values.append(event_date)
                    if "source_type" in event_columns:
                        insert_columns.append("source_type")
                        insert_values.append("MANUAL")
                    if "stage_log_id" in event_columns:
                        insert_columns.append("stage_log_id")
                        insert_values.append(stage_log_id)
                    if "stage_id" in event_columns:
                        insert_columns.append("stage_id")
                        insert_values.append(stage_id)

                    cursor.execute(
                        f"""
                        INSERT INTO dealflow.df_events (
                            {", ".join(insert_columns)}
                        )
                        VALUES ({", ".join(["%s"] * len(insert_values))})
                        """,
                        insert_values,
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
        stage_id = normalize_uuid(payload.get("stage_id"))

        if not title:
            return Response({"error": "Event title is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not event_date:
            return Response({"error": "Event date is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    event_columns = get_deal_event_columns()
                    select_stage_log_id_sql = "stage_log_id," if "stage_log_id" in event_columns else "NULL AS stage_log_id,"
                    select_source_type_sql = "source_type," if "source_type" in event_columns else "'MANUAL' AS source_type,"
                    select_stage_id_sql = "stage_id" if "stage_id" in event_columns else "NULL AS stage_id"
                    cursor.execute(
                        f"""
                        SELECT
                            id,
                            {select_stage_log_id_sql}
                            {select_source_type_sql}
                            {select_stage_id_sql}
                        FROM dealflow.df_events
                        WHERE id = %s
                          AND deal_id = %s
                          AND deleted_at IS NULL
                        LIMIT 1
                        """,
                        [str(event_id), str(deal_id)],
                    )
                    current_event = cursor.fetchone()
                    if not current_event:
                        return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

                    current_stage_log_id = str(current_event[1]) if current_event[1] else None
                    current_source_type = str(current_event[2] or "MANUAL").upper()
                    current_stage_id = str(current_event[3]) if current_event[3] else None

                    if stage_id:
                        cursor.execute(
                            """
                            SELECT id
                            FROM dealflow.df_taxonomy_items
                            WHERE id = %s
                              AND type = 'stage'
                              AND is_active = TRUE
                            LIMIT 1
                            """,
                            [stage_id],
                        )
                        if not cursor.fetchone():
                            return Response({"error": "Stage not found."}, status=status.HTTP_400_BAD_REQUEST)

                    next_stage_log_id = current_stage_log_id
                    if stage_id:
                        if current_stage_id != stage_id:
                            next_stage_log_id = create_stage_log_record(
                                cursor,
                                deal_id,
                                stage_id,
                                event_date,
                                changed_by=resolve_dealflow_user_id(getattr(request.user, "email", None)),
                                note=description,
                            )
                    elif "stage_log_id" in event_columns:
                        next_stage_log_id = None

                    set_clauses = [
                        "title = %s",
                        "description = %s",
                        "event_date = %s",
                        "event_type_id = %s",
                        "updated_at = %s",
                    ]
                    params = [title, description, event_date, event_type_id, now]
                    if "effective_date" in event_columns:
                        set_clauses.append("effective_date = %s")
                        params.append(event_date)
                    if "stage_log_id" in event_columns:
                        set_clauses.append("stage_log_id = %s")
                        params.append(next_stage_log_id)
                    if "stage_id" in event_columns:
                        set_clauses.append("stage_id = %s")
                        params.append(stage_id)
                    if "source_type" in event_columns and current_source_type != "STAGE_LOG":
                        set_clauses.append("source_type = %s")
                        params.append("MANUAL")

                    cursor.execute(
                        f"""
                        UPDATE dealflow.df_events
                        SET
                            {", ".join(set_clauses)}
                        WHERE id = %s
                          AND deal_id = %s
                          AND deleted_at IS NULL
                        """,
                        [*params, str(event_id), str(deal_id)],
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
                event_columns = get_deal_event_columns()
                source_type_sql = "source_type" if "source_type" in event_columns else "'MANUAL'"
                cursor.execute(
                    f"""
                    SELECT {source_type_sql}
                    FROM dealflow.df_events
                    WHERE id = %s
                      AND deal_id = %s
                      AND deleted_at IS NULL
                    LIMIT 1
                    """,
                    [str(event_id), str(deal_id)],
                )
                existing = cursor.fetchone()
                if not existing:
                    return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
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


class CalendarEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_dt = parse_calendar_datetime_value(request.query_params.get("start"))
        end_dt = parse_calendar_datetime_value(request.query_params.get("end"))
        deal_id = normalize_uuid(request.query_params.get("deal_id"))
        provider = str(request.query_params.get("provider") or "").strip() or None
        include_cancelled = parse_boolean_query(request.query_params.get("include_cancelled"), default=False)

        with connection.cursor() as cursor:
            events = fetch_calendar_events(
                cursor,
                start_dt=start_dt,
                end_dt=end_dt,
                deal_id=deal_id,
                provider=provider,
                include_cancelled=include_cancelled,
            )
        return Response({"events": events}, status=status.HTTP_200_OK)

    def post(self, request):
        payload = request.data or {}
        subject = str(payload.get("subject") or "").strip()
        body_preview = str(payload.get("body_preview") or "").strip()
        start_dt = parse_calendar_datetime_value(payload.get("start_datetime"))
        end_dt = parse_calendar_datetime_value(payload.get("end_datetime"))
        timezone_name = str(payload.get("timezone") or "UTC").strip() or "UTC"
        location = str(payload.get("location") or "").strip()
        meeting_link = str(payload.get("meeting_link") or "").strip()
        organizer_name = str(payload.get("organizer_name") or "Internal").strip() or "Internal"
        organizer_email = str(payload.get("organizer_email") or "").strip()
        attendees = normalize_calendar_attendees(payload.get("attendees"))
        deal_id = normalize_uuid(payload.get("deal_id"))

        if not subject:
            return Response({"error": "Subject is required."}, status=status.HTTP_400_BAD_REQUEST)
        if start_dt is None:
            return Response({"error": "Start datetime is required."}, status=status.HTTP_400_BAD_REQUEST)
        if end_dt is None:
            return Response({"error": "End datetime is required."}, status=status.HTTP_400_BAD_REQUEST)
        if end_dt <= start_dt:
            return Response({"error": "End datetime must be after start datetime."}, status=status.HTTP_400_BAD_REQUEST)

        event_id = str(uuid4())
        external_event_id = f"manual:{uuid4()}"
        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if deal_id and not fetch_deal_brief(cursor, deal_id):
                        return Response({"error": "Deal not found."}, status=status.HTTP_400_BAD_REQUEST)

                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_calendar_events (
                            id,
                            connection_id,
                            provider,
                            external_event_id,
                            subject,
                            body_preview,
                            start_datetime,
                            end_datetime,
                            timezone,
                            location,
                            meeting_link,
                            organizer_name,
                            organizer_email,
                            attendees,
                            status,
                            is_cancelled,
                            deal_id,
                            raw_payload,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            event_id,
                            None,
                            "MANUAL",
                            external_event_id,
                            subject,
                            body_preview,
                            start_dt,
                            end_dt,
                            timezone_name,
                            location,
                            meeting_link,
                            organizer_name,
                            organizer_email,
                            Json(attendees),
                            "confirmed",
                            False,
                            deal_id,
                            Json(payload),
                            now,
                            now,
                        ],
                    )
                    created = fetch_calendar_event(cursor, event_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(created or {}, status=status.HTTP_201_CREATED)


class CalendarEventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, event_id):
        payload = request.data or {}
        allowed_fields = {
            "subject",
            "body_preview",
            "start_datetime",
            "end_datetime",
            "timezone",
            "location",
            "meeting_link",
            "organizer_name",
            "organizer_email",
            "attendees",
            "deal_id",
            "status",
        }
        update_keys = {key for key in payload.keys() if key in allowed_fields}
        if not update_keys:
            return Response({"error": "No valid fields provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id, provider, start_datetime, end_datetime
                        FROM dealflow.df_calendar_events
                        WHERE id = %s
                        LIMIT 1
                        """,
                        [str(event_id)],
                    )
                    row = cursor.fetchone()
                    if not row:
                        return Response({"error": "Calendar event not found."}, status=status.HTTP_404_NOT_FOUND)

                    provider = str(row[1] or "").upper()
                    current_start = row[2]
                    current_end = row[3]

                    if provider != "MANUAL":
                        if update_keys - {"deal_id"}:
                            return Response(
                                {"error": "Only deal linking is allowed for Microsoft-synced events right now."},
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                    next_start = parse_calendar_datetime_value(payload.get("start_datetime")) if "start_datetime" in update_keys else current_start
                    next_end = parse_calendar_datetime_value(payload.get("end_datetime")) if "end_datetime" in update_keys else current_end
                    if "start_datetime" in update_keys and payload.get("start_datetime") not in (None, "") and next_start is None:
                        return Response({"error": "Invalid start datetime."}, status=status.HTTP_400_BAD_REQUEST)
                    if "end_datetime" in update_keys and payload.get("end_datetime") not in (None, "") and next_end is None:
                        return Response({"error": "Invalid end datetime."}, status=status.HTTP_400_BAD_REQUEST)
                    if next_start and next_end and next_end <= next_start:
                        return Response({"error": "End datetime must be after start datetime."}, status=status.HTTP_400_BAD_REQUEST)

                    deal_id = normalize_uuid(payload.get("deal_id")) if "deal_id" in update_keys else None
                    if "deal_id" in update_keys and payload.get("deal_id") not in (None, "") and not deal_id:
                        return Response({"error": "Invalid deal id."}, status=status.HTTP_400_BAD_REQUEST)
                    if "deal_id" in update_keys and deal_id and not fetch_deal_brief(cursor, deal_id):
                        return Response({"error": "Deal not found."}, status=status.HTTP_400_BAD_REQUEST)

                    field_map = {
                        "subject": str(payload.get("subject") or "").strip(),
                        "body_preview": str(payload.get("body_preview") or "").strip(),
                        "start_datetime": next_start,
                        "end_datetime": next_end,
                        "timezone": str(payload.get("timezone") or "").strip() or "UTC",
                        "location": str(payload.get("location") or "").strip(),
                        "meeting_link": str(payload.get("meeting_link") or "").strip(),
                        "organizer_name": str(payload.get("organizer_name") or "").strip(),
                        "organizer_email": str(payload.get("organizer_email") or "").strip(),
                        "attendees": Json(normalize_calendar_attendees(payload.get("attendees"))),
                        "deal_id": deal_id,
                        "status": str(payload.get("status") or "").strip(),
                    }

                    if "subject" in update_keys and not field_map["subject"]:
                        return Response({"error": "Subject is required."}, status=status.HTTP_400_BAD_REQUEST)

                    set_clauses = []
                    params = []
                    for key in update_keys:
                        set_clauses.append(f"{key} = %s")
                        if key == "deal_id" and payload.get("deal_id") in (None, ""):
                            params.append(None)
                        else:
                            params.append(field_map[key])
                    set_clauses.append("updated_at = %s")
                    params.append(timezone.now())
                    params.append(str(event_id))

                    cursor.execute(
                        f"""
                        UPDATE dealflow.df_calendar_events
                        SET {', '.join(set_clauses)}
                        WHERE id = %s
                        """,
                        params,
                    )
                    updated = fetch_calendar_event(cursor, event_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, event_id):
        now = timezone.now()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE dealflow.df_calendar_events
                    SET
                        is_cancelled = TRUE,
                        status = 'cancelled',
                        updated_at = %s
                    WHERE id = %s
                    """,
                    [now, str(event_id)],
                )
                if cursor.rowcount == 0:
                    return Response({"error": "Calendar event not found."}, status=status.HTTP_404_NOT_FOUND)
                cancelled = fetch_calendar_event(cursor, event_id)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(cancelled or {"success": True}, status=status.HTTP_200_OK)


class CalendarEventLinkDealView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, event_id):
        payload = request.data or {}
        raw_deal_id = payload.get("deal_id")
        deal_id = normalize_uuid(raw_deal_id)

        if raw_deal_id not in (None, "") and not deal_id:
            return Response({"error": "Invalid deal id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id
                        FROM dealflow.df_calendar_events
                        WHERE id = %s
                        LIMIT 1
                        """,
                        [str(event_id)],
                    )
                    if not cursor.fetchone():
                        return Response({"error": "Calendar event not found."}, status=status.HTTP_404_NOT_FOUND)

                    if deal_id and not fetch_deal_brief(cursor, deal_id):
                        return Response({"error": "Deal not found."}, status=status.HTTP_400_BAD_REQUEST)

                    cursor.execute(
                        """
                        UPDATE dealflow.df_calendar_events
                        SET
                            deal_id = %s,
                            updated_at = %s
                        WHERE id = %s
                        """,
                        [deal_id, timezone.now(), str(event_id)],
                    )
                    updated = fetch_calendar_event(cursor, event_id)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(updated or {}, status=status.HTTP_200_OK)


class CalendarOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, code
                FROM dealflow.df_deals
                WHERE deleted_at IS NULL
                ORDER BY name ASC
                """
            )
            deals = [
                {
                    "id": row[0],
                    "name": row[1] or "",
                    "code": row[2] or "",
                }
                for row in cursor.fetchall()
            ]

        return Response(
            {
                "deals": deals,
                "providers": ["MANUAL", "MICROSOFT"],
            },
            status=status.HTTP_200_OK,
        )


class CalendarMicrosoftStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        configured = microsoft_calendar_is_configured()
        if not configured:
            return Response(
                {
                    "configured": False,
                    "connected": False,
                    "message": "Microsoft Calendar integration is not configured yet.",
                },
                status=status.HTTP_200_OK,
            )

        with connection.cursor() as cursor:
            connected = bool(fetch_active_microsoft_calendar_connection(cursor))

        return Response(
            {
                "configured": True,
                "connected": connected,
                "message": "Microsoft Calendar integration is available." if connected else "No Microsoft calendar connection found.",
            },
            status=status.HTTP_200_OK,
        )


class CalendarMicrosoftConnectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not microsoft_calendar_is_configured():
            return Response(
                {"error": "Microsoft Calendar integration is not configured yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"error": "Microsoft Calendar connection flow is not enabled yet."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class CalendarMicrosoftSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not microsoft_calendar_is_configured():
            return Response(
                {"error": "Microsoft Calendar integration is not configured yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with connection.cursor() as cursor:
            connection_id = fetch_active_microsoft_calendar_connection(cursor)

        if not connection_id:
            return Response(
                {"error": "No Microsoft calendar connection found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Microsoft calendar sync will be added next."},
            status=status.HTTP_200_OK,
        )


class DealflowDealStageLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            stage_logs = fetch_deal_stage_logs(cursor, deal_id)
        return Response(stage_logs, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        stage_id = normalize_uuid(payload.get("stage_id"))
        event_date = payload.get("event_date")
        note = str(payload.get("note") or "").strip()

        if not stage_id:
            return Response({"error": "Stage is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not event_date:
            return Response({"error": "Effective date is required."}, status=status.HTTP_400_BAD_REQUEST)

        changed_by = resolve_dealflow_user_id(getattr(request.user, "email", None))
        now = timezone.now()
        log_id = uuid4()

        stage_log_columns = get_deal_stage_log_columns()
        supports_updated_at = "updated_at" in stage_log_columns
        supports_note = "note" in stage_log_columns
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

                    insert_columns = [
                        "id",
                        "deal_id",
                        "old_stage_id",
                        "new_stage_id",
                        "changed_by",
                        "changed_at",
                        "created_at",
                    ]
                    insert_values = [
                        str(log_id),
                        str(deal_id),
                        str(current_deal.get("stage_id")) if current_deal.get("stage_id") else None,
                        stage_id,
                        changed_by,
                        event_date,
                        now,
                    ]
                    if supports_updated_at:
                        insert_columns.append("updated_at")
                        insert_values.append(now)
                    if supports_note:
                        insert_columns.append("note")
                        insert_values.append(note)

                    cursor.execute(
                        f"""
                        INSERT INTO dealflow.df_deal_stage_logs ({", ".join(insert_columns)})
                        VALUES ({", ".join(["%s"] * len(insert_values))})
                        """,
                        insert_values,
                    )
                    sync_deal_stage_from_stage_log(cursor, deal_id, fallback_stage_id=stage_id)
                    sync_stage_log_event(cursor, deal_id, log_id)
                    stage_logs = fetch_deal_stage_logs(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((log for log in stage_logs if str(log.get("id")) == str(log_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowDealStageLogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, event_id):
        payload = request.data or {}
        stage_id = normalize_uuid(payload.get("stage_id"))
        event_date = payload.get("event_date")
        note = str(payload.get("note") or "").strip()

        if not stage_id:
            return Response({"error": "Stage is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not event_date:
            return Response({"error": "Effective date is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        stage_log_columns = get_deal_stage_log_columns()
        supports_updated_at = "updated_at" in stage_log_columns
        supports_note = "note" in stage_log_columns
        deleted_filter = "AND deleted_at IS NULL" if "deleted_at" in stage_log_columns else ""
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

                    set_clauses = [
                        "new_stage_id = %s",
                        "changed_at = %s",
                    ]
                    params = [stage_id, event_date]
                    if supports_note:
                        set_clauses.append("note = %s")
                        params.append(note)
                    if supports_updated_at:
                        set_clauses.append("updated_at = %s")
                        params.append(now)

                    cursor.execute(
                        f"""
                        UPDATE dealflow.df_deal_stage_logs
                        SET {", ".join(set_clauses)}
                        WHERE id = %s
                          AND deal_id = %s
                          {deleted_filter}
                        """,
                        [*params, str(event_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "Stage log entry not found."}, status=status.HTTP_404_NOT_FOUND)

                    sync_deal_stage_from_stage_log(cursor, deal_id, fallback_stage_id=stage_id)
                    sync_stage_log_event(cursor, deal_id, event_id)
                    stage_logs = fetch_deal_stage_logs(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((log for log in stage_logs if str(log.get("id")) == str(event_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, event_id):
        now = timezone.now()
        stage_log_columns = get_deal_stage_log_columns()
        supports_deleted_at = "deleted_at" in stage_log_columns
        supports_updated_at = "updated_at" in stage_log_columns
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if supports_deleted_at:
                        set_clauses = ["deleted_at = %s"]
                        params = [now]
                        if supports_updated_at:
                            set_clauses.append("updated_at = %s")
                            params.append(now)
                        cursor.execute(
                            f"""
                            UPDATE dealflow.df_deal_stage_logs
                            SET {", ".join(set_clauses)}
                            WHERE id = %s
                              AND deal_id = %s
                              AND deleted_at IS NULL
                            """,
                            [*params, str(event_id), str(deal_id)],
                        )
                    else:
                        cursor.execute(
                            """
                            DELETE FROM dealflow.df_deal_stage_logs
                            WHERE id = %s
                              AND deal_id = %s
                            """,
                            [str(event_id), str(deal_id)],
                        )
                    if cursor.rowcount == 0:
                        return Response({"error": "Stage log entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    if "stage_log_id" in get_deal_event_columns():
                        cursor.execute(
                            """
                            UPDATE dealflow.df_events
                            SET
                                deleted_at = %s,
                                updated_at = %s
                            WHERE deal_id = %s
                              AND stage_log_id = %s
                              AND deleted_at IS NULL
                            """,
                            [now, now, str(deal_id), str(event_id)],
                        )
                    sync_deal_stage_from_stage_log(cursor, deal_id)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowDealExternalContactsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, deal_id):
        with connection.cursor() as cursor:
            contacts = fetch_deal_external_contacts(cursor, deal_id)
        return Response({"contacts": contacts}, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        role = str(payload.get("role") or "").strip()
        email = str(payload.get("email") or "").strip()
        phone = str(payload.get("phone") or "").strip()
        notes = str(payload.get("notes") or "").strip()
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            display_order_value = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Display order must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        contact_id = uuid4()
        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id
                        FROM dealflow.df_deals
                        WHERE id = %s
                          AND deleted_at IS NULL
                        LIMIT 1
                        """,
                        [str(deal_id)],
                    )
                    if not cursor.fetchone():
                        return Response({"error": "Deal not found."}, status=status.HTTP_404_NOT_FOUND)

                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_deal_external_contacts (
                            id,
                            deal_id,
                            name,
                            role,
                            email,
                            phone,
                            notes,
                            display_order,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(contact_id),
                            str(deal_id),
                            name,
                            role,
                            email,
                            phone,
                            notes,
                            display_order_value,
                            now,
                            now,
                        ],
                    )
                    contacts = fetch_deal_external_contacts(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((contact for contact in contacts if str(contact.get("id")) == str(contact_id)), None)
        return Response(created or {}, status=status.HTTP_201_CREATED)


class DealflowDealExternalContactDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, contact_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        role = str(payload.get("role") or "").strip()
        email = str(payload.get("email") or "").strip()
        phone = str(payload.get("phone") or "").strip()
        notes = str(payload.get("notes") or "").strip()
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            display_order_value = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Display order must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE dealflow.df_deal_external_contacts
                        SET
                            name = %s,
                            role = %s,
                            email = %s,
                            phone = %s,
                            notes = %s,
                            display_order = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [
                            name,
                            role,
                            email,
                            phone,
                            notes,
                            display_order_value,
                            now,
                            str(contact_id),
                            str(deal_id),
                        ],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "External contact not found."}, status=status.HTTP_404_NOT_FOUND)
                    contacts = fetch_deal_external_contacts(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated = next((contact for contact in contacts if str(contact.get("id")) == str(contact_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, contact_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_deal_external_contacts
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [str(contact_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "External contact not found."}, status=status.HTTP_404_NOT_FOUND)
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
                    create_default_cap_table_columns(cursor, snapshot_id, now)
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created = next((snapshot for snapshot in snapshots.get("snapshots", []) if str(snapshot.get("id")) == str(snapshot_id)), None)
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

        updated = next((snapshot for snapshot in snapshots.get("snapshots", []) if str(snapshot.get("id")) == str(snapshot_id)), None)
        return Response(updated or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, snapshot_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not cap_table_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
                        return Response({"error": "Snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_cap_table_entry_values
                        WHERE entry_id IN (
                            SELECT id
                            FROM dealflow.df_cap_table_entries
                            WHERE snapshot_id = %s
                        )
                        """,
                        [str(snapshot_id)],
                    )
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_cap_table_entries
                        WHERE snapshot_id = %s
                        """,
                        [str(snapshot_id)],
                    )
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_cap_table_columns
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
                    value_payloads = build_cap_table_values_payload(cursor, snapshot_id, payload)
                    legacy_fields = {field: None for field, _ in LEGACY_CAP_TABLE_CODE_MAP.values() if field != "comment"}
                    entry_comment = comment
                    for item in value_payloads:
                        code = str(item["column"].get("code") or "").strip().upper()
                        mapping = LEGACY_CAP_TABLE_CODE_MAP.get(code)
                        if not mapping:
                            continue
                        field_name, field_type = mapping
                        if field_name == "comment":
                            if item["value_text"] not in (None, ""):
                                entry_comment = item["value_text"]
                        elif field_type == "NUMBER":
                            legacy_fields[field_name] = item["value_number"]
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
                            entry_comment,
                            legacy_fields.get("series_a_shares"),
                            legacy_fields.get("series_b_shares"),
                            legacy_fields.get("common_shares"),
                            legacy_fields.get("preferred_shares"),
                            legacy_fields.get("seed_shares"),
                            legacy_fields.get("esop_shares"),
                            legacy_fields.get("non_fully_diluted_percentage"),
                            legacy_fields.get("fully_diluted_percentage"),
                            now,
                            now,
                        ],
                    )
                    for item in value_payloads:
                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_cap_table_entry_values (
                                id,
                                entry_id,
                                column_id,
                                value_text,
                                value_number,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """,
                            [
                                str(uuid4()),
                                str(entry_id),
                                str(item["column"]["id"]),
                                item["value_text"],
                                item["value_number"],
                                now,
                                now,
                            ],
                        )
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created_snapshot = next((snapshot for snapshot in snapshots.get("snapshots", []) if str(snapshot.get("id")) == str(snapshot_id)), None)
        created_entry = next((entry for entry in (created_snapshot or {}).get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
        return Response(created_entry or {}, status=status.HTTP_201_CREATED)


class DealflowCapTableEntryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, entry_id, snapshot_id=None):
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
                    if snapshot_id and not cap_table_entry_belongs_to_snapshot(cursor, deal_id, snapshot_id, entry_id):
                        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    value_payloads = build_cap_table_values_payload(cursor, relation["snapshot_id"], payload)
                    legacy_fields = {field: None for field, _ in LEGACY_CAP_TABLE_CODE_MAP.values() if field != "comment"}
                    entry_comment = comment
                    for item in value_payloads:
                        code = str(item["column"].get("code") or "").strip().upper()
                        mapping = LEGACY_CAP_TABLE_CODE_MAP.get(code)
                        if not mapping:
                            continue
                        field_name, field_type = mapping
                        if field_name == "comment":
                            if item["value_text"] not in (None, ""):
                                entry_comment = item["value_text"]
                        elif field_type == "NUMBER":
                            legacy_fields[field_name] = item["value_number"]
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
                            entry_comment,
                            legacy_fields.get("series_a_shares"),
                            legacy_fields.get("series_b_shares"),
                            legacy_fields.get("common_shares"),
                            legacy_fields.get("preferred_shares"),
                            legacy_fields.get("seed_shares"),
                            legacy_fields.get("esop_shares"),
                            legacy_fields.get("non_fully_diluted_percentage"),
                            legacy_fields.get("fully_diluted_percentage"),
                            now,
                            str(entry_id),
                        ],
                    )
                    for item in value_payloads:
                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_cap_table_entry_values (
                                id,
                                entry_id,
                                column_id,
                                value_text,
                                value_number,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (entry_id, column_id)
                            DO UPDATE SET
                                value_text = EXCLUDED.value_text,
                                value_number = EXCLUDED.value_number,
                                updated_at = EXCLUDED.updated_at
                            """,
                            [
                                str(uuid4()),
                                str(entry_id),
                                str(item["column"]["id"]),
                                item["value_text"],
                                item["value_number"],
                                now,
                                now,
                            ],
                        )
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated_entry = None
        for snapshot in snapshots.get("snapshots", []):
            updated_entry = next((entry for entry in snapshot.get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
            if updated_entry:
                break
        return Response(updated_entry or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, entry_id, snapshot_id=None):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = cap_table_entry_belongs_to_deal(cursor, deal_id, entry_id)
                    if not relation:
                        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    if snapshot_id and not cap_table_entry_belongs_to_snapshot(cursor, deal_id, snapshot_id, entry_id):
                        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        DELETE FROM dealflow.df_cap_table_entry_values
                        WHERE entry_id = %s
                        """,
                        [str(entry_id)],
                    )
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


class DealflowCapTableColumnsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, deal_id, snapshot_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        column_type = normalize_cap_table_column_type(payload.get("column_type"))
        is_percentage = bool(payload.get("is_percentage")) or column_type == "PERCENTAGE"
        code = str(payload.get("code") or "").strip() or build_cap_table_column_code(name)
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "Column name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not column_type:
            return Response({"error": "Column type must be TEXT, NUMBER, or PERCENTAGE."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            display_order_value = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Display order must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        column_id = uuid4()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not cap_table_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
                        return Response({"error": "Snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_cap_table_columns (
                            id,
                            snapshot_id,
                            name,
                            code,
                            column_type,
                            is_percentage,
                            is_system,
                            display_order,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [str(column_id), str(snapshot_id), name, code, column_type, is_percentage, False, display_order_value, now, now],
                    )
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {
                "id": str(column_id),
                "snapshot_id": str(snapshot_id),
                "name": name,
                "code": code,
                "column_type": column_type,
                "is_percentage": is_percentage,
                "is_system": False,
                "display_order": display_order_value,
                "created_at": now,
                "updated_at": now,
            },
            status=status.HTTP_201_CREATED,
        )


class DealflowCapTableColumnDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, snapshot_id, column_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        code = str(payload.get("code") or "").strip() or build_cap_table_column_code(name)
        column_type = normalize_cap_table_column_type(payload.get("column_type"))
        is_percentage = bool(payload.get("is_percentage")) or column_type == "PERCENTAGE"
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "Column name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not column_type:
            return Response({"error": "Column type must be TEXT, NUMBER, or PERCENTAGE."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            display_order_value = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Display order must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = cap_table_column_belongs_to_snapshot(cursor, deal_id, snapshot_id, column_id)
                    if not relation:
                        return Response({"error": "Column not found."}, status=status.HTTP_404_NOT_FOUND)
                    if relation["is_system"]:
                        return Response({"error": "System columns cannot be modified."}, status=status.HTTP_400_BAD_REQUEST)
                    cursor.execute(
                        """
                        UPDATE dealflow.df_cap_table_columns
                        SET
                            name = %s,
                            code = %s,
                            column_type = %s,
                            is_percentage = %s,
                            display_order = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND snapshot_id = %s
                        """,
                        [name, code, column_type, is_percentage, display_order_value, now, str(column_id), str(snapshot_id)],
                    )
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"id": str(column_id), "snapshot_id": str(snapshot_id), "name": name, "code": code, "column_type": column_type, "is_percentage": is_percentage, "is_system": False, "display_order": display_order_value, "updated_at": now}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, snapshot_id, column_id):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = cap_table_column_belongs_to_snapshot(cursor, deal_id, snapshot_id, column_id)
                    if not relation:
                        return Response({"error": "Column not found."}, status=status.HTTP_404_NOT_FOUND)
                    if relation["is_system"]:
                        return Response({"error": "System columns cannot be deleted."}, status=status.HTTP_400_BAD_REQUEST)
                    cursor.execute("DELETE FROM dealflow.df_cap_table_entry_values WHERE column_id = %s", [str(column_id)])
                    cursor.execute("DELETE FROM dealflow.df_cap_table_columns WHERE id = %s AND snapshot_id = %s", [str(column_id), str(snapshot_id)])
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DealflowCapTableDuplicateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, deal_id, snapshot_id):
        payload = request.data or {}
        now = timezone.now()
        new_snapshot_id = uuid4()
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if not cap_table_snapshot_belongs_to_deal(cursor, deal_id, snapshot_id):
                        return Response({"error": "Snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        SELECT company_id, name, snapshot_date, created_by
                        FROM dealflow.df_cap_table_snapshots
                        WHERE id = %s
                          AND deal_id = %s
                        LIMIT 1
                        """,
                        [str(snapshot_id), str(deal_id)],
                    )
                    source_row = cursor.fetchone()
                    source_name = str(payload.get("name") or source_row[1] or "").strip() or "Cap table copy"
                    source_date = payload.get("snapshot_date") or source_row[2]
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_cap_table_snapshots (
                            id, deal_id, company_id, name, snapshot_date, created_by, created_at, updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [str(new_snapshot_id), str(deal_id), source_row[0], source_name, source_date, source_row[3], now, now],
                    )
                    cursor.execute(
                        """
                        SELECT id, name, code, column_type, is_percentage, is_system, display_order
                        FROM dealflow.df_cap_table_columns
                        WHERE snapshot_id = %s
                        ORDER BY display_order ASC NULLS LAST, created_at ASC NULLS LAST
                        """,
                        [str(snapshot_id)],
                    )
                    column_map = {}
                    for row in dictfetchall(cursor):
                        new_column_id = str(uuid4())
                        column_map[str(row["id"])] = new_column_id
                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_cap_table_columns (
                                id, snapshot_id, name, code, column_type, is_percentage, is_system, display_order, created_at, updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            [new_column_id, str(new_snapshot_id), row["name"], row["code"], row["column_type"], row["is_percentage"], row["is_system"], row["display_order"], now, now],
                        )
                    cursor.execute(
                        """
                        SELECT id, shareholder_name, comment, series_a_shares, series_b_shares, common_shares, preferred_shares, seed_shares, esop_shares, non_fully_diluted_percentage, fully_diluted_percentage
                        FROM dealflow.df_cap_table_entries
                        WHERE snapshot_id = %s
                        ORDER BY created_at ASC NULLS LAST, shareholder_name ASC
                        """,
                        [str(snapshot_id)],
                    )
                    entry_map = {}
                    for row in dictfetchall(cursor):
                        new_entry_id = str(uuid4())
                        entry_map[str(row["id"])] = new_entry_id
                        cursor.execute(
                            """
                            INSERT INTO dealflow.df_cap_table_entries (
                                id, snapshot_id, shareholder_name, comment, series_a_shares, series_b_shares, common_shares,
                                preferred_shares, seed_shares, esop_shares, non_fully_diluted_percentage, fully_diluted_percentage, created_at, updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            [new_entry_id, str(new_snapshot_id), row["shareholder_name"], row["comment"], row["series_a_shares"], row["series_b_shares"], row["common_shares"], row["preferred_shares"], row["seed_shares"], row["esop_shares"], row["non_fully_diluted_percentage"], row["fully_diluted_percentage"], now, now],
                        )
                    if entry_map and column_map:
                        cursor.execute(
                            """
                            SELECT entry_id, column_id, value_text, value_number
                            FROM dealflow.df_cap_table_entry_values
                            WHERE entry_id = ANY(%s::uuid[])
                            """,
                            [list(entry_map.keys())],
                        )
                        for row in dictfetchall(cursor):
                            cursor.execute(
                                """
                                INSERT INTO dealflow.df_cap_table_entry_values (
                                    id, entry_id, column_id, value_text, value_number, created_at, updated_at
                                )
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                                """,
                                [str(uuid4()), entry_map[str(row["entry_id"])], column_map[str(row["column_id"])], row["value_text"], row["value_number"], now, now],
                            )
                    snapshots = fetch_cap_table_with_entries(cursor, deal_id)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        duplicated = next((snapshot for snapshot in snapshots.get("snapshots", []) if str(snapshot.get("id")) == str(new_snapshot_id)), None)
        return Response(duplicated or {}, status=status.HTTP_201_CREATED)


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
            periods = fetch_kpi_periods(cursor, deal_id)
        return Response({"periods": periods}, status=status.HTTP_200_OK)

    def post(self, request, deal_id):
        payload = request.data or {}
        name = str(payload.get("name") or "").strip()
        year = payload.get("year")
        currency_id = normalize_uuid(payload.get("currency_id"))
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "KPI period name is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            year = int(year)
        except (TypeError, ValueError):
            return Response({"error": "Year is required."}, status=status.HTTP_400_BAD_REQUEST)

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
                            year,
                            currency_id,
                            display_order,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(period_id),
                            str(deal_id),
                            company_id,
                            name,
                            year,
                            currency_id,
                            display_order,
                            now,
                            now,
                        ],
                    )
                    periods = fetch_kpi_periods(cursor, deal_id)
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
        year = payload.get("year")
        currency_id = normalize_uuid(payload.get("currency_id"))
        display_order = payload.get("display_order")

        if not name:
            return Response({"error": "KPI period name is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            year = int(year)
        except (TypeError, ValueError):
            return Response({"error": "Year is required."}, status=status.HTTP_400_BAD_REQUEST)

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
                            year = %s,
                            currency_id = %s,
                            display_order = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [name, year, currency_id, display_order, now, str(period_id), str(deal_id)],
                    )
                    if cursor.rowcount == 0:
                        return Response({"error": "KPI period not found."}, status=status.HTTP_404_NOT_FOUND)
                    periods = fetch_kpi_periods(cursor, deal_id)
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

    def get(self, request, deal_id, period_id):
        display_period_type = request.query_params.get("display_period_type") or "QUARTERLY"
        with connection.cursor() as cursor:
            payload = fetch_kpi_period_entry_payload(cursor, deal_id, period_id, display_period_type)
        if not payload:
            return Response({"error": "KPI period not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request, deal_id, period_id):
        payload = request.data or {}
        kpi_name = str(payload.get("kpi_name") or "").strip()
        kpi_category_id = normalize_uuid(payload.get("kpi_category_id"))
        period_type = normalize_kpi_period_type(payload.get("period_type"))
        currency_id = normalize_uuid(payload.get("currency_id"))
        unit = str(payload.get("unit") or "").strip()
        kpi_order = payload.get("kpi_order")
        display_order = payload.get("display_order")

        if not kpi_name:
            return Response({"error": "KPI name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        entry_id = uuid4()
        try:
            kpi_order = int(kpi_order) if kpi_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Order must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Display order must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    period_relation = fetch_kpi_period_relation(cursor, deal_id, period_id)
                    if not period_relation:
                        return Response({"error": "KPI period not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        INSERT INTO dealflow.df_kpi_entries (
                            id,
                            deal_id,
                            company_id,
                            period_id,
                            kpi_name,
                            kpi_category_id,
                            period_type,
                            currency_id,
                            unit,
                            kpi_order,
                            display_order,
                            q1_value,
                            q2_value,
                            q3_value,
                            q4_value,
                            h1_value,
                            h2_value,
                            annual_y1_value,
                            annual_y2_value,
                            annual_y3_value,
                            annual_y4_value,
                            created_at,
                            updated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            str(entry_id),
                            str(deal_id),
                            period_relation["company_id"] or fetch_deal_company_id(cursor, deal_id),
                            str(period_id),
                            kpi_name,
                            kpi_category_id,
                            period_type,
                            currency_id,
                            unit,
                            kpi_order,
                            display_order,
                            normalize_numeric_or_none(payload.get("q1_value")),
                            normalize_numeric_or_none(payload.get("q2_value")),
                            normalize_numeric_or_none(payload.get("q3_value")),
                            normalize_numeric_or_none(payload.get("q4_value")),
                            normalize_numeric_or_none(payload.get("h1_value")),
                            normalize_numeric_or_none(payload.get("h2_value")),
                            normalize_numeric_or_none(payload.get("annual_y1_value")),
                            normalize_numeric_or_none(payload.get("annual_y2_value")),
                            normalize_numeric_or_none(payload.get("annual_y3_value")),
                            normalize_numeric_or_none(payload.get("annual_y4_value")),
                            now,
                            now,
                        ],
                    )
                    period_payload = fetch_kpi_period_entry_payload(cursor, deal_id, period_id, period_type)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        created_entry = next((entry for entry in (period_payload or {}).get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
        return Response(created_entry or {}, status=status.HTTP_201_CREATED)


class DealflowKpiEntryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, deal_id, entry_id, period_id=None):
        payload = request.data or {}
        kpi_name = str(payload.get("kpi_name") or "").strip()
        kpi_category_id = normalize_uuid(payload.get("kpi_category_id"))
        period_type = normalize_kpi_period_type(payload.get("period_type"))
        currency_id = normalize_uuid(payload.get("currency_id"))
        unit = str(payload.get("unit") or "").strip()
        kpi_order = payload.get("kpi_order")
        display_order = payload.get("display_order")

        if not kpi_name:
            return Response({"error": "KPI name is required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            kpi_order = int(kpi_order) if kpi_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Order must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            display_order = int(display_order) if display_order not in ("", None) else None
        except (TypeError, ValueError):
            return Response({"error": "Display order must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = kpi_entry_belongs_to_deal(cursor, deal_id, entry_id)
                    if not relation:
                        return Response({"error": "KPI entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    if period_id and not kpi_entry_belongs_to_period(cursor, deal_id, period_id, entry_id):
                        return Response({"error": "KPI entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    cursor.execute(
                        """
                        UPDATE dealflow.df_kpi_entries
                        SET
                            kpi_name = %s,
                            kpi_category_id = %s,
                            period_type = %s,
                            currency_id = %s,
                            unit = %s,
                            kpi_order = %s,
                            display_order = %s,
                            q1_value = %s,
                            q2_value = %s,
                            q3_value = %s,
                            q4_value = %s,
                            h1_value = %s,
                            h2_value = %s,
                            annual_y1_value = %s,
                            annual_y2_value = %s,
                            annual_y3_value = %s,
                            annual_y4_value = %s,
                            updated_at = %s
                        WHERE id = %s
                          AND deal_id = %s
                        """,
                        [
                            kpi_name,
                            kpi_category_id,
                            period_type,
                            currency_id,
                            unit,
                            kpi_order,
                            display_order,
                            normalize_numeric_or_none(payload.get("q1_value")),
                            normalize_numeric_or_none(payload.get("q2_value")),
                            normalize_numeric_or_none(payload.get("q3_value")),
                            normalize_numeric_or_none(payload.get("q4_value")),
                            normalize_numeric_or_none(payload.get("h1_value")),
                            normalize_numeric_or_none(payload.get("h2_value")),
                            normalize_numeric_or_none(payload.get("annual_y1_value")),
                            normalize_numeric_or_none(payload.get("annual_y2_value")),
                            normalize_numeric_or_none(payload.get("annual_y3_value")),
                            normalize_numeric_or_none(payload.get("annual_y4_value")),
                            now,
                            str(entry_id),
                            str(deal_id),
                        ],
                    )
                    period_payload = fetch_kpi_period_entry_payload(cursor, deal_id, relation["period_id"], period_type)
        except IntegrityError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated_entry = next((entry for entry in (period_payload or {}).get("entries", []) if str(entry.get("id")) == str(entry_id)), None)
        return Response(updated_entry or {}, status=status.HTTP_200_OK)

    def delete(self, request, deal_id, entry_id, period_id=None):
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    relation = kpi_entry_belongs_to_deal(cursor, deal_id, entry_id)
                    if not relation:
                        return Response({"error": "KPI entry not found."}, status=status.HTTP_404_NOT_FOUND)
                    if period_id and not kpi_entry_belongs_to_period(cursor, deal_id, period_id, entry_id):
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


class DealflowKpiOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, code, color
                FROM dealflow.df_taxonomy_items
                WHERE type = 'kpi_category'
                  AND is_active = TRUE
                ORDER BY display_order ASC NULLS LAST, name ASC
                """
            )
            categories = [
                {
                    "id": row.get("id"),
                    "name": row.get("name") or "",
                    "code": row.get("code") or "",
                    "color": row.get("color"),
                }
                for row in dictfetchall(cursor)
            ]

            cursor.execute(
                """
                SELECT id, name, code
                FROM dealflow.df_taxonomy_items
                WHERE type = 'currency'
                  AND is_active = TRUE
                ORDER BY display_order ASC NULLS LAST, name ASC
                """
            )
            currencies = [
                {
                    "id": row.get("id"),
                    "name": row.get("name") or "",
                    "code": row.get("code") or "",
                }
                for row in dictfetchall(cursor)
            ]

        return Response(
            {
                "period_types": [
                    {"value": "QUARTERLY", "label": "Quarterly"},
                    {"value": "SEMI_ANNUALLY", "label": "Semi-Annually"},
                    {"value": "ANNUALLY", "label": "Annually"},
                ],
                "categories": categories,
                "currencies": currencies,
            },
            status=status.HTTP_200_OK,
        )


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
