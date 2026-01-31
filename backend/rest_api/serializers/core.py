from rest_framework import serializers


from ..models.core import *
from ..models.core import Timeframe
from ..models.reference import Currency

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