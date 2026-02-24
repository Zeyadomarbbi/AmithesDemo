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
        ordering = ["currency_name"]

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
        ordering = ["country_name"]

class FundPhase(models.Model):
    phase_id = models.AutoField(primary_key=True)
    phase_name = models.CharField(max_length=100)
    
    class Meta:
        managed = False
        db_table = "fund_phase"
        ordering = ["phase_id"]

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
        ordering = ["phase_id"]

class FinancialCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    sign_multiplier = models.IntegerField()

    class Meta:
        managed = False
        db_table = "financial_category"
        ordering = ["category_id"]

    def __str__(self):
        return self.name


class FinancialLineItem(models.Model):
    """
    financial_line_item
    UNIQUE(fund_id, category_id, name)
    """
    line_item_id = models.AutoField(primary_key=True)

    fund_id = models.IntegerField(db_column="fund_id")

    category = models.ForeignKey(
        'FinancialCategory', # Assuming FinancialCategory is defined or imported
        db_column="category_id",
        on_delete=models.PROTECT,
        related_name="line_items",
    )

    name = models.CharField(max_length=100)
    
    # --- NEW ADDITION START ---
    class SpecialField(models.TextChoices):
        # Existing (automated in financials)
        REALIZED_GAIN = 'REALIZED_GAIN', 'Realized Gain'
        UNREALIZED_GAIN = 'UNREALIZED_GAIN', 'Unrealized Gain'
        MANAGEMENT_FEES = 'MANAGEMENT_FEES', 'Management Fees'
        DD_FEES = 'DD_FEES', 'Due Diligence Fees'
        
        # New (for capital call mapping)
        STRUCTURING_FEES = 'STRUCTURING_FEES', 'Structuring Fees'
        OPEX = 'OPEX', 'Opex/Administration Fees'
        OTHER_EXPENSES = 'OTHER_EXPENSES', 'Other Expenses'

    special_field = models.CharField(
        max_length=50,
        choices=SpecialField.choices,
        null=True,
        blank=True,
        db_column="special_field"
    )

    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(null=True, blank=True)

    created_by = models.IntegerField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = "financial_line_item"
        ordering = ["line_item_id"]

    def __str__(self):
        return f"{self.fund_id} | {self.category_id} | {self.name}"
    
class ClosingPeriod(models.Model):
    closing_id = models.AutoField(primary_key=True)
    closing_name = models.CharField(max_length=255)
    closing_code = models.CharField(max_length=10)
    closing_sequence = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'closing_period'
        ordering = ["closing_name"]
        managed = False

class PortfolioTransactionType(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    transaction_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        ordering = ["transaction_id"]
        db_table = "portfolio_transaction_type"

class LPsOperationType(models.Model):
    operation_type_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, db_column="name")
    sign_multiplier = models.IntegerField(db_column="sign_multiplier", null=True, blank=True)
    created_at = models.DateTimeField(db_column="created_at", null=True, blank=True)

    class Meta:
        managed = False
        db_table = "lps_operation_type"

class LPsOperationFlowType(models.Model):
    flow_type_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, db_column="name")
    created_at = models.DateTimeField(db_column="created_at", null=True, blank=True)

    class Meta:
        managed = False
        db_table = "lps_operation_flow_type"