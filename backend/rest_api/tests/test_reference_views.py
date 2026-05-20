from django.test import TestCase
from rest_framework.test import APIClient
from models import Currency, Country


class ReferenceViewTests(TestCase):
    """Integration tests for reference data endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test data
        Currency.objects.create(
            currency_id=1,
            currency_name='US Dollar',
            currency_code='USD',
            currency_symbol='$'
        )
        Currency.objects.create(
            currency_id=2,
            currency_name='Euro',
            currency_code='EUR',
            currency_symbol='€'
        )
        
        Country.objects.create(
            country_id=1,
            country_name='United States',
            country_code='US'
        )
    
    def test_currency_list_returns_200(self):
        response = self.client.get('/api/currencies/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
    
    def test_currency_list_contains_expected_fields(self):
        response = self.client.get('/api/currencies/')
        first_currency = response.data[0]
        self.assertIn('currency_id', first_currency)
        self.assertIn('currency_name', first_currency)
        self.assertIn('currency_code', first_currency)
        self.assertIn('currency_symbol', first_currency)
    
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
        response = self.client.get('/api/management-fee-phases/')
        self.assertEqual(response.status_code, 200)