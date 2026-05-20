from django.test import TestCase
from django.urls import reverse, resolve
from rest_framework.test import APIClient
from rest_api.views.reference import (
    CurrencyListView,
    CountryListView,
    FundPhaseListView,
    WaterfallStepListView,
    ManFeePhaseListView
)
from rest_api.models import Currency, Country


class ReferenceURLTests(TestCase):
    """Test URL resolution for reference endpoints"""
    
    def test_currency_list_url_resolves(self):
        url = reverse('currency-list')
        self.assertEqual(url, '/api/currencies/')
        self.assertEqual(resolve(url).func.cls, CurrencyListView)
    
    def test_country_list_url_resolves(self):
        url = reverse('country-list')
        self.assertEqual(url, '/api/countries/')
        self.assertEqual(resolve(url).func.cls, CountryListView)
    
    def test_fund_phase_list_url_resolves(self):
        url = reverse('fund-phase-list')
        self.assertEqual(url, '/api/fund-phases/')
        self.assertEqual(resolve(url).func.cls, FundPhaseListView)
    
    def test_waterfall_step_list_url_resolves(self):
        url = reverse('waterfall-step-list')
        self.assertEqual(url, '/api/waterfall-steps/')
        self.assertEqual(resolve(url).func.cls, WaterfallStepListView)
    
    def test_man_fee_phase_list_url_resolves(self):
        url = reverse('man-fee-phase-list')
        self.assertEqual(url, '/api/man-fee-phases/')
        self.assertEqual(resolve(url).func.cls, ManFeePhaseListView)


class ReferenceViewIntegrationTests(TestCase):
    """Integration tests for reference endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        Currency.objects.create(
            currency_id=1,
            currency_name='US Dollar',
            currency_code='USD',
            currency_symbol='$'
        )
        
        Country.objects.create(
            country_id=1,
            country_name='United States',
            country_code='US'
        )
    
    def test_currency_list_returns_200(self):
        response = self.client.get('/api/currencies/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_country_list_returns_200(self):
        response = self.client.get('/api/countries/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_fund_phase_list_returns_200(self):
        response = self.client.get('/api/fund-phases/')
        self.assertEqual(response.status_code, 200)
    
    def test_waterfall_step_list_returns_200(self):
        response = self.client.get('/api/waterfall-steps/')
        self.assertEqual(response.status_code, 200)
    
    def test_man_fee_phase_list_returns_200(self):
        response = self.client.get('/api/man-fee-phases/')
        self.assertEqual(response.status_code, 200)