from django.test import TestCase
from django.urls import reverse, resolve
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_api.views.core import (
    FundViewSet,
    FundTimeframeView,
    ShareClassView,
    management_fee_configs,
    management_fee_rates,
    closing_periods,
    lp_register
)
from rest_api.models import Fund, Currency


class CoreURLTests(TestCase):
    """Test URL resolution for core endpoints"""
    
    def test_fund_list_url_resolves(self):
        url = reverse('fund-list')
        self.assertEqual(url, '/api/funds/')
        self.assertEqual(resolve(url).func.cls, FundViewSet)
    
    def test_fund_detail_url_resolves(self):
        url = reverse('fund-detail', kwargs={'fund_id': 1})
        self.assertEqual(url, '/api/funds/1/')
        self.assertEqual(resolve(url).func.cls, FundViewSet)
    
    def test_timeframe_list_url_resolves(self):
        url = reverse('timeframe-list-create', kwargs={'fund_id': 1})
        self.assertEqual(url, '/api/funds/1/timeframes/')
        self.assertEqual(resolve(url).func.cls, FundTimeframeView)
    
    def test_timeframe_detail_url_resolves(self):
        url = reverse('timeframe-detail', kwargs={'fund_id': 1, 'pk': 5})
        self.assertEqual(url, '/api/funds/1/timeframes/5/')
        self.assertEqual(resolve(url).func.cls, FundTimeframeView)
    
    def test_share_class_list_url_resolves(self):
        url = reverse('share-class-list-create', kwargs={'fund_id': 1})
        self.assertEqual(url, '/api/funds/1/share-classes/')
        self.assertEqual(resolve(url).func.cls, ShareClassView)
    
    def test_share_class_detail_url_resolves(self):
        url = reverse('share-class-detail-update-delete', kwargs={'fund_id': 1, 'share_class_id': 2})
        self.assertEqual(url, '/api/funds/1/share-classes/2/')
        self.assertEqual(resolve(url).func.cls, ShareClassView)


class CoreViewIntegrationTests(TestCase):
    """Integration tests for core endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test user FIRST
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Authenticate client
        self.client.force_authenticate(user=self.user)
        
        # Create test currency
        self.currency = Currency.objects.create(
            currency_id=1,
            currency_name='USD',
            currency_code='USD',
            currency_symbol='$'
        )
        
        # Create test fund
        self.fund = Fund.objects.create(
            legal_name='Test Fund',
            short_name='TF',
            phase_name='Investment',
            currency=self.currency,
            created_by=self.user.username
        )
    
    def test_fund_list_returns_200(self):
        response = self.client.get('/api/funds/')
        self.assertEqual(response.status_code, 200)
    
    def test_fund_detail_returns_200(self):
        response = self.client.get(f'/api/funds/{self.fund.fund_id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['legal_name'], 'Test Fund')
    
    def test_fund_create(self):
        data = {
            'legal_name': 'New Fund',
            'short_name': 'NF',
            'phase_name': 'Fundraising',
            'currency_id': self.currency.currency_id
        }
        response = self.client.post('/api/funds/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['legal_name'], 'New Fund')
    
    def test_fund_update(self):
        data = {'legal_name': 'Updated Fund Name'}
        response = self.client.patch(f'/api/funds/{self.fund.fund_id}/', data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['legal_name'], 'Updated Fund Name')
    
    def test_fund_soft_delete(self):
        response = self.client.delete(f'/api/funds/{self.fund.fund_id}/')
        self.assertEqual(response.status_code, 204)
        
        # Verify soft delete
        fund = Fund.objects.get(fund_id=self.fund.fund_id)
        self.assertTrue(fund.is_deleted)