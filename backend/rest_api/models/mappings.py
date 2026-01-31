from django.db import models

class MapSynthesisScenario(models.Model):
    record_id = models.BigAutoField(primary_key=True)
    
    synthesis = models.ForeignKey(
        'ScenarioSynthesis', 
        on_delete=models.CASCADE, 
        db_column='synthesis_id',
        related_name='scenario_mappings'
    )
    
    scenario = models.ForeignKey(
        'ScenarioList', 
        on_delete=models.CASCADE, 
        db_column='scenario_id'
    )

    class Meta:
        db_table = 'map_synthesis_scenario'
        # Prevent duplicate scenarios within the same synthesis
        unique_together = ('synthesis', 'scenario')