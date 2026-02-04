// frontend/src/pages/App/pages/LPsStatement/components/Limits.jsx
import React, { useMemo, useState } from "react";
import NewLimitDrawer from "./components/NewLimitDrawer.jsx";
import { SortIcon, PlusIcon } from "../../Icons.jsx";
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector.jsx";
import "./Limits.css";

const INITIAL_LIMITS = [
  {
    name: "Shares A",
    article: "Art 12.7",
    description: "Shares A shall represent 99.00% of the total commitment",
    limit: "99.00%",
    // ✅ add all quarters (put your real values here)
    q1: "13.15%",
    q2: "13.15%",
    q3: "13.15%",
    q4: "13.15%",
  },
  {
    name: "Shares B",
    article: "Art 12.8",
    description: "Shares B shall represent 1.00% of the total commitment",
    limit: "1.00%",
    // ✅ add all quarters (put your real values here)
    q1: "1.00%",
    q2: "1.00%",
    q3: "1.00%",
    q4: "1.00%",
  },
];

export default function Limits() {
  // QuarterSelector uses "Q2-2024" format
  const [selectedPeriod, setSelectedPeriod] = useState("Q2-2024");

  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);

  // limits state (table data)
  const [limits, setLimits] = useState(INITIAL_LIMITS);

  // sorting state
  const [sort, setSort] = useState({ key: null, dir: "asc" }); // key: name|description|limit|q1|q2|q3|q4

  // 🔹 called when drawer clicks "Save"
  const handleSaveNewLimit = (newLimit) => {
    if (!newLimit) return;
    setLimits((prev) => [...prev, newLimit]);
    setIsNewLimitOpen(false);
  };

  // ✅ Active quarter from QuarterSelector
  const { activeQuarterKey, activeQuarterLabel } = useMemo(() => {
    // selectedPeriod example: "Q2-2024"
    const [qRaw = "Q4", year = "2024"] = String(selectedPeriod || "Q4-2024").split("-");
    const qNum = qRaw.replace(/[^\d]/g, "") || "4"; // "2"
    return {
      activeQuarterKey: `q${qNum}`, // "q2"
      activeQuarterLabel: `${qRaw} ${year}`, // "Q2 2024"
    };
  }, [selectedPeriod]);

  // helpers
  const parsePct = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s === "-") return null;
    const n = Number(s.replace(/\s+/g, "").replace("%", "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const setSortKey = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: "asc" };
    });
  };

  // sorted rows (UI unchanged)
  const sortedLimits = useMemo(() => {
    if (!sort.key) return limits;

    const dir = sort.dir === "asc" ? 1 : -1;
    const rows = [...limits];

    rows.sort((a, b) => {
      let av;
      let bv;

      if (sort.key === "name") {
        av = (a.name || "").toLowerCase();
        bv = (b.name || "").toLowerCase();
        return av.localeCompare(bv) * dir;
      }

      if (sort.key === "description") {
        av = (a.description || "").toLowerCase();
        bv = (b.description || "").toLowerCase();
        return av.localeCompare(bv) * dir;
      }

      if (sort.key === "limit") {
        av = parsePct(a.limit);
        bv = parsePct(b.limit);
      } else if (sort.key === "q1" || sort.key === "q2" || sort.key === "q3" || sort.key === "q4") {
        av = parsePct(a[sort.key]);
        bv = parsePct(b[sort.key]);
      }

      // nulls last
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      return (av - bv) * dir;
    });

    return rows;
  }, [limits, sort]);

  return (
    <>
      <div className="limits-root">
        {/* Top controls: timeframe selector + New limit button */}
        <div className="limits-top-row">
          <div className="limits-period-wrapper">
            <QuarterSelector selected={selectedPeriod} onChange={setSelectedPeriod} isSingle={true} />
          </div>

          <button type="button" className="limits-new-btn" onClick={() => setIsNewLimitOpen(true)}>
            <span className="limits-new-plus" aria-hidden="true">
              <PlusIcon />
            </span>
            <span>New limit</span>
          </button>
        </div>

        {/* Table */}
        <div className="limits-table-wrapper">
          <table className="limits-table">
            <thead>
              <tr>
                <th className="limits-th limits-th-name limits-th--sortable" onClick={() => setSortKey("name")}>
                  <span className="limits-th-inner">
                    <span>Name</span>
                    <SortIcon />
                  </span>
                </th>

                <th
                  className="limits-th limits-th-description limits-th--sortable"
                  onClick={() => setSortKey("description")}
                >
                  <span className="limits-th-inner">
                    <span>Description</span>
                    <SortIcon />
                  </span>
                </th>

                <th className="limits-th limits-th-number limits-th--sortable" onClick={() => setSortKey("limit")}>
                  <span className="limits-th-inner">
                    <span>Limits</span>
                    <SortIcon />
                  </span>
                </th>

                {/* ✅ ONLY SHOW THE SELECTED QUARTER */}
                <th
                  className="limits-th limits-th-number limits-th--sortable"
                  onClick={() => setSortKey(activeQuarterKey)}
                >
                  <span className="limits-th-inner">
                    <span>{activeQuarterLabel}</span>
                    <SortIcon />
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedLimits.map((row, index) => (
                <tr key={`${row.article}-${index}`} className="limits-row">
                  <td className="limits-td limits-td-name">
                    <div className="limits-name-main">{row.name}</div>
                    <button type="button" className="limits-article-link">
                      {row.article}
                    </button>
                  </td>

                  <td className="limits-td limits-td-description">{row.description}</td>

                  <td className="limits-td limits-td-number">{row.limit}</td>

                  {/* ✅ value from the selected quarter key (q1/q2/q3/q4) */}
                  <td className="limits-td limits-td-number">{row[activeQuarterKey] ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <NewLimitDrawer
        open={isNewLimitOpen}
        onClose={() => setIsNewLimitOpen(false)}
        onSave={handleSaveNewLimit}
      />
    </>
  );
}
