from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Q, F


# =========================
# Reference / Dimension Tables
# =========================

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

    def __str__(self):
        return f"{self.currency_code} - {self.currency_name}"


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
        related_name="countries",
    )

    class Meta:
        managed = False
        db_table = "country"
        ordering = ["country_name"]

    def __str__(self):
        return self.country_name


class FundPhase(models.Model):
    phase_id = models.AutoField(primary_key=True)
    phase_name = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = "fund_phase"
        ordering = ["phase_id"]

    def __str__(self):
        return self.phase_name


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
        managed = False
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
        managed = False
        db_table = "man_fee_phase"
        ordering = ["phase_id"]

    def __str__(self):
        return self.phase_name


# =========================
# PnL Tables (NO Timeframe here)
# =========================

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
        FinancialCategory,
        db_column="category_id",
        on_delete=models.PROTECT,
        related_name="line_items",
    )

    name = models.CharField(max_length=100)

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


# =========================
# Waterfall + Scenarios
# =========================

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
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
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
        db_column="fund_waterfall_step_id",
    )

    share_class = models.ForeignKey(
        "ShareClass",
        on_delete=models.CASCADE,
        db_column="share_class_id",
    )

    is_selected = models.BooleanField(default=False)
    is_pro_rata = models.BooleanField(default=False)

    fixed_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
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
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
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
        db_column="waterfall_envelope_id",
    )

    share_class = models.ForeignKey(
        "ShareClass",
        on_delete=models.CASCADE,
        db_column="share_class_id",
    )

    is_selected = models.BooleanField(default=False)
    is_pro_rata = models.BooleanField(default=False)

    fixed_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "fund_waterfall_envelope_rules"
        unique_together = ("envelope", "share_class")
        constraints = [
            models.CheckConstraint(
                check=Q(fixed_percentage__gte=0, fixed_percentage__lte=100)
                | Q(fixed_percentage__isnull=True),
                name="chk_fixed_percentage_range",
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
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "fund_man_fee_rules"
        constraints = [
            models.CheckConstraint(
                name="chk_phase_share_class",
                check=(Q(phase_id=1, share_class__isnull=False) | Q(phase_id=2, share_class__isnull=True)),
            ),
            models.CheckConstraint(
                name="chk_date_range",
                check=Q(date_until__isnull=True) | Q(date_until__gt=F("date_from")),
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
        related_name="scenarios",
    )

    scenario_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)

    updated_at = models.DateTimeField(null=True, blank=True)

    objects = ScenarioManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = "scenario_list"
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "scenario_name"],
                condition=Q(is_deleted=False),
                name="uq_active_scenario_fund_name",
            )
        ]


class ScenarioSynthesis(models.Model):
    synthesis_id = models.BigAutoField(primary_key=True)

    fund = models.ForeignKey(
        "Fund",
        on_delete=models.CASCADE,
        db_column="fund_id",
        related_name="syntheses",
    )

    synthesis_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "scenario_synthesis"
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "synthesis_name"],
                condition=Q(is_deleted=False),
                name="uq_active_synthesis_per_fund",
            )
        ]
