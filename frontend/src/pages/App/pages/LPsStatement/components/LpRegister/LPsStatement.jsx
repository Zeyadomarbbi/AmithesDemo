import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./lPsStatement.css";

/* Components & Icons */
import CapitalFlows from "../CapitalFlows/CapitalFlows.jsx";
import CapitalAccountStatement from "../CapitalAccount/CapitalAccountStatement.jsx";
import Limits from "../Limits/Limits.jsx";
import { PlusIcon, SortIcon } from "../Icons.jsx";
import SearchBox from "/src/components/SearchBox/SearchBox.jsx";
import AddPeriodModal from "./AddPeriodModal.jsx";

/* Hooks */
import { useFundClosings } from "../../../../hooks/LPsStatement/useClosingPeriods";
import { useShareClasses } from "../../../../hooks/useShareClass.js";

export const INITIAL_LPS = [];

const DEMO_LPS = [
  {
    id: 1,
    name: "Alice Right",
    initials: "AR",
    sharesRows: [{ type: "Class A1", commitment: "2 000 000", classColor: "tag-purple" }],
  },
  {
    id: 2,
    name: "AKA Partners",
    initials: "AA",
    sharesRows: [{ type: "Class A1", commitment: "25 000 000", classColor: "tag-purple" }],
  },
  {
    id: 3,
    name: "Vasco Durand",
    initials: "VD",
    sharesRows: [{ type: "Class B", commitment: "500 000", classColor: "tag-yellow" }],
  },
  {
    id: 4,
    name: "AST Feeder",
    initials: "AF",
    sharesRows: [{ type: "Class B", commitment: "500 000", classColor: "tag-yellow" }],
  },
  {
    id: 5,
    name: "CVC Capital",
    initials: "CV",
    sharesRows: [{ type: "Class A2", commitment: "3 000 000", classColor: "tag-green" }],
  },
  {
    id: 6,
    name: "Jean Dupont",
    initials: "JD",
    sharesRows: [{ type: "Class A2", commitment: "20 000 000", classColor: "tag-green" }],
  },
];

/* -------- Helpers -------- */
function formatAmount(num) {
  return (Number(num) || 0).toLocaleString("fr-FR");
}

function formatPercent(num) {
  return `${(Number(num) || 0).toFixed(2)}%`;
}

function sumNumbersFromString(str = "") {
  const matches = String(str).match(/-?\d+(\.\d+)?/g) || [];
  return matches.reduce((acc, n) => acc + (Number(n) || 0), 0);
}

function expandLpToRegisterRows(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
  if (rows.length === 0) {
    return [{ lp, displayClass: lp.class || "", displayClassColor: lp.classColor || "", commitmentCell: lp.commitment || "" }];
  }
  return rows.map((r) => ({
    lp,
    displayClass: r?.type || "-",
    displayClassColor: r?.classColor || "",
    commitmentCell: r?.commitment || "",
  }));
}

function getLpCommitmentNumber(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
  return rows.length > 0 
    ? rows.reduce((acc, r) => acc + sumNumbersFromString(r?.commitment || ""), 0) 
    : sumNumbersFromString(lp?.commitment || "");
}

export default function LPsStatement({ onOpenTransfer, onOpenNewLp, onSelectLP }) {
  const { fundId } = useParams();
  const [activeTab, setActiveTab] = useState("register");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeClass, setActiveClass] = useState(null);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);

  // ✅ HOOKS INTEGRATION
  const { fundClosings, fetchFundClosings, loading: closingsLoading, error: closingsError } = useFundClosings(fundId);
  const { data: shareClasses, isLoading: classesLoading } = useShareClasses(fundId);

  useEffect(() => {
    if (fundId) fetchFundClosings();
  }, [fundId, fetchFundClosings]);

  // ✅ Dynamic Table Columns from DB
  const tableColumns = useMemo(() => {
    return fundClosings.map((fc) => ({
      id: fc.lps_fund_closing_period_id,
      name: fc.closing_name || `Closing ${fc.date}`,
    }));
  }, [fundClosings]);

  const handleSavePeriod = () => {
    fetchFundClosings();
    setPeriodModalOpen(false);
  };

  const effectiveLps = DEMO_LPS;

  /* FILTERED LP LIST */
  const filteredLps = useMemo(() => {
    let list = [...effectiveLps];
    if (activeClass) {
      const token = activeClass.toLowerCase();
      list = list.filter((lp) => 
        lp.sharesRows?.some((r) => r.type.toLowerCase().includes(token))
      );
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter((lp) => lp.name.toLowerCase().includes(term));
    }
    return list;
  }, [effectiveLps, activeClass, searchTerm]);

  const displayRows = useMemo(() => filteredLps.flatMap(expandLpToRegisterRows), [filteredLps]);

  const totals = useMemo(() => {
    let commitment = displayRows.reduce((acc, row) => acc + sumNumbersFromString(row.commitmentCell), 0);
    return {
      commitment: formatAmount(commitment),
      commitmentNumber: commitment,
      ownership: formatPercent(commitment > 0 ? 100 : 0),
    };
  }, [displayRows]);

  const enrichedLpsForFlows = useMemo(() => {
    const totalAll = effectiveLps.reduce((acc, lp) => acc + getLpCommitmentNumber(lp), 0);
    return effectiveLps.map((lp) => {
      const pct = totalAll > 0 ? getLpCommitmentNumber(lp) / totalAll : 0;
      return { ...lp, ownershipPct: pct, ownershipPercent: formatPercent(pct * 100) };
    });
  }, [effectiveLps]);

  return (
    <section className="lp-page">
      <h1 className="lp-page-title">LPs Statement</h1>

      <div className="lp-tabs-wrapper">
        <div className="lp-tabs">
          {["register", "flows", "cas", "limits"].map((tab) => (
            <button
              key={tab}
              className={`lp-tab ${activeTab === tab ? "lp-tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "register" ? "LPs Register" : tab === "flows" ? "Capital flows" : tab === "cas" ? "Capital Account Statement" : "Limits"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "register" && (
        <>
          {(closingsError) && <div className="db-error-msg" style={{ color: "red", padding: "10px 0" }}>{closingsError}</div>}
          
          <div className="lp-toolbar">
            <div className="lp-toolbar-left">
              <SearchBox value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by LP..." />
              
              <div className="lp-class-filter">
                {shareClasses.map((sc) => (
                  <button
                    key={sc.share_class_id}
                    className={`lp-chip ${activeClass === sc.share_class_name ? "lp-chip-active" : ""}`}
                    onClick={() => setActiveClass(sc.share_class_name)}
                  >
                    {sc.share_class_name}
                    {activeClass === sc.share_class_name && (
                      <span className="lp-chip-clear" onClick={(e) => { e.stopPropagation(); setActiveClass(null); }}>✕</span>
                    )}
                  </button>
                ))}
                {classesLoading && <span style={{fontSize: "12px", color: "#666"}}>Loading...</span>}
              </div>
            </div>

            <div className="lp-toolbar-right">
              <button className="btn-add-transfer" onClick={onOpenTransfer}>Add transfer</button>
              <button className="btn-newlp" onClick={() => onOpenNewLp(true, tableColumns)}>
                <PlusIcon /> <span>New LP</span>
              </button>
            </div>
          </div>

          <div className="lp-table-row">
            <div className="lp-table-container">
              <table className="lp-table">
                <thead>
                  <tr>
                    <th className="th-left">LPs <SortIcon /></th>
                    <th className="th-left">Share class <SortIcon /></th>
                    <th className="th-right">Commitment (€) <SortIcon /></th>
                    <th className="th-right">% of Ownership <SortIcon /></th>
                    {tableColumns.map((p) => (
                      <th key={p.id} className="th-right">{p.name} <SortIcon /></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, idx) => (
                    <tr key={idx} className="lp-row-clickable" onClick={() => onSelectLP(row.lp)}>
                      <td className="td-left lp-cell">
                        <div className="lp-avatar">{row.lp.initials}</div>
                        <span className="lp-name">{row.lp.name}</span>
                      </td>
                      <td className="td-left">
                        <span className={`tag ${row.displayClassColor}`}>{row.displayClass}</span>
                      </td>
                      <td className="td-right">{row.commitmentCell}</td>
                      <td className="td-right">
                        {formatPercent(totals.commitmentNumber > 0 ? (sumNumbersFromString(row.commitmentCell) / totals.commitmentNumber) * 100 : 0)}
                      </td>
                      {tableColumns.map((p) => (
                        <td key={p.id} className="td-right">—</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="lp-total-row">
                    <td className="td-left">Total</td>
                    <td />
                    <td className="td-right">{totals.commitment}</td>
                    <td className="td-right">{totals.ownership}</td>
                    {tableColumns.map((p) => <td key={p.id} className="td-right">—</td>)}
                  </tr>
                </tfoot>
              </table>
            </div>
            <button className="side-plus-btn" onClick={() => setPeriodModalOpen(true)}>+</button>
          </div>

          <AddPeriodModal open={periodModalOpen} onClose={() => setPeriodModalOpen(false)} onSave={handleSavePeriod} />
        </>
      )}

      {activeTab === "flows" && <CapitalFlows lps={enrichedLpsForFlows} />}
      {activeTab === "cas" && <CapitalAccountStatement />}
      {activeTab === "limits" && <Limits />}
    </section>
  );
}