// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlows.jsx
import React, { useState } from "react";
import "./CapitalFlows.css";

import FlowHeader from "./FlowHeader.jsx";
import FlowFilters from "./FlowFilters.jsx";
import FlowTable from "./FlowTable.jsx";
import OperationWizard from "./NewOperation/OperationWizard.jsx";

export default function CapitalFlows() {
  const [operationFilter, setOperationFilter] = useState("All operations");
  const [search, setSearch] = useState("");

  // wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // 🔹 NEW: breakdown state (Operations / LPs / Share class)
  const [breakdown, setBreakdown] = useState("operations");

  const handleNewOperation = () => {
    setWizardStep(1);
    setWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
  };

  const handleNextStep = () => {
    setWizardStep((prev) => Math.min(prev + 1, 2));
  };

  const handlePreviousStep = () => {
    setWizardStep((prev) => (prev === 1 ? 1 : prev - 1));
  };

  return (
    <div className="cf-page">
      {/* row 1: search + chips */}
      <div className="cf-top-row">
        <FlowFilters
          operationFilter={operationFilter}
          setOperationFilter={setOperationFilter}
          search={search}
          setSearch={setSearch}
        />
      </div>

      {/* row 2: Breakdown + New operation button */}
      <div className="cf-header-row">
        <FlowHeader
          onNewOperation={handleNewOperation}
          operationFilter={operationFilter}
          breakdown={breakdown}
          setBreakdown={setBreakdown}
        />
      </div>

      {/* row 3: table – uses the SAME breakdown state */}
      <FlowTable
        operationFilter={operationFilter}
        search={search}
        breakdown={breakdown}
      />

      {/* wizard modal */}
      {wizardOpen && (
        <OperationWizard
          open={true}
          step={wizardStep}
          onClose={handleCloseWizard}
          onNext={handleNextStep}
          onPrevious={handlePreviousStep}
        />
      )}
    </div>
  );
}
