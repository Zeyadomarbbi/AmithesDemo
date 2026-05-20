from django.urls import path

from ..views.lps_statement_views import (LimitedPartnerViewSet, LPsFundCommitmentViewSet,     LimitedPartnerViewSet,
    LPsFundCommitmentViewSet,


    FundClosingListCreate,
    FundClosingDetail,

    # ✅ Capital Flows
    OperationTypeList,
    FlowTypeList,
    LPsOperationDetailsViewSet,
    LPsOperationFlowViewSet,
    LPsFlowLPAllocationViewSet,
    LPsOperationLPAllocationViewSet,
    )

from ..views import  FundClosingListCreate, FundClosingDetail

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
operation_list = LPsOperationDetailsViewSet.as_view({
    "get": "list",
    "post": "create",
})

operation_detail = LPsOperationDetailsViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})
# ✅ Step 2: Flows
operation_flow_list = LPsOperationFlowViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

operation_flow_detail = LPsOperationFlowViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

lp_allocation_list = LPsFlowLPAllocationViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

lp_allocation_detail = LPsFlowLPAllocationViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

lp_operation_summary = LPsOperationLPAllocationViewSet.as_view({
    'get': 'summary'
})

# ✅ Step 2: Allocations
# allocation_list = LPsOperationFlowShareClassAllocationViewSet.as_view({
#     "get": "list",
#     "post": "create",
# })

# allocation_detail = LPsOperationFlowShareClassAllocationViewSet.as_view({
#     "get": "retrieve",
#     "put": "update",
#     "patch": "partial_update",
#     "delete": "destroy",
# })

urlpatterns = [
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
    path("funds/<int:fund_id>/operations/<int:lps_operation_details_id>/flows/", operation_flow_list, name="operation-flow-list"),
    path("funds/<int:fund_id>/operations/<int:lps_operation_details_id>/flows/<int:pk>/", operation_flow_detail, name="operation-flow-detail"),
    path("funds/<int:fund_id>/operations/<int:lps_operation_details_id>/flows/<int:operation_flow_id>/lp_allocations/", lp_allocation_list, name="flow-allocation-list"),
    path("funds/<int:fund_id>/operations/<int:lps_operation_details_id>/flows/<int:operation_flow_id>/lp_allocations/<int:pk>/", lp_allocation_detail, name="flow-allocation-detail"),
    path("funds/<int:fund_id>/lp-allocations/", LPsOperationLPAllocationViewSet.as_view({'get': 'list_by_fund'}), name="fund-lp-allocation-list"),
    path("funds/<int:fund_id>/operations/<int:lps_operation_details_id>/lp-allocations/", LPsOperationLPAllocationViewSet.as_view({'get': 'list', 'post': 'create'}), name="operation-lp-allocation-list"),
    path(
        "funds/<int:fund_id>/operations/<int:lps_operation_details_id>/lp-allocations/summary/", 
        lp_operation_summary, 
        name="operation-lp-allocation-summary"
    ),
    path(
        "funds/<int:fund_id>/operations/<int:lps_operation_details_id>/lp-allocations/<int:pk>/", 
        LPsOperationLPAllocationViewSet.as_view({
            'get': 'retrieve', 
            'put': 'update', 
            'patch': 'partial_update', 
            'delete': 'destroy'
        }), 
        name="operation-lp-allocation-detail"
    ),
    # path(
    #     "funds/<int:fund_id>/operations/<int:lps_operation_details_id>/lp-allocations/", 
    #     LPsOperationLPSummaryViewSet.as_view({'get': 'list'}), 
    #     name="operation-lp-summary"
    # ),
    
    # One-shot create (Step 1 + Step 2)
    # path("funds/<int:fund_id>/operations/full-create/", OperationFullCreate.as_view(), name="operation-full-create"),
]