// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationWizard.jsx
import React, { useState } from "react";
import "./OperationWizard.css";

import OperationStep1 from "./OperationStep1.jsx";
import OperationStep2 from "./OperationStep2.jsx";
import OperationStep3Breakdown from "./OperationStep3Breakdown.jsx";
import OperationStep4 from "./OperationStep4.jsx"; // Notice step

export default function OperationWizard({ onClose }) {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false); // ✅ toast visibility

  const TOTAL_STEPS = 4;

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    } else {
      // ✅ last step → show success toast
      setShowSuccess(true);
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    if (onClose) onClose(); // close the whole wizard when user dismisses toast
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <OperationStep1 />;
      case 2:
        return <OperationStep2 />;
      case 3:
        return <OperationStep3Breakdown />; // ✅ Breakdown table
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
          {/* ============ HEADER ============ */}
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

            <button className="opw-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          {/* ============ BODY ============ */}
          <div className="opw-body">{renderStep()}</div>

          {/* ============ FOOTER ============ */}
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

      {/* ============ SUCCESS TOAST ============ */}
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
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
