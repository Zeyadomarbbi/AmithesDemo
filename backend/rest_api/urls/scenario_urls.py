from django.urls import path
from ..views.scenario_views import *

urlpatterns = [
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