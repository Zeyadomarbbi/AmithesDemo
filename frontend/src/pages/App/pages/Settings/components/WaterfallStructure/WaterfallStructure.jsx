// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/WaterfallStructure.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import { useFundWaterfallSteps } from "../../../../hooks/Waterfall/useFundWaterfallSteps.js";

import Step1 from "./components/Step1";
import Step2 from "./components/Step2";
import Step3 from "./components/Step3";
import Step4 from "./components/Step4";

import "./WaterfallStructure.css";

const WaterfallStructure = () => {
    const { fundId } = useOutletContext();

    const { data: shareClasses, isLoading: scLoading } = useShareClasses(fundId);
    const { fetchFundSteps, createStep, updateStep, isLoading: wfLoading } = useFundWaterfallSteps();

    const isSaving = wfLoading;

  /* =======================
     1. Canonical State Shape
     ======================= */

    const createDefaultStepState = (step_name, step_rate = "") => ({
      id: null,
      step_name,
      step_rate,
      rules: {}, // Initialize Global Rules container
      envelopes: []
    });

    const [step1Data, setStep1Data] = useState({
      id: null,
      step_name: "Nominal Repayment",
      step_rate: "",
      rules: {}
      // No rules, no envelopes
    });
    const [step2Data, setStep2Data] = useState({
      id: null,
      step_name: "Hurdle",
      step_rate: "",
      rules: {}
      // No envelopes
    });
    const [step3Data, setStep3Data] = useState(
      createDefaultStepState("Catch-up")
    );
    const [step4Data, setStep4Data] = useState({
      id: null,
      step_name: "Special Return",
      step_rate: "",
      envelopes: []
      // No step-level rules
    });

    /* =======================
      2. Backend → Frontend
      ======================= */

    const mapBackendToState = useCallback((backendStep, stepNumber) => {
      const base = {
        id: backendStep.fund_waterfall_step_id,
        step_name: backendStep.step_name,
        step_rate: backendStep.step_rate ?? "",
      };

      // Step 1: nothing extra
      if (stepNumber === 1) return {
        ...base,
        rules: backendStep.rules || {} 
      }

      // Step 2: rules only
      if (stepNumber === 2) {
        return { ...base, rules: backendStep.rules || {} };
      }

      // Step 3: rules + envelopes
      if (stepNumber === 3) {
        const envMap = {};
        backendStep.envelopes.forEach((env) => {
          envMap[env.envelope_number] = {
            id: env.waterfall_envelope_id,
            number: env.envelope_number,
            allocation: env.allocation_percentage ?? "",
            rules: env.rules || {},
          };
        });
        return {
          ...base,
          rules: backendStep.rules || {},
          envelopes: [
            envMap[1] ?? { id: null, number: 1, allocation: "", rules: {} },
            envMap[2] ?? { id: null, number: 2, allocation: "", rules: {} },
          ],
        };
      }

      // Step 4: envelopes only (no step-level rules)
      if (stepNumber === 4) {
        const envMap = {};
        backendStep.envelopes.forEach((env) => {
          envMap[env.envelope_number] = {
            id: env.waterfall_envelope_id,
            number: env.envelope_number,
            allocation: env.allocation_percentage ?? "",
            rules: env.rules || {},
          };
        });
        return {
          ...base,
          envelopes: [
            envMap[1] ?? { id: null, number: 1, allocation: "", rules: {} },
            envMap[2] ?? { id: null, number: 2, allocation: "", rules: {} },
          ],
        };
      }
    }, []);
    /* =======================
      3. Load Existing Data
      ======================= */

    useEffect(() => {
      if (!fundId || scLoading) return;

      const loadData = async () => {
        const dbSteps = await fetchFundSteps(fundId);

        const s1 = dbSteps.find((s) => s.step_number === 1);
        if (s1) setStep1Data(mapBackendToState(s1, 1));
        console.log("Loaded Step 1 Data:", mapBackendToState(s1, 1));
        const s2 = dbSteps.find((s) => s.step_number === 2);
        if (s2) setStep2Data(mapBackendToState(s2, 2));
        const s3 = dbSteps.find((s) => s.step_number === 3);
        if (s3) setStep3Data(mapBackendToState(s3, 3));
        const s4 = dbSteps.find((s) => s.step_number === 4);
        if (s4) setStep4Data(mapBackendToState(s4, 4));
      };

      loadData();
    }, [fundId, scLoading, fetchFundSteps, mapBackendToState]);

    /* =======================
      4. Save / Upsert Logic
      ======================= */

    const handleSave = async () => {
      try {
        const formatPayload = (stepDefinitionId, stateData, stepNumber) => {
          const base = {
            fund: fundId,
            step_definition: stepDefinitionId,
            step_name: stateData.step_name,
            step_rate: stateData.step_rate === "" ? null : Number(stateData.step_rate),
          };

          // Step 1: nothing extra
          if (stepNumber === 1) return { ...base, rules: stateData.rules || {} };

          // Step 2: rules only
          if (stepNumber === 2) {
            return { ...base, rules: stateData.rules || {} };
          }

          // Step 3: rules + envelopes
          if (stepNumber === 3) {
            return {
              ...base,
              rules: stateData.rules || {},
              envelopes: stateData.envelopes.map((env) => ({
                envelope_number: env.number,
                allocation_percentage: env.allocation === "" ? 0 : Number(env.allocation),
                rules: env.rules || {},
              })),
            };
          }

          // Step 4: envelopes only
          if (stepNumber === 4) {
            return {
              ...base,
              envelopes: stateData.envelopes.map((env) => ({
                envelope_number: env.number,
                allocation_percentage: env.allocation === "" ? 0 : Number(env.allocation),
                rules: env.rules || {},
              })),
            };
          }
        };
        const p1 = formatPayload(1, step1Data, 1);
        console.log("Payload Step 1:", p1);
        const p2 = formatPayload(2, step2Data, 2);
        const p3 = formatPayload(3, step3Data, 3);
        const p4 = formatPayload(4, step4Data, 4);
        const results = await Promise.all([
          step1Data.id
            ? updateStep(fundId, step1Data.id, p1)
            : createStep(fundId, p1),
          step2Data.id
            ? updateStep(fundId, step2Data.id, p2)
            : createStep(fundId, p2),
          step3Data.id
            ? updateStep(fundId, step3Data.id, p3)
            : createStep(fundId, p3),
          step4Data.id
            ? updateStep(fundId, step4Data.id, p4)
            : createStep(fundId, p4),
        ]);

        if (results[0]) setStep1Data(mapBackendToState(results[0]));
        if (results[1]) setStep2Data(mapBackendToState(results[1]));
        if (results[2]) setStep3Data(mapBackendToState(results[2]));
        if (results[3]) setStep4Data(mapBackendToState(results[3]));
        console.log("Save Successful:", results);
      } catch (err) {
        console.error("Save Error:", err);
      }
    };

    if (scLoading) return <div>Loading Share Classes...</div>;

  return (
    <div className="wf-wrapper">
      <div className="wf-content">
        <Step1 values={step1Data} onChange={setStep1Data} shareClasses={shareClasses} />
        <Step2 values={step2Data} onChange={setStep2Data} shareClasses={shareClasses} />
        <Step3 values={step3Data} onChange={setStep3Data} shareClasses={shareClasses} />
        <Step4 values={step4Data} onChange={setStep4Data} shareClasses={shareClasses} />
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
