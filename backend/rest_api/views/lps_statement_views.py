from rest_framework import generics, mixins, viewsets
from rest_framework.viewsets import ModelViewSet
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.http import HttpResponse
from psycopg2 import OperationalError
from django.db import transaction, IntegrityError

from ..serializers.lps_statement_serializers import ClosingPeriodSerializer
from ..models.reference import ClosingPeriod
from ..serializers.lps_statement_serializers import FundClosingSerializer
from ..models.transactions import FundClosing, LPsFundCommitment
from ..models.core import LimitedPartner, Timeframe
from ..serializers.lps_statement_serializers import LimitedPartnerSerializer, LPsFundCommitmentSerializer
from ..services import CapitalAccountService
from ..models.views import CapitalAccountKpiCache

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
        return Response(result, status=status.HTTP_200_OK)


class BulkCapitalAccountStatementKPIView(APIView):

    def post(self, request):
        fund_ids = request.data.get("fund_ids", [])
        timeframe_id = request.data.get("timeframe_id")

        if not isinstance(fund_ids, list) or not fund_ids:
            return Response(
                {"error": "fund_ids must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result_map = {}

        for fund_id in fund_ids:
            try:
                # Resolve timeframe (same logic as singular)
                if not timeframe_id:
                    latest_tf = (
                        Timeframe.objects
                        .filter(fund_id=fund_id)
                        .order_by("-date")
                        .first()
                    )

                    if not latest_tf:
                        result_map[str(fund_id)] = {
                            "error": "No timeframes found for this fund."
                        }
                        continue

                    resolved_timeframe = latest_tf.timeframe_id
                else:
                    resolved_timeframe = int(timeframe_id)

                # Atomic compute block per fund
                with transaction.atomic():

                    cached = (
                        CapitalAccountKpiCache.objects
                        .select_for_update()
                        .filter(
                            fund_id=fund_id,
                            timeframe_id=resolved_timeframe
                        )
                        .first()
                    )

                    if cached:
                        result_map[str(fund_id)] = cached.payload
                        continue

                    service = CapitalAccountService(
                        fund_id=fund_id,
                        timeframe_id=resolved_timeframe
                    )

                    result = service.compute()

                    CapitalAccountKpiCache.objects.create(
                        fund_id=fund_id,
                        timeframe_id=resolved_timeframe,
                        payload=result
                    )

                    result_map[str(fund_id)] = result

            except IntegrityError:
                # In case of race condition, fetch existing
                cached = CapitalAccountKpiCache.objects.filter(
                    fund_id=fund_id,
                    timeframe_id=resolved_timeframe
                ).first()

                if cached:
                    result_map[str(fund_id)] = cached.payload
                else:
                    result_map[str(fund_id)] = {
                        "error": "Integrity conflict."
                    }

            except Exception as e:
                result_map[str(fund_id)] = {"error": str(e)}

        return Response(result_map, status=status.HTTP_200_OK)