from django.urls import path, include

urlpatterns = [
    # Core / Funds endpoints
    path("", include("rest_api.urls.core")),

    # Financial endpoints (financial-categories + pnl)
    path("", include("rest_api.urls.financial_urls")),

    # If you use these modules, include them too:
    path("", include("rest_api.urls.fund_urls")),
    path("", include("rest_api.urls.portfolio_urls")),
    path("", include("rest_api.urls.reference")),
    path("", include("rest_api.urls.scenario_urls")),
]
