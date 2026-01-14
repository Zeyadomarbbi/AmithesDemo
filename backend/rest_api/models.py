from django.db import models

class DimDate(models.Model):
    date_id = models.IntegerField(primary_key=True)
    full_date = models.DateField()
    quarter = models.IntegerField()
    year = models.IntegerField()
    quarter_end = models.DateField()

    class Meta:
        managed = False
        db_table = "dim_date"

class DimPhase(models.Model):
    phase_id = models.AutoField(primary_key=True)
    phase_name = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = "dim_phase"

class DimCurrency(models.Model):
    currency_id = models.AutoField(primary_key=True)
    currency_name = models.CharField(max_length=100)
    currency_symbol = models.CharField(max_length=10)
    currency_code = models.CharField(max_length=10)

    class Meta:
        managed = False
        db_table = "dim_currency"


class DimFund(models.Model):
    fund_id = models.AutoField(primary_key=True)
    legal_name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=100)
    
    # ⚠️ ADD null=True TO THESE 3 FIELDS
    formation_date = models.ForeignKey(
        'DimDate', 
        on_delete=models.DO_NOTHING, 
        db_column='formation_date_id',
        null=True,   # <--- Forces LEFT JOIN
        blank=True
    )
    phase = models.ForeignKey(
        'DimPhase', 
        on_delete=models.DO_NOTHING, 
        db_column='phase_id',
        null=True,   # <--- Forces LEFT JOIN
        blank=True
    )
    currency = models.ForeignKey(
        'DimCurrency', 
        on_delete=models.DO_NOTHING, 
        db_column='currency_id',
        null=True,   # <--- Forces LEFT JOIN
        blank=True
    )
    
    legal_form = models.CharField(max_length=100, blank=True, null=True)
    management_company = models.CharField(max_length=255, blank=True, null=True)
    fund_strategy = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "dim_fund"


class DimTimeframe(models.Model):
    timeframe_id = models.AutoField(primary_key=True)

    fund = models.ForeignKey(
        "DimFund",
        db_column="fund_id",
        on_delete=models.CASCADE
    )

    date = models.ForeignKey(
        "DimDate",
        db_column="date_id",
        on_delete=models.RESTRICT
    )

    display_label = models.CharField(max_length=20, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    class Meta:
        managed = False
        db_table = "dim_timeframe"
        unique_together = (("fund", "date"),)


class DimScenarioList(models.Model):
    scenario_id = models.BigAutoField(primary_key=True)
    fund = models.ForeignKey(
        "DimFund",
        db_column="fund_id",
        on_delete=models.CASCADE,
        related_name="scenarios"
    )

    scenario_name = models.TextField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, default="system")
    class Meta:
        db_table = "dim_scenario_list"
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "scenario_name"],
                name="uq_scenario_fund_name"
            )
        ]

    def __str__(self):
        return f"{self.fund_id} | {self.scenario_name}"

class DimScenarioSynthesis(models.Model):
    synthesis_id = models.AutoField(primary_key=True)
    fund = models.ForeignKey(
        'DimFund', 
        on_delete=models.CASCADE, 
        db_column='fund_id'
    )
    synthesis_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100)
    class Meta:
        db_table = 'dim_scenario_synthesis'
        # Constraint: synthesis names must be unique per fund
        constraints = [
            models.UniqueConstraint(
                fields=['fund', 'synthesis_name'], 
                name='unique_synthesis_per_fund'
            )
        ]

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