from rest_framework import serializers
from django.db import transaction

from ..models.transactions import ScenarioList, ScenarioDueDiligenceFee, ScenarioSynthesis, ScenarioPortfolioProjection
from ..models.mappings import MapSynthesisScenario

class ScenarioSerializer(serializers.ModelSerializer):
    # Explicitly define as DateTimeField to ensure DRF handles the conversion
    # Or change to DateField if your DB column only stores dates
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

        for field in ['created_at', 'updated_at']:
            val = getattr(instance, field)
            if isinstance(val, date) and not isinstance(val, datetime):
                # Convert date to datetime at midnight
                setattr(instance, field, datetime.combine(val, datetime.min.time()).replace(tzinfo=tz.get_current_timezone()))
        
        return super().to_representation(instance)
    
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

class ScenarioPortfolioProjectionSerializer(serializers.ModelSerializer):
    investment_name = serializers.CharField(source='investment.name', read_only=True)
    
    class Meta:
        model = ScenarioPortfolioProjection
        fields = [
            'projection_id', 'fund', 'scenario', 'investment', 'investment_name',
            'first_investment_date', 'cost', 'dividends_interests',
            'input_duration', 'input_moic', 
            'exit_date', 'exit_value',
            'updated_at'
        ]
        read_only_fields = [
            'projection_id', 'first_investment_date', 'cost', 
            'dividends_interests', 'exit_date', 'exit_value', 'updated_at'
        ]

    def update(self, instance, validated_data):
        # When user updates input_duration or input_moic, 
        # the DB trigger 'trg_rebuild_scenario_projection_flows' doesn't fire 
        # (because it's on transaction_flows). 
        # However, the SQL 'fn_rebuild_scenario_projection' uses values from THIS table.
        
        instance = super().update(instance, validated_data)
        
        # Explicitly call the rebuild function so the exit_date/value recalculate immediately
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT fn_rebuild_scenario_projection(%s, %s, %s)",
                [instance.fund_id, instance.investment_id, instance.scenario_id]
            )
        
        # Refresh from DB to get the new exit_date and exit_value calculated by SQL
        instance.refresh_from_db()
        return instance
    
class ScenarioDueDiligenceFeeSerializer(serializers.ModelSerializer):
    investment_name = serializers.ReadOnlyField(source='investment_id.name')
    cost = serializers.SerializerMethodField()
    class Meta:
        model = ScenarioDueDiligenceFee
        fields = [
            'dd_fee_id', 'fund_id', 'scenario_id', 'investment_id', 'investment_name', 'cost',
            'entry_fee_pct', 'exit_fee_pct', 'is_entry_sunk', 'is_exit_sunk',
            'entry_date', 'entry_amount', 'exit_date', 'exit_amount', 'updated_at'
        ]
        read_only_fields = ['is_entry_sunk', 'is_exit_sunk', 'entry_date', 'entry_amount', 'exit_date', 'exit_amount']

    def get_cost(self, obj):
        # Efficiently fetch the cost from the projection table
        # This assumes you have a model named ScenarioPortfolioProjection
        proj = ScenarioPortfolioProjection.objects.filter(
            investment_id=obj.investment_id, 
            scenario_id=obj.scenario_id
        ).first()
        return proj.cost if proj else 0