from django.test import TestCase
from django.urls import reverse, resolve
from rest_framework.test import APIClient
from rest_api.views.fund_views import FundWaterfallView, FundManFeeRuleView
from rest_api.models import Fund, Currency, User


class FundURLTests(TestCase):
    """Test URL resolution for fund-specific endpoints"""
    
    def test_waterfall_list_url_resolves(self):
        url = reverse('waterfall-list-create', kwargs={'fund_id': 1})
        self.assertEqual(url, '/api/funds/1/waterfall-steps/')
        self.assertEqual(resolve(url).func.cls, FundWaterfallView)
    
    def test_waterfall_detail_url_resolves(self):
        url = reverse('waterfall-detail', kwargs={'fund_id': 1, 'pk': 5})
        self.assertEqual(url, '/api/funds/1/waterfall-steps/5/')
        self.assertEqual(resolve(url).func.cls, FundWaterfallView)
    
    def test_man_fee_list_url_resolves(self):
        url = reverse('fund-man-fee-list-create', kwargs={'fund_id': 1})
        self.assertEqual(url, '/api/funds/1/management-fees/')
        self.assertEqual(resolve(url).func.cls, FundManFeeRuleView)
    
    def test_man_fee_detail_url_resolves(self):
        url = reverse('fund-man-fee-detail-update', kwargs={'fund_id': 1, 'fee_rule_id': 3})
        self.assertEqual(url, '/api/funds/1/management-fees/3/')
        self.assertEqual(resolve(url).func.cls, FundManFeeRuleView)


class FundViewIntegrationTests(TestCase):
    """Integration tests for fund endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        
        self.currency = Currency.objects.create(
            currency_id=1,
            currency_name='USD',
            currency_code='USD',
            currency_symbol='$'
        )
        
        self.fund = Fund.objects.create(
            legal_name='Test Fund',
            short_name='TF',
            phase_name='Investment',
            currency=self.currency,
            created_by=self.user.username
        )
    
    def test_waterfall_list_returns_200(self):
        response = self.client.get(f'/api/funds/{self.fund.fund_id}/waterfall-steps/')
        self.assertEqual(response.status_code, 200)
    
    def test_man_fee_list_returns_200(self):
        response = self.client.get(f'/api/funds/{self.fund.fund_id}/management-fees/')
        self.assertEqual(response.status_code, 200)