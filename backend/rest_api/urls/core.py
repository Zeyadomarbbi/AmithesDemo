from rest_framework.routers import DefaultRouter
from django.urls import path

from ..views.core import *

# ✅ PnL endpoints
from ..views.financial_views import (
    PnLView,
    PnLValueUpsertView,
    PnLLineItemCreateView,
)

router = DefaultRouter()
router.register(r"funds", FundViewSet, basename="fund")

urlpatterns = router.urls + [
    path(
        "funds/<int:fund_id>/timeframes/",
        FundTimeframeListView.as_view(),
        name="timeframe-list-create",
    ),
    path(
        "funds/<int:fund_id>/timeframes/<int:pk>/",
        FundTimeframeListView.as_view(),
        name="timeframe-detail",
    ),
    path(
        "funds/<int:fund_id>/share-classes/",
        ShareClassView.as_view(),
        name="share-class-list-create",
    ),
    path(
        "funds/<int:fund_id>/share-classes/<int:share_class_id>/",
        ShareClassView.as_view(),
        name="share-class-detail-update-delete",
    ),
    path("funds/<int:fund_id>/management-fee/configs/", management_fee_configs),
    path("funds/<int:fund_id>/management-fee/rates/", management_fee_rates),
    path("funds/<int:fund_id>/closing-periods/", closing_periods),
    path("funds/<int:fund_id>/lp-register/", lp_register),
    path(
        "funds/<int:fund>/man-fee-commitment-year/", 
        FundManFeeCommitmentYearRetrieveView.as_view(), 
        name="fund-man-fee-commitment-year"
    ),
    # ✅ PnL (backend used by your React PnLTab)
    path("pnl/<int:fund_id>/", PnLView.as_view(), name="pnl-get"),
    path("pnl/<int:fund_id>/value/", PnLValueUpsertView.as_view(), name="pnl-upsert-value"),
    path("pnl/<int:fund_id>/line-item/", PnLLineItemCreateView.as_view(), name="pnl-create-line-item"),
    path("pnl/<int:fund_id>/line-item/<int:line_item_id>/", PnLLineItemCreateView.as_view(), name="pnl-line-item-detail"),
]
