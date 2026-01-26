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
from .utils import get_or_create_dim_date
from .models import *
from .serializers import *

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


# ✅ NEW: LP Register rows per fund + per period
# - pass ?period_id=123
# - if period_id is not provided, we automatically take the latest period by max(date_id)
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


class CurrencyListView(APIView):
    def get(self, request):
        currencies = DimCurrency.objects.all().order_by('currency_name')
        # Simple list return or use a basic serializer
        data = [
            {
                "id": c.currency_id, 
                "name": c.currency_name, 
                "code": c.currency_code,
                "symbol": c.currency_symbol
            } for c in currencies
        ]
        return Response(data)
    
class PhaseListView(APIView):
    """
    GET: Fetch all available fund phases for dropdowns.
    """
    def get(self, request):
        phases = DimPhase.objects.all().order_by('phase_id')
        serializer = PhaseSerializer(phases, many=True)
        return Response(serializer.data)

class FundListView(APIView):
    """
    STEP 1: INITIALIZATION
    Only accepts: legal_name, short_name, formation_date, currency_id.
    """
    def get(self, request):
        # We fetch everything and join related tables to populate the serializer's extra fields
        funds = DimFund.objects.select_related(
            'formation_date', 
            'phase', 
            'currency'
        ).all().order_by("-created_at")
        
        # The serializer now includes ALL fields defined above
        serializer = FundSerializer(funds, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        
        # 1. Parsing the Date
        try:
            # FIX: Changed format from "%d/%m/%Y" to "%Y-%m-%d"
            dt_obj = datetime.strptime(data["formation_date_string"], "%Y-%m-%d")
            
            # Create/Get the date record inline (Safe & Consistent)
            date_record, _ = DimDate.objects.get_or_create(
                full_date=dt_obj.date(),
                defaults={
                    'date_id': int(dt_obj.strftime("%Y%m%d")),
                    'quarter': (dt_obj.month - 1) // 3 + 1,
                    'year': dt_obj.year
                }
            )
        except (ValueError, KeyError) as e:
            return Response(
                {"detail": f"Invalid date format (expected YYYY-MM-DD) or missing field: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Get Default Phase (ID 1)
        # We must assign a phase, even if not provided by user, to avoid DB errors
        default_phase, _ = DimPhase.objects.get_or_create(pk=1)

        # 3. Initialize Fund (Strictly the 4 fields + required defaults)
        try:
            fund = DimFund.objects.create(
                legal_name=data["legal_name"],
                short_name=data["short_name"],
                formation_date=date_record,
                currency_id=data["currency_id"],
                phase=default_phase,   # Technical requirement (cannot be null)
                fund_strategy="",      # Default empty
                legal_form="",         # Default empty
                management_company=""  # Default empty
            )

            # Reload to get readable names for frontend (e.g. "EUR", "Investment Period")
            fund = DimFund.objects.select_related('formation_date', 'phase', 'currency').get(pk=fund.pk)
            return Response(FundSerializer(fund).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class FundDetailView(APIView):
    def get(self, request, fund_id):
        fund = get_object_or_404(
            DimFund.objects.select_related('formation_date', 'phase', 'currency'), 
            fund_id=fund_id
        )
        serializer = FundSerializer(fund)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, fund_id):
        fund = get_object_or_404(DimFund, fund_id=fund_id)
        data = request.data

        try:
            # --- Field Updates ---
            if "legal_name" in data: fund.legal_name = data["legal_name"]
            if "short_name" in data: fund.short_name = data["short_name"]
            if "fund_strategy" in data: fund.fund_strategy = data["fund_strategy"]
            if "legal_form" in data: fund.legal_form = data["legal_form"]
            if "management_company" in data: fund.management_company = data["management_company"]
            if "currency_id" in data: fund.currency_id = data["currency_id"]
            if "phase_id" in data: fund.phase_id = data["phase_id"]

            if "formation_date_string" in data:
                # FIX: Changed format from "%d/%m/%Y" to "%Y-%m-%d"
                # to match the frontend payload "2026-01-18"
                dt_obj = datetime.strptime(data["formation_date_string"], "%Y-%m-%d")
                
                date_record, _ = DimDate.objects.get_or_create(
                    full_date=dt_obj.date(),
                    defaults={
                        'date_id': int(dt_obj.strftime("%Y%m%d")), 
                        'quarter': (dt_obj.month - 1) // 3 + 1, 
                        'year': dt_obj.year
                    }
                )
                fund.formation_date = date_record

            # --- Manual Timestamp Update ---
            fund.updated_at = timezone.now()

            fund.save()

            # Refresh and serialize
            fund = DimFund.objects.select_related('formation_date', 'phase', 'currency').get(pk=fund.pk)
            return Response(FundSerializer(fund).data, status=status.HTTP_200_OK)

        except ValueError as e:
            # Specific error for date parsing issues
            return Response({"detail": f"Date format error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class ShareClassByFundView(APIView):
    def get(self, request, fund_id):
        qs = DimShareClass.objects.filter(fund_id=fund_id)
        # FIX: Pass context={'request': request} here
        serializer = ShareClassSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, fund_id):
        try:
            fund = get_object_or_404(DimFund, fund_id=fund_id)
            user_id = request.user.id if request.user.is_authenticated else 1
            
            # --- THE FIX IS HERE ---
            # We must pass context={'request': request} so the serializer can build URLs
            serializer = ShareClassSerializer(
                data=request.data, 
                context={'request': request} 
            )
            
            if serializer.is_valid():
                serializer.save(
                    fund=fund,
                    created_by=user_id
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"CRITICAL ERROR: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class ShareClassDetailView(APIView):
    def get_object(self, fund_id, share_class_id):
        return get_object_or_404(
            DimShareClass,
            fund_id=fund_id,
            share_class_id=share_class_id,
        )

    def get(self, request, fund_id, share_class_id):
        obj = self.get_object(fund_id, share_class_id)
        # FIX: Pass context={'request': request} here
        return Response(ShareClassSerializer(obj, context={'request': request}).data)

    def put(self, request, fund_id, share_class_id):
        obj = self.get_object(fund_id, share_class_id)
        serializer = ShareClassSerializer(obj, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, fund_id, share_class_id):
        obj = self.get_object(fund_id, share_class_id)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class WaterfallStepDefinitionListView(APIView):
    def get(self, request):
        steps = DimWaterfallStep.objects.all().values()
        return Response(steps)

# 2. List/Create: Get all steps for a fund or Create a new one
class FundWaterfallListCreateView(generics.ListCreateAPIView):
    serializer_class = FactFundWaterfallStepSerializer

    def get_queryset(self):
        fund_id = self.kwargs['fund_id']
        return FactFundWaterfallStep.objects.filter(fund_id=fund_id)

    def perform_create(self, serializer):
        fund_id = self.kwargs['fund_id']
        serializer.save(fund_id=fund_id)

# 3. Detail: Update a specific step
class FundWaterfallDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FactFundWaterfallStepSerializer
    queryset = FactFundWaterfallStep.objects.all()
    lookup_field = 'id'

    def get_object(self):
        # Ensure we only fetch steps belonging to the specific fund in URL
        return get_object_or_404(
            FactFundWaterfallStep, 
            pk=self.kwargs['pk'], 
            fund_id=self.kwargs['fund_id']
        )

class ManFeePhaseListView(APIView):
    def get(self, request):
        qs = DimManFeePhase.objects.order_by("phase_id")
        serializer = ManFeePhaseSerializer(qs, many=True)
        return Response(serializer.data)

class FundManFeeRuleListCreateView(APIView):
    def get(self, request, fund_id):
        qs = (
            FactFundManFeeRule.objects
            .filter(fund_id=fund_id)
            .order_by("date_from")
        )
        serializer = FundManFeeRuleSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        data = request.data.copy()
        data["fund"] = fund_id
        data["updated_at"] = timezone.now()

        serializer = FundManFeeRuleSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class FundManFeeRuleDetailView(APIView):
    # FIXED: Added fund_id to the arguments to match the URL pattern
    def put(self, request, fund_id, fee_rule_id):
        try:
            # Best Practice: Ensure the rule actually belongs to this fund for security
            rule = FactFundManFeeRule.objects.get(pk=fee_rule_id, fund_id=fund_id)
        except FactFundManFeeRule.DoesNotExist:
            return Response({"error": "Rule not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data["updated_at"] = timezone.now()
        
        # Ensure the fund in the body matches the URL (optional safety)
        data["fund"] = fund_id 

        # partial=False ensures all required fields are present (standard for PUT)
        # If you want to allow updating just one field, change to partial=True
        serializer = FundManFeeRuleSerializer(
            rule, data=data, partial=False
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
class FundTimeframeView(APIView):
    def get(self, request, fund_id):
        qs = DimTimeframe.objects.filter(fund_id=fund_id).select_related("date").order_by("date__full_date")
        serializer = TimeframeSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        data = request.data
        full_date_str = data.get('full_date') # Format: "YYYY-MM-DD"
        
        try:
            # 1. Handle DimDate (managed=False requires manual existence check)
            date_id = int(full_date_str.replace('-', ''))
            year, month, day = map(int, full_date_str.split('-'))
            
            # Get or create the date record first
            date_obj, created = DimDate.objects.get_or_create(
                date_id=date_id,
                defaults={
                    'full_date': full_date_str,
                    'quarter': (month - 1) // 3 + 1,
                    'year': year,
                    'quarter_end': full_date_str
                }
            )

            # 2. Create the Timeframe record
            new_tf = DimTimeframe.objects.create(
                fund_id=fund_id,
                date=date_obj,
                display_label=data.get('display_label'),
                created_at=timezone.now(),
                created_by="ReactUser"
            )

            # 3. Return serialized data to frontend
            from .serializers import TimeframeSerializer
            serializer = TimeframeSerializer(new_tf)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Error saving timeframe: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class FundScenarioView(APIView):
    def get(self, request, fund_id):
        # Retrieve all scenarios for the specific fund
        qs = DimScenarioList.objects.filter(fund_id=fund_id).order_by("-created_at")
        serializer = ScenarioSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, fund_id):
        # Check if created_by was sent in the request body
        body_author = request.data.get("created_by")
        
        serializer = ScenarioSerializer(data=request.data, context={"fund_id": fund_id})
        
        if serializer.is_valid():
            serializer.save(
                fund_id=fund_id,
                # Use body_author if provided, else fallback to auth user or "system"
                created_by=body_author or (request.user.username if request.user.is_authenticated else "system")
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ScenarioSynthesisView(APIView):
    def get(self, request, fund_id):
        syntheses = DimScenarioSynthesis.objects.filter(fund_id=fund_id)
        serializer = DimScenarioSynthesisSerializer(syntheses, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        data = request.data.copy()
        data['fund'] = fund_id
        
        # Check if author was sent in the request body
        body_author = data.get("created_by")
        
        serializer = DimScenarioSynthesisSerializer(data=data)
        if serializer.is_valid():
            # Prioritize the author sent from frontend, fallback to user or system
            serializer.save(
                created_by=body_author or (request.user.username if request.user.is_authenticated else "system")
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)