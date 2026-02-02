from rest_framework import serializers
from django.db import transaction

from ..models.transactions import *

class FundWaterfallEnvelopeSerializer(serializers.ModelSerializer):
    class FundWaterfallEnvelopeRuleSerializer(serializers.ModelSerializer):
        isSelected = serializers.BooleanField(source='is_selected')
        isProRata = serializers.BooleanField(source='is_pro_rata')
        fixedPercentage = serializers.DecimalField(source='fixed_percentage', max_digits=5, decimal_places=2, allow_null=True, required=False)
        share_class_name = serializers.CharField(source='share_class.share_class_name', read_only=True)

        class Meta:
            model = FundWaterfallEnvelopeRules
            fields = [
                'envelope_rule_id', 'share_class', 'share_class_name',
                'isSelected', 'isProRata', 'fixedPercentage'
            ]

    rules = FundWaterfallEnvelopeRuleSerializer(many=True)

    class Meta:
        model = FundWaterfallEnvelopes
        fields = [
            'waterfall_envelope_id', 'fund_waterfall_steps', 
            'envelope_number', 'allocation_percentage', 'rules'
        ]
        read_only_fields = ['fund_waterfall_steps']

class FundWaterfallStepSerializer(serializers.ModelSerializer):
    class FundWaterfallStepRuleSerializer(serializers.ModelSerializer):
        isSelected = serializers.BooleanField(source='is_selected')
        isProRata = serializers.BooleanField(source='is_pro_rata')
        # FIXED: Added allow_null=True to prevent "This field may not be null" errors
        fixedPercentage = serializers.DecimalField(
            source='fixed_percentage', 
            max_digits=18, 
            decimal_places=4, 
            allow_null=True, 
            required=False
        )
        share_class_name = serializers.CharField(source='share_class.share_class_name', read_only=True)

        class Meta:
            model = FundWaterfallStepRules
            fields = [
                'step_rule_id', 'share_class', 'share_class_name', 
                'isSelected', 'isProRata', 'fixedPercentage'
            ]

    # NOTE: Field is named 'step_rules', so Frontend must send 'step_rules'
    step_rules = FundWaterfallStepRuleSerializer(many=True, required=False, allow_null=True)
    envelopes = FundWaterfallEnvelopeSerializer(many=True, required=False, allow_null=True)
    step_number = serializers.IntegerField(source='step_definition.step_number', read_only=True)
    step_description = serializers.CharField(source='step_definition.description', read_only=True)

    class Meta:
        model = FundWaterfallSteps
        fields = [
            'fund_waterfall_step_id', 'fund', 'step_definition',
            'step_number', 'step_description', 'step_name', 
            'step_rate', 'step_rules', 'envelopes'
        ]

    @transaction.atomic
    def create(self, validated_data):
        envelopes_data = validated_data.pop('envelopes', [])
        
        # KEY CHANGE: Access 'step_rules' because that is the field name defined above
        rules_data = validated_data.pop('step_rules', []) 

        step = FundWaterfallSteps.objects.create(**validated_data)

        # Create Step Rules
        for r_data in rules_data:
            sc_instance = r_data.pop('share_class')
            FundWaterfallStepRules.objects.create(
                fund_waterfall_step=step,
                share_class=sc_instance,
                **r_data
            )

        # Create Envelopes
        for e_data in envelopes_data:
            env_rules_data = e_data.pop('rules', [])
            envelope = FundWaterfallEnvelopes.objects.create(fund_waterfall_steps=step, **e_data)
            
            for r_data in env_rules_data:
                sc_instance = r_data.pop('share_class')
                FundWaterfallEnvelopeRules.objects.create(
                    envelope=envelope,
                    share_class=sc_instance,
                    **r_data
                )

        return step

    @transaction.atomic
    def update(self, instance, validated_data):
        envelopes_data = validated_data.pop('envelopes', None)
        
        # KEY CHANGE: Access 'step_rules'
        rules_data = validated_data.pop('step_rules', None) 

        instance.step_name = validated_data.get('step_name', instance.step_name)
        instance.step_rate = validated_data.get('step_rate', instance.step_rate)
        instance.save()

        # Update Step Rules
        if rules_data is not None:
            incoming_ids = [r['share_class'].pk for r in rules_data]
            instance.step_rules.exclude(share_class_id__in=incoming_ids).delete()
            
            for r_data in rules_data:
                sc_instance = r_data.pop('share_class')
                FundWaterfallStepRules.objects.update_or_create(
                    fund_waterfall_step=instance,
                    share_class=sc_instance,
                    defaults=r_data
                )

        # Update Envelopes
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

                incoming_env_sc_ids = [r['share_class'].pk for r in env_rules_data]
                envelope.rules.exclude(share_class_id__in=incoming_env_sc_ids).delete()
                for r_data in env_rules_data:
                    sc_instance = r_data.pop('share_class')
                    FundWaterfallEnvelopeRules.objects.update_or_create(
                        envelope=envelope,
                        share_class=sc_instance,
                        defaults=r_data
                    )

        return instance

class FundManFeeRuleSerializer(serializers.ModelSerializer):
    phase_name = serializers.CharField(source='phase.phase_name', read_only=True)
    share_class_name = serializers.CharField(source='share_class.share_class_name', read_only=True)

    class Meta:
        model = FundManFeeRules
        fields = [
            "fee_rule_id", "fund", "phase", "phase_name", 
            "share_class", "share_class_name", "date_from", 
            "date_until", "rate", "created_at", "created_by", "updated_at",
        ]
        read_only_fields = ["fee_rule_id", "fund", "created_at", "created_by", "updated_at"]

    def validate(self, data):
        # Support both Create and Partial Update (PATCH)
        phase = data.get('phase', getattr(self.instance, 'phase', None))
        share_class = data.get('share_class', getattr(self.instance, 'share_class', None))
        date_from = data.get('date_from', getattr(self.instance, 'date_from', None))
        date_until = data.get('date_until', getattr(self.instance, 'date_until', None))

        # Phase logic validation
        if phase:
            if phase.pk == 1 and not share_class:
                raise serializers.ValidationError({"share_class": "Share class is required for Phase 1."})
            if phase.pk == 2 and share_class:
                raise serializers.ValidationError({"share_class": "Share class must be null for Phase 2."})

        # Date range validation
        if date_from and date_until and date_until <= date_from:
            raise serializers.ValidationError({"date_until": "Date until must be after date from."})
            
        return data