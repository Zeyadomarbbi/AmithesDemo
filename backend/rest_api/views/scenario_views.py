from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..models.transactions import ScenarioList, ScenarioSynthesis, PortfolioInvestment, PortfolioTransactionFlow, ScenarioPortfolioProjection
from ..serializers.scenario_serializers import ScenarioSerializer, ScenarioSynthesisSerializer, ScenarioPortfolioProjectionSerializer
from ..serializers.portfolio_serializers import PortfolioInvestmentSerializer, PortfolioTransactionFlowSerializer

class FundScenarioListView(APIView):
    def get(self, request, fund_id, pk=None):
        if pk:
            scenario = get_object_or_404(ScenarioList, pk=pk, fund_id=fund_id, is_deleted=False)
            serializer = ScenarioSerializer(scenario)
            return Response(serializer.data)
        
        qs = ScenarioList.objects.filter(fund_id=fund_id, is_deleted=False).order_by("-created_at")
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
        # Only returns investments for the specific scenario in the URL
        return PortfolioInvestment.objects.filter(
            fund_id=self.kwargs.get('fund_id'),
            scenario_id=self.kwargs.get('scenario_pk'),
            is_deleted=False
        ).order_by("-created_at")

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
        # Filters flows by the specific Investment AND Scenario provided in the URL
        return PortfolioTransactionFlow.objects.filter(
            portfolio_investment_id=self.kwargs.get('investment_id'),
            portfolio_investment__fund_id=self.kwargs.get('fund_id'),
            scenario_id=self.kwargs.get('scenario_pk'),
            is_deleted=False
        ).order_by("date", "flow_id")

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