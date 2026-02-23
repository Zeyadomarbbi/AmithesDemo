// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlows.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./CapitalFlows.css";

import FlowHeader from "./components/CapitalFlowHeader/FlowHeader.jsx";
import FlowFilters from "./components/CapitalFlowFilters/FlowFilters.jsx";
import FlowTable from "./components/CapitalFlowTable/FlowTable.jsx";

import OperationPanel from "./NewOperation/OperationPanel/OperationPanel.jsx";


export default function CapitalFlows() {
  // ✅ get values from parent Outlet context (safe defaults)
  const outlet = useOutletContext() || {};
  const lps = outlet.lps || [];
  const shareClasses = outlet.shareClasses || []; // ✅ NEW (safe)
  const fundId = outlet.fundId; // ✅ optional (safe if undefined)

  const [operationFilter, setOperationFilter] = useState("All operations");
  const [search, setSearch] = useState("");
  const [breakdown, setBreakdown] = useState("operations");

  // ✅ OperationPanel state
  const [opOpen, setOpOpen] = useState(false);
  const [opMode, setOpMode] = useState("new"); // "new" | "detail"
  const [selectedOp, setSelectedOp] = useState(null);

  const handleNewOperation = () => {
    setSelectedOp(null);
    setOpMode("new");
    setOpOpen(true);
  };

  const handleSelectOperation = (op) => {
    setSelectedOp(op);
    setOpMode("detail");
    setOpOpen(true);
  };

  const handleClosePanel = () => {
    setOpOpen(false);
  };

  return (
    <div className="cf-page">
      {/* Row 1: Search + Breakdown */}
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

      {/* Row 2: Chips + New operation */}
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

      {/* Table */}
      <FlowTable
        operationFilter={operationFilter}
        search={search}
        breakdown={breakdown}
        onSelectOperation={handleSelectOperation}
      />

      {/* ✅ mount panel ONLY when open */}
      {opOpen && (
        <OperationPanel
          open={opOpen}
          mode={opMode}
          operation={selectedOp}
          lps={lps}
          shareClasses={shareClasses}  // ✅ NEW
          fundId={fundId}              // ✅ optional
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
