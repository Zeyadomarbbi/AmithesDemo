from dateutil.relativedelta import relativedelta
from datetime import date
import warnings
import math
from concurrent.futures import ThreadPoolExecutor

import pandas as pd
import numpy as np
from django.db import connection
from django.db.models import Sum

from rest_api.models.views import (
    ScenarioFundflowsCapitalcallSummary, 
    ScenarioFundflowsDistributionSummary,
)
from rest_api.models.transactions import (
    FundWaterfallSteps,
    FundWaterfallStepRules,
    FundWaterfallEnvelopes,
    FundWaterfallEnvelopeRules,
    ScenarioPortfolioProjection,
    ScenarioDueDiligenceFee
)
from rest_api.models.core import ShareClass

warnings.filterwarnings('ignore')
# --- UTILITIES ---


def fetch_commitments_and_ratios(fund_id, scenario_id):
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

    total = sum(float(r[1]) for r in rows)
    for name, amount in rows:
        amount = float(amount)
        ratio = amount / total if total > 0 else 0.0
        ratios[name] = ratio
        share_class_names.append(name)
    return ratios, share_class_names

def xirr(cashflows, dates, guess=0.1):
    """Newton-Raphson XIRR. Always returns float or None — never complex."""
    try:
        if not cashflows or not dates:
            return None
        # Guard: all-negative or all-positive flows have no real IRR
        has_pos = any(cf > 0 for cf in cashflows)
        has_neg = any(cf < 0 for cf in cashflows)
        if not has_pos or not has_neg:
            return None

        t0 = dates[0]
        years = [(d - t0).days / 365.0 for d in dates]

        def npv(r):
            return sum(cf / (1 + r) ** t for cf, t in zip(cashflows, years))

        def dnpv(r):
            return sum(-t * cf / (1 + r) ** (t + 1) for cf, t in zip(cashflows, years))

        r = float(guess)
        for _ in range(100):
            if r <= -1.0:
                r = -0.9999  # Prevent (1+r) going to zero or negative
            f_val = npv(r)
            f_der = dnpv(r)
            if abs(f_der) < 1e-12:
                break
            r_new = r - f_val / f_der
            if isinstance(r_new, complex):
                return None  # Newton stepped into complex space
            if not math.isfinite(r_new):
                return None
            if abs(r_new - r) < 1e-8:
                r = r_new
                break
            r = r_new

        if isinstance(r, complex) or not math.isfinite(r) or abs(r) > 1e6:
            return None
        return r

    except Exception:
        return None

def step_class_weight(kpis, kpi_key, sc, envelope_based=False):
    entry = kpis[kpi_key]
    if not envelope_based:
        numer = float(entry['class_allocations'].get(sc, 0.0))
        denom = float(entry['to_deduct'])
    else:
        numer = sum(float(ed['class_allocations'].get(sc, 0.0)) for ed in entry['envelopes'].values())
        denom = sum(float(ed['amount']) for ed in entry['envelopes'].values())
    return numer / denom if abs(denom) > 0.01 else 0.0

def get_class_step_alloc(kpis, sc, kpi_key, envelope_based=False):
    entry = kpis[kpi_key]
    if not envelope_based:
        return float(entry['class_allocations'].get(sc, 0.0))
    return sum(float(ed['class_allocations'].get(sc, 0.0)) for ed in entry['envelopes'].values())

def fetch_realized_lookups(fund_id):
    q = """
        SELECT t.name, d.due_date, sc.share_class_name, SUM(a.capital_call)
        FROM lps_operation_lp_allocations a
        JOIN lps_operation_details d ON a.lps_operation_details_id = d.lps_operation_details_id
        JOIN lps_operation_type t    ON d.operation_type_id = t.operation_type_id
        JOIN share_class sc          ON a.share_class_id = sc.share_class_id
        WHERE d.fund_id = %s
        GROUP BY t.name, d.due_date, sc.share_class_name;
    """
    realized_calls = {}
    realized_dists = {}
    with connection.cursor() as c:
        c.execute(q, [fund_id])
        for op_type, due_date, sc_name, amount in c.fetchall():
            dt = str(due_date)
            amt = float(amount) if amount else 0.0
            if op_type in ('Capital Call', 'Capital Call / Equalization', 'Equalization'):
                realized_calls.setdefault(dt, {})[sc_name] = amt
            elif op_type == 'Distribution':
                realized_dists.setdefault(dt, {})[sc_name] = amt
    return realized_calls, realized_dists
    

def fetch_waterfall_config(fund_id):
    config = {}
    steps = FundWaterfallSteps.objects.filter(fund_id=fund_id)\
        .select_related('step_definition').order_by('step_definition__step_number')

    for step in steps:
        s_num = step.step_definition.step_number
        s_rate = float(step.step_rate) / 100.0 if step.step_rate else 0.0
        
        d_rules_qs = FundWaterfallStepRules.objects.filter(fund_waterfall_step=step, is_selected=True)\
            .select_related('share_class')
        d_rules = {r.share_class.share_class_name: (float(r.fixed_percentage) if r.fixed_percentage else 'Pro-Rata') for r in d_rules_qs}

        envs = []
        env_qs = FundWaterfallEnvelopes.objects.filter(fund_waterfall_steps=step).order_by('envelope_number')
        for e in env_qs:
            e_rules_qs = FundWaterfallEnvelopeRules.objects.filter(envelope=e, is_selected=True).select_related('share_class')
            e_rules = {er.share_class.share_class_name: (float(er.fixed_percentage) if er.fixed_percentage else 'Pro-Rata') for er in e_rules_qs}
            envs.append({'num': e.envelope_number, 'alloc': float(e.allocation_percentage) / 100.0, 'rules': e_rules})

        classes = list(d_rules.keys())
        for e in envs:
            for c in e['rules']:
                if c not in classes: classes.append(c)

        config[s_num] = {'name': step.step_name, 'rate': s_rate, 'direct_rules': d_rules, 'envelopes': envs, 'classes': classes}
    return config

def calculate_kpis(waterfall_config, ratios, nr_rem, nr_deduct, hr_rem, hr_deduct, cu_rem, cu_deduct, sp_rem, sp_deduct):
    def alloc_direct(amount, step_cfg):
        d_rules = step_cfg.get('direct_rules', {})
        valid = [c for c in d_rules if c in ratios]
        denom = sum(ratios[c] for c in valid)
        return {c: amount * ratios[c] / denom if denom > 0 else 0.0 for c in valid}

    def alloc_envelopes(amount, step_cfg):
        result = {}
        for env in step_cfg.get('envelopes', []):
            env_amt = amount * env['alloc']
            valid = [c for c in env['rules'] if c in ratios]
            denom = sum(ratios[c] for c in valid)
            result[env['num']] = {
                'amount': env_amt,
                'class_allocations': {c: env_amt * ratios[c] / denom if denom > 0 else 0.0 for c in valid},
            }
        return result

    return {
        'nominal_repayment': {'remaining': nr_rem, 'to_deduct': nr_deduct, 'class_allocations': alloc_direct(nr_deduct, waterfall_config.get(1, {}))},
        'hurdle': {'remaining': hr_rem, 'to_deduct': hr_deduct, 'class_allocations': alloc_direct(hr_deduct, waterfall_config.get(2, {}))},
        'catch_up': {'remaining': cu_rem, 'to_deduct': cu_deduct, 'envelopes': alloc_envelopes(cu_deduct, waterfall_config.get(3, {}))},
        'special_return': {'remaining': sp_rem, 'to_deduct': sp_deduct, 'envelopes': alloc_envelopes(sp_deduct, waterfall_config.get(4, {}))},
    }

def fetch_portfolio_total_cost(fund_id, scenario_id):
    result = ScenarioPortfolioProjection.objects.filter(fund_id=fund_id, scenario_id=scenario_id)\
        .aggregate(total=Sum('cost'))
    return float(result['total'] or 0)

def fetch_static_capital_calls(fund_id, scenario_id):
    qs = ScenarioFundflowsCapitalcallSummary.objects.filter(
        fund_id=fund_id,
        scenario_id=scenario_id
    ).exclude(
        source_type='projected_placeholder', 
        is_user_inserted=False
    )

    return [
        {
            'summary_id': r['summary_id'],
            'date': r['date'],
            'flows': float(r['flows']),
            'investment': float(r['investment']),
            'management_fees': float(r['management_fees']), # ADDED
            'dd_fees': float(r['dd_fees']),                 # ADDED
            'type': 'capital_call',
            'source_type': r['source_type'],
        }
        for r in qs.values('summary_id', 'date', 'flows', 'investment', 'management_fees', 'dd_fees', 'source_type')
    ]
    
class WaterfallService:
    def __init__(self, fund_id, scenario_id):
        self.fund_id = fund_id
        self.scenario_id = scenario_id

    def fetch_projected_exit_names(self):
        qs = ScenarioPortfolioProjection.objects.filter(
            fund_id=self.fund_id, 
            scenario_id=self.scenario_id,
            exit_date__isnull=False
        ).values('exit_date', 'investment__name') 

        exit_map = {}
        for item in qs:
            d_str = str(item['exit_date'])
            inv_name = item['investment__name'] or "Unknown Investment"
            if d_str in exit_map:
                exit_map[d_str] += f", {inv_name}"
            else:
                exit_map[d_str] = inv_name
        return exit_map

    # --- CORE CALCULATION ---



    def run_simulation(self):
        # 1. Fetch Data
        ratios, share_class_names = fetch_commitments_and_ratios(self.fund_id, self.scenario_id)
        realized_calls, realized_dists = fetch_realized_lookups(self.fund_id)
        waterfall_config = fetch_waterfall_config(self.fund_id)
        portfolio_total_cost = fetch_portfolio_total_cost(self.fund_id, self.scenario_id)
        exit_names_map = self.fetch_projected_exit_names()

        hurdle_rate = waterfall_config.get(2, {}).get('rate', 0.08)
        hurdle_participating_classes = waterfall_config.get(2, {}).get('classes', share_class_names) or share_class_names
        catchup_rate = waterfall_config.get(3, {}).get('rate', 0.25)

        # 2. Build DataFrame
        calls_qs = ScenarioFundflowsCapitalcallSummary.objects.filter(fund_id=self.fund_id, scenario_id=self.scenario_id)\
            .exclude(source_type='projected_placeholder', is_user_inserted=False).values('date', 'flows', 'source_type')
        dist_qs = ScenarioFundflowsDistributionSummary.objects.filter(fund_id=self.fund_id, scenario_id=self.scenario_id)\
            .exclude(source_type='projected_placeholder').values('date', 'flows', 'source_type')

        data = (
            [{'date': r['date'], 'flow_amount':  float(r['flows']), 'type': 'capital_call',  'source_type': r['source_type'], 'operation_name': f"Call ({r['source_type']})"} for r in calls_qs] +
            [{'date': r['date'], 'flow_amount': -float(r['flows']), 'type': 'distribution',  'source_type': r['source_type'], 'operation_name': f"Dist ({r['source_type']})"} for r in dist_qs]
        )
        
        if not data: return None

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)
        
        # Resolve Operation Names
        df['date_str'] = df['date'].dt.strftime('%Y-%m-%d')

        def resolve_op_name(row):
            if row['type'] == 'distribution' and 'projected' in row['source_type']:
                if row['date_str'] in exit_names_map:
                    return f"Exit: {exit_names_map[row['date_str']]}"
            return row['operation_name']

        df['operation_name'] = df.apply(resolve_op_name, axis=1)

        is_realized = df['source_type'].str.contains('realized', case=False)
        is_call = df['type'] == 'capital_call'
        date_strs = df['date_str']

        for sc in share_class_names:
            ratio_sc = ratios.get(sc, 0.0)
            col = pd.Series(0.0, index=df.index)
            # Realized
            mask_rc = is_realized & is_call
            col[mask_rc] = date_strs[mask_rc].map(lambda d: realized_calls.get(d, {}).get(sc, 0.0)).abs()
            mask_rd = is_realized & ~is_call
            col[mask_rd] = -date_strs[mask_rd].map(lambda d: realized_dists.get(d, {}).get(sc, 0.0)).abs()
            # Projected
            mask_p = ~is_realized
            col[mask_p] = df.loc[mask_p, 'flow_amount'] * ratio_sc
            df[f'Flows {sc}'] = col

        df['cumulated_capital_call'] = df['flow_amount'].where(is_call, 0.0).cumsum()
        df['cumulated_distribution'] = df['flow_amount'].abs().where(~is_call, 0.0).cumsum()

        # 3. Calculations Loop
        flow_vals = df['flow_amount'].tolist()
        dates = df['date'].tolist()
        sc_flow_cols = {sc: df[f'Flows {sc}'].tolist() for sc in hurdle_participating_classes}
        
        w_balance = sum_u = sum_x = unreturned = 0.0
        prev_date = dates[0]
        x_list, nr_list = [], []

        for i, cur_date in enumerate(dates):
            days = (cur_date - prev_date).days
            year = cur_date.year
            div = 366.0 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 365.0
            tf = days / div
            
            u_int = w_balance * ((1 + hurdle_rate) ** tf - 1)
            sum_u += u_int
            rel_flow = sum(sc_flow_cols[sc][i] for sc in hurdle_participating_classes)
            w_new = w_balance + u_int + rel_flow
            
            x_total = sum_u if (sum_x <= 0.0001 and w_new < -0.01) else 0.0
            sum_x += x_total
            
            f_val = flow_vals[i]
            if f_val > 0:
                unreturned += f_val
                nr = 0.0
            elif f_val < 0:
                repay = min(abs(f_val), unreturned)
                nr = -repay
                unreturned -= repay
            else:
                nr = 0.0
            
            x_list.append(x_total)
            nr_list.append(nr)
            w_balance = w_new
            prev_date = cur_date

        df['Nominal Repayment'] = nr_list
        
        # 4. Hurdle / Catchup / Special
        total_x = sum(x_list)
        cumul_cc = df['cumulated_capital_call'].tolist()
        cumul_dist = df['cumulated_distribution'].tolist()
        
        hurdle_list, catchup_list, special_list = [], [], []
        sum_hurdle = cumul_nr = sum_hurdle_cu = cumul_x = cumul_catchup = 0.0

        for i in range(len(df)):
            cur_nr = nr_list[i]
            cur_x = x_list[i]
            cumul_nr += cur_nr
            
            if cur_x > 0:
                h = -(cur_x + sum_hurdle)
            elif abs(cumul_nr) >= cumul_cc[i] - 0.01:
                if abs(total_x + sum_hurdle) < 0.01: h = 0.0
                else: h = max(-(cumul_dist[i] - cumul_cc[i]), flow_vals[i] - cur_nr)
            else:
                h = 0.0
            hurdle_list.append(h)
            sum_hurdle += h

            sum_hurdle_cu += h
            cumul_x += cur_x
            cu = (-catchup_rate * cur_x if abs(sum_hurdle_cu + cumul_x) < 0.01 else 0.0)
            catchup_list.append(cu)

            cumul_catchup += cu
            if abs(cumul_catchup) < 0.01 or flow_vals[i] >= 0:
                sp = 0.0
            else:
                sp = flow_vals[i] - cur_nr - h - cu
            special_list.append(sp)

        df['Hurdle'] = hurdle_list
        df['Catch-up'] = catchup_list
        df['Special Return'] = special_list

        # 5. Final Aggregations
        total_dists = df[~is_call]['flow_amount'].abs().sum()
        total_calls = df[is_call]['flow_amount'].sum()
        
        nom_rem = total_dists
        nom_ded = min(-sum(nr_list), total_calls)
        hur_rem = max(0, nom_rem - nom_ded)
        hur_ded = min(-sum(hurdle_list), hur_rem)
        cu_rem = max(0, hur_rem - hur_ded)
        cu_ded = min(-sum(catchup_list), cu_rem)
        sp_rem = max(0, cu_rem - cu_ded)
        sp_ded = sp_rem

        kpis = calculate_kpis(waterfall_config, ratios, nom_rem, nom_ded, hur_rem, hur_ded, cu_rem, cu_ded, sp_rem, sp_ded)

        # 6. Prepare Results
        allocations = {}
        for sc in share_class_names:
            nr_a = get_class_step_alloc(kpis, sc, 'nominal_repayment')
            h_a = get_class_step_alloc(kpis, sc, 'hurdle')
            cu_a = get_class_step_alloc(kpis, sc, 'catch_up', True)
            sr_a = get_class_step_alloc(kpis, sc, 'special_return', True)
            
            w_nom = step_class_weight(kpis, 'nominal_repayment', sc)
            w_hur = step_class_weight(kpis, 'hurdle', sc)
            w_cu = step_class_weight(kpis, 'catch_up', sc, True)
            w_sp = step_class_weight(kpis, 'special_return', sc, True)
            
            irr_flow = np.where(
                is_realized.values,
                -df[f'Flows {sc}'].values,
                np.where(
                    df['flow_amount'].values > 0,
                    -df['flow_amount'].values * ratios.get(sc, 0.0),
                    -np.array(nr_list)*w_nom - np.array(hurdle_list)*w_hur - np.array(catchup_list)*w_cu - np.array(special_list)*w_sp
                )
            )
            df[f'IRR {sc}'] = irr_flow

            allocations[sc] = {
                'Nominal Repayment': nr_a, 'Hurdle': h_a, 'Catch-up': cu_a, 'Special Return': sr_a,
                'Total': nr_a + h_a + cu_a + sr_a
            }

        fund_alloc = {
            'Nominal Repayment': float(kpis['nominal_repayment']['to_deduct']),
            'Hurdle': float(kpis['hurdle']['to_deduct']),
            'Catch-up': float(kpis['catch_up']['to_deduct']),
            'Special Return': float(kpis['special_return']['to_deduct']),
        }
        fund_alloc['Total'] = sum(fund_alloc.values())
        allocations['Fund'] = fund_alloc

        # --- OPERATIONS BREAKDOWN ---
        dist_mask = df['type'] == 'distribution'
        ops_df = df[dist_mask].groupby('operation_name', sort=False)[[
            'Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return', 'flow_amount'
        ]].sum().abs()

        operations_alloc = {}
        # Accumulators for the Fund Total in Operations
        f_ops_nom = f_ops_hur = f_ops_cat = f_ops_spe = f_ops_tot = 0.0

        for name, row in ops_df.iterrows():
            operations_alloc[name] = {
                'Nominal Repayment': row['Nominal Repayment'],
                'Hurdle': row['Hurdle'],
                'Catch-up': row['Catch-up'],
                'Special Return': row['Special Return'],
                'Total': row['flow_amount']
            }
            f_ops_nom += row['Nominal Repayment']
            f_ops_hur += row['Hurdle']
            f_ops_cat += row['Catch-up']
            f_ops_spe += row['Special Return']
            f_ops_tot += row['flow_amount']

        # Add Fund Total to Operations
        operations_alloc['Fund'] = {
            'Nominal Repayment': f_ops_nom,
            'Hurdle': f_ops_hur,
            'Catch-up': f_ops_cat,
            'Special Return': f_ops_spe,
            'Total': f_ops_tot
        }
        # ----------------------------

        # Performance (IRR/TVPI)
        performance = {}
        dates_list = df['date'].dt.to_pydatetime().tolist()
        
        for sc in share_class_names:
            col = df[f'IRR {sc}']
            invested = float(col.clip(upper=0).abs().sum())
            received = float(col.clip(lower=0).sum())
            tvpi = received / invested if invested > 0 else 0.0
            irr_val = xirr(col.tolist(), dates_list)
            performance[sc] = {'TVPI': tvpi, 'IRR': irr_val}

        f_inv = float(total_calls)
        f_rec = float(total_dists)
        performance['Fund'] = {
            'TVPI': f_rec / f_inv if f_inv > 0 else 0.0,
            'IRR': xirr(df['flow_amount'].tolist(), dates_list)
        }

        be_hurdle = (float(nom_ded) + float(hur_ded)) / portfolio_total_cost if portfolio_total_cost > 0 else 0.0
        be_dpi = float(nom_ded) / portfolio_total_cost if portfolio_total_cost > 0 else 0.0

        df = df.replace({np.nan: None})
        
        cashflow_cols = ['date_str', 'operation_name', 'type', 'flow_amount', 'Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return'] + [f'IRR {sc}' for sc in share_class_names] + [f'Flows {sc}' for sc in share_class_names]
        cashflows_data = df[cashflow_cols].to_dict(orient='records')

        return {
            'kpis': kpis,
            'simulation_results': {
                'allocations': allocations,
                'operations': operations_alloc,
                'performance': performance,
                'breakeven': {'hurdle': be_hurdle, 'dpi_1x': be_dpi}
            },
            'cashflows': cashflows_data
        }
    

class SensitivityService:
    
    def __init__(self, fund_id, scenario_id, investment_id):
        self.fund_id = fund_id
        self.scenario_id = scenario_id
        self.investment_id = investment_id
        
        try:
            self.base_projection = ScenarioPortfolioProjection.objects.get(
                investment_id=self.investment_id, 
                scenario_id=self.scenario_id
            )
        except ScenarioPortfolioProjection.DoesNotExist:
            raise ValueError("Base projection not found for this investment/scenario.")
        
        self.waterfall_config = fetch_waterfall_config(fund_id)
        self.ratios, self.share_class_names = fetch_commitments_and_ratios(fund_id, scenario_id)
        self.total_commitment = self._fetch_total_commitment()
        self.base_investment_flows = self._fetch_base_investment_flows()
        self.realized_calls, self.realized_dists = fetch_realized_lookups(fund_id)
        self.portfolio_total_cost = fetch_portfolio_total_cost(fund_id, scenario_id)
        self.base_dd_fee = self._fetch_base_dd_fee()
        self.static_capital_calls = fetch_static_capital_calls(fund_id, scenario_id)
        self.man_fee_rate = self._fetch_man_fee_rate()

    def _fetch_man_fee_rate(self):
        """
        Fetches the fee rate for 'Portfolio' level management fees.
        """
        # Adjust query to match your specific config table
        query = """
            SELECT fee_rate_percent 
            FROM scenario_lps_sc_man_fee_tranches_config 
            WHERE fund_id = %s AND scenario_id = %s 
            LIMIT 1;
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [self.fund_id, self.scenario_id])
            row = cursor.fetchone()
        return float(row[0]) / 100.0 if row else 0.02 # Default to 2%

    def _fetch_total_commitment(self):
        query = """
            SELECT COALESCE(SUM(total_commitment), 0)
            FROM scenario_lps_sc_man_fee_tranches_config
            WHERE fund_id = %s AND scenario_id = %s;
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [self.fund_id, self.scenario_id])
            result = cursor.fetchone()[0]
        return float(result)
    
    def _fetch_base_investment_flows(self):
        """
        Fetches the raw transaction flows for this specific investment.
        Investments = Negative Cashflow
        Dividends/Interests = Positive Cashflow
        """
        query = """
            SELECT f.date, f.amount, t.transaction_name
            FROM portfolio_transaction_flows f
            JOIN portfolio_transaction_type t ON t.transaction_id = f.transaction_id
            WHERE f.investment_id = %s
              AND f.is_deleted = false
              AND (f.scenario_id IS NULL OR f.scenario_id = %s)
            ORDER BY f.date;
        """
        base_flows = []
        with connection.cursor() as cursor:
            cursor.execute(query, [self.investment_id, self.scenario_id])
            for row in cursor.fetchall():
                date = row[0]
                amount = float(row[1])
                t_name = row[2]
                
                # Assign IRR direction signs
                if t_name == 'Investment':
                    cf = -abs(amount)
                else:
                    cf = abs(amount)
                    
                base_flows.append((date, cf))
                
        return base_flows
    
    def _calculate_virtual_exit(self, moic_input, duration_input):
        virtual_exit_date = None
        virtual_exit_value = 0.0

        if self.base_projection.first_investment_date and duration_input is not None:
            years = int(duration_input)
            months = int(round((duration_input - years) * 12))
            virtual_exit_date = self.base_projection.first_investment_date + relativedelta(years=years, months=months)

        if moic_input is not None:
            virtual_exit_value = float(self.base_projection.cost) * float(moic_input)

        return virtual_exit_date, virtual_exit_value

    def _fetch_target_summary_id(self):
        """Finds the summary_id of the original projected exit to remove it."""
        query = """
            SELECT summary_id
            FROM scenario_fundflows_distribution_summary
            WHERE fund_id = %s
              AND scenario_id = %s
              AND source_type = 'projected'
              AND source_id = %s
              AND divestment > 0
            LIMIT 1;
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [self.fund_id, self.scenario_id, self.investment_id])
            result = cursor.fetchone()
        return result[0] if result else None

    def _fetch_static_distributions(self):
        """
        Fetches base distributions, excluding placeholders 
        and the specific target investment's projected exit.
        """
        target_summary_id = self._fetch_target_summary_id()
        
        qs = ScenarioFundflowsDistributionSummary.objects.filter(
            fund_id=self.fund_id,
            scenario_id=self.scenario_id
        ).exclude(source_type='projected_placeholder')

        if target_summary_id:
            qs = qs.exclude(summary_id=target_summary_id)

        return [
            {
                'summary_id': r['summary_id'],
                'date': r['date'],
                'flows': -float(r['flows']), # Standardize as negative for distribution
                'type': 'distribution',
                'source_type': r['source_type'],
                'source_id': r['source_id']
            }
            for r in qs.values('summary_id', 'date', 'flows', 'source_type', 'source_id')
        ]
    

    
    def _fetch_base_dd_fee(self):
        try:
            dd_fee = ScenarioDueDiligenceFee.objects.get(
                investment_id=self.investment_id,
                scenario_id=self.scenario_id
            )
            return {
                'entry_fee_pct': float(dd_fee.entry_fee_pct),
                'exit_fee_pct': float(dd_fee.exit_fee_pct),
                'is_entry_sunk': dd_fee.is_entry_sunk,
                'is_exit_sunk': dd_fee.is_exit_sunk,
                'base_exit_date': dd_fee.exit_date, # Need this to locate the old fee
                'base_exit_amount': float(dd_fee.exit_amount) # Need this to subtract it
            }
        except ScenarioDueDiligenceFee.DoesNotExist:
            return {
                'entry_fee_pct': 0.0, 'exit_fee_pct': 0.0,
                'is_entry_sunk': False, 'is_exit_sunk': False,
                'base_exit_date': None, 'base_exit_amount': 0.0
            }

    def _apply_dd_fee_in_place(self, calls, virtual_exit_date):
        base_dd = self.base_dd_fee
        dd_fee_amt = base_dd.get('base_exit_amount', 0.0)
        
        # A. Reversal
        if not base_dd['is_exit_sunk'] and dd_fee_amt > 0:
            base_year = base_dd['base_exit_date'].year
            base_year_ops = [op for op in calls if op['date'].year == base_year]
            if base_year_ops:
                reduction_per_op = dd_fee_amt / len(base_year_ops)
                for op in base_year_ops:
                    op['flows'] -= reduction_per_op
                    op['dd_fees'] -= reduction_per_op # ADDED
                    op['source_type'] += "_dd_reduced"

        # B. Addition
        is_virtual_sunk = virtual_exit_date is not None and virtual_exit_date < date.today()
        if not is_virtual_sunk and virtual_exit_date:
            virtual_year = virtual_exit_date.year
            new_dd_amt = float(self.base_projection.cost) * (base_dd['exit_fee_pct'] / 100.0)
            virtual_year_ops = [op for op in calls if op['date'].year == virtual_year]
            if virtual_year_ops:
                addition_per_op = new_dd_amt / len(virtual_year_ops)
                for op in virtual_year_ops:
                    op['flows'] += addition_per_op
                    op['dd_fees'] += addition_per_op # ADDED
                    op['source_type'] += "_dd_increased"
        return calls

    def _apply_man_fee_deltas(self, calls, virtual_exit_date):
        base_exit_year = self.base_projection.exit_date.year
        virtual_exit_year = virtual_exit_date.year
        annual_fee = float(self.base_projection.cost) * self.man_fee_rate
        
        start_year = min(base_exit_year, virtual_exit_year)
        end_year = max(base_exit_year, virtual_exit_year)
        
        for year in range(start_year, end_year + 1):
            year_ops = [op for op in calls if op['date'].year == year]
            if not year_ops:
                continue
            
            delta = 0
            if virtual_exit_year > base_exit_year and year > base_exit_year: 
                delta = annual_fee
            elif virtual_exit_year < base_exit_year and year > virtual_exit_year:
                delta = -annual_fee

            if delta != 0:
                split_delta = delta / len(year_ops)
                for op in year_ops:
                    op['flows'] += split_delta
                    op['management_fees'] += split_delta # ADDED
                    op['source_type'] += "_man_fee_adj"
        
        return calls

    def _build_virtual_operations(self, virtual_exit_date, virtual_exit_value):
        # 1. Distributions (Exits)
        dists = self._fetch_static_distributions()
        if virtual_exit_date and virtual_exit_value:
            dists.append({
                'date': virtual_exit_date, 'flows': -virtual_exit_value,
                'type': 'distribution', 'source_type': 'projected_virtual',
                'source_id': self.investment_id
            })

        # 2. Capital Calls (Deltas)
        calls = [dict(op) for op in self.static_capital_calls]
        
        # Apply DD Fee Logic (Shifting the Exit Fee)
        calls = self._apply_dd_fee_in_place(calls, virtual_exit_date)
        
        # Apply Management Fee Logic (Adjusting the Annuity)
        calls = self._apply_man_fee_deltas(calls, virtual_exit_date)
        
        # 3. Final Assembly
        full_ledger = dists + calls
        full_ledger.sort(key=lambda x: x['date'])
        
        # 4. Name Mapping
        for op in full_ledger:
            if op['type'] == 'distribution':
                op['operation_name'] = f"Exit: {self.base_projection.investment.name}" if op.get('source_id') == self.investment_id else "Exit: Portfolio"
            else:
                op['operation_name'] = f"Call ({op['source_type']})"
                
        return full_ledger
    
    def _evaluate_ledger_irrs(self, full_ledger):
        hurdle_rate = self.waterfall_config.get(2, {}).get('rate', 0.08)
        hurdle_participating_classes = self.waterfall_config.get(2, {}).get('classes', self.share_class_names) or self.share_class_names
        catchup_rate = self.waterfall_config.get(3, {}).get('rate', 0.25)

        df = pd.DataFrame(full_ledger)
        df['date'] = pd.to_datetime(df['date'])
        df['date_str'] = df['date'].dt.strftime('%Y-%m-%d')
        
        # Standardize columns to match WaterfallService logic
        df['flow_amount'] = np.where(df['type'] == 'capital_call', df['flows'], df['flows']) 
        
        is_realized = df['source_type'].str.contains('realized', case=False)
        is_call = df['type'] == 'capital_call'
        date_strs = df['date_str']

        # Construct Base Share Class Flows
        for sc in self.share_class_names:
            ratio_sc = self.ratios.get(sc, 0.0)
            col = pd.Series(0.0, index=df.index)
            
            mask_rc = is_realized & is_call
            col[mask_rc] = date_strs[mask_rc].map(lambda d: self.realized_calls.get(d, {}).get(sc, 0.0)).abs()
            
            mask_rd = is_realized & ~is_call
            col[mask_rd] = -date_strs[mask_rd].map(lambda d: self.realized_dists.get(d, {}).get(sc, 0.0)).abs()
            
            mask_p = ~is_realized
            col[mask_p] = df.loc[mask_p, 'flow_amount'] * ratio_sc
            
            df[f'Flows {sc}'] = col

        df['cumulated_capital_call'] = df['flow_amount'].where(is_call, 0.0).cumsum()
        df['cumulated_distribution'] = df['flow_amount'].abs().where(~is_call, 0.0).cumsum()

        # Calculation Loop
        flow_vals = df['flow_amount'].tolist()
        dates = df['date'].tolist()
        sc_flow_cols = {sc: df[f'Flows {sc}'].tolist() for sc in hurdle_participating_classes}
        
        w_balance = sum_u = sum_x = unreturned = 0.0
        prev_date = dates[0]
        x_list, nr_list = [], []

        for i, cur_date in enumerate(dates):
            days = (cur_date - prev_date).days
            year = cur_date.year
            div = 366.0 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 365.0
            tf = days / div
            
            u_int = w_balance * ((1 + hurdle_rate) ** tf - 1)
            sum_u += u_int
            rel_flow = sum(sc_flow_cols[sc][i] for sc in hurdle_participating_classes)
            w_new = w_balance + u_int + rel_flow
            
            x_total = sum_u if (sum_x <= 0.0001 and w_new < -0.01) else 0.0
            sum_x += x_total
            
            f_val = flow_vals[i]
            if f_val > 0:
                unreturned += f_val
                nr = 0.0
            elif f_val < 0:
                repay = min(abs(f_val), unreturned)
                nr = -repay
                unreturned -= repay
            else:
                nr = 0.0
            
            x_list.append(x_total)
            nr_list.append(nr)
            w_balance = w_new
            prev_date = cur_date

        df['Nominal Repayment'] = nr_list
        total_x = sum(x_list)
        cumul_cc = df['cumulated_capital_call'].tolist()
        cumul_dist = df['cumulated_distribution'].tolist()
        
        hurdle_list, catchup_list, special_list = [], [], []
        sum_hurdle = cumul_nr = sum_hurdle_cu = cumul_x = cumul_catchup = 0.0

        for i in range(len(df)):
            cur_nr = nr_list[i]
            cur_x = x_list[i]
            cumul_nr += cur_nr
            
            if cur_x > 0:
                h = -(cur_x + sum_hurdle)
            elif abs(cumul_nr) >= cumul_cc[i] - 0.01:
                if abs(total_x + sum_hurdle) < 0.01: h = 0.0
                else: h = max(-(cumul_dist[i] - cumul_cc[i]), flow_vals[i] - cur_nr)
            else:
                h = 0.0
            hurdle_list.append(h)
            sum_hurdle += h

            sum_hurdle_cu += h
            cumul_x += cur_x
            cu = (-catchup_rate * cur_x if abs(sum_hurdle_cu + cumul_x) < 0.01 else 0.0)
            catchup_list.append(cu)

            cumul_catchup += cu
            if abs(cumul_catchup) < 0.01 or flow_vals[i] >= 0:
                sp = 0.0
            else:
                sp = flow_vals[i] - cur_nr - h - cu
            special_list.append(sp)

        # Aggregations
        total_dists = df[~is_call]['flow_amount'].abs().sum()
        total_calls = df[is_call]['flow_amount'].sum()
        
        nom_rem = total_dists
        nom_ded = min(-sum(nr_list), total_calls)
        hur_rem = max(0, nom_rem - nom_ded)
        hur_ded = min(-sum(hurdle_list), hur_rem)
        cu_rem = max(0, hur_rem - hur_ded)
        cu_ded = min(-sum(catchup_list), cu_rem)
        sp_rem = max(0, cu_rem - cu_ded)
        sp_ded = sp_rem

        kpis = calculate_kpis(self.waterfall_config, self.ratios, nom_rem, nom_ded, hur_rem, hur_ded, cu_rem, cu_ded, sp_rem, sp_ded)

        results = {}
        dates_list = df['date'].dt.to_pydatetime().tolist()

        # Fund Net IRR
        # Negative mapping for LP view: Calls are negative, Dists are positive in XIRR array
        fund_flows = [-f for f in df['flow_amount'].tolist()]
        results['fund_irr_net'] = xirr(fund_flows, dates_list)

        # Share Class IRRs
        for sc in self.share_class_names:
            w_nom = step_class_weight(kpis, 'nominal_repayment', sc)
            w_hur = step_class_weight(kpis, 'hurdle', sc)
            w_cu = step_class_weight(kpis, 'catch_up', sc, True)
            w_sp = step_class_weight(kpis, 'special_return', sc, True)
            
            irr_flow = np.where(
                is_realized.values,
                -df[f'Flows {sc}'].values,
                np.where(
                    df['flow_amount'].values > 0,
                    -df['flow_amount'].values * self.ratios.get(sc, 0.0),
                    -np.array(nr_list)*w_nom - np.array(hurdle_list)*w_hur - np.array(catchup_list)*w_cu - np.array(special_list)*w_sp
                )
            )
            results[f'irr_{sc.replace(" ", "_").lower()}'] = xirr(irr_flow.tolist(), dates_list)

        return results
    
    def generate_matrices(self, moic_inputs, duration_inputs):
        # Initialize dynamic dictionary structure based on share classes
        results = {
            "portfolio_irr": [],
            "fund_irr_net": [],
            "fund_irr_gross": []
        }
        for sc in self.share_class_names:
            results[f"irr_{sc.replace(' ', '_').lower()}"] = []

        for r_idx, duration in enumerate(duration_inputs):
            row_portfolio, row_net, row_gross = [], [], []
            row_sc_irrs = {sc: [] for sc in self.share_class_names}
            
            for c_idx, moic in enumerate(moic_inputs):                
                virtual_exit_date, virtual_exit_value = self._calculate_virtual_exit(moic, duration)
                
                # Portfolio IRR (Base asset level)
                cell_dates = [flow[0] for flow in self.base_investment_flows]
                cell_cashflows = [flow[1] for flow in self.base_investment_flows]
                cell_dates.append(virtual_exit_date)
                cell_cashflows.append(virtual_exit_value)
                
                cell_irr = xirr(cell_cashflows, cell_dates)
                row_portfolio.append(f"{cell_irr * 100:.2f}%" if cell_irr else "0.00%")

                # Build full virtualized timeline
                full_ledger = self._build_virtual_operations(virtual_exit_date, virtual_exit_value)
                
                # Execute waterfall rules to determine LP net yields
                # --- CALCULATE FUND GROSS IRR ---
                gross_dates = []
                gross_flows = []
                
                for op in full_ledger:
                    if op['type'] == 'capital_call':
                        inv_amt = op.get('investment', 0.0)
                        if inv_amt > 0:
                            gross_dates.append(op['date'])
                            # Outflows to buy companies are negative
                            gross_flows.append(-inv_amt) 
                    elif op['type'] == 'distribution':
                        gross_dates.append(op['date'])
                        # Inflows from exiting companies are positive
                        gross_flows.append(abs(op['flows']))
                
                f_gross = xirr(gross_flows, gross_dates)
                row_gross.append(f"{f_gross * 100:.2f}%" if f_gross else "0.00%")
                # --------------------------------

                # Execute waterfall rules to determine LP net yields
                irrs = self._evaluate_ledger_irrs(full_ledger)
                
                f_net = irrs.get('fund_irr_net')
                row_net.append(f"{f_net * 100:.2f}%" if f_net else "0.00%")
                
                for sc in self.share_class_names:
                    sc_irr = irrs.get(f"irr_{sc.replace(' ', '_').lower()}")
                    row_sc_irrs[sc].append(f"{sc_irr * 100:.2f}%" if sc_irr else "0.00%")

            results["portfolio_irr"].append(row_portfolio)
            results["fund_irr_net"].append(row_net)
            results["fund_irr_gross"].append(row_gross)
            for sc in self.share_class_names:
                results[f"irr_{sc.replace(' ', '_').lower()}"].append(row_sc_irrs[sc])

        return results
    
class TargetModeService:
    def __init__(self, fund_id, scenario_id):
        self.fund_id = fund_id
        self.scenario_id = scenario_id
        
        print(f"\n--- [TARGET MODE DEBUG START] Fund: {fund_id} | Scenario: {scenario_id} ---")

        # 1. Prefetch config
        self.waterfall_config = fetch_waterfall_config(fund_id)
        self.ratios, self.share_class_names = fetch_commitments_and_ratios(fund_id, scenario_id)
        self.realized_calls, self.realized_dists = fetch_realized_lookups(fund_id)
        
        # 2. Fetch ledger
        self.static_capital_calls = fetch_static_capital_calls(fund_id, scenario_id)
        self.static_distributions = self._fetch_static_distributions()
        
        # 3. Fetch costs
        self.investment_costs = self._fetch_investment_costs()
        
        # EXECUTE DEBUG PRINT
        self.debug_print_state()

    def debug_print_state(self):
        print(f"Share Classes Found: {self.share_class_names}")
        print(f"Ratios: {self.ratios}")
        
        print(f"Static Capital Calls Count: {len(self.static_capital_calls)}")
        if self.static_capital_calls:
            print(f"Sample Call: {self.static_capital_calls[0]}")
            
        print(f"Static Distributions Count: {len(self.static_distributions)}")
        if self.static_distributions:
            print(f"Sample Dist: {self.static_distributions[0]}")
            
        print(f"Investment Costs Map: {self.investment_costs}")
        
        # Check for None values in costs which usually trigger the error you saw
        none_costs = [k for k, v in self.investment_costs.items() if v is None]
        if none_costs:
            print(f"CRITICAL: Found None costs for investment IDs: {none_costs}")
        
        print(f"--- [DEBUG END] ---\n")


    def calculate_preview(self, target_kpi_type, target_kpi_value, unlocked_ids, tol=0.0001, max_iter=50):
        low_moic = 0.0
        high_moic = 50.0 
        
        # 1. Evaluate boundaries
        kpi_low = self._simulate_kpi(low_moic, unlocked_ids, target_kpi_type)
        kpi_high = self._simulate_kpi(high_moic, unlocked_ids, target_kpi_type)
        
        # Debugging the search space
        print(f"DEBUG: Search Range: [{low_moic}x : {kpi_low}] to [{high_moic}x : {kpi_high}] | Target: {target_kpi_value}")

        # 2. Check if target is reachable
        min_reach = min(kpi_low, kpi_high)
        max_reach = max(kpi_low, kpi_high)
        
        if not (min_reach <= target_kpi_value <= max_reach):
            raise ValueError(
                f"Target {target_kpi_type} of {target_kpi_value} is mathematically unreachable. "
                f"With current unlocked deals, the range is {round(min_reach, 4)} to {round(max_reach, 4)}."
            )

        optimal_moic = 0.0

        # 3. Bisection Loop
        for i in range(max_iter):
            mid_moic = (low_moic + high_moic) / 2.0
            current_kpi = self._simulate_kpi(mid_moic, unlocked_ids, target_kpi_type)
            
            error = current_kpi - target_kpi_value
            
            # Print progress every 5 iterations to monitor convergence
            if i % 5 == 0:
                print(f"Iteration {i}: MOIC {round(mid_moic, 4)} -> KPI {round(current_kpi, 4)}")

            if abs(error) < tol:
                optimal_moic = mid_moic
                break
            
            # Since MOIC and IRR/TVPI/Dist are positively correlated:
            if current_kpi < target_kpi_value:
                low_moic = mid_moic
            else:
                high_moic = mid_moic
                
        if optimal_moic == 0.0:
            optimal_moic = (low_moic + high_moic) / 2.0

        print(f"SUCCESS: Found Optimal MOIC: {round(optimal_moic, 4)}")
        
        return {
            "optimal_moic": round(optimal_moic, 4),
            "investments": self._generate_investment_preview(unlocked_ids, optimal_moic)
        }

    def _simulate_kpi(self, test_moic, unlocked_ids, target_kpi_type):
        virtual_dists = []
        
        for dist in self.static_distributions:
            d_copy = dist.copy()
            source_id = d_copy.get('source_id')
            
            if source_id in unlocked_ids and d_copy.get('source_type') == 'projected':
                cost = self.investment_costs.get(source_id, 0.0)
                # Ensure flows are negative for distributions in your ledger structure
                d_copy['flows'] = -(float(cost or 0) * test_moic)
                
            virtual_dists.append(d_copy)
            
        full_ledger = [dict(c) for c in self.static_capital_calls] + virtual_dists
        full_ledger.sort(key=lambda x: x['date'])
        
        results = self._evaluate_ledger_irrs(full_ledger)
        val = results.get(target_kpi_type)

        if val is None:
            # Logic: If xirr fails at a high MOIC, assume the KPI is very high.
            # If it fails at a low MOIC, assume it's very low.
            return 10.0 if test_moic > 5.0 else -0.9999
            
        return float(val)

    def _generate_investment_preview(self, unlocked_ids, optimal_moic):
        qs = ScenarioPortfolioProjection.objects.filter(
            scenario_id=self.scenario_id,
            investment_id__in=unlocked_ids
        ).select_related('investment')

        preview = []
        for proj in qs:
            cost = float(proj.cost or 0.0)
            preview.append({
                "projection_id": proj.projection_id, # CRITICAL: used for the updateProjection call
                "investment_id": proj.investment_id,
                "name": proj.investment.name, 
                "current_moic": float(proj.input_moic or 0.0),
                "suggested_moic": round(optimal_moic, 4),
                "cost": cost,
                "suggested_exit_value": round(cost * optimal_moic, 2)
            })
        return preview

    # ==========================================================
    # YOUR EXACT WATERFALL ENGINE (With TVPI/Total Dist added)
    # ==========================================================

    def _evaluate_ledger_irrs(self, full_ledger):
        hurdle_rate = self.waterfall_config.get(2, {}).get('rate', 0.08)
        hurdle_participating_classes = self.waterfall_config.get(2, {}).get('classes', self.share_class_names) or self.share_class_names
        catchup_rate = self.waterfall_config.get(3, {}).get('rate', 0.25)

        df = pd.DataFrame(full_ledger)
        df['date'] = pd.to_datetime(df['date'])
        df['date_str'] = df['date'].dt.strftime('%Y-%m-%d')
        
        df['flow_amount'] = np.where(df['type'] == 'capital_call', df['flows'], df['flows']) 
        
        is_realized = df['source_type'].str.contains('realized', case=False)
        is_call = df['type'] == 'capital_call'
        date_strs = df['date_str']

        for sc in self.share_class_names:
            ratio_sc = self.ratios.get(sc, 0.0)
            col = pd.Series(0.0, index=df.index)
            
            mask_rc = is_realized & is_call
            col[mask_rc] = date_strs[mask_rc].map(lambda d: self.realized_calls.get(d, {}).get(sc, 0.0)).abs()
            
            mask_rd = is_realized & ~is_call
            col[mask_rd] = -date_strs[mask_rd].map(lambda d: self.realized_dists.get(d, {}).get(sc, 0.0)).abs()
            
            mask_p = ~is_realized
            col[mask_p] = df.loc[mask_p, 'flow_amount'] * ratio_sc
            
            df[f'Flows {sc}'] = col

        df['cumulated_capital_call'] = df['flow_amount'].where(is_call, 0.0).cumsum()
        df['cumulated_distribution'] = df['flow_amount'].abs().where(~is_call, 0.0).cumsum()

        flow_vals = df['flow_amount'].tolist()
        dates = df['date'].tolist()
        sc_flow_cols = {sc: df[f'Flows {sc}'].tolist() for sc in hurdle_participating_classes}
        
        w_balance = sum_u = sum_x = unreturned = 0.0
        prev_date = dates[0]
        x_list, nr_list = [], []

        for i, cur_date in enumerate(dates):
            days = (cur_date - prev_date).days
            year = cur_date.year
            div = 366.0 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 365.0
            tf = days / div
            
            u_int = w_balance * ((1 + hurdle_rate) ** tf - 1)
            sum_u += u_int
            rel_flow = sum(sc_flow_cols[sc][i] for sc in hurdle_participating_classes)
            w_new = w_balance + u_int + rel_flow
            
            x_total = sum_u if (sum_x <= 0.0001 and w_new < -0.01) else 0.0
            sum_x += x_total
            
            f_val = flow_vals[i]
            if f_val > 0:
                unreturned += f_val
                nr = 0.0
            elif f_val < 0:
                repay = min(abs(f_val), unreturned)
                nr = -repay
                unreturned -= repay
            else:
                nr = 0.0
            
            x_list.append(x_total)
            nr_list.append(nr)
            w_balance = w_new
            prev_date = cur_date

        df['Nominal Repayment'] = nr_list
        total_x = sum(x_list)
        cumul_cc = df['cumulated_capital_call'].tolist()
        cumul_dist = df['cumulated_distribution'].tolist()
        
        hurdle_list, catchup_list, special_list = [], [], []
        sum_hurdle = cumul_nr = sum_hurdle_cu = cumul_x = cumul_catchup = 0.0

        for i in range(len(df)):
            cur_nr = nr_list[i]
            cur_x = x_list[i]
            cumul_nr += cur_nr
            
            if cur_x > 0:
                h = -(cur_x + sum_hurdle)
            elif abs(cumul_nr) >= cumul_cc[i] - 0.01:
                if abs(total_x + sum_hurdle) < 0.01: h = 0.0
                else: h = max(-(cumul_dist[i] - cumul_cc[i]), flow_vals[i] - cur_nr)
            else:
                h = 0.0
            hurdle_list.append(h)
            sum_hurdle += h

            sum_hurdle_cu += h
            cumul_x += cur_x
            cu = (-catchup_rate * cur_x if abs(sum_hurdle_cu + cumul_x) < 0.01 else 0.0)
            catchup_list.append(cu)

            cumul_catchup += cu
            if abs(cumul_catchup) < 0.01 or flow_vals[i] >= 0:
                sp = 0.0
            else:
                sp = flow_vals[i] - cur_nr - h - cu
            special_list.append(sp)

        total_dists = df[~is_call]['flow_amount'].abs().sum()
        total_calls = df[is_call]['flow_amount'].sum()
        
        nom_rem = total_dists
        nom_ded = min(-sum(nr_list), total_calls)
        hur_rem = max(0, nom_rem - nom_ded)
        hur_ded = min(-sum(hurdle_list), hur_rem)
        cu_rem = max(0, hur_rem - hur_ded)
        cu_ded = min(-sum(catchup_list), cu_rem)
        sp_rem = max(0, cu_rem - cu_ded)
        sp_ded = sp_rem

        kpis = calculate_kpis(self.waterfall_config, self.ratios, nom_rem, nom_ded, hur_rem, hur_ded, cu_rem, cu_ded, sp_rem, sp_ded)

        results = {}
        dates_list = df['date'].dt.to_pydatetime().tolist()

        fund_flows = [-f for f in df['flow_amount'].tolist()]
        results['fund_irr_net'] = xirr(fund_flows, dates_list)
        results['fund_total_distributed'] = total_dists
        results['fund_tvpi'] = total_dists / total_calls if total_calls else 0.0

        for sc in self.share_class_names:
            sc_key = sc.replace(" ", "_").lower()
            w_nom = step_class_weight(kpis, 'nominal_repayment', sc)
            w_hur = step_class_weight(kpis, 'hurdle', sc)
            w_cu = step_class_weight(kpis, 'catch_up', sc, True)
            w_sp = step_class_weight(kpis, 'special_return', sc, True)
            
            irr_flow = np.where(
                is_realized.values,
                -df[f'Flows {sc}'].values,
                np.where(
                    df['flow_amount'].values > 0,
                    -df['flow_amount'].values * self.ratios.get(sc, 0.0),
                    -np.array(nr_list)*w_nom - np.array(hurdle_list)*w_hur - np.array(catchup_list)*w_cu - np.array(special_list)*w_sp
                )
            )
            results[f'irr_{sc_key}'] = xirr(irr_flow.tolist(), dates_list)
            
            # Add TVPI and Total Dist for Share Classes
            sc_dist = sum(f for f in irr_flow if f > 0)
            sc_call = abs(sum(f for f in irr_flow if f < 0))
            results[f'total_distributed_{sc_key}'] = sc_dist
            results[f'tvpi_{sc_key}'] = sc_dist / sc_call if sc_call else 0.0

        return results

    # ==========================================================
    # DATA FETCHERS (Simplified versions of your existing ones)
    # ==========================================================

    def _fetch_investment_costs(self):
        qs = ScenarioPortfolioProjection.objects.filter(scenario_id=self.scenario_id).values_list('investment_id', 'cost')
        return {r[0]: float(r[1] or 0.0) for r in qs}

    def _fetch_static_distributions(self):
        # We fetch ALL base distributions, we do not exclude anything since we will
        # overwrite the 'flows' in memory for the unlocked IDs
        qs = ScenarioFundflowsDistributionSummary.objects.filter(
            fund_id=self.fund_id,
            scenario_id=self.scenario_id
        ).exclude(source_type='projected_placeholder')

        return [
            {
                'summary_id': r['summary_id'],
                'date': r['date'],
                'flows': -float(r['flows']), 
                'type': 'distribution',
                'source_type': r['source_type'],
                'source_id': r['source_id']
            }
            for r in qs.values('summary_id', 'date', 'flows', 'source_type', 'source_id')
        ]
    
class SynthesisKPIService:
    def __init__(self, fund_id, scenario_ids):
        self.fund_id = fund_id
        self.scenario_ids = scenario_ids
        
        # Map string names to DB IDs for frontend blueprint alignment
        self.sc_map = {
            sc.share_class_name: sc.share_class_id 
            for sc in ShareClass.objects.filter(fund_id=fund_id)
        }
        

    def process_single_scenario(self, scenario_id):
        waterfall = WaterfallService(fund_id=self.fund_id, scenario_id=scenario_id)
        sim_data = waterfall.run_simulation()

        if not sim_data:
            return {scenario_id: {}}

        performance = sim_data.get('simulation_results', {}).get('performance', {})
        kpis = sim_data.get('kpis', {})
        allocations = sim_data.get('simulation_results', {}).get('allocations', {})

        metrics = {
            "irr_net": performance.get('Fund', {}).get('IRR'),
            "tvpi_fund": performance.get('Fund', {}).get('TVPI'),
            "hurdle": float(kpis.get('hurdle', {}).get('to_deduct', 0.0)),
            "distributed_total": float(allocations.get('Fund', {}).get('Total', 0.0)),
        }

        # Filter active classes via provided function
        _, active_sc_names = fetch_commitments_and_ratios(self.fund_id, scenario_id)

        for sc_name in active_sc_names:
            sc_id = self.sc_map.get(sc_name)
            if sc_id:
                sc_perf = performance.get(sc_name, {})
                metrics[f"irr_share_{sc_id}"] = sc_perf.get('IRR')
                metrics[f"tvpi_share_{sc_id}"] = sc_perf.get('TVPI')

        return {scenario_id: metrics}

    def generate_synthesis_matrix(self):
        scenario_results = {}
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            results = executor.map(self.process_single_scenario, self.scenario_ids)
            for res in results:
                scenario_results.update(res)

        formatted_kpis = [
            self._build_kpi_row('irr_net', 'Fund Net IRR', 'pct', scenario_results, 'irr_net'),
            self._build_kpi_row('tvpi_fund', 'Fund TVPI', 'multiple', scenario_results, 'tvpi_fund'),
            self._build_kpi_row('hurdle', 'Hurdle', 'number', scenario_results, 'hurdle'),
            self._build_kpi_row('distributed_total', 'Total distributed', 'number', scenario_results, 'distributed_total'),
        ]

        # Iterate global map to ensure all frontend blueprint rows receive a key
        for sc_name, sc_id in self.sc_map.items():
            formatted_kpis.append(
                self._build_kpi_row(f"irr_share_{sc_id}", f"{sc_name} IRR", 'pct', scenario_results, f"irr_share_{sc_id}")
            )
            formatted_kpis.append(
                self._build_kpi_row(f"tvpi_share_{sc_id}", f"{sc_name} TVPI", 'multiple', scenario_results, f"tvpi_share_{sc_id}")
            )

        return formatted_kpis

    def _build_kpi_row(self, kpi_id, name, kpi_type, scenario_results, data_key):
        return {
            "id": kpi_id,
            "name": name,
            "type": kpi_type,
            "data": {str(sid): scenario_results.get(sid, {}).get(data_key) for sid in self.scenario_ids}
        }