// src/pages/App/pages/Financials/components/PnLTab/PnLTab.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  useParams,
  useOutletContext,
  useNavigate,
  useLocation,
} from "react-router-dom";

import QuarterSelector from "/src/components/QuarterSelection/QuarterSelector.jsx";
import {
  RefreshUpIcon,
  DownloadIcon,
  EditLineIcon,
  AddFileIcon,
  PlusIcon,
} from "../../../../components/Icons.jsx";

import {
  incomeLines as BASE_INCOME,
  expenseLines as BASE_EXPENSES,
} from "../../data/mockData.js";

import { useTimeframes, saveNewTimeframe } from "../../../../hooks/Core/useTimeframes";

import PnLIncome from "../PnLTables/PnLIncome/PnLIncome.jsx";
import PnLExpenses from "../PnLTables/PnLExpenses/PnLExpenses.jsx";
import PnLTax from "../PnLTables/PnLTax/PnLTax.jsx";
import "./PnL.css";

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
  return rows.map((r) => {
    const byPeriod = { ...(r?.byPeriod || {}) };
    ids.forEach((id) => {
      if (byPeriod[id] === undefined) byPeriod[id] = "";
    });
    return { ...r, byPeriod };
  });
};

const sumForPeriod = (rows, periodId) => {
  const pid = String(periodId);
  return rows.reduce((acc, r) => acc + Number(r?.byPeriod?.[pid] || 0), 0);
};

const PnLTab = () => {
  const { fundId } = useOutletContext();
  const params = useParams();
  const effectiveFundId = fundId || params?.fundId || params?.id || "";

  const navigate = useNavigate();
  const location = useLocation();

  // periods source
  const { quarters, isLoading, setQuarters } = useTimeframes(effectiveFundId);

  // URL selection (NO DEFAULTS)
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

      // auto-select newly created timeframe
      setTimeframesInUrl([...selectedTimeframeIds, Number(formatted.id)]);
    } catch (error) {
      console.error("PnLTab: Persistence error:", error);
    }
  };

  // UI toggles
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax] = useState(true);

  // Lines
  const [incomeLines, setIncomeLines] = useState(() => BASE_INCOME);
  const [expenseLines, setExpenseLines] = useState(() => BASE_EXPENSES);
  const [taxLines, setTaxLines] = useState(() => [
    { id: "tax_1", label: "Tax", isCustom: false },
  ]);

  // Values per row per period
  const [incomeValues, setIncomeValues] = useState(() =>
    BASE_INCOME.map(() => ({ byPeriod: {} }))
  );
  const [expenseValues, setExpenseValues] = useState(() =>
    BASE_EXPENSES.map(() => ({ byPeriod: {} }))
  );
  const [taxValues, setTaxValues] = useState(() => [{ byPeriod: {} }]);

  // stable sorting
  const sortedQuarters = useMemo(() => {
    const list = Array.isArray(quarters) ? quarters : [];
    return list
      .slice()
      .sort(
        (a, b) =>
          new Date(b.full_date || b.date) - new Date(a.full_date || a.date)
      );
  }, [quarters]);

  // selected periods only
  const headerPeriods = useMemo(() => {
    if (!sortedQuarters?.length) return [];
    if (selectedTimeframeIds.length === 0) return [];
    const selectedSet = new Set(selectedTimeframeIds.map(Number));
    return sortedQuarters.filter((q) => selectedSet.has(Number(q.id)));
  }, [sortedQuarters, selectedTimeframeIds]);

  // keep values in sync
  useEffect(() => {
    setIncomeValues((prev) => ensureValueShape(prev, headerPeriods));
    setExpenseValues((prev) => ensureValueShape(prev, headerPeriods));
    setTaxValues((prev) => ensureValueShape(prev, headerPeriods));
  }, [headerPeriods]);

  // totals
  const totalIncomeByPeriod = useMemo(() => {
    const out = {};
    headerPeriods.forEach((p) => (out[p.id] = sumForPeriod(incomeValues, p.id)));
    return out;
  }, [incomeValues, headerPeriods]);

  const totalExpensesByPeriod = useMemo(() => {
    const out = {};
    headerPeriods.forEach(
      (p) => (out[p.id] = sumForPeriod(expenseValues, p.id))
    );
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

  // add/remove rows
  const addIncomeRow = () => {
    setIncomeLines((prev) => [
      ...prev,
      { id: makeId("inc"), label: "", isCustom: true },
    ]);
    setIncomeValues((prev) => [...prev, { byPeriod: {} }]);
  };
  const removeIncomeRow = (index) => {
    setIncomeLines((prev) => prev.filter((_, i) => i !== index));
    setIncomeValues((prev) => prev.filter((_, i) => i !== index));
  };

  const addExpenseRow = () => {
    setExpenseLines((prev) => [
      ...prev,
      { id: makeId("exp"), label: "", isCustom: true },
    ]);
    setExpenseValues((prev) => [...prev, { byPeriod: {} }]);
  };
  const removeExpenseRow = (index) => {
    setExpenseLines((prev) => prev.filter((_, i) => i !== index));
    setExpenseValues((prev) => prev.filter((_, i) => i !== index));
  };

  const addTaxRow = () => {
    setTaxLines((prev) => [
      ...prev,
      { id: makeId("tax"), label: "", isCustom: true },
    ]);
    setTaxValues((prev) => [...prev, { byPeriod: {} }]);
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
        `/api/funds/${encodeURIComponent(
          effectiveFundId
        )}/financials/pnl/upload`,
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

  const handleSave = () =>
    console.log("SAVE P&L", { fundId: effectiveFundId, selectedTimeframeIds });

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

      // label and period columns stretch, but never smaller than px
      "--pnl-label-col": "minmax(260px, 1fr)",
      "--pnl-period-col": "minmax(160px, 1fr)",

      // actions stays fixed
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

      {/* INCOME */}
      <section className="financials-card">
        <div className="pnl-card-scroll" style={scopeVars}>
          <div className="pnl-grid-scope">
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

      {/* ✅ NET PROFIT / NET LOSS (SEPARATE CARD) */}
      <section className="financials-card financials-card--net">
        <div className="pnl-card-scroll" style={scopeVars}>
          <div className="pnl-grid-scope">
            <div className="net-row net-row--standalone">
              <div>Net Profit / Net loss</div>

              {headerPeriods.map((p) => {
                const v = Number(netByPeriod[p.id] || 0);
                return (
                  <div
                    key={p.id}
                    className={`net-value ${v >= 0 ? "positive" : "negative"}`}
                  >
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
          <button 
          className="pnl-btn-save" 
          onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </>
  );
};

export default PnLTab;
