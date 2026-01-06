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


class DimFund(models.Model):
    fund_id = models.AutoField(primary_key=True)

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
    created_at = models.DateTimeField()
    created_by = models.CharField(max_length=100, null=True, blank=True)
    class Meta:
        managed = False
        db_table = "dim_timeframe"
        unique_together = (("fund", "date"),)


class DimScenario(models.Model):
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