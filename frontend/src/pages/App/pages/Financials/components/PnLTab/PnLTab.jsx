// src/pages/App/pages/Financials/components/PnLTab/PnLTab.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate, useLocation } from "react-router-dom";

import QuarterSelector from "/src/components/QuarterSelection/QuarterSelector.jsx";
import {
  RefreshUpIcon,
  DownloadIcon,
  EditLineIcon,
  AddFileIcon,
  PlusIcon,
} from "../../../../components/Icons.jsx";
import Toast from "../../../../components/Toast/Toast.jsx"; // ✅ Import Toast
import { useTimeframes, saveNewTimeframe } from "../../../../hooks/Core/useTimeframes";
import PnLIncome from "./PnLTables/PnLIncome.jsx";
import PnLExpenses from "./PnLTables/PnLExpenses.jsx";
import PnLTax from "./PnLTables/PnLTax.jsx";
import { API_BASE_URL } from "../../../../hooks/useApi.js";
import "./PnL.css";

/* -----------------------------
   API helpers (no new files)
----------------------------- */
async function apiFetchPnL(fundId, timeframeIds = []) {
  const qs =
    Array.isArray(timeframeIds) && timeframeIds.length > 0
      ? `?timeframe_ids=${timeframeIds.join(",")}`
      : "";

  const r = await fetch(`${API_BASE_URL}/api/pnl/${fundId}/${qs}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`PnL GET failed (${r.status}): ${txt}`);
  }

  return r.json();
}

async function apiUpsertPnLValue(fundId, { lineItemId, timeframeId, amount }) {
  const r = await fetch(`${API_BASE_URL}/api/pnl/${fundId}/value/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lineItemId: Number(lineItemId),
      timeframeId: Number(timeframeId),
      amount: amount === "" || amount === null || amount === undefined ? 0 : Number(amount),
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`PnL upsert failed (${r.status}): ${txt}`);
  }

  return r.json();
}

async function apiCreatePnLLineItem(fundId, { category, name }) {
  const r = await fetch(`${API_BASE_URL}/api/pnl/${fundId}/line-item/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: String(category || "").toLowerCase(),
      name: String(name || "").trim(),
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`PnL line-item create failed (${r.status}): ${txt}`);
  }

  return r.json();
}

/* -----------------------------
   helpers
----------------------------- */
const makeId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function getPeriodLabel(p) {
  return (
    (p?.label ??
      p?.name ??
      p?.display_label ??
      p?.displayLabel ??
      p?.period_name ??
      p?.periodName ??
      "") + ""
  ).trim();
}

const ensureValueShape = (rows, headerPeriods) => {
  const ids = headerPeriods.map((p) => String(p.id));
  return (rows || []).map((r) => {
    const byPeriod = { ...(r?.byPeriod || {}) };
    ids.forEach((id) => {
      if (byPeriod[id] === undefined) byPeriod[id] = "";
    });
    return { ...r, byPeriod };
  });
};

const sumForPeriod = (rows, periodId) => {
  const pid = String(periodId);
  return (rows || []).reduce((acc, r) => acc + Number(r?.byPeriod?.[pid] || 0), 0);
};

// convert backend map {"12":{"5":123}} => aligned rows
function valuesMapToRows(lines, valueMap) {
  const map = valueMap || {};
  return (lines || []).map((line) => {
    const lid = String(line?.id);
    const byPeriodRaw = map[lid] || {};
    const byPeriod = {};
    Object.keys(byPeriodRaw).forEach((pid) => {
      byPeriod[String(pid)] = byPeriodRaw[pid];
    });
    return { byPeriod };
  });
}

/* -----------------------------
   component
----------------------------- */
const PnLTab = () => {
  const { fundId } = useOutletContext();
  const params = useParams();
  const effectiveFundId = fundId || params?.fundId || params?.id || "";

  const navigate = useNavigate();
  const location = useLocation();

  const { quarters, isLoading, setQuarters } = useTimeframes(effectiveFundId);
  const [toast, setToast] = useState(null);
  const selectedTimeframeIds = useMemo(() => {
    const qp = new URLSearchParams(location.search);
    return (
      qp
        .get("timeframes")
        ?.split(",")
        .map(Number)
        .filter((id) => !isNaN(id)) || []
    );
  }, [location.search]);

  const setTimeframesInUrl = (ids) => {
    const qp = new URLSearchParams(location.search);
    const cleaned = (Array.isArray(ids) ? ids : [])
      .map(Number)
      .filter((n) => Number.isFinite(n));

    if (cleaned.length === 0) qp.delete("timeframes");
    else qp.set("timeframes", cleaned.join(","));

    navigate({ search: qp.toString() }, { replace: true });
  };

  const handleToggleTimeframe = (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;

    if (selectedTimeframeIds.includes(numId)) {
      setTimeframesInUrl(selectedTimeframeIds.filter((x) => x !== numId));
    } else {
      setTimeframesInUrl([...selectedTimeframeIds, numId]);
    }
  };

  const handleSaveNew = async (newTimeframe) => {
    try {
      const formatted = await saveNewTimeframe(effectiveFundId, newTimeframe);
      setQuarters((prev) => [...(Array.isArray(prev) ? prev : []), formatted]);
      setTimeframesInUrl([...selectedTimeframeIds, Number(formatted.id)]);
    } catch (error) {
      console.error("PnLTab: Persistence error:", error);
    }
  };

  // UI toggles
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax] = useState(true);

  // Lines (from backend + custom)
  const [incomeLines, setIncomeLines] = useState([]);
  const [expenseLines, setExpenseLines] = useState([]);
  const [taxLines, setTaxLines] = useState([]);

  // Values
  const [incomeValues, setIncomeValues] = useState([]);
  const [expenseValues, setExpenseValues] = useState([]);
  const [taxValues, setTaxValues] = useState([]);

  const [pnlLoading, setPnlLoading] = useState(false);
  const [pnlError, setPnlError] = useState("");

  const sortedQuarters = useMemo(() => {
    const list = Array.isArray(quarters) ? quarters : [];
    return list
      .slice()
      .sort((a, b) => new Date(b.full_date || b.date) - new Date(a.full_date || a.date));
  }, [quarters]);

  const headerPeriods = useMemo(() => {
    if (!sortedQuarters?.length) return [];
    if (selectedTimeframeIds.length === 0) return [];
    const selectedSet = new Set(selectedTimeframeIds.map(Number));
    return sortedQuarters.filter((q) => selectedSet.has(Number(q.id)));
  }, [sortedQuarters, selectedTimeframeIds]);

  // ✅ Load from backend
  useEffect(() => {
    let alive = true;

    async function loadPnL() {
      if (!effectiveFundId) return;

      setPnlLoading(true);
      setPnlError("");

      try {
        const data = await apiFetchPnL(effectiveFundId, selectedTimeframeIds);
        if (!alive) return;

        const normalizeLines = (arr) =>
          (arr || []).map((x) => ({
            ...x,
            id: x.line_item_id, // IMPORTANT
            label: x.name ?? x.label ?? "",
            isCustom: false,
          }));

        const incLines = normalizeLines(data.incomeLines);
        const expLines = normalizeLines(data.expenseLines);
        const taxLs = normalizeLines(data.taxLines);

        setIncomeLines(incLines);
        setExpenseLines(expLines);
        setTaxLines(taxLs);

        setIncomeValues(valuesMapToRows(incLines, data.incomeValues));
        setExpenseValues(valuesMapToRows(expLines, data.expenseValues));
        setTaxValues(valuesMapToRows(taxLs, data.taxValues));
      } catch (e) {
        if (!alive) return;
        setPnlError(e?.message || "Failed to load PnL");
      } finally {
        if (alive) setPnlLoading(false);
      }
    }

    loadPnL();
    return () => {
      alive = false;
    };
  }, [effectiveFundId, selectedTimeframeIds.join(",")]);

  // keep values shape in sync with selected columns
  useEffect(() => {
    setIncomeValues((prev) => ensureValueShape(Array.isArray(prev) ? prev : [], headerPeriods));
    setExpenseValues((prev) => ensureValueShape(Array.isArray(prev) ? prev : [], headerPeriods));
    setTaxValues((prev) => ensureValueShape(Array.isArray(prev) ? prev : [], headerPeriods));
  }, [headerPeriods]);

  // totals
  const totalIncomeByPeriod = useMemo(() => {
    const out = {};
    headerPeriods.forEach((p) => (out[p.id] = sumForPeriod(incomeValues, p.id)));
    return out;
  }, [incomeValues, headerPeriods]);

  const totalExpensesByPeriod = useMemo(() => {
    const out = {};
    headerPeriods.forEach((p) => (out[p.id] = sumForPeriod(expenseValues, p.id)));
    return out;
  }, [expenseValues, headerPeriods]);

  const totalTaxByPeriod = useMemo(() => {
    const out = {};
    headerPeriods.forEach((p) => (out[p.id] = sumForPeriod(taxValues, p.id)));
    return out;
  }, [taxValues, headerPeriods]);

  const netByPeriod = useMemo(() => {
    const out = {};
    headerPeriods.forEach((p) => {
      const id = p.id;
      out[id] =
        Number(totalIncomeByPeriod[id] || 0) -
        Number(totalExpensesByPeriod[id] || 0) -
        Number(totalTaxByPeriod[id] || 0);
    });
    return out;
  }, [headerPeriods, totalIncomeByPeriod, totalExpensesByPeriod, totalTaxByPeriod]);

  // add/remove rows (UI)
  const addIncomeRow = () => {
    setIncomeLines((prev) => [...prev, { id: makeId("inc"), label: "", isCustom: true }]);
    setIncomeValues((prev) => [...(Array.isArray(prev) ? prev : []), { byPeriod: {} }]);
  };
  const removeIncomeRow = (index) => {
    setIncomeLines((prev) => prev.filter((_, i) => i !== index));
    setIncomeValues((prev) => prev.filter((_, i) => i !== index));
  };

  const addExpenseRow = () => {
    setExpenseLines((prev) => [...prev, { id: makeId("exp"), label: "", isCustom: true }]);
    setExpenseValues((prev) => [...(Array.isArray(prev) ? prev : []), { byPeriod: {} }]);
  };
  const removeExpenseRow = (index) => {
    setExpenseLines((prev) => prev.filter((_, i) => i !== index));
    setExpenseValues((prev) => prev.filter((_, i) => i !== index));
  };

  const addTaxRow = () => {
    setTaxLines((prev) => [...prev, { id: makeId("tax"), label: "", isCustom: true }]);
    setTaxValues((prev) => [...(Array.isArray(prev) ? prev : []), { byPeriod: {} }]);
  };
  const removeTaxRow = (index) => {
    setTaxLines((prev) => prev.filter((_, i) => i !== index));
    setTaxValues((prev) => prev.filter((_, i) => i !== index));
  };

  // upload/download
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => {
    if (!effectiveFundId) return alert("Missing fundId in URL.");
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      form.append("quarters", JSON.stringify(selectedTimeframeIds || []));

      const res = await fetch(
        `${API_BASE_URL}/api/funds/${encodeURIComponent(effectiveFundId)}/financials/pnl/upload`,
        { method: "POST", body: form }
      );

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      console.log("Upload success:", data);
    } catch (err) {
      alert(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = () =>
    console.log("DOWNLOAD", { fundId: effectiveFundId, selectedTimeframeIds });

  /* -----------------------------
     ✅ SAVE ALL TO DB (ALL 3 TABLES + custom rows)
  ----------------------------- */
  const [savingAll, setSavingAll] = useState(false);

  // send fewer requests: only send cells the user filled
  const isFilled = (v) => !(v === "" || v === null || v === undefined);

  const runInBatches = async (items, batchSize, fn) => {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(batch.map(fn));
    }
  };

  // ✅ creates DB line items for custom rows and returns updated arrays with real IDs
  const persistCustomRows = async () => {
    // helper: persist custom rows in one section
    const persistSection = async (category, lines, values) => {
      const nextLines = [...(lines || [])];

      for (let i = 0; i < nextLines.length; i++) {
        const line = nextLines[i];
        if (!line?.isCustom) continue;

        const name = String(line?.label || "").trim();
        if (!name) continue; // ignore empty custom rows

        const created = await apiCreatePnLLineItem(effectiveFundId, { category, name });

        // replace with real DB-backed line
        nextLines[i] = {
          ...line,
          id: created.line_item_id,     // IMPORTANT: now numeric
          line_item_id: created.line_item_id,
          category_id: created.category_id,
          label: created.name,
          name: created.name,
          isCustom: false,
        };
      }

      // values array stays aligned
      return { nextLines, nextValues: values };
    };

    const inc = await persistSection("income", incomeLines, incomeValues);
    const exp = await persistSection("expense", expenseLines, expenseValues);
    const tax = await persistSection("tax", taxLines, taxValues);

    setIncomeLines(inc.nextLines);
    setExpenseLines(exp.nextLines);
    setTaxLines(tax.nextLines);

    // return updated arrays to use immediately (setState is async)
    return {
      incomeLines: inc.nextLines, incomeValues,
      expenseLines: exp.nextLines, expenseValues,
      taxLines: tax.nextLines, taxValues,
    };
  };

  const buildJobs = (lines, values) => {
    const jobs = [];

    (lines || []).forEach((line, idx) => {
      const lineItemId = Number(line?.id);
      if (!Number.isFinite(lineItemId)) return;

      const byPeriod = values?.[idx]?.byPeriod || {};
      headerPeriods.forEach((p) => {
        const timeframeId = Number(p.id);
        const raw = byPeriod[String(timeframeId)];

        // only send filled cells (avoid spamming zeros)
        if (!isFilled(raw)) return;

        jobs.push({
          lineItemId,
          timeframeId,
          amount: Number(raw),
        });
      });
    });

    return jobs;
  };

  const handleSave = async () => {
    if (!effectiveFundId) return;
    if (headerPeriods.length === 0) {
        setToast({
            type: "error",
            title: "Selection Required",
            message: "Select at least one timeframe first."
        });
        return;
    }

    try {
      setSavingAll(true);
      setPnlError("");

      // ✅ Step 1: Persist custom rows
      const updated = await persistCustomRows();

      // ✅ Step 2: Build jobs
      const jobs = [
        ...buildJobs(updated.incomeLines, updated.incomeValues),
        ...buildJobs(updated.expenseLines, updated.expenseValues),
        ...buildJobs(updated.taxLines, updated.taxValues),
      ];

      if (jobs.length === 0) {
        setToast({
            type: "info",
            title: "No Changes",
            message: "Nothing to save. Please fill some values first."
        });
        setSavingAll(false);
        return;
      }

      // ✅ Step 3: Write values in batches
      await runInBatches(jobs, 10, (payload) => apiUpsertPnLValue(effectiveFundId, payload));

      // ✅ Step 4: Reload from backend
      const data = await apiFetchPnL(effectiveFundId, selectedTimeframeIds);

      const normalizeLines = (arr) =>
        (arr || []).map((x) => ({
          ...x,
          id: x.line_item_id,
          label: x.name ?? x.label ?? "",
          isCustom: false,
        }));

      const incLines = normalizeLines(data.incomeLines);
      const expLines = normalizeLines(data.expenseLines);
      const taxLs = normalizeLines(data.taxLines);

      setIncomeLines(incLines);
      setExpenseLines(expLines);
      setTaxLines(taxLs);

      setIncomeValues(valuesMapToRows(incLines, data.incomeValues));
      setExpenseValues(valuesMapToRows(expLines, data.expenseValues));
      setTaxValues(valuesMapToRows(taxLs, data.taxValues));

      // ✅ Success Toast
      setToast({
        type: "success",
        title: "Financials Saved",
        message: "Income, Expenses, and Tax data updated successfully."
      });

    } catch (e) {
      console.error(e);
      setPnlError(e?.message || "Save failed");
      
      // ✅ Error Toast
      setToast({
        type: "error",
        title: "Save Failed",
        message: e?.message || "An error occurred while saving financials."
      });
    } finally {
      setSavingAll(false);
    }
  };

  // HeaderRow
  const HeaderRow = ({ leftSlot = null }) => (
    <div className="table-header-row">
      <div className="header-left-slot">{leftSlot}</div>

      {headerPeriods.map((p) => {
        const label = getPeriodLabel(p);
        return (
          <div key={p.id || label} className="col-period">
            <AddFileIcon />
            <EditLineIcon />
            <span className="period-label">
              {label} <span>(€)</span>
            </span>
          </div>
        );
      })}

      <div />
    </div>
  );

  const scopeVars = useMemo(
    () => ({
      "--pnl-cols": String(headerPeriods.length),
      "--pnl-label-col": "minmax(260px, 1fr)",
      "--pnl-period-col": "minmax(160px, 1fr)",
      "--pnl-actions-col": "110px",
    }),
    [headerPeriods.length]
  );

  return (
    <>
      <div className="toolbar-row">
        <div className="left-tools">
          <QuarterSelector
            options={quarters}
            selected={selectedTimeframeIds}
            onChange={handleToggleTimeframe}
            onSaveNew={handleSaveNew}
            isLoading={isLoading}
            isSingle={false}
          />
        </div>

        <div className="right-tools">
          <button
            className="ghost-btn"
            type="button"
            onClick={handleUploadClick}
            disabled={!effectiveFundId || uploading}
          >
            <RefreshUpIcon /> {uploading ? "Uploading..." : "Upload"}
          </button>

          <button className="ghost-btn" type="button" onClick={handleDownload}>
            <DownloadIcon /> Download
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
      </div>

      {pnlLoading ? <div style={{ padding: 12 }}>Loading PnL…</div> : null}
      {pnlError ? <div style={{ padding: 12, color: "crimson" }}>{pnlError}</div> : null}

      {/* INCOME */}
      <section className="financials-card">
        <div className="pnl-card-scroll" style={scopeVars}>
          <div className="pnl-grid-scope">
            <div className="financials-section-title">Income</div>
            <HeaderRow
              leftSlot={
                <button className="pill-btn" type="button" onClick={addIncomeRow}>
                  <PlusIcon /> Add income
                </button>
              }
            />

            <PnLIncome
              fundId={effectiveFundId}
              headerPeriods={headerPeriods}
              showIncome={showIncome}
              setShowIncome={setShowIncome}
              incomeLines={incomeLines}
              setIncomeLines={setIncomeLines}
              incomeValues={incomeValues}
              setIncomeValues={setIncomeValues}
              totalIncomeByPeriod={totalIncomeByPeriod}
              onAddRow={addIncomeRow}
              onRemoveRow={removeIncomeRow}
            />
          </div>
        </div>
      </section>

      {/* EXPENSES */}
      <section className="financials-card">
        <div className="pnl-card-scroll" style={scopeVars}>
          <div className="pnl-grid-scope">
            <div className="financials-section-title">Expense</div>
            <HeaderRow
              leftSlot={
                <button className="pill-btn" type="button" onClick={addExpenseRow}>
                  <PlusIcon /> Add expense
                </button>
              }
            />

            <PnLExpenses
              fundId={effectiveFundId}
              headerPeriods={headerPeriods}
              showExpenses={showExpenses}
              setShowExpenses={setShowExpenses}
              expenseLines={expenseLines}
              setExpenseLines={setExpenseLines}
              expenseValues={expenseValues}
              setExpenseValues={setExpenseValues}
              totalExpensesByPeriod={totalExpensesByPeriod}
              onAddRow={addExpenseRow}
              onRemoveRow={removeExpenseRow}
            />
          </div>
        </div>
      </section>

      {/* TAX */}
      <section className="financials-card">
        <div className="pnl-card-scroll" style={scopeVars}>
          <div className="pnl-grid-scope">
            <div className="financials-section-title">Tax</div>
            <HeaderRow
              leftSlot={
                <button className="pill-btn" type="button" onClick={addTaxRow}>
                  <PlusIcon /> Add tax
                </button>
              }
            />

            <PnLTax
              fundId={effectiveFundId}
              headerPeriods={headerPeriods}
              showTax={showTax}
              setShowTax={setShowTax}
              taxLines={taxLines}
              setTaxLines={setTaxLines}
              taxValues={taxValues}
              setTaxValues={setTaxValues}
              totalTaxByPeriod={totalTaxByPeriod}
              onAddRow={addTaxRow}
              onRemoveRow={removeTaxRow}
            />
          </div>
        </div>
      </section>

      {/* NET */}
      <section className="financials-card financials-card--net">
        <div className="pnl-card-scroll" style={scopeVars}>
          <div className="pnl-grid-scope">
            <div className="net-row net-row--standalone">
              <div>Net Profit / Net loss</div>

              {headerPeriods.map((p) => {
                const v = Number(netByPeriod[p.id] || 0);
                return (
                  <div key={p.id} className={`net-value ${v >= 0 ? "positive" : "negative"}`}>
                    {v.toLocaleString()}
                  </div>
                );
              })}

              <div />
            </div>
          </div>
        </div>
      </section>

      <div className="pnl-footer">
        <div className="pnl-actions">
          <button className="pnl-btn-save" onClick={handleSave} disabled={savingAll}>
            {savingAll ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default PnLTab;
