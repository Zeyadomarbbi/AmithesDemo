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
    help = 'Previews Cash Flows with Splits, Hurdle Interest, and Nominal Repayment'

    def add_arguments(self, parser):
        parser.add_argument('fund_id', type=int)
        parser.add_argument('scenario_id', type=int)

    def handle(self, *args, **options):
        fund_id = options['fund_id']
        scenario_id = options['scenario_id']

        self.stdout.write(self.style.SUCCESS(f"\nFETCHING DATA FOR FUND: {fund_id}, SCENARIO: {scenario_id}"))
        self.stdout.write("="*100)

        # ==============================================================================
        # 0. FETCH COMMITMENTS & CALCULATE RATIOS
        # ==============================================================================
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
                    print(f" > {name:<20}: {ratio:.4%} (Projected Basis)")
            else:
                self.stdout.write(self.style.WARNING("No commitment data found. Projected ratios defaulting to 0."))

        # ==============================================================================
        # 0.5. FETCH REALIZED SPLITS & HURDLE CONFIG
        # ==============================================================================
        self.stdout.write("\n[0.5] REALIZED CONFIG & HURDLE RULES")
        self.stdout.write("-" * 100)
        
        # A. Realized Lookups
        query_realized = """
            SELECT 
                d.due_date,
                sc.share_class_name,
                SUM(a.capital_call) as total_amount
            FROM lps_operation_lp_allocations a
            JOIN lps_operation_details d ON a.lps_operation_details_id = d.lps_operation_details_id
            JOIN share_class sc ON a.share_class_id = sc.share_class_id
            WHERE d.fund_id = %s
            GROUP BY d.due_date, sc.share_class_name;
        """
        realized_lookup = {}
        with connection.cursor() as cursor:
            cursor.execute(query_realized, [fund_id])
            for row in cursor.fetchall():
                r_date = str(row[0])
                r_class = row[1]
                r_amount = float(row[2]) if row[2] else 0.0
                if r_date not in realized_lookup: realized_lookup[r_date] = {}
                realized_lookup[r_date][r_class] = r_amount

        # B. Hurdle Configuration (Rate & Flags)
        hurdle_rate = 0.08 # Default
        flag_class_a = True
        flag_class_b = False

        # Fetch Step 2 (Hurdle) Config
        step2 = FundWaterfallSteps.objects.filter(
            fund_id=fund_id, 
            step_definition__step_number=2
        ).first()

        if step2:
            if step2.step_rate is not None:
                hurdle_rate = float(step2.step_rate) / 100.0
            
            # Check Rules
            rules = FundWaterfallStepRules.objects.filter(fund_waterfall_step=step2, is_selected=True).select_related('share_class')
            # Reset defaults if rules exist
            if rules.exists():
                flag_class_a = False
                flag_class_b = False
                for r in rules:
                    if "Class A" in r.share_class.share_class_name: flag_class_a = True
                    if "Class B" in r.share_class.share_class_name: flag_class_b = True
        
        print(f" > Hurdle Rate: {hurdle_rate:.2%}")
        print(f" > Include Class A in Hurdle: {flag_class_a}")
        print(f" > Include Class B in Hurdle: {flag_class_b}")


        # ==============================================================================
        # 1. GENERATE CASH FLOW SKELETON
        # ==============================================================================
        self.stdout.write("\n[1] MERGING DATA & CALCULATING SPLITS")
        self.stdout.write("-" * 100)

        # Fetch Data
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
        # APPLY SPLIT LOGIC
        # ---------------------------------------------------------
        def calculate_split(row, target_class_keyword):
            if 'realized' in row['source_type'].lower():
                date_str = row['date'].strftime('%Y-%m-%d')
                if date_str in realized_lookup:
                    day_data = realized_lookup[date_str]
                    for class_name_key, amount in day_data.items():
                        if target_class_keyword.lower() in class_name_key.lower():
                            if row['type'] == 'distribution': return -abs(amount)
                            return abs(amount)
                    return 0.0
                return 0.0
            else:
                ratio = 0.0
                for key, val in ratios.items():
                    if target_class_keyword.lower() in key.lower(): 
                        ratio = val
                        break
                return row['flow_amount'] * ratio

        df['Flows Class A'] = df.apply(lambda x: calculate_split(x, 'Class A'), axis=1)
        df['Flows Class B'] = df.apply(lambda x: calculate_split(x, 'Class B'), axis=1)

        # Cumulative Calculations (Standard)
        df['cumulated_flows'] = df['flow_amount'].cumsum()
        df['cumulated_capital_call'] = df.apply(lambda x: x['flow_amount'] if x['type'] == 'capital_call' else 0, axis=1).cumsum()
        df['cumulated_distribution'] = df.apply(lambda x: abs(x['flow_amount']) if x['type'] == 'distribution' else 0, axis=1).cumsum()

        # ==============================================================================
        # 2. CALCULATE INTEREST & BALANCES (W, U, X) & NOMINAL REPAYMENT
        # ==============================================================================
        
        # Output Lists
        u_list = [] # Periodic Interest
        w_list = [] # Cumul Flows w/ Interest (Balance)
        x_list = [] # Total Interest (One-time Trigger)
        nr_list = [] # Nominal Repayment

        # State Variables
        w_balance = 0.0
        sum_u = 0.0
        sum_x = 0.0
        unreturned_capital_balance = 0.0 # Bucket for Nominal Repayment logic
        
        prev_date = df['date'].iloc[0] 

        for index, row in df.iterrows():
            current_date = row['date']
            flow_val = row['flow_amount']
            
            # --- A. Time Factor (Leap Year Logic) ---
            days_diff = (current_date - prev_date).days
            year = current_date.year
            is_leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)
            divisor = 366.0 if is_leap else 365.0
            time_factor = days_diff / divisor

            # --- B. Periodic Interest (U) ---
            # U = W_prev * ((1+r)^t - 1)
            u_interest = w_balance * ((1 + hurdle_rate) ** time_factor - 1)
            sum_u += u_interest

            # --- C. Cumul Flows w/ Interest (W) ---
            # W = W_prev + U + Relevant_Flows
            relevant_flow = 0.0
            if flag_class_a: relevant_flow += row['Flows Class A']
            if flag_class_b: relevant_flow += row['Flows Class B']

            w_new = w_balance + u_interest + relevant_flow

            # --- D. Total Interests (X) ---
            x_total_interest = 0.0
            if sum_x > 0.0001: 
                x_total_interest = 0.0
            elif w_new < -0.01: # Repaid
                x_total_interest = sum_u
            else:
                x_total_interest = 0.0
            sum_x += x_total_interest

            # --- E. Nominal Repayment (Return of Capital) ---
            nominal_repayment = 0.0
            if flow_val > 0:
                # Capital Call -> Fill Bucket
                unreturned_capital_balance += flow_val
                nominal_repayment = 0.0
            elif flow_val < 0:
                # Distribution -> Empty Bucket
                dist_amount = abs(flow_val)
                # Pay as much as possible up to unreturned balance
                repayment = min(dist_amount, unreturned_capital_balance)
                nominal_repayment = -repayment
                unreturned_capital_balance -= repayment

            # Store
            u_list.append(u_interest)
            w_list.append(w_new)
            x_list.append(x_total_interest)
            nr_list.append(nominal_repayment)

            # Update State
            w_balance = w_new
            prev_date = current_date

        # Assign to DataFrame
        df['Interests'] = u_list
        df['Cumul flows w/ Int'] = w_list
        df['Total Interests'] = x_list
        df['Nominal Repayment'] = nr_list

        # ---------------------------------------------------------
        # FORMAT OUTPUT
        # ---------------------------------------------------------
        df_preview = df[[
            'date', 'operation_name', 'flow_amount', 'cumulated_flows', 
            'Flows Class A', 'Flows Class B',
            'Interests', 'Cumul flows w/ Int', 'Total Interests',
            'cumulated_capital_call', 'cumulated_distribution', 'Nominal Repayment'
        ]].copy()

        df_preview.columns = [
            'Date', 'Name of Operation', 'Flows', 'Cumul Flows', 
            'Class A', 'Class B',
            'Interests', 'Cumulated Interests', 'Total Interests',
            'Cumulated Capital Call', 'Cumulated Distribution', 'Nominal Repayment'
        ]

        def fmt(x): return '{:,.2f}'.format(x)

        for col in df_preview.columns[2:]: # Format all numeric columns
            df_preview[col] = df_preview[col].apply(fmt)

        print(df_preview.to_string(index=False))
        print("-" * 120 + "\n")