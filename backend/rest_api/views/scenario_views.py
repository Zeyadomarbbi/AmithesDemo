from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db import connection

from ..models.views import (
    ViewMasterManFees, 
    ViewMasterScenarioGains, 
    ScenarioFundflowsDistributionSummary, 
    ScenarioFundflowsCapitalcallSummary, 
    ViewScenarioFundflowsAllOperations
)
from ..models.transactions import (
    ScenarioList, 
    ScenarioSynthesis, 
    PortfolioInvestment, 
    PortfolioTransactionFlow, 
    ScenarioPortfolioProjection, 
    ScenarioDueDiligenceFee, 
    ManFeeTranche,
    ScenarioFinancialsProjection
)
from ..serializers.scenario_serializers import (
    ScenarioSerializer, 
    ScenarioSynthesisSerializer, 
    ScenarioPortfolioProjectionSerializer, 
    ScenarioDueDiligenceFeeSerializer, 
    ManFeeTrancheSerializer,
    ViewMasterManFeesSerializer,
    ViewMasterScenarioGainsSerializer,
    ScenarioFinancialsProjectionSerializer,
    ScenarioFundflowsDistributionSummarySerializer,
    ScenarioFundflowsCapitalcallSummarySerializer,
    ViewScenarioFundflowsAllOperationsSerializer
)
from ..serializers.portfolio_serializers import PortfolioInvestmentSerializer, PortfolioTransactionFlowSerializer

class FundScenarioListView(APIView):
    def get(self, request, fund_id, pk=None):
        if pk:
            scenario = get_object_or_404(
                ScenarioList, 
                pk=pk, 
                fund_id=fund_id, 
                is_deleted=False
            )
            serializer = ScenarioSerializer(scenario)
            return Response(serializer.data)
        
        qs = ScenarioList.objects.filter(fund_id=fund_id, is_deleted=False)
        serializer = ScenarioSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        serializer = ScenarioSerializer(
            data=request.data, 
            context={"fund_id": fund_id}
        )
        serializer.is_valid(raise_exception=True)
        
        # Handle metadata
        author = request.data.get("created_by") or (
            request.user.username if request.user.is_authenticated else "system"
        )
        
        serializer.save(fund_id=fund_id, created_by=author)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, fund_id, pk):
        scenario = get_object_or_404(ScenarioList, pk=pk, fund_id=fund_id, is_deleted=False)
        serializer = ScenarioSerializer(
            scenario, 
            data=request.data, 
            context={"fund_id": fund_id},
            partial=False
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_at=timezone.now())
        return Response(serializer.data)

    def delete(self, request, fund_id, pk):
        """
        Implements Soft Delete as per new model schema.
        """
        scenario = get_object_or_404(ScenarioList, pk=pk, fund_id=fund_id)
        scenario.is_deleted = True
        scenario.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class FundScenarioSynthesisView(APIView):
    def get(self, request, fund_id, pk=None):
        if pk:
            synthesis = get_object_or_404(
                ScenarioSynthesis, pk=pk, fund_id=fund_id, is_deleted=False
            )
            serializer = ScenarioSynthesisSerializer(synthesis)
            return Response(serializer.data)
        
        qs = ScenarioSynthesis.objects.filter(fund_id=fund_id, is_deleted=False)
        serializer = ScenarioSynthesisSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        data = request.data.copy()
        data['fund'] = fund_id
        
        serializer = ScenarioSynthesisSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        author = data.get("created_by") or (
            request.user.username if request.user.is_authenticated else "system"
        )
        serializer.save(fund_id=fund_id, created_by=author)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, fund_id, pk):
        synthesis = get_object_or_404(ScenarioSynthesis, pk=pk, fund_id=fund_id, is_deleted=False)
        serializer = ScenarioSynthesisSerializer(synthesis, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, fund_id, pk):
        synthesis = get_object_or_404(ScenarioSynthesis, pk=pk, fund_id=fund_id)
        synthesis.is_deleted = True
        synthesis.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class ScenarioPortfolioInvestmentViewSet(ModelViewSet):
    serializer_class = PortfolioInvestmentSerializer

    def get_queryset(self):
        return PortfolioInvestment.objects.filter(
            fund_id=self.kwargs.get('fund_id'),
            scenario_id=self.kwargs.get('scenario_pk'),
            is_deleted=False
        )

    def perform_create(self, serializer):
        # Automatically injects the scenario_id from the URL
        created_by = None
        if self.request.user and self.request.user.is_authenticated:
            created_by = self.request.user.username

        serializer.save(
            fund_id=self.kwargs.get('fund_id'),
            scenario_id=self.kwargs.get('scenario_pk'),
            created_by=created_by
        )

class ScenarioTransactionFlowViewSet(ModelViewSet):
    serializer_class = PortfolioTransactionFlowSerializer

    def get_queryset(self):
        return PortfolioTransactionFlow.objects.filter(
            portfolio_investment_id=self.kwargs.get('investment_id'),
            portfolio_investment__fund_id=self.kwargs.get('fund_id'),
            scenario_id=self.kwargs.get('scenario_pk'),
            is_deleted=False
        )

    def perform_create(self, serializer):
        # Ensure the investment exists within the specified fund
        investment = get_object_or_404(
            PortfolioInvestment, 
            investment_id=self.kwargs.get('investment_id'), 
            fund_id=self.kwargs.get('fund_id')
        )

        created_by = None
        if self.request.user and self.request.user.is_authenticated:
            created_by = self.request.user.username

        # Auto-generate the next flow index for this investment
        next_index = (
            PortfolioTransactionFlow.objects.filter(portfolio_investment=investment).count() + 1
        )
        flow_name = f"#flow {next_index}"

        serializer.save(
            portfolio_investment=investment,
            scenario_id=self.kwargs.get('scenario_pk'),
            flow_name=flow_name,
            created_by=created_by
        )

class ScenarioPortfolioProjectionViewSet(ModelViewSet):
    serializer_class = ScenarioPortfolioProjectionSerializer

    def get_queryset(self):
        fund_id = self.kwargs.get('fund_id')
        scenario_id = self.kwargs.get('scenario_pk')
        
        return ScenarioPortfolioProjection.objects.filter(
            fund_id=fund_id,
            scenario_id=scenario_id
        ).select_related('investment')
    
class ManFeeTrancheViewSet(ModelViewSet):
    serializer_class = ManFeeTrancheSerializer

    def get_queryset(self):
        scenario_pk = self.kwargs.get('scenario_pk')
        return ManFeeTranche.objects.filter(scenario_id=scenario_pk).select_related('share_class')

    def perform_create(self, serializer):
        # Optional: You can force the scenario_id from the URL here if needed
        serializer.save()
    
class ScenarioDueDiligenceFeeViewSet(ModelViewSet):
    queryset = ScenarioDueDiligenceFee.objects.all().select_related('investment', 'scenario')
    serializer_class = ScenarioDueDiligenceFeeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['scenario_id', 'fund_id']

    def get_queryset(self):
        # Captures the scenario_pk from your URL path:
        # funds/<int:fund_id>/scenario_list/<int:scenario_pk>/dd-fees/
        scenario_pk = self.kwargs.get('scenario_pk')
        fund_id = self.kwargs.get('fund_id')
        
        return ScenarioDueDiligenceFee.objects.filter(
            scenario_id=scenario_pk, 
            fund_id=fund_id
        ).select_related('investment_id')

    def perform_create(self, serializer):
        # The trigger will handle amount calculations automatically
        # upon insertion of the record.
        serializer.save()

    def perform_update(self, serializer):
        # Updating entry_fee_pct or exit_fee_pct triggers the 
        # BEFORE UPDATE trigger (fn_recalc_dd_on_input)
        serializer.save()

class ViewMasterManFeesViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ViewMasterManFeesSerializer

    def get_queryset(self):
        fund_id = self.kwargs.get('fund_id')
        scenario_pk = self.kwargs.get('scenario_pk')
        
        return ViewMasterManFees.objects.filter(
            fund_id=fund_id,
            scenario_id=scenario_pk
        )
    
class ViewMasterScenarioGainsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ViewMasterScenarioGainsSerializer

    def get_queryset(self):
        scenario_pk = self.kwargs.get('scenario_pk')
        return ViewMasterScenarioGains.objects.filter(scenario_id=scenario_pk)
    
class ScenarioFinancialsProjectionViewSet(viewsets.ModelViewSet):
    serializer_class = ScenarioFinancialsProjectionSerializer

    def get_queryset(self):
        scenario_id = self.kwargs.get('scenario_pk')
        return ScenarioFinancialsProjection.objects.filter(
            scenario_id=scenario_id
        ).select_related('line_item', 'line_item__category')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        fund_id = self.kwargs.get('fund_id')
        
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT last_realized_year FROM view_fund_realized_cutoff WHERE fund_id = %s", 
                [fund_id]
            )
            row = cursor.fetchone()
            last_realized = row[0] if row else 0
            
        context['last_realized_year'] = last_realized
        return context
    
class ScenarioFundflowsDistributionSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for scenario distribution summary.
    Automatically ordered by date.
    """
    serializer_class = ScenarioFundflowsDistributionSummarySerializer
    http_method_names = ['get', 'head', 'options']  # Read-only

    def get_queryset(self):
        scenario_id = self.kwargs.get('scenario_pk')
        
        if scenario_id:
            return ScenarioFundflowsDistributionSummary.objects.filter(
                scenario_id=scenario_id
            ).order_by('date')
        
        return ScenarioFundflowsDistributionSummary.objects.none()
    
class ScenarioFundflowsCapitalcallSummaryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for capital call summary.
    - List/Retrieve: Returns all visible capital calls (filters out hidden placeholders)
    - Create: Add custom projected date
    - Update: Modify date for user-inserted entries
    - Delete: Remove user-inserted projected entries
    """
    serializer_class = ScenarioFundflowsCapitalcallSummarySerializer

    def get_queryset(self):
        scenario_id = self.kwargs.get('scenario_pk')
        
        if scenario_id:
            # Filter out hidden placeholders
            return ScenarioFundflowsCapitalcallSummary.objects.filter(
                scenario_id=scenario_id
            ).exclude(
                source_type='projected_placeholder',
                is_user_inserted=False
            ).order_by('date')
        
        return ScenarioFundflowsCapitalcallSummary.objects.none()

    def create(self, request, *args, **kwargs):
        """Create a new projected custom date entry"""
        data = request.data.copy()
        data['source_type'] = 'projected_custom'
        data['is_user_inserted'] = True
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update only user-inserted entries"""
        instance = self.get_object()
        
        # Only allow updates to user-inserted entries
        if not instance.is_user_inserted and instance.source_type != 'projected_custom':
            return Response(
                {'error': 'Cannot modify system-generated entries'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete only user-inserted projected entries"""
        instance = self.get_object()
        
        # Only allow deletion of user-inserted custom entries
        if not instance.is_user_inserted or instance.source_type != 'projected_custom':
            return Response(
                {'error': 'Cannot delete system-generated entries'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
class ViewScenarioFundflowsAllOperationsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for all fund flow operations (capital calls + distributions)
    """
    serializer_class = ViewScenarioFundflowsAllOperationsSerializer
    
    def get_queryset(self):
        scenario_id = self.kwargs.get('scenario_id')
        return ViewScenarioFundflowsAllOperations.objects.filter(
            scenario_id=scenario_id
        )