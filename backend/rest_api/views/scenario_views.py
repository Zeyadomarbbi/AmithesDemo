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
from ..services import WaterfallService, SensitivityService

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
    Read-only viewset for all fund flow operations (capital calls + distributions).
    Excludes hidden 'projected_placeholder' entries.
    """
    serializer_class = ViewScenarioFundflowsAllOperationsSerializer
    # Tell DRF to use all_operations_id for single object lookups (detail views)
    lookup_field = 'all_operations_id'
    
    def get_queryset(self):
        scenario_id = self.kwargs.get('scenario_id')
        fund_id = self.kwargs.get('fund_id')
        
        queryset = ViewScenarioFundflowsAllOperations.objects.all()
        
        if scenario_id:
            queryset = queryset.filter(scenario_id=scenario_id)
        if fund_id:
            queryset = queryset.filter(fund_id=fund_id)
            
        # Exclude the placeholder rows
        queryset = queryset.exclude(source_type='projected_placeholder')
            
        # Ensure consistent ordering by date, then by ID to prevent pagination jitter
        return queryset.order_by('date', 'all_operations_id')
    
class ScenarioWaterfallView(APIView):
    def get(self, request, fund_id, scenario_id):
        try:
            service = WaterfallService(fund_id=fund_id, scenario_id=scenario_id)
            results = service.run_simulation()
            
            if results is None:
                return Response(
                    {"detail": "No operations found for this scenario."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            # In production, use a logger here
            print(f"Error generating waterfall: {e}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class ScenarioSensitivityView(APIView):
    def post(self, request, fund_id, scenario_id):
        data = request.data
        investment_id = data.get('investment_id')
        
        # Grid parameters from the frontend
        m_center = float(data.get('moic_center', 1.5))
        d_center = float(data.get('duration_center', 5.0))
        m_step = float(data.get('moic_step', 0.5))
        d_step = float(data.get('duration_step', 1.0))

        # 1. Generate the 5x5 axis values
        # We create a range: [Center - 2*Step, Center - Step, Center, Center + Step, Center + 2*Step]
        moic_range = [round(m_center + (i * m_step), 2) for i in range(-2, 3)]
        duration_range = [round(d_center + (i * d_step), 2) for i in range(-2, 3)]

        # 2. Initialize the Service
        service = WaterfallService(fund_id, scenario_id)
        
        # 3. The Virtual Sequence
        # We call a stateless method that returns the matrix
        try:
            matrix = service.calculate_virtual_matrix(
                investment_id=investment_id,
                moic_range=moic_range,
                duration_range=duration_range
            )
            
            return Response({
                "matrix": matrix,
                "moic_axis": moic_range,
                "duration_axis": duration_range
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ScenarioSensitivityView(APIView):
    def post(self, request, fund_id, scenario_id):
        data = request.data
        investment_id = data.get('investment_id')
        moic_inputs = data.get('moic_inputs', [])
        duration_inputs = data.get('duration_inputs', [])

        if not investment_id:
            return Response({"error": "investment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(moic_inputs) != 5 or len(duration_inputs) != 5:
            return Response(
                {"error": "Exactly 5 MOIC and 5 Duration inputs are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Enforce numeric types
            moic_inputs = [float(m) for m in moic_inputs]
            duration_inputs = [float(d) for d in duration_inputs]
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid numeric data in inputs."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = SensitivityService(
                fund_id=fund_id,
                scenario_id=scenario_id,
                investment_id=investment_id
            )
            
            # This generates the dictionary containing portfolio_irr, fund_irr_net, etc.
            result_matrix = service.generate_matrices(moic_inputs, duration_inputs)
            # The hook expects the matrices wrapped in a 'matrix' key
            return Response({"matrix": result_matrix}, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc() # Useful for debugging server-side errors
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)