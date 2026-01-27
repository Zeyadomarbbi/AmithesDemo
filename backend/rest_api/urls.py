from django.urls import path
from .views import *

urlpatterns = [
    # 1. Dropdown Data
    path(
        "currencies/",
        CurrencyListView.as_view(), 
        name="currency-list"
    ),
    path(
        "phases/", 
        PhaseListView.as_view(), 
        name="phase-list"
    ),

    # 2. Initialization & List (GET / POST)
    path(
        "funds/", 
        FundListView.as_view(), 
        name="fund-list"
    ),

    # 3. Edit / Update Fund (PUT) - THIS WAS MISSING
    path(
        "funds/<int:fund_id>/", 
        FundDetailView.as_view(), 
        name="fund-detail"
    ),
    path(
        "funds/<int:fund_id>/share-classes/",
        ShareClassByFundView.as_view(),
    ),
    path(
        "funds/<int:fund_id>/share-classes/<int:share_class_id>/",
        ShareClassDetailView.as_view(),
    ),
    path(
        'waterfall-definitions/', 
        WaterfallStepDefinitionListView.as_view(), 
        name='waterfall-defs'
    ),
    path(
        'funds/<int:fund_id>/waterfall-steps/', 
        FundWaterfallListCreateView.as_view(), 
        name='fund-waterfall-list'
    ),
    path(
        'funds/<int:fund_id>/waterfall-steps/<int:pk>/', 
        FundWaterfallDetailView.as_view(), 
        name='fund-waterfall-detail'
    ),
    path(
        "management-fee-phases/",
        ManFeePhaseListView.as_view(),
        name="man-fee-phase-list",
    ),
    path(
        "funds/<int:fund_id>/management-fee-rules/",
        FundManFeeRuleListCreateView.as_view(),
        name="fund-man-fee-rules",
    ),
    path(
        "funds/<int:fund_id>/management-fee-rules/<int:fee_rule_id>/", 
        FundManFeeRuleDetailView.as_view()
        ),
    # 4. Related Data
    path(
        "funds/<int:fund_id>/timeframes/",
        FundTimeframeView.as_view()
    ),
    path(
        "funds/<int:fund_id>/scenarios/", 
        FundScenarioView.as_view()
    ),
    path(
        "funds/<int:fund_id>/synthesis/",
        ScenarioSynthesisView.as_view()
    ),
        # Limits / fees
    path("funds/<int:fund_id>/management-fee/configs/", management_fee_configs),
    path("funds/<int:fund_id>/management-fee/rates/", management_fee_rates),
    path("funds/<int:fund_id>/closing-periods/", closing_periods),
    path("funds/<int:fund_id>/lp-register/", lp_register),
]