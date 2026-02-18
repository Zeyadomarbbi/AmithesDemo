import pandas as pd
import numpy as np
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import Sum, Count
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


# ==============================================================================
# UTILITIES (module-level — usable by API view later)
# ==============================================================================

def xirr(cashflows, dates, guess=0.1):
    """
    Newton-Raphson XIRR.
    Returns float rate or None if result diverges / is non-real.
    cashflows and dates must be aligned lists of equal length.
    """
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
        r = float(r)
        if r != r or abs(r) > 1e6:   # NaN or diverged
            return None
        return r
    except Exception:
        return None


def step_class_weight(kpis, kpi_key, sc, envelope_based=False):
    """
    Fraction of a waterfall step that belongs to share class `sc`.
      Direct-rule steps : class_alloc / to_deduct
      Envelope steps    : sum(env.class_alloc[sc]) / sum(env.amount)
    Returns 0.0 when denominator is effectively zero.
    """
    entry = kpis[kpi_key]
    if not envelope_based:
        numer = float(entry['class_allocations'].get(sc, 0.0))
        denom = float(entry['to_deduct'])
    else:
        numer = sum(float(ed['class_allocations'].get(sc, 0.0)) for ed in entry['envelopes'].values())
        denom = sum(float(ed['amount']) for ed in entry['envelopes'].values())
    return numer / denom if abs(denom) > 0.01 else 0.0


def get_class_step_alloc(kpis, sc, kpi_key, envelope_based=False):
    """Total amount allocated to `sc` for a given waterfall step."""
    entry = kpis[kpi_key]
    if not envelope_based:
        return float(entry['class_allocations'].get(sc, 0.0))
    return sum(float(ed['class_allocations'].get(sc, 0.0)) for ed in entry['envelopes'].values())


class Command(BaseCommand):
    help = 'Previews Cash Flows with Flexible Share Classes and Dynamic Waterfall'

    def add_arguments(self, parser):
        parser.add_argument('fund_id', type=int)
        parser.add_argument('scenario_id', type=int)

    # --------------------------------------------------------------------------
    # FETCH METHODS
    # --------------------------------------------------------------------------

    def fetch_commitments_and_ratios(self, fund_id, scenario_id):
        """[0] Returns (ratios dict, share_class_names list)."""
        self.stdout.write("\n[0] PROJECTED CONFIG (Ratios)")
        self.stdout.write("-" * 100)

        query = """
            SELECT sc.share_class_name, c.total_commitment
            FROM scenario_lps_sc_man_fee_tranches_config c
            JOIN share_class sc ON c.share_class_id = sc.share_class_id
            WHERE c.fund_id = %s AND c.scenario_id = %s
            ORDER BY c.share_class_id;
        """
        ratios = {}
        share_class_names = []

        with connection.cursor() as cursor:
            cursor.execute(query, [fund_id, scenario_id])
            rows = cursor.fetchall()

        if not rows:
            self.stdout.write(self.style.WARNING("No commitment data found."))
            return ratios, share_class_names

        total = sum(float(r[1]) for r in rows)
        for name, amount in rows:
            amount = float(amount)
            ratio = amount / total if total > 0 else 0.0
            ratios[name] = ratio
            share_class_names.append(name)
            self.stdout.write(f" > {name:<20}: {ratio:.4%} (Projected Basis)")

        return ratios, share_class_names

    def fetch_realized_lookups(self, fund_id):
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

    def fetch_portfolio_total_cost(self, fund_id, scenario_id):
        """[0.75] Returns total portfolio cost as float. Single aggregation query."""
        self.stdout.write("\n[0.75] PORTFOLIO TOTAL COST")
        self.stdout.write("-" * 100)

        result = (
            ScenarioPortfolioProjection.objects
            .filter(fund_id=fund_id, scenario_id=scenario_id)
            .aggregate(total=Sum('cost'), count=Count('projection_id'))
        )
        total_cost = float(result['total'] or 0)
        count      = result['count'] or 0

        self.stdout.write(f" > Investments found : {count}")
        self.stdout.write(f" > Total Cost        : {total_cost:>20,.2f}")
        return total_cost

    # --------------------------------------------------------------------------
    # CALCULATION
    # --------------------------------------------------------------------------

    def calculate_kpis(self, waterfall_config, ratios,
                       nominal_remaining, nominal_to_deduct,
                       hurdle_remaining,  hurdle_to_deduct,
                       catchup_remaining, catchup_to_deduct,
                       special_remaining, special_to_deduct):
        """
        Returns KPI dict:
        {
            'nominal_repayment': { 'remaining', 'to_deduct', 'class_allocations': {sc: float} },
            'hurdle':            { 'remaining', 'to_deduct', 'class_allocations': {sc: float} },
            'catch_up':          { 'remaining', 'to_deduct', 'envelopes': {num: {'amount', 'class_allocations'}} },
            'special_return':    { 'remaining', 'to_deduct', 'envelopes': {num: {'amount', 'class_allocations'}} },
        }
        """

        def alloc_direct(amount, step_cfg):
            d_rules = step_cfg.get('direct_rules', {})
            valid   = [c for c in d_rules if c in ratios]
            denom   = sum(ratios[c] for c in valid)
            return {c: amount * ratios[c] / denom if denom > 0 else 0.0 for c in valid}

        def alloc_envelopes(amount, step_cfg):
            result = {}
            for env in step_cfg.get('envelopes', []):
                env_amt = amount * env['alloc']
                valid   = [c for c in env['rules'] if c in ratios]
                denom   = sum(ratios[c] for c in valid)
                result[env['num']] = {
                    'amount':            env_amt,
                    'class_allocations': {c: env_amt * ratios[c] / denom if denom > 0 else 0.0 for c in valid},
                }
            return result

        return {
            'nominal_repayment': {
                'remaining':        nominal_remaining,
                'to_deduct':        nominal_to_deduct,
                'class_allocations': alloc_direct(nominal_to_deduct, waterfall_config.get(1, {})),
            },
            'hurdle': {
                'remaining':        hurdle_remaining,
                'to_deduct':        hurdle_to_deduct,
                'class_allocations': alloc_direct(hurdle_to_deduct, waterfall_config.get(2, {})),
            },
            'catch_up': {
                'remaining': catchup_remaining,
                'to_deduct': catchup_to_deduct,
                'envelopes': alloc_envelopes(catchup_to_deduct, waterfall_config.get(3, {})),
            },
            'special_return': {
                'remaining': special_remaining,
                'to_deduct': special_to_deduct,
                'envelopes': alloc_envelopes(special_to_deduct, waterfall_config.get(4, {})),
            },
        }

    # --------------------------------------------------------------------------
    # MAIN
    # --------------------------------------------------------------------------

    def handle(self, *args, **options):
        fund_id     = options['fund_id']
        scenario_id = options['scenario_id']

        self.stdout.write(self.style.SUCCESS(f"\nFUND: {fund_id}  SCENARIO: {scenario_id}"))
        self.stdout.write("=" * 100)

        # 0. Fetch reference data
        from django.db.models import Count  # local to avoid circular at module level if needed
        ratios, share_class_names = self.fetch_commitments_and_ratios(fund_id, scenario_id)
        realized_calls, realized_dists = self.fetch_realized_lookups(fund_id)
        waterfall_config = self.fetch_waterfall_config(fund_id)
        portfolio_total_cost = self.fetch_portfolio_total_cost(fund_id, scenario_id)

        hurdle_rate               = waterfall_config.get(2, {}).get('rate', 0.08)
        hurdle_participating_classes = waterfall_config.get(2, {}).get('classes', share_class_names) or share_class_names

        # ==============================================================================
        # 1. BUILD CASH FLOW DATAFRAME
        # ==============================================================================
        self.stdout.write("\n[1] MERGING DATA & CALCULATING SPLITS")
        self.stdout.write("-" * 100)

        calls_qs = (
            ScenarioFundflowsCapitalcallSummary.objects
            .filter(fund_id=fund_id, scenario_id=scenario_id)
            .exclude(source_type='projected_placeholder', is_user_inserted=False)
            .values('date', 'flows', 'source_type')
        )
        dist_qs = (
            ScenarioFundflowsDistributionSummary.objects
            .filter(fund_id=fund_id, scenario_id=scenario_id)
            .exclude(source_type='projected_placeholder')
            .values('date', 'flows', 'source_type')
        )

        data = (
            [{'date': r['date'], 'flow_amount':  float(r['flows']), 'type': 'capital_call',  'source_type': r['source_type'], 'operation_name': f"Call ({r['source_type']})"} for r in calls_qs] +
            [{'date': r['date'], 'flow_amount': -float(r['flows']), 'type': 'distribution',  'source_type': r['source_type'], 'operation_name': f"Dist ({r['source_type']})"} for r in dist_qs]
        )

        if not data:
            self.stdout.write(self.style.WARNING("No operations found."))
            return

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)

        # Per-class flow splits (vectorised per class)
        is_realized = df['source_type'].str.contains('realized', case=False)
        is_call     = df['type'] == 'capital_call'
        date_strs   = df['date'].dt.strftime('%Y-%m-%d')

        for sc in share_class_names:
            ratio_sc = ratios.get(sc, 0.0)
            col = pd.Series(0.0, index=df.index)

            # Realized capital calls
            mask = is_realized & is_call
            col[mask] = date_strs[mask].map(
                lambda d: realized_calls.get(d, {}).get(sc, 0.0)
            ).abs()

            # Realized distributions
            mask = is_realized & ~is_call
            col[mask] = -date_strs[mask].map(
                lambda d: realized_dists.get(d, {}).get(sc, 0.0)
            ).abs()

            # Projected (all non-realized)
            mask = ~is_realized
            col[mask] = df.loc[mask, 'flow_amount'] * ratio_sc

            df[f'Flows {sc}'] = col

        # Cumulative columns (vectorised)
        df['cumulated_flows']        = df['flow_amount'].cumsum()
        df['cumulated_capital_call'] = df['flow_amount'].where(is_call, 0.0).cumsum()
        df['cumulated_distribution'] = df['flow_amount'].abs().where(~is_call, 0.0).cumsum()

        # ==============================================================================
        # 2. INTEREST, W-BALANCE & NOMINAL REPAYMENT
        # ==============================================================================
        flow_vals    = df['flow_amount'].tolist()
        dates        = df['date'].tolist()
        sc_flow_cols = {sc: df[f'Flows {sc}'].tolist() for sc in hurdle_participating_classes}

        u_list, w_list, x_list, nr_list = [], [], [], []
        w_balance = sum_u = sum_x = unreturned = 0.0
        prev_date = dates[0]

        for i in range(len(df)):
            cur_date  = dates[i]
            flow_val  = flow_vals[i]
            days_diff = (cur_date - prev_date).days
            year      = cur_date.year
            divisor   = 366.0 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 365.0
            tf        = days_diff / divisor

            u_interest   = w_balance * ((1 + hurdle_rate) ** tf - 1)
            sum_u       += u_interest
            relevant_flow = sum(sc_flow_cols[sc][i] for sc in hurdle_participating_classes)
            w_new         = w_balance + u_interest + relevant_flow

            x_total = sum_u if (sum_x <= 0.0001 and w_new < -0.01) else 0.0
            sum_x  += x_total

            if flow_val > 0:
                unreturned += flow_val
                nr = 0.0
            elif flow_val < 0:
                repayment   = min(abs(flow_val), unreturned)
                nr          = -repayment
                unreturned -= repayment
            else:
                nr = 0.0

            u_list.append(u_interest)
            w_list.append(w_new)
            x_list.append(x_total)
            nr_list.append(nr)
            w_balance = w_new
            prev_date = cur_date

        df['Interests']         = u_list
        df['Cumul flows w/ Int'] = w_list
        df['Total Interests']   = x_list
        df['Nominal Repayment'] = nr_list

        # ==============================================================================
        # 3. HURDLE, CATCH-UP & SPECIAL RETURN  (O(n) accumulators)
        # ==============================================================================
        catchup_rate        = waterfall_config.get(3, {}).get('rate', 0.25)
        total_x             = sum(x_list)
        cumul_cap_call_vals = df['cumulated_capital_call'].tolist()
        cumul_dist_vals     = df['cumulated_distribution'].tolist()

        hurdle_list = []
        sum_hurdle  = cumul_nr = 0.0

        for i in range(len(df)):
            cur_x  = x_list[i]
            cur_nr = nr_list[i]
            cur_f  = flow_vals[i]
            cumul_nr += cur_nr

            if cur_x > 0:
                hurdle = -(cur_x + sum_hurdle)
            elif abs(cumul_nr) >= cumul_cap_call_vals[i] - 0.01:
                if abs(total_x + sum_hurdle) < 0.01:
                    hurdle = 0.0
                else:
                    hurdle = max(-(cumul_dist_vals[i] - cumul_cap_call_vals[i]),
                                 cur_f - cur_nr)
            else:
                hurdle = 0.0

            hurdle_list.append(hurdle)
            sum_hurdle += hurdle

        df['Hurdle'] = hurdle_list

        catchup_list = []
        sum_hurdle_cu = cumul_x = 0.0

        for i in range(len(df)):
            sum_hurdle_cu += hurdle_list[i]
            cumul_x       += x_list[i]
            catchup = (-catchup_rate * x_list[i]
                       if abs(sum_hurdle_cu + cumul_x) < 0.01 else 0.0)
            catchup_list.append(catchup)

        df['Catch-up'] = catchup_list

        special_list  = []
        cumul_catchup = 0.0

        for i in range(len(df)):
            cumul_catchup += catchup_list[i]
            cur_f = flow_vals[i]
            if abs(cumul_catchup) < 0.01 or cur_f >= 0:
                special_list.append(0.0)
            else:
                special_list.append(cur_f - nr_list[i] - hurdle_list[i] - catchup_list[i])

        df['Special Return'] = special_list

        # ==============================================================================
        # 3.5. PRE-COMPUTE KPIs & IRR COLUMNS
        # ==============================================================================
        total_distributions  = df[~is_call]['flow_amount'].abs().sum()
        total_capital_called = df[is_call]['flow_amount'].sum()

        nom_remaining  = total_distributions
        nom_to_deduct  = min(-df['Nominal Repayment'].sum(), total_capital_called)
        hur_remaining  = max(0, nom_remaining  - nom_to_deduct)
        hur_to_deduct  = min(-df['Hurdle'].sum(),            hur_remaining)
        cu_remaining   = max(0, hur_remaining  - hur_to_deduct)
        cu_to_deduct   = min(-df['Catch-up'].sum(),          cu_remaining)
        sp_remaining   = max(0, cu_remaining   - cu_to_deduct)
        sp_to_deduct   = sp_remaining

        kpis = self.calculate_kpis(
            waterfall_config=waterfall_config,
            ratios=ratios,
            nominal_remaining=nom_remaining,  nominal_to_deduct=nom_to_deduct,
            hurdle_remaining=hur_remaining,   hurdle_to_deduct=hur_to_deduct,
            catchup_remaining=cu_remaining,   catchup_to_deduct=cu_to_deduct,
            special_remaining=sp_remaining,   special_to_deduct=sp_to_deduct,
        )

        # IRR columns (vectorised per class)
        nr_arr = df['Nominal Repayment'].values
        h_arr  = df['Hurdle'].values
        cu_arr = df['Catch-up'].values
        sp_arr = df['Special Return'].values
        fa_arr = df['flow_amount'].values

        for sc in share_class_names:
            ratio_sc  = ratios.get(sc, 0.0)
            w_nom = step_class_weight(kpis, 'nominal_repayment', sc, False)
            w_hur = step_class_weight(kpis, 'hurdle',            sc, False)
            w_cu  = step_class_weight(kpis, 'catch_up',          sc, True)
            w_sp  = step_class_weight(kpis, 'special_return',    sc, True)

            irr = np.where(
                is_realized.values,
                -df[f'Flows {sc}'].values,
                np.where(
                    fa_arr > 0,
                    -fa_arr * ratio_sc,
                    -nr_arr * w_nom - h_arr * w_hur - cu_arr * w_cu - sp_arr * w_sp,
                )
            )
            df[f'IRR {sc}'] = irr

        # ==============================================================================
        # 4. (REMOVED) print_step_allocation — superseded by KPI table below
        # ==============================================================================

        # ==============================================================================
        # 5. DETAILED CASH FLOW TABLE
        # ==============================================================================
        self.stdout.write("\n" + "=" * 100)
        self.stdout.write("\n[5] DETAILED CASH FLOW TABLE")
        self.stdout.write("-" * 100 + "\n")

        cols = (
            ['date', 'operation_name', 'type', 'flow_amount', 'cumulated_flows']
            + [f'Flows {sc}' for sc in share_class_names]
            + ['Interests', 'Cumul flows w/ Int', 'Total Interests',
               'cumulated_capital_call', 'cumulated_distribution',
               'Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return']
            + [f'IRR {sc}' for sc in share_class_names]
        )

        rename_map = {
            'date': 'Date', 'operation_name': 'Name of Operation', 'type': 'Type',
            'flow_amount': 'Flows', 'cumulated_flows': 'Cumul Flows',
            'Cumul flows w/ Int': 'Cumul w/ Int',
            'cumulated_capital_call': 'Cumul Call',
            'cumulated_distribution': 'Cumul Dist',
        }

        df_preview = df[cols].rename(columns=rename_map)
        pd.options.display.float_format = '{:,.2f}'.format
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        print(df_preview.to_string(index=False))
        print("-" * 120 + "\n")

        # ==============================================================================
        # 6. KPI SUMMARY TABLE
        # ==============================================================================
        self.stdout.write("\n[6] KPI SUMMARY TABLE")
        self.stdout.write("-" * 100)

        all_classes = list(share_class_names)

        def fmt(v):
            try:
                return f"{float(v):>20,.2f}"
            except (TypeError, ValueError):
                return f"{'N/A':>20}"

        header = f"{'Step':<35} {'Remaining':>20} {'To Deduct':>20}"
        for c in all_classes:
            header += f"  {c:>20}"
        self.stdout.write(header)
        self.stdout.write("-" * len(header))

        def print_kpi_row(label, remaining, to_deduct, class_allocs):
            rem = fmt(remaining) if remaining != "" else f"{'':>20}"
            ded = fmt(to_deduct) if to_deduct != "" else f"{'':>20}"
            row = f"{label:<35}{rem}{ded}"
            for c in all_classes:
                row += fmt(class_allocs.get(c, 0.0))
            self.stdout.write(row)

        nr = kpis['nominal_repayment']
        print_kpi_row("Nominal Repayment", nr['remaining'], nr['to_deduct'], nr['class_allocations'])

        h = kpis['hurdle']
        print_kpi_row("Hurdle", h['remaining'], h['to_deduct'], h['class_allocations'])

        cu = kpis['catch_up']
        print_kpi_row("Catch-up", cu['remaining'], "", {})
        for env_num, env_data in cu['envelopes'].items():
            print_kpi_row(f"  └─ Envelope {env_num}", "", env_data['amount'], env_data['class_allocations'])

        sr = kpis['special_return']
        print_kpi_row("Special Return", sr['remaining'], "", {})
        for env_num, env_data in sr['envelopes'].items():
            print_kpi_row(f"  └─ Envelope {env_num}", "", env_data['amount'], env_data['class_allocations'])

        self.stdout.write("-" * len(header))

        # ==============================================================================
        # 7. SIMULATION RESULTS KPIs
        # ==============================================================================
        def fmtc(v):
            try:
                f = float(v)
                return f"{f:>18,.0f}" if abs(f) > 0.005 else f"{'  -':>18}"
            except Exception:
                return f"{'N/A':>18}"

        # Block 1 — Allocation table
        alloc_rows = {}
        for sc in share_class_names:
            nr_a = get_class_step_alloc(kpis, sc, 'nominal_repayment', False)
            h_a  = get_class_step_alloc(kpis, sc, 'hurdle',            False)
            cu_a = get_class_step_alloc(kpis, sc, 'catch_up',          True)
            sr_a = get_class_step_alloc(kpis, sc, 'special_return',    True)
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

        step_cols    = ['Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return', 'Total']
        alloc_header = f"{'':>20}" + "".join(f"  {c:>18}" for c in step_cols)

        self.stdout.write("\n" + "=" * 100)
        self.stdout.write("\n[7] SIMULATION RESULTS KPIs")
        self.stdout.write("=" * 100)
        self.stdout.write("\n" + alloc_header)
        self.stdout.write("-" * len(alloc_header))

        for sc in share_class_names:
            self.stdout.write(f"{sc:>20}" + "".join(fmtc(alloc_rows[sc][c]) for c in step_cols))
        self.stdout.write(f"{'Fund':>20}" + "".join(fmtc(fund_alloc[c]) for c in step_cols))

        # Block 2 — TVPI & IRR
        dates_list = df['date'].dt.to_pydatetime().tolist()
        tvpi    = {}
        irr_pct = {}

        for sc in share_class_names:
            col       = df[f'IRR {sc}']
            invested  = float(col.clip(upper=0).abs().sum())
            received  = float(col.clip(lower=0).sum())
            tvpi[sc]  = received / invested if invested > 0 else 0.0
            irr_pct[sc] = xirr(col.tolist(), dates_list)

        fund_invested   = float(total_capital_called)
        fund_received   = float(total_distributions)
        tvpi['Fund']    = fund_received / fund_invested if fund_invested > 0 else 0.0
        irr_pct['Fund'] = xirr(df['flow_amount'].tolist(), dates_list)

        self.stdout.write("")
        perf_header = f"{'':>20}  {'TVPI':>10}  {'IRR':>10}"
        self.stdout.write(perf_header)
        self.stdout.write("-" * len(perf_header))

        for sc in share_class_names:
            v   = irr_pct[sc]
            irr_str = f"{v:.2%}" if (v is not None and v == v) else "N/A"
            self.stdout.write(f"{sc:>20}  {tvpi[sc]:>10.2f}  {irr_str:>10}")

        v   = irr_pct['Fund']
        irr_str = f"{v:.2%}" if (v is not None and v == v) else "N/A"
        self.stdout.write(f"{'Fund':>20}  {tvpi['Fund']:>10.2f}  {irr_str:>10}")

        # Block 3 — Break-even
        breakeven_hurdle = (float(nom_to_deduct) + float(hur_to_deduct)) / portfolio_total_cost if portfolio_total_cost > 0 else 0.0
        breakeven_dpi    = float(nom_to_deduct) / portfolio_total_cost if portfolio_total_cost > 0 else 0.0

        self.stdout.write("")
        self.stdout.write(f"  {'Break-even Hurdle':<25}  {'Break-even DPI 1.00x':<25}")
        self.stdout.write(f"  {breakeven_hurdle:<25.2f}  {breakeven_dpi:<25.2f}")
        self.stdout.write("=" * 100)