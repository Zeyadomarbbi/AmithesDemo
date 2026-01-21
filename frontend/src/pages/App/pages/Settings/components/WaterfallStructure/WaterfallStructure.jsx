// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/WaterfallStructure.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import { useFundWaterfallSteps } from "../../../../hooks/Waterfall/useFundWaterfallSteps.js";

// Components for each specific UI layout
import Step1 from "./components/Step1";
// import Step2 from "./components/Step2";
// import Step3 from "./components/Step3";
// import Step4 from "./components/Step4";

import "./WaterfallStructure.css";

const WaterfallStructure = () => {
  const { fundId } = useOutletContext();
  
  // 1. Hooks
  const { data: shareClasses, isLoading: scLoading } = useShareClasses(fundId);
  const { fetchFundSteps, createStep, updateStep, isLoading: wfLoading } = useFundWaterfallSteps();

  const isSaving = wfLoading; // Alias for UI clarity

  // 2. State Initialization (Empty defaults until data loads)
  // Each step tracks: DB ID, Name, Rate, and Envelopes (1 & 2) with Rules
  const createDefaultStepState = (name, rate = "") => ({
    id: null, // Backend ID (null = new)
    name: name,
    rate: rate,
    envelopes: [
      { number: 1, allocation: 100, rules: {} }, // rules: { shareClassId: { isSelected, isProRata, fixed... } }
      { number: 2, allocation: 0, rules: {} }
    ]
  });

  const [step1Data, setStep1Data] = useState(createDefaultStepState("Nominal Repayment"));
  const [step2Data, setStep2Data] = useState(createDefaultStepState("Hurdle", "8.00"));
  const [step3Data, setStep3Data] = useState(createDefaultStepState("Catch-up", "25.00"));
  const [step4Data, setStep4Data] = useState(createDefaultStepState("Special Return", ""));

  // 3. Helper: Map Backend Data to Frontend State
  // This takes a "Step" from the DB and formats it for our state
  const mapBackendToState = useCallback((backendStep) => {
    // Sort envelopes to ensure [Env1, Env2] order
    const sortedEnvs = backendStep.envelopes.sort((a, b) => a.envelope_number - b.envelope_number);
    
    // Map rules into a lookup object: { [shareClassId]: ruleObject }
    const mapRules = (rulesArray) => {
      const rulesObj = {};
      rulesArray.forEach(r => {
        rulesObj[r.share_class] = {
          id: r.id,
          isSelected: r.is_selected,
          isProRata: r.is_pro_rata,
          fixedPercentage: r.fixed_percentage
        };
      });
      return rulesObj;
    };

    return {
      id: backendStep.id,
      name: backendStep.name,
      rate: backendStep.rate || "",
      envelopes: [
        { 
          number: 1, 
          allocation: sortedEnvs[0]?.allocation_percentage || 0, 
          rules: mapRules(sortedEnvs[0]?.rules || []) 
        },
        { 
          number: 2, 
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
  }, [fundId, fetchFundSteps, scLoading, mapBackendToState]);


  // 5. Save Handler (The "Upsert" Logic)
  const handleSave = async () => {
    try {
      // Helper to format a single step for the API
      const formatPayload = (stepDefinitionId, stateData) => {
        return {
          step_definition: stepDefinitionId,
          name: stateData.name,
          rate: stateData.rate ? parseFloat(stateData.rate) : null,
          envelopes: stateData.envelopes.map(env => ({
            envelope_number: env.number,
            allocation_percentage: parseFloat(env.allocation || 0),
            rules: shareClasses.map(sc => {
              // Get rule from state, or default to "unchecked/pro-rata" if missing
              const rule = env.rules[sc.share_class_id] || {};
              return {
                share_class: sc.share_class_id,
                is_selected: !!rule.isSelected,
                is_pro_rata: rule.isProRata !== false, // Default true
                fixed_percentage: rule.fixedPercentage ? parseFloat(rule.fixedPercentage) : null
              };
            })
          }))
        };
      };

      const promises = [];

      // --- Process Step 1 ---
      const payload1 = formatPayload(1, step1Data);
      if (step1Data.id) promises.push(updateStep(fundId, step1Data.id, payload1));
      else promises.push(createStep(fundId, payload1));

      // --- Process Step 2 ---
      const payload2 = formatPayload(2, step2Data);
      if (step2Data.id) promises.push(updateStep(fundId, step2Data.id, payload2));
      else promises.push(createStep(fundId, payload2));

      // --- Process Step 3 ---
      const payload3 = formatPayload(3, step3Data);
      if (step3Data.id) promises.push(updateStep(fundId, step3Data.id, payload3));
      else promises.push(createStep(fundId, payload3));

      // --- Process Step 4 ---
      const payload4 = formatPayload(4, step4Data);
      if (step4Data.id) promises.push(updateStep(fundId, step4Data.id, payload4));
      else promises.push(createStep(fundId, payload4));

      await Promise.all(promises);
      alert("Waterfall structure saved successfully!");
      // Optional: Refresh data here
    } catch (err) {
      console.error(err);
      alert("Error saving: " + err.message);
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
        {/* <Step2 
          values={step2Data}
          onChange={setStep2Data}
          shareClasses={shareClasses}
        /> */}

        {/* STEP 3: Catch-up */}
        {/* <Step3 
          values={step3Data}
          onChange={setStep3Data}
          shareClasses={shareClasses}
        /> */}

        {/* STEP 4: Special Return */}
        {/* <Step4 
          values={step4Data}
          onChange={setStep4Data}
          shareClasses={shareClasses}
        /> */}

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