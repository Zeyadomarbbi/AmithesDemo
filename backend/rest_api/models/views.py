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

class ViewMasterScenarioGains(models.Model):
    summary_id = models.BigIntegerField(primary_key=True)
    
    investment = models.ForeignKey('PortfolioInvestment', on_delete=models.DO_NOTHING, db_column='investment_id')
    scenario = models.ForeignKey('ScenarioList', on_delete=models.DO_NOTHING, db_column='scenario_id')
    
    investment_name = models.CharField(max_length=255)
    year = models.IntegerField()
    status = models.CharField(max_length=20)
    valuation_date = models.DateField()
    
    closing_fair_value = models.DecimalField(max_digits=20, decimal_places=2)
    opening_fair_value = models.DecimalField(max_digits=20, decimal_places=2)
    
    unrealized_gain = models.DecimalField(max_digits=20, decimal_places=2)
    realized_gain = models.DecimalField(max_digits=20, decimal_places=2)
    total_gain_yoy = models.DecimalField(max_digits=20, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'view_master_scenario_gains'
        ordering = ['investment_name', 'year']

class ScenarioFundflowsDistributionSummary(models.Model):
    summary_id = models.BigAutoField(primary_key=True)
    
    fund = models.ForeignKey('Fund', on_delete=models.DO_NOTHING, db_column='fund_id')
    scenario = models.ForeignKey('ScenarioList', on_delete=models.CASCADE, db_column='scenario_id')
    
    date = models.DateField()
    flows = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    divestment = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    dividends = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    interests = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    other = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    pct_distributed = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    
    source_type = models.CharField(max_length=50)
    source_id = models.BigIntegerField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'scenario_fundflows_distribution_summary'
        ordering = ['date']
        unique_together = [['fund', 'scenario', 'date', 'source_type', 'source_id']]

    def __str__(self):
        return f"Distribution {self.date} - {self.flows}"