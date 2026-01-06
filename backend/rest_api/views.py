from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import IntegrityError
from .models import DimTimeframe, DimDate, DimFund, DimScenario
from .serializers import TimeframeSerializer, ScenarioSerializer

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
        qs = DimScenario.objects.filter(fund_id=fund_id).order_by("-created_at")
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