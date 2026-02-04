from django.urls import path

from ..views.lps_statement_views import LimitedPartnerViewSet, LPsFundCommitmentViewSet
from ..views import ClosingPeriodList, ClosingPeriodDetail, FundClosingListCreate, FundClosingDetail

limited_partner_list = LimitedPartnerViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

limited_partner_detail = LimitedPartnerViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

commitment_list = LPsFundCommitmentViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

commitment_detail = LPsFundCommitmentViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('closing-periods/', ClosingPeriodList.as_view(), name='closing-period-list'),
    path('closing-periods/<int:closing_id>/', ClosingPeriodDetail.as_view(), name='closing-period-detail'),
    path('funds/<int:fund_id>/fund-closings/', FundClosingListCreate.as_view(), name='fund-closing-list-create'),
    path('funds/<int:fund_id>/fund-closings/<int:pk>/', FundClosingDetail.as_view(), name='fund-closing-detail'),
    path('limited-partners/', limited_partner_list),
    path('limited-partners/<int:pk>/', limited_partner_detail),
    path('funds/<int:fund_id>/fund-commitments/', commitment_list, name='fund-commitment-list'),
    path('funds/<int:fund_id>/fund-commitments/<int:pk>/', commitment_detail, name='fund-commitment-detail'),
]