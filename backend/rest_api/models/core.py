from django.db import models
from django.conf import settings

class Fund(models.Model):
    fund_id = models.AutoField(primary_key=True)
    legal_name = models.CharField(max_length=255, unique=True)
    short_name = models.CharField(max_length=100, unique=True)
    formation_date = models.DateField(null=True, blank=True)
    currency = models.ForeignKey(
        'Currency',
        on_delete=models.PROTECT,
        db_column='currency_id'
    )

    phase_name = models.CharField(max_length=100)
    legal_form = models.CharField(max_length=100, null=True, blank=True)
    management_company = models.CharField(max_length=255, null=True, blank=True)
    fund_strategy = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True) 
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True) 
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "fund"
        ordering = ['formation_date', 'legal_name', 'short_name']

class ShareClass(models.Model):

    class IssuanceMethod(models.TextChoices):
        PRO_RATA = "PRO_RATA_CALLED", "Pro Rata Called Amount"
        UPFRONT = "UPFRONT", "Upfront"

    class DistributionMethod(models.TextChoices):
        REDEMPTION = "REDEMPTION_OF_SHARES", "Redemption of shares"
        DIVIDEND = "DIVIDEND", "Dividend"

    share_class_id = models.AutoField(primary_key=True)

    fund = models.ForeignKey(
        "Fund",
        on_delete=models.CASCADE,
        db_column="fund_id",
        related_name="share_class"
    )

    share_class_name = models.CharField(max_length=100)
    isin_code = models.CharField(max_length=20, null=True, blank=True)
    nominal_value = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)

    issuance_method = models.CharField(
        max_length=50,
        choices=IssuanceMethod.choices
    )

    distribution_method = models.CharField(
        max_length=50,
        choices=DistributionMethod.choices
    )

    ppm_description = models.TextField(null=True, blank=True)
    document_link = models.TextField(null=True, blank=True)
    document_name = models.CharField(max_length=255, null=True, blank=True)
    document_mime_type = models.CharField(max_length=100, null=True, blank=True) # Mime Type
    document_size = models.BigIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "share_class"
        ordering = ['share_class_name']
        constraints = [
            models.UniqueConstraint(
                fields=["fund", "share_class_name"],
                name="uq_share_class_fund_name"
            )
        ]

class Timeframe(models.Model):
    timeframe_id = models.AutoField(primary_key=True)
    fund = models.ForeignKey(
        "Fund",
        db_column="fund_id",
        on_delete=models.CASCADE
    )

    name = models.CharField(max_length=20, null=False)
    date = models.DateField(null=False)
    quarter = models.IntegerField()
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "timeframe"
        ordering = ['date', 'name']
        constraints = [
            models.UniqueConstraint(fields=['fund', 'date'], name='uq_fund_date_timeframe')
        ]
        

    def save(self, *args, **kwargs):
        if self.date:
            self.year = self.date.year
            self.quarter = (self.date.month - 1) // 3 + 1
            
        super().save(*args, **kwargs)

class LimitedPartner(models.Model):
    lp_id = models.AutoField(primary_key=True)
    country = models.ForeignKey(
        'Country',
        on_delete=models.PROTECT,
        db_column='country_id',
        related_name='limited_partners'
    )
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    iban = models.CharField(max_length=34)
    bank_name = models.CharField(max_length=255)
    swift = models.CharField(max_length=11)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'lps_limited_partner'
        ordering = ['name']

class FundManFeeCommitmentYear(models.Model):
    # Primary Key
    fund = models.OneToOneField('Fund', on_delete=models.DO_NOTHING, primary_key=True, db_column='fund_id')
    
    # Commitment FROM
    commitment_from = models.DateField()
    commitment_from_year = models.IntegerField()
    commitment_from_year_start = models.DateField() # <--- Added
    commitment_from_year_end = models.DateField()   # <--- Added
    
    # Commitment UNTIL
    commitment_until = models.DateField()
    commitment_until_year = models.IntegerField()
    commitment_until_year_start = models.DateField() # <--- Added
    commitment_until_year_end = models.DateField()   # <--- Added
    
    class Meta:
        managed = False  # Created via SQL
        db_table = 'fund_man_fee_commitment_year'
        ordering = ['commitment_from']