from rest_framework import serializers

from ..models.reference import *

class FinancialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialCategory
        fields = ['category_id', 'name', 'sign_multiplier']
        read_only_fields = fields