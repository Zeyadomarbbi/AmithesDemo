from django.db import models

class Currency(models.Model):
    currency_id = models.AutoField(primary_key=True)
    currency_name = models.CharField(max_length=100)
    currency_symbol = models.CharField(max_length=10, null=True, blank=True)
    currency_code = models.CharField(max_length=3, unique=True)  # ISO 4217
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "currency"

class Country(models.Model):
    country_id = models.AutoField(primary_key=True)
    iso2_code = models.CharField(max_length=2, unique=True)
    iso3_code = models.CharField(max_length=3, unique=True)
    country_name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    currency = models.ForeignKey(
        Currency,
        to_field="currency_code",
        db_column="currency_code",
        on_delete=models.PROTECT,
        related_name="country"
    )

    class Meta:
        managed = False
        db_table = "country"

class FundPhase(models.Model):
    phase_id = models.AutoField(primary_key=True)
    phase_name = models.CharField(max_length=100)
    
    class Meta:
        managed = False
        db_table = "fund_phase"

class WaterfallStep(models.Model):
    """
    Static reference table.
    IDs: 1=Nominal, 2=Hurdle, 3=Catch-up, 4=Special Return
    """
    waterfall_step_id = models.AutoField(primary_key=True)
    step_number = models.IntegerField(unique=True)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "waterfall_step"
        ordering = ["step_number"]

    def __str__(self):
        return f"{self.step_number} - {self.description}"

class ManFeePhase(models.Model):
    phase_id = models.SmallIntegerField(primary_key=True)
    phase_name = models.CharField(max_length=50)
    basis_description = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "man_fee_phase"
        managed = False