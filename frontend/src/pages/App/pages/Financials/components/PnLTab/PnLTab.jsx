import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { TimeframeProvider, useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import { RefreshUpIcon, DownloadIcon, PlusIcon } from '/src/components/Icons/InteractiveIcons';
import { usePnLApi } from "../../../../hooks/Financials/usePnLApi";
import { usePnLUpload } from "../../../../hooks/Financials/usePnLUpload";
import { PageSpinner, PageError, PageNoData } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
import { exportWorkbook } from "../../../../../../components/Export/exportExcel";

import TimeframeSelector from "/src/components/QuarterSelection/TimeframeSelector.jsx";
import Toast from "../../../../components/Toast/Toast.jsx";
import PnLIncome from "./PnLTables/PnLIncome.jsx";
import PnLExpenses from "./PnLTables/PnLExpenses.jsx";
import PnLTax from "./PnLTables/PnLTax.jsx";
import "./PnL.css";

const makeId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function getPeriodLabel(p) {
  return (
    (p?.label ?? p?.name ?? p?.display_label ?? p?.displayLabel ?? p?.period_name ?? p?.periodName ?? "") + ""
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

function PnLTabContent() {
  const { fundId } = useOutletContext();
  const params = useParams();
  const effectiveFundId = fundId || params?.fundId || params?.id || "";

  const navigate = useNavigate();
  const location = useLocation();

  const { quarters, isLoading } = useTimeframeContext();
  const [toast, setToast] = useState(null);
  const [defaultApplied, setDefaultApplied] = useState(false);

  const selectedTimeframeIds = useMemo(() => {
    const qp = new URLSearchParams(location.search);
    return qp.get("timeframes")?.split(",").map(Number).filter((id) => !isNaN(id)) || [];
  }, [location.search]);

  useEffect(() => {
    if (defaultApplied) return;
    if (isLoading || !quarters?.length) return;
    if (selectedTimeframeIds.length > 0) { setDefaultApplied(true); return; }

    const sorted = [...quarters].sort(
      (a, b) => new Date(a.full_date || a.date) - new Date(b.full_date || b.date)
    );
    const latest = sorted[sorted.length - 1];
    if (!latest?.id) return;

    const qp = new URLSearchParams(location.search);
    qp.set("timeframes", String(latest.id));
    navigate({ search: qp.toString() }, { replace: true });
    setDefaultApplied(true);
  }, [quarters, isLoading, selectedTimeframeIds, defaultApplied, location.search, navigate]);

  const { fetchPnL, upsertValue, createLineItem, updateLineItem, deleteLineItem } = usePnLApi(effectiveFundId);
  const { fileInputRef, uploading, handleUploadClick, handleFileSelected } = usePnLUpload(effectiveFundId, selectedTimeframeIds);

  const setTimeframesInUrl = (ids) => {
    const qp = new URLSearchParams(location.search);
    const cleaned = (Array.isArray(ids) ? ids : []).map(Number).filter((n) => Number.isFinite(n));
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

  const [showIncome, setShowIncome]   = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax]         = useState(true);

  const [incomeLines,   setIncomeLines]   = useState([]);
  const [expenseLines,  setExpenseLines]  = useState([]);
  const [taxLines,      setTaxLines]      = useState([]);
  const [incomeValues,  setIncomeValues]  = useState([]);
  const [expenseValues, setExpenseValues] = useState([]);
  const [taxValues,     setTaxValues]     = useState([]);

  const [pnlLoading, setPnlLoading] = useState(false);
  const [pnlError,   setPnlError]   = useState("");

  const sortedQuarters = useMemo(() => {
    const list = Array.isArray(quarters) ? quarters : [];
    return list.slice().sort((a, b) => new Date(a.full_date || a.date) - new Date(b.full_date || b.date));
  }, [quarters]);

  const headerPeriods = useMemo(() => {
    if (!sortedQuarters?.length || selectedTimeframeIds.length === 0) return [];
    const selectedSet = new Set(selectedTimeframeIds.map(Number));
    const filtered = sortedQuarters.filter((q) => selectedSet.has(Number(q.id)));
    return filtered.sort((a, b) =>
      selectedTimeframeIds.indexOf(Number(a.id)) - selectedTimeframeIds.indexOf(Number(b.id))
    );
  }, [sortedQuarters, selectedTimeframeIds]);

  const loadPnL = useCallback(async () => {
    if (!effectiveFundId) return;
    setPnlLoading(true);
    setPnlError("");
    try {
      const data = await fetchPnL(); // Fetch all data; remove selectedTimeframeIds
      const normalizeLines = (arr) =>
        (arr || []).map((x) => ({
          ...x,
          id: x.line_item_id,
          label: x.name ?? x.label ?? "",
          isCustom: false,
        }));
      const incLines = normalizeLines(data.incomeLines);
      const expLines = normalizeLines(data.expenseLines);
      const taxLs    = normalizeLines(data.taxLines);
      setIncomeLines(incLines);
      setExpenseLines(expLines);
      setTaxLines(taxLs);
      setIncomeValues(valuesMapToRows(incLines, data.incomeValues));
      setExpenseValues(valuesMapToRows(expLines, data.expenseValues));
      setTaxValues(valuesMapToRows(taxLs, data.taxValues));
    } catch (e) {
      setPnlError(e?.message || "Failed to load PnL");
    } finally {
      setPnlLoading(false);
    }
  }, [effectiveFundId, fetchPnL]);

  useEffect(() => { loadPnL(); }, [loadPnL]);

  useEffect(() => {
    setIncomeValues((prev)  => ensureValueShape(Array.isArray(prev) ? prev : [], headerPeriods));
    setExpenseValues((prev) => ensureValueShape(Array.isArray(prev) ? prev : [], headerPeriods));
    setTaxValues((prev)     => ensureValueShape(Array.isArray(prev) ? prev : [], headerPeriods));
  }, [headerPeriods]);

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
      out[p.id] =
        Number(totalIncomeByPeriod[p.id]   || 0) -
        Number(totalExpensesByPeriod[p.id] || 0) -
        Number(totalTaxByPeriod[p.id]      || 0);
    });
    return out;
  }, [headerPeriods, totalIncomeByPeriod, totalExpensesByPeriod, totalTaxByPeriod]);

  const addIncomeRow  = () => { setIncomeLines((p)  => [...p,  { id: makeId("inc"), label: "", isCustom: true }]); setIncomeValues((p)  => [...(Array.isArray(p) ? p : []), { byPeriod: {} }]); };
  const addExpenseRow = () => { setExpenseLines((p) => [...p,  { id: makeId("exp"), label: "", isCustom: true }]); setExpenseValues((p) => [...(Array.isArray(p) ? p : []), { byPeriod: {} }]); };
  const addTaxRow     = () => { setTaxLines((p)     => [...p,  { id: makeId("tax"), label: "", isCustom: true }]); setTaxValues((p)     => [...(Array.isArray(p) ? p : []), { byPeriod: {} }]); };

  const removeIncomeRow  = (i) => { setIncomeLines((p)  => p.filter((_, j) => j !== i)); setIncomeValues((p)  => p.filter((_, j) => j !== i)); };
  const removeExpenseRow = (i) => { setExpenseLines((p) => p.filter((_, j) => j !== i)); setExpenseValues((p) => p.filter((_, j) => j !== i)); };
  const removeTaxRow     = (i) => { setTaxLines((p)     => p.filter((_, j) => j !== i)); setTaxValues((p)     => p.filter((_, j) => j !== i)); };

  // ── Shared line item actions — defined once, passed down as props ──────────

  const handleUpdateLineItem = useCallback(async ({ lineItemId, name }) => {
    if (!Number.isFinite(Number(lineItemId))) return;
    try {
      await updateLineItem({ lineItemId: Number(lineItemId), name });
    } catch (err) {
      console.error("Failed to update line item:", err);
      setToast({ type: "error", title: "Update Failed", message: err?.message || "Could not update line item." });
      throw err; // re-throw so the child can rollback
    }
  }, [updateLineItem]);

  const handleDeleteLineItem = useCallback(async ({ lineItemId, isCustom, index, setLines, setValues }) => {
    if (!isCustom && Number.isFinite(Number(lineItemId))) {
      try {
        await deleteLineItem({ lineItemId: Number(lineItemId) });
      } catch (err) {
        console.error("Failed to delete line item:", err);
        setToast({ type: "error", title: "Delete Failed", message: err?.message || "Could not delete line item." });
        return; // abort — don't remove from UI
      }
    }
    setLines((prev)  => prev.filter((_, i) => i !== index));
    setValues((prev) => prev.filter((_, i) => i !== index));
  }, [deleteLineItem]);

  // ─────────────────────────────────────────────────────────────────────────

  const handleDownload = () => {
    const periodHeaders = headerPeriods.map((p) => getPeriodLabel(p));
    const buildSectionRows = (lines, values, totals, sectionName) => [
      ["Line Item", ...periodHeaders],
      ...(lines || []).map((line, idx) => {
        const byPeriod = values?.[idx]?.byPeriod || {};
        return [line?.label || line?.name || "", ...headerPeriods.map((p) => Number(byPeriod[String(p.id)] || 0))];
      }),
      [`Total ${sectionName}`, ...headerPeriods.map((p) => Number(totals?.[p.id] || 0))],
    ];
    const netRows = [
      ["Metric", ...periodHeaders],
      ["Net Profit / Net loss", ...headerPeriods.map((p) => Number(netByPeriod?.[p.id] || 0))],
    ];
    exportWorkbook(`pnl-fund-${effectiveFundId}.xlsx`, [
      { name: "Income",  rows: buildSectionRows(incomeLines,  incomeValues,  totalIncomeByPeriod,   "Income") },
      { name: "Expense", rows: buildSectionRows(expenseLines, expenseValues, totalExpensesByPeriod, "Expense") },
      { name: "Tax",     rows: buildSectionRows(taxLines,     taxValues,     totalTaxByPeriod,      "Tax") },
      { name: "Net",     rows: netRows },
    ]);
  };

  const [savingAll, setSavingAll] = useState(false);
  const isFilled = (v) => !(v === "" || v === null || v === undefined);

  const runInBatches = async (items, batchSize, fn) => {
    for (let i = 0; i < items.length; i += batchSize) {
      await Promise.all(items.slice(i, i + batchSize).map(fn));
    }
  };

  const persistCustomRows = async () => {
    const persistSection = async (category, lines, values) => {
      const nextLines = [...(lines || [])];
      for (let i = 0; i < nextLines.length; i++) {
        const line = nextLines[i];
        if (!line?.isCustom) continue;
        const name = String(line?.label || "").trim();
        if (!name) continue;
        const created = await createLineItem({ category, name });
        nextLines[i] = {
          ...line,
          id: created.line_item_id,
          line_item_id: created.line_item_id,
          category_id: created.category_id,
          label: created.name,
          name: created.name,
          isCustom: false,
        };
      }
      return { nextLines, nextValues: values };
    };
    const inc = await persistSection("income",  incomeLines,  incomeValues);
    const exp = await persistSection("expense", expenseLines, expenseValues);
    const tax = await persistSection("tax",     taxLines,     taxValues);
    setIncomeLines(inc.nextLines);
    setExpenseLines(exp.nextLines);
    setTaxLines(tax.nextLines);
    return {
      incomeLines:  inc.nextLines, incomeValues,
      expenseLines: exp.nextLines, expenseValues,
      taxLines:     tax.nextLines, taxValues,
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
        if (!isFilled(raw)) return;
        jobs.push({ lineItemId, timeframeId, amount: Number(raw) });
      });
    });
    return jobs;
  };

  const handleSave = async () => {
    if (!effectiveFundId) return;
    if (headerPeriods.length === 0) {
      setToast({ type: "error", title: "Selection Required", message: "Select at least one timeframe first." });
      return;
    }
    try {
      setSavingAll(true);
      setPnlError("");
      const updated = await persistCustomRows();
      const jobs = [
        ...buildJobs(updated.incomeLines,  updated.incomeValues),
        ...buildJobs(updated.expenseLines, updated.expenseValues),
        ...buildJobs(updated.taxLines,     updated.taxValues),
      ];
      if (jobs.length === 0) {
        setToast({ type: "info", title: "No Changes", message: "Nothing to save. Please fill some values first." });
        setSavingAll(false);
        return;
      }
      await runInBatches(jobs, 10, (payload) => upsertValue(payload));
      await loadPnL();
      setToast({ type: "success", title: "Financials Saved", message: "Income, Expenses, and Tax data updated successfully." });
    } catch (e) {
      console.error(e);
      setPnlError(e?.message || "Save failed");
      setToast({ type: "error", title: "Save Failed", message: e?.message || "An error occurred while saving financials." });
    } finally {
      setSavingAll(false);
    }
  };

  const HeaderRow = ({ leftSlot = null }) => (
    <div className="table-header-row">
      <div className="header-left-slot">{leftSlot}</div>
      {headerPeriods.map((p) => {
        const label = getPeriodLabel(p);
        return (
          <div key={p.id || label} className="col-period">
            <span className="period-label">{label} <span>(€)</span></span>
          </div>
        );
      })}
      <div />
    </div>
  );

  const scopeVars = useMemo(() => ({
    "--pnl-cols": String(headerPeriods.length),
    "--pnl-label-col": "260px",
    "--pnl-period-col": "160px",
    "--pnl-actions-col": "minmax(110px, 1fr)",
  }), [headerPeriods.length]);

  const hasNoData =
    !pnlLoading &&
    !pnlError &&
    incomeLines.length === 0 &&
    expenseLines.length === 0 &&
    taxLines.length === 0 &&
    headerPeriods.length > 0;

  return (
    <>
      <div className="toolbar-row">
        <div className="left-tools">
          <TimeframeSelector
            selected={selectedTimeframeIds}
            onChange={handleToggleTimeframe}
            isSingle={false}
          />
        </div>
        <div className="right-tools">
          <button className="ghost-btn" type="button" onClick={handleUploadClick} disabled={!effectiveFundId || uploading}>
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

      {pnlLoading ? (
        <PageSpinner label="Loading PnL..." />
      ) : pnlError ? (
        <PageError message={pnlError} />
      ) : hasNoData ? (
        <PageNoData message="No PnL data found for the selected timeframes." />
      ) : (
        <>
          <section className="financials-card">
            <div className="pnl-card-scroll" style={scopeVars}>
              <div className="pnl-grid-scope">
                <div className="financials-section-title">Income</div>
                <HeaderRow leftSlot={<button className="pill-btn" type="button" onClick={addIncomeRow}><PlusIcon /> Add income</button>} />
                <PnLIncome
                  fundId={effectiveFundId} headerPeriods={headerPeriods}
                  showIncome={showIncome} setShowIncome={setShowIncome}
                  incomeLines={incomeLines} setIncomeLines={setIncomeLines}
                  incomeValues={incomeValues} setIncomeValues={setIncomeValues}
                  totalIncomeByPeriod={totalIncomeByPeriod}
                  onAddRow={addIncomeRow} onRemoveRow={removeIncomeRow}
                  onUpdateLineItem={handleUpdateLineItem}
                  onDeleteLineItem={(args) => handleDeleteLineItem({ ...args, setLines: setIncomeLines, setValues: setIncomeValues })}
                />
              </div>
            </div>
          </section>

          <section className="financials-card">
            <div className="pnl-card-scroll" style={scopeVars}>
              <div className="pnl-grid-scope">
                <div className="financials-section-title">Expense</div>
                <HeaderRow leftSlot={<button className="pill-btn" type="button" onClick={addExpenseRow}><PlusIcon /> Add expense</button>} />
                <PnLExpenses
                  fundId={effectiveFundId} headerPeriods={headerPeriods}
                  showExpenses={showExpenses} setShowExpenses={setShowExpenses}
                  expenseLines={expenseLines} setExpenseLines={setExpenseLines}
                  expenseValues={expenseValues} setExpenseValues={setExpenseValues}
                  totalExpensesByPeriod={totalExpensesByPeriod}
                  onAddRow={addExpenseRow} onRemoveRow={removeExpenseRow}
                  onUpdateLineItem={handleUpdateLineItem}
                  onDeleteLineItem={(args) => handleDeleteLineItem({ ...args, setLines: setExpenseLines, setValues: setExpenseValues })}
                />
              </div>
            </div>
          </section>

          <section className="financials-card">
            <div className="pnl-card-scroll" style={scopeVars}>
              <div className="pnl-grid-scope">
                <div className="financials-section-title">Tax</div>
                <HeaderRow leftSlot={<button className="pill-btn" type="button" onClick={addTaxRow}><PlusIcon /> Add tax</button>} />
                <PnLTax
                  fundId={effectiveFundId} headerPeriods={headerPeriods}
                  showTax={showTax} setShowTax={setShowTax}
                  taxLines={taxLines} setTaxLines={setTaxLines}
                  taxValues={taxValues} setTaxValues={setTaxValues}
                  totalTaxByPeriod={totalTaxByPeriod}
                  onAddRow={addTaxRow} onRemoveRow={removeTaxRow}
                  onUpdateLineItem={handleUpdateLineItem}
                  onDeleteLineItem={(args) => handleDeleteLineItem({ ...args, setLines: setTaxLines, setValues: setTaxValues })}
                />
              </div>
            </div>
          </section>

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
        </>
      )}

      {toast && (
        <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
}

const PnLTab = () => {
  const { fundId } = useOutletContext();
  const params = useParams();
  const effectiveFundId = fundId || params?.fundId || params?.id || "";

  return (
    <TimeframeProvider fundId={effectiveFundId}>
      <PnLTabContent />
    </TimeframeProvider>
  );
};

export default PnLTab;