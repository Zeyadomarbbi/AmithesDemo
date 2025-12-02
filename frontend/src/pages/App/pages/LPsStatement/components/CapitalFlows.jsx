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
      {/* row 1: search + chips (FlowFilters) */}
      <div className="cf-top-row">
        <FlowFilters
          operationFilter={operationFilter}
          setOperationFilter={setOperationFilter}
          search={search}
          setSearch={setSearch}
        />
      </div>

      {/* row 2: button alone, exactly above the table */}
      <div className="cf-header-row">
        <FlowHeader onNewOperation={handleNewOperation} />
      </div>

      {/* row 3: table */}
      <FlowTable operationFilter={operationFilter} search={search} />

      {/* wizard modal */}
      <OperationWizard
        open={wizardOpen}
        step={wizardStep}
        onClose={handleCloseWizard}
        onNext={handleNextStep}
        onPrevious={handlePreviousStep}
      />
    </div>
  );
}
