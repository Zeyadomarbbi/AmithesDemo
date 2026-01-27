

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Q, F

class Timeframe(models.Model):
    timeframe_id = models.AutoField(primary_key=True)
    fund = models.ForeignKey(
        "Fund",
        db_column="fund_id",
        on_delete=models.CASCADE
    )

    name = models.CharField(max_length=20, null=False)  # User input
    date = models.DateField(null=False)
    quarter = models.DecimalField(max_digits=2, decimal_places=0, editable=False)
    year = models.DecimalField(max_digits=4, decimal_places=0, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "timeframe"
        unique_together = (("fund", "date"),)

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
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "scenarios"
        # Unique constraint for active scenarios only
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "scenario_name"],
                condition=models.Q(is_deleted=False),
                name="uq_active_scenario_fund_name"
            )
        ]

    def __str__(self):
        return f"{self.fund.fund_id} | {self.scenario_name}"
    
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