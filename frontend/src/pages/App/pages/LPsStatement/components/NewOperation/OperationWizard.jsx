import React from "react";
import "./OperationWizard.css";
import OperationStep1 from "./OperationStep1.jsx";
import OperationStep2 from "./OperationStep2.jsx";

export default function OperationWizard({
  open,
  step,
  onClose,
  onNext,
  onPrevious,
}) {
  if (!open) return null;

  const stepTitle =
    step === 1 ? "Step 1 of 4 : Edit information" : "Step 2 of 4 : Edit flows";

  return (
    <div className="opw-backdrop">
      <div className="opw-modal">
        {/* HEADER */}
        <div className="opw-header">
          <div>
            <h2 className="opw-title">Create a new operation</h2>
            <div className="opw-step-row">
              <span
                className={
                  step === 1 ? "opw-step-bar opw-step-bar--orange" : "opw-step-bar opw-step-bar--blue"
                }
              />
              <span className="opw-step-text">{stepTitle}</span>
            </div>
          </div>

          <button className="opw-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="opw-body">
          {step === 1 ? <OperationStep1 /> : <OperationStep2 />}
        </div>

        {/* FOOTER */}
        <div className="opw-footer">
          <button
            className={
              step === 1
                ? "opw-btn opw-btn--secondary opw-btn--disabled"
                : "opw-btn opw-btn--secondary"
            }
            onClick={step === 1 ? undefined : onPrevious}
          >
            Previous
          </button>
          <button className="opw-btn opw-btn--primary" onClick={onNext}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
