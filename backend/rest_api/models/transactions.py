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
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    objects = ScenarioManager() # Default manager filters out deleted items
    all_objects = models.Manager()
    class Meta:
        db_table = "scenario_list"
        ordering = ["scenario_name", "created_at"]
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
    updated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "scenario_synthesis"
        ordering = ["synthesis_name", "created_at"]
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
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'lps_fund_closings'
        unique_together = ('fund', 'closing_period')

class LPsFundCommitment(models.Model):
    commitment_id = models.AutoField(primary_key=True)

    lp_id = models.ForeignKey(
        'LimitedPartner',
        on_delete=models.RESTRICT,
        db_column='lp_id',
        related_name='fund_commitments'
    )

    fund_id = models.ForeignKey(
        "Fund", 
        on_delete=models.CASCADE, 
        db_column="fund_id",
    )

    share_class_id = models.ForeignKey(
        "ShareClass",
        on_delete=models.PROTECT,
        db_column="share_class_id",

    )
    currency_id = models.ForeignKey(
        'Currency',
        on_delete=models.RESTRICT,
        db_column='currency_id'
    )

    lps_fund_closing_period_id = models.ForeignKey(
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
        managed = False
        db_table = 'lps_fund_commitments'


class LPsOperationDetails(models.Model):
    """
    ✅ This MUST exist because your DB FK on lps_operation_flows points to lps_operation_details.
    """
    lps_operation_details_id = models.BigAutoField(primary_key=True)

    fund = models.ForeignKey(
        "Fund",
        on_delete=models.CASCADE,
        db_column="fund_id",
        related_name="lps_operation_details",
    )

    operation_type = models.ForeignKey(
        "LPsOperationType",
        on_delete=models.PROTECT,
        db_column="operation_type_id",
        related_name="lps_operation_details",
    )

    operation_name = models.TextField(db_column="name")
    operation_number = models.IntegerField(db_column="operation_number", null=True, blank=True)
    notice_date = models.DateField(db_column="notice_date")
    due_date = models.DateField(db_column="due_date")
    total_fund_commitment = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    total_operation_amount = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    overall_percentage_of_commitment = models.DecimalField(max_digits=20, decimal_places=20, default=0)
    created_at = models.DateTimeField(db_column="created_at", null=True, blank=True)
    created_by = models.BigIntegerField(db_column="created_by", null=True, blank=True)
    
    class Meta:
        managed = False
        db_table = "lps_operation_details"

class LPsOperationFlow(models.Model):
    AMOUNT = "amount"
    PERCENTAGE = "percentage"
    
    INPUT_TYPE_CHOICES = [
        (AMOUNT, "Amount"),
        (PERCENTAGE, "Percentage"),
    ]

    operation_flow_id = models.BigAutoField(primary_key=True)
    lps_operation_details_id = models.ForeignKey(
        "LPsOperationDetails",
        on_delete=models.CASCADE,
        db_column="lps_operation_details_id",
        related_name="flows",
    )

    flow_type = models.ForeignKey(
        "LPsOperationFlowType",
        on_delete=models.PROTECT,
        db_column="flow_type_id",
        related_name="operation_flows",
    )

    flow_name = models.TextField(db_column="flow_name")
    input_type = models.TextField(
        db_column="input_type",
        choices=INPUT_TYPE_CHOICES,
        default=AMOUNT
    )
    input_amount = models.DecimalField(
        db_column="input_amount",
        max_digits=20,
        decimal_places=6,
        null=True,
        blank=True,
    )

    input_percentage = models.DecimalField(
        db_column="input_percentage",
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
    )

    allocation_percentage_of_commitment = models.DecimalField(
        db_column="allocation_percentage_of_commitment",
        max_digits=10,
        decimal_places=6,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
    )
    commitment_amount = models.DecimalField(
        db_column="commitment_amount",
        max_digits=20,
        decimal_places=6,
        default=0,
    )

    computed_total_amount = models.DecimalField(
        db_column="computed_total_amount",
        max_digits=20,
        decimal_places=6,
        default=0,
        null=False,
        blank=False,
    )

    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    created_by = models.BigIntegerField(db_column="created_by", null=True, blank=True)  # ✅ bigint

    class Meta:
        managed = False
        db_table = "lps_operation_flows"

class LPsOperationFlowLPAllocation(models.Model):
    # We can edit this table to include share class id as well
    lp_flow_allocation_id = models.BigAutoField(primary_key=True)
    operation_flow_id = models.ForeignKey(
        "LPsOperationFlow",
        on_delete=models.CASCADE,
        db_column="operation_flow_id",
        related_name="lp_allocations"
    )
    
    lp_id = models.ForeignKey(
        "LimitedPartner",
        on_delete=models.PROTECT,
        db_column="lp_id",
    )
    allocated_amount = models.DecimalField(
        db_column="allocated_amount",
        max_digits=20,
        decimal_places=6,
        default=0
    )

    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    class Meta:
        managed = False
        db_table = "lps_operation_flow_lp_allocations"

class LPsOperationLPAllocation(models.Model):
    lp_operation_allocation_id = models.BigAutoField(primary_key=True)
    lps_operation_details = models.ForeignKey(
        "LPsOperationDetails",
        on_delete=models.CASCADE,
        db_column="lps_operation_details_id",
        related_name="lp_allocations",
    )
    lp_id = models.BigIntegerField(db_column="lp_id")
    share_class_id = models.BigIntegerField(db_column="share_class_id")

    commitment_amount = models.DecimalField(db_column="commitment_amount", max_digits=20, decimal_places=6, default=0)
    capital_call = models.DecimalField(db_column="capital_call", max_digits=20, decimal_places=6, default=0)
    called_percentage = models.DecimalField(db_column="called_percentage", max_digits=10, decimal_places=6, default=0)
    shares_issued = models.DecimalField(db_column="shares_issued", max_digits=20, decimal_places=6, default=0)

    is_deleted = models.BooleanField(db_column="is_deleted", default=False)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    created_by = models.BigIntegerField(db_column="created_by", null=True, blank=True)

    class Meta:
        managed = False
        db_table = "lps_operation_lp_allocations"

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
        ordering = ["name"]
        constraints = [
            # 1. If scenario is NULL (Master/Base deals): Fund + Name must be unique
            models.UniqueConstraint(
                fields=['fund', 'name'],
                condition=models.Q(scenario__isnull=True),
                name='unique_base_investment_name_per_fund'
            ),
            # 2. If scenario is NOT NULL (Scenario deals): Fund + Scenario + Name must be unique
            models.UniqueConstraint(
                fields=['fund', 'scenario', 'name'],
                condition=models.Q(scenario__isnull=False),
                name='unique_scenario_investment_name_per_fund'
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
        ordering = ["date", "flow_id"]
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
        managed = False 
        unique_together = (('investment', 'scenario'),)

    def __str__(self):
        return f"Proj: {self.investment.name} - Scenario: {self.scenario_id}"
    
class ManFeeTranche(models.Model):
    tranche_id = models.BigAutoField(primary_key=True)
    scenario = models.ForeignKey('ScenarioList', on_delete=models.CASCADE, db_column='scenario_id')
    share_class = models.ForeignKey('ShareClass', on_delete=models.CASCADE, db_column='share_class_id')
    
    tranche_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    start_date = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'man_fee_tranches'
        managed = False
    
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
    
class ScenarioFinancialsProjection(models.Model):
    projection_id = models.BigAutoField(primary_key=True)
    
    fund = models.ForeignKey('Fund', on_delete=models.DO_NOTHING)
    scenario = models.ForeignKey('ScenarioList', on_delete=models.CASCADE)
    line_item = models.ForeignKey('FinancialLineItem', on_delete=models.CASCADE)
    
    year = models.IntegerField()
    amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False # It's a real table, but if you want Django to manage migrations, remove this. 
                        # Since we created it via SQL, keep managed=False or run --fake-initial later.
        db_table = 'scenario_financials_projections'
        ordering = ["year", "fund", "line_item"]
        unique_together = (('scenario', 'line_item', 'year'))

    # --- Helpers for Serializer ---
    @property
    def line_item_name(self):
        return self.line_item.name

    @property
    def special_field(self):
        return self.line_item.special_field

    @property
    def category_name(self):
        # Assumes FinancialLineItem has a 'category' FK
        return self.line_item.category.name
