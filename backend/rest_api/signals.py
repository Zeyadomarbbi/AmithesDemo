# signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import (
    PortfolioInvestment, PortfolioTransactionFlow, PortfolioFairValueFlow,
    PortfolioKpiCache, CapitalAccountKpiCache,
    FundWaterfallSteps, FundWaterfallStepRules, FundWaterfallEnvelopes, FundWaterfallEnvelopeRules,
    ShareClass, FinancialEntry, LPsFundCommitment, FundClosing, 
    LPsOperationDetails, LPsOperationLPAllocation, LimitedPartner
)

def _invalidate_capital_account_cache(fund_id):
    from django.db.models import Model
    if isinstance(fund_id, Model):
        fund_id = fund_id.pk
    CapitalAccountKpiCache.objects.filter(fund_id=fund_id).delete()

# Waterfall config changes
@receiver([post_save, post_delete], sender=FundWaterfallSteps)
def invalidate_on_waterfall_steps(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.fund_id)

@receiver([post_save, post_delete], sender=FundWaterfallStepRules)
def invalidate_on_waterfall_step_rules(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.fund_waterfall_step.fund_id)

@receiver([post_save, post_delete], sender=FundWaterfallEnvelopes)
def invalidate_on_waterfall_envelopes(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.fund_waterfall_steps.fund_id)

@receiver([post_save, post_delete], sender=FundWaterfallEnvelopeRules)
def invalidate_on_waterfall_envelope_rules(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.envelope.fund_waterfall_steps.fund_id)

# # Share class changes
@receiver([post_save, post_delete], sender=ShareClass)
def invalidate_on_share_class(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.fund_id)

# # Financial entries
@receiver([post_save, post_delete], sender=FinancialEntry)
def invalidate_on_financial_entries(sender, instance, **kwargs):
    fund_id = instance.line_item.fund_id
    _invalidate_capital_account_cache(fund_id)

@receiver([post_save, post_delete], sender=LimitedPartner)
def invalidate_on_limited_partner(sender, instance, **kwargs):
    # LP belongs to multiple funds via commitments — invalidate all affected funds
    fund_ids = (
        LPsFundCommitment.objects
        .filter(lp_id=instance.lp_id, is_deleted=False)
        .values_list('fund_id', flat=True)
        .distinct()
    )
    for fund_id in fund_ids:
        _invalidate_capital_account_cache(fund_id)

@receiver([post_save, post_delete], sender=LPsFundCommitment)
def invalidate_on_commitments(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.fund_id)

@receiver([post_save, post_delete], sender=FundClosing)
def invalidate_on_closings(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.fund_id)

@receiver([post_save, post_delete], sender=LPsOperationDetails)
def invalidate_on_operation_details(sender, instance, **kwargs):
    _invalidate_capital_account_cache(instance.fund_id)

@receiver([post_save, post_delete], sender=LPsOperationLPAllocation)
def invalidate_on_operation_allocations(sender, instance, **kwargs):
    try:
        op = LPsOperationDetails.objects.get(pk=instance.lps_operation_details_id)
        _invalidate_capital_account_cache(op.fund_id)
    except LPsOperationDetails.DoesNotExist:
        pass

# -- Portfolio changes
def _invalidate_cache_for_investments(investment_ids):
    fund_ids = (
        PortfolioInvestment.objects
        .filter(investment_id__in=investment_ids)
        .values_list("fund_id", flat=True)
        .distinct()
    )
    PortfolioKpiCache.objects.filter(fund_id__in=fund_ids).delete()

@receiver([post_save, post_delete], sender=PortfolioTransactionFlow)
def invalidate_on_transaction_flow(sender, instance, **kwargs):
    PortfolioKpiCache.objects.filter(
        fund_id=instance.fund_id
    ).delete()

@receiver([post_save, post_delete], sender=PortfolioFairValueFlow)
def invalidate_on_fair_value_flow(sender, instance, **kwargs):
    _invalidate_cache_for_investments([instance.portfolio_investment_id])

@receiver([post_save, post_delete], sender=PortfolioInvestment)
def invalidate_on_investment(sender, instance, **kwargs):
    print(f"[SIGNAL] fired for investment_id={instance.investment_id} fund_id={instance.fund_id}")
    PortfolioKpiCache.objects.filter(fund_id=instance.fund_id).delete()