// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/WaterfallStructure.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import { useFundWaterfallSteps } from "../../../../hooks/Fund/useFundWaterfallSteps.js";
import { PageSpinner, PageError, PageNoData } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";

import Step1 from "./components/Step1";
import Step2 from "./components/Step2";
import Step3 from "./components/Step3";
import Step4 from "./components/Step4";
import Toast from "../../../../components/Toast/Toast.jsx"; 

import "./WaterfallStructure.css";

const WaterfallStructure = () => {
  const { fundId } = useOutletContext();
  const [internalSaving, setInternalSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [toast, setToast] = useState(null); 

  const { data: shareClasses, isLoading: scLoading, error: scError } = useShareClasses(fundId);
  const { fetchFundSteps, createStep, updateStep, isLoading: wfLoading } = useFundWaterfallSteps();

  const isSaving = wfLoading || internalSaving;

  const createDefaultStepState = (step_name, step_rate = "") => ({
    id: null,
    step_name,
    step_rate,
    rules: {},
    envelopes: []
  });

  const [step1Data, setStep1Data] = useState({
    id: null,
    step_name: "Nominal Repayment",
    step_rate: "",
    rules: {}
  });
  const [step2Data, setStep2Data] = useState({
    id: null,
    step_name: "Hurdle",
    step_rate: "",
    rules: {}
  });
  const [step3Data, setStep3Data] = useState(createDefaultStepState("Catch-up"));
  const [step4Data, setStep4Data] = useState({
    id: null,
    step_name: "Special Return",
    step_rate: "",
    envelopes: []
  });

  const mapBackendToState = useCallback((backendStep, stepNumber) => {
    const base = {
      id: backendStep.fund_waterfall_step_id,
      step_name: backendStep.step_name,
      step_rate: backendStep.step_rate ?? "",
    };

    const rulesToDict = (rulesArray) => {
      const dict = {};
      (rulesArray || []).forEach(r => {
        dict[r.share_class] = {
          step_rule_id: r.step_rule_id || r.envelope_rule_id,
          isSelected: r.isSelected,
          isProRata: r.isProRata,
          fixedPercentage: r.fixedPercentage,
        };
      });
      return dict;
    };

    if (stepNumber === 1 || stepNumber === 2) {
      return { ...base, rules: rulesToDict(backendStep.step_rules) };
    }

    if (stepNumber === 3 || stepNumber === 4) {
      const envs = (backendStep.envelopes || []).map(env => ({
        id: env.waterfall_envelope_id,
        number: env.envelope_number,
        allocation: env.allocation_percentage ?? "",
        rules: rulesToDict(env.rules)
      })).sort((a, b) => a.number - b.number);

      const result = { ...base, envelopes: envs };
      if (stepNumber === 3) result.rules = rulesToDict(backendStep.step_rules);
      return result;
    }
  }, []);

  useEffect(() => {
    if (!fundId || scLoading) return;

    const loadData = async () => {
      try {
        const dbSteps = await fetchFundSteps(fundId);
        const s1 = dbSteps.find((s) => s.step_number === 1);
        if (s1) setStep1Data(mapBackendToState(s1, 1));
        const s2 = dbSteps.find((s) => s.step_number === 2);
        if (s2) setStep2Data(mapBackendToState(s2, 2));
        const s3 = dbSteps.find((s) => s.step_number === 3);
        if (s3) setStep3Data(mapBackendToState(s3, 3));
        const s4 = dbSteps.find((s) => s.step_number === 4);
        if (s4) setStep4Data(mapBackendToState(s4, 4));
      } catch (err) {
        setInitError(err.message || "Failed to load waterfall steps");
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [fundId, scLoading, fetchFundSteps, mapBackendToState]);

  const handleSave = async () => {
    setInternalSaving(true);
    try {
      const formatPayload = (stepDefinitionId, stateData, stepNumber) => {
        const base = {
          fund: fundId,
          step_definition: stepDefinitionId,
          step_name: stateData.step_name,
          step_rate: stateData.step_rate === "" ? null : Number(stateData.step_rate),
        };

        const validShareClassIds = shareClasses.map(sc => sc.share_class_id);

        const mapRule = (shareClassId, rule) => {
          const id = parseInt(shareClassId);
          if (!validShareClassIds.includes(id)) return null;

          return {
            share_class: id,
            isSelected: !!rule.isSelected,
            isProRata: !!rule.isProRata,
            fixedPercentage: rule.fixedPercentage === "" ? null : rule.fixedPercentage
          };
        };

        const processRules = (rulesObj) =>
          Object.entries(rulesObj || {})
            .map(([id, r]) => mapRule(id, r))
            .filter(r => r !== null);

        if (stepNumber === 1 || stepNumber === 2) {
          const rulesArray = processRules(stateData.rules);
          return { ...base, step_rules: rulesArray };
        }

        if (stepNumber === 3) {
          const rulesArray = processRules(stateData.rules);
          const envelopesArray = (stateData.envelopes || []).map((env) => ({
            envelope_number: env.number,
            allocation_percentage: env.allocation === "" ? 0 : Number(env.allocation),
            rules: processRules(env.rules)
          }));
          return { ...base, step_rules: rulesArray, envelopes: envelopesArray };
        }

        if (stepNumber === 4) {
          const envelopesArray = (stateData.envelopes || []).map((env) => ({
            envelope_number: env.number,
            allocation_percentage: env.allocation === "" ? 0 : Number(env.allocation),
            rules: processRules(env.rules)
          }));
          return { ...base, envelopes: envelopesArray };
        }
      };

      const p1 = formatPayload(1, step1Data, 1);
      const p2 = formatPayload(2, step2Data, 2);
      const p3 = formatPayload(3, step3Data, 3);
      const p4 = formatPayload(4, step4Data, 4);

      await Promise.all([
        step1Data.id ? updateStep(fundId, step1Data.id, p1) : createStep(fundId, p1),
        step2Data.id ? updateStep(fundId, step2Data.id, p2) : createStep(fundId, p2),
        step3Data.id ? updateStep(fundId, step3Data.id, p3) : createStep(fundId, p3),
        step4Data.id ? updateStep(fundId, step4Data.id, p4) : createStep(fundId, p4),
      ]);

      const freshData = await fetchFundSteps(fundId);

      const s1 = freshData.find((s) => s.step_number === 1);
      if (s1) setStep1Data(mapBackendToState(s1, 1));
      const s2 = freshData.find((s) => s.step_number === 2);
      if (s2) setStep2Data(mapBackendToState(s2, 2));
      const s3 = freshData.find((s) => s.step_number === 3);
      if (s3) setStep3Data(mapBackendToState(s3, 3));
      const s4 = freshData.find((s) => s.step_number === 4);
      if (s4) setStep4Data(mapBackendToState(s4, 4));

      setToast({
        type: "success",
        title: "Waterfall Saved",
        message: "Waterfall structure has been updated successfully."
      });

    } catch (err) {
      console.error("Save Error:", err);
      setToast({
        type: "error",
        title: "Save Error",
        message: err.message || "Failed to save waterfall structure."
      });
    } finally {
      setInternalSaving(false);
    }
  };

  if (scLoading || isInitialLoading) return <PageSpinner label="Loading waterfall structure..." />;
  if (scError || initError) return <PageError message={scError || initError} />;
  if (!shareClasses || shareClasses.length === 0) {
    return <PageNoData message="In order to initiate Waterfall, Share Classes must be initiated." />;
  }

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

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default WaterfallStructure;