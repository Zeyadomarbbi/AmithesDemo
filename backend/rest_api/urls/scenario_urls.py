from django.urls import path
from ..views.scenario_views import *

urlpatterns = [
    path(
        "funds/<int:fund_id>/scenarios/", 
        FundScenarioListView.as_view(), 
        name="scenario-list-create"
    ),
    path(
        "funds/<int:fund_id>/scenarios/<int:pk>/", 
        FundScenarioListView.as_view(), 
        name="scenario-detail"
    ),
    # Scenario Synthesis
    path(
        "funds/<int:fund_id>/scenario-synthesis/", 
        FundScenarioSynthesisView.as_view(), 
        name="synthesis-list-create"
    ),
    path(
        "funds/<int:fund_id>/scenario-synthesis/<int:pk>/", 
        FundScenarioSynthesisView.as_view(), 
        name="synthesis-detail"
    ),
]