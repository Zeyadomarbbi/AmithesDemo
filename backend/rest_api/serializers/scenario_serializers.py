from rest_framework import serializers
from django.db import transaction

from ..models.reference import ScenarioList, ScenarioSynthesis
from ..models.mappings import MapSynthesisScenario


class ScenarioSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S%z", read_only=True)
    updated_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S%z", read_only=True, allow_null=True)

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

    def to_representation(self, instance):
        """
        Coerce date objects to datetime to prevent 'utcoffset' errors
        if the database returns a date object for a DateTimeField.
        """
        from datetime import date, datetime
        import django.utils.timezone as tz

        for field in ["created_at", "updated_at"]:
            val = getattr(instance, field, None)
            if isinstance(val, date) and not isinstance(val, datetime):
                setattr(
                    instance,
                    field,
                    datetime.combine(val, datetime.min.time()).replace(tzinfo=tz.get_current_timezone()),
                )

        return super().to_representation(instance)


class ScenarioSynthesisSerializer(serializers.ModelSerializer):
    class MapSynthesisScenarioSerializer(serializers.ModelSerializer):
        class Meta:
            model = MapSynthesisScenario
            fields = ["scenario"]

    # For GET: returns the actual scenario objects via the mapper
    scenarios = MapSynthesisScenarioSerializer(many=True, source="scenario_mappings", read_only=True)

    # For POST/PUT: accepts a list of IDs
    scenario_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = ScenarioSynthesis
        fields = [
            "synthesis_id",
            "fund",
            "synthesis_name",
            "description",
            "is_deleted",
            "created_at",
            "created_by",
            "updated_at",
            "scenarios",
            "scenario_ids",
        ]
        read_only_fields = ["synthesis_id", "fund", "created_at", "updated_at"]

    def create(self, validated_data):
        scenario_ids = validated_data.pop("scenario_ids", [])

        with transaction.atomic():
            synthesis = ScenarioSynthesis.objects.create(**validated_data)
            if scenario_ids:
                self._set_scenarios(synthesis, scenario_ids)

        return synthesis

    def update(self, instance, validated_data):
        scenario_ids = validated_data.pop("scenario_ids", None)

        with transaction.atomic():
            instance.synthesis_name = validated_data.get("synthesis_name", instance.synthesis_name)
            instance.description = validated_data.get("description", instance.description)
            instance.save()

            if scenario_ids is not None:
                MapSynthesisScenario.objects.filter(synthesis=instance).delete()
                self._set_scenarios(instance, scenario_ids)

        return instance

    def _set_scenarios(self, synthesis, scenario_ids):
        mappings = [
            MapSynthesisScenario(synthesis=synthesis, scenario_id=sid)
            for sid in scenario_ids
        ]
        MapSynthesisScenario.objects.bulk_create(mappings)
    