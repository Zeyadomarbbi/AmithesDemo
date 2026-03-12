from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime
from django.http import JsonResponse
from django.db import connection
from django.views.decorators.http import require_GET
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.utils import timezone
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from ..models.core import *
from ..serializers.core import *

def dictfetchall(cursor):
    cols = [col[0] for col in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


@require_GET
def funds_list(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT fund_id, legal_name, short_name, currency_id, phase_id, legal_form,
                   management_company, fund_strategy, created_at, updated_at
            FROM dim_fund
            ORDER BY fund_id ASC
        """)
        data = dictfetchall(cursor)
    return JsonResponse(data, safe=False)


@require_GET
def fund_detail(request, fund_id: int):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT fund_id, legal_name, short_name, formation_date_id, currency_id, phase_id,
                   legal_form, management_company, fund_strategy, created_at, updated_at
            FROM dim_fund
            WHERE fund_id = %s
        """, [fund_id])
        rows = dictfetchall(cursor)

    if not rows:
        return JsonResponse({"detail": "Fund not found"}, status=404)

    return JsonResponse(rows[0], safe=False)


# ✅ management fee configs per fund
@require_GET
def management_fee_configs(request, fund_id: int):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                config_id,
                fund_id,
                phase_id,
                date_from,
                date_until,
                created_at
            FROM dim_management_fee_config
            WHERE fund_id = %s
            ORDER BY date_from ASC, config_id ASC
        """, [fund_id])

        data = dictfetchall(cursor)

    return JsonResponse(data, safe=False)


# ✅ management fee rates per fund
@require_GET
def management_fee_rates(request, fund_id: int):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                c.config_id,
                c.fund_id,
                c.phase_id,
                c.date_from,
                c.date_until,

                r.operation_id AS fee_rate_id,
                r.share_class_id,
                sc.share_class_name,
                r.rate,
                r.created_at AS rate_created_at

            FROM dim_management_fee_config c
            JOIN fact_management_fee_rates r
              ON r.config_id = c.config_id
            LEFT JOIN dim_share_class sc
              ON sc.share_class_id = r.share_class_id

            WHERE c.fund_id = %s
            ORDER BY c.date_from ASC, c.config_id ASC, r.operation_id ASC
        """, [fund_id])

        data = dictfetchall(cursor)

    return JsonResponse(data, safe=False)


# ✅ NEW: closing periods per fund (for your period dropdown)
@require_GET
def closing_periods(request, fund_id: int):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                period_id,
                fund_id,
                date_id,
                period_name
            FROM dim_closing_period
            WHERE fund_id = %s
            ORDER BY date_id DESC, period_id DESC
        """, [fund_id])

        data = dictfetchall(cursor)

    return JsonResponse(data, safe=False)

@require_GET
def lp_register(request, fund_id: int):
    period_id = request.GET.get("period_id")

    with connection.cursor() as cursor:
        # if period not provided -> pick latest period for this fund
        if not period_id:
            cursor.execute("""
                SELECT period_id
                FROM dim_closing_period
                WHERE fund_id = %s
                ORDER BY date_id DESC, period_id DESC
                LIMIT 1
            """, [fund_id])
            row = cursor.fetchone()
            if not row:
                return JsonResponse(
                    {"detail": "No closing period found for this fund"},
                    status=404
                )
            period_id = row[0]

        # LP register dataset (one row per LP per share class per period)
        cursor.execute("""
            SELECT
                lp.lp_id,
                lp.name AS lp_name,

                sc.share_class_id,
                sc.share_class_name,

                cp.period_id,
                cp.period_name,

                cur.currency_id,
                cur.currency_name,
                cur.currency_symbol,

                f.commitment_amount,

                CASE
                  WHEN SUM(f.commitment_amount) OVER () = 0 THEN NULL
                  ELSE (f.commitment_amount / SUM(f.commitment_amount) OVER ())
                END AS ownership_pct

            FROM fact_lp_commitments f
            JOIN dim_limited_partner lp
              ON lp.lp_id = f.lp_id
            JOIN dim_share_class sc
              ON sc.share_class_id = f.share_class_id
            JOIN dim_closing_period cp
              ON cp.period_id = f.period_id
            JOIN dim_currency cur
              ON cur.currency_id = f.currency_id

            WHERE f.fund_id = %s
              AND f.period_id = %s

            ORDER BY lp.name ASC, sc.share_class_name ASC
        """, [fund_id, period_id])

        data = dictfetchall(cursor)

    return JsonResponse(
        {
            "fund_id": int(fund_id),
            "period_id": int(period_id),
            "rows": data
        },
        safe=False
    )

class FundViewSet(ModelViewSet):
    queryset = Fund.objects.select_related('currency').filter(is_deleted=False)
    serializer_class = FundSerializer
    lookup_field = "fund_id"

    def perform_create(self, serializer):
        """Override to add created_by from request"""
        user_name = "test"
        serializer.save(created_by=user_name)

    def perform_update(self, serializer):
        """Override to set updated_at"""
        serializer.save(updated_at=timezone.now())

    def destroy(self, request, *args, **kwargs):
        """Soft delete instead of hard delete"""
        fund = self.get_object()
        fund.is_deleted = True
        fund.updated_at = timezone.now()
        fund.save(update_fields=['is_deleted', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class FundTimeframeListView(APIView):
    def get(self, request, fund_id, pk=None):
        # 1. Fetch specific timeframe
        if pk:
            timeframe = get_object_or_404(Timeframe, pk=pk, fund_id=fund_id)
            serializer = TimeframeSerializer(timeframe)
            return Response(serializer.data)
        
        # 2. Fetch all timeframes for the fund
        timeframes = Timeframe.objects.filter(fund_id=fund_id).order_by('-date')
        serializer = TimeframeSerializer(timeframes, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        serializer = TimeframeSerializer(data=request.data)
        if serializer.is_valid():
            # Injects fund_id; model.save() handles year/quarter calculation
            serializer.save(fund_id=fund_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, fund_id, pk):
        timeframe = get_object_or_404(Timeframe, pk=pk, fund_id=fund_id)
        serializer = TimeframeSerializer(timeframe, data=request.data)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        print("VALIDATION ERRORS:", serializer.errors)  # add this
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, fund_id, pk):
        """Handle Partial Updates (e.g., just name)"""
        timeframe = get_object_or_404(Timeframe, pk=pk, fund_id=fund_id)
        serializer = TimeframeSerializer(timeframe, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, fund_id, pk):
        """Handle Deletion"""
        timeframe = get_object_or_404(Timeframe, pk=pk, fund_id=fund_id)
        timeframe.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ShareClassView(APIView):
    """
    Handles both:
    - /funds/<fund_id>/share-classes/          -> GET all / POST new
    - /funds/<fund_id>/share-classes/<id>/     -> GET one / PUT / DELETE
    """

    def get_queryset(self, fund_id, share_class_id=None):
        qs = ShareClass.objects.filter(fund_id=fund_id, is_deleted=False)
        if share_class_id:
            qs = qs.filter(share_class_id=share_class_id)
        return qs

    def get(self, request, fund_id, share_class_id=None):
        qs = self.get_queryset(fund_id, share_class_id)
        if share_class_id:
            obj = get_object_or_404(qs)
            serializer = ShareClassSerializer(obj, context={'request': request})
        else:
            serializer = ShareClassSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, fund_id, share_class_id=None):
        if share_class_id:
            return Response({"detail": "POST not allowed on single resource"}, status=405)

        fund = get_object_or_404(Fund, fund_id=fund_id)
        user_id = request.user.id if request.user.is_authenticated else 1

        serializer = ShareClassSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(fund=fund, created_by=user_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, fund_id, share_class_id):
        obj = get_object_or_404(self.get_queryset(fund_id, share_class_id))
        serializer = ShareClassSerializer(obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, fund_id, share_class_id):
        obj = get_object_or_404(self.get_queryset(fund_id, share_class_id))
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class FundManFeeCommitmentYearRetrieveView(generics.RetrieveAPIView):
    queryset = FundManFeeCommitmentYear.objects.all()
    serializer_class = FundManFeeCommitmentYearSerializer
    lookup_field = 'fund' # We look up by fund_id