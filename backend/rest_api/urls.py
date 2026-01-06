from django.urls import path
from .views import FundTimeframeView, FundScenarioView

urlpatterns = [
    path(
        "funds/<int:fund_id>/timeframes/",
        FundTimeframeView.as_view()
    ),
    path(
        "funds/<int:fund_id>/scenarios/", 
        FundScenarioView.as_view()
    )
]
