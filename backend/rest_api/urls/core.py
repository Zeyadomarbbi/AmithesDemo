from rest_framework.routers import DefaultRouter
from django.urls import path

from ..views.core import *

router = DefaultRouter()
router.register(r'funds', FundViewSet, basename='fund')

urlpatterns = router.urls + [
    path(
        "funds/<int:fund_id>/timeframes/", 
        FundTimeframeListView.as_view(), 
        name="timeframe-list-create"
    ),
    path(
        "funds/<int:fund_id>/timeframes/<int:pk>/", 
        FundTimeframeListView.as_view(), 
        name="timeframe-detail"
    ),
    path(
        'funds/<int:fund_id>/share-classes/', 
        ShareClassView.as_view(), 
        name='share-class-list-create'
    ),
    path(
        'funds/<int:fund_id>/share-classes/<int:share_class_id>/', 
        ShareClassView.as_view(), 
        name='share-class-detail-update-delete'
    ),
    path("funds/<int:fund_id>/management-fee/configs/", management_fee_configs),
    path("funds/<int:fund_id>/management-fee/rates/", management_fee_rates),
    path("funds/<int:fund_id>/closing-periods/", closing_periods),
    path("funds/<int:fund_id>/lp-register/", lp_register),
]