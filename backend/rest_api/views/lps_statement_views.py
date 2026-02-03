from rest_framework import generics, mixins
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from ..serializers.lps_statement_serializers import ClosingPeriodSerializer
from ..models.reference import ClosingPeriod
from ..serializers.lps_statement_serializers import FundClosingSerializer
from ..models.transactions import FundClosing
from ..models.core import LimitedPartner
from ..serializers.lps_statement_serializers import LimitedPartnerSerializer

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