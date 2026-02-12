from django.db import models

class ViewMasterManFees(models.Model):
    # We use entity_id as the primary key for Django ORM compatibility.
    # In a Read-Only scenario, this is safe even if IDs overlap across types.
    entity_id = models.BigIntegerField(primary_key=True)
    
    fund = models.ForeignKey('Fund', on_delete=models.DO_NOTHING, db_column='fund_id')
    scenario = models.ForeignKey('ScenarioList', on_delete=models.DO_NOTHING, db_column='scenario_id')
    
    order_priority = models.IntegerField()
    entity_type = models.CharField(max_length=50)   # 'Share Class', 'Tranche', 'Portfolio'
    entity_name = models.CharField(max_length=255)
    year = models.IntegerField()
    fee_amount = models.DecimalField(max_digits=20, decimal_places=2)

    class Meta:
        managed = False  # Tells Django: "Don't try to create/migrate this table"
        db_table = 'view_master_man_fees'
        ordering = ['order_priority', 'year', 'entity_name']