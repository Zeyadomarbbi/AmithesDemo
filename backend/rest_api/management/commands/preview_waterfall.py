import pandas as pd
import numpy as np
from django.core.management.base import BaseCommand
from django.db import connection

# IMPORTS
from rest_api.models.views import (
    ScenarioFundflowsCapitalcallSummary, 
    ScenarioFundflowsDistributionSummary
)
from rest_api.models.transactions import (
    FundWaterfallSteps,
    FundWaterfallStepRules,
    FundWaterfallEnvelopes,
    FundWaterfallEnvelopeRules
)

class Command(BaseCommand):
    help = 'Previews Cash Flows with Flexible Share Classes and Dynamic Waterfall'

    def add_arguments(self, parser):
        parser.add_argument('fund_id', type=int)
        parser.add_argument('scenario_id', type=int)

    def fetch_commitments_and_ratios(self, fund_id, scenario_id):
        """[0] PROJECTED CONFIG (Ratios) — returns (ratios dict, share_class_names list)."""
        self.stdout.write("\n[0] PROJECTED CONFIG (Ratios)")
        self.stdout.write("-" * 100)

        query_commit = """
            SELECT 
                sc.share_class_name,
                c.total_commitment
            FROM scenario_lps_sc_man_fee_tranches_config c
            JOIN share_class sc ON c.share_class_id = sc.share_class_id
            WHERE c.fund_id = %s AND c.scenario_id = %s
            ORDER BY c.share_class_id;
        """

        ratios = {}
        share_class_names = []

        with connection.cursor() as cursor:
            cursor.execute(query_commit, [fund_id, scenario_id])
            rows = cursor.fetchall()

            if rows:
                total_fund_commitment = sum(float(row[1]) for row in rows)
                for row in rows:
                    name = row[0]
                    amount = float(row[1])
                    ratio = amount / total_fund_commitment if total_fund_commitment > 0 else 0
                    ratios[name] = ratio
                    share_class_names.append(name)
                    print(f" > {name:<20}: {ratio:.4%} (Projected Basis)")
            else:
                self.stdout.write(self.style.WARNING("No commitment data found. Projected ratios defaulting to 0."))

        return ratios, share_class_names

    def fetch_realized_and_config(self, fund_id):
        """[0.5] REALIZED & WATERFALL STEPS — returns (realized dict, waterfall_config dict).

        realized: { 'YYYY-MM-DD': { 'Share Class Name': capital_call_amount } }
            Actual historical LP capital call amounts per date and share class.
            Used downstream to look up real per-class splits on realized rows
            instead of applying projected commitment ratios.

        waterfall_config: { step_number: { 'name', 'rate', 'direct_rules', 'envelopes', 'classes' } }
        """
        self.stdout.write("\n[0.5] WATERFALL CONFIGURATION & ENVELOPES")
        self.stdout.write("-" * 100)

        # A. Realized
        realized = {}
        q_real = """
            SELECT d.due_date, sc.share_class_name, SUM(a.capital_call)
            FROM lps_operation_lp_allocations a
            JOIN lps_operation_details d ON a.lps_operation_details_id = d.lps_operation_details_id
            JOIN share_class sc ON a.share_class_id = sc.share_class_id
            WHERE d.fund_id = %s GROUP BY d.due_date, sc.share_class_name;
        """
        with connection.cursor() as c:
            c.execute(q_real, [fund_id])
            for r in c.fetchall():
                dt = str(r[0])
                if dt not in realized: realized[dt] = {}
                realized[dt][r[1]] = float(r[2]) if r[2] else 0.0

        # B. Config
        config = {}
        steps = FundWaterfallSteps.objects.filter(fund_id=fund_id).select_related('step_definition').order_by('step_definition__step_number')

        for step in steps:
            s_num = step.step_definition.step_number
            s_rate = float(step.step_rate) / 100.0 if step.step_rate else 0.0

            print(f"\n[STEP {s_num}] {step.step_name.upper()} (Rate: {s_rate:.2%})")

            # Direct Rules
            d_rules_qs = FundWaterfallStepRules.objects.filter(fund_waterfall_step=step, is_selected=True).select_related('share_class')
            d_rules = {}
            if d_rules_qs.exists():
                print("  > Direct Rules:")
                for r in d_rules_qs:
                    pct_val = float(r.fixed_percentage) if r.fixed_percentage else 'Pro-Rata'
                    d_rules[r.share_class.share_class_name] = pct_val
                    print(f"    - {r.share_class.share_class_name}: {pct_val if isinstance(pct_val, str) else f'{pct_val:.2f}%'}")

            # Envelopes
            envs = []
            env_qs = FundWaterfallEnvelopes.objects.filter(fund_waterfall_steps=step).order_by('envelope_number')
            if env_qs.exists():
                print("  > Envelopes:")
                for e in env_qs:
                    e_alloc = float(e.allocation_percentage)
                    print(f"    [Env {e.envelope_number}] Allocation: {e_alloc:.2f}% of Step")

                    e_rules_qs = FundWaterfallEnvelopeRules.objects.filter(envelope=e, is_selected=True).select_related('share_class')
                    e_rules = {}
                    if e_rules_qs.exists():
                        for er in e_rules_qs:
                            pct_val = float(er.fixed_percentage) if er.fixed_percentage else 'Pro-Rata'
                            e_rules[er.share_class.share_class_name] = pct_val
                            print(f"      -> {er.share_class.share_class_name}: {pct_val if isinstance(pct_val, str) else f'{pct_val:.2f}%'}")
                    else:
                        print("      -> No rules configured")
                    envs.append({'num': e.envelope_number, 'alloc': e_alloc / 100.0, 'rules': e_rules})

            # Determine Active Classes
            classes = list(d_rules.keys())
            for e in envs: classes.extend(e['rules'].keys())
            classes = list(set(classes))

            config[s_num] = {
                'name': step.step_name,
                'rate': s_rate,
                'direct_rules': d_rules,
                'envelopes': envs,
                'classes': classes
            }

        return realized, config

    def handle(self, *args, **options):
        fund_id = options['fund_id']
        scenario_id = options['scenario_id']

        self.stdout.write(self.style.SUCCESS(f"\nFETCHING DATA FOR FUND: {fund_id}, SCENARIO: {scenario_id}"))
        self.stdout.write("="*100)

        # ==============================================================================
        # 0. FETCH COMMITMENTS & CALCULATE RATIOS
        # ==============================================================================
        ratios, share_class_names = self.fetch_commitments_and_ratios(fund_id, scenario_id)

        # ==============================================================================
        # 0.5. FETCH REALIZED SPLITS & WATERFALL STEPS
        # ==============================================================================
        realized_lookup, waterfall_config = self.fetch_realized_and_config(fund_id)

        # Hurdle Configuration (Step 2)
        hurdle_rate = waterfall_config.get(2, {}).get('rate', 0.08)
        hurdle_participating_classes = waterfall_config.get(2, {}).get('classes', share_class_names)
        if not hurdle_participating_classes:
            hurdle_participating_classes = share_class_names

        # ==============================================================================
        # 1. GENERATE CASH FLOW SKELETON
        # ==============================================================================
        self.stdout.write("\n[1] MERGING DATA & CALCULATING SPLITS")
        self.stdout.write("-" * 100)

        calls_qs = ScenarioFundflowsCapitalcallSummary.objects.filter(fund_id=fund_id, scenario_id=scenario_id).exclude(source_type='projected_placeholder', is_user_inserted=False).values('date', 'flows', 'source_type')
        dist_qs = ScenarioFundflowsDistributionSummary.objects.filter(fund_id=fund_id, scenario_id=scenario_id).exclude(source_type='projected_placeholder').values('date', 'flows', 'source_type')

        data = []
        for row in calls_qs:
            data.append({'date': row['date'], 'flow_amount': float(row['flows']), 'type': 'capital_call', 'source_type': row['source_type'], 'operation_name': f"Call ({row['source_type']})"})
        for row in dist_qs:
            data.append({'date': row['date'], 'flow_amount': -float(row['flows']), 'type': 'distribution', 'source_type': row['source_type'], 'operation_name': f"Dist ({row['source_type']})"})

        if not data:
            self.stdout.write(self.style.WARNING("No operations found."))
            return

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values(by=['date']).reset_index(drop=True)

        # ---------------------------------------------------------
        # APPLY DYNAMIC SPLIT LOGIC
        # ---------------------------------------------------------
        for sc_name in share_class_names:

            def get_val(row, target_class=sc_name):
                if 'realized' in row['source_type'].lower():
                    date_str = row['date'].strftime('%Y-%m-%d')
                    day_data = realized_lookup.get(date_str, {})
                    val = 0.0
                    for key, amount in day_data.items():
                        if target_class.lower() in key.lower():
                            val = amount
                            break
                    if row['type'] == 'distribution': return -abs(val)
                    return abs(val)
                else:
                    ratio = 0.0
                    for key, r in ratios.items():
                        if target_class.lower() in key.lower():
                            ratio = r
                            break
                    return row['flow_amount'] * ratio

            df[f'Flows {sc_name}'] = df.apply(get_val, axis=1)

        # Cumulative Calculations
        df['cumulated_flows'] = df['flow_amount'].cumsum()
        df['cumulated_capital_call'] = df.apply(lambda x: x['flow_amount'] if x['type'] == 'capital_call' else 0, axis=1).cumsum()
        df['cumulated_distribution'] = df.apply(lambda x: abs(x['flow_amount']) if x['type'] == 'distribution' else 0, axis=1).cumsum()

        # ==============================================================================
        # 2. CALCULATE INTEREST & BALANCES (W, U, X) & NOMINAL REPAYMENT
        # ==============================================================================

        u_list = []
        w_list = []
        x_list = []
        nr_list = []

        w_balance = 0.0
        sum_u = 0.0
        sum_x = 0.0
        unreturned_capital_balance = 0.0

        prev_date = df['date'].iloc[0]

        for index, row in df.iterrows():
            current_date = row['date']
            flow_val = row['flow_amount']

            # --- A. Time Factor ---
            days_diff = (current_date - prev_date).days
            year = current_date.year
            is_leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)
            divisor = 366.0 if is_leap else 365.0
            time_factor = days_diff / divisor

            # --- B. Periodic Interest (U) ---
            u_interest = w_balance * ((1 + hurdle_rate) ** time_factor - 1)
            sum_u += u_interest

            # --- C. Cumul Flows w/ Interest (W) ---
            relevant_flow = 0.0
            for sc in hurdle_participating_classes:
                col_name = f'Flows {sc}'
                if col_name in df.columns:
                    relevant_flow += row[col_name]

            w_new = w_balance + u_interest + relevant_flow

            # --- D. Total Interests (X) ---
            x_total_interest = 0.0
            if sum_x > 0.0001:
                x_total_interest = 0.0
            elif w_new < -0.01:
                x_total_interest = sum_u
            else:
                x_total_interest = 0.0
            sum_x += x_total_interest

            # --- E. Nominal Repayment ---
            nominal_repayment = 0.0
            if flow_val > 0:
                unreturned_capital_balance += flow_val
                nominal_repayment = 0.0
            elif flow_val < 0:
                dist_amount = abs(flow_val)
                repayment = min(dist_amount, unreturned_capital_balance)
                nominal_repayment = -repayment
                unreturned_capital_balance -= repayment

            u_list.append(u_interest)
            w_list.append(w_new)
            x_list.append(x_total_interest)
            nr_list.append(nominal_repayment)

            w_balance = w_new
            prev_date = current_date

        df['Interests'] = u_list
        df['Cumul flows w/ Int'] = w_list
        df['Total Interests'] = x_list
        df['Nominal Repayment'] = nr_list

        # ==============================================================================
        # 3. CALCULATE HURDLE, CATCH-UP & SPECIAL RETURN
        # ==============================================================================
        hurdle_list = []
        sum_hurdle = 0.0
        total_total_interests = sum(x_list)

        for index, row in df.iterrows():
            current_x = x_list[index]
            current_nominal_repayment = nr_list[index]
            current_flow = row['flow_amount']

            cumul_nominal_repayment = sum(nr_list[:index+1])
            cumul_capital_call = row['cumulated_capital_call']
            cumul_distribution = row['cumulated_distribution']

            if current_x > 0:
                hurdle = -(current_x + sum_hurdle)
            elif abs(cumul_nominal_repayment) >= cumul_capital_call - 0.01:
                if abs(total_total_interests + sum_hurdle) < 0.01:
                    hurdle = 0.0
                else:
                    arg1 = -(cumul_distribution - cumul_capital_call)
                    arg2 = current_flow - current_nominal_repayment
                    hurdle = max(arg1, arg2)
            else:
                hurdle = 0.0

            hurdle_list.append(hurdle)
            sum_hurdle += hurdle

        df['Hurdle'] = hurdle_list
        catchup_rate = waterfall_config.get(3, {}).get('rate', 0.25)

        catchup_list = []
        for index, row in df.iterrows():
            cumul_hurdle = sum(hurdle_list[:index+1])
            cumul_total_interests = sum(x_list[:index+1])
            current_total_interests = x_list[index]

            if abs(cumul_hurdle + cumul_total_interests) < 0.01:
                catchup = -catchup_rate * current_total_interests
            else:
                catchup = 0.0
            catchup_list.append(catchup)

        df['Catch-up'] = catchup_list

        special_return_list = []
        for index, row in df.iterrows():
            cumul_catchup = sum(catchup_list[:index+1])
            current_flow = row['flow_amount']
            current_nr = nr_list[index]
            current_h = hurdle_list[index]
            current_c = catchup_list[index]

            if abs(cumul_catchup) < 0.01:
                special_return = 0.0
            elif current_flow < 0:
                waterfall_payments = current_nr + current_h + current_c
                special_return = current_flow - waterfall_payments
            else:
                special_return = 0.0
            special_return_list.append(special_return)

        df['Special Return'] = special_return_list

        # ==============================================================================
        # 4. WATERFALL ALLOCATION SUMMARY
        # ==============================================================================
        self.stdout.write("\n[4] WATERFALL ALLOCATION SUMMARY")
        self.stdout.write("="*100)

        total_distributions = df[df['type'] == 'distribution']['flow_amount'].abs().sum()
        total_capital_called = df[df['type'] == 'capital_call']['flow_amount'].sum()

        nominal_remaining = total_distributions
        nominal_to_deduct = min(-df['Nominal Repayment'].sum(), total_capital_called)
        hurdle_remaining = max(0, nominal_remaining - nominal_to_deduct)
        hurdle_to_deduct = min(-df['Hurdle'].sum(), hurdle_remaining)
        catchup_remaining = max(0, hurdle_remaining - hurdle_to_deduct)
        catchup_to_deduct = min(-df['Catch-up'].sum(), catchup_remaining)
        special_remaining = max(0, catchup_remaining - catchup_to_deduct)
        special_to_deduct = special_remaining

        def print_step_allocation(step_num, amount_to_deduct):
            step_classes = waterfall_config.get(step_num, {}).get('classes', share_class_names)
            valid_classes = [c for c in step_classes if c in ratios]
            active_ratio_sum = sum(ratios.get(c, 0) for c in valid_classes)
            for class_name in valid_classes:
                if active_ratio_sum > 0:
                    normalized_ratio = ratios[class_name] / active_ratio_sum
                    alloc = amount_to_deduct * normalized_ratio
                    self.stdout.write(f"{class_name:<30}: {alloc:>20,.2f}")

        self.stdout.write(f"\n[STEP 1] NOMINAL REPAYMENT")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {nominal_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {nominal_to_deduct:>20,.2f}")
        print_step_allocation(1, nominal_to_deduct)

        self.stdout.write(f"\n[STEP 2] HURDLE")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {hurdle_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {hurdle_to_deduct:>20,.2f}")
        print_step_allocation(2, hurdle_to_deduct)

        self.stdout.write(f"\n[STEP 3] CATCH-UP")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {catchup_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {catchup_to_deduct:>20,.2f}")
        print_step_allocation(3, catchup_to_deduct)

        self.stdout.write(f"\n[STEP 4] SPECIAL RETURN")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {special_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {special_to_deduct:>20,.2f}")
        print_step_allocation(4, special_to_deduct)

        # ---------------------------------------------------------
        # FORMAT OUTPUT
        # ---------------------------------------------------------
        self.stdout.write("\n" + "="*100)
        self.stdout.write("\n[5] DETAILED CASH FLOW TABLE")
        self.stdout.write("-" * 100 + "\n")

        cols = ['date', 'operation_name', 'type', 'flow_amount', 'cumulated_flows']
        cols += [f'Flows {sc}' for sc in share_class_names]
        cols += ['Interests', 'Cumul flows w/ Int', 'Total Interests',
                 'cumulated_capital_call', 'cumulated_distribution',
                 'Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return']

        df_preview = df[cols].copy()

        rename_map = {
            'date': 'Date', 'operation_name': 'Name of Operation', 'type': 'Type',
            'flow_amount': 'Flows', 'cumulated_flows': 'Cumul Flows',
            'Cumul flows w/ Int': 'Cumul w/ Int', 'cumulated_capital_call': 'Cumul Call',
            'cumulated_distribution': 'Cumul Dist'
        }
        for sc in share_class_names:
            rename_map[f'Flows {sc}'] = f'Flows {sc}'

        df_preview.rename(columns=rename_map, inplace=True)

        pd.options.display.float_format = '{:,.2f}'.format
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)

        print(df_preview.to_string(index=False))
        print("-" * 120 + "\n")