// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./OperationPanel.css";

import OperationStep1 from "../OperationStep1/OperationStep1.jsx";
import OperationStep2 from "../OperationStep2/OperationStep2.jsx";
import OperationStep3Breakdown from "../OperationStep3/OperationStep3Breakdown.jsx";
import OperationStep4 from "../OperationStep4/OperationStep4.jsx";

import { CloseIcon } from "../../../../Icons.jsx";
import { useOperationTypes } from "/src/pages/App/hooks/LPsStatement/useOperationTypes.js";

/** -------------------------
 * LOCAL-FIRST API
 * Always call relative "/api/..." so it works locally.
 * ------------------------- */
function apiUrl(path) {
  const p = String(path || "");
  const pp = p.startsWith("/") ? p : `/${p}`;
  return `/api${pp}`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    // show DRF validation errors nicely
    let msg = `Request failed (${res.status})`;
    if (data && typeof data === "object") {
      msg = JSON.stringify(data);
    } else if (typeof data === "string" && data.trim()) {
      msg = data;
    }

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.url = url;
    throw err;
  }

  return data;
}

/** ✅ Date -> YYYYMMDD integer (matches your DRF "notice_date_id" fields) */
function toDateId(d) {
  if (!d) return null;

  // dayjs-like objects
  if (typeof d === "object") {
    if (typeof d.toDate === "function") d = d.toDate();
    else if (d.$d) d = d.$d;
  }

  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;

  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const day = dt.getDate();
  return y * 10000 + m * 100 + day; // YYYYMMDD
}

/** optional extra compatibility: also provide YYYY-MM-DD (won’t hurt) */
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

const EMPTY_STEP2_DRAFT = {
  breakdown: "lps",
  flows: [],
  flowTotalInputs: {},
  flowTotals: {},
};

export default function OperationPanel({
  open,
  mode = "new", // "new" | "detail"
  operation = null,
  lps = [],
  shareClasses = [],
  fundId,
  onClose,
}) {
  if (!open) return null;

  const isDetail = mode === "detail" && !!operation;

  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Step 1 fields
  const [operationName, setOperationName] = useState("");
  const [operationType, setOperationType] = useState(""); // operation_type_id (string)
  const [noticeDate, setNoticeDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);

  // DB ids
  const [operationId, setOperationId] = useState(null);

  // Step 2 draft + result
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

  useEffect(() => {
    if (open) fetchOperationTypes?.().catch(() => {});
  }, [open, fetchOperationTypes]);

  useEffect(() => {
    setShowSuccess(false);
    setStep(1);
    setStep1Error(null);

    if (isDetail) {
      setOperationId(operation?.operation_id ?? operation?.id ?? null);
      setOperationName(operation?.operation_name ?? operation?.label ?? "");
      setOperationType(String(operation?.operation_type ?? ""));
      setNoticeDate(null);
      setDueDate(null);

      setStep2Draft({ ...EMPTY_STEP2_DRAFT });
      setStep2Result({
        operationTypeId: "",
        operationTypeName: "",
        flows: [],
        perLp: {},
      });
    } else {
      setOperationId(null);
      setOperationName("");
      setOperationType("");
      setNoticeDate(null);
      setDueDate(null);

      setStep2Draft({ ...EMPTY_STEP2_DRAFT });
      setStep2Result({
        operationTypeId: "",
        operationTypeName: "",
        flows: [],
        perLp: {},
      });
    }
  }, [open, isDetail, operation]);

  const operationTypeName = useMemo(() => {
    const arr = Array.isArray(operationTypes) ? operationTypes : [];
    const found = arr.find(
      (t) => String(t?.operation_type_id) === String(operationType)
    );
    return found?.name || "";
  }, [operationTypes, operationType]);

  /**
   * ✅ Create operation in DB (Step1 -> Step2)
   * FIX:
   * - correct URL: /api/funds/<fund_id>/operations/
   * - send "fund" + "notice_date_id" + "due_date_id"
   */
  const createOperationIfNeeded = async () => {
    if (operationId) return operationId;

    if (!fundId) throw new Error("fundId is missing.");
    if (!String(operationName || "").trim())
      throw new Error("Operation name is required.");
    if (!operationType) throw new Error("Operation type is required.");
    if (!noticeDate) throw new Error("Notice date is required.");
    if (!dueDate) throw new Error("Due date is required.");

    const notice_date_id = toDateId(noticeDate);
    const due_date_id = toDateId(dueDate);

    if (!notice_date_id) throw new Error("Notice date is invalid.");
    if (!due_date_id) throw new Error("Due date is invalid.");

    const url = apiUrl(`/funds/${fundId}/operations/`);

    const payload = {
      // ✅ DRF form shows Fund field -> include it
      fund: Number(fundId),

      // ✅ operation fields
      operation_name: String(operationName).trim(),

      // ✅ usually serializer field name is "operation_type"
      operation_type: Number(operationType),

      // ✅ matches DRF form: "Notice date id" / "Due date id"
      notice_date_id,
      due_date_id,

      // ✅ harmless compatibility aliases (DRF ignores unknown keys)
      fund_id: Number(fundId),
      operation_type_id: Number(operationType),
      notice_date: toIsoDate(noticeDate),
      due_date: toIsoDate(dueDate),
    };

    const data = await fetchJson(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const newId = data?.operation_id ?? data?.id ?? null;
    if (!newId)
      throw new Error("Operation created but response missing operation_id.");

    setOperationId(newId);
    return newId;
  };

  const handleStep2Next = (payload = {}) => {
    setStep2Result({
      operationTypeId: String(operationType || payload.operationTypeId || ""),
      operationTypeName: operationTypeName || payload.operationTypeName || "",
      flows: payload.flows || [],
      perLp: payload.perLp || {},
    });
    setStep(3);
  };

  const handleNext = async () => {
    if (step === 1) {
      setSavingStep1(true);
      setStep1Error(null);
      try {
        await createOperationIfNeeded();
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
  const safeShareClasses = Array.isArray(shareClasses) ? shareClasses : [];

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
            lps={safeLps}
            shareClasses={safeShareClasses}
            fundId={fundId}
            operationId={operationId}
            operationType={operationTypeName}
            operationTypeId={operationType}
            operationTypeName={operationTypeName}
            onNext={handleStep2Next}
            draft={step2Draft}
            setDraft={setStep2Draft}
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
