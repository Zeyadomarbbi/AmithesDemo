from rest_framework import serializers

from ..models.reference import (
    FinancialCategory,
    FinancialLineItem,

    FundWaterfallSteps,
    FundWaterfallStepRules,
    FundWaterfallEnvelopes,
    FundWaterfallEnvelopeRules,
    FundManFeeRules,
    ScenarioList,
    ScenarioSynthesis,
)

from ..models.core import Timeframe
from ..models.transactions import FinancialEntry


class FinancialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialCategory
        fields = ["category_id", "name", "sign_multiplier"]
        read_only_fields = fields


class TimeframeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timeframe
        fields = "__all__"
        read_only_fields = fields


class FinancialLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialLineItem
        fields = "__all__"
        read_only_fields = fields


class FinancialEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialEntry
        fields = "__all__"
        read_only_fields = fields


# Waterfall
class FundWaterfallStepsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundWaterfallSteps
        fields = "__all__"
        read_only_fields = fields


class FundWaterfallStepRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundWaterfallStepRules
        fields = "__all__"
        read_only_fields = fields


class FundWaterfallEnvelopesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundWaterfallEnvelopes
        fields = "__all__"
        read_only_fields = fields


class FundWaterfallEnvelopeRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundWaterfallEnvelopeRules
        fields = "__all__"
        read_only_fields = fields


class FundManFeeRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundManFeeRules
        fields = "__all__"
        read_only_fields = fields


# Scenarios
class ScenarioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioList
        fields = "__all__"
        read_only_fields = fields


class ScenarioSynthesisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioSynthesis
        fields = "__all__"
        read_only_fields = fields
