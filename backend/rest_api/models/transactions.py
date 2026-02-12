from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Q, F
from time import timezone

class FundWaterfallSteps(models.Model):
    fund_waterfall_step_id = models.BigAutoField(primary_key=True)

    fund = models.ForeignKey(
        "Fund",
        on_delete=models.CASCADE,
        db_column="fund_id",
        related_name="waterfall_steps",
    )

    step_definition = models.ForeignKey(
        "WaterfallStep",
        on_delete=models.PROTECT,
        db_column="waterfall_step_id",
        related_name="fund_instances",
    )

    step_name = models.CharField(max_length=255)
    step_rate = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "fund_waterfall_steps"
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "step_definition"],
                name="uq_fund_waterfall_step_fund_stepdef",
            )
        ]

class FundWaterfallStepRules(models.Model):
    step_rule_id = models.BigAutoField(primary_key=True)
    fund_waterfall_step = models.ForeignKey(
        "FundWaterfallSteps",
        on_delete=models.CASCADE,
        related_name="step_rules",
        db_column="fund_waterfall_step_id"
    )

    share_class = models.ForeignKey(
        "ShareClass",
        on_delete=models.CASCADE,
        db_column="share_class_id"
    )

    is_selected = models.BooleanField(default=False)
    is_pro_rata = models.BooleanField(default=False)

    fixed_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "fund_waterfall_step_rules"
        unique_together = ("fund_waterfall_step", "share_class")

class FundWaterfallEnvelopes(models.Model):
    waterfall_envelope_id = models.BigAutoField(primary_key=True)

    fund_waterfall_steps = models.ForeignKey(
        "FundWaterfallSteps",
        on_delete=models.CASCADE,
        db_column="fund_waterfall_step_id",
        related_name="envelopes",
    )

    envelope_number = models.PositiveIntegerField()

    allocation_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "fund_waterfall_envelopes"
        constraints = [
            models.UniqueConstraint(
                fields=["fund_waterfall_steps", "envelope_number"],
                name="uq_waterfall_envelope_step_number",
            )
        ]

class FundWaterfallEnvelopeRules(models.Model):
    envelope_rule_id = models.BigAutoField(primary_key=True)

    envelope = models.ForeignKey(
        "FundWaterfallEnvelopes",
        on_delete=models.CASCADE,
        related_name="rules",
        db_column="waterfall_envelope_id"
    )

    share_class = models.ForeignKey(
        "ShareClass",
        on_delete=models.CASCADE,
        db_column="share_class_id"
    )

    is_selected = models.BooleanField(default=False)
    is_pro_rata = models.BooleanField(default=False)

    fixed_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "fund_waterfall_envelope_rules"
        unique_together = ("envelope", "share_class")
        constraints = [
            models.CheckConstraint(
                check=models.Q(
                    fixed_percentage__gte=0,
                    fixed_percentage__lte=100
                ) | models.Q(fixed_percentage__isnull=True),
                name="chk_fixed_percentage_range"
            )
        ]

class FundManFeeRules(models.Model):
    fee_rule_id = models.BigAutoField(primary_key=True)

    fund = models.ForeignKey(
        "Fund",
        on_delete=models.CASCADE,
        db_column="fund_id",
        related_name="man_fees",
    )

    phase = models.ForeignKey(
        "ManFeePhase",
        on_delete=models.PROTECT,
        db_column="phase_id",
        related_name="man_fees",
    )

    share_class = models.ForeignKey(
        "ShareClass",
        on_delete=models.PROTECT,
        db_column="share_class_id",
        null=True,
        blank=True,
        related_name="man_fees",
    )

    date_from = models.DateField()
    date_until = models.DateField(null=True, blank=True)

    rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "fund_man_fee_rules"
        constraints = [
            # Phase 1 → share_class required | Phase 2 → share_class must be NULL
            models.CheckConstraint(
                name="chk_phase_share_class",
                check=(
                    Q(phase_id=1, share_class__isnull=False)
                    | Q(phase_id=2, share_class__isnull=True)
                ),
            ),
            # date_from < date_until (if date_until exists)
            models.CheckConstraint(
                name="chk_date_range",
                check=Q(date_until__isnull=True)
                | Q(date_until__gt=F("date_from")),
            ),
        ]

class ScenarioList(models.Model):
    class ScenarioManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(is_deleted=False)
        
    scenario_id = models.BigAutoField(primary_key=True)
    
    fund = models.ForeignKey(
        "Fund", 
        on_delete=models.CASCADE, 
        db_column="fund_id",
        related_name="scenarios"
    )
    
    scenario_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    
    # Soft Delete flag
    is_deleted = models.BooleanField(default=False)
    
    # Metadata fields
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)
    
    # Maps to your "updated_by date" requirement
    updated_at = models.DateTimeField(null=True, blank=True)
    objects = ScenarioManager() # Default manager filters out deleted items
    all_objects = models.Manager()

    class Meta:
        db_table = "scenario_list"
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "scenario_name"],
                condition=models.Q(is_deleted=False),
                name="uq_active_scenario_fund_name"
            )
        ]
    
class ScenarioSynthesis(models.Model):
    synthesis_id = models.BigAutoField(primary_key=True)
    fund = models.ForeignKey(
        "Fund", 
        on_delete=models.CASCADE, 
        db_column="fund_id",
        related_name="syntheses"
    )
    synthesis_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    
    is_deleted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "scenario_synthesis"
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "synthesis_name"],
                condition=models.Q(is_deleted=False),
                name="uq_active_synthesis_per_fund"
            )
        ]

class FinancialEntry(models.Model):
    entry_id = models.AutoField(primary_key=True)

    timeframe_id = models.IntegerField(db_column="timeframe_id")

    line_item = models.ForeignKey(
        "FinancialLineItem",
        db_column="line_item_id",
        on_delete=models.PROTECT,
        related_name="entries",
    )

    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)

    # ✅ IMPORTANT: prevent null insert + timezone-aware (USE_TZ=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)

    updated_at = models.DateTimeField(null=True, blank=True)
    updated_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "financial_entries"
        unique_together = ("timeframe_id", "line_item")

class FundClosing(models.Model):
    lps_fund_closing_period_id = models.AutoField(primary_key=True)
    fund = models.ForeignKey(
        "Fund", 
        on_delete=models.CASCADE, 
        db_column="fund_id",
    )
    closing_period = models.ForeignKey(
        'ClosingPeriod', 
        on_delete=models.CASCADE,
        db_column="closing_id"  # Explicitly map to the DB column name
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'lps_fund_closings'
        unique_together = ('fund', 'closing_period')

class LPsFundCommitment(models.Model):
    commitment_id = models.AutoField(primary_key=True)

    lp = models.ForeignKey(
        'LimitedPartner',
        on_delete=models.RESTRICT,
        db_column='lp_id',
        related_name='fund_commitments'
    )

    fund = models.ForeignKey(
        "Fund", 
        on_delete=models.CASCADE, 
        db_column="fund_id",
    )

    share_class = models.ForeignKey(
        "ShareClass",
        on_delete=models.PROTECT,
        db_column="share_class_id",

    )
    currency = models.ForeignKey(
        'Currency',
        on_delete=models.RESTRICT,
        db_column='currency_id'
    )

    closing_period = models.ForeignKey(
        'FundClosing',
        on_delete=models.RESTRICT,
        db_column='lps_fund_closing_period_id',
        related_name='commitments'
    )

    commitment_amount = models.DecimalField(
        max_digits=20,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    created_by = models.IntegerField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = 'lps_fund_commitments'
        constraints = [
            models.UniqueConstraint(
                fields=['lp', 'closing_period'],
                name='uq_lp_closing_commitment'
            )
        ]

class PortfolioInvestment(models.Model):
    investment_id = models.AutoField(primary_key=True)

    fund = models.ForeignKey(
        "Fund",
        on_delete=models.CASCADE,
        db_column="fund_id",
        related_name="portfolio_investments",
    )

    country = models.ForeignKey(
        "Country",
        on_delete=models.PROTECT,
        db_column="country_id",
        related_name="portfolio_investments",
    )

    currency = models.ForeignKey(
        "Currency",
        on_delete=models.PROTECT,
        db_column="currency_id",
        related_name="portfolio_investments",
    )

    # Added Scenario Field
    scenario = models.ForeignKey(
        'ScenarioList', 
        on_delete=models.SET_NULL, 
        db_column='scenario_id', 
        null=True, 
        blank=True,
        related_name="portfolio_investments"
    )

    name = models.CharField(max_length=255)
    sector = models.CharField(max_length=255)
    ownership = models.DecimalField(max_digits=18, decimal_places=6)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        managed = False  # Set to True if you want Django to manage the new scenario column
        db_table = "portfolio_investment"
        constraints = [
            models.UniqueConstraint(
                fields=['fund', 'name'], 
                name='unique_investment_name_per_fund'
            )
        ]

class PortfolioTransactionFlow(models.Model):
    flow_id = models.AutoField(primary_key=True)

    portfolio_investment = models.ForeignKey(
        "PortfolioInvestment",
        on_delete=models.CASCADE,
        db_column="investment_id",
        related_name="transaction_flows",
    )

    transaction_type = models.ForeignKey(
        "PortfolioTransactionType",
        on_delete=models.PROTECT,
        db_column="transaction_id",
        related_name="flows",
    )

    # Added Scenario Field
    scenario = models.ForeignKey(
        'ScenarioList', 
        on_delete=models.SET_NULL, 
        db_column='scenario_id', 
        null=True, 
        blank=True,
        related_name="transaction_flows"
    )

    date = models.DateField()
    flow_name = models.CharField(max_length=100)
    amount_lc = models.DecimalField(max_digits=18, decimal_places=6)
    fx_rate = models.DecimalField(max_digits=18, decimal_places=6)
    amount = models.DecimalField(max_digits=18, decimal_places=6)
    divestment_percentage = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        managed = False  # Set to True to allow Django to manage the new scenario column
        db_table = "portfolio_transaction_flows"

class PortfolioFairValueFlow(models.Model):
    fair_value_id = models.AutoField(primary_key=True)

    portfolio_investment = models.ForeignKey(
        "PortfolioInvestment",
        on_delete=models.CASCADE,
        db_column="investment_id",
        related_name="fair_value_flows",
    )

    date = models.DateField()
    amount_lc = models.DecimalField(max_digits=18, decimal_places=6)
    fx_rate = models.DecimalField(max_digits=18, decimal_places=6)
    amount = models.DecimalField(max_digits=18, decimal_places=6)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "portfolio_fair_values_flows"

class ScenarioPortfolioProjection(models.Model):
    projection_id = models.AutoField(primary_key=True)
    
    fund = models.ForeignKey('Fund', on_delete=models.CASCADE, db_column='fund_id')
    scenario = models.ForeignKey('ScenarioList', on_delete=models.CASCADE, db_column='scenario_id')
    investment = models.ForeignKey('PortfolioInvestment', on_delete=models.CASCADE, db_column='investment_id')

    # Calculated Fields (Read-Only in UI)
    first_investment_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    dividends_interests = models.DecimalField(max_digits=18, decimal_places=6, default=0, db_column='dividends_interests')
    
    # Input Fields (Writable in UI)
    input_duration = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    input_moic = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    # Calculated Result Fields (Read-Only in UI)
    exit_date = models.DateField(null=True, blank=True)
    exit_value = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scenario_portfolio_projections'
        managed = True 
        unique_together = (('investment', 'scenario'),)

    def __str__(self):
        return f"Proj: {self.investment.name} - Scenario: {self.scenario_id}"
    
class ScenarioDueDiligenceFee(models.Model):
    dd_fee_id = models.BigAutoField(primary_key=True)
    # Using db_column to match your SQL and renaming the field for Python/DRF
    fund_id = models.ForeignKey('Fund', on_delete=models.CASCADE, db_column='fund_id')
    scenario_id = models.ForeignKey('ScenarioList', on_delete=models.CASCADE, db_column='scenario_id')
    investment_id = models.ForeignKey('PortfolioInvestment', on_delete=models.CASCADE, db_column='investment_id')

    entry_fee_pct = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    exit_fee_pct = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    is_entry_sunk = models.BooleanField(default=False)
    is_exit_sunk = models.BooleanField(default=False)
    entry_date = models.DateField(null=True, blank=True)
    entry_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    exit_date = models.DateField(null=True, blank=True)
    exit_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scenario_due_diligence_fees'
        unique_together = ('investment_id', 'scenario_id')

    def __str__(self):
        return f"DD Fee - {self.investment.name} ({self.scenario.name})"