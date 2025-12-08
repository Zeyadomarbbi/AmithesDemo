// frontend/src/pages/App/pages/LPsStatement/components/FlowHeader.jsx
import React from "react";
import "./FlowHeader.css";

export default function FlowHeader({
  onNewOperation,
  operationFilter,
  breakdown,
  setBreakdown,
}) {
  let buttonLabel = "New operation";
  if (operationFilter === "Capital call") buttonLabel = "New capital call";
  if (operationFilter === "Distribution") buttonLabel = "New distribution";

  return (
    <div className="cf-header">
      {/* Breakdown chips on the left of the header row */}
      <div className="cf-breakdown-row cf-breakdown-row--in-header">
        <span className="cf-breakdown-label">Breakdown :</span>
        <div className="cf-breakdown-chips">
          <button
            type="button"
            className={
              breakdown === "operations"
                ? "cf-breakdown-chip active"
                : "cf-breakdown-chip"
            }
            onClick={() => setBreakdown("operations")}
          >
            Operations
          </button>
          <button
            type="button"
            className={
              breakdown === "lps"
                ? "cf-breakdown-chip active"
                : "cf-breakdown-chip"
            }
            onClick={() => setBreakdown("lps")}
          >
            LPs
          </button>
          <button
            type="button"
            className={
              breakdown === "shareClasses"
                ? "cf-breakdown-chip active"
                : "cf-breakdown-chip"
            }
            onClick={() => setBreakdown("shareClasses")}
          >
            Share class
          </button>
        </div>
      </div>

      {/* New operation / capital call / distribution button */}
      <button
        type="button"
        className="cf-new-op-btn"
        onClick={onNewOperation}
      >
        + {buttonLabel}
      </button>
    </div>
  );
}
