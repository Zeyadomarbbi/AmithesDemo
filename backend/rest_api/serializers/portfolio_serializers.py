from rest_framework import serializers
from django.db import transaction

from ..models.transactions import *
from ..models.reference import Country, Currency, PortfolioTransactionType

class PortfolioTransactionFlowSerializer(serializers.ModelSerializer):
    investment_id = serializers.IntegerField(source="portfolio_investment.investment_id", read_only=True)
    
    scenario_id = serializers.PrimaryKeyRelatedField(
        queryset=ScenarioList.objects.all(),
        source="scenario",
        allow_null=True,
        required=False
    )
    
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
            "scenario_id",
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
        read_only_fields = [
            "flow_id", 
            "investment_id", 
            "flow_name", 
            "amount",
            "created_at", 
            "updated_at", 
            "is_deleted"
        ]

    def validate(self, data):
        # 1. Auto-calculate amount: LC / FX Rate
        amount_lc = data.get('amount_lc')
        fx_rate = data.get('fx_rate')
        if amount_lc is not None and fx_rate:
            data['amount'] = amount_lc / fx_rate

        # 2. Logic for Divestment Percentage
        transaction_type = data.get('transaction_type')
        div_perc = data.get('divestment_percentage')

        if transaction_type and transaction_type.transaction_name == "Divestment":
            data['divestment_percentage'] = 100.00
        elif div_perc is None:
            # Default to 0 if not provided and not a full divestment
            data['divestment_percentage'] = 0.00
            
        return data

    def create(self, validated_data):
        # 3. Auto-generate flow name
        investment = validated_data.get('portfolio_investment')
        if investment:
            count = PortfolioTransactionFlow.objects.filter(portfolio_investment=investment).count()
            validated_data['flow_name'] = f"#flow {count + 1}"
            
        return super().create(validated_data)

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

class PortfolioInvestmentSerializer(serializers.ModelSerializer):
    fund_id = serializers.IntegerField(source="fund.fund_id", read_only=True)
    transaction_flows = PortfolioTransactionFlowSerializer(many=True, read_only=True)
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
            "transaction_flows",
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