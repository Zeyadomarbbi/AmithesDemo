from django.urls import path
from ..views.scenario_views import *

urlpatterns = [
    # Scenario List
    path(
        "funds/<int:fund_id>/scenario_list/", 
        FundScenarioListView.as_view(), 
        name="scenario-list-create"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:pk>/", 
        FundScenarioListView.as_view(), 
        name="scenario-detail"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/portfolio-investments/",
        ScenarioPortfolioInvestmentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="scenario-investment-list-create"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/portfolio-investments/<int:pk>/",
        ScenarioPortfolioInvestmentViewSet.as_view({
            'get': 'retrieve', 
            'put': 'update', 
            'patch': 'partial_update', 
            'delete': 'destroy'
        }),
        name="scenario-investment-detail"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/portfolio-investments/<int:investment_id>/flows/",
        ScenarioTransactionFlowViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="scenario-flow-list-create"
    ),
    # Scenario-Specific Flows: Detail (Retrieve, Update, Delete)
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/portfolio-investments/<int:investment_id>/flows/<int:pk>/",
        ScenarioTransactionFlowViewSet.as_view({
            'get': 'retrieve', 
            'put': 'update', 
            'patch': 'partial_update', 
            'delete': 'destroy'
        }),
        name="scenario-flow-detail"
    ),
    # Scenario Synthesis
    path(
        "funds/<int:fund_id>/synthesis-scenario/", 
        FundScenarioSynthesisView.as_view(), 
        name="synthesis-list-create"
    ),
    path(
        "funds/<int:fund_id>/synthesis-scenario/<int:pk>/", 
        FundScenarioSynthesisView.as_view(), 
        name="synthesis-detail"
    ),
]