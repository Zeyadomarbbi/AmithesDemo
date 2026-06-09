from django.urls import path
from ..views.lps_statement_views import CapitalAccountStatementKPIView, BulkCapitalAccountStatementKPIView
from ..views.portfolio_views import BulkPortfolioKpiView
from ..views.dealflow_views import DealflowKpiOptionsView


urlpatterns = [
    path('funds/<int:fund_id>/cas-kpis/', CapitalAccountStatementKPIView.as_view(), name='cas-kpis'),
    path('funds/cas-kpis/bulk/', BulkCapitalAccountStatementKPIView.as_view(), name="bulk-cas-kpis"),
    path('funds/portfolio-kpis/bulk/', BulkPortfolioKpiView.as_view(), name="bulk-portfolio-kpis"),
    path('kpis/options/', DealflowKpiOptionsView.as_view(), name="dealflow-kpi-options"),
]
