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
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/projections/",
        ScenarioPortfolioProjectionViewSet.as_view({'get': 'list'}),
        name="scenario-projections-list"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/projections/<int:pk>/",
        ScenarioPortfolioProjectionViewSet.as_view({'patch': 'partial_update', 'get': 'retrieve'}),
        name="scenario-projections-detail"
    ),
    # --- DUE DILIGENCE FEES ---
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/dd-fees/",
        ScenarioDueDiligenceFeeViewSet.as_view({'get': 'list'}),
        name="scenario-dd-fees-list"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/dd-fees/<int:pk>/",
        ScenarioDueDiligenceFeeViewSet.as_view({
            'get': 'retrieve',
            'patch': 'partial_update',
            'put': 'update'
        }),
        name="scenario-dd-fees-detail"
    ),
    # Management Fee Tranches
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/man-fee-tranches/",
        ManFeeTrancheViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="scenario-man-fee-tranche-list"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/man-fee-tranches/<int:pk>/",
        ManFeeTrancheViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name="scenario-man-fee-tranche-detail"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/master-man-fees/",
        ViewMasterManFeesViewSet.as_view({'get': 'list'}),
        name="scenario-master-man-fees"
    ),
    path(
        "funds/<int:fund_id>/scenario_list/<int:scenario_pk>/gains-summary/",
        ViewMasterScenarioGainsViewSet.as_view({'get': 'list'}),
        name="scenario-gains-summary"
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