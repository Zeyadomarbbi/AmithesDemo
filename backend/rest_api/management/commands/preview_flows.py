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
    
    def fetch_net_pnl(self, fund_id, timeframe_id):
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
    
    def fetch_share_classes(self, fund_id):
        """
        Fetches all active share classes for the fund.

        Returns:
            { share_class_id: { 'name': str, 'nominal_value': float, 'issuance_method': str, 'distribution_method': str } }
        """
        self.stdout.write("\n[0.5c] SHARE CLASSES")
        self.stdout.write("-" * 100)

        q = """
            SELECT
                share_class_id,
                share_class_name,
                nominal_value,
                issuance_method,
                distribution_method
            FROM share_class
            WHERE fund_id = %s
            AND is_deleted = FALSE
            ORDER BY share_class_id;
        """

        share_classes = {}
        with connection.cursor() as c:
            c.execute(q, [fund_id])
            for sc_id, sc_name, nominal_value, issuance_method, distribution_method in c.fetchall():
                share_classes[sc_id] = {
                    'name':                sc_name,
                    'nominal_value':       float(nominal_value) if nominal_value else 0.0,
                    'issuance_method':     issuance_method,
                    'distribution_method': distribution_method,
                }
                self.stdout.write(
                    f"  [{sc_id}] {sc_name:<30} | Nominal: {float(nominal_value) if nominal_value else 0.0:>12,.6f} "
                    f"| Issuance: {issuance_method:<25} | Distribution: {distribution_method}"
                )

        self.stdout.write(f" > Total share classes: {len(share_classes)}")
        return share_classes
    
    def fetch_cash_flow_table(self, fund_id, timeframe_id, waterfall_config):
        """
        Builds the cash flow helper table up to the given timeframe date,
        including interest computation per row per eligible share class.

        Returns:
            {
                'share_classes': [str],
                'rows': [
                    {
                        'date':             str,
                        'op_name':          str,
                        'op_type':          str,
                        'commitment_total': float,
                        'commitment_by_sc': { sc_name: float },
                        'flows':            float,
                        'called_by_sc':     { sc_name: float },
                        'interest_by_sc':   { sc_name: float },
                    }
                ],
                'aggregation': {
                    'date':             str,
                    'commitment_total': float,
                    'commitment_by_sc': { sc_name: float },
                    'flows':            float,
                    'called_by_sc':     { sc_name: float },
                    'interest_by_sc':   { sc_name: float },
                }
            }
        """
        self.stdout.write("\n[2] CASH FLOW TABLE")
        self.stdout.write("-" * 100)

        q = """
            SELECT
                od.lps_operation_details_id,
                od.due_date,
                od.name                             AS op_name,
                ot.name                             AS op_type,
                ot.sign_multiplier,
                od.total_operation_amount,
                sc.share_class_name,
                SUM(al.capital_call)                AS called_amount,
                SUM(al.commitment_amount)           AS commitment_amount
            FROM lps_operation_details od
            JOIN lps_operation_type            ot  ON od.operation_type_id       = ot.operation_type_id
            JOIN lps_operation_lp_allocations  al  ON al.lps_operation_details_id    = od.lps_operation_details_id
            JOIN share_class                 sc  ON al.share_class_id           = sc.share_class_id
            WHERE od.fund_id = %s
            AND od.due_date <= (SELECT date FROM timeframe WHERE timeframe_id = %s)
            GROUP BY
                od.lps_operation_details_id,
                od.due_date,
                od.name,
                ot.name,
                ot.sign_multiplier,
                od.total_operation_amount,
                sc.share_class_name
            ORDER BY od.due_date, od.lps_operation_details_id;
        """

        ops             = {}
        share_class_set = []
        op_order        = []

        with connection.cursor() as c:
            c.execute(q, [fund_id, timeframe_id])
            for op_id, due_date, op_name, op_type, sign_mult, total_amount, sc_name, called_amount, commitment_amount in c.fetchall():
                called = float(called_amount)     if called_amount     else 0.0
                commit = float(commitment_amount) if commitment_amount else 0.0
                flows  = float(total_amount) * sign_mult if total_amount else 0.0

                if op_id not in ops:
                    ops[op_id] = {
                        'date':             str(due_date),
                        'op_name':          op_name,
                        'op_type':          op_type,
                        'flows':            flows,
                        'commitment_total': 0.0,
                        'commitment_by_sc': {},
                        'called_by_sc':     {},
                        'interest_by_sc':   {},
                    }
                    op_order.append(op_id)

                ops[op_id]['called_by_sc'][sc_name]     = ops[op_id]['called_by_sc'].get(sc_name, 0.0)     + called
                ops[op_id]['commitment_by_sc'][sc_name] = ops[op_id]['commitment_by_sc'].get(sc_name, 0.0) + commit
                ops[op_id]['commitment_total']          += commit

                if sc_name not in share_class_set:
                    share_class_set.append(sc_name)

        share_class_set.sort()
        rows = [ops[op_id] for op_id in op_order]

        # --- Aggregation Row ---
        if rows:
            latest_year = max(int(r['date'][:4]) for r in rows)
            agg_date    = f"{latest_year}-12-31"

            existing_dates = [r['date'] for r in rows]
            if agg_date in existing_dates:
                merged_flows        = 0.0
                merged_called       = {}
                merged_commit       = {}
                merged_commit_total = 0.0
                remaining_rows      = []
                for r in rows:
                    if r['date'] == agg_date:
                        merged_flows        += r['flows']
                        merged_commit_total += r['commitment_total']
                        for sc, v in r['called_by_sc'].items():
                            merged_called[sc] = merged_called.get(sc, 0.0) + v
                        for sc, v in r['commitment_by_sc'].items():
                            merged_commit[sc] = merged_commit.get(sc, 0.0) + v
                    else:
                        remaining_rows.append(r)
                rows = remaining_rows
                aggregation = {
                    'date':             agg_date,
                    'flows':            merged_flows,
                    'commitment_total': merged_commit_total,
                    'commitment_by_sc': merged_commit,
                    'called_by_sc':     merged_called,
                    'interest_by_sc':   {},
                }
            else:
                last_row   = rows[-1]
                agg_flows  = sum(r['flows'] for r in rows)
                agg_called = {}
                for r in rows:
                    for sc, v in r['called_by_sc'].items():
                        agg_called[sc] = agg_called.get(sc, 0.0) + v
                aggregation = {
                    'date':             agg_date,
                    'flows':            agg_flows,
                    'commitment_total': last_row['commitment_total'],
                    'commitment_by_sc': last_row['commitment_by_sc'].copy(),
                    'called_by_sc':     agg_called,
                    'interest_by_sc':   {},
                }
        else:
            aggregation = None

        # --- Interest Computation ---
        import datetime

        step2            = waterfall_config.get(2, {})
        hurdle_rate      = step2.get('rate', 0.0)
        direct_rules     = step2.get('direct_rules', {})
        eligible_classes = {sc for sc, rule in direct_rules.items() if rule == 'Pro-Rata'}

        if eligible_classes and aggregation:
            agg_date_obj     = datetime.datetime.strptime(aggregation['date'], "%Y-%m-%d").date()
            total_interests  = {}

            for row in rows:
                row_date = datetime.datetime.strptime(row['date'], "%Y-%m-%d").date()
                days     = (agg_date_obj - row_date).days

                for sc in share_class_set:
                    if sc not in eligible_classes:
                        row['interest_by_sc'][sc] = 0.0
                        continue
                    called   = row['called_by_sc'].get(sc, 0.0)
                    interest = round(called * ((1 + hurdle_rate) ** (days / 365) - 1), 2) if called and days > 0 else 0.0
                    row['interest_by_sc'][sc]   = interest
                    total_interests[sc]         = total_interests.get(sc, 0.0) + interest

            aggregation['interest_by_sc'] = total_interests
        else:
            for row in rows:
                row['interest_by_sc'] = {sc: 0.0 for sc in share_class_set}
            if aggregation:
                aggregation['interest_by_sc'] = {}

        # --- Print ---
        interest_cols = [f"Interest {sc}" for sc in share_class_set]
        called_cols   = [f"Called {sc}"   for sc in share_class_set]
        commit_cols   = [f"Commit {sc}"   for sc in share_class_set]

        header = (
            f"  {'Date':<14} {'Operation':<30} {'Type':<30} "
            f"{'Commit Total':>16} "
            + " ".join(f"{c:>20}" for c in commit_cols)
            + f" {'Flows':>16} "
            + " ".join(f"{c:>20}" for c in called_cols)
            + " "
            + " ".join(f"{c:>24}" for c in interest_cols)
        )
        self.stdout.write(header)
        self.stdout.write("  " + "-" * 200)

        for row in rows:
            commit_vals   = " ".join(f"{row['commitment_by_sc'].get(sc, 0.0):>20,.2f}" for sc in share_class_set)
            called_vals   = " ".join(f"{row['called_by_sc'].get(sc, 0.0):>20,.2f}"     for sc in share_class_set)
            interest_vals = " ".join(f"{row['interest_by_sc'].get(sc, 0.0):>24,.2f}"   for sc in share_class_set)
            self.stdout.write(
                f"  {row['date']:<14} {row['op_name']:<30} {row['op_type']:<30} "
                f"{row['commitment_total']:>16,.2f} {commit_vals} "
                f"{row['flows']:>16,.2f} {called_vals} {interest_vals}"
            )

        if aggregation:
            self.stdout.write("  " + "=" * 200)
            commit_vals   = " ".join(f"{aggregation['commitment_by_sc'].get(sc, 0.0):>20,.2f}" for sc in share_class_set)
            called_vals   = " ".join(f"{aggregation['called_by_sc'].get(sc, 0.0):>20,.2f}"     for sc in share_class_set)
            interest_vals = " ".join(f"{aggregation['interest_by_sc'].get(sc, 0.0):>24,.2f}"   for sc in share_class_set)
            self.stdout.write(
                f"  {aggregation['date']:<14} {'TOTAL / SNAPSHOT':<30} {'':<30} "
                f"{aggregation['commitment_total']:>16,.2f} {commit_vals} "
                f"{aggregation['flows']:>16,.2f} {called_vals} {interest_vals}"
            )

        self.stdout.write("=" * 100)

        return {
            'share_classes': share_class_set,
            'rows':          rows,
            'aggregation':   aggregation,
        }
    
    def fetch_commitments(self, fund_id, timeframe_id):
        """
        Fetches commitment amounts grouped by LP and share class,
        only including closings whose date <= the given timeframe's date.

        Returns:
            {
                'by_lp': { lp_id: { 'name': str, 'total': float, 'by_share_class': { sc_name: float } } },
                'by_share_class': { sc_name: float },
                'total': float
            }
        """
        self.stdout.write("\n[1] COMMITMENTS")
        self.stdout.write("-" * 100)

        q = """
            SELECT
                lp.lp_id,
                lp.name,
                sc.share_class_name,
                SUM(c.commitment_amount) AS total_commitment
            FROM lps_fund_commitments c
            JOIN lps_limited_partner lp  ON c.lp_id                    = lp.lp_id
            JOIN share_class        sc  ON c.share_class_id           = sc.share_class_id
            JOIN lps_fund_closings    fc  ON c.lps_fund_closing_period_id = fc.lps_fund_closing_period_id
            WHERE c.fund_id    = %s
            AND c.is_deleted = FALSE
            AND fc.date <= (SELECT date FROM timeframe WHERE timeframe_id = %s)
            GROUP BY lp.lp_id, lp.name, sc.share_class_name
            ORDER BY lp.name, sc.share_class_name;
        """
        by_lp          = {}
        by_share_class = {}
        grand_total    = 0.0

        with connection.cursor() as c:
            c.execute(q, [fund_id, timeframe_id])
            for lp_id, lp_name, sc_name, amount in c.fetchall():
                amt = float(amount) if amount else 0.0

                if lp_id not in by_lp:
                    by_lp[lp_id] = {'name': lp_name, 'total': 0.0, 'by_share_class': {}}
                by_lp[lp_id]['by_share_class'][sc_name]  = by_lp[lp_id]['by_share_class'].get(sc_name, 0.0) + amt
                by_lp[lp_id]['total']                   += amt

                by_share_class[sc_name] = by_share_class.get(sc_name, 0.0) + amt
                grand_total            += amt

        # Print
        self.stdout.write(f"\n  {'LP':<35} {'Share Class':<25} {'Commitment':>18}")
        self.stdout.write("  " + "-" * 80)
        for lp_id, lp_data in by_lp.items():
            for sc_name, amt in lp_data['by_share_class'].items():
                self.stdout.write(f"  {lp_data['name']:<35} {sc_name:<25} {amt:>18,.2f}")
            self.stdout.write(f"  {'  >> LP Total: ' + lp_data['name']:<60} {lp_data['total']:>18,.2f}")
            self.stdout.write("  " + "-" * 80)

        self.stdout.write(f"\n  Share Class Totals:")
        for sc_name, amt in by_share_class.items():
            self.stdout.write(f"  {sc_name:<35} {amt:>18,.2f}")

        self.stdout.write("  " + "-" * 80)
        self.stdout.write(f"  {'TOTAL COMMITMENT':<35} {grand_total:>18,.2f}")
        self.stdout.write("=" * 100)

        return {
            'by_lp':          by_lp,
            'by_share_class': by_share_class,
            'total':          grand_total,
        }
    
    def fetch_shares(self, fund_id, timeframe_id):
        """
        Fetches total shares issued per share class and per LP,
        only from operations up to the given timeframe date.

        Returns:
            {
                'by_share_class': { sc_name: float },
                'by_lp':          { lp_id: float },
                'total':          float
            }
        """
        q = """
            SELECT
                lp.lp_id,
                sc.share_class_name,
                SUM(al.shares_issued) AS total_shares
            FROM lps_operation_lp_allocations al
            JOIN lps_limited_partner   lp  ON al.lp_id               = lp.lp_id
            JOIN share_classes         sc  ON al.share_class_id       = sc.share_class_id
            JOIN lps_operation_details od  ON al.operation_details_id = od.operation_details_id
            WHERE od.fund_id   = %s
            AND od.due_date <= (SELECT date FROM timeframe WHERE timeframe_id = %s)
            GROUP BY lp.lp_id, sc.share_class_name
            ORDER BY sc.share_class_name, lp.lp_id;
        """

        by_share_class = {}
        by_lp          = {}

        with connection.cursor() as c:
            c.execute(q, [fund_id, timeframe_id])
            for lp_id, sc_name, total_shares in c.fetchall():
                shares = float(total_shares) if total_shares else 0.0

                by_share_class[sc_name] = by_share_class.get(sc_name, 0.0) + shares
                by_lp[lp_id]            = by_lp.get(lp_id, 0.0)            + shares

        total = sum(by_share_class.values())

        return {
            'by_share_class': by_share_class,
            'by_lp':          by_lp,
            'total':          total,
        }

    def compute_kpis_basic(self, commitments, cash_flow_table, pnl_data, waterfall_config, shares):
        self.stdout.write("\n[4] BASIC KPIs")
        self.stdout.write("-" * 100)

        total_commitment = commitments['total']
        share_classes    = cash_flow_table['share_classes']

        # --- Commitment ---
        commitment = {
            'total':          total_commitment,
            'by_share_class': commitments['by_share_class'].copy(),
            'by_lp':          {lp_id: data['total'] for lp_id, data in commitments['by_lp'].items()},
        }

        # --- Capital Called ---
        capital_called_total = sum(
            abs(row['flows'])
            for row in cash_flow_table['rows']
            if row['op_type'] in ('Capital Call', 'Capital Call / Equalization', 'Equalization')
        )
        capital_called_by_sc = {
            sc: capital_called_total * (amt / total_commitment)
            for sc, amt in commitments['by_share_class'].items()
        } if total_commitment else {}
        capital_called_by_lp = {
            lp_id: capital_called_total * (data['total'] / total_commitment)
            for lp_id, data in commitments['by_lp'].items()
        } if total_commitment else {}
        capital_called = {
            'total':          capital_called_total,
            'by_share_class': capital_called_by_sc,
            'by_lp':          capital_called_by_lp,
        }

        # --- Undrawn ---
        undrawn = {
            'total':          total_commitment - capital_called_total,
            'by_share_class': {
                sc: commitments['by_share_class'].get(sc, 0.0) - capital_called_by_sc.get(sc, 0.0)
                for sc in commitments['by_share_class']
            },
            'by_lp': {
                lp_id: commitments['by_lp'][lp_id]['total'] - capital_called_by_lp.get(lp_id, 0.0)
                for lp_id in commitments['by_lp']
            },
        }

        # --- Distributed ---
        distributed_total = sum(
            abs(row['flows'])
            for row in cash_flow_table['rows']
            if row['op_type'] == 'Distribution'
        )
        distributed_by_sc = {
            sc: distributed_total * (amt / total_commitment)
            for sc, amt in commitments['by_share_class'].items()
        } if total_commitment else {}
        distributed_by_lp = {
            lp_id: distributed_total * (data['total'] / total_commitment)
            for lp_id, data in commitments['by_lp'].items()
        } if total_commitment else {}
        distributed = {
            'total':          distributed_total,
            'by_share_class': distributed_by_sc,
            'by_lp':          distributed_by_lp,
        }

        # --- NAV (fund level) ---
        nav_total = capital_called_total - distributed_total + pnl_data['net_pnl']

        # --- Waterfall Payments (inner) ---
        def construct_waterfall_payments():

            # --- Step 1: Nominal Repayment ---
            step1        = waterfall_config.get(1, {})
            nr_rules     = step1.get('direct_rules', {})

            nr_remaining = nav_total + distributed_total
            nr_to_deduct = min(nr_remaining, capital_called_total)
            nr_by_sc     = {}
            for sc in share_classes:
                if nr_rules.get(sc) == 'Pro-Rata':
                    nr_by_sc[sc] = nr_to_deduct * (commitments['by_share_class'].get(sc, 0.0) / total_commitment) if total_commitment else 0.0
                else:
                    nr_by_sc[sc] = 0.0

            # --- Step 2: Hurdle ---
            step2        = waterfall_config.get(2, {})
            h_rules      = step2.get('direct_rules', {})
            hurdle_rate  = step2.get('rate', 0.0)

            h_remaining  = max(0.0, nr_remaining - nr_to_deduct)

            agg          = cash_flow_table.get('aggregation') or {}
            interest_map = agg.get('interest_by_sc', {})
            eligible_interest_total = sum(
                v for sc, v in interest_map.items()
                if h_rules.get(sc) == 'Pro-Rata'
            )

            h_to_deduct = min(eligible_interest_total, h_remaining)
            h_by_sc     = {}
            for sc in share_classes:
                if h_rules.get(sc) == 'Pro-Rata':
                    h_by_sc[sc] = h_to_deduct * (commitments['by_share_class'].get(sc, 0.0) / total_commitment) if total_commitment else 0.0
                else:
                    h_by_sc[sc] = 0.0

            # --- Step 3: Catch-up ---
            step3        = waterfall_config.get(3, {})
            catchup_rate = step3.get('rate', 0.0)
            cu_envelopes_cfg = step3.get('envelopes', [])

            cu_remaining = max(0.0, h_remaining - h_to_deduct)
            cu_to_deduct = min(cu_remaining, catchup_rate * h_to_deduct)
            cu_by_sc     = {sc: 0.0 for sc in share_classes}
            cu_envelopes = []

            for env in cu_envelopes_cfg:
                env_alloc    = env['alloc']
                env_rules_sc = env['rules']

                if env_alloc == 0.0:
                    cu_envelopes.append({'num': env['num'], 'remaining': 0.0, 'to_deduct': 0.0, 'by_sc': {sc: 0.0 for sc in share_classes}})
                    continue

                env_to_deduct = cu_to_deduct * env_alloc
                env_by_sc     = {}
                for sc in share_classes:
                    rule = env_rules_sc.get(sc)
                    if rule == 'Pro-Rata':
                        env_by_sc[sc] = env_to_deduct * (commitments['by_share_class'].get(sc, 0.0) / total_commitment) if total_commitment else 0.0
                    elif isinstance(rule, float):
                        env_by_sc[sc] = env_to_deduct * (rule / 100.0)
                    else:
                        env_by_sc[sc] = 0.0
                    cu_by_sc[sc] += env_by_sc[sc]

                cu_envelopes.append({'num': env['num'], 'remaining': env_to_deduct, 'to_deduct': env_to_deduct, 'by_sc': env_by_sc})

            catchup = {'remaining': cu_remaining, 'to_deduct': cu_to_deduct, 'by_sc': cu_by_sc, 'envelopes': cu_envelopes}

            # --- Step 4: Special Return ---
            step4        = waterfall_config.get(4, {})
            sr_envelopes_cfg = step4.get('envelopes', [])

            sr_remaining = max(0.0, cu_remaining - cu_to_deduct)
            sr_to_deduct = sr_remaining              # special return consumes all remaining
            sr_by_sc     = {sc: 0.0 for sc in share_classes}
            sr_envelopes = []

            for env in sr_envelopes_cfg:
                env_alloc    = env['alloc']
                env_rules_sc = env['rules']

                if env_alloc == 0.0:
                    sr_envelopes.append({'num': env['num'], 'remaining': 0.0, 'to_deduct': 0.0, 'by_sc': {sc: 0.0 for sc in share_classes}})
                    continue

                env_to_deduct = sr_to_deduct * env_alloc  # envelope rate * total sr to_deduct
                env_by_sc     = {}
                for sc in share_classes:
                    rule = env_rules_sc.get(sc)
                    if rule == 'Pro-Rata':
                        # eligible: gets full env_to_deduct (boolean — this envelope is dedicated to this class)
                        env_by_sc[sc] = env_to_deduct
                    else:
                        env_by_sc[sc] = 0.0
                    sr_by_sc[sc] += env_by_sc[sc]

                sr_envelopes.append({'num': env['num'], 'remaining': env_to_deduct, 'to_deduct': env_to_deduct, 'by_sc': env_by_sc})

            special_return = {'remaining': sr_remaining, 'to_deduct': sr_to_deduct, 'by_sc': sr_by_sc, 'envelopes': sr_envelopes}

            # --- Totals ---
            total_by_sc = {
                sc: nr_by_sc.get(sc, 0.0) + h_by_sc.get(sc, 0.0) + cu_by_sc.get(sc, 0.0) + sr_by_sc.get(sc, 0.0)
                for sc in share_classes
            }

            # --- Print ---
            self.stdout.write("\n  WATERFALL PAYMENTS")
            sc_header = " ".join(f"{sc:>18}" for sc in share_classes)
            self.stdout.write(f"  {'Step':<40} {'Remaining':>18} {'To Deduct':>18} {sc_header}")
            self.stdout.write("  " + "-" * (40 + 18 + 18 + 20 * len(share_classes)))

            def print_row(label, remaining, to_deduct, by_sc):
                vals = " ".join(f"{by_sc.get(sc, 0.0):>18,.2f}" for sc in share_classes)
                self.stdout.write(f"  {label:<40} {remaining:>18,.2f} {to_deduct:>18,.2f} {vals}")

            print_row('Nominal Repayment',                         nr_remaining, nr_to_deduct, nr_by_sc)
            print_row(f'Hurdle ({hurdle_rate:.0%})',               h_remaining,  h_to_deduct,  h_by_sc)
            print_row(f'Catch-up ({catchup_rate:.0%} of Hurdle)', cu_remaining, cu_to_deduct, cu_by_sc)
            for env in cu_envelopes:
                print_row(f'  Envelope {env["num"]}', env['remaining'], env['to_deduct'], env['by_sc'])
            print_row('Special Return',                            sr_remaining, sr_to_deduct, sr_by_sc)
            for env in sr_envelopes:
                print_row(f'  Envelope {env["num"]}', env['remaining'], env['to_deduct'], env['by_sc'])

            self.stdout.write("  " + "-" * (40 + 18 + 18 + 20 * len(share_classes)))
            total_vals = " ".join(f"{total_by_sc.get(sc, 0.0):>18,.2f}" for sc in share_classes)
            self.stdout.write(f"  {'Total':<40} {'':>18} {'':>18} {total_vals}")

            return {
                'nominal_repayment': {'remaining': nr_remaining, 'to_deduct': nr_to_deduct, 'by_sc': nr_by_sc},
                'hurdle':            {'remaining': h_remaining,  'to_deduct': h_to_deduct,  'by_sc': h_by_sc},
                'catchup':           catchup,
                'special_return':    special_return,
                'total_by_sc':       total_by_sc,
            }

        waterfall_payments = construct_waterfall_payments()

        # --- NAV by share class: waterfall total per class ---
        nav_by_sc = waterfall_payments['total_by_sc']
        nav_by_lp = {
            lp_id: nav_total * (data['total'] / total_commitment)
            for lp_id, data in commitments['by_lp'].items()
        } if total_commitment else {}

        nav = {
            'total':          nav_total,
            'by_share_class': nav_by_sc,
            'by_lp':          nav_by_lp,
        }

        # --- NAV per Share Class (adjusted) ---
        # NAV per SC = Distributed for SC - waterfall total for SC
        nav_per_sc = {
            sc: distributed_by_sc.get(sc, 0.0) - nav_by_sc.get(sc, 0.0)
            for sc in share_classes
        }
        shares_by_sc = shares['by_share_class']
        shares_by_lp = shares['by_lp']
        shares_total = shares['total']
        # --- Total Value = NAV + Distributed ---
        total_value_total = nav_total + distributed_total
        total_value_by_sc = {
            sc: nav_by_sc.get(sc, 0.0) + distributed_by_sc.get(sc, 0.0)
            for sc in share_classes
        }

        total_value = {
            'total':          total_value_total,
            'by_share_class': total_value_by_sc,
        }

        # --- RVPI = NAV / Capital Called ---
        rvpi_total = (nav_total / capital_called_total) if capital_called_total else 0.0
        rvpi_by_sc = {
            sc: (nav_by_sc.get(sc, 0.0) / capital_called_by_sc.get(sc, 0.0))
            if capital_called_by_sc.get(sc, 0.0) else 0.0
            for sc in share_classes
        }

        # --- DPI = Distributed / Capital Called ---
        dpi_total = (distributed_total / capital_called_total) if capital_called_total else 0.0
        dpi_by_sc = {
            sc: (distributed_by_sc.get(sc, 0.0) / capital_called_by_sc.get(sc, 0.0))
            if capital_called_by_sc.get(sc, 0.0) else 0.0
            for sc in share_classes
        }

        # --- TVPI = RVPI + DPI ---
        tvpi_total = rvpi_total + dpi_total
        tvpi_by_sc = {
            sc: rvpi_by_sc.get(sc, 0.0) + dpi_by_sc.get(sc, 0.0)
            for sc in share_classes
        }
        # --- % Called = Capital Called / Commitment ---
        pct_called_total = (capital_called_total / total_commitment) if total_commitment else 0.0
        pct_called_by_sc = {
            sc: (capital_called_by_sc.get(sc, 0.0) / commitments['by_share_class'].get(sc, 0.0))
            if commitments['by_share_class'].get(sc, 0.0) else 0.0
            for sc in share_classes
        }
        pct_called_by_lp = {
            lp_id: (capital_called_by_lp.get(lp_id, 0.0) / commitments['by_lp'][lp_id]['total'])
            if commitments['by_lp'][lp_id]['total'] else 0.0
            for lp_id in commitments['by_lp']
        }

        # --- % Distributed = Distributed / Commitment ---
        pct_distributed_total = (distributed_total / total_commitment) if total_commitment else 0.0
        pct_distributed_by_sc = {
            sc: (distributed_by_sc.get(sc, 0.0) / commitments['by_share_class'].get(sc, 0.0))
            if commitments['by_share_class'].get(sc, 0.0) else 0.0
            for sc in share_classes
        }
        pct_distributed_by_lp = {
            lp_id: (distributed_by_lp.get(lp_id, 0.0) / commitments['by_lp'][lp_id]['total'])
            if commitments['by_lp'][lp_id]['total'] else 0.0
            for lp_id in commitments['by_lp']
        }

        # --- Print ---
        self.stdout.write(f"\n  {'KPI':<25} {'Total':>20}")
        self.stdout.write("  " + "-" * 50)
        self.stdout.write(f"  {'NAV':<25} {nav_total:>20,.2f}")
        self.stdout.write(f"  {'Total Value':<25} {total_value_total:>20,.2f}")
        self.stdout.write(f"  {'RVPI':<25} {rvpi_total:>20.4f}")
        self.stdout.write(f"  {'DPI':<25} {dpi_total:>20.4f}")
        self.stdout.write(f"  {'TVPI':<25} {tvpi_total:>20.4f}")

        self.stdout.write(f"\n  {'Share Class':<25} {'NAV':>16} {'NAV/SC':>16} {'Total Value':>16} {'RVPI':>10} {'DPI':>10} {'TVPI':>10}")
        self.stdout.write("  " + "-" * 110)
        for sc in share_classes:
            self.stdout.write(
                f"  {sc:<25} "
                f"{nav_by_sc.get(sc, 0.0):>16,.2f} "
                f"{nav_per_sc.get(sc, 0.0):>16,.2f} "
                f"{total_value_by_sc.get(sc, 0.0):>16,.2f} "
                f"{rvpi_by_sc.get(sc, 0.0):>10.4f} "
                f"{dpi_by_sc.get(sc, 0.0):>10.4f} "
                f"{tvpi_by_sc.get(sc, 0.0):>10.4f}"
            )

        self.stdout.write(f"  {'% Called':<25} {pct_called_total:>20.2%}")
        self.stdout.write(f"  {'% Distributed':<25} {pct_distributed_total:>20.2%}")

        self.stdout.write(f"\n  {'Share Class':<25} {'% Called':>16} {'% Distributed':>16}")
        self.stdout.write("  " + "-" * 60)
        for sc in share_classes:
            self.stdout.write(
                f"  {sc:<25} "
                f"{pct_called_by_sc.get(sc, 0.0):>16.2%} "
                f"{pct_distributed_by_sc.get(sc, 0.0):>16.2%}"
            )

        self.stdout.write(f"\n  {'LP':<35} {'% Called':>16} {'% Distributed':>16}")
        self.stdout.write("  " + "-" * 70)
        for lp_id, lp_data in commitments['by_lp'].items():
            self.stdout.write(
                f"  {lp_data['name']:<35} "
                f"{pct_called_by_lp.get(lp_id, 0.0):>16.2%} "
                f"{pct_distributed_by_lp.get(lp_id, 0.0):>16.2%}"
            )
        return {
            'commitment':     commitment,
            'capital_called': capital_called,
            'undrawn':        undrawn,
            'distributed':    distributed,
            'nav':            nav,
            'nav_per_sc':     nav_per_sc,
            'total_value':    total_value,
            'shares':         {'total': shares_total, 'by_share_class': shares_by_sc, 'by_lp': shares_by_lp},
            'pct_called':      {'total': pct_called_total,      'by_share_class': pct_called_by_sc,      'by_lp': pct_called_by_lp},
            'pct_distributed': {'total': pct_distributed_total, 'by_share_class': pct_distributed_by_sc, 'by_lp': pct_distributed_by_lp},
            'rvpi':           {'total': rvpi_total, 'by_share_class': rvpi_by_sc},
            'dpi':            {'total': dpi_total,  'by_share_class': dpi_by_sc},
            'tvpi':           {'total': tvpi_total, 'by_share_class': tvpi_by_sc},
            'nav_per_shares': waterfall_payments,
        }

    def handle(self, *args, **options):
        import pprint
        fund_id     = options['fund_id']
        timeframe_id = options['timeframe_id']
        self.stdout.write(self.style.SUCCESS(f"\nFUND: {fund_id}  SCENARIO: {timeframe_id}"))
        self.stdout.write("=" * 100)
        share_classes    = self.fetch_share_classes(fund_id)
        waterfall_config = self.fetch_waterfall_config(fund_id)
        
        pnl_data         = self.fetch_net_pnl(fund_id, timeframe_id, )
        cashflows = self.fetch_cash_flow_table(fund_id, timeframe_id, waterfall_config)
        commitments = self.fetch_commitments(fund_id, timeframe_id)
        shares     = self.fetch_shares(fund_id, timeframe_id)
        basic_kpis = self.compute_kpis_basic(commitments, cashflows, pnl_data, waterfall_config, shares)

        pprint.pprint(basic_kpis)
        # self.stdout.write("\n" + "=" * 100)
        # self.stdout.write(self.style.SUCCESS("WATERFALL CONFIGURATION SUMMARY"))
        # self.stdout.write("=" * 100)
        # for step_num, step in waterfall_config.items():
        #     self.stdout.write(f"\n  Step {step_num}: {step['name'].upper()}  |  Rate: {step['rate']:.2%}")
        #     if step['direct_rules']:
        #         self.stdout.write("  Direct Rules:")
        #         for cls, pct in step['direct_rules'].items():
        #             val = pct if isinstance(pct, str) else f"{pct:.2f}%"
        #             self.stdout.write(f"    - {cls}: {val}")
        #     for env in step['envelopes']:
        #         self.stdout.write(f"  Envelope {env['num']}  |  Allocation: {env['alloc']:.2%} of step")
        #         for cls, pct in env['rules'].items():
        #             val = pct if isinstance(pct, str) else f"{pct:.2f}%"
        #             self.stdout.write(f"    -> {cls}: {val}")

        # self.stdout.write("\n" + "=" * 100)
        # self.stdout.write(self.style.SUCCESS("P&L SUMMARY"))
        # self.stdout.write("=" * 100)
        # self.stdout.write(f"  As of Date : {pnl_data['date']}")
        # self.stdout.write(f"  {'Category':<12} {'Amount':>18}")
        # self.stdout.write("  " + "-" * 32)
        # for cat, val in pnl_data['categories'].items():
        #     self.stdout.write(f"  {cat:<12} {val:>18,.2f}")
        # self.stdout.write("  " + "-" * 32)
        # self.stdout.write(f"  {'Net P&L':<12} {pnl_data['net_pnl']:>18,.2f}")
        # self.stdout.write("=" * 100 + "\n")