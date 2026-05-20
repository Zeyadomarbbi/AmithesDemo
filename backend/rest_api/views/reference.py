from rest_framework.views import APIView
from rest_framework.response import Response

from ..models.reference import *

class CurrencyListView(APIView):
    def get(self, request):
        currencies = Currency.objects.all().order_by('currency_name')
        data = [
            {
                "id": c.currency_id, 
                "name": c.currency_name,
                "symbol": c.currency_symbol, 
                "code": c.currency_code,
                
            } for c in currencies
        ]
        return Response(data)
    
class CountryListView(APIView):
    def get(self, request):
        countries = Country.objects.order_by("country_name")

        return Response([
            {
                "id": c.country_id,
                "name": c.country_name,
                "iso2": c.iso2_code,
                "iso3": c.iso3_code,
                "currency_code": c.currency.currency_code,
            }
            for c in countries
        ])
    
class FundPhaseListView(APIView):
    def get(self, request):
        phases = FundPhase.objects.order_by("phase_id")

        return Response([
            {
                "id": p.phase_id,
                "name": p.phase_name,
            }
            for p in phases
        ])


class WaterfallStepListView(APIView):
    def get(self, request):
        steps = WaterfallStep.objects.order_by("step_number")

        return Response([
            {
                "id": s.waterfall_step_id,
                "step_number": s.step_number,
                "description": s.description,
            }
            for s in steps
        ])

class ManFeePhaseListView(APIView):
    def get(self, request):
        phases = ManFeePhase.objects.order_by("phase_id")
        return Response([
            {
                "id": p.phase_id,
                "name": p.phase_name,
                "basis_description": p.basis_description,
            }
            for p in phases
        ])
    
class PortfolioTransactionTypeListView(APIView):
    def get(self, request):
        types = PortfolioTransactionType.objects.order_by("transaction_id")
        return Response([
            {
                "id": t.transaction_id,
                "name": t.transaction_name,
            }
            for t in types
        ])
