from django.urls import path
from ..views.reference import *

urlpatterns = [
    path('currencies/', CurrencyListView.as_view(), name='currency-list'),
    path('countries/', CountryListView.as_view(), name='country-list'),
    path('fund-phases/', FundPhaseListView.as_view(), name='fund-phase-list'),
    path('waterfall-steps/', WaterfallStepListView.as_view(), name='waterfall-step-list'),
    path('man-fee-phases/', ManFeePhaseListView.as_view(), name='man-fee-phase-list'),
]
