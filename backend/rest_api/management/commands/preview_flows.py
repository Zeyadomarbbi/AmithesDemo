import pandas as pd
import numpy as np
import datetime
from django.core.management.base import BaseCommand
from django.db import connection
from rest_api.models.transactions import (
    FundWaterfallSteps,
    FundWaterfallStepRules,
    FundWaterfallEnvelopes,
    FundWaterfallEnvelopeRules,
)


class Command(BaseCommand):
    help = 'Capital Account KPIs at Fund and Share Class level'

    def add_arguments(self, parser):
        parser.add_argument('fund_id', type=int)
        parser.add_argument('timeframe_id', type=int)

    # -------------------------------------------------------------------------
    def fetch_waterfall_config(self, fund_id):
        self.stdout.write("\n[0.1] WATERFALL CONFIGURATION")
        self.stdout.write("-" * 100)

        config = {}
        steps  = FundWaterfallSteps.objects.filter(fund_id=fund_id)\
                     .select_related('step_definition')\
                     .order_by('step_definition__step_number')

        for step in steps:
            s_num  = step.step_definition.step_number
            s_rate = float(step.step_rate) / 100.0 if step.step_rate else 0.0

            self.stdout.write(f"\n  [STEP {s_num}] {step.step_name.upper()}  Rate: {s_rate:.2%}")

            d_rules_qs = FundWaterfallStepRules.objects.filter(
                fund_waterfall_step=step, is_selected=True
            ).select_related('share_class')
            d_rules = {}
            for r in d_rules_qs:
                pct_val = float(r.fixed_percentage) if r.fixed_percentage else 'Pro-Rata'
                d_rules[r.share_class.share_class_name] = pct_val
                self.stdout.write(f"    - {r.share_class.share_class_name}: {pct_val if isinstance(pct_val, str) else f'{pct_val:.2f}%'}")

            envs   = []
            env_qs = FundWaterfallEnvelopes.objects.filter(
                fund_waterfall_steps=step
            ).order_by('envelope_number')
            for e in env_qs:
                e_alloc    = float(e.allocation_percentage)
                e_rules_qs = FundWaterfallEnvelopeRules.objects.filter(
                    envelope=e, is_selected=True
                ).select_related('share_class')
                e_rules = {}
                for er in e_rules_qs:
                    pct_val = float(er.fixed_percentage) if er.fixed_percentage else 'Pro-Rata'
                    e_rules[er.share_class.share_class_name] = pct_val
                self.stdout.write(f"    [Env {e.envelope_number}] {e_alloc:.2f}%  rules: {e_rules}")
                envs.append({'num': e.envelope_number, 'alloc': e_alloc / 100.0, 'rules': e_rules})

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

    # -------------------------------------------------------------------------
    def fetch_share_classes(self, fund_id):
        self.stdout.write("\n[0.2] SHARE CLASSES")
        self.stdout.write("-" * 100)

        q = """
            SELECT share_class_id, share_class_name, nominal_value,
                   issuance_method, distribution_method
            FROM share_class
            WHERE fund_id = %s AND is_deleted = FALSE
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
                    f"  [{sc_id}] {sc_name:<30} | Nominal: {float(nominal_value) if nominal_value else 0.0:>14,.6f}"
                    f" | Issuance: {issuance_method:<25} | Distribution: {distribution_method}"
                )
        self.stdout.write(f"  > Total: {len(share_classes)}")
        return share_classes

    # -------------------------------------------------------------------------
    def fetch_net_pnl(self, fund_id, timeframe_id):
        self.stdout.write("\n[0.3] NET P&L")
        self.stdout.write("-" * 100)

        q = """
            SELECT fc.name, SUM(fe.amount * fc.sign_multiplier) AS signed_total
            FROM financial_entries fe
            JOIN financial_line_item fli ON fe.line_item_id  = fli.line_item_id
            JOIN financial_category  fc  ON fli.category_id  = fc.category_id
            JOIN timeframe           tf  ON fe.timeframe_id  = tf.timeframe_id
            WHERE fli.fund_id = %s
              AND tf.date <= (SELECT date FROM timeframe WHERE timeframe_id = %s)
              AND fli.is_deleted = FALSE
            GROUP BY fc.name, fc.sign_multiplier
            ORDER BY fc.name;
        """
        categories = {}
        with connection.cursor() as c:
            c.execute(q, [fund_id, timeframe_id])
            for category, signed_total in c.fetchall():
                categories[category] = float(signed_total) if signed_total else 0.0

        with connection.cursor() as c:
            c.execute("SELECT date FROM timeframe WHERE timeframe_id = %s", [timeframe_id])
            row     = c.fetchone()
            tf_date = str(row[0]) if row else None

        net_pnl = sum(categories.values())

        self.stdout.write(f"  As of: {tf_date}")
        for cat, val in categories.items():
            self.stdout.write(f"  {cat:<12}: {val:>18,.2f}")
        self.stdout.write(f"  {'Net P&L':<12}: {net_pnl:>18,.2f}")

        return {'date': tf_date, 'categories': categories, 'net_pnl': net_pnl}

    # -------------------------------------------------------------------------
    def fetch_commitments(self, fund_id, timeframe_id):
        self.stdout.write("\n[0.4] COMMITMENTS")
        self.stdout.write("-" * 100)

        q = """
            SELECT sc.share_class_name, SUM(c.commitment_amount) AS total_commitment
            FROM lps_fund_commitments c
            JOIN share_class       sc ON c.share_class_id            = sc.share_class_id
            JOIN lps_fund_closings fc ON c.lps_fund_closing_period_id = fc.lps_fund_closing_period_id
            WHERE c.fund_id    = %s
              AND c.is_deleted = FALSE
              AND fc.date <= (SELECT date FROM timeframe WHERE timeframe_id = %s)
            GROUP BY sc.share_class_name
            ORDER BY sc.share_class_name;
        """
        by_share_class = {}
        with connection.cursor() as c:
            c.execute(q, [fund_id, timeframe_id])
            for sc_name, amount in c.fetchall():
                by_share_class[sc_name] = float(amount) if amount else 0.0

        grand_total = sum(by_share_class.values())

        self.stdout.write(f"  {'Share Class':<30} {'Commitment':>18}")
        self.stdout.write("  " + "-" * 50)
        for sc_name, amt in by_share_class.items():
            self.stdout.write(f"  {sc_name:<30} {amt:>18,.2f}")
        self.stdout.write("  " + "-" * 50)
        self.stdout.write(f"  {'TOTAL':<30} {grand_total:>18,.2f}")

        return {'by_share_class': by_share_class, 'total': grand_total}

    # -------------------------------------------------------------------------
    def fetch_shares(self, fund_id, timeframe_id):
        self.stdout.write("\n[0.5] SHARES ISSUED")
        self.stdout.write("-" * 100)

        q = """
            SELECT sc.share_class_name, SUM(al.shares_issued) AS total_shares
            FROM lps_operation_lp_allocations al
            JOIN share_class           sc ON al.share_class_id       = sc.share_class_id
            JOIN lps_operation_details od ON al.lps_operation_details_id = od.lps_operation_details_id
            WHERE od.fund_id   = %s
              AND od.due_date <= (SELECT date FROM timeframe WHERE timeframe_id = %s)
            GROUP BY sc.share_class_name
            ORDER BY sc.share_class_name;
        """
        by_share_class = {}
        with connection.cursor() as c:
            c.execute(q, [fund_id, timeframe_id])
            for sc_name, total_shares in c.fetchall():
                by_share_class[sc_name] = float(total_shares) if total_shares else 0.0

        total = sum(by_share_class.values())

        self.stdout.write(f"  {'Share Class':<30} {'Shares':>18}")
        self.stdout.write("  " + "-" * 50)
        for sc_name, shares in by_share_class.items():
            self.stdout.write(f"  {sc_name:<30} {shares:>18,.6f}")
        self.stdout.write("  " + "-" * 50)
        self.stdout.write(f"  {'TOTAL':<30} {total:>18,.6f}")

        return {'by_share_class': by_share_class, 'total': total}

    # -------------------------------------------------------------------------
    def fetch_cash_flow_table(self, fund_id, timeframe_id, waterfall_config):
        self.stdout.write("\n[0.6] CASH FLOW TABLE")
        self.stdout.write("-" * 100)

        q = """
            SELECT
                od.lps_operation_details_id,
                od.due_date,
                od.name                          AS op_name,
                ot.name                          AS op_type,
                ot.sign_multiplier,
                od.total_operation_amount,
                sc.share_class_name,
                SUM(al.capital_call)             AS called_amount,
                SUM(al.commitment_amount)        AS commitment_amount
            FROM lps_operation_details od
            JOIN lps_operation_type           ot ON od.operation_type_id          = ot.operation_type_id
            JOIN lps_operation_lp_allocations al ON al.lps_operation_details_id   = od.lps_operation_details_id
            JOIN share_class                  sc ON al.share_class_id              = sc.share_class_id
            WHERE od.fund_id = %s
              AND od.due_date <= (SELECT date FROM timeframe WHERE timeframe_id = %s)
            GROUP BY od.lps_operation_details_id, od.due_date, od.name,
                     ot.name, ot.sign_multiplier, od.total_operation_amount, sc.share_class_name
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
                        'date': str(due_date), 'op_name': op_name, 'op_type': op_type,
                        'flows': flows, 'commitment_total': 0.0,
                        'commitment_by_sc': {}, 'called_by_sc': {}, 'interest_by_sc': {},
                    }
                    op_order.append(op_id)

                ops[op_id]['called_by_sc'][sc_name]     = ops[op_id]['called_by_sc'].get(sc_name, 0.0)     + called
                ops[op_id]['commitment_by_sc'][sc_name] = ops[op_id]['commitment_by_sc'].get(sc_name, 0.0) + commit
                ops[op_id]['commitment_total']          += commit
                if sc_name not in share_class_set:
                    share_class_set.append(sc_name)

        share_class_set.sort()
        rows = [ops[op_id] for op_id in op_order]

        # Aggregation row
        if rows:
            latest_year    = max(int(r['date'][:4]) for r in rows)
            agg_date       = f"{latest_year}-12-31"
            existing_dates = [r['date'] for r in rows]

            if agg_date in existing_dates:
                merged_flows = merged_commit_total = 0.0
                merged_called = {}; merged_commit = {}; remaining_rows = []
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
                    'date': agg_date, 'flows': merged_flows,
                    'commitment_total': merged_commit_total,
                    'commitment_by_sc': merged_commit,
                    'called_by_sc': merged_called, 'interest_by_sc': {},
                }
            else:
                last_row  = rows[-1]
                agg_flows = sum(r['flows'] for r in rows)
                agg_called = {}
                for r in rows:
                    for sc, v in r['called_by_sc'].items():
                        agg_called[sc] = agg_called.get(sc, 0.0) + v
                aggregation = {
                    'date': agg_date, 'flows': agg_flows,
                    'commitment_total': last_row['commitment_total'],
                    'commitment_by_sc': last_row['commitment_by_sc'].copy(),
                    'called_by_sc': agg_called, 'interest_by_sc': {},
                }
        else:
            aggregation = None

        # Interest computation
        step2            = waterfall_config.get(2, {})
        hurdle_rate      = step2.get('rate', 0.0)
        eligible_classes = {sc for sc, rule in step2.get('direct_rules', {}).items() if rule == 'Pro-Rata'}

        if eligible_classes and aggregation:
            agg_date_obj    = datetime.datetime.strptime(aggregation['date'], "%Y-%m-%d").date()
            total_interests = {}
            for row in rows:
                row_date = datetime.datetime.strptime(row['date'], "%Y-%m-%d").date()
                days     = (agg_date_obj - row_date).days
                for sc in share_class_set:
                    if sc not in eligible_classes:
                        row['interest_by_sc'][sc] = 0.0
                        continue
                    called = row['called_by_sc'].get(sc, 0.0)
                    interest = round(called * ((1 + hurdle_rate) ** (days / 365) - 1), 2) if called and days > 0 else 0.0
                    row['interest_by_sc'][sc]  = interest
                    total_interests[sc]        = total_interests.get(sc, 0.0) + interest
            aggregation['interest_by_sc'] = total_interests
        else:
            for row in rows:
                row['interest_by_sc'] = {sc: 0.0 for sc in share_class_set}
            if aggregation:
                aggregation['interest_by_sc'] = {}

        # Print
        called_cols   = [f"Called {sc}"   for sc in share_class_set]
        interest_cols = [f"Interest {sc}" for sc in share_class_set]
        header = (
            f"  {'Date':<14} {'Operation':<28} {'Type':<28} {'Flows':>16} "
            + " ".join(f"{c:>20}" for c in called_cols) + " "
            + " ".join(f"{c:>22}" for c in interest_cols)
        )
        self.stdout.write(header)
        self.stdout.write("  " + "-" * 180)
        for row in rows:
            called_vals   = " ".join(f"{row['called_by_sc'].get(sc, 0.0):>20,.2f}"   for sc in share_class_set)
            interest_vals = " ".join(f"{row['interest_by_sc'].get(sc, 0.0):>22,.2f}" for sc in share_class_set)
            self.stdout.write(
                f"  {row['date']:<14} {row['op_name']:<28} {row['op_type']:<28} "
                f"{row['flows']:>16,.2f} {called_vals} {interest_vals}"
            )
        if aggregation:
            self.stdout.write("  " + "=" * 180)
            called_vals   = " ".join(f"{aggregation['called_by_sc'].get(sc, 0.0):>20,.2f}"   for sc in share_class_set)
            interest_vals = " ".join(f"{aggregation['interest_by_sc'].get(sc, 0.0):>22,.2f}" for sc in share_class_set)
            self.stdout.write(
                f"  {aggregation['date']:<14} {'TOTAL':<28} {'':<28} "
                f"{aggregation['flows']:>16,.2f} {called_vals} {interest_vals}"
            )
        self.stdout.write("=" * 100)

        return {'share_classes': share_class_set, 'rows': rows, 'aggregation': aggregation}

    # -------------------------------------------------------------------------
    def compute_kpis_basic(self, commitments, cash_flow_table, pnl_data, waterfall_config, shares):
        self.stdout.write("\n[1] BASIC KPIs")
        self.stdout.write("-" * 100)

        total_commitment = commitments['total']
        share_classes    = cash_flow_table['share_classes']

        # Commitment
        commitment_by_sc = commitments['by_share_class'].copy()

        # Capital Called
        capital_called_total = sum(
            abs(row['flows']) for row in cash_flow_table['rows']
            if row['op_type'] in ('Capital Call', 'Capital Call / Equalization', 'Equalization')
        )
        capital_called_by_sc = {
            sc: capital_called_total * (commitment_by_sc.get(sc, 0.0) / total_commitment)
            for sc in share_classes
        } if total_commitment else {sc: 0.0 for sc in share_classes}

        # Undrawn
        undrawn_total    = total_commitment - capital_called_total
        undrawn_by_sc    = {
            sc: commitment_by_sc.get(sc, 0.0) - capital_called_by_sc.get(sc, 0.0)
            for sc in share_classes
        }

        # Distributed
        distributed_total = sum(
            abs(row['flows']) for row in cash_flow_table['rows']
            if row['op_type'] == 'Distribution'
        )
        distributed_by_sc = {
            sc: distributed_total * (commitment_by_sc.get(sc, 0.0) / total_commitment)
            for sc in share_classes
        } if total_commitment else {sc: 0.0 for sc in share_classes}

        # NAV (fund level)
        nav_total = capital_called_total - distributed_total + pnl_data['net_pnl']

        # ----- Waterfall -----
        def construct_waterfall_payments():
            # Step 1: Nominal Repayment
            nr_rules     = waterfall_config.get(1, {}).get('direct_rules', {})
            nr_remaining = nav_total + distributed_total
            nr_to_deduct = min(nr_remaining, capital_called_total)
            nr_by_sc     = {
                sc: nr_to_deduct * (commitment_by_sc.get(sc, 0.0) / total_commitment)
                if nr_rules.get(sc) == 'Pro-Rata' and total_commitment else 0.0
                for sc in share_classes
            }

            # Step 2: Hurdle
            step2       = waterfall_config.get(2, {})
            h_rules     = step2.get('direct_rules', {})
            hurdle_rate = step2.get('rate', 0.0)
            h_remaining = max(0.0, nr_remaining - nr_to_deduct)
            agg         = cash_flow_table.get('aggregation') or {}
            interest_map = agg.get('interest_by_sc', {})
            eligible_interest_total = sum(v for sc, v in interest_map.items() if h_rules.get(sc) == 'Pro-Rata')
            h_to_deduct = min(eligible_interest_total, h_remaining)
            h_by_sc     = {
                sc: h_to_deduct * (commitment_by_sc.get(sc, 0.0) / total_commitment)
                if h_rules.get(sc) == 'Pro-Rata' and total_commitment else 0.0
                for sc in share_classes
            }

            # Step 3: Catch-up
            step3        = waterfall_config.get(3, {})
            catchup_rate = step3.get('rate', 0.0)
            cu_remaining = max(0.0, h_remaining - h_to_deduct)
            cu_to_deduct = min(cu_remaining, catchup_rate * h_to_deduct)
            cu_by_sc     = {sc: 0.0 for sc in share_classes}
            cu_envelopes = []
            for env in step3.get('envelopes', []):
                if env['alloc'] == 0.0:
                    cu_envelopes.append({'num': env['num'], 'remaining': 0.0, 'to_deduct': 0.0, 'by_sc': {sc: 0.0 for sc in share_classes}})
                    continue
                env_to_deduct = cu_to_deduct * env['alloc']
                env_by_sc     = {}
                for sc in share_classes:
                    rule = env['rules'].get(sc)
                    if rule == 'Pro-Rata':
                        env_by_sc[sc] = env_to_deduct * (commitment_by_sc.get(sc, 0.0) / total_commitment) if total_commitment else 0.0
                    elif isinstance(rule, float):
                        env_by_sc[sc] = env_to_deduct * (rule / 100.0)
                    else:
                        env_by_sc[sc] = 0.0
                    cu_by_sc[sc] += env_by_sc[sc]
                cu_envelopes.append({'num': env['num'], 'remaining': env_to_deduct, 'to_deduct': env_to_deduct, 'by_sc': env_by_sc})

            # Step 4: Special Return
            sr_remaining = max(0.0, cu_remaining - cu_to_deduct)
            sr_to_deduct = sr_remaining
            sr_by_sc     = {sc: 0.0 for sc in share_classes}
            sr_envelopes = []
            for env in waterfall_config.get(4, {}).get('envelopes', []):
                if env['alloc'] == 0.0:
                    sr_envelopes.append({'num': env['num'], 'remaining': 0.0, 'to_deduct': 0.0, 'by_sc': {sc: 0.0 for sc in share_classes}})
                    continue
                env_to_deduct = sr_to_deduct * env['alloc']
                env_by_sc     = {}
                for sc in share_classes:
                    rule = env['rules'].get(sc)
                    env_by_sc[sc] = env_to_deduct if rule == 'Pro-Rata' else 0.0
                    sr_by_sc[sc] += env_by_sc[sc]
                sr_envelopes.append({'num': env['num'], 'remaining': env_to_deduct, 'to_deduct': env_to_deduct, 'by_sc': env_by_sc})

            total_by_sc = {
                sc: nr_by_sc.get(sc, 0.0) + h_by_sc.get(sc, 0.0) + cu_by_sc.get(sc, 0.0) + sr_by_sc.get(sc, 0.0)
                for sc in share_classes
            }

            # Print waterfall
            self.stdout.write("\n  WATERFALL PAYMENTS")
            sc_hdr = " ".join(f"{sc:>18}" for sc in share_classes)
            self.stdout.write(f"  {'Step':<40} {'Remaining':>18} {'To Deduct':>18} {sc_hdr}")
            self.stdout.write("  " + "-" * (76 + 20 * len(share_classes)))

            def pr(label, remaining, to_deduct, by_sc):
                vals = " ".join(f"{by_sc.get(sc, 0.0):>18,.2f}" for sc in share_classes)
                self.stdout.write(f"  {label:<40} {remaining:>18,.2f} {to_deduct:>18,.2f} {vals}")

            pr('Nominal Repayment',                         nr_remaining, nr_to_deduct, nr_by_sc)
            pr(f'Hurdle ({hurdle_rate:.0%})',               h_remaining,  h_to_deduct,  h_by_sc)
            pr(f'Catch-up ({catchup_rate:.0%} of Hurdle)', cu_remaining, cu_to_deduct, cu_by_sc)
            for env in cu_envelopes:
                pr(f'  Envelope {env["num"]}', env['remaining'], env['to_deduct'], env['by_sc'])
            pr('Special Return',                            sr_remaining, sr_to_deduct, sr_by_sc)
            for env in sr_envelopes:
                pr(f'  Envelope {env["num"]}', env['remaining'], env['to_deduct'], env['by_sc'])

            self.stdout.write("  " + "-" * (76 + 20 * len(share_classes)))
            total_vals = " ".join(f"{total_by_sc.get(sc, 0.0):>18,.2f}" for sc in share_classes)
            self.stdout.write(f"  {'Total':<40} {'':>18} {'':>18} {total_vals}")

            return {
                'nominal_repayment': {'remaining': nr_remaining, 'to_deduct': nr_to_deduct, 'by_sc': nr_by_sc},
                'hurdle':            {'remaining': h_remaining,  'to_deduct': h_to_deduct,  'by_sc': h_by_sc},
                'catchup':           {'remaining': cu_remaining, 'to_deduct': cu_to_deduct, 'by_sc': cu_by_sc, 'envelopes': cu_envelopes},
                'special_return':    {'remaining': sr_remaining, 'to_deduct': sr_to_deduct, 'by_sc': sr_by_sc, 'envelopes': sr_envelopes},
                'total_by_sc':       total_by_sc,
            }

        waterfall_payments = construct_waterfall_payments()

        # NAV by SC from waterfall
        nav_by_sc = waterfall_payments['total_by_sc']

        # Shares
        shares_by_sc = shares['by_share_class']
        shares_total = shares['total']

        # Total Value
        total_value_total = nav_total + distributed_total
        total_value_by_sc = {sc: nav_by_sc.get(sc, 0.0) + distributed_by_sc.get(sc, 0.0) for sc in share_classes}

        # RVPI, DPI, TVPI
        rvpi_total = (nav_total / capital_called_total)       if capital_called_total else 0.0
        dpi_total  = (distributed_total / capital_called_total) if capital_called_total else 0.0
        tvpi_total = rvpi_total + dpi_total

        rvpi_by_sc = {sc: (nav_by_sc.get(sc, 0.0) / capital_called_by_sc.get(sc, 0.0)) if capital_called_by_sc.get(sc) else 0.0 for sc in share_classes}
        dpi_by_sc  = {sc: (distributed_by_sc.get(sc, 0.0) / capital_called_by_sc.get(sc, 0.0)) if capital_called_by_sc.get(sc) else 0.0 for sc in share_classes}
        tvpi_by_sc = {sc: rvpi_by_sc.get(sc, 0.0) + dpi_by_sc.get(sc, 0.0) for sc in share_classes}

        # % Called, % Distributed
        pct_called_total      = (capital_called_total / total_commitment)  if total_commitment else 0.0
        pct_distributed_total = (distributed_total    / total_commitment)  if total_commitment else 0.0
        pct_called_by_sc      = {sc: (capital_called_by_sc.get(sc, 0.0) / commitment_by_sc.get(sc, 0.0))  if commitment_by_sc.get(sc) else 0.0 for sc in share_classes}
        pct_distributed_by_sc = {sc: (distributed_by_sc.get(sc, 0.0)    / commitment_by_sc.get(sc, 0.0))  if commitment_by_sc.get(sc) else 0.0 for sc in share_classes}

        # NAV per Share
        nav_per_share_by_sc = {sc: (nav_by_sc.get(sc, 0.0) / shares_by_sc.get(sc, 0.0)) if shares_by_sc.get(sc) else 0.0 for sc in share_classes}
        nav_per_share_total = (nav_total / shares_total) if shares_total else 0.0

        # Print summary
        self.stdout.write(f"\n  {'KPI':<25} {'Fund Total':>20}")
        self.stdout.write("  " + "-" * 50)
        for label, val, fmt in [
            ('Commitment',    total_commitment,    ',.2f'),
            ('Capital Called', capital_called_total,',.2f'),
            ('Undrawn',        undrawn_total,       ',.2f'),
            ('Distributed',    distributed_total,   ',.2f'),
            ('NAV',            nav_total,           ',.2f'),
            ('Total Value',    total_value_total,   ',.2f'),
            ('RVPI',           rvpi_total,          '.4f'),
            ('DPI',            dpi_total,           '.4f'),
            ('TVPI',           tvpi_total,          '.4f'),
            ('% Called',       pct_called_total,    '.2%'),
            ('% Distributed',  pct_distributed_total,'.2%'),
            ('Shares',         shares_total,        ',.6f'),
            ('NAV per Share',  nav_per_share_total, ',.6f'),
        ]:
            self.stdout.write(f"  {label:<25} {val:>20{fmt}}")

        self.stdout.write(f"\n  {'Share Class':<20} {'Commit':>14} {'Called':>14} {'Undrawn':>14} "
                          f"{'Distrib':>14} {'NAV':>14} {'TV':>14} "
                          f"{'RVPI':>8} {'DPI':>8} {'TVPI':>8} "
                          f"{'%Called':>9} {'%Dist':>9} {'Shares':>14} {'NAV/Shr':>14}")
        self.stdout.write("  " + "-" * 190)
        for sc in share_classes:
            self.stdout.write(
                f"  {sc:<20} "
                f"{commitment_by_sc.get(sc, 0.0):>14,.2f} "
                f"{capital_called_by_sc.get(sc, 0.0):>14,.2f} "
                f"{undrawn_by_sc.get(sc, 0.0):>14,.2f} "
                f"{distributed_by_sc.get(sc, 0.0):>14,.2f} "
                f"{nav_by_sc.get(sc, 0.0):>14,.2f} "
                f"{total_value_by_sc.get(sc, 0.0):>14,.2f} "
                f"{rvpi_by_sc.get(sc, 0.0):>8.4f} "
                f"{dpi_by_sc.get(sc, 0.0):>8.4f} "
                f"{tvpi_by_sc.get(sc, 0.0):>8.4f} "
                f"{pct_called_by_sc.get(sc, 0.0):>9.2%} "
                f"{pct_distributed_by_sc.get(sc, 0.0):>9.2%} "
                f"{shares_by_sc.get(sc, 0.0):>14,.6f} "
                f"{nav_per_share_by_sc.get(sc, 0.0):>14,.6f}"
            )
        self.stdout.write("=" * 100)

        return {
            'commitment':      {'total': total_commitment,      'by_share_class': commitment_by_sc},
            'capital_called':  {'total': capital_called_total,  'by_share_class': capital_called_by_sc},
            'undrawn':         {'total': undrawn_total,         'by_share_class': undrawn_by_sc},
            'distributed':     {'total': distributed_total,     'by_share_class': distributed_by_sc},
            'nav':             {'total': nav_total,             'by_share_class': nav_by_sc},
            'total_value':     {'total': total_value_total,     'by_share_class': total_value_by_sc},
            'rvpi':            {'total': rvpi_total,            'by_share_class': rvpi_by_sc},
            'dpi':             {'total': dpi_total,             'by_share_class': dpi_by_sc},
            'tvpi':            {'total': tvpi_total,            'by_share_class': tvpi_by_sc},
            'pct_called':      {'total': pct_called_total,      'by_share_class': pct_called_by_sc},
            'pct_distributed': {'total': pct_distributed_total, 'by_share_class': pct_distributed_by_sc},
            'shares':          {'total': shares_total,          'by_share_class': shares_by_sc},
            'nav_per_share':   {'total': nav_per_share_total,   'by_share_class': nav_per_share_by_sc},
            'waterfall_payments': waterfall_payments,
        }

    # -------------------------------------------------------------------------
    def handle(self, *args, **options):
        fund_id      = options['fund_id']
        timeframe_id = options['timeframe_id']
        self.stdout.write(self.style.SUCCESS(f"\nFUND: {fund_id}  TIMEFRAME: {timeframe_id}"))
        self.stdout.write("=" * 100)

        waterfall_config = self.fetch_waterfall_config(fund_id)
        share_classes    = self.fetch_share_classes(fund_id)
        pnl_data         = self.fetch_net_pnl(fund_id, timeframe_id)
        commitments      = self.fetch_commitments(fund_id, timeframe_id)
        shares           = self.fetch_shares(fund_id, timeframe_id)
        cash_flow_table  = self.fetch_cash_flow_table(fund_id, timeframe_id, waterfall_config)
        basic_kpis       = self.compute_kpis_basic(commitments, cash_flow_table, pnl_data, waterfall_config, shares)