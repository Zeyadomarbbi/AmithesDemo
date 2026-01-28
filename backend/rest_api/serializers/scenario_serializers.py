from rest_framework import serializers
from django.db import transaction

from ..models.transactions import *
from ..models.mappings import MapSynthesisScenario

class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioList
        fields = [
            "scenario_id",
            "fund",
            "scenario_name",
            "description",
            "is_deleted",
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = ["scenario_id", "created_at", "created_by", "updated_at", "fund"]

    def validate(self, attrs):
        fund_id = self.context.get("fund_id")
        name = attrs.get("scenario_name")
        
        # Uniqueness check: ignore scenarios marked as deleted
        qs = ScenarioList.objects.filter(
            fund_id=fund_id, 
            scenario_name=name, 
            is_deleted=False
        )
        
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                {"scenario_name": "Active scenario name must be unique per fund."}
            )
        return attrs
    
class ScenarioSynthesisSerializer(serializers.ModelSerializer):
    class MapSynthesisScenarioSerializer(serializers.ModelSerializer):
        class Meta:
            model = MapSynthesisScenario
            fields = ['scenario']

    # For GET: returns the actual scenario objects via the mapper
    scenarios = MapSynthesisScenarioSerializer(many=True, source='scenario_mappings', read_only=True)
    # For POST/PUT: accepts a list of IDs
    scenario_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )

    class Meta:
        model = ScenarioSynthesis
        fields = [
            'synthesis_id', 'fund', 'synthesis_name', 
            'description', 'is_deleted', 'created_at', 
            'created_by', 'updated_at', 'scenarios', 'scenario_ids'
        ]
        read_only_fields = ['synthesis_id', 'fund', 'created_at', 'updated_at']

    def create(self, validated_data):
        scenario_ids = validated_data.pop('scenario_ids', [])
        
        with transaction.atomic():
            synthesis = ScenarioSynthesis.objects.create(**validated_data)
            if scenario_ids:
                self._set_scenarios(synthesis, scenario_ids)
        return synthesis

    def update(self, instance, validated_data):
        scenario_ids = validated_data.pop('scenario_ids', None)
        
        with transaction.atomic():
            instance.synthesis_name = validated_data.get('synthesis_name', instance.synthesis_name)
            instance.description = validated_data.get('description', instance.description)
            instance.save()

            if scenario_ids is not None:
                # Clear old and set new atomically
                MapSynthesisScenario.objects.filter(synthesis=instance).delete()
                self._set_scenarios(instance, scenario_ids)
        return instance

    def _set_scenarios(self, synthesis, scenario_ids):
        mappings = [
            MapSynthesisScenario(synthesis=synthesis, scenario_id=sid) 
            for sid in scenario_ids
        ]
        MapSynthesisScenario.objects.bulk_create(mappings)