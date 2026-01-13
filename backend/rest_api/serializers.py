from rest_framework import serializers
from .models import DimTimeframe, DimScenarioList, DimScenarioSynthesis, MapScenarioSynthesis

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