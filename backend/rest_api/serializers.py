from rest_framework import serializers
from .models import *

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

class FactWaterfallRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FactWaterfallRule
        fields = ['id', 'share_class', 'is_selected', 'is_pro_rata', 'fixed_percentage']


class FactWaterfallEnvelopeSerializer(serializers.ModelSerializer):
    rules = FactWaterfallRuleSerializer(many=True)

    class Meta:
        model = FactWaterfallEnvelope
        fields = ['id', 'envelope_number', 'allocation_percentage', 'rules']


class FactFundWaterfallStepSerializer(serializers.ModelSerializer):
    envelopes = FactWaterfallEnvelopeSerializer(many=True)
    
    # Read-only fields for UI display
    step_number = serializers.IntegerField(source='step_definition.step_number', read_only=True)
    step_description = serializers.CharField(source='step_definition.description', read_only=True)

    class Meta:
        model = FactFundWaterfallStep
        fields = [
            'id', 'fund', 'step_definition', 'step_number', 'step_description', 
            'name', 'rate', 'envelopes'
        ]

    def create(self, validated_data):
        """
        Handles creating a whole Step hierarchy: Step -> Envelopes -> Rules
        """
        envelopes_data = validated_data.pop('envelopes')
        step_instance = FactFundWaterfallStep.objects.create(**validated_data)

        for env_data in envelopes_data:
            rules_data = env_data.pop('rules')
            envelope = FactWaterfallEnvelope.objects.create(step_instance=step_instance, **env_data)
            
            for rule_data in rules_data:
                FactWaterfallRule.objects.create(envelope=envelope, **rule_data)

        return step_instance

    def update(self, instance, validated_data):
        """
        Handles updating the hierarchy. 
        Uses update_or_create to allow partial updates of nested data.
        """
        # 1. Update Step Fields
        instance.name = validated_data.get('name', instance.name)
        instance.rate = validated_data.get('rate', instance.rate)
        instance.save()

        # 2. Update Envelopes
        if 'envelopes' in validated_data:
            envelopes_data = validated_data.pop('envelopes')
            
            for env_data in envelopes_data:
                env_number = env_data.get('envelope_number')
                rules_data = env_data.pop('rules', [])
                
                # Get Envelope (1 or 2)
                envelope, _ = FactWaterfallEnvelope.objects.update_or_create(
                    step_instance=instance,
                    envelope_number=env_number,
                    defaults={
                        'allocation_percentage': env_data.get('allocation_percentage', 0)
                    }
                )

                # 3. Update Rules (Share Classes)
                for rule_data in rules_data:
                    share_class = rule_data.get('share_class')
                    FactWaterfallRule.objects.update_or_create(
                        envelope=envelope,
                        share_class=share_class,
                        defaults={
                            'is_selected': rule_data.get('is_selected'),
                            'is_pro_rata': rule_data.get('is_pro_rata', True),
                            'fixed_percentage': rule_data.get('fixed_percentage')
                        }
                    )
        
        return instance

class ManFeePhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimManFeePhase
        fields = [
            "phase_id",
            "phase_name",
            "basis_description",
            "created_at",
        ]
        
class FundManFeeRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FactFundManFeeRule
        fields = [
            "fee_rule_id",
            "fund",
            "phase",
            "share_class",
            "date_from",
            "date_until",
            "rate_percentage",
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = ["fee_rule_id", "created_at", "created_by"]

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