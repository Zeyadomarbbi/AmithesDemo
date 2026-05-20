import React from "react";
import { PlusIconWhite } from "../../../../../../../../components/Icons/InteractiveIcons.jsx";
import { PermissionGate } from "../../../../../../../../hooks/Auth/PermissionGate.jsx";
import "./FlowHeader.css";

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
        <div className="cf-header-breakdown-row cf-header-breakdown-row--in-header">
          <span className="cf-header-breakdown-label">Breakdown :</span>

          <div className="cf-header-breakdown-chips">
            <button
              type="button"
              className={
                breakdown === "operations"
                  ? "cf-header-breakdown-chip active"
                  : "cf-header-breakdown-chip"
              }
              onClick={() => setBreakdown("operations")}
            >
              Operations
            </button>

            <button
              type="button"
              className={
                breakdown === "lps"
                  ? "cf-header-breakdown-chip active"
                  : "cf-header-breakdown-chip"
              }
              onClick={() => setBreakdown("lps")}
            >
              LPs
            </button>

            <button
              type="button"
              className={
                breakdown === "shareClasses"
                  ? "cf-header-breakdown-chip active"
                  : "cf-header-breakdown-chip"
              }
              onClick={() => setBreakdown("shareClasses")}
            >
              Share class
            </button>
          </div>
        </div>
      )}
      <PermissionGate>
        {renderButton && (
          <button type="button" className="cf-header-new-op-btn" onClick={onNewOperation}>
            <PlusIconWhite /> {buttonLabel}
          </button>
        )}
      </PermissionGate>
    </div>
  );
}