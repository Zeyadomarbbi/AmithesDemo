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
    FundWaterfallEnvelopeRules,
    ScenarioPortfolioProjection
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

    def calculate_kpis(self, df, waterfall_config, ratios, share_class_names,
                       nominal_remaining, nominal_to_deduct,
                       hurdle_remaining, hurdle_to_deduct,
                       catchup_remaining, catchup_to_deduct,
                       special_remaining, special_to_deduct):
        """
        Builds and returns a KPI dict structured as:

        {
            'nominal_repayment': {
                'remaining': float,
                'to_deduct': float,
                'class_allocations': { 'Class A': float, 'Class B': float, ... }
            },
            'hurdle': {
                'remaining': float,
                'to_deduct': float,
                'class_allocations': { 'Class A': float, ... }
            },
            'catch_up': {
                'remaining': float,
                'to_deduct': float,
                'envelopes': {
                    1: { 'amount': float, 'class_allocations': { 'Class B': float, ... } },
                    2: { 'amount': float, 'class_allocations': { ... } },
                }
            },
            'special_return': {
                'remaining': float,
                'to_deduct': float,
                'envelopes': {
                    1: { 'amount': float, 'class_allocations': { 'Class A': float, ... } },
                    2: { 'amount': float, 'class_allocations': { 'Class B': float, ... } },
                }
            }
        }

        For steps with only direct_rules (Nominal, Hurdle): allocation is split pro-rata
        among active classes using their commitment ratios, normalized to active-class sum.

        For steps with envelopes (Catch-up, Special Return): each envelope receives
        (envelope.alloc * to_deduct), then that amount is split pro-rata among the
        envelope's classes. Direct rules on the same step (if any) are allocated from
        the remainder not covered by envelopes.
        """

        def allocate_by_direct_rules(amount, step_cfg):
            """Allocate amount among direct_rules classes, normalized pro-rata."""
            d_rules = step_cfg.get('direct_rules', {})
            valid = [c for c in d_rules if c in ratios]
            denom = sum(ratios.get(c, 0) for c in valid)
            result = {}
            for c in valid:
                result[c] = amount * (ratios[c] / denom) if denom > 0 else 0.0
            return result

        def allocate_by_envelopes(amount, step_cfg):
            """
            For each envelope: envelope_amount = amount * envelope.alloc
            Then split envelope_amount pro-rata among envelope's classes.
            Returns dict keyed by envelope number.
            """
            envs = step_cfg.get('envelopes', [])
            result = {}
            for env in envs:
                env_amount = amount * env['alloc']
                valid = [c for c in env['rules'] if c in ratios]
                denom = sum(ratios.get(c, 0) for c in valid)
                class_allocs = {}
                for c in valid:
                    class_allocs[c] = env_amount * (ratios[c] / denom) if denom > 0 else 0.0
                result[env['num']] = {
                    'amount': env_amount,
                    'class_allocations': class_allocs
                }
            return result

        kpis = {}

        # ------------------------------------------------------------------
        # STEP 1 — NOMINAL REPAYMENT (direct rules only)
        # ------------------------------------------------------------------
        step1 = waterfall_config.get(1, {})
        kpis['nominal_repayment'] = {
            'remaining': nominal_remaining,
            'to_deduct': nominal_to_deduct,
            'class_allocations': allocate_by_direct_rules(nominal_to_deduct, step1)
        }

        # ------------------------------------------------------------------
        # STEP 2 — HURDLE (direct rules only)
        # ------------------------------------------------------------------
        step2 = waterfall_config.get(2, {})
        kpis['hurdle'] = {
            'remaining': hurdle_remaining,
            'to_deduct': hurdle_to_deduct,
            'class_allocations': allocate_by_direct_rules(hurdle_to_deduct, step2)
        }

        # ------------------------------------------------------------------
        # STEP 3 — CATCH-UP (envelope-based)
        # ------------------------------------------------------------------
        step3 = waterfall_config.get(3, {})
        kpis['catch_up'] = {
            'remaining': catchup_remaining,
            'to_deduct': catchup_to_deduct,
            'envelopes': allocate_by_envelopes(catchup_to_deduct, step3)
        }

        # ------------------------------------------------------------------
        # STEP 4 — SPECIAL RETURN (envelope-based)
        # ------------------------------------------------------------------
        step4 = waterfall_config.get(4, {})
        kpis['special_return'] = {
            'remaining': special_remaining,
            'to_deduct': special_to_deduct,
            'envelopes': allocate_by_envelopes(special_to_deduct, step4)
        }

        return kpis

    def fetch_portfolio_total_cost(self, fund_id, scenario_id):
        """[0.75] PORTFOLIO TOTAL COST — returns total cost float.

        Sums `cost` from scenario_portfolio_projections for all investments
        under the given fund_id and scenario_id.
        """
        self.stdout.write("\n[0.75] PORTFOLIO TOTAL COST")
        self.stdout.write("-" * 100)

        qs = ScenarioPortfolioProjection.objects.filter(
            fund_id=fund_id,
            scenario_id=scenario_id
        )

        total_cost = sum(float(p.cost) for p in qs)

        self.stdout.write(f" > Investments found : {qs.count()}")
        self.stdout.write(f" > Total Cost        : {total_cost:>20,.2f}")

        return total_cost

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

        # ==============================================================================
        # 0.75. FETCH PORTFOLIO TOTAL COST
        # ==============================================================================
        portfolio_total_cost = self.fetch_portfolio_total_cost(fund_id, scenario_id)

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
        # 3.5. CALCULATE IRR COLUMNS PER SHARE CLASS
        # ==============================================================================
        # Pre-compute KPIs here so IRR weights are available for the df columns.
        # The same _kpis object is reused in section 6 for the summary table.

        _total_distributions  = df[df['type'] == 'distribution']['flow_amount'].abs().sum()
        _total_capital_called = df[df['type'] == 'capital_call']['flow_amount'].sum()

        _nominal_remaining  = _total_distributions
        _nominal_to_deduct  = min(-df['Nominal Repayment'].sum(), _total_capital_called)
        _hurdle_remaining   = max(0, _nominal_remaining - _nominal_to_deduct)
        _hurdle_to_deduct   = min(-df['Hurdle'].sum(),       _hurdle_remaining)
        _catchup_remaining  = max(0, _hurdle_remaining  - _hurdle_to_deduct)
        _catchup_to_deduct  = min(-df['Catch-up'].sum(),     _catchup_remaining)
        _special_remaining  = max(0, _catchup_remaining - _catchup_to_deduct)
        _special_to_deduct  = _special_remaining

        _kpis = self.calculate_kpis(
            df=df,
            waterfall_config=waterfall_config,
            ratios=ratios,
            share_class_names=share_class_names,
            nominal_remaining=_nominal_remaining,
            nominal_to_deduct=_nominal_to_deduct,
            hurdle_remaining=_hurdle_remaining,
            hurdle_to_deduct=_hurdle_to_deduct,
            catchup_remaining=_catchup_remaining,
            catchup_to_deduct=_catchup_to_deduct,
            special_remaining=_special_remaining,
            special_to_deduct=_special_to_deduct,
        )

        def _step_class_weight(kpi_key, sc, envelope_based=False):
            """
            Fraction of a waterfall step that belongs to share class `sc`.
            Direct-rule steps  : class_alloc / to_deduct
            Envelope steps     : sum(env.class_alloc[sc]) / sum(env.amount)
            Returns 0 when denominator is effectively 0.
            """
            entry = _kpis[kpi_key]
            if not envelope_based:
                numer = float(entry['class_allocations'].get(sc, 0.0))
                denom = float(entry['to_deduct'])
            else:
                numer = sum(float(ed['class_allocations'].get(sc, 0.0)) for ed in entry['envelopes'].values())
                denom = sum(float(ed['amount']) for ed in entry['envelopes'].values())
            return numer / denom if abs(denom) > 0.01 else 0.0

        for sc in share_class_names:
            ratio_sc = ratios.get(sc, 0.0)

            w_nominal = _step_class_weight('nominal_repayment', sc, envelope_based=False)
            w_hurdle  = _step_class_weight('hurdle',            sc, envelope_based=False)
            w_catchup = _step_class_weight('catch_up',          sc, envelope_based=True)
            w_special = _step_class_weight('special_return',    sc, envelope_based=True)

            irr_col = []
            for _, row in df.iterrows():
                flow_val = row['flow_amount']
                if 'realized' in row['source_type'].lower():
                    # Realized: IRR is the negative of the class split column
                    irr_col.append(-row[f'Flows {sc}'])
                else:
                    if flow_val > 0:
                        # Capital call: proportional to commitment ratio
                        irr_col.append(-flow_val * ratio_sc)
                    else:
                        # Distribution: decomposed via waterfall step weights
                        irr_val = (
                            - row['Nominal Repayment'] * w_nominal
                            - row['Hurdle']            * w_hurdle
                            - row['Catch-up']          * w_catchup
                            - row['Special Return']    * w_special
                        )
                        irr_col.append(irr_val)

            df[f'IRR {sc}'] = irr_col

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
        cols += [f'IRR {sc}' for sc in share_class_names]

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

        # ==============================================================================
        # 6. KPIs
        # ==============================================================================
        # _kpis already computed in section 3.5 — reuse directly
        kpis = _kpis

        self.stdout.write("\n[6] KPI SUMMARY TABLE")
        self.stdout.write("-" * 100)

        def fmt(v):
            try:
                return f"{float(v):>20,.2f}"
            except (TypeError, ValueError):
                return f"{'N/A':>20}"

        all_classes = list(share_class_names)

        header = f"{'Step':<35} {'Remaining':>20} {'To Deduct':>20}"
        for c in all_classes:
            header += f"  {c:>20}"
        self.stdout.write(header)
        self.stdout.write("-" * len(header))

        def print_row(label, remaining, to_deduct, class_allocs):
            rem_str = fmt(remaining) if remaining != "" else f"{'':>20}"
            ded_str = fmt(to_deduct) if to_deduct != "" else f"{'':>20}"
            row = f"{label:<35}{rem_str}{ded_str}"
            for c in all_classes:
                row += fmt(class_allocs.get(c, 0.0))
            self.stdout.write(row)

        nr = kpis['nominal_repayment']
        print_row("Nominal Repayment", nr['remaining'], nr['to_deduct'], nr['class_allocations'])

        h = kpis['hurdle']
        print_row("Hurdle", h['remaining'], h['to_deduct'], h['class_allocations'])

        cu = kpis['catch_up']
        print_row("Catch-up", cu['remaining'], "", {})
        for env_num, env_data in cu['envelopes'].items():
            print_row(f"  └─ Envelope {env_num}", "", env_data['amount'], env_data['class_allocations'])

        sr = kpis['special_return']
        print_row("Special Return", sr['remaining'], "", {})
        for env_num, env_data in sr['envelopes'].items():
            print_row(f"  └─ Envelope {env_num}", "", env_data['amount'], env_data['class_allocations'])

        self.stdout.write("-" * len(header))
        # ==============================================================================
        # 7. SIMULATION RESULTS KPIs
        # ==============================================================================

        def xirr(cashflows, dates, guess=0.1):
            """Newton-Raphson XIRR. Returns None if result is non-real or diverged."""
            t0 = dates[0]
            years = [(d - t0).days / 365.0 for d in dates]
            def npv(r):
                return sum(cf / (1 + r) ** t for cf, t in zip(cashflows, years))
            def dnpv(r):
                return sum(-t * cf / (1 + r) ** (t + 1) for cf, t in zip(cashflows, years))
            try:
                r = float(guess)
                for _ in range(1000):
                    f_val = npv(r)
                    f_der = dnpv(r)
                    if abs(f_der) < 1e-12:
                        break
                    r_new = r - f_val / f_der
                    if abs(r_new - r) < 1e-8:
                        r = r_new
                        break
                    r = r_new
                # Validate: must be real, finite, and reasonable
                r = float(r)
                if not isinstance(r, float) or r != r or abs(r) > 1e6:
                    return None
                return r
            except Exception:
                return None

        # --- Helper: get class total received (sum of positive IRR col values) ---
        def class_total_received(sc):
            return df[f'IRR {sc}'].clip(lower=0).sum()

        def class_total_invested(sc):
            return df[f'IRR {sc}'].clip(upper=0).abs().sum()

        # --- Block 1: Allocation Table ---
        def get_class_step_alloc(sc, kpi_key, envelope_based=False):
            entry = kpis[kpi_key]
            if not envelope_based:
                return float(entry['class_allocations'].get(sc, 0.0))
            else:
                return sum(float(ed['class_allocations'].get(sc, 0.0)) for ed in entry['envelopes'].values())

        alloc_rows = {}
        for sc in share_class_names:
            nr_a  = get_class_step_alloc(sc, 'nominal_repayment', False)
            h_a   = get_class_step_alloc(sc, 'hurdle',            False)
            cu_a  = get_class_step_alloc(sc, 'catch_up',          True)
            sr_a  = get_class_step_alloc(sc, 'special_return',    True)
            alloc_rows[sc] = {
                'Nominal Repayment': nr_a,
                'Hurdle':            h_a,
                'Catch-up':          cu_a,
                'Special Return':    sr_a,
                'Total':             nr_a + h_a + cu_a + sr_a,
            }

        fund_alloc = {
            'Nominal Repayment': float(kpis['nominal_repayment']['to_deduct']),
            'Hurdle':            float(kpis['hurdle']['to_deduct']),
            'Catch-up':          float(kpis['catch_up']['to_deduct']),
            'Special Return':    float(kpis['special_return']['to_deduct']),
        }
        fund_alloc['Total'] = sum(fund_alloc.values())

        # --- Block 2: TVPI & IRR ---
        tvpi = {}
        irr_pct = {}
        dates_list = df['date'].dt.to_pydatetime().tolist()

        for sc in share_class_names:
            invested = class_total_invested(sc)
            received = class_total_received(sc)
            tvpi[sc] = received / invested if invested > 0 else 0.0
            sc_flows = df[f'IRR {sc}'].tolist()
            irr_pct[sc] = xirr(sc_flows, dates_list)

        fund_invested = float(total_capital_called)
        fund_received = float(total_distributions)
        tvpi['Fund']   = fund_received / fund_invested if fund_invested > 0 else 0.0
        fund_flows = df['flow_amount'].tolist()
        irr_pct['Fund'] = xirr(fund_flows, dates_list)

        # --- Block 3: Break-even ---
        breakeven_hurdle  = (float(_nominal_to_deduct) + float(_hurdle_to_deduct)) / portfolio_total_cost if portfolio_total_cost > 0 else 0.0
        breakeven_dpi_1x  = float(_nominal_to_deduct) / portfolio_total_cost if portfolio_total_cost > 0 else 0.0

        # --- PRINT ---
        self.stdout.write("\n" + "=" * 100)
        self.stdout.write("\n[7] SIMULATION RESULTS KPIs")
        self.stdout.write("=" * 100)

        step_cols = ['Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return', 'Total']

        def fmtc(v):
            try:
                f = float(v)
                return f"{f:>18,.0f}" if abs(f) > 0.005 else f"{'  -':>18}"
            except:
                return f"{'N/A':>18}"

        # Header
        alloc_header = f"{'':>20}"
        for col in step_cols:
            alloc_header += f"  {col:>18}"
        self.stdout.write("\n" + alloc_header)
        self.stdout.write("-" * len(alloc_header))

        for sc in share_class_names:
            row_str = f"{sc:>20}"
            for col in step_cols:
                row_str += fmtc(alloc_rows[sc][col])
            self.stdout.write(row_str)

        fund_row = f"{'Fund':>20}"
        for col in step_cols:
            fund_row += fmtc(fund_alloc[col])
        self.stdout.write(fund_row)

        # TVPI & IRR
        self.stdout.write("")
        perf_header = f"{'':>20}  {'TVPI':>10}  {'IRR':>10}"
        self.stdout.write(perf_header)
        self.stdout.write("-" * len(perf_header))

        for sc in share_class_names:
            irr_val = irr_pct[sc]
            irr_str = f"{irr_val:.2%}" if (irr_val is not None and irr_val == irr_val) else "N/A"
            self.stdout.write(f"{sc:>20}  {tvpi[sc]:>10.2f}  {irr_str:>10}")

        fund_irr_str = f"{irr_pct['Fund']:.2%}" if (irr_pct['Fund'] is not None and irr_pct['Fund'] == irr_pct['Fund']) else "N/A"
        self.stdout.write(f"{'Fund':>20}  {tvpi['Fund']:>10.2f}  {fund_irr_str:>10}")

        # Break-even
        self.stdout.write("")
        self.stdout.write(f"  {'Break-even Hurdle':<25}  {'Break-even DPI 1.00x':<25}")
        self.stdout.write(f"  {breakeven_hurdle:<25.2f}  {breakeven_dpi_1x:<25.2f}")
        self.stdout.write("=" * 100)