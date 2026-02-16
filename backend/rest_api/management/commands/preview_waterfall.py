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
        self.stdout.write("\n[0.5] REALIZED CONFIG & WATERFALL STEPS")
        self.stdout.write("-" * 100)
        
        # A. Realized Lookups (Kept as is)
        query_realized = """
            SELECT d.due_date, sc.share_class_name, SUM(a.capital_call)
            FROM lps_operation_lp_allocations a
            JOIN lps_operation_details d ON a.lps_operation_details_id = d.lps_operation_details_id
            JOIN share_class sc ON a.share_class_id = sc.share_class_id
            WHERE d.fund_id = %s GROUP BY d.due_date, sc.share_class_name;
        """
        realized_lookup = {}
        with connection.cursor() as cursor:
            cursor.execute(query_realized, [fund_id])
            for row in cursor.fetchall():
                r_date, r_class, r_amount = str(row[0]), row[1], float(row[2]) if row[2] else 0.0
                if r_date not in realized_lookup: realized_lookup[r_date] = {}
                realized_lookup[r_date][r_class] = r_amount

        # B. Waterfall Steps Configuration (Dynamic for all steps)
        # Structure: waterfall_config[step_number] = {'rate': 0.08, 'classes': ['Class A']}
        waterfall_config = {}

        all_steps = FundWaterfallSteps.objects.filter(fund_id=fund_id).select_related('step_definition')

        for step in all_steps:
            s_num = step.step_definition.step_number
            s_rate = float(step.step_rate) / 100.0 if step.step_rate is not None else 0.0
            
            # Fetch active share classes for this specific step
            active_classes = list(FundWaterfallStepRules.objects.filter(
                fund_waterfall_step=step, 
                is_selected=True
            ).values_list('share_class__share_class_name', flat=True))

            waterfall_config[s_num] = {
                'name': step.step_name,
                'rate': s_rate,
                'classes': active_classes
            }

            self.stdout.write(f" > Step {s_num} [{step.step_name}]: Rate={s_rate:.2%}, Classes={active_classes}")

        # Default fallback for Hurdle (Step 2) logic if not found in DB
        hurdle_rate = waterfall_config.get(2, {}).get('rate', 0.08)
        hurdle_classes = waterfall_config.get(2, {}).get('classes', ['Class A'])
        flag_class_a = any("Class A" in c for c in hurdle_classes)
        flag_class_b = any("Class B" in c for c in hurdle_classes)

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
                # ==============================================================================
        # 3. CALCULATE HURDLE
        # ==============================================================================
        
        hurdle_list = []
        sum_hurdle = 0.0
        
        # Get final total interests (sum across all rows)
        total_total_interests = sum(x_list)
        
        for index, row in df.iterrows():
            current_x = x_list[index]
            current_nominal_repayment = nr_list[index]
            current_flow = row['flow_amount']
            
            # Cumulative values up to current row
            cumul_nominal_repayment = sum(nr_list[:index+1])
            cumul_capital_call = row['cumulated_capital_call']
            cumul_distribution = row['cumulated_distribution']
            
            # Branch 1: Total Interests not yet fully paid
            if current_x > 0:
                hurdle = -(current_x + sum_hurdle)
            # Branch 2: Capital fully returned
            elif abs(cumul_nominal_repayment) >= cumul_capital_call - 0.01:
                # Check if all interests paid
                if abs(total_total_interests + sum_hurdle) < 0.01:
                    hurdle = 0.0
                else:
                    arg1 = -(cumul_distribution - cumul_capital_call)
                    arg2 = current_flow - current_nominal_repayment
                    hurdle = max(arg1, arg2)
            # Branch 3: Default
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
            
            # Check if all hurdle paid (cumulative hurdle = -cumulative total interests)
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
            current_nominal_repayment = nr_list[index]
            current_hurdle = hurdle_list[index]
            current_catchup = catchup_list[index]
            
            # Branch 1: Cumulative catch-up = 0
            if abs(cumul_catchup) < 0.01:
                special_return = 0.0
            # Branch 2: Current flow is distribution
            elif current_flow < 0:
                # Sum of all waterfall payments at current row
                waterfall_payments = current_nominal_repayment + current_hurdle + current_catchup
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
        
        # Calculate totals
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


        self.stdout.write(f"\n[STEP 1] NOMINAL REPAYMENT")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {nominal_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {nominal_to_deduct:>20,.2f}")
        
        # Get active classes for Step 1
        step1_classes = waterfall_config.get(1, {}).get('classes', list(ratios.keys()))
        for class_name in step1_classes:
            if class_name in ratios:
                class_allocation = nominal_to_deduct * ratios[class_name]
                self.stdout.write(f"{class_name:<30}: {class_allocation:>20,.2f}")
        
        # Step 2: Hurdle

        self.stdout.write(f"\n[STEP 2] HURDLE")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {hurdle_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {hurdle_to_deduct:>20,.2f}")
        
        # Get active classes for Step 2
        step2_classes = waterfall_config.get(2, {}).get('classes', [])
        # Calculate total ratio for active classes only
        active_ratio_sum = sum(ratios.get(c, 0) for c in step2_classes)
        for class_name in step2_classes:
            if class_name in ratios and active_ratio_sum > 0:
                # Normalize ratio among active classes
                normalized_ratio = ratios[class_name] / active_ratio_sum
                class_allocation = hurdle_to_deduct * normalized_ratio
                self.stdout.write(f"{class_name:<30}: {class_allocation:>20,.2f}")
        
        # Step 3: Catch-up


        self.stdout.write(f"\n[STEP 3] CATCH-UP")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {catchup_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {catchup_to_deduct:>20,.2f}")
        
        # Get active classes for Step 3
        step3_classes = waterfall_config.get(3, {}).get('classes', [])
        active_ratio_sum = sum(ratios.get(c, 0) for c in step3_classes)
        for class_name in step3_classes:
            if class_name in ratios and active_ratio_sum > 0:
                normalized_ratio = ratios[class_name] / active_ratio_sum
                class_allocation = catchup_to_deduct * normalized_ratio
                self.stdout.write(f"{class_name:<30}: {class_allocation:>20,.2f}")
        
        # Step 4: Special Return

        
        self.stdout.write(f"\n[STEP 4] SPECIAL RETURN")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Remaining':<30}: {special_remaining:>20,.2f}")
        self.stdout.write(f"{'To Deduct':<30}: {special_to_deduct:>20,.2f}")
        
        # Get active classes for Step 4
        step4_classes = waterfall_config.get(4, {}).get('classes', list(ratios.keys()))
        if step4_classes:
            active_ratio_sum = sum(ratios.get(c, 0) for c in step4_classes)
            for class_name in step4_classes:
                if class_name in ratios and active_ratio_sum > 0:
                    normalized_ratio = ratios[class_name] / active_ratio_sum
                    class_allocation = special_to_deduct * normalized_ratio
                    self.stdout.write(f"{class_name:<30}: {class_allocation:>20,.2f}")
        
        # ---------------------------------------------------------
        # FORMAT OUTPUT
        # ---------------------------------------------------------
        self.stdout.write("\n" + "="*100)
        self.stdout.write("\n[5] DETAILED CASH FLOW TABLE")
        self.stdout.write("-" * 100 + "\n")
        
        df_preview = df[[
            'date', 'operation_name', 'type', 'flow_amount', 'cumulated_flows', 
            'Flows Class A', 'Flows Class B',
            'Interests', 'Cumul flows w/ Int', 'Total Interests',
            'cumulated_capital_call', 'cumulated_distribution', 
            'Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return'
        ]].copy()
        df_preview.columns = [
            'Date', 'Name of Operation', 'Type', 'Flows', 'Cumul Flows', 
            'Class A', 'Class B',
            'Interests', 'Cumulated Interests', 'Total Interests',
            'Cumulated Capital Call', 'Cumulated Distribution', 
            'Nominal Repayment', 'Hurdle', 'Catch-up', 'Special Return'
        ]
        def fmt(x): return '{:,.2f}'.format(x)
        for col in df_preview.columns[3:]: # Format all numeric columns
            df_preview[col] = df_preview[col].apply(fmt)
        print(df_preview.to_string(index=False))
        print("-" * 120 + "\n")