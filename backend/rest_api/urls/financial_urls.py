from django.urls import path
from ..views.financial_views import *

urlpatterns = [
    path("financial-categories/", FinancialCategoryView.as_view(), name="financial-category-list"),
    path("financial-categories/<int:category_id>/", FinancialCategoryView.as_view(), name="financial-category-detail"),

    path("pnl/<int:fund_id>/", PnLView.as_view(), name="pnl-grid"),
    path("pnl/<int:fund_id>/value/", PnLValueUpsertView.as_view(), name="pnl-value-upsert"),
]
