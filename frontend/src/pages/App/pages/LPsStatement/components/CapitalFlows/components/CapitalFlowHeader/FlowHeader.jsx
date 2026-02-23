// frontend/src/pages/App/pages/LPsStatement/components/FlowHeader.jsx
import React from "react";
import "./FlowHeader.css";
import { PlusIcon } from "../../../../Icons.jsx";




export default function FlowHeader({
  onNewOperation,
  operationFilter,
  breakdown,
  setBreakdown,
  variant = "all", // "all" | "breakdownOnly" | "buttonOnly"
}) {
  let buttonLabel = "New operation";
  if (operationFilter === "Capital call") buttonLabel = "New capital call";
  if (operationFilter === "Distribution") buttonLabel = "New distribution";

  // ✅ SHOW BREAKDOWN ONLY for Capital call & Distribution (like before)
  const showBreakdown =
    operationFilter === "Capital call" || operationFilter === "Distribution";

  const renderBreakdown = variant !== "buttonOnly" && showBreakdown;
  const renderButton = variant !== "breakdownOnly";

  const variantClass =
    variant === "breakdownOnly"
      ? "cf-header--breakdownOnly"
      : variant === "buttonOnly"
      ? "cf-header--buttonOnly"
      : "";

  return (
    <div className={`cf-header ${variantClass}`.trim()}>
      {renderBreakdown && (
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
      )}

      {renderButton && (
        <button type="button" className="cf-new-op-btn" onClick={onNewOperation}>
          <span className="cf-new-op-icon" aria-hidden="true">
            <PlusIcon />
          </span>
          <span>{buttonLabel}</span>
        </button>
      )}
    </div>
  );
}