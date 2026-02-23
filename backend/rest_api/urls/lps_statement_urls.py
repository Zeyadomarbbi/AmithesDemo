from django.urls import path

from ..views.lps_statement_views import (LimitedPartnerViewSet, LPsFundCommitmentViewSet,     LimitedPartnerViewSet,
    LPsFundCommitmentViewSet,

    ClosingPeriodList,
    ClosingPeriodDetail,
    FundClosingListCreate,
    FundClosingDetail,

    # ✅ Capital Flows
    OperationTypeList,
    FlowTypeList,
    OperationViewSet,
    OperationFlowViewSet,
    OperationAllocationViewSet,
    OperationFullCreate,

    # ✅ Step 3
    OperationStep3Preview,
    OperationStep3Confirm)

from ..views import ClosingPeriodList, ClosingPeriodDetail, FundClosingListCreate, FundClosingDetail

limited_partner_list = LimitedPartnerViewSet.as_view({
    "get": "list",
    "post": "create",
})

limited_partner_detail = LimitedPartnerViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

commitment_list = LPsFundCommitmentViewSet.as_view({
    "get": "list",
    "post": "create",
})

commitment_detail = LPsFundCommitmentViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

# ✅ Step 1: Operations
# Your OperationViewSet currently implements list/create only (per your posted code),
# so we map ONLY get(list) + post(create) to avoid broken routes.
operation_list = OperationViewSet.as_view({
    "get": "list",
    "post": "create",
})

operation_detail = OperationViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

# If you later implement retrieve/update/destroy inside OperationViewSet,
# you can re-enable this block safely.
# operation_detail = OperationViewSet.as_view({
#     "get": "retrieve",
#     "put": "update",
#     "patch": "partial_update",
#     "delete": "destroy",
# })

# ✅ Step 2: Flows
operation_flow_list = OperationFlowViewSet.as_view({
    "get": "list",
    "post": "create",
})

operation_flow_detail = OperationFlowViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

# ✅ Step 2: Allocations
allocation_list = OperationAllocationViewSet.as_view({
    "get": "list",
    "post": "create",
})

allocation_detail = OperationAllocationViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

urlpatterns = [
    path('closing-periods/', ClosingPeriodList.as_view(), name='closing-period-list'),
    path('closing-periods/<int:closing_id>/', ClosingPeriodDetail.as_view(), name='closing-period-detail'),
    path('limited-partners/', limited_partner_list),
    path('limited-partners/<int:pk>/', limited_partner_detail),
    path("operation-types/", OperationTypeList.as_view(), name="operation-type-list"),
    path("flow-types/", FlowTypeList.as_view(), name="flow-type-list"),
    path('funds/<int:fund_id>/fund-closings/', FundClosingListCreate.as_view(), name='fund-closing-list-create'),
    path('funds/<int:fund_id>/fund-closings/<int:pk>/', FundClosingDetail.as_view(), name='fund-closing-detail'),

    path('funds/<int:fund_id>/fund-commitments/', commitment_list, name='fund-commitment-list'),
    path('funds/<int:fund_id>/fund-commitments/<int:pk>/', commitment_detail, name='fund-commitment-detail'),
    # Step 1
    path("funds/<int:fund_id>/operations/", operation_list, name="operation-list"),
    path("funds/<int:fund_id>/operations/<int:pk>/", operation_detail, name="operation-detail"),
    # Step 2 (flows)
    path("funds/<int:fund_id>/operations/<int:operation_id>/flows/", operation_flow_list, name="operation-flow-list"),
    path("funds/<int:fund_id>/operations/<int:operation_id>/flows/<int:pk>/", operation_flow_detail, name="operation-flow-detail"),
    # Step 2 (allocations)
    path("funds/<int:fund_id>/operations/<int:operation_id>/allocations/", allocation_list, name="operation-allocation-list"),
    path("funds/<int:fund_id>/operations/<int:operation_id>/allocations/<int:pk>/", allocation_detail, name="operation-allocation-detail"),

    # One-shot create (Step 1 + Step 2)
    path("funds/<int:fund_id>/operations/full-create/", OperationFullCreate.as_view(), name="operation-full-create"),

    # ✅ Step 3
    path("operations/<int:operation_id>/step3-preview/", OperationStep3Preview.as_view(), name="operation-step3-preview"),
    path("operations/<int:operation_id>/lp-allocations/confirm/", OperationStep3Confirm.as_view(), name="operation-step3-confirm"),
]