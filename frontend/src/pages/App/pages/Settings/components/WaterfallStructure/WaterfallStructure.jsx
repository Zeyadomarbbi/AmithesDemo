// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/WaterfallStructure.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import { useFundWaterfallSteps } from "../../../../hooks/Waterfall/useFundWaterfallSteps.js";

// Components for each specific UI layout
import Step1 from "./components/Step1";
import Step2 from "./components/Step2";
import Step3 from "./components/Step3";
import Step4 from "./components/Step4";

import "./WaterfallStructure.css";

const WaterfallStructure = () => {
    const { fundId } = useOutletContext();

    // 1. Hooks
    const { data: shareClasses, isLoading: scLoading } = useShareClasses(fundId);
    const { fetchFundSteps, createStep, updateStep, isLoading: wfLoading } = useFundWaterfallSteps();

    const isSaving = wfLoading; // Alias for UI clarity

    // 2. State Initialization (Empty defaults until data loads)
    // Each step tracks: DB ID, Name, Rate, and Envelopes (1 & 2) with Rules
    const createDefaultStepState = (step_name, hurdle_rate = "") => ({
    id: null, // Backend ID (null = new)
    step_name: step_name,
    hurdle_rate: hurdle_rate,
    envelopes: [
        { number: 1, allocation: "", rules: {} }, // rules: { shareClassId: { isSelected, isProRata, fixed... } }
        { number: 2, allocation: "", rules: {} }
    ]
    });

    const [step1Data, setStep1Data] = useState(createDefaultStepState("Nominal Repayment"));
    const [step2Data, setStep2Data] = useState(createDefaultStepState("Hurdle", ""));
    const [step3Data, setStep3Data] = useState(createDefaultStepState("Catch-up", ""));
    const [step4Data, setStep4Data] = useState(createDefaultStepState("Special Return", ""));

  // 3. Helper: Map Backend Data to Frontend State
  // This takes a "Step" from the DB and formats it for our state
    const mapBackendToState = useCallback((backendStep) => {
        const sortedEnvs = backendStep.envelopes.sort((a, b) => a.envelope_number - b.envelope_number);
        
        const mapRules = (rulesArray) => {
        const rulesObj = {};
        rulesArray.forEach(r => {
            rulesObj[r.share_class] = {
            id: r.waterfall_rule_id, // Updated from r.id
            isSelected: r.is_selected,
            isProRata: r.is_pro_rata,
            fixedPercentage: r.fixed_percentage
            };
        });
        return rulesObj;
        };

        return {
            id: backendStep.fund_waterfall_step_id,
            step_name: backendStep.step_name,
            hurdle_rate: backendStep.hurdle_rate || "",
            envelopes: [
                { 
                number: 1, 
                id: sortedEnvs[0]?.waterfall_envelope_id, // Updated from .id
                allocation: sortedEnvs[0]?.allocation_percentage || 0, 
                rules: mapRules(sortedEnvs[0]?.rules || []) 
                },
                { 
                number: 2, 
                id: sortedEnvs[1]?.waterfall_envelope_id, // Updated from .id
                allocation: sortedEnvs[1]?.allocation_percentage || 0, 
                rules: mapRules(sortedEnvs[1]?.rules || []) 
                }
            ]
        };
    }, []);

  // 4. Load Data Effect
    useEffect(() => {
        if (!fundId || scLoading) return;

        const loadData = async () => {
            const dbSteps = await fetchFundSteps(fundId);
            
            // Map DB steps to specific state buckets based on definition ID (1,2,3,4)
            // Note: Assuming step_definition ID corresponds to step number (1=Nominal, 2=Hurdle...)
            
            const s1 = dbSteps.find(s => s.step_number === 1);
            if (s1) setStep1Data(mapBackendToState(s1));

            const s2 = dbSteps.find(s => s.step_number === 2);
            if (s2) setStep2Data(mapBackendToState(s2));

            const s3 = dbSteps.find(s => s.step_number === 3);
            if (s3) setStep3Data(mapBackendToState(s3));

            const s4 = dbSteps.find(s => s.step_number === 4);
            if (s4) setStep4Data(mapBackendToState(s4));
        };

        loadData();
    }, 
    [fundId, fetchFundSteps, scLoading, mapBackendToState]);

  // 5. Save Handler (The "Upsert" Logic)
  const handleSave = async () => {
    try {
      // Helper to format a single step for the API
        const formatPayload = (stepDefinitionId, stateData) => {
        return {
            fund: fundId, // Add this line to provide the foreign key the backend is missing
            step_definition: stepDefinitionId,
            step_name: stateData.step_name,
            hurdle_rate: stateData.hurdle_rate ? parseFloat(stateData.hurdle_rate) : null,
            envelopes: stateData.envelopes.map(env => ({
            envelope_number: env.number,
            allocation_percentage: parseFloat(env.allocation || 0),
            rules: shareClasses.map(sc => {
                const rule = env.rules[sc.share_class_id] || {};
                return {
                share_class: sc.share_class_id,
                is_selected: !!rule.isSelected,
                is_pro_rata: rule.isProRata !== false,
                fixed_percentage: rule.fixedPercentage ? parseFloat(rule.fixedPercentage) : null
                };
            })
            }))
        };
        };

      const promises = [];

      // --- Process Step 1 ---
        const p1 = formatPayload(1, step1Data);
        const p2 = formatPayload(2, step2Data);
        const p3 = formatPayload(3, step3Data);
        const p4 = formatPayload(4, step4Data);

        // Use update if ID exists, otherwise create
        // Now that constraints are gone, this is the ONLY thing preventing duplicates
        promises.push(step1Data.id ? updateStep(fundId, step1Data.id, p1) : createStep(fundId, p1));
        promises.push(step2Data.id ? updateStep(fundId, step2Data.id, p2) : createStep(fundId, p2));
        promises.push(step3Data.id ? updateStep(fundId, step3Data.id, p3) : createStep(fundId, p3));
        promises.push(step4Data.id ? updateStep(fundId, step4Data.id, p4) : createStep(fundId, p4));

        const results = await Promise.all(promises);

        // Immediately map results back to state to capture new IDs
        if (results[0]) setStep1Data(mapBackendToState(results[0]));
        if (results[1]) setStep2Data(mapBackendToState(results[1]));
        if (results[2]) setStep3Data(mapBackendToState(results[2]));
        if (results[3]) setStep4Data(mapBackendToState(results[3]));

        alert("Saved successfully.");
        } catch (err) {
            console.error("Save Error:", err);
        }
    };
  if (scLoading) return <div>Loading Share Classes...</div>;

  return (
    <div className="wf-wrapper">
      <div className="wf-content">
        
        {/* STEP 1: Nominal Repayment */}
        <Step1
          values={step1Data}
          onChange={setStep1Data}
          shareClasses={shareClasses}
        />

        {/* STEP 2: Hurdle */}
        <Step2 
          values={step2Data}
          onChange={setStep2Data}
          shareClasses={shareClasses}
        />

        {/* STEP 3: Catch-up */}
        <Step3 
          values={step3Data}
          onChange={setStep3Data}
          shareClasses={shareClasses}
        />

        {/* STEP 4: Special Return */}
        <Step4 
          values={step4Data}
          onChange={setStep4Data}
          shareClasses={shareClasses}
        />

      </div>
      <div className="wf-footer">
        <div className="wf-actions">
          <button 
            className="wf-btn-save" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaterfallStructure;