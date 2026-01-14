from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from .models import DimTimeframe, DimDate, DimFund, DimScenarioList, DimScenarioSynthesis, DimCurrency, DimPhase
from .serializers import TimeframeSerializer, ScenarioSerializer, DimScenarioSynthesisSerializer, FundSerializer

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
            dt_obj = datetime.strptime(data["formation_date_string"], "%d/%m/%Y")
            date_record, _ = DimDate.objects.get_or_create(
                full_date=dt_obj.date(),
                defaults={
                    'date_id': int(dt_obj.strftime("%Y%m%d")),
                    'quarter': (dt_obj.month - 1) // 3 + 1,
                    'year': dt_obj.year
                }
            )
        except (ValueError, KeyError):
            return Response({"detail": "Invalid or missing formation_date_string"}, status=status.HTTP_400_BAD_REQUEST)

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
    def put(self, request, fund_id):
        fund = get_object_or_404(DimFund, fund_id=fund_id)
        data = request.data

        try:
            # --- Field Updates (Same as before) ---
            if "legal_name" in data: fund.legal_name = data["legal_name"]
            if "short_name" in data: fund.short_name = data["short_name"]
            if "fund_strategy" in data: fund.fund_strategy = data["fund_strategy"]
            if "legal_form" in data: fund.legal_form = data["legal_form"]
            if "management_company" in data: fund.management_company = data["management_company"]
            if "currency_id" in data: fund.currency_id = data["currency_id"]
            if "phase_id" in data: fund.phase_id = data["phase_id"]

            if "formation_date_string" in data:
                dt_obj = datetime.strptime(data["formation_date_string"], "%d/%m/%Y")
                date_record, _ = DimDate.objects.get_or_create(
                    full_date=dt_obj.date(),
                    defaults={'date_id': int(dt_obj.strftime("%Y%m%d")), 'quarter': (dt_obj.month - 1) // 3 + 1, 'year': dt_obj.year}
                )
                fund.formation_date = date_record

            # --- Manual Timestamp Update ---
            # This ensures updated_at only changes during this 'Edit' logic
            fund.updated_at = timezone.now()

            fund.save()

            fund = DimFund.objects.select_related('formation_date', 'phase', 'currency').get(pk=fund.pk)
            return Response(FundSerializer(fund).data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

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