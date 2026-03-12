from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.db import connection, transaction, IntegrityError
from django.http import Http404, HttpResponse
from django.utils import timezone
from django.db.models import Sum
from psycopg2 import OperationalError
from rest_framework.decorators import action
from rest_framework import generics, mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from ..models import (
    LimitedPartner, 
    Timeframe,
    LPsOperationType,
    LPsOperationDetails,
    LPsOperationFlowType,
    LPsOperationFlow,
    LPsOperationFlowLPAllocation,
    LPsOperationLPAllocation,
    FundClosing, 
    LPsFundCommitment,
    CapitalAccountKpiCache,
    CapitalAccountAdjustedNav
)

from ..serializers import (
    LPsOperationTypeSerializer,
    LPsOperationDetailsSerializer,
    LPsOperationFlowTypeSerializer,
    LPsOperationFlowSerializer,
    LPsFlowLPAllocationSerializer,
    LPsOperationLPAllocationSerializer,
    FundClosingSerializer,
    LimitedPartnerSerializer,
    LPsFundCommitmentSerializer,
)

from ..services import CapitalAccountService

def _table_columns(table_name: str) -> set[str]:
    with connection.cursor() as cursor:
        desc = connection.introspection.get_table_description(cursor, table_name)
    return {c.name for c in desc}


def _pick_col(cols: set[str], candidates: list[str]) -> str | None:
    for c in candidates:
        if c in cols:
            return c
    return None


def _created_by_int(request) -> int:
    try:
        user = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False):
            uid = getattr(user, "id", None)
            if isinstance(uid, int):
                return uid
            if isinstance(uid, str) and uid.isdigit():
                return int(uid)
    except Exception:
        pass
    return 0  # system


def _to_decimal(v, default=None) -> Decimal | None:
    if v is None or v == "":
        return default
    try:
        if isinstance(v, Decimal):
            return v
        return Decimal(str(v))
    except (InvalidOperation, ValueError, TypeError):
        return default


def _q2(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _q6(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)


def _normalize_fraction(v) -> Decimal:
    """
    Accepts 0.12 or 12 (percent). Returns fraction 0..1
    Clamps to avoid blowing max_digits.
    """
    d = _to_decimal(v, default=Decimal("0"))
    if d < 0:
        return Decimal("0")
    if d <= 1:
        return d
    if d <= 100:
        return d / Decimal("100")
    return Decimal("1")


def _compute_total_amount(input_type, input_amount, input_percentage, commitment_amount, allocation_pct) -> Decimal:
    it = (str(input_type or "")).lower().strip()

    amt = _to_decimal(input_amount, default=None)
    pct = _normalize_fraction(input_percentage)
    commit = _to_decimal(commitment_amount, default=Decimal("0"))
    alloc = _normalize_fraction(allocation_pct)

    if it == "amount":
        return _q2(amt if amt is not None else Decimal("0"))

    if it == "percentage":
        return _q2(commit * pct)

    if amt is not None:
        return _q2(amt)

    return _q2(commit * alloc)


def _yyyymmdd_to_date(n: int) -> date | None:
    try:
        n = int(n)
        y = n // 10000
        m = (n // 100) % 100
        d = n % 100
        return date(y, m, d)
    except Exception:
        return None


def _parse_date_value(v) -> date | None:
    """
    Accept:
      - python date
      - "YYYY-MM-DD"
      - int YYYYMMDD
    """
    if v is None or v == "":
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, (int, float)) and int(v) >= 19000101:
        return _yyyymmdd_to_date(int(v))
    s = str(v).strip()
    if not s:
        return None
    # prefer ISO (frontend sends YYYY-MM-DD)
    try:
        return date.fromisoformat(s[:10])
    except Exception:
        return None


def _insert_operation_details(*, fund_id: int, payload: dict, request) -> int:
    """
    Inserts into lps_operation_details using ONLY columns that actually exist in DB.
    Auto-detects the correct name column.
    Returns created PK.

    ✅ FIXES:
    - Supports DB columns notice_date / due_date (date) OR *_id variants.
    - Ensures total_operation_amount is NEVER NULL (prevents scenario trigger crash).
    - Keeps overall_percentage_of_commitment non-null if schema requires it.
    """
    table = "lps_operation_details"
    cols = _table_columns(table)

    pk_col = _pick_col(cols, ["lps_operation_details_id", "operation_id", "id"])
    if not pk_col:
        raise RuntimeError("Cannot detect PK column for lps_operation_details")

    # IMPORTANT: your DB might NOT have operation_name; we detect the right column.
    name_col = _pick_col(cols, ["operation_name", "name", "operation_label", "label", "operation_title", "title"])
    if not name_col:
        raise RuntimeError("Cannot detect name column for lps_operation_details")

    op_type_col = _pick_col(cols, ["operation_type_id", "op_type_id"])
    fund_col = _pick_col(cols, ["fund_id"])

    if not fund_col:
        raise RuntimeError("lps_operation_details missing fund_id column")
    if not op_type_col:
        raise RuntimeError("lps_operation_details missing operation_type_id column")

    created_at_col = _pick_col(cols, ["created_at"])
    created_by_col = _pick_col(cols, ["created_by"])

    # ✅ IMPORTANT: your DB (per screenshot) uses notice_date + due_date (date)
    notice_col = _pick_col(cols, ["notice_date", "notice_date_id", "notice_id"])
    due_col = _pick_col(cols, ["due_date", "due_date_id", "due_id"])

    # ✅ IMPORTANT: prevent NULL total_operation_amount (breaks trigger for Distribution)
    total_amount_col = _pick_col(cols, ["total_operation_amount", "total_amount", "operation_total_amount"])
    overall_pct_col = _pick_col(cols, ["overall_percentage_of_commitment", "overall_pct_commitment", "overall_pct"])

    values = {}
    values[fund_col] = fund_id

    op_type_id = payload.get("operation_type_id")
    if op_type_id is None:
        op_type = payload.get("operation_type")
        try:
            op_type_id = int(op_type) if op_type is not None else None
        except Exception:
            op_type_id = None
    values[op_type_col] = op_type_id

    values[name_col] = payload.get("operation_name") or payload.get("name") or ""

    # Dates: accept *_date_id or *_date (iso)
    notice_date_id = payload.get("notice_date_id")
    due_date_id = payload.get("due_date_id")
    notice_date = payload.get("notice_date")
    due_date = payload.get("due_date")

    if notice_col:
        if notice_col.endswith("_id"):
            if notice_date_id is not None:
                values[notice_col] = int(notice_date_id)
        else:
            # notice_date (date)
            dt = _parse_date_value(notice_date) or _parse_date_value(notice_date_id)
            if dt is not None:
                values[notice_col] = dt

    if due_col:
        if due_col.endswith("_id"):
            if due_date_id is not None:
                values[due_col] = int(due_date_id)
        else:
            # due_date (date)
            dt = _parse_date_value(due_date) or _parse_date_value(due_date_id)
            if dt is not None:
                values[due_col] = dt

    # ✅ Ensure total_operation_amount is NOT NULL if the column exists
    if total_amount_col:
        values[total_amount_col] = _to_decimal(
            payload.get("total_operation_amount") or payload.get("total_amount") or 0,
            default=Decimal("0"),
        )

    # ✅ Keep overall_percentage_of_commitment safe (some schemas might be NOT NULL)
    if overall_pct_col:
        values[overall_pct_col] = _to_decimal(
            payload.get("overall_percentage_of_commitment") or payload.get("overall_pct") or 0,
            default=Decimal("0"),
        )

    now = timezone.now()
    if created_at_col:
        values[created_at_col] = now
    if created_by_col:
        values[created_by_col] = _created_by_int(request)

    insert_cols = list(values.keys())
    insert_vals = [values[c] for c in insert_cols]
    placeholders = ", ".join(["%s"] * len(insert_cols))

    sql = f"""
        INSERT INTO {table} ({", ".join(insert_cols)})
        VALUES ({placeholders})
        RETURNING {pk_col}
    """

    with connection.cursor() as cursor:
        cursor.execute(sql, insert_vals)
        row = cursor.fetchone()

    return int(row[0])

class FundClosingDetail(generics.RetrieveUpdateDestroyAPIView):
    # Changed to RetrieveUpdateDestroyAPIView in case you want to edit 
    # the description later via the Detail endpoint.
    serializer_class = FundClosingSerializer

    def get_queryset(self):
        return FundClosing.objects.filter(fund_id=self.kwargs.get('fund_id'))
    
class FundClosingListCreate(generics.ListCreateAPIView):
    serializer_class = FundClosingSerializer

    def get_queryset(self):
        # Optimized filtering using the URL kwarg
        fund_id = self.kwargs.get('fund_id')
        return FundClosing.objects.filter(fund_id=fund_id)

    def perform_create(self, serializer):
        # Automatically inject the fund_id from the URL into the save method
        # Ensure 'description' is included in your Serializer fields to be saved
        fund_id = self.kwargs.get('fund_id')
        serializer.save(fund_id=fund_id)

class LimitedPartnerViewSet(ModelViewSet):
    queryset = LimitedPartner.objects.filter(is_deleted=False)
    serializer_class = LimitedPartnerSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])

class LPsFundCommitmentViewSet(viewsets.ModelViewSet):
    serializer_class = LPsFundCommitmentSerializer

    def get_queryset(self):
        fund_id = self.kwargs.get('fund_id') or self.request.query_params.get('fund_id')
        qs = LPsFundCommitment.objects.filter(is_deleted=False)
        if fund_id:
            qs = qs.filter(fund_id=fund_id)
        return qs

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

class OperationTypeList(generics.ListAPIView):
    # ✅ FIX: remove ONLY "Equalization" (keep "Equalization/Capital Call" if it exists)
    queryset = LPsOperationType.objects.exclude(name__iexact="Equalization")
    serializer_class = LPsOperationTypeSerializer


class FlowTypeList(generics.ListAPIView):
    queryset = LPsOperationFlowType.objects.all()
    serializer_class = LPsOperationFlowTypeSerializer


class LPsOperationDetailsViewSet(viewsets.ModelViewSet):
    serializer_class = LPsOperationDetailsSerializer
    queryset = LPsOperationDetails.objects.all()
    lookup_field = 'pk'

    def get_queryset(self):
        return self.queryset.filter(fund_id=self.kwargs.get('fund_id')).order_by('-pk')

    def perform_create(self, serializer):
        return serializer.save(fund_id=self.kwargs.get('fund_id'))

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        return Response(
            {"lps_operation_details_id": instance.lps_operation_details_id},
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            {"lps_operation_details_id": instance.lps_operation_details_id},
            status=status.HTTP_200_OK
        )

class LPsOperationFlowViewSet(viewsets.ModelViewSet):
    serializer_class = LPsOperationFlowSerializer
    queryset = LPsOperationFlow.objects.all()
    lookup_field = 'pk'

    def get_queryset(self):
        parent_id = self.kwargs.get("lps_operation_details_id")
        return (
            self.queryset
            .filter(lps_operation_details_id=parent_id)
            .prefetch_related(
                "lp_allocations",
                "lp_allocations__lp_id__fund_commitments"  # ✅ Use related_name here
            )
            .order_by("operation_flow_id")
        )

    def perform_create(self, serializer):
        self._process_and_save(serializer)

    def perform_update(self, serializer):
        self._process_and_save(serializer)

    def _process_and_save(self, serializer):
        vd = serializer.validated_data
        # Extract the renamed ID from kwargs
        parent_id = self.kwargs.get("lps_operation_details_id")

        safe_alloc = _q6(_normalize_fraction(vd.get("allocation_percentage_of_commitment")))
        safe_pct = _q6(_normalize_fraction(vd.get("input_percentage")))

        computed_total = _compute_total_amount(
            input_type=vd.get("input_type"),
            input_amount=vd.get("input_amount"),
            input_percentage=safe_pct,
            commitment_amount=vd.get("commitment_amount"),
            allocation_pct=safe_alloc,
        )

        # Django FK naming logic: 
        # Since your field is lps_operation_details_id, use _id_id to pass a raw integer
        serializer.save(
            lps_operation_details_id_id=int(parent_id),
            created_at=timezone.now() if self.action == 'create' else serializer.instance.created_at,
            created_by=_created_by_int(self.request),
            allocation_percentage_of_commitment=safe_alloc,
            input_percentage=safe_pct if vd.get("input_type") == "percentage" else vd.get("input_percentage"),
            computed_total_amount=computed_total,
        )

class LPsFlowLPAllocationViewSet(viewsets.ModelViewSet):
    serializer_class = LPsFlowLPAllocationSerializer
    queryset = LPsOperationFlowLPAllocation.objects.all()
    lookup_field = 'pk'

    def get_queryset(self):
        # Nested filtering: Parent -> operation_flow_id
        flow_id = self.kwargs.get("operation_flow_id")
        return self.queryset.filter(operation_flow_id=flow_id).order_by("lp_flow_allocation_id")

    def perform_create(self, serializer):
        self._process_allocation(serializer)

    def perform_update(self, serializer):
        self._process_allocation(serializer)

    def _process_allocation(self, serializer):
        flow_id = self.kwargs.get("operation_flow_id")
        instance = LPsOperationFlowLPAllocation(
            operation_flow_id_id=int(flow_id),
            lp_id_id=int(serializer.validated_data["lp_id_id"]),
            allocated_amount=serializer.validated_data["allocated_amount"],
        )
        instance.save()
        serializer.instance = instance

class LPsOperationLPAllocationViewSet(viewsets.ModelViewSet):
    serializer_class = LPsOperationLPAllocationSerializer
    queryset = LPsOperationLPAllocation.objects.all()
    lookup_field = 'pk'

    @action(detail=False, methods=['get'], url_path='lp-allocations')
    def list_by_fund(self, request, fund_id=None, *args, **kwargs):
        allocations = (
            LPsOperationLPAllocation.objects
            .select_related("lps_operation_details")
            .filter(
                lps_operation_details_id__fund_id=fund_id,
                is_deleted=False
            )
            .order_by('lp_id', '-lps_operation_details_id__lps_operation_details_id')
        )
        serializer = self.get_serializer(allocations, many=True)
        return Response(serializer.data)
    
    def get_queryset(self):
        op_id = self.kwargs.get("lps_operation_details")
        return (
            self.queryset
            .select_related("lps_operation_details")
            .filter(
                lps_operation_details_id_id=op_id,
                is_deleted=False
            )
            .order_by("lp_id")
        )

    def perform_create(self, serializer):
        op_id_raw = self.kwargs.get("lps_operation_details_id")
        data = serializer.validated_data

        existing = LPsOperationLPAllocation.objects.filter(
            lp_id=data.get("lp_id"),
            share_class_id=data.get("share_class_id"),
            lps_operation_details_id=op_id_raw 
        ).first()

        if existing:
            existing.capital_call = (existing.capital_call or 0) + data.get("capital_call", 0)
            existing.called_percentage = (existing.called_percentage or 0) + data.get("called_percentage", 0)
            existing.shares_issued = (existing.shares_issued or 0) + data.get("shares_issued", 0)
            existing.commitment_amount = data.get("commitment_amount", existing.commitment_amount)
            
            existing.lps_operation_details_id = op_id_raw
            existing.save()
            serializer.instance = existing
        else:
            serializer.save(
                lps_operation_details_id=op_id_raw,
                created_by=_created_by_int(self.request)
            )


    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request, *args, **kwargs):
        op_id = self.kwargs.get("lps_operation_details_id")
        
        summary_data = (
            LPsOperationFlowLPAllocation.objects
            .filter(operation_flow_id__lps_operation_details_id_id=op_id)
            .values('lp_id', 'lp_id__name')
            .annotate(total_allocated=Sum('allocated_amount'))
            .order_by('lp_id')
        )
        return Response(summary_data)

# class LPsOperationFlowShareClassAllocationViewSet(viewsets.ModelViewSet):
#     """
#     POST /api/operations/<operation_id>/allocations/

#     IMPORTANT FIX:
#     - drop 'operation' from payload and make it optional to avoid FK lookup
#     - bind operation_id from URL always
#     """
#     serializer_class = LPsOperationFlowShareClassAllocationSerializer

#     def get_queryset(self):
#         qs = LPsOperationFlowShareClassAllocation.objects.all()
#         operation_id = self.kwargs.get("operation_id")
#         if operation_id is not None:
#             qs = qs.filter(operation_id=operation_id)
#         return qs.order_by("operation_allocation_id")

#     def create(self, request, *args, **kwargs):
#         data = request.data.copy()
#         if "operation" in data:
#             data.pop("operation")

#         serializer = self.get_serializer(data=data)

#         if "operation" in serializer.fields:
#             serializer.fields["operation"].required = False
#             serializer.fields["operation"].allow_null = True

#         serializer.is_valid(raise_exception=True)
#         self.perform_create(serializer)

#         headers = self.get_success_headers(serializer.data)
#         return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

#     def perform_create(self, serializer):
#         operation_id = self.kwargs.get("operation_id")
#         if operation_id is None:
#             raise Http404("operation_id is required")

#         serializer.save(
#             operation_id=int(operation_id),
#             created_at=timezone.now(),
#             created_by=_created_by_int(self.request),
#         )


# class OperationFullCreate(APIView):
#     """
#     POST /api/funds/<fund_id>/operations/full-create/
#     Creates operation (lps_operation_details) then flows + allocations.
#     """

#     def post(self, request, fund_id: int):
#         serializer = OperationFullCreateSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = serializer.validated_data

#         now = timezone.now()
#         created_by = _created_by_int(request)

#         # raw for ISO date aliases / safe defaults
#         raw = request.data if isinstance(request.data, dict) else {}

#         with transaction.atomic():
#             op_id = _insert_operation_details(
#                 fund_id=int(fund_id),
#                 payload={
#                     "operation_type_id": data["operation_type_id"],
#                     "operation_name": data["operation_name"],
#                     "notice_date_id": data.get("notice_date_id") or raw.get("notice_date_id"),
#                     "due_date_id": data.get("due_date_id") or raw.get("due_date_id"),
#                     "notice_date": raw.get("notice_date"),
#                     "due_date": raw.get("due_date"),
#                     # ✅ ensure NOT NULL for trigger
#                     "total_operation_amount": raw.get("total_operation_amount") or raw.get("total_amount") or 0,
#                     "overall_percentage_of_commitment": raw.get("overall_percentage_of_commitment") or raw.get("overall_pct") or 0,
#                 },
#                 request=request,
#             )

#             created_flow_ids = []

#             for f in data["flows"]:
#                 safe_alloc = _q6(_normalize_fraction(f.get("allocation_percentage_of_commitment", 0)))
#                 safe_pct = _q6(_normalize_fraction(f.get("input_percentage")))

#                 computed_total = _compute_total_amount(
#                     input_type=f.get("input_type"),
#                     input_amount=f.get("input_amount"),
#                     input_percentage=safe_pct,
#                     commitment_amount=f.get("commitment_amount"),
#                     allocation_pct=safe_alloc,
#                 )

#                 flow = LPsOperationFlow.objects.create(
#                     operation_id=op_id,
#                     flow_type_id=f["flow_type_id"],
#                     flow_name=f["flow_name"],
#                     input_type=f["input_type"],
#                     input_amount=f.get("input_amount"),
#                     input_percentage=safe_pct if f.get("input_type") == "percentage" else f.get("input_percentage"),
#                     allocation_percentage_of_commitment=safe_alloc,
#                     commitment_amount=f.get("commitment_amount", 0),
#                     computed_total_amount=computed_total,
#                     created_at=now,
#                     created_by=created_by,
#                 )
#                 created_flow_ids.append(flow.operation_flow_id)

#                 allocations = f.get("allocations", []) or []
#                 if allocations:
#                     objs = []
#                     for a in allocations:
#                         objs.append(
#                             LPsOperationFlowShareClassAllocation(
#                                 operation_id=op_id,
#                                 operation_flow_id=flow.operation_flow_id,
#                                 lp_id=a["lp_id"],
#                                 share_class_id=a["share_class_id"],
#                                 commitment_amount=a["commitment_amount"],
#                                 capital_call=a["capital_call"],
#                                 called_percentage=_q6(_normalize_fraction(a["called_percentage"])),
#                                 shares_issued=a["shares_issued"],
#                                 created_at=now,
#                                 created_by=created_by,
#                             )
#                         )
#                     LPsOperationFlowShareClassAllocation.objects.bulk_create(objs)

#             return Response(
#                 {"operation_id": op_id, "created_flow_ids": created_flow_ids},
#                 status=status.HTTP_201_CREATED,
#             )


# ======================================================
# STEP 3 (Preview + Confirm) - NEW
# ======================================================

def _dec(x, default=Decimal("0")) -> Decimal:
    if x is None or x == "":
        return default
    try:
        return Decimal(str(x))
    except Exception:
        return default


class OperationStep3Preview(APIView):
    """
    GET /api/operations/<operation_id>/step3-preview/

    ✅ REQUIRED (your ask):
      - For Distribution + Capital call:
          Before = AFTER snapshot from the latest previous operation of the SAME operation_type_id
                  (this equals aggregation of all previous ops of that type)
          Current = SUM from lps_operation_flow_share_class_allocations (this op, is_deleted=false)
          After = Before + Current

      - For Equalization (percentage based):
          Before% = snapshot called_percentage from latest previous SAME-TYPE operation
          Current% = SUM(called_percentage) from this op allocations
          After% = clamp(Before% + Current%, 0..1)
          Amounts are derived as commitment * pct so existing UI can still show €
    """

    def get(self, request, operation_id: int):
        det_cols = _table_columns("lps_operation_details")
        pk_col = _pick_col(det_cols, ["lps_operation_details_id", "operation_id", "id"])
        fund_col = _pick_col(det_cols, ["fund_id"])
        op_type_col = _pick_col(det_cols, ["operation_type_id", "op_type_id", "operation_type"])
        opno_col = _pick_col(det_cols, ["operation_number", "operation_sequence_number", "operation_seq", "sequence_number"])

        if not pk_col or not fund_col or not op_type_col:
            return Response({"detail": "Cannot read lps_operation_details schema."}, status=500)

        alloc_cols = _table_columns("lps_operation_flow_share_class_allocations")
        has_alloc_is_deleted = "is_deleted" in alloc_cols

        with connection.cursor() as cur:
            if opno_col:
                cur.execute(
                    f"SELECT {fund_col}, {op_type_col}, {opno_col} FROM lps_operation_details WHERE {pk_col} = %s",
                    [operation_id],
                )
                row = cur.fetchone()
                if not row:
                    return Response({"detail": "Operation not found."}, status=404)
                fund_id, cur_type_id, op_no = row[0], row[1], row[2]
            else:
                cur.execute(
                    f"SELECT {fund_col}, {op_type_col} FROM lps_operation_details WHERE {pk_col} = %s",
                    [operation_id],
                )
                row = cur.fetchone()
                if not row:
                    return Response({"detail": "Operation not found."}, status=404)
                fund_id, cur_type_id, op_no = row[0], row[1], None

            op_type_name = ""
            try:
                cur.execute("SELECT name FROM lps_operation_type WHERE operation_type_id = %s", [cur_type_id])
                rr = cur.fetchone()
                op_type_name = (rr[0] if rr else "") or ""
            except Exception:
                op_type_name = ""

            is_equalization = "equalization" in str(op_type_name).strip().lower()

            prev_same_type_op_id = None
            if opno_col and op_no is not None:
                cur.execute(
                    f"""
                    SELECT MAX({pk_col})
                    FROM lps_operation_details
                    WHERE {fund_col} = %s
                      AND {op_type_col} = %s
                      AND {opno_col} < %s
                    """,
                    [fund_id, cur_type_id, op_no],
                )
                r = cur.fetchone()
                prev_same_type_op_id = r[0] if r and r[0] is not None else None
            else:
                cur.execute(
                    f"""
                    SELECT MAX({pk_col})
                    FROM lps_operation_details
                    WHERE {fund_col} = %s
                      AND {op_type_col} = %s
                      AND {pk_col} < %s
                    """,
                    [fund_id, cur_type_id, operation_id],
                )
                r = cur.fetchone()
                prev_same_type_op_id = r[0] if r and r[0] is not None else None

            cur.execute(
                """
                SELECT lp_id, share_class_id, COALESCE(commitment_amount,0)
                FROM lps_fund_commitments
                WHERE fund_id = %s AND COALESCE(is_deleted,false) = false
                """,
                [fund_id],
            )
            commitments = cur.fetchall()

            base = {}
            for lp_id, sc_id, commit_amt in commitments:
                key = f"{int(lp_id)}:{int(sc_id)}"
                base[key] = {
                    "lp_id": int(lp_id),
                    "share_class_id": int(sc_id),
                    "commitment_amount": _dec(commit_amt),
                }

            before_map = {}
            if prev_same_type_op_id:
                cur.execute(
                    """
                    SELECT lp_id, share_class_id,
                           COALESCE(capital_call,0) AS called,
                           COALESCE(called_percentage,0) AS pct,
                           COALESCE(shares_issued,0) AS shares
                    FROM lps_operation_lp_allocations
                    WHERE lps_operation_details_id = %s
                      AND COALESCE(is_deleted,false) = false
                    """,
                    [prev_same_type_op_id],
                )
                for lp_id, sc_id, called, pct, shares in cur.fetchall():
                    key = f"{int(lp_id)}:{int(sc_id)}"
                    before_map[key] = {
                        "before_called": _dec(called),
                        "before_pct": _dec(pct),
                        "before_shares": _dec(shares),
                    }

            alloc_not_deleted = "AND COALESCE(is_deleted,false) = false" if has_alloc_is_deleted else ""
            cur.execute(
                f"""
                SELECT lp_id, share_class_id,
                       COALESCE(SUM(capital_call),0) AS called,
                       COALESCE(SUM(called_percentage),0) AS pct_sum,
                       COALESCE(SUM(shares_issued),0) AS shares
                FROM lps_operation_flow_share_class_allocations
                WHERE operation_id = %s
                {alloc_not_deleted}
                GROUP BY lp_id, share_class_id
                """,
                [operation_id],
            )
            current_map = {}
            for lp_id, sc_id, called, pct_sum, shares in cur.fetchall():
                key = f"{int(lp_id)}:{int(sc_id)}"
                current_map[key] = {
                    "current_called": _dec(called),
                    "current_pct": _dec(pct_sum),
                    "current_shares": _dec(shares),
                }

        all_keys = set(base.keys()) | set(before_map.keys()) | set(current_map.keys())

        def _clamp01(d: Decimal) -> Decimal:
            if d < 0:
                return Decimal("0")
            if d > 1:
                return Decimal("1")
            return d

        by_key = {}
        for key in all_keys:
            commit = base.get(key, {}).get("commitment_amount", Decimal("0"))

            b_called = before_map.get(key, {}).get("before_called", Decimal("0"))
            b_pct = before_map.get(key, {}).get("before_pct", Decimal("0"))
            b_shares = before_map.get(key, {}).get("before_shares", Decimal("0"))

            c_called = current_map.get(key, {}).get("current_called", Decimal("0"))
            c_pct = current_map.get(key, {}).get("current_pct", Decimal("0"))
            c_shares = current_map.get(key, {}).get("current_shares", Decimal("0"))

            if is_equalization:
                before_pct = _clamp01(_dec(b_pct, Decimal("0")))
                current_pct = _dec(c_pct, Decimal("0"))
                after_pct = _clamp01(before_pct + current_pct)

                before_called = (commit * before_pct) if commit > 0 else Decimal("0")
                after_called = (commit * after_pct) if commit > 0 else Decimal("0")

                before_shares = b_shares
                after_shares = b_shares + c_shares
            else:
                before_called = _dec(b_called, Decimal("0"))
                after_called = before_called + _dec(c_called, Decimal("0"))

                before_pct = (before_called / commit) if commit > 0 else Decimal("0")
                after_pct = (after_called / commit) if commit > 0 else Decimal("0")

                before_shares = b_shares
                after_shares = b_shares + c_shares

            undrawn = commit - after_called

            lp_id, sc_id = key.split(":")
            by_key[key] = {
                "lp_id": int(lp_id),
                "share_class_id": int(sc_id),

                "commitment_amount": str(commit),

                "before_called": str(before_called),
                "before_pct": str(_q6(before_pct)),
                "before_shares": str(before_shares),

                "after_called": str(after_called),
                "after_pct": str(_q6(after_pct)),
                "after_shares": str(after_shares),

                "undrawn": str(undrawn),
            }

        return Response(
            {
                "operation_id": int(operation_id),
                "prev_operation_id": int(prev_same_type_op_id) if prev_same_type_op_id else None,
                "by_key": by_key,
            },
            status=status.HTTP_200_OK,
        )


class OperationStep3Confirm(APIView):
    """
    POST /api/operations/<operation_id>/lp-allocations/confirm/

    Persists AFTER rows into lps_operation_lp_allocations (soft-delete old, insert new).
    """

    def post(self, request, operation_id: int):
        now = timezone.now()
        created_by = _created_by_int(request)

        alloc_cols = _table_columns("lps_operation_lp_allocations")

        op_col = "lps_operation_details_id" if "lps_operation_details_id" in alloc_cols else None
        lp_col = "lp_id" if "lp_id" in alloc_cols else None
        sc_col = "share_class_id" if "share_class_id" in alloc_cols else None

        if not (op_col and lp_col and sc_col):
            return Response({"detail": "lps_operation_lp_allocations schema missing required cols."}, status=500)

        has_commit = "commitment_amount" in alloc_cols
        has_called = "capital_call" in alloc_cols
        has_pct = "called_percentage" in alloc_cols
        has_shares = "shares_issued" in alloc_cols
        has_is_deleted = "is_deleted" in alloc_cols
        has_created_at = "created_at" in alloc_cols
        has_created_by = "created_by" in alloc_cols

        preview = OperationStep3Preview().get(request, operation_id).data
        by_key = preview.get("by_key", {}) or {}

        with transaction.atomic():
            with connection.cursor() as cur:
                if has_is_deleted:
                    cur.execute(
                        f"""
                        UPDATE lps_operation_lp_allocations
                        SET is_deleted = true
                        WHERE {op_col} = %s AND COALESCE(is_deleted,false) = false
                        """,
                        [operation_id],
                    )

                insert_cols = [op_col, lp_col, sc_col]
                if has_commit:
                    insert_cols.append("commitment_amount")
                if has_called:
                    insert_cols.append("capital_call")
                if has_pct:
                    insert_cols.append("called_percentage")
                if has_shares:
                    insert_cols.append("shares_issued")
                if has_is_deleted:
                    insert_cols.append("is_deleted")
                if has_created_at:
                    insert_cols.append("created_at")
                if has_created_by:
                    insert_cols.append("created_by")

                placeholders = ", ".join(["%s"] * len(insert_cols))
                sql = f"""
                    INSERT INTO lps_operation_lp_allocations ({", ".join(insert_cols)})
                    VALUES ({placeholders})
                """

                for _, v in by_key.items():
                    vals = [int(operation_id), int(v["lp_id"]), int(v["share_class_id"])]

                    if has_commit:
                        vals.append(_dec(v.get("commitment_amount")))
                    if has_called:
                        vals.append(_dec(v.get("after_called")))
                    if has_pct:
                        vals.append(_dec(v.get("after_pct")))
                    if has_shares:
                        vals.append(_dec(v.get("after_shares")))
                    if has_is_deleted:
                        vals.append(False)
                    if has_created_at:
                        vals.append(now)
                    if has_created_by:
                        vals.append(created_by)

                    cur.execute(sql, vals)

        return Response({"ok": True}, status=status.HTTP_200_OK)

class CapitalAccountStatementKPIView(APIView):

    def _resolve_timeframe(self, fund_id, timeframe_id):
        if not timeframe_id:
            latest_tf = (
                Timeframe.objects
                .filter(fund_id=fund_id)
                .order_by("-date")
                .first()
            )

            if not latest_tf:
                return None, Response(
                    {"error": "No timeframes found for this fund."},
                    status=status.HTTP_404_NOT_FOUND
                )

            return latest_tf.timeframe_id, None

        try:
            return int(timeframe_id), None
        except ValueError:
            return None, Response(
                {"error": "timeframe_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _get_or_compute(self, fund_id, timeframe_id):
        with transaction.atomic():
            cached = (
                CapitalAccountKpiCache.objects
                .select_for_update()
                .filter(fund_id=fund_id, timeframe_id=timeframe_id)
                .first()
            )

            if cached:
                return cached.payload

            service = CapitalAccountService(
                fund_id=fund_id,
                timeframe_id=timeframe_id
            )
            result = service.compute()

            CapitalAccountKpiCache.objects.create(
                fund_id=fund_id,
                timeframe_id=timeframe_id,
                payload=result
            )

            return result

    def get(self, request, fund_id):
        timeframe_id = request.query_params.get("timeframe_id")

        timeframe_id, error = self._resolve_timeframe(fund_id, timeframe_id)
        if error:
            return error

        result = self._get_or_compute(fund_id, timeframe_id)

        adj = CapitalAccountAdjustedNav.objects.filter(
            fund_id_id=fund_id,
            timeframe_id_id=timeframe_id
        ).first()
        result["adjusted_nav"] = adj.adjusted_nav if adj else {}

        return Response(result, status=status.HTTP_200_OK)
    
    def post(self, request, fund_id):
        timeframe_id = request.data.get("timeframe_id")
        adjusted_nav = request.data.get("adjusted_nav")  # dict: { "total": 123, "Class A": 456, ... }

        if not timeframe_id:
            return Response({"error": "timeframe_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        if adjusted_nav is None:
            return Response({"error": "adjusted_nav is required."}, status=status.HTTP_400_BAD_REQUEST)

        CapitalAccountAdjustedNav.objects.update_or_create(
            fund_id_id=fund_id,
            timeframe_id_id=timeframe_id,
            defaults={"adjusted_nav": adjusted_nav}
        )

        return Response({"ok": True}, status=status.HTTP_200_OK)

class BulkCapitalAccountStatementKPIView(APIView):

    def post(self, request):
        fund_ids = request.data.get("fund_ids", [])
        timeframe_id = request.data.get("timeframe_id")

        if not isinstance(fund_ids, list) or not fund_ids:
            return Response(
                {"error": "fund_ids must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )

        empty = {"error": "No timeframes found for this fund."}
        resolved_timeframes = {}

        if not timeframe_id:
            latest_tfs = (
                Timeframe.objects
                .filter(fund_id__in=fund_ids)
                .order_by("fund_id", "-date")
                .distinct("fund_id")
            )
            for tf in latest_tfs:
                resolved_timeframes[tf.fund_id] = tf.timeframe_id
        else:
            resolved_timeframes = {fid: int(timeframe_id) for fid in fund_ids}

        result_map = {}

        for fund_id in fund_ids:
            if fund_id not in resolved_timeframes:
                result_map[str(fund_id)] = empty

        pairs = [(fid, resolved_timeframes[fid]) for fid in resolved_timeframes]

        cached_rows = CapitalAccountKpiCache.objects.filter(
            fund_id__in=[p[0] for p in pairs]
        )
        cache_map = {
            (row.fund_id, row.timeframe_id): row.payload
            for row in cached_rows
        }

        for fund_id, tf_id in pairs:
            if (fund_id, tf_id) in cache_map:
                result_map[str(fund_id)] = cache_map[(fund_id, tf_id)]
                continue

            try:
                service = CapitalAccountService(fund_id=fund_id, timeframe_id=tf_id)
                result = service.compute()

                obj, created = CapitalAccountKpiCache.objects.get_or_create(
                    fund_id=fund_id,
                    timeframe_id=tf_id,
                    defaults={"payload": result}
                )
                result_map[str(fund_id)] = obj.payload if not created else result

            except Exception as e:
                result_map[str(fund_id)] = {"error": str(e)}

        return Response(result_map, status=status.HTTP_200_OK)