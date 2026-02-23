from rest_framework import serializers
from decimal import Decimal, InvalidOperation

from ..models.reference import ClosingPeriod, LPsOperationFlowType, LPsOperationType
from ..models.transactions import FundClosing, LPsFundCommitment, LPsOperationDetails, LPsOperationFlow, LPsOperationFlowLPAllocation, LPsOperationLPAllocation, LPsOperationFlowShareClassAllocation
from ..models.core import LimitedPartner

def _to_decimal(v):
    if v is None or v == "":
        return None
    if isinstance(v, Decimal):
        return v
    try:
        return Decimal(str(v))
    except (InvalidOperation, ValueError, TypeError):
        return None
    

def _normalize_fraction(v: Decimal | None, field_name: str) -> Decimal | None:
    """
    FE can send:
      - fraction: 0.12
      - percent: 12
    Normalize to fraction:
      - 0..1   => keep
      - 1..100 => divide by 100
      - >100   => error (prevents huge numbers / max_digits errors)
    """
    if v is None:
        return None

    if v < 0:
        raise serializers.ValidationError({field_name: "Must be >= 0."})

    if v <= 1:
        return v

    if v <= 100:
        return v / Decimal("100")

    raise serializers.ValidationError(
        {field_name: "Must be between 0..1 (or 0..100 as percent)."}
    )
    
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
    
class LPsOperationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LPsOperationType
        fields = ["operation_type_id", "name", "sign_multiplier", "created_at"]

class LPsOperationFlowTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LPsOperationFlowType
        fields = ["flow_type_id", "name", "created_at"]

class LPsFlowLPAllocationSerializer(serializers.ModelSerializer):
    # Using IntegerFields for IDs to bypass broken model lookups
    lp_id = serializers.IntegerField(source='limited_partner_id')
    
    class Meta:
        model = LPsOperationFlowLPAllocation
        fields = [
            "lp_flow_allocation_id",
            "lp_id",
            "allocated_amount",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["lp_flow_allocation_id", "created_at"]

class LPsOperationFlowSerializer(serializers.ModelSerializer):
    lps_operation_details_id = serializers.IntegerField(write_only=True, required=False)
    lp_allocations = LPsFlowLPAllocationSerializer(many=True, read_only=True)

    class Meta:
        model = LPsOperationFlow
        fields = [
            "operation_flow_id",
            "lps_operation_details_id",
            "flow_type_id",
            "flow_name",
            "input_type",
            "input_amount",
            "input_percentage",
            "allocation_percentage_of_commitment",
            "commitment_amount",
            "computed_total_amount",
            "created_at",
            "created_by",
            "lp_allocations",  # ✅ Include the child field here
        ]
        read_only_fields = ["operation_flow_id", "lps_operation_details_id", "created_at"]

    def validate_input_percentage(self, value):
        d = _to_decimal(value)
        d = _normalize_fraction(d, "input_percentage")
        return d

    def validate_allocation_percentage_of_commitment(self, value):
        d = _to_decimal(value)
        d = _normalize_fraction(d, "allocation_percentage_of_commitment")
        return d if d is not None else Decimal("0")
    
    def validate_input_type(self, value):
        if value not in ["amount", "percentage"]:
            raise serializers.ValidationError("input_type must be either 'amount' or 'percentage'.")
        return value
    
class LPsOperationDetailsSerializer(serializers.ModelSerializer):
    # Aliasing for frontend compatibility if DB columns differ
    flows = LPsOperationFlowSerializer(many=True, read_only=True)
    class Meta:
        model = LPsOperationDetails
        fields = [
            "lps_operation_details_id",
            "fund_id",
            "operation_type_id",
            "operation_name",
            "operation_number",
            "notice_date",
            "due_date",
            "flows",
            "created_at",
        ]
        read_only_fields = ["lps_operation_details_id", "fund_id", "created_at"]

    def to_representation(self, instance):
        """

        dynamically during GET operations.
        """
        ret = super().to_representation(instance)
        # Ensure dates are ISO strings automatically handled by DRF DateField
        return ret




class LPsOperationFlowShareClassAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LPsOperationFlowShareClassAllocation
        fields = [
            "operation_allocation_id",

            # keep as-is (if it works in your DB)
            "operation",

            "flow",
            "lp",
            "share_class",
            "commitment_amount",
            "capital_call",
            "called_percentage",
            "shares_issued",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["operation_allocation_id", "created_at"]

    def validate_called_percentage(self, value):
        d = _to_decimal(value)
        d = _normalize_fraction(d, "called_percentage")
        return d if d is not None else Decimal("0")


# =========================
# Nested create (Step 1 + Step 2)
# =========================

class AllocationCreateItemSerializer(serializers.Serializer):
    lp_id = serializers.IntegerField()
    share_class_id = serializers.IntegerField()
    commitment_amount = serializers.DecimalField(max_digits=20, decimal_places=6)
    capital_call = serializers.DecimalField(max_digits=20, decimal_places=6)
    called_percentage = serializers.DecimalField(max_digits=10, decimal_places=6)
    shares_issued = serializers.DecimalField(max_digits=20, decimal_places=6)

    def validate_called_percentage(self, value):
        d = _to_decimal(value)
        d = _normalize_fraction(d, "called_percentage")
        return d if d is not None else Decimal("0")


class FlowCreateItemSerializer(serializers.Serializer):
    flow_type_id = serializers.IntegerField()
    flow_name = serializers.CharField()

    input_type = serializers.ChoiceField(choices=["amount", "percentage"])

    input_amount = serializers.DecimalField(
        max_digits=20, decimal_places=6, required=False, allow_null=True
    )
    input_percentage = serializers.DecimalField(
        max_digits=10, decimal_places=6, required=False, allow_null=True
    )

    allocation_percentage_of_commitment = serializers.DecimalField(
        max_digits=10, decimal_places=6, required=False, default=Decimal("0")
    )
    commitment_amount = serializers.DecimalField(
        max_digits=20, decimal_places=6, required=False, default=Decimal("0")
    )

    allocations = AllocationCreateItemSerializer(many=True, required=False, default=list)

    def validate_input_percentage(self, value):
        d = _to_decimal(value)
        d = _normalize_fraction(d, "input_percentage")
        return d

    def validate_allocation_percentage_of_commitment(self, value):
        d = _to_decimal(value)
        d = _normalize_fraction(d, "allocation_percentage_of_commitment")
        return d if d is not None else Decimal("0")


class OperationFullCreateSerializer(serializers.Serializer):
    operation_type_id = serializers.IntegerField()
    operation_name = serializers.CharField()
    notice_date_id = serializers.IntegerField(required=False, allow_null=True)
    due_date_id = serializers.IntegerField(required=False, allow_null=True)

    flows = FlowCreateItemSerializer(many=True, required=True)


class LPsOperationLpAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LPsOperationLPAllocation
        fields = "__all__"
        read_only_fields = ["operation_allocation_id", "created_at"]
