from rest_framework import serializers
from .models import DimTimeframe, DimScenarioList, DimScenarioSynthesis, MapScenarioSynthesis, DimFund, DimPhase, DimShareClass

class TimeframeSerializer(serializers.ModelSerializer):
    date_id = serializers.IntegerField(source="date.date_id")
    full_date = serializers.DateField(source="date.full_date")
    quarter = serializers.IntegerField(source="date.quarter")
    year = serializers.IntegerField(source="date.year")
    class Meta:
        model = DimTimeframe
        fields = [
            "timeframe_id",
            "display_label",
            "date_id",
            "full_date",
            "quarter",
            "year",
        ]

class PhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimPhase
        fields = ['phase_id', 'phase_name']

class FundSerializer(serializers.ModelSerializer):
    formation_date_string = serializers.SerializerMethodField()
    phase_name = serializers.SerializerMethodField()
    currency_name = serializers.SerializerMethodField()
    currency_symbol = serializers.SerializerMethodField()
    class Meta:
        model = DimFund
        fields = [
            'fund_id', 'created_at', 'updated_at',
            'legal_name', 'short_name', 'fund_strategy', 'legal_form', 'management_company',
            'formation_date', 'phase', 'currency',
            'formation_date_string', 'phase_name', 'currency_name', 'currency_symbol'
        ]

    # These methods safely return None or "–" if the relation is missing
    def get_formation_date_string(self, obj):
        return obj.formation_date.full_date if obj.formation_date else None

    def get_phase_name(self, obj):
        return obj.phase.phase_name if obj.phase else "–"

    def get_currency_name(self, obj):
        return obj.currency.currency_name if obj.currency else None

    def get_currency_symbol(self, obj):
        return obj.currency.currency_symbol if obj.currency else ""

class ShareClassSerializer(serializers.ModelSerializer):
    fund_id = serializers.IntegerField(source="fund.fund_id", read_only=True)
    document_file = serializers.FileField(write_only=True, required=False)
    
    # NEW: Read-only field for the download URL
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = DimShareClass
        fields = [
            "share_class_id", "fund_id", "share_class_name", "isin_code", 
            "nominal_value", "issuance_method", "distribution_method", 
            "ppm_description", 
            "document_name", "document_mime_type", 
            "document_file", "document_url", "document_size",
            "created_at", "created_by"
        ]
        read_only_fields = ["share_class_id", "created_at", "created_by", "document_url", "document_size"]

    def get_document_url(self, obj):
        if obj.document_file:
            # Returns full URL: http://localhost:8000/media/share_class_docs/file.pdf
            request = self.context.get('request')
            return request.build_absolute_uri(obj.document_file.url)
        return None

    def create(self, validated_data):
        file_obj = validated_data.get('document_file')
        if file_obj:
            validated_data['document_name'] = file_obj.name
            validated_data['document_mime_type'] = file_obj.content_type
            validated_data['document_size'] = file_obj.size
        return super().create(validated_data)

class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimScenarioList
        fields = [
            "scenario_id",
            "fund_id",
            "scenario_name",
            "description",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["scenario_id", "created_at", "created_by", "fund_id"]

    def validate(self, attrs):
        # Access fund_id passed from the View context
        fund_id = self.context.get("fund_id")
        name = attrs.get("scenario_name")

        # Check for existing scenario name within the specific fund
        if DimScenarioList.objects.filter(fund_id=fund_id, scenario_name=name).exists():
            raise serializers.ValidationError(
                {"scenario_name": "Scenario name must be unique per fund."}
            )
        return attrs
    
class MapScenarioSynthesisSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapScenarioSynthesis
        fields = ['scenario']

class DimScenarioSynthesisSerializer(serializers.ModelSerializer):
    # This allows viewing/sending a list of scenario IDs with the synthesis
    scenarios = MapScenarioSynthesisSerializer(many=True, source='scenario_mappings', read_only=True)
    scenario_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)
    class Meta:
        model = DimScenarioSynthesis
        fields = [
            'synthesis_id', 'fund', 'synthesis_name', 
            'description', 'created_at', 'created_by', 
            'scenarios', 'scenario_ids'
        ]
        # Ensure created_by is NOT in read_only_fields if you want to override it here
        read_only_fields = ['created_at']

    def create(self, validated_data):
        scenario_ids = validated_data.pop('scenario_ids', [])
        synthesis = DimScenarioSynthesis.objects.create(**validated_data)
        
        # Bulk create the mappings
        mappings = [
            MapScenarioSynthesis(synthesis=synthesis, scenario_id=sid) 
            for sid in scenario_ids
        ]
        MapScenarioSynthesis.objects.bulk_create(mappings)
        
        return synthesis