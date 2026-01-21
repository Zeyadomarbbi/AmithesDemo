from django.db import models

class FactFundWaterfallStep(models.Model):
    id = models.BigAutoField(primary_key=True)
    
    fund = models.ForeignKey(
        "DimFund", 
        on_delete=models.CASCADE, 
        related_name="waterfall_instances",
        db_column="fund_id"
    )
    
    step_definition = models.ForeignKey(
        "DimWaterfallStep", 
        on_delete=models.PROTECT,
        db_column="step_definition_id"
    )

    # The custom name (e.g. "Nominal Repayment", "Special Return")
    name = models.CharField(max_length=255)
    
    # Used for Step 2 (8.00%) and Step 3 (25.00%)
    rate = models.DecimalField(
        max_digits=18, decimal_places=4, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "fact_fund_waterfall_step"
        unique_together = ["fund", "step_definition"]
        ordering = ["step_definition__step_number"]


class FactWaterfallEnvelope(models.Model):
    id = models.BigAutoField(primary_key=True)
    
    step_instance = models.ForeignKey(
        FactFundWaterfallStep, 
        on_delete=models.CASCADE, 
        related_name="envelopes",
        db_column="step_instance_id"
    )
    
    # Strictly 1 or 2
    envelope_number = models.IntegerField() 

    # Default 0.00 if unused
    allocation_percentage = models.DecimalField(
        max_digits=18, decimal_places=4, default=0.00
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "fact_waterfall_envelope"
        unique_together = ["step_instance", "envelope_number"]
        ordering = ["envelope_number"]


class FactWaterfallRule(models.Model):
    id = models.BigAutoField(primary_key=True)
    
    envelope = models.ForeignKey(
        FactWaterfallEnvelope, 
        on_delete=models.CASCADE, 
        related_name="rules",
        db_column="envelope_id"
    )
    
    share_class = models.ForeignKey(
        "DimShareClass", 
        on_delete=models.CASCADE,
        db_column="share_class_id"
    )

    # UI: Checkbox (Checked = True)
    is_selected = models.BooleanField(default=False)
    
    # UI: "Pro Rata" label/logic
    is_pro_rata = models.BooleanField(default=True)
    
    # Optional fixed % if Pro Rata is unchecked
    fixed_percentage = models.DecimalField(
        max_digits=18, decimal_places=4, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "fact_waterfall_rule"
        unique_together = ["envelope", "share_class"]

class FactFundManFeeRule(models.Model):
    fee_rule_id = models.BigAutoField(primary_key=True)

    fund = models.ForeignKey(
        "DimFund",
        on_delete=models.CASCADE,
        db_column="fund_id",
        related_name="man_fee_rules",
    )

    phase = models.ForeignKey(
        "DimManFeePhase",
        on_delete=models.PROTECT,
        db_column="phase_id",
        related_name="man_fee_rules",
    )

    share_class = models.ForeignKey(
        "DimShareClass",
        on_delete=models.PROTECT,
        db_column="share_class_id",
        null=True,
        blank=True,
        related_name="man_fee_rules",
    )

    date_from = models.DateField()
    date_until = models.DateField(null=True, blank=True)

    rate_percentage = models.DecimalField(max_digits=18, decimal_places=4)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "fact_fund_man_fee_rules"
        constraints = [
            models.CheckConstraint(
                name="chk_phase_share_class",
                check=(
                    models.Q(phase_id=1, share_class__isnull=False)
                    | models.Q(phase_id=2, share_class__isnull=True)
                ),
            ),
            models.CheckConstraint(
                name="chk_date_range",
                check=models.Q(date_until__isnull=True)
                | models.Q(date_until__gt=models.F("date_from")),
            ),
            models.UniqueConstraint(
                fields=["fund", "phase", "share_class", "date_from"],
                name="uq_fee_rule",
            ),
        ]
