// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationWizard.jsx
import React, { useRef, useState } from "react";
import "./OperationWizard.css";

import OperationStep1 from "./OperationStep1.jsx";
import OperationStep2 from "./OperationStep2.jsx";
import OperationStep3Breakdown from "./OperationStep3Breakdown.jsx";
import OperationStep4 from "./OperationStep4.jsx";

import { CloseIcon } from "../../Icons.jsx";

export default function OperationWizard({ onClose, lps = [] }) {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [operationName, setOperationName] = useState("");
  const [operationType, setOperationType] = useState("");

  // ✅ Step2 draft (PERSISTENT across Step2 <-> Step3)
  const [step2Draft, setStep2Draft] = useState({
    breakdown: "lps",
    flows: [],
    flowTotalInputs: {},
    flowTotals: {},
  });

  // ✅ payload that Step3 uses (derived when you click Next)
  const [step2Result, setStep2Result] = useState({
    operationType: "",
    flows: [],
    perLp: {},
  });

  const step2Ref = useRef(null);

  const TOTAL_STEPS = 4;

  const handleStep2Next = (payload = {}) => {
    setStep2Result({
      operationType: operationType || payload.operationType || "",
      flows: payload.flows || [],
      perLp: payload.perLp || {},
    });
    setStep(3);
  };

  const handleNext = () => {
    if (step === 2) {
      // ✅ use wizard button, but collect Step2 data via ref
      step2Ref.current?.submitToNext?.();
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    } else {
      setShowSuccess(true);
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    if (onClose) onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <OperationStep1
            operationName={operationName}
            setOperationName={setOperationName}
            operationType={operationType}
            setOperationType={setOperationType}
          />
        );
      case 2:
        return (
          <OperationStep2
            ref={step2Ref}
            lps={lps}
            operationName={operationName}
            operationType={operationType}
            onNext={handleStep2Next}
            draft={step2Draft}
            setDraft={setStep2Draft}
          />
        );
      case 3:
        return (
          <OperationStep3Breakdown
            lps={lps}
            operationType={operationType}
            step2Result={step2Result}
          />
        );
      case 4:
        return <OperationStep4 />;
      default:
        return null;
    }
  };

  const stepLabelMap = {
    1: "Edit information",
    2: "Edit flows",
    3: "Breakdown",
    4: "Assign templates",
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <>
      <div className="opw-backdrop">
        <div className="opw-modal">
          <div className="opw-header">
            <div className="opw-header-left">
              <h2 className="opw-title">Create a new operation</h2>

              <div className="opw-header-progress">
                <div className="opw-header-progress-track">
                  <div
                    className="opw-header-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="opw-step-text">
                  {`Step ${step} of 4 : ${stepLabelMap[step]}`}
                </div>
              </div>
            </div>

            <button
              className="opw-close-btn"
              type="button"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="opw-body">{renderStep()}</div>

          <div className="opw-footer">
            <button
              type="button"
              className="opw-nav-btn opw-btn-ghost"
              onClick={handlePrev}
              disabled={step === 1}
            >
              Previous
            </button>

            <button
              type="button"
              className="opw-nav-btn opw-btn-primary"
              onClick={handleNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="opw-success-backdrop">
          <div className="opw-success-toast">
            <div className="opw-success-left">
              <span className="opw-success-icon">✓</span>
              <div>
                <div className="opw-success-title">Operation created</div>
                <div className="opw-success-message">
                  The operation has been created successfully
                </div>
              </div>
            </div>

            <button
              type="button"
              className="opw-success-close"
              onClick={handleCloseSuccess}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
