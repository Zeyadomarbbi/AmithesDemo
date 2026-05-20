from django.urls import path

from ..views.portfolio_views import *

urlpatterns = [
    path(
        "funds/<int:fund_id>/portfolio-investments/",
        PortfolioInvestmentView.as_view(),
        name="portfolio-investment-list-create"
    ),
    path(
        "funds/<int:fund_id>/portfolio-investments/<int:investment_id>/",
        PortfolioInvestmentView.as_view(),
        name="portfolio-investment-detail"
    ),
    path(
        "funds/<int:fund_id>/portfolio-investments/<int:investment_id>/flows/",
        PortfolioTransactionFlowView.as_view(),
        name="portfolio-transaction-flow-list-create"
    ),
    path(
        "funds/<int:fund_id>/portfolio-investments/<int:investment_id>/flows/<int:pk>/",
        PortfolioTransactionFlowView.as_view(),
        name="portfolio-transaction-flow-detail"
    ),
    path(
        "funds/<int:fund_id>/portfolio-investments/<int:investment_id>/fair-values/",
        PortfolioFairValueFlowView.as_view(),
        name="portfolio-fair-value-flow-list-create"
    ),
        path(
        "funds/<int:fund_id>/portfolio-investments/<int:investment_id>/fair-values/<int:pk>/",
        PortfolioFairValueFlowView.as_view(),
        name="portfolio-fair-value-flow-list-detail"
    ),
]
