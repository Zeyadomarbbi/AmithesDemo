from django.db import models
from django.utils import timezone
from .reference import FinancialLineItem


class FinancialEntry(models.Model):
    entry_id = models.AutoField(primary_key=True)

    timeframe_id = models.IntegerField(db_column="timeframe_id")

    line_item = models.ForeignKey(
        FinancialLineItem,
        db_column="line_item_id",
        on_delete=models.PROTECT,
        related_name="entries",
    )

    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)

    # ✅ IMPORTANT: prevent null insert + timezone-aware (USE_TZ=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    created_by = models.IntegerField(null=True, blank=True)

    updated_at = models.DateTimeField(null=True, blank=True)
    updated_by = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "financial_entries"
        unique_together = ("timeframe_id", "line_item")

    def save(self, *args, **kwargs):
        """
        Ensure timezone-aware timestamps.
        - created_at set once
        - updated_at set on every update
        """
        now = timezone.now()

        if not self.created_at:
            self.created_at = now

        # set updated_at only when updating existing rows
        if self.pk:
            self.updated_at = now

        super().save(*args, **kwargs)
