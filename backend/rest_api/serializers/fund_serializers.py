from rest_framework import serializers
from django.apps import apps

from ..models.reference import (
    FundWaterfallSteps,
    FundWaterfallStepRules,
    FundWaterfallEnvelopes,
    FundWaterfallEnvelopeRules,
    FundManFeeRules,
    WaterfallStep,
    ManFeePhase,
)

# ✅ Safe dynamic model resolution (no direct imports)
Fund = apps.get_model("rest_api", "Fund")
ShareClass = apps.get_model("rest_api", "ShareClass")


# =========================
# Reference Serializers
# =========================

class WaterfallStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterfallStep
        fields = "__all__"
        read_only_fields = fields


class ManFeePhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManFeePhase
        fields = "__all__"
        read_only_fields = fields


# =========================
# Waterfall Serializers
# =========================

class FundWaterfallStepRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundWaterfallStepRules
        fields = "__all__"
        read_only_fields = fields


class FundWaterfallStepsSerializer(serializers.ModelSerializer):
    step_rules = FundWaterfallStepRulesSerializer(many=True, read_only=True)

    class Meta:
        model = FundWaterfallSteps
        fields = "__all__"
        read_only_fields = fields


class FundWaterfallEnvelopeRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundWaterfallEnvelopeRules
        fields = "__all__"
        read_only_fields = fields


class FundWaterfallEnvelopesSerializer(serializers.ModelSerializer):
    rules = FundWaterfallEnvelopeRulesSerializer(many=True, read_only=True)

    class Meta:
        model = FundWaterfallEnvelopes
        fields = "__all__"
        read_only_fields = fields


# =========================
# Management Fee Serializers
# =========================

class FundManFeeRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundManFeeRules
        fields = "__all__"
        read_only_fields = fields


# =========================
# Fund / ShareClass Serializers (only if you actually use them)
# =========================

class FundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fund
        fields = "__all__"
        read_only_fields = fields


class ShareClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareClass
        fields = "__all__"
        read_only_fields = fields
