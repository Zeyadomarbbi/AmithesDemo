import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

import FlowHeader from "./FlowHeader.jsx";
import FlowFilters from "./FlowFilters.jsx";
import FlowTable from "./FlowTable.jsx";
import OperationPanel from "./NewOperation/OperationPanel.jsx";
import { useOperationDetails } from "../../../../hooks/LPsStatement/useCapitalFlowOperationDetails.js";
import { useCapitalFlowLPOperationAllocation } from "../../../../hooks/LPsStatement/useCapitalFlowLPOperationAllocation.js";
import { PageSpinner, PageError } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
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

  const [opOpen, setOpOpen] = useState(false);
  const [opMode, setOpMode] = useState("new");
  const [selectedOp, setSelectedOp] = useState(null);

  const { 
    operations, 
    loading: opsLoading, 
    error: opsError, 
    fetchOperations 
  } = useOperationDetails(fundId);

  const {
    allocations: lpAllocations,
    isLoading: allocLoading,
    error: allocError,
    fetchAllAllocations,
  } = useCapitalFlowLPOperationAllocation(fundId, null);

  const loadData = useCallback(async () => {
    if (!fundId) return;
    await Promise.all([
      fetchOperations().catch(() => {}),
      fetchAllAllocations().catch(() => {}),
    ]);
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

  const handleClosePanel = (didSave = false) => {
    setOpOpen(false);
    if (didSave) loadData();
  };

  const isFullyLoading = opsLoading || allocLoading;
  const pageError = opsError || allocError;

  return (
    <div className="cf-page">
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

      {isFullyLoading ? (
        <PageSpinner label="Loading capital flows..." />
      ) : pageError ? (
        <PageError message={pageError} />
      ) : (
        <>
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

          <FlowTable
            operationFilter={operationFilter}
            search={search}
            breakdown={breakdown}
            onSelectOperation={handleSelectOperation}
            operations={operations}
            lpAllocations={lpAllocations}
            lps={lps}
          />
        </>
      )}

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