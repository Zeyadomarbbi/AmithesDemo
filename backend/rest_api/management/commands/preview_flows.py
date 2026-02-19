import pandas as pd
import numpy as np
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import Sum, Count
# IMPORTS

from rest_api.models.transactions import (
    FundWaterfallSteps,
    FundWaterfallStepRules,
    FundWaterfallEnvelopes,
    FundWaterfallEnvelopeRules,
)

class Command(BaseCommand):
    help = 'Previews Cash Flows with Flexible Share Classes and Dynamic Waterfall'

    def add_arguments(self, parser):
        parser.add_argument('fund_id', type=int)
        parser.add_argument('timeframe_id', type=int)

    def fetch_realized_lookups(self, timeframe_id, fund_id):
        """
        [0.5a] Single query returning both capital-call and distribution
        amounts per date and share class.

        Returns:
            realized_calls : { 'YYYY-MM-DD': { 'Class A': amount, ... } }
            realized_dists : { 'YYYY-MM-DD': { 'Class A': amount, ... } }
        """
        self.stdout.write("\n[0.5a] REALIZED LOOKUPS (Calls & Distributions)")
        self.stdout.write("-" * 100)

        q = """
            SELECT
                t.name,
                d.due_date,
                sc.share_class_name,
                SUM(a.capital_call)
            FROM lps_operation_lp_allocations a
            JOIN lps_operation_details d ON a.lps_operation_details_id = d.lps_operation_details_id
            JOIN lps_operation_type t    ON d.operation_type_id = t.operation_type_id
            JOIN share_class sc           ON a.share_class_id = sc.share_class_id
            WHERE d.fund_id = %s
            GROUP BY t.name, d.due_date, sc.share_class_name;
        """
        realized_calls = {}
        realized_dists = {}

        with connection.cursor() as c:
            c.execute(q, [fund_id])
            for op_type, due_date, sc_name, amount in c.fetchall():
                dt  = str(due_date)
                amt = float(amount) if amount else 0.0
                if op_type in ('Capital Call', 'Capital Call / Equalization', 'Equalization'):
                    realized_calls.setdefault(dt, {})[sc_name] = amt
                elif op_type == 'Distribution':
                    realized_dists.setdefault(dt, {})[sc_name] = amt

        self.stdout.write(f" > Realized call dates : {len(realized_calls)}")
        self.stdout.write(f" > Realized dist dates : {len(realized_dists)}")
        return realized_calls, realized_dists

    def fetch_waterfall_config(self, fund_id):
        """
        Fetches waterfall step configuration for the fund.

        Returns:
            config: { step_number: {
                'name': str,
                'rate': float,
                'direct_rules': { 'Class A': float|'Pro-Rata', ... },
                'envelopes': [ { 'num': int, 'alloc': float, 'rules': { 'Class B': ... } } ],
                'classes': [ 'Class A', 'Class B', ... ]   # all active classes for this step
            }}
        """
        self.stdout.write("\n[0.5b] WATERFALL CONFIGURATION & ENVELOPES")
        self.stdout.write("-" * 100)

        config = {}
        steps = FundWaterfallSteps.objects.filter(fund_id=fund_id).select_related('step_definition').order_by('step_definition__step_number')

        for step in steps:
            s_num = step.step_definition.step_number
            s_rate = float(step.step_rate) / 100.0 if step.step_rate else 0.0

            print(f"\n[STEP {s_num}] {step.step_name.upper()} (Rate: {s_rate:.2%})")

            # Direct Rules
            d_rules_qs = FundWaterfallStepRules.objects.filter(
                fund_waterfall_step=step, is_selected=True
            ).select_related('share_class')
            d_rules = {}
            if d_rules_qs.exists():
                print("  > Direct Rules:")
                for r in d_rules_qs:
                    pct_val = float(r.fixed_percentage) if r.fixed_percentage else 'Pro-Rata'
                    d_rules[r.share_class.share_class_name] = pct_val
                    print(f"    - {r.share_class.share_class_name}: {pct_val if isinstance(pct_val, str) else f'{pct_val:.2f}%'}")

            # Envelopes
            envs = []
            env_qs = FundWaterfallEnvelopes.objects.filter(
                fund_waterfall_steps=step
            ).order_by('envelope_number')
            if env_qs.exists():
                print("  > Envelopes:")
                for e in env_qs:
                    e_alloc = float(e.allocation_percentage)
                    print(f"    [Env {e.envelope_number}] Allocation: {e_alloc:.2f}% of Step")

                    e_rules_qs = FundWaterfallEnvelopeRules.objects.filter(
                        envelope=e, is_selected=True
                    ).select_related('share_class')
                    e_rules = {}
                    if e_rules_qs.exists():
                        for er in e_rules_qs:
                            pct_val = float(er.fixed_percentage) if er.fixed_percentage else 'Pro-Rata'
                            e_rules[er.share_class.share_class_name] = pct_val
                            print(f"      -> {er.share_class.share_class_name}: {pct_val if isinstance(pct_val, str) else f'{pct_val:.2f}%'}")
                    else:
                        print("      -> No rules configured")
                    envs.append({'num': e.envelope_number, 'alloc': e_alloc / 100.0, 'rules': e_rules})

            # Determine Active Classes (exact keys, deduped, ordered)
            classes = list(d_rules.keys())
            for e in envs:
                for c in e['rules']:
                    if c not in classes:
                        classes.append(c)

            config[s_num] = {
                'name':         step.step_name,
                'rate':         s_rate,
                'direct_rules': d_rules,
                'envelopes':    envs,
                'classes':      classes,
            }

        return config
    
    def fetch_net_pnl(self, timeframe_id, fund_id):
        """
        Fetches net P&L up to and including the given timeframe's date.

        Returns:
            {
                'date': '2024-03-31',
                'categories': {
                    'Income':  float,
                    'Expense': float,
                    'Tax':     float,
                },
                'net_pnl': float
            }
        """
        self.stdout.write("\n[1] NET P&L CALCULATION")
        self.stdout.write("-" * 100)

        q = """
            SELECT
                fc.name                             AS category,
                SUM(fe.amount * fc.sign_multiplier) AS signed_total
            FROM financial_entries fe
            JOIN financial_line_item fli ON fe.line_item_id = fli.line_item_id
            JOIN financial_category   fc  ON fli.category_id = fc.category_id
            JOIN timeframe            tf  ON fe.timeframe_id = tf.timeframe_id
            WHERE fli.fund_id = %s
            AND tf.date <= (
                SELECT date FROM timeframe WHERE timeframe_id = %s
            )
            AND fli.is_deleted = FALSE
            GROUP BY fc.name, fc.sign_multiplier
            ORDER BY fc.name;
        """

        categories = {}
        with connection.cursor() as c:
            c.execute(q, [fund_id, timeframe_id])
            for category, signed_total in c.fetchall():
                categories[category] = float(signed_total) if signed_total else 0.0

        # Fetch the date for display/logging
        with connection.cursor() as c:
            c.execute("SELECT date FROM timeframe WHERE timeframe_id = %s", [timeframe_id])
            row = c.fetchone()
            tf_date = str(row[0]) if row else None

        net_pnl = sum(categories.values())

        self.stdout.write(f" > As of date      : {tf_date}")
        for cat, val in categories.items():
            self.stdout.write(f" > {cat:<10}     : {val:,.2f}")
        self.stdout.write(f" > Net P&L         : {net_pnl:,.2f}")

        return {
            'date':       tf_date,
            'categories': categories,
            'net_pnl':    net_pnl,
        }
    
    def handle(self, *args, **options):
        fund_id     = options['fund_id']
        timeframe_id = options['timeframe_id']
        self.stdout.write(self.style.SUCCESS(f"\nFUND: {fund_id}  SCENARIO: {timeframe_id}"))
        self.stdout.write("=" * 100)
        waterfall_config = self.fetch_waterfall_config(fund_id)
        pnl_data         = self.fetch_net_pnl(timeframe_id, fund_id)
        self.stdout.write("\n" + "=" * 100)
        self.stdout.write(self.style.SUCCESS("WATERFALL CONFIGURATION SUMMARY"))
        self.stdout.write("=" * 100)
        for step_num, step in waterfall_config.items():
            self.stdout.write(f"\n  Step {step_num}: {step['name'].upper()}  |  Rate: {step['rate']:.2%}")
            if step['direct_rules']:
                self.stdout.write("  Direct Rules:")
                for cls, pct in step['direct_rules'].items():
                    val = pct if isinstance(pct, str) else f"{pct:.2f}%"
                    self.stdout.write(f"    - {cls}: {val}")
            for env in step['envelopes']:
                self.stdout.write(f"  Envelope {env['num']}  |  Allocation: {env['alloc']:.2%} of step")
                for cls, pct in env['rules'].items():
                    val = pct if isinstance(pct, str) else f"{pct:.2f}%"
                    self.stdout.write(f"    -> {cls}: {val}")

        self.stdout.write("\n" + "=" * 100)
        self.stdout.write(self.style.SUCCESS("P&L SUMMARY"))
        self.stdout.write("=" * 100)
        self.stdout.write(f"  As of Date : {pnl_data['date']}")
        self.stdout.write(f"  {'Category':<12} {'Amount':>18}")
        self.stdout.write("  " + "-" * 32)
        for cat, val in pnl_data['categories'].items():
            self.stdout.write(f"  {cat:<12} {val:>18,.2f}")
        self.stdout.write("  " + "-" * 32)
        self.stdout.write(f"  {'Net P&L':<12} {pnl_data['net_pnl']:>18,.2f}")
        self.stdout.write("=" * 100 + "\n")