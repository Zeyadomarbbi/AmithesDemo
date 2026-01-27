from rest_framework import serializers

from ..models.transactions import *

class FundWaterfallRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundWaterfallRules
        fields = [
            'waterfall_rule_id', 'envelope', 'share_class', 
            'is_selected', 'is_pro_rata', 'fixed_percentage'
        ]
        read_only_fields = ['envelope']

class FundWaterfallEnvelopeSerializer(serializers.ModelSerializer):
    rules = FundWaterfallRuleSerializer(many=True)

    class Meta:
        model = FundWaterfallEnvelopes
        fields = [
            'waterfall_envelope_id', 'fund_waterfall_steps', 
            'envelope_number', 'allocation_percentage', 'rules'
        ]
        read_only_fields = ['fund_waterfall_steps']

class FundWaterfallStepSerializer(serializers.ModelSerializer):
    envelopes = FundWaterfallEnvelopeSerializer(many=True)
    step_number = serializers.IntegerField(source='step_definition.step_number', read_only=True)
    step_description = serializers.CharField(source='step_definition.description', read_only=True)

    class Meta:
        model = FundWaterfallSteps
        fields = [
            'fund_waterfall_step_id', 'fund', 'step_definition', 
            'step_number', 'step_description', 'step_name', 
            'step_rate', 'envelopes'
        ]

    def create(self, validated_data):
        envelopes_data = validated_data.pop('envelopes')
        step = FundWaterfallSteps.objects.create(**validated_data)

        for env_data in envelopes_data:
            rules_data = env_data.pop('rules')
            envelope = FundWaterfallEnvelopes.objects.create(fund_waterfall_steps=step, **env_data)
            for rule_data in rules_data:
                FundWaterfallRules.objects.create(envelope=envelope, **rule_data)
        return step

    def update(self, instance, validated_data):
        instance.step_name = validated_data.get('step_name', instance.step_name)
        instance.step_rate = validated_data.get('step_rate', instance.step_rate)
        instance.save()

        if 'envelopes' in validated_data:
            envelopes_data = validated_data.pop('envelopes')
            for env_data in envelopes_data:
                rules_data = env_data.pop('rules', [])
                envelope, _ = FundWaterfallEnvelopes.objects.update_or_create(
                    fund_waterfall_steps=instance,
                    envelope_number=env_data.get('envelope_number'),
                    defaults={'allocation_percentage': env_data.get('allocation_percentage')}
                )
                for rule_data in rules_data:
                    FundWaterfallRules.objects.update_or_create(
                        envelope=envelope,
                        share_class=rule_data.get('share_class'),
                        defaults={
                            'is_selected': rule_data.get('is_selected'),
                            'is_pro_rata': rule_data.get('is_pro_rata'),
                            'fixed_percentage': rule_data.get('fixed_percentage')
                        }
                    )
        return instance

class FundManFeeRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundManFeeRules
        fields = [
            "fee_rule_id",
            "fund",
            "phase",
            "share_class",
            "date_from",
            "date_until",
            "rate",
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = ["fee_rule_id", "created_at", "created_by", "updated_at"]

    def validate(self, data):
        """
        Optional: Client-side validation for the CheckConstraints 
        to return 400 Bad Request instead of a 500 Database Error.
        """
        phase = data.get('phase')
        share_class = data.get('share_class')
        date_from = data.get('date_from')
        date_until = data.get('date_until')

        # Phase logic validation
        if phase and phase.pk == 1 and not share_class:
            raise serializers.ValidationError("Share class is required for Phase 1.")
        if phase and phase.pk == 2 and share_class:
            raise serializers.ValidationError("Share class must be null for Phase 2.")

        # Date range validation
        if date_from and date_until and date_until <= date_from:
            raise serializers.ValidationError("date_until must be after date_from.")
            
        return data