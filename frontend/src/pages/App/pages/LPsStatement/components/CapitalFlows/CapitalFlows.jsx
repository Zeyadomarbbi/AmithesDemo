// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlows.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

import FlowHeader from "./FlowHeader.jsx";
import FlowFilters from "./FlowFilters.jsx";
import FlowTable from "./FlowTable.jsx";
import OperationPanel from "./NewOperation/OperationPanel/OperationPanel.jsx";
import { useOperationDetails } from "/src/pages/App/hooks/LPsStatement/useCapitalFlowOperationDetails.js";
import { useCapitalFlowLPOperationAllocation } from "/src/pages/App/hooks/LPsStatement/useCapitalFlowLPOperationAllocation.js";
import "./CapitalFlows.css";

export default function CapitalFlows() {
  const outlet = useOutletContext() || {};
  const lps = outlet.lps || [];
  const shareClasses = outlet.shareClasses || [];
  const fundId = outlet.fundId;
  const commitments = outlet.commitments;

  const [operationFilter, setOperationFilter] = useState("All operations");
  const [search, setSearch] = useState("");
  const [breakdown, setBreakdown] = useState("operations");

  // ── OperationPanel state ───────────────────────────────────────────────────
  const [opOpen, setOpOpen] = useState(false);
  const [opMode, setOpMode] = useState("new");
  const [selectedOp, setSelectedOp] = useState(null);

  // ── Real data ──────────────────────────────────────────────────────────────
  const { operations, fetchOperations } = useOperationDetails(fundId);
  const {
    allocations: lpAllocations,
    fetchAllAllocations,
  } = useCapitalFlowLPOperationAllocation(fundId, null);
  const loadData = useCallback(() => {
    if (!fundId) return;
    fetchOperations().catch(() => {});
    fetchAllAllocations().catch(() => {});
  }, [fundId, fetchOperations, fetchAllAllocations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    // Refresh table after closing panel (new operation may have been saved)
    loadData();
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

      {/* Table — receives real data */}
      <FlowTable
        operationFilter={operationFilter}
        search={search}
        breakdown={breakdown}
        onSelectOperation={handleSelectOperation}
        operations={operations}
        lpAllocations={lpAllocations}
        lps={lps}

      />

      {opOpen && (
        <OperationPanel
          open={opOpen}
          mode={opMode}
          operation={selectedOp}
          lps={lps}
          shareClasses={shareClasses}
          fundId={fundId}
          onClose={handleClosePanel}
          commitments={commitments}
        />
      )}
    </div>
  );
}
