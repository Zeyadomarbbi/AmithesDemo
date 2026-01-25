from django.db import models

class MapScenarioSynthesis(models.Model):
    record_id = models.AutoField(primary_key=True)
    synthesis = models.ForeignKey(
        'DimScenarioSynthesis', 
        on_delete=models.CASCADE, 
        db_column='synthesis_id',
        related_name='scenario_mappings'
    )
    # Assuming DimScenarioList is your existing scenario table
    scenario = models.ForeignKey(
        'DimScenarioList', 
        on_delete=models.CASCADE, 
        db_column='scenario_id'
    )

    class Meta:
        db_table = 'map_scenario_synthesis'