from rest_framework import serializers
from django.db import transaction

from ..models.transactions import *
from ..models.reference import Country, Currency, PortfolioTransactionType

class PortfolioInvestmentSerializer(serializers.ModelSerializer):
    fund_id = serializers.IntegerField(source="fund.fund_id", read_only=True)
    
    scenario_id = serializers.PrimaryKeyRelatedField(
        queryset=ScenarioList.objects.all(),
        source="scenario",
        allow_null=True,
        required=False
    )
    
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all(),
        source="country"
    )
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source="currency"
    )
    
    country_name = serializers.CharField(source="country.country_name", read_only=True)
    currency_code = serializers.CharField(source="currency.currency_code", read_only=True)

    class Meta:
        model = PortfolioInvestment
        fields = [
            "investment_id",
            "fund_id",
            "scenario_id",  # Added to fields
            "country_id",
            "currency_id",
            "country_name",
            "currency_code",
            "name",
            "sector",
            "ownership",
            "created_at",
            "created_by",
            "updated_at",
            "is_deleted",
        ]
        read_only_fields = [
            "investment_id",
            "fund_id",
            "created_at",
            "updated_at",
            "is_deleted",
        ]

class PortfolioTransactionFlowSerializer(serializers.ModelSerializer):
    investment_id = serializers.IntegerField(source="portfolio_investment.investment_id", read_only=True)
    transaction_id = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioTransactionType.objects.all(),
        source="transaction_type"
    )
    transaction_name = serializers.CharField(source="transaction_type.transaction_name", read_only=True)

    class Meta:
        model = PortfolioTransactionFlow
        fields = [
            "flow_id",
            "investment_id",
            "transaction_id",
            "transaction_name",
            "date",
            "flow_name",
            "amount_lc",
            "fx_rate",
            "amount",
            "divestment_percentage",
            "created_at",
            "created_by",
            "updated_at",
            "is_deleted",
        ]
        read_only_fields = ["flow_id", "investment_id", "flow_name", "created_at", "updated_at", "is_deleted"]

class PortfolioFairValueFlowSerializer(serializers.ModelSerializer):
    investment_id = serializers.IntegerField(source="portfolio_investment.investment_id", read_only=True)

    class Meta:
        model = PortfolioFairValueFlow
        fields = [
            "fair_value_id",
            "investment_id",
            "date",
            "amount_lc",
            "fx_rate",
            "amount",
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = ["fair_value_id", "investment_id", "created_at", "updated_at"]
