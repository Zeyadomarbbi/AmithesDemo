// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import OperationStep1 from "../OperationStep1/OperationStep1.jsx";
import OperationStep2 from "../OperationStep2/OperationStep2.jsx";
import OperationStep3Breakdown from "../OperationStep3/OperationStep3Breakdown.jsx";
import OperationStep4 from "../OperationStep4/OperationStep4.jsx";
import { CloseIcon } from "../../../../Icons.jsx";
import { useOperationTypes } from "/src/pages/App/hooks/LPsStatement/useOperationTypes.js";
import { useOperationDetails } from "../../../../../../hooks/LPsStatement/useCapitalFlowOperationDetails.js";
import { useCapitalFlowLPOperationAllocation } from "../../../../../../hooks/LPsStatement/useCapitalFlowLPOperationAllocation.js";
import { useCapitalFlowLPFlowAllocation } from "../../../../../../hooks/LPsStatement/useCapitalFlowLPFlowAllocation.js";
import { useCapitalFlowFlowDetails } from "../../../../../../hooks/LPsStatement/useCapitalFlowFlowDetails.js";

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

/** Normalize any date-like value to a plain JS Date */
function toPlainDate(d) {
  if (!d) return null;
  if (typeof d === "object") {
    if (typeof d.toDate === "function") return d.toDate();
    if (d.$d) return d.$d;
  }
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Compute total_fund_commitment:
 * sum commitment_amount where due_date >= closing_period_date
 */
function computeTotalFundCommitment(commitments, dueDate) {
  const dueDateObj = toPlainDate(dueDate);
  if (!dueDateObj) return 0;
  const safe = Array.isArray(commitments) ? commitments : [];
  return safe.reduce((sum, c) => {
    const closing = c?.closing_period_date ? new Date(c.closing_period_date) : null;
    if (!closing || Number.isNaN(closing.getTime())) return sum;
    if (dueDateObj >= closing) {
      return sum + parseFloat(c?.commitment_amount || 0);
    }
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
}) {
  if (!open) return null;

  const isDetail = mode === "detail" && !!operation;

  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Step 1 fields ──────────────────────────────────────────────────────────
  const [operationName, setOperationName] = useState("");
  const [operationType, setOperationType] = useState("");
  const [noticeDate, setNoticeDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);

  // Computed at Step 1, carried forward for final save
  const [totalFundCommitment, setTotalFundCommitment] = useState(0);

  // DB id — set after final save
  const [operationId, setOperationId] = useState(null);

  // ── Step 2 draft + result ──────────────────────────────────────────────────
  const [step2Draft, setStep2Draft] = useState({ ...EMPTY_STEP2_DRAFT });
  const [step2Result, setStep2Result] = useState({
    operationTypeId: "",
    operationTypeName: "",
    flows: [],
    perLp: {},
  });

  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  const TOTAL_STEPS = 4;

  const [savingStep1, setSavingStep1] = useState(false);
  const [step1Error, setStep1Error] = useState(null);

  const { operationTypes, fetchOperationTypes } = useOperationTypes();
  const { createOperation } = useOperationDetails(fundId);

  useEffect(() => {
    if (open) fetchOperationTypes?.().catch(() => {});
  }, [open, fetchOperationTypes]);

  useEffect(() => {
    setShowSuccess(false);
    setStep(1);
    setStep1Error(null);
    setTotalFundCommitment(0);

    if (isDetail) {
      setOperationId(operation?.lps_operation_details_id ?? operation?.operation_id ?? operation?.id ?? null);
      setOperationName(operation?.name ?? operation?.operation_name ?? "");
      setOperationType(String(operation?.operation_type ?? ""));
      setNoticeDate(null);
      setDueDate(null);
      setStep2Draft({ ...EMPTY_STEP2_DRAFT });
      setStep2Result({ operationTypeId: "", operationTypeName: "", flows: [], perLp: {} });
    } else {
      setOperationId(null);
      setOperationName("");
      setOperationType("");
      setNoticeDate(null);
      setDueDate(null);
      setStep2Draft({ ...EMPTY_STEP2_DRAFT });
      setStep2Result({ operationTypeId: "", operationTypeName: "", flows: [], perLp: {} });
    }
  }, [open, isDetail, operation]);

  const operationTypeName = useMemo(() => {
    const arr = Array.isArray(operationTypes) ? operationTypes : [];
    const found = arr.find((t) => String(t?.operation_type_id) === String(operationType));
    return found?.name || "";
  }, [operationTypes, operationType]);

  // ── Step 1 validation — no DB call yet ────────────────────────────────────
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

  /**
   * Called by Step 3 when it has total_operation_amount + overall_percentage_of_commitment.
   * This is the single point where we POST to the database.
   */
  const handleFinalSave = async () => {
    const { flows, perLp, total_operation_amount, overall_percentage_of_commitment } = step2Result;

    // ── 1. Create operation ──────────────────────────────────────────────────
    const newId = await createOperation({
      operation_name: String(operationName).trim(),
      operation_type: Number(operationType),
      notice_date_id: toDateId(noticeDate),
      due_date_id: toDateId(dueDate),
      notice_date: toIsoDate(noticeDate),
      due_date: toIsoDate(dueDate),
      total_fund_commitment: totalFundCommitment,
      total_operation_amount,
      overall_percentage_of_commitment,
    });
    setOperationId(newId);

    // ── 2. Create flows + flow LP allocations ────────────────────────────────
    const flowIdMap = {}; // local flow id → operation_flow_id from DB

    for (const flow of flows) {
      const flowTotal = step2Draft.flowTotals?.[flow.id] ?? null;
      const alloc = totalFundCommitment > 0 && flowTotal !== null
        ? flowTotal / totalFundCommitment : 0;

      const createdFlow = await createFlow(fundId, newId, {
        operation: newId,
        flow_type: Number(flow.flowTypeId),
        flow_name: flow.label,
        input_type: isEqualization ? "percentage" : "amount",
        input_amount: isEqualization ? null : flowTotal,
        input_percentage: isEqualization ? flowTotal : null,
        computed_total_amount: flowTotal,
        allocation_percentage_of_commitment: alloc,
      });

      const opFlowId = createdFlow?.operation_flow_id ?? createdFlow?.id;
      flowIdMap[flow.id] = opFlowId;

      // ── 3. Flow LP allocations ─────────────────────────────────────────────
      for (const [lpId, lpData] of Object.entries(perLp)) {
        const allocatedAmount = lpData.flows?.[flow.id] ?? null;
        if (allocatedAmount === null) continue;

        await createFlowLPAllocation(fundId, newId, opFlowId, {
          operation_flow: opFlowId,
          lp: Number(lpId),
          allocated_amount: allocatedAmount,
        });
      }
    }

    // ── 4. Operation LP allocations ──────────────────────────────────────────
    for (const [lpId, lpData] of Object.entries(perLp)) {
      await createOperationLPAllocation(fundId, newId, {
        operation: newId,
        lp: Number(lpId),
        share_class: lpData.shareClassId ? Number(lpData.shareClassId) : null,
        commitment_amount: lpData.commitmentNumber ?? 0,
        capital_call: lpData.mainAmount ?? 0,
        called_percentage: lpData.calledPct ?? 0,
        shares_issued: lpData.sharesIssued ?? 0,
      });
    }

    return newId;
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
          operation_type: operationType,
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
      try {
        await step3Ref.current?.submitToNext?.();
        setStep(4);
      } catch {}
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
      return;
    }

    setShowSuccess(true);
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    if (typeof onClose === "function") onClose();
  };

  const stepTabs = useMemo(
    () => [
      { step: 1, label: "Informations" },
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
            lps={lps}
            fundId={fundId}
            operationId={operationId}
            operationType={operationTypeName}
            operationTypeId={operationType}
            operationTypeName={operationTypeName}
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
            totalFundCommitment={totalFundCommitment}
            onFinalSave={handleFinalSave}
          />
        );

      case 4:
        return <OperationStep4 />;

      default:
        return null;
    }
  };

  return (
    <>
      <div className="opw-drawer-backdrop" onClick={() => onClose?.()}>
        <aside className="opw-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="opw-header">
            <div className="opw-header-left">
              <h2 className="opw-title">
                {isDetail ? "Operation details" : "Create a new operation"}
              </h2>

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
              onClick={() => onClose?.()}
              aria-label="Close"
              disabled={savingStep1}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="opw-body">{renderStep()}</div>

          <div className="opw-footer">
            <button
              type="button"
              className="opw-nav-btn opw-btn-ghost"
              onClick={handlePrev}
              disabled={step === 1 || savingStep1}
            >
              Previous
            </button>

            <button
              type="button"
              className="opw-nav-btn opw-btn-primary"
              onClick={handleNext}
              disabled={savingStep1}
            >
              {step === 1 && savingStep1 ? "Saving..." : "Next"}
            </button>
          </div>
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