// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import OperationStep1 from "./OperationStep1/OperationStep1.jsx";
import OperationStep2 from "./OperationStep2/OperationStep2.jsx";
import OperationStep3Breakdown from "./OperationStep3/OperationStep3Breakdown.jsx";
import OperationStep4 from "./OperationStep4/OperationStep4.jsx";
import { PageSpinner, PageError } from "../../../../../../../components/LoadingScreens/LoadingScreens.jsx";
import { CloseIcon } from "../../../../../../../components/Icons/InteractiveIcons.jsx";
import { ChevronDoubleLeftIcon } from "../../../../../../../components/Icons/DirectionIcons.jsx";
import { useOperationTypes } from "../../../../../hooks/LPsStatement/useOperationTypes.js";
import { useOperationDetails } from "../../../../../hooks/LPsStatement/useCapitalFlowOperationDetails.js";
import { useCapitalFlowFlowDetails } from "../../../../../hooks/LPsStatement/useCapitalFlowFlowDetails.js";
import { useCapitalFlowLPFlowAllocation } from "../../../../../hooks/LPsStatement/useCapitalFlowLPFlowAllocation.js";
import "./OperationPanel.css";

/** Date -> YYYYMMDD integer */
function toDateId(d) {
  if (!d) return null;
  if (typeof d === "object") {
    if (typeof d.toDate === "function") d = d.toDate();
    else if (d.$d) d = d.$d;
  }
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const day = dt.getDate();
  return y * 10000 + m * 100 + day;
}

function toIsoDate(d) {
  if (!d) return null;
  if (typeof d === "object") {
    if (typeof d.toDate === "function") d = d.toDate();
    else if (d.$d) d = d.$d;
  }
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toPlainDate(d) {
  if (!d) return null;
  if (typeof d === "object") {
    if (typeof d.toDate === "function") return d.toDate();
    if (d.$d) return d.$d;
  }
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function computeTotalFundCommitment(commitments, dueDate) {
  const dueDateObj = toPlainDate(dueDate);
  if (!dueDateObj) return 0;
  const safe = Array.isArray(commitments) ? commitments : [];
  return safe.reduce((sum, c) => {
    const closing = c?.closing_period_date ? new Date(c.closing_period_date) : null;
    if (!closing || Number.isNaN(closing.getTime())) return sum;
    if (dueDateObj >= closing) return sum + parseFloat(c?.commitment_amount || 0);
    return sum;
  }, 0);
}

const EMPTY_STEP2_DRAFT = {
  breakdown: "lps",
  flows: [],
  flowTotalInputs: {},
  flowTotals: {},
};

export default function OperationPanel({
  open,
  mode = "new",
  operation = null,
  lps = [],
  shareClasses = [],
  fundId,
  onClose,
  commitments,
  createOperationLPAllocation,
  existingAllocations,   // ← from parent
  fetchAllAllocations,   // ← from parent
}) {
  if (!open) return null;
  const [isExpanded, setIsExpanded] = useState(false); // New state for expansion
  const isDetail = mode === "detail" && !!operation;

  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ── Step 1 fields ──────────────────────────────────────────────────────────
  const [operationName, setOperationName] = useState("");
  const [operationType, setOperationType] = useState("");
  const [noticeDate, setNoticeDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [totalFundCommitment, setTotalFundCommitment] = useState(0);
  const [operationNumber, setOperationNumber] = useState(null);
  // DB id — set after final save
  const [operationId, setOperationId] = useState(null);
  // ── Step 2 draft + result ──────────────────────────────────────────────────
  const [step2Draft, setStep2Draft] = useState({ ...EMPTY_STEP2_DRAFT });
  const [step2Result, setStep2Result] = useState({
    operationTypeId: "",
    operationTypeName: "",
    flows: [],
    perLp: {},
    total_operation_amount: 0,
    overall_percentage_of_commitment: 0,
  });

  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  const TOTAL_STEPS = 4;
  const [savingStep1, setSavingStep1] = useState(false);
  const [step1Error, setStep1Error] = useState(null);

  const { operationTypes, fetchOperationTypes, isLoading: typesLoading, error: typesError } = useOperationTypes();
  const { createOperation, updateOperation, fetchOperation, deleteOperation, loading: opLoading, error: opError } = useOperationDetails(fundId);
  const { createFlow, updateFlow } = useCapitalFlowFlowDetails(fundId, null);
  const { createAllocation: createFlowLPAllocation } = useCapitalFlowLPFlowAllocation(fundId, null, null);
  const [detailReady, setDetailReady] = useState(!isDetail); // true immediately if "new" mode

  // Fetch all past allocations for this fund on mount (used for "before" in Step 3)
  useEffect(() => {
    if (fundId) fetchAllAllocations();
  }, [fundId]);

  useEffect(() => {
    if (open) fetchOperationTypes?.().catch(() => {});
  }, [open, fetchOperationTypes]);

  useEffect(() => {
    setShowSuccess(false);
    setStep(1);
    setStep1Error(null);
    setSaveError(null);
    setTotalFundCommitment(0);

    if (isDetail && operation) {
      setDetailReady(false); // block render until fetch completes
      const opId = operation?.lps_operation_details_id ?? operation?.operation_id ?? operation?.id ?? null;
      setOperationId(opId);

      fetchOperation(opId)
        .then((fullOp) => {
          setOperationName(fullOp?.name ?? fullOp?.operation_name ?? "");
          setOperationType(String(fullOp?.operation_type_id ?? ""));
          setNoticeDate(fullOp?.notice_date ? new Date(fullOp.notice_date) : null);
          setDueDate(fullOp?.due_date ? new Date(fullOp.due_date) : null);
          setTotalFundCommitment(Number(fullOp?.total_fund_commitment ?? 0));
          setOperationNumber(fullOp?.operation_number ?? null);
          setStep2Draft({ ...EMPTY_STEP2_DRAFT });
          setStep2Result({
            operationTypeId: String(fullOp?.operation_type_id ?? ""),
            operationTypeName: operationTypeName,
            flows: [],
            perLp: {},
            total_operation_amount: Number(fullOp?.total_operation_amount ?? 0),
            overall_percentage_of_commitment: Number(fullOp?.overall_percentage_of_commitment ?? 0),
          });
        })
        .catch((err) => setStep1Error(err))
        .finally(() => setDetailReady(true)); // unblock after fetch
    } else {
      setOperationId(null);
      setOperationName("");
      setOperationType("");
      setNoticeDate(null);
      setDueDate(null);
      setStep2Draft({ ...EMPTY_STEP2_DRAFT });
      setStep2Result({ operationTypeId: "", operationTypeName: "", flows: [], perLp: {}, total_operation_amount: 0, overall_percentage_of_commitment: 0 });
    }
  }, [open, isDetail, operation, fetchOperation]);
  const operationTypeName = useMemo(() => {
    const arr = Array.isArray(operationTypes) ? operationTypes : [];
    const found = arr.find((t) => String(t?.operation_type_id) === String(operationType));
    return found?.name || "";
  }, [operationTypes, operationType]);

  const isEqualization = useMemo(() => {
    return String(operationTypeName || "").toLowerCase().includes("equalization");
  }, [operationTypeName]);

  const validateStep1 = () => {
    if (!fundId) throw new Error("fundId is missing.");
    if (!String(operationName || "").trim()) throw new Error("Operation name is required.");
    if (!operationType) throw new Error("Operation type is required.");
    if (!noticeDate) throw new Error("Notice date is required.");
    if (!dueDate) throw new Error("Due date is required.");
    if (!toDateId(noticeDate)) throw new Error("Notice date is invalid.");
    if (!toDateId(dueDate)) throw new Error("Due date is invalid.");
  };

  const handleStep2Next = (payload = {}) => {
    setStep2Result({
      operationTypeId: String(operationType || payload.operationTypeId || ""),
      operationTypeName: operationTypeName || payload.operationTypeName || "",
      flows: payload.flows || [],
      perLp: payload.perLp || {},
      total_operation_amount: payload.grandTotal ?? 0,
      overall_percentage_of_commitment: payload.grandPercent ?? 0,
    });

    console.log("[Step 2 → Step 3]", {
      total_operation_amount: payload.grandTotal ?? 0,
      overall_percentage_of_commitment: payload.grandPercent ?? 0,
      flows: payload.flows,
      perLp: payload.perLp,
    });

    setStep(3);
  };

  
  
  const handleFinalSave = async () => {
    const { flows, perLp, total_operation_amount, overall_percentage_of_commitment } = step2Result;
    const computedTFC = isDetail && operationId
      ? totalFundCommitment  // already loaded from DB in detail mode
      : computeTotalFundCommitment(commitments, dueDate);  // recompute for new
    setIsSaving(true);
    setSaveError(null);
    console.log("[handleFinalSave] totalFundCommitment:", computedTFC);

    const rollbackState = { operationId: null };

    try {
      let targetOperationId;

      const operationPayload = {
        operation_name: String(operationName).trim(),
        operation_type_id: Number(operationType),
        notice_date: toIsoDate(noticeDate),
        due_date: toIsoDate(dueDate),
        total_fund_commitment: computedTFC,
        total_operation_amount: Number(total_operation_amount.toFixed(2)),
        overall_percentage_of_commitment: (
          (overall_percentage_of_commitment ?? 0) > 1
            ? overall_percentage_of_commitment / 100
            : (overall_percentage_of_commitment ?? 0)
        ).toFixed(4),
      };
      console.log("[handleFinalSave] operationPayload:", operationPayload);
      if (isDetail && operationId) {
        await updateOperation(operationId, operationPayload);
        targetOperationId = operationId;
      } else {
        const newOperationId = await createOperation(operationPayload);
        rollbackState.operationId = newOperationId;
        targetOperationId = newOperationId;
      }
      const eqFlowTypeId = flows.find(
        (f) => String(f.flow_name ?? "").toLowerCase() === "equalization"
      )?.flow_type_id ?? null;
      for (const flow of flows) {
        const flowPayload = {
          operation: targetOperationId,
          flow_type_id: Number(flow.flow_type_id),
          flow_name: flow.flow_name,
          input_type: flow.input_type,
          input_amount: flow.input_amount !== null ? Number(Number(flow.input_amount).toFixed(2)) : null,
          input_percentage: flow.input_percentage !== null
            ? Number((flow.input_percentage > 1 ? flow.input_percentage / 100 : flow.input_percentage).toFixed(6))
            : null,
          allocation_percentage_of_commitment: Number(
            Math.max(0, (flow.allocation_percentage_of_commitment ?? 0) / 100).toFixed(6)
          ),
          computed_total_amount: flow.computed_total_amount !== null ? Number(Number(flow.computed_total_amount).toFixed(2)) : null,
          commitment_amount: computedTFC,
        };

        let opFlowId;

        if (flow.operation_flow_id) {
          // UPDATE existing flow
          const updatedFlow = await updateFlow(targetOperationId, flow.operation_flow_id, flowPayload);
          opFlowId = updatedFlow?.operation_flow_id ?? flow.operation_flow_id;
        } else {
          // CREATE new flow
          const createdFlow = await createFlow(targetOperationId, flowPayload);
          opFlowId = createdFlow?.operation_flow_id ?? createdFlow?.id;
          if (!opFlowId) throw new Error(`Flow "${flow.flow_name}" created but missing operation_flow_id.`);
        }
        
        for (const [lpId, lpData] of Object.entries(perLp)) {
          let allocatedAmount;

          if (flow.flow_name === "Equalization" || flow.flow_type_id === eqFlowTypeId) {
            allocatedAmount = lpData.eqAmount ?? null;
          } else {
            allocatedAmount = lpData.flows?.[flow.id] ?? null;
          }

          if (allocatedAmount === null || !Number.isFinite(Number(allocatedAmount))) continue;

          await createFlowLPAllocation(targetOperationId, opFlowId, {
            operation_flow_id: opFlowId,
            lp_id: Number(lpId),
            allocated_amount: Number(Number(allocatedAmount).toFixed(4)),
          });
        }
      }

      for (const [lpId, lpData] of Object.entries(perLp)) {
        const mainAmount = lpData.mainAmount ?? 0;
        const commitmentNum = lpData.commitmentNumber ?? 0;
        const lpCalledPct = commitmentNum > 0 ? mainAmount / commitmentNum : 0;

        await createOperationLPAllocation(targetOperationId, {
          lps_operation_details_id: targetOperationId,
          lp_id: Number(lpId),
          share_class_id: lpData.shareClassId ? Number(lpData.shareClassId) : null,
          commitment_amount: Number(commitmentNum.toFixed(2)),
          capital_call: Number(mainAmount.toFixed(2)),
          called_percentage: (
            lpCalledPct > 1 ? lpCalledPct / 100 : (lpCalledPct ?? 0)
          ).toFixed(4),
          shares_issued: (lpData.sharesIssued ?? 0).toFixed(6),
        });
      }

      setOperationId(targetOperationId);
      return targetOperationId;

    } catch (e) {
      if (rollbackState.operationId) {
        try {
          await deleteOperation(rollbackState.operationId);
        } catch (rollbackError) {
          console.error("Critical: Frontend rollback failed. Orphaned operation ID:", rollbackState.operationId, rollbackError);
        }
      }
      setSaveError(e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      setSavingStep1(true);
      setStep1Error(null);
      try {
        validateStep1();
        const computed = computeTotalFundCommitment(commitments, dueDate);
        setTotalFundCommitment(computed);
        console.log("[Step 1 → Step 2]", {
          operation_name: String(operationName).trim(),
          operation_type_id: operationType,
          operation_type_name: operationTypeName,
          notice_date: toIsoDate(noticeDate),
          due_date: toIsoDate(dueDate),
          total_fund_commitment: computed,
        });
        setStep(2);
      } catch (e) {
        setStep1Error(e);
      } finally {
        setSavingStep1(false);
      }
      return;
    }

    if (step === 2) {
      try {
        await step2Ref.current?.submitToNext?.();
      } catch {}
      return;
    }

    if (step === 3) {
      // Just navigate to step 4 — save happens on step 4
      setStep(4);
      return;
    }

    if (step === 4) {
      // Final save
      try {
        await handleFinalSave();
        setShowSuccess(true);
      } catch {}
      return;
    }
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    if (typeof onClose === "function") onClose(true);
  };

  const stepTabs = useMemo(
    () => [
      { step: 1, label: "Information" },
      { step: 2, label: "Flows" },
      { step: 3, label: "Breakdown" },
      { step: 4, label: "Notice" },
    ],
    []
  );
  const safeLps = Array.isArray(lps) ? lps : [];
  const renderStep = () => {
    switch (step) {
      case 1:
        if (opLoading) return <div style={{ padding: 20 }}>Loading operation details...</div>;
        return (
          <div>
            <OperationStep1
              operationName={operationName}
              setOperationName={setOperationName}
              operationType={operationType}
              setOperationType={setOperationType}
              noticeDate={noticeDate}
              setNoticeDate={setNoticeDate}
              dueDate={dueDate}
              setDueDate={setDueDate}
              operationTypes={operationTypes || []}
            />
            {step1Error && (
              <div style={{ marginTop: 10, color: "#b42318", fontSize: 12, whiteSpace: "pre-wrap" }}>
                {step1Error.message}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <OperationStep2
            ref={step2Ref}
            lps={safeLps}
            fundId={fundId}
            shareClasses={shareClasses} 
            existingAllocations={existingAllocations}
            fetchAllAllocations={fetchAllAllocations}
            operationId={operationId}
            operationType={operationTypeName}
            operationTypeId={operationType}
            operationTypeName={operationTypeName}
            operationNumber={operationNumber}
            onNext={handleStep2Next}
            draft={step2Draft}
            setDraft={setStep2Draft}
            commitments={commitments}
            totalFundCommitment={totalFundCommitment}
            dueDate={dueDate}
          />
        );

      case 3:
        return (
          <OperationStep3Breakdown
            ref={step3Ref}
            lps={safeLps}
            operationId={operationId}
            step2Result={step2Result}
            operationType={operationTypeName}
            operationNumber={operationNumber}
            totalFundCommitment={totalFundCommitment}
            onFinalSave={handleFinalSave}
            commitments={commitments}
            existingAllocations={existingAllocations}
            dueDate={dueDate}
          />
        );

      case 4:
        return (
          <OperationStep4
            operationName={operationName}
            operationTypeName={operationTypeName}
            noticeDate={toIsoDate(noticeDate)}
            dueDate={toIsoDate(dueDate)}
            totalFundCommitment={totalFundCommitment}
            step2Result={step2Result}
            lps={safeLps}
            isSaving={isSaving}
            saveError={saveError}
          />
        );

      default:
        return null;
    }
  };
  const isPanelLoading = typesLoading || opLoading || !detailReady;
  const panelError = typesError || opError;
  return (
  <>
    <div className="opw-drawer-backdrop" onClick={() => onClose?.(false)}>
      <aside
        className={`opw-drawer ${isExpanded ? "share-drawer--expanded" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="opw-header">
          <div className="opw-header-left">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="opw-expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? "Collapse" : "Expand"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.3s ease",
                  transform: isExpanded ? "rotate(180deg)" : "none",
                  color: "inherit",
                }}
              >
                <ChevronDoubleLeftIcon />
              </button>
              <h2 className="opw-title">
                {isDetail ? "Operation details" : "Create a new operation"}
              </h2>
            </div>
            <div className="opw-tabs" role="tablist" aria-label="Operation steps">
              {stepTabs.map((t) => (
                <div
                  key={t.step}
                  className={`opw-tab ${step === t.step ? "is-active" : ""}`}
                  role="tab"
                  aria-selected={step === t.step}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          <button
            className="opw-close-btn"
            type="button"
            onClick={() => onClose?.(false)}
            aria-label="Close"
            disabled={savingStep1 || isSaving}
          >
            <CloseIcon />
          </button>
        </div>

        {isPanelLoading ? (
          <PageSpinner label="Loading..." />
        ) : panelError ? (
          <PageError message={panelError?.message ?? panelError} />
        ) : (
          <>
            <div className="opw-body">{renderStep()}</div>

            {saveError && (
              <div style={{ padding: "8px 16px", color: "#b42318", fontSize: 12, whiteSpace: "pre-wrap" }}>
                {saveError.message}
              </div>
            )}

            <div className="opw-footer">
              <button
                type="button"
                className="opw-nav-btn opw-btn-ghost"
                onClick={handlePrev}
                disabled={step === 1 || savingStep1 || isSaving}
              >
                Previous
              </button>
              <button
                type="button"
                className="opw-nav-btn opw-btn-primary"
                onClick={handleNext}
                disabled={savingStep1 || isSaving}
              >
                {isSaving ? "Saving..." : savingStep1 ? "Saving..." : step === 4 ? "Save" : "Next"}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>

    {showSuccess && (
      <div className="opw-success-backdrop">
        <div className="opw-success-toast">
          <div className="opw-success-left">
            <span className="opw-success-icon">✓</span>
            <div>
              <div className="opw-success-title">
                {isDetail ? "Operation updated" : "Operation created"}
              </div>
              <div className="opw-success-message">
                The operation has been saved successfully
              </div>
            </div>
          </div>
          <button
            type="button"
            className="opw-success-close"
            onClick={handleCloseSuccess}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    )}
  </>
);
}