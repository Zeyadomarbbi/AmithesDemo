from rest_framework import serializers

from ..models.transactions import *
from ..models.mappings import MapScenarioSynthesis

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
    
class MapScenarioSynthesisSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapScenarioSynthesis
        fields = ['scenario']

class ScenarioSynthesisSerializer(serializers.ModelSerializer):
    # For GET: returns the actual scenario objects via the mapper
    scenarios = MapScenarioSynthesisSerializer(many=True, source='scenario_mappings', read_only=True)
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
        synthesis = ScenarioSynthesis.objects.create(**validated_data)
        
        if scenario_ids:
            self._set_scenarios(synthesis, scenario_ids)
        
        return synthesis

    def update(self, instance, validated_data):
        scenario_ids = validated_data.pop('scenario_ids', None)
        
        instance.synthesis_name = validated_data.get('synthesis_name', instance.synthesis_name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        if scenario_ids is not None:
            # Clear old and set new
            MapScenarioSynthesis.objects.filter(synthesis=instance).delete()
            self._set_scenarios(instance, scenario_ids)

        return instance

    def _set_scenarios(self, synthesis, scenario_ids):
        mappings = [
            MapScenarioSynthesis(synthesis=synthesis, scenario_id=sid) 
            for sid in scenario_ids
        ]
        MapScenarioSynthesis.objects.bulk_create(mappings)