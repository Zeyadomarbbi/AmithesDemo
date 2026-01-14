// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlows.jsx
import React, { useState } from "react";
import "./CapitalFlows.css";

import FlowHeader from "./FlowHeader.jsx";
import FlowFilters from "./FlowFilters.jsx";
import FlowTable from "./FlowTable.jsx";
import OperationWizard from "./NewOperation/OperationWizard.jsx";

export default function CapitalFlows({ lps = [] }) {
  const [operationFilter, setOperationFilter] = useState("All operations");
  const [search, setSearch] = useState("");

  // wizard state (keep as you have it)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // breakdown state (Operations / LPs / Share class)
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
      {/* Row 1: Search + Breakdown (same line) */}
      <div className="cf-row cf-row--search-breakdown">
        <FlowFilters
          variant="searchOnly"
          operationFilter={operationFilter}
          setOperationFilter={setOperationFilter}
          search={search}
          setSearch={setSearch}
        />

        <FlowHeader
          variant="breakdownOnly"
          onNewOperation={handleNewOperation}
          operationFilter={operationFilter}
          breakdown={breakdown}
          setBreakdown={setBreakdown}
        />
      </div>

      {/* Row 2: Filter chips + New operation (same line) */}
      <div className="cf-row cf-row--filters-newop">
        <FlowFilters
          variant="chipsOnly"
          operationFilter={operationFilter}
          setOperationFilter={setOperationFilter}
          search={search}
          setSearch={setSearch}
        />

        <FlowHeader
          variant="buttonOnly"
          onNewOperation={handleNewOperation}
          operationFilter={operationFilter}
          breakdown={breakdown}
          setBreakdown={setBreakdown}
        />
      </div>

      {/* table – uses the SAME breakdown state */}
      <FlowTable
        operationFilter={operationFilter}
        search={search}
        breakdown={breakdown}
      />

      {/* wizard modal */}
      {wizardOpen && (
        <OperationWizard
          onClose={handleCloseWizard}
          lps={lps} // ✅ THIS is the missing link
        />
      )}
    </div>
  );
}
