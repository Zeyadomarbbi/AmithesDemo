from django.urls import path
from .views import (
    CurrencyListView, 
    PhaseListView,
    FundTimeframeView, 
    FundScenarioView, 
    ScenarioSynthesisView, 
    FundListView, 
    FundDetailView,
    ShareClassByFundView,
    ShareClassDetailView  # Make sure to import this!
)

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
    )
]