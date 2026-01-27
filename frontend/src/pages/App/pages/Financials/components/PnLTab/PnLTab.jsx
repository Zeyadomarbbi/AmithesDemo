import React, { useMemo, useRef, useState, useEffect } from "react";
import { useParams, useOutletContext, useSearchParams } from "react-router-dom";

import QuarterSelector from "/src/components/QuarterSelection/QuarterSelector.jsx";
import {
  RefreshUpIcon,
  DownloadIcon,
  EditLineIcon,
  AddFileIcon,
} from "../../../../components/Icons.jsx";

import {
  pnlPeriods,
  incomeLines as BASE_INCOME,
  expenseLines as BASE_EXPENSES,
} from "../../data/mockData.js";

import {
  useTimeframes,
  apiRowToQuarter,
} from "/src/components/QuarterSelection/useTimeframes";

import PnLIncome from "../PnLTables/PnLIncome/PnLIncome.jsx";
import PnLExpenses from "../PnLTables/PnLExpenses/PnLExpenses.jsx";
import PnLTax from "../PnLTables/PnLTax/PnLTax.jsx";
import "./PnL.css";

const makeId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

/* =========================
   DEMO / STATIC DATA
   ========================= */
const DEMO_MODE = true;

// IMPORTANT:
const DEMO_BY_PERIOD_LABEL = {
  "Q1 2027": { col1: null, col2: null },
  "Q1 2025": { col1: null, col2: null },
  "Q1 2024": { col1: null, col2: null },
};

/* ✅ robust label getter  */
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

const PnLTab = () => {
  const { fundId } = useOutletContext();
  const params = useParams();
  const effectiveFundId = fundId || params?.fundId || params?.id || "";

  const [searchParams, setSearchParams] = useSearchParams();
  const { quarters, isLoading, setQuarters } = useTimeframes(effectiveFundId);

  const [selectedTimeframeIds, setSelectedTimeframeIds] = useState(() => {
    const ids = searchParams.get("timeframes");
    return ids ? ids.split(",").map(Number).filter((id) => !isNaN(id)) : [];
  });

  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax] = useState(true);

  const [incomeLines, setIncomeLines] = useState(() => BASE_INCOME);
  const [expenseLines, setExpenseLines] = useState(() => BASE_EXPENSES);
  const [taxLines, setTaxLines] = useState(() => [
    { id: "tax_1", label: "Tax", isCustom: false },
  ]);

  const [incomeValues, setIncomeValues] = useState(() =>
    BASE_INCOME.map(() => ({ col1: "", col2: "" }))
  );
  const [expenseValues, setExpenseValues] = useState(() =>
    BASE_EXPENSES.map(() => ({ col1: "", col2: "" }))
  );
  const [taxValues, setTaxValues] = useState(() => [{ col1: "", col2: "" }]);

  // Sync selection to URL
  useEffect(() => {
    const params2 = new URLSearchParams(searchParams);
    if (selectedTimeframeIds.length > 0) {
      params2.set("timeframes", selectedTimeframeIds.join(","));
    } else {
      params2.delete("timeframes");
    }
    setSearchParams(params2, { replace: true });
  }, [selectedTimeframeIds, setSearchParams, searchParams]);

  /* ✅ always get a sorted list */
  const sortedQuarters = useMemo(() => {
    const list = Array.isArray(quarters) ? quarters : [];
    if (list.length === 0) return pnlPeriods;

    return list
      .slice()
      .sort(
        (a, b) =>
          new Date(b.full_date || b.date) - new Date(a.full_date || a.date)
      );
  }, [quarters]);

  /* ✅ headerPeriods ALWAYS returns 2 columns */
  const headerPeriods = useMemo(() => {
    if (!sortedQuarters?.length) return pnlPeriods;

    // no selection → latest 2
    if (selectedTimeframeIds.length === 0) return sortedQuarters.slice(0, 2);

    const selectedSet = new Set(selectedTimeframeIds);
    const selectedList = sortedQuarters.filter((q) =>
      selectedSet.has(Number(q.id))
    );

    // if user selected 2+ → show exactly those (in sorted order)
    if (selectedList.length >= 2) return selectedList;

    // if user selected 1 → show that + next latest not selected
    if (selectedList.length === 1) {
      const other = sortedQuarters.find(
        (q) => !selectedSet.has(Number(q.id))
      );
      return other ? [selectedList[0], other] : [selectedList[0]];
    }

    // fallback
    return sortedQuarters.slice(0, 2);
  }, [sortedQuarters, selectedTimeframeIds]);

  /* ✅ DEMO APPLY: fill values when headerPeriods changes */
  useEffect(() => {
    if (!DEMO_MODE) return;

    const hp = Array.isArray(headerPeriods) ? headerPeriods : [];
    if (hp.length === 0) return;

    const k1 = getPeriodLabel(hp[0]);
    const k2 = getPeriodLabel(hp[1]);

    const col1 = DEMO_BY_PERIOD_LABEL[k1]?.col1 ?? "";
    const col2 = DEMO_BY_PERIOD_LABEL[k2]?.col2 ?? "";

    const hasDemo = DEMO_BY_PERIOD_LABEL[k1] || DEMO_BY_PERIOD_LABEL[k2];
    if (!hasDemo) return;

    setIncomeValues(incomeLines.map(() => ({ col1, col2 })));
    setExpenseValues(expenseLines.map(() => ({ col1, col2 })));
    setTaxValues(taxLines.map(() => ({ col1, col2 })));
  }, [headerPeriods, incomeLines, expenseLines, taxLines]);

  // add/remove
  const addIncomeRow = () => {
    setIncomeLines((prev) => [...prev, { id: makeId("inc"), label: "", isCustom: true }]);
    setIncomeValues((prev) => [...prev, { col1: "", col2: "" }]);
  };
  const removeIncomeRow = (index) => {
    setIncomeLines((prev) => prev.filter((_, i) => i !== index));
    setIncomeValues((prev) => prev.filter((_, i) => i !== index));
  };

  const addExpenseRow = () => {
    setExpenseLines((prev) => [...prev, { id: makeId("exp"), label: "", isCustom: true }]);
    setExpenseValues((prev) => [...prev, { col1: "", col2: "" }]);
  };
  const removeExpenseRow = (index) => {
    setExpenseLines((prev) => prev.filter((_, i) => i !== index));
    setExpenseValues((prev) => prev.filter((_, i) => i !== index));
  };

  const addTaxRow = () => {
    setTaxLines((prev) => [...prev, { id: makeId("tax"), label: "", isCustom: true }]);
    setTaxValues((prev) => [...prev, { col1: "", col2: "" }]);
  };
  const removeTaxRow = (index) => {
    setTaxLines((prev) => prev.filter((_, i) => i !== index));
    setTaxValues((prev) => prev.filter((_, i) => i !== index));
  };

  // totals
  const sumColumn = (arr, col) => arr.reduce((acc, v) => acc + Number(v?.[col] || 0), 0);

  const totalIncomeCol1 = useMemo(() => sumColumn(incomeValues, "col1"), [incomeValues]);
  const totalIncomeCol2 = useMemo(() => sumColumn(incomeValues, "col2"), [incomeValues]);
  const totalExpensesCol1 = useMemo(() => sumColumn(expenseValues, "col1"), [expenseValues]);
  const totalExpensesCol2 = useMemo(() => sumColumn(expenseValues, "col2"), [expenseValues]);
  const totalTaxCol1 = useMemo(() => sumColumn(taxValues, "col1"), [taxValues]);
  const totalTaxCol2 = useMemo(() => sumColumn(taxValues, "col2"), [taxValues]);

  const netCol1 = totalIncomeCol1 - totalExpensesCol1 - totalTaxCol1;
  const netCol2 = totalIncomeCol2 - totalExpensesCol2 - totalTaxCol2;

  // upload / download
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
        `/api/funds/${encodeURIComponent(effectiveFundId)}/financials/pnl/upload`,
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
    console.log("SAVE P&L", { fundId: effectiveFundId, selectedTimeframes: selectedTimeframeIds });

  const handleToggleTimeframe = (id) => {
    const numId = Number(id);
    setSelectedTimeframeIds((prev) => {
      if (prev.includes(numId)) return prev.filter((x) => x !== numId);
      return [...prev, numId];
    });
  };

  const handleSaveNew = async (newTimeframe) => {
    const payload = {
      fund: effectiveFundId,
      display_label: newTimeframe.name,
      full_date: newTimeframe.endDate.toISOString().split("T")[0],
    };

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/funds/${effectiveFundId}/timeframes/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Persistence failed");

      const savedRow = await response.json();
      const formatted = apiRowToQuarter(savedRow);
      setQuarters((prev) => [...prev, formatted]);
      handleToggleTimeframe(formatted.id);
    } catch (error) {
      console.error("PnLTab: Persistence error:", error);
    }
  };

  return (
    <>
      <div className="toolbar-row">
        <div className="left-tools" style={{ gap: "12px", alignItems: "center" }}>
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

      <section className="financials-card">
        <div className="table-header-row">
          <div />
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

        <PnLIncome
          fundId={effectiveFundId}
          showIncome={showIncome}
          setShowIncome={setShowIncome}
          incomeLines={incomeLines}
          setIncomeLines={setIncomeLines}
          incomeValues={incomeValues}
          setIncomeValues={setIncomeValues}
          totalIncomeCol1={totalIncomeCol1}
          totalIncomeCol2={totalIncomeCol2}
          onAddRow={addIncomeRow}
          onRemoveRow={removeIncomeRow}
        />

        <PnLExpenses
          fundId={effectiveFundId}
          showExpenses={showExpenses}
          setShowExpenses={setShowExpenses}
          expenseLines={expenseLines}
          setExpenseLines={setExpenseLines}
          expenseValues={expenseValues}
          setExpenseValues={setExpenseValues}
          totalExpensesCol1={totalExpensesCol1}
          totalExpensesCol2={totalExpensesCol2}
          onAddRow={addExpenseRow}
          onRemoveRow={removeExpenseRow}
        />

        <PnLTax
          fundId={effectiveFundId}
          showTax={showTax}
          setShowTax={setShowTax}
          taxLines={taxLines}
          setTaxLines={setTaxLines}
          taxValues={taxValues}
          setTaxValues={setTaxValues}
          totalTaxCol1={totalTaxCol1}
          totalTaxCol2={totalTaxCol2}
          onAddRow={addTaxRow}
          onRemoveRow={removeTaxRow}
        />

        <div className="net-row">
          <div>Net Profit / Net loss</div>
          <div className={`net-value ${netCol1 >= 0 ? "positive" : "negative"}`}>
            {netCol1.toLocaleString()}
          </div>
          <div className={`net-value ${netCol2 >= 0 ? "positive" : "negative"}`}>
            {netCol2.toLocaleString()}
          </div>
          <div />
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}>
        <button className="btn-primary-wide" type="button" onClick={handleSave}>
          Save
        </button>
      </div>
    </>
  );
};

export default PnLTab;
