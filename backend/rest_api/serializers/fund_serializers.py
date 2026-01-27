from rest_framework import serializers
from django.db import transaction

from ..models.transactions import *

class FundWaterfallEnvelopeSerializer(serializers.ModelSerializer):
    class FundWaterfallEnvelopeRuleSerializer(serializers.ModelSerializer):
        class Meta:
            model = FundWaterfallEnvelopeRules
            fields = [
                'envelope_rule_id', 'envelope', 'share_class', 
                'is_selected', 'is_pro_rata', 'fixed_percentage'
            ]
            read_only_fields = ['envelope']
            
    rules = FundWaterfallEnvelopeRuleSerializer(many=True)

    class Meta:
        model = FundWaterfallEnvelopes
        fields = [
            'waterfall_envelope_id',
            'fund_waterfall_steps',
            'envelope_number',
            'allocation_percentage',
            'rules',
        ]
        read_only_fields = ['fund_waterfall_steps']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        rules_qs = instance.rules.select_related('share_class').all()
        
        data['rules'] = {
            str(r.share_class_id): {
                'envelope_rule_id': r.envelope_rule_id,
                'share_class_name': r.share_class.share_class_name,
                'isSelected': r.is_selected,
                'isProRata': r.is_pro_rata,
                'fixedPercentage': r.fixed_percentage,
            }
            for r in rules_qs
        }
        return data

class FundWaterfallStepSerializer(serializers.ModelSerializer):
    class FundWaterfallStepRuleSerializer(serializers.ModelSerializer):
        class Meta:
            model = FundWaterfallStepRules
            fields = [
                'step_rule_id',
                'share_class',
                'is_selected',
                'is_pro_rata',
                'fixed_percentage',
            ]

    envelopes = FundWaterfallEnvelopeSerializer(many=True)
    rules = FundWaterfallStepRuleSerializer(many=True, source='step_rules')

    step_number = serializers.IntegerField(
        source='step_definition.step_number',
        read_only=True
    )
    step_description = serializers.CharField(
        source='step_definition.description',
        read_only=True
    )

    class Meta:
        model = FundWaterfallSteps
        fields = [
            'fund_waterfall_step_id',
            'fund',
            'step_definition',
            'step_number',
            'step_description',
            'step_name',
            'step_rate',
            'rules',
            'envelopes',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Access the related manager 'step_rules'
        global_rules_qs = instance.step_rules.select_related('share_class').all()
        
        data['rules'] = {
            str(r.share_class_id): {
                'step_rule_id': r.step_rule_id,
                'share_class_name': r.share_class.share_class_name, # Added Name
                'isSelected': r.is_selected,
                'isProRata': r.is_pro_rata,
                'fixedPercentage': r.fixed_percentage,
            }
            for r in global_rules_qs
        }
        
        return data

    @transaction.atomic
    def create(self, validated_data):
        envelopes_data = validated_data.pop('envelopes', [])
        step_rules_data = validated_data.pop('step_rules', [])

        # 1. Create Step
        step = FundWaterfallSteps.objects.create(**validated_data)

        # 2. Create Global Step Rules
        for r_data in step_rules_data:
            FundWaterfallStepRules.objects.create(fund_waterfall_step=step, **r_data)

        # 3. Create Envelopes and Local Rules
        for e_data in envelopes_data:
            rules_data = e_data.pop('rules', [])
            envelope = FundWaterfallEnvelopes.objects.create(fund_waterfall_steps=step, **e_data)
            
            for r_data in rules_data:
                FundWaterfallEnvelopeRules.objects.create(envelope=envelope, **r_data)

        return step

    @transaction.atomic
    def update(self, instance, validated_data):
        envelopes_data = validated_data.pop('envelopes', None)
        rules_data = validated_data.pop('step_rules', None)

        # Update Step fields
        instance.step_name = validated_data.get('step_name', instance.step_name)
        instance.step_rate = validated_data.get('step_rate', instance.step_rate)
        instance.save()

        # Sync Global Rules (Delete removed, Update/Create existing)
        if rules_data is not None:
            incoming_ids = [r['share_class'].share_class_id for r in rules_data]
            instance.step_rules.exclude(share_class_id__in=incoming_ids).delete()
            for r_data in rules_data:
                FundWaterfallStepRules.objects.update_or_create(
                    fund_waterfall_step=instance,
                    share_class=r_data['share_class'],
                    defaults={k: v for k, v in r_data.items() if k != 'share_class'}
                )

        # Sync Envelopes
        if envelopes_data is not None:
            incoming_nums = [e['envelope_number'] for e in envelopes_data]
            instance.envelopes.exclude(envelope_number__in=incoming_nums).delete()
            
            for e_data in envelopes_data:
                env_rules_data = e_data.pop('rules', [])
                envelope, _ = FundWaterfallEnvelopes.objects.update_or_create(
                    fund_waterfall_steps=instance,
                    envelope_number=e_data['envelope_number'],
                    defaults={'allocation_percentage': e_data.get('allocation_percentage')}
                )

                # Sync Local Envelope Rules
                incoming_env_sc_ids = [r['share_class'].share_class_id for r in env_rules_data]
                envelope.rules.exclude(share_class_id__in=incoming_env_sc_ids).delete()
                for r_data in env_rules_data:
                    FundWaterfallEnvelopeRules.objects.update_or_create(
                        envelope=envelope,
                        share_class=r_data['share_class'],
                        defaults={k: v for k, v in r_data.items() if k != 'share_class'}
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