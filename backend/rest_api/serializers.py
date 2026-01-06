from rest_framework import serializers
from .models import DimTimeframe, DimScenario

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
        model = DimScenario
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
        if DimScenario.objects.filter(fund_id=fund_id, scenario_name=name).exists():
            raise serializers.ValidationError(
                {"scenario_name": "Scenario name must be unique per fund."}
            )
        return attrs