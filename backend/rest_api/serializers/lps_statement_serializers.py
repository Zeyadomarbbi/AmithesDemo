from rest_framework import serializers
from ..models.reference import ClosingPeriod
from ..models.transactions import FundClosing, LPsFundCommitment
from ..models.core import LimitedPartner

class ClosingPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClosingPeriod
        fields = '__all__'

class FundClosingSerializer(serializers.ModelSerializer):
    # This grabs the closing_name from the related ClosingPeriod model
    closing_name = serializers.CharField(source='closing_period.closing_name', read_only=True)

    class Meta:
        model = FundClosing
        fields = [
            'lps_fund_closing_period_id', 
            'date', 
            'created_at', 
            'created_by', 
            'fund', 
            'closing_period', 
            'closing_name' # Add this
        ]

class LimitedPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LimitedPartner
        fields = [
            'lp_id',
            'country',
            'name',
            'address',
            'city',
            'zip_code',
            'iban',
            'bank_name',
            'swift',
            'created_at',
            'created_by',
            'updated_at',
            'is_deleted',
        ]
        read_only_fields = ['lp_id', 'created_at', 'updated_at']


class LPsFundCommitmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LPsFundCommitment
        fields = '__all__'
        read_only_fields = ['commitment_id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = None
        return super().create(validated_data)