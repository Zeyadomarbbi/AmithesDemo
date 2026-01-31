from django.urls import path

from ..views.fund_views import *

urlpatterns = [
    # List and Create
    path(
        "funds/<int:fund_id>/waterfall-steps/", 
        FundWaterfallView.as_view(), 
        name="waterfall-list-create"
    ),
    # Detail, Update, Delete
    path(
        "funds/<int:fund_id>/waterfall-steps/<int:pk>/", 
        FundWaterfallView.as_view(), 
        name="waterfall-detail"
    ),
    # List and Create (fee_rule_id is None)
    path(
        "funds/<int:fund_id>/man-fees-rules/", 
        FundManFeeRuleView.as_view(), 
        name="fund-man-fee-list-create"
    ),
    # Detail, Update, and Delete (fee_rule_id is provided)
    path(
        "funds/<int:fund_id>/man-fees-rules/<int:fee_rule_id>/", 
        FundManFeeRuleView.as_view(), 
        name="fund-man-fee-detail-update"
    ),
]