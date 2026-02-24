from django.urls import path
from ..views.financial_views import *

urlpatterns = [
    path("financial-categories/", FinancialCategoryView.as_view(), name="financial-category-list"),
    path("financial-categories/<int:category_id>/", FinancialCategoryView.as_view(), name="financial-category-detail"),
    path(
        "funds/<int:fund_id>/financial-line-items/",
        FinancialLineItemViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="financial-line-item-list"
    ),
    # Retrieve, Update, Delete (Soft Delete)
    path(
        "funds/<int:fund_id>/financial-line-items/<int:pk>/",
        FinancialLineItemViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name="financial-line-item-detail"
    ),
    path("pnl/<int:fund_id>/", PnLView.as_view(), name="pnl-grid"),
    path("pnl/<int:fund_id>/value/", PnLValueUpsertView.as_view(), name="pnl-value-upsert"),
]
