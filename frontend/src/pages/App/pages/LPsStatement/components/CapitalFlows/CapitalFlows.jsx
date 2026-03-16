import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

import FlowHeader from "./components/Header/FlowHeader.jsx";
import FlowFilters from "./components/Filters/FlowFilters.jsx";
import FlowTable from "./components/Table/FlowTable.jsx";
import OperationPanel from "./NewOperation/OperationPanel.jsx";
import { useFlowTypes } from "../../../../hooks/LPsStatement/useFlowTypes.js";
import { useOperationDetails } from "../../../../hooks/LPsStatement/useCapitalFlowOperationDetails.js";
import { useCapitalFlowLPOperationAllocation } from "../../../../hooks/LPsStatement/useCapitalFlowLPOperationAllocation.js";
import { PageSpinner, PageError, PageNoData } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
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
  const { flowTypes, fetchFlowTypes } = useFlowTypes()
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
    createAllocation,
    updateAllocation,
    deleteAllocation
  } = useCapitalFlowLPOperationAllocation(fundId, null);

  const loadData = useCallback(async () => {
    if (!fundId) return;
    await Promise.all([
      fetchOperations().catch(() => {}),
      fetchAllAllocations().catch(() => {}),
    ]);
  }, [fundId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetchFlowTypes?.().catch(() => {});
  }, [fetchFlowTypes]);

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
  const handleOperationFilterChange = (filter) => {
    setOperationFilter(filter);
    if (filter === "All operations") {
      setBreakdown("operations");
    }
  };
  return (
    <div className="cf-page">
      <div className="cf-row cf-row--search-breakdown">
        <FlowFilters
          variant="searchOnly"
          operationFilter={operationFilter}
          setOperationFilter={handleOperationFilterChange}
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
      ) : operations.length === 0 ? (
        <>
          <div className="cf-row cf-row--filters-newop">
            <FlowFilters
              variant="chipsOnly"
              operationFilter={operationFilter}
              setOperationFilter={handleOperationFilterChange}
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
          <PageNoData message="No capital flow operations found for this fund." />
        </>
      ) : (
        <>
          <div className="cf-row cf-row--filters-newop">
            <FlowFilters
              variant="chipsOnly"
              operationFilter={operationFilter}
              setOperationFilter={handleOperationFilterChange}
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
            shareClasses={shareClasses}
            flowTypes={flowTypes}
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
          createOperationLPAllocation={createAllocation}
          deleteOperationLPAllocation={deleteAllocation}  // ← add
          existingAllocations={lpAllocations}
          fetchAllAllocations={fetchAllAllocations}
          operations={operations}
        />
      )}
    </div>
  );
}