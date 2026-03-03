from rest_framework import serializers
from django.contrib.auth.models import User

from ..models.core import *
from ..models.core import Timeframe
from ..models.reference import Currency

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 
            'email', 'password', 'is_active', 'is_staff', 
            'is_superuser', 'date_joined'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'username': {'required': True},
            'email': {'required': True}, # Recommended to make email required
            'date_joined': {'read_only': True}
        }

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class FundSerializer(serializers.ModelSerializer):
    # Explicitly map currency_id for the incoming payload
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(), 
        source='currency'
    )

    class Meta:
        model = Fund
        fields = [
            'fund_id',
            'legal_name',
            'short_name',
            'fund_strategy',
            'legal_form',
            'management_company',
            'formation_date',
            'phase_name',
            'currency_id',
            'created_at',
            'updated_at',
            'is_deleted',
        ]
        read_only_fields = ['fund_id', 'created_at', 'updated_at', 'is_deleted']

class TimeframeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timeframe
        fields = [
            "timeframe_id",
            "name",
            "date",
            "quarter",
            "year",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["fund", "timeframe_id", "quarter", "year", "created_at"]

class ShareClassSerializer(serializers.ModelSerializer):
    fund_id = serializers.IntegerField(source="fund.fund_id", read_only=True)

    # Accept uploaded file
    document_file = serializers.FileField(write_only=True, required=False)

    # Read-only URL for frontend
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = ShareClass
        fields = [
            "share_class_id",
            "fund_id",
            "share_class_name",
            "isin_code",
            "nominal_value",
            "issuance_method",
            "distribution_method",
            "ppm_description",
            "document_link",    # DB column
            "document_file",    # Upload field
            "document_url",     # Computed download URL
            "document_name", # <--- Ensure this is here
            "document_mime_type", # <--- Ensure this is here
            "document_size", # <--- Ensure this is here
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = ["share_class_id", "created_at", "updated_at", "created_by", "document_url"]

    def get_document_url(self, obj):
        if obj.document_link:
            request = self.context.get('request')
            if request:
                # Return absolute URL for frontend
                return request.build_absolute_uri(obj.document_link)
            return obj.document_link
        return None

    def create(self, validated_data):
        file_obj = validated_data.pop("document_file", None)
        if file_obj:
            # Save file to MEDIA_ROOT/share_class_docs/
            from django.core.files.storage import default_storage
            path = default_storage.save(f"share_class_docs/{file_obj.name}", file_obj)
            validated_data["document_link"] = default_storage.url(path)
            validated_data["document_name"] = file_obj.name
            validated_data["document_mime_type"] = file_obj.content_type  # Mime Type
            validated_data["document_size"] = file_obj.size
        return super().create(validated_data)

    def update(self, instance, validated_data):
        file_obj = validated_data.pop("document_file", None)
        if file_obj:
            from django.core.files.storage import default_storage
            path = default_storage.save(f"share_class_docs/{file_obj.name}", file_obj)
            validated_data["document_link"] = default_storage.url(path)
        return super().update(instance, validated_data)
    
class FundManFeeCommitmentYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundManFeeCommitmentYear
        fields = [
            'fund_id',
            'commitment_from',
            'commitment_from_year',
            'commitment_from_year_start',
            'commitment_from_year_end',
            'commitment_until',
            'commitment_until_year',
            'commitment_until_year_start',
            'commitment_until_year_end'
        ]