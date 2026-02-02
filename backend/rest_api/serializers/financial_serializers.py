from rest_framework import serializers

from ..models.reference import FinancialCategory, FinancialLineItem
from ..models.transactions import FinancialEntry


class FinancialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialCategory
        fields = ["category_id", "name", "sign_multiplier"]
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
