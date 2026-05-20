from django.test import TestCase
from django.urls import reverse, resolve
from rest_framework.test import APIClient
from rest_api.views.scenario_views import FundScenarioListView, FundScenarioSynthesisView
from rest_api.models import Fund, Currency, User


class ScenarioURLTests(TestCase):
    """Test URL resolution for scenario endpoints"""
    
    def test_scenario_list_url_resolves(self):
        url = reverse('scenario-list-create', kwargs={'fund_id': 1})
        self.assertEqual(url, '/api/funds/1/scenarios/')
        self.assertEqual(resolve(url).func.cls, FundScenarioListView)
    
    def test_scenario_detail_url_resolves(self):
        url = reverse('scenario-detail', kwargs={'fund_id': 1, 'pk': 5})
        self.assertEqual(url, '/api/funds/1/scenarios/5/')
        self.assertEqual(resolve(url).func.cls, FundScenarioListView)
    
    def test_synthesis_list_url_resolves(self):
        url = reverse('synthesis-list-create', kwargs={'fund_id': 1})
        self.assertEqual(url, '/api/funds/1/scenario-synthesis/')
        self.assertEqual(resolve(url).func.cls, FundScenarioSynthesisView)
    
    def test_synthesis_detail_url_resolves(self):
        url = reverse('synthesis-detail', kwargs={'fund_id': 1, 'pk': 3})
        self.assertEqual(url, '/api/funds/1/scenario-synthesis/3/')
        self.assertEqual(resolve(url).func.cls, FundScenarioSynthesisView)


class ScenarioViewIntegrationTests(TestCase):
    """Integration tests for scenario endpoints"""
    
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
    
    def test_scenario_list_returns_200(self):
        response = self.client.get(f'/api/funds/{self.fund.fund_id}/scenarios/')
        self.assertEqual(response.status_code, 200)
    
    def test_synthesis_list_returns_200(self):
        response = self.client.get(f'/api/funds/{self.fund.fund_id}/scenario-synthesis/')
        self.assertEqual(response.status_code, 200)