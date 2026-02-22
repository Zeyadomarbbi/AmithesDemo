from rest_framework import generics, mixins, viewsets
from rest_framework.viewsets import ModelViewSet
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..serializers.lps_statement_serializers import ClosingPeriodSerializer
from ..models.reference import ClosingPeriod
from ..serializers.lps_statement_serializers import FundClosingSerializer
from ..models.transactions import FundClosing, LPsFundCommitment
from ..models.core import LimitedPartner, Timeframe
from ..serializers.lps_statement_serializers import LimitedPartnerSerializer, LPsFundCommitmentSerializer
from ..services import CapitalAccountService

class ClosingPeriodList(generics.ListAPIView):
    queryset = ClosingPeriod.objects.all()
    serializer_class = ClosingPeriodSerializer

class ClosingPeriodDetail(generics.RetrieveAPIView):
    queryset = ClosingPeriod.objects.all()
    serializer_class = ClosingPeriodSerializer
    lookup_field = 'closing_id'

class FundClosingDetail(generics.RetrieveAPIView):
    queryset = FundClosing.objects.all()
    serializer_class = FundClosingSerializer
    
    def get_queryset(self):
        # Ensures the record belongs to the fund specified in the URL
        return self.queryset.filter(fund_id=self.kwargs.get('fund_id'))
    
class FundClosingListCreate(mixins.ListModelMixin,
                            mixins.CreateModelMixin,
                            generics.GenericAPIView):
    serializer_class = FundClosingSerializer

    def get_queryset(self):
        queryset = FundClosing.objects.all()
        fund_id = self.kwargs.get('fund_id')
        if fund_id is not None:
            return queryset.filter(fund_id=fund_id)
        return queryset

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Automatically assign user and fund_id from URL if present
        fund_id = self.kwargs.get('fund_id')
        if fund_id:
            serializer.save(fund_id=fund_id)
        else:
            serializer.save()

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
        return LPsFundCommitment.objects.filter(is_deleted=False)

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

class CapitalAccountStatementKPIView(APIView):
    def get(self, request, fund_id):
        timeframe_id = request.query_params.get('timeframe_id')

        if not timeframe_id:
            # Idea: Fetch the latest timeframe for this fund by date
            # Adjust 'date' or 'reference_date' based on your model field
            latest_tf = Timeframe.objects.filter(fund_id=fund_id).order_by('-date').first()
            
            if not latest_tf:
                return Response(
                    {"error": "No timeframes found for this fund."},
                    status=status.HTTP_404_NOT_FOUND
                )
            timeframe_id = latest_tf.timeframe_id
        else:
            try:
                timeframe_id = int(timeframe_id)
            except ValueError:
                return Response(
                    {"error": "timeframe_id must be an integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        service = CapitalAccountService(fund_id=fund_id, timeframe_id=timeframe_id)
        result = service.compute()

        return Response(result, status=status.HTTP_200_OK)