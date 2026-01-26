import React from "react";
import { useParams } from "react-router-dom";
import "./lPsStatement.css";

import CapitalFlows from "../CapitalFlows/CapitalFlows.jsx";
import CapitalAccountStatement from "../CapitalAccount/CapitalAccountStatement.jsx";
import Limits from "../Limits/Limits.jsx";
import { PlusIcon, SortIcon } from "../Icons.jsx";
import SearchBox from "/src/components/SearchBox/SearchBox.jsx";

import AddPeriodModal from "./AddPeriodModal.jsx";

/* ✅ KEEP CONST BUT EMPTY */
export const INITIAL_LPS = [];

/* -------- helpers -------- */
function parseAmount(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/\s/g, "").replace(/[€$]/g, "");
  return Number(cleaned) || 0;
}

function formatAmount(num) {
  return (Number(num) || 0).toLocaleString("fr-FR");
}

function formatPercent(num) {
  return `${(Number(num) || 0).toFixed(2)}%`;
}

/* -------- sharesRows → main table rows helpers -------- */
function parseCommitmentValue(commitmentStr = "") {
  const numMatch = String(commitmentStr).match(/-?\d+(\.\d+)?/);
  const value = numMatch ? Number(numMatch[0]) : 0;

  let symbol = "";
  if (String(commitmentStr).includes("€")) symbol = "€";
  else if (String(commitmentStr).includes("$")) symbol = "$";

  return { value, symbol };
}

function formatCommitmentSums(sumsBySymbol) {
  const parts = Object.entries(sumsBySymbol)
    .filter(([_, v]) => Number(v) !== 0)
    .map(([sym, v]) => `${v} ${sym}`.trim());

  return parts.length ? parts.join(" / ") : "";
}

function sumNumbersFromString(str = "") {
  const matches = String(str).match(/-?\d+(\.\d+)?/g) || [];
  return matches.reduce((acc, n) => acc + (Number(n) || 0), 0);
}

function expandLpToRegisterRows(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];

  if (rows.length === 0) {
    return [
      {
        lp,
        displayClass: lp.class || "",
        displayClassColor: lp.classColor || "",
        commitmentCell: lp.commitment || "",
      },
    ];
  }

  const byType = new Map();
  for (const r of rows) {
    const type = r?.type || "-";
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push(r);
  }

  if (byType.size === 1) {
    const [onlyType, group] = [...byType.entries()][0];

    const sumsBySymbol = {};
    for (const g of group) {
      const { value, symbol } = parseCommitmentValue(g?.commitment);
      const key = symbol || "";
      sumsBySymbol[key] = (sumsBySymbol[key] || 0) + value;
    }

    return [
      {
        lp,
        displayClass: onlyType,
        displayClassColor: group?.[0]?.classColor || "",
        commitmentCell: formatCommitmentSums(sumsBySymbol),
      },
    ];
  }

  return rows.map((r) => ({
    lp,
    displayClass: r?.type || "-",
    displayClassColor: r?.classColor || "",
    commitmentCell: r?.commitment || "",
  }));
}

/* ✅ Used for OperationStep2 calc: commitment total per LP (across sharesRows if present) */
function getLpCommitmentNumber(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
  if (rows.length > 0) {
    return rows.reduce(
      (acc, r) => acc + sumNumbersFromString(r?.commitment || ""),
      0
    );
  }
  return sumNumbersFromString(lp?.commitment || "");
}

function initialsFromName(name = "") {
  const parts = String(name).trim().split(" ").filter(Boolean);
  return parts.slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "LP";
}

function normalizeShareClassName(scName) {
  const s = String(scName || "").trim();
  if (!s) return "-";
  // If DB stores "A1" -> show "Class A1"
  if (/^A\d+$/i.test(s) || /^B$/i.test(s) || /^C$/i.test(s)) return `Class ${s.toUpperCase()}`;
  // If DB stores already "Class A1" keep it
  if (s.toLowerCase().startsWith("class")) return s;
  return s;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
  }
  return res.json();
}

export default function LPsStatement({
  lps = INITIAL_LPS,
  onOpenTransfer,
  onOpenNewLp,
  onSelectLP,
}) {
  const { fundId } = useParams();

  const [activeTab, setActiveTab] = React.useState("register");

  /* FILTER STATES */
  const [activeClass, setActiveClass] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  /* ✅ existing UI-period columns (leave as-is for now) */
  const [periods, setPeriods] = React.useState([]); // [{ id, name }]
  const [periodModalOpen, setPeriodModalOpen] = React.useState(false);

  const openPeriodModal = () => setPeriodModalOpen(true);

  const handleSavePeriod = (p) => {
    const id = `period_${Date.now()}`;
    setPeriods((prev) => [...prev, { id, name: p.name }]);
    setPeriodModalOpen(false);
  };

  /* ✅ DB Period selector (real periods from Postgres) */
  const API_BASE = "https://dual-pam-bbi-59551b8d.koyeb.app/api";
  const [dbPeriods, setDbPeriods] = React.useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = React.useState(null);

  const [dbLps, setDbLps] = React.useState([]);
  const [dbLoading, setDbLoading] = React.useState(false);
  const [dbError, setDbError] = React.useState(null);

  // 1) Load closing periods for this fund
  React.useEffect(() => {
    let alive = true;
    if (!fundId) return;

    (async () => {
      try {
        setDbError(null);
        const data = await fetchJSON(`${API_BASE}/funds/${fundId}/closing-periods/`);
        if (!alive) return;

        setDbPeriods(Array.isArray(data) ? data : []);
        // Our API returns DESC by date_id => first is latest
        const first = Array.isArray(data) && data.length ? data[0] : null;
        setSelectedPeriodId(first?.period_id ?? null);
      } catch (e) {
        if (!alive) return;
        setDbPeriods([]);
        setSelectedPeriodId(null);
        setDbError(e?.message || "Failed to load closing periods");
      }
    })();

    return () => {
      alive = false;
    };
  }, [fundId]);

  // 2) Load LP Register for selected period
  React.useEffect(() => {
    let alive = true;
    if (!fundId || !selectedPeriodId) return;

    (async () => {
      try {
        setDbLoading(true);
        setDbError(null);

        const payload = await fetchJSON(
          `${API_BASE}/funds/${fundId}/lp-register/?period_id=${selectedPeriodId}`
        );

        const rows = Array.isArray(payload?.rows) ? payload.rows : [];

        // group into your existing LP shape: { id, name, initials, sharesRows: [{type, commitment}] }
        const byLp = new Map();

        for (const r of rows) {
          const lpId = r.lp_id;
          const lpName = r.lp_name || "—";

          if (!byLp.has(lpId)) {
            byLp.set(lpId, {
              id: lpId,
              name: lpName,
              initials: initialsFromName(lpName),
              sharesRows: [],
              _commitmentNumber: 0,
            });
          }

          const lp = byLp.get(lpId);
          const amount = Number(r.commitment_amount) || 0;
          const sym = (r.currency_symbol || "").trim();

          lp._commitmentNumber += amount;

          lp.sharesRows.push({
            type: normalizeShareClassName(r.share_class_name),
            commitment: `${formatAmount(amount)}${sym ? ` ${sym}` : ""}`,
            classColor: "", // keep empty for now (you can map A1/A2/B to your CSS class later)
          });
        }

        // compute ownership for OperationStep2 (0..1) per LP
        const lpsArr = Array.from(byLp.values());
        const totalAll = lpsArr.reduce((acc, lp) => acc + (lp._commitmentNumber || 0), 0);

        const finalLps = lpsArr.map((lp) => {
          const pct = totalAll > 0 ? (lp._commitmentNumber || 0) / totalAll : 0;
          const clean = { ...lp };
          delete clean._commitmentNumber;

          return {
            ...clean,
            ownershipPct: pct,
            ownershipPercent: formatPercent(pct * 100),
          };
        });

        if (!alive) return;
        setDbLps(finalLps);
      } catch (e) {
        if (!alive) return;
        setDbLps([]);
        setDbError(e?.message || "Failed to load LP register");
      } finally {
        if (alive) setDbLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fundId, selectedPeriodId]);

  // ✅ Use DB LPs when fundId exists; otherwise fallback to props
  const effectiveLps = fundId ? dbLps : lps;

  /* FILTERED LP LIST */
  const filteredLps = React.useMemo(() => {
    let list = [...effectiveLps];

    if (activeClass) {
      const token = activeClass.toLowerCase();
      list = list.filter((lp) => {
        const shareTypes = Array.isArray(lp?.sharesRows)
          ? lp.sharesRows.map((r) => (r?.type || "").toLowerCase())
          : [];
        if (shareTypes.length) return shareTypes.some((t) => t.includes(token));
        return (lp.class || "").toLowerCase().includes(token);
      });
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter((lp) => (lp.name || "").toLowerCase().includes(term));
    }

    return list;
  }, [effectiveLps, activeClass, searchTerm]);

  const displayRows = React.useMemo(() => {
    return filteredLps.flatMap(expandLpToRegisterRows);
  }, [filteredLps]);

  /* TOTALS (for the visible Register table) */
  const totals = React.useMemo(() => {
    let commitment = 0;

    const periodTotals = {};
    periods.forEach((p) => (periodTotals[p.id] = 0));

    displayRows.forEach((row) => {
      commitment += sumNumbersFromString(row.commitmentCell);
    });

    filteredLps.forEach((lp) => {
      periods.forEach((p) => {
        const v = lp.periodValues?.[p.id] ?? lp.periodValues?.[p.name] ?? "";
        periodTotals[p.id] += parseAmount(v);
      });
    });

    return {
      commitment: formatAmount(commitment),
      commitmentNumber: commitment,
      ownership: formatPercent(commitment > 0 ? 100 : 0),
      periodTotals,
    };
  }, [filteredLps, periods, displayRows]);

  /* ✅ Ownership for OperationStep2: computed from ALL LPs (fund-based now) */
  const enrichedLpsForFlows = React.useMemo(() => {
    const totalAll = (effectiveLps || []).reduce(
      (acc, lp) => acc + getLpCommitmentNumber(lp),
      0
    );

    return (effectiveLps || []).map((lp) => {
      const lpCommit = getLpCommitmentNumber(lp);
      const pct = totalAll > 0 ? lpCommit / totalAll : 0;
      return {
        ...lp,
        ownershipPct: pct,
        ownershipPercent: formatPercent(pct * 100),
      };
    });
  }, [effectiveLps]);

  const clearClassFilter = (e) => {
    e.stopPropagation();
    setActiveClass(null);
  };

  return (
    <section className="lp-page">
      <h1 className="lp-page-title">LPs Statement</h1>

      <div className="lp-tabs-wrapper">
        <div className="lp-tabs">
          <button
            className={`lp-tab ${activeTab === "register" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            LPs Register
          </button>

          <button
            className={`lp-tab ${activeTab === "flows" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("flows")}
          >
            Capital flows
          </button>

          <button
            className={`lp-tab ${activeTab === "cas" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("cas")}
          >
            Capital Account Statement
          </button>

          <button
            className={`lp-tab ${activeTab === "limits" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("limits")}
          >
            Limits
          </button>
        </div>
      </div>

      {activeTab === "register" && (
        <>
          {/* ✅ DB period selector (real from Postgres) */}
          {fundId && (
            <div style={{ display: "flex", justifyContent: "flex-end", margin: "6px 0 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Closing period:</span>
                <select
                  value={selectedPeriodId ?? ""}
                  onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
                  style={{
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid #e6e9f1",
                    padding: "0 10px",
                    fontSize: 13,
                    background: "#fff",
                  }}
                >
                  {dbPeriods.map((p) => (
                    <option key={p.period_id} value={p.period_id}>
                      {p.period_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {dbError && (
            <div style={{ padding: "8px 0", color: "#b42318", fontSize: 13 }}>
              {dbError}
            </div>
          )}

          {dbLoading && (
            <div style={{ padding: "8px 0", color: "#6b7280", fontSize: 13 }}>
              Loading LP register...
            </div>
          )}

          <div className="lp-toolbar">
            <div className="lp-toolbar-left">
              <SearchBox
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by LP..."
              />

              <div className="lp-class-filter">
                <button
                  className={`lp-chip ${activeClass === "A1" ? "lp-chip-active" : ""}`}
                  onClick={() => setActiveClass("A1")}
                  type="button"
                >
                  <span className="lp-chip-label">Class A1</span>
                  {activeClass === "A1" && (
                    <span className="lp-chip-clear" onClick={clearClassFilter}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M8.79981 0.800781L0.799805 8.80078M0.799805 0.800781L8.79981 8.80078"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>

                <button
                  className={`lp-chip ${activeClass === "B" ? "lp-chip-active" : ""}`}
                  onClick={() => setActiveClass("B")}
                  type="button"
                >
                  <span className="lp-chip-label">Class B</span>
                  {activeClass === "B" && (
                    <span className="lp-chip-clear" onClick={clearClassFilter}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M8.79981 0.800781L0.799805 8.80078M0.799805 0.800781L8.79981 8.80078"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>

                <button
                  className={`lp-chip ${activeClass === "A2" ? "lp-chip-active" : ""}`}
                  onClick={() => setActiveClass("A2")}
                  type="button"
                >
                  <span className="lp-chip-label">Class A2</span>
                  {activeClass === "A2" && (
                    <span className="lp-chip-clear" onClick={clearClassFilter}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M8.79981 0.800781L0.799805 8.80078M0.799805 0.800781L8.79981 8.80078"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="lp-toolbar-right">
              <button className="btn-add-transfer" type="button" onClick={onOpenTransfer}>
                <span className="icon-transfer">
                  <svg width="14" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.19526 0.195262C8.45561 -0.0650874 8.87772 -0.0650874 9.13807 0.195262L11.8047 2.86193C12.0651 3.12228 12.0651 3.54439 11.8047 3.80474L9.13807 6.4714C8.87772 6.73175 8.45561 6.73175 8.19526 6.4714C7.93491 6.21105 7.93491 5.78894 8.19526 5.5286L9.72386 4H0.666667C0.298477 4 0 3.70152 0 3.33333C0 2.96514 0.298477 2.66667 0.666667 2.66667H9.72386L8.19526 1.13807C7.93491 0.877722 7.93491 0.455612 8.19526 0.195262ZM3.80474 6.86193C4.06509 7.12228 4.06509 7.54439 3.80474 7.80474L2.27614 9.33333H11.3333C11.7015 9.33333 12 9.63181 12 10C12 10.3682 11.7015 10.6667 11.3333 10.6667H2.27614L3.80474 12.1953C4.06509 12.4556 4.06509 12.8777 3.80474 13.1381C3.54439 13.3984 3.12228 13.3984 2.86193 13.1381L0.195262 10.4714C-0.0650874 10.2111 -0.0650874 9.78894 0.195262 9.5286L2.86193 6.86193C3.12228 6.60158 3.54439 6.60158 3.80474 6.86193Z"
                      fill="#7B7D7E"
                    />
                  </svg>
                </span>
                Add transfer
              </button>

              <button className="btn-newlp" onClick={() => onOpenNewLp(true, periods)}>
                <PlusIcon />
                <span>New LP</span>
              </button>
            </div>
          </div>

          <div className="lp-table-row">
            <div className="lp-table-container">
              <table className="lp-table">
                <thead>
                  <tr>
                    <th className="th-left">
                      LPs <SortIcon />
                    </th>
                    <th className="th-left">
                      Share class <SortIcon />
                    </th>
                    <th className="th-right">
                      Commitment (€) <SortIcon />
                    </th>
                    <th className="th-right">
                      % of Ownership <SortIcon />
                    </th>

                    {periods.map((p) => (
                      <th key={p.id} className="th-right">
                        {p.name} <SortIcon />
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {displayRows.map((row, idx) => {
                    const lp = row.lp;

                    return (
                      <tr
                        key={`${lp.name}-${row.displayClass}-${idx}`}
                        className="lp-row-clickable"
                        onClick={() => onSelectLP(lp)}
                      >
                        <td className="td-left lp-cell">
                          <div className="lp-avatar">{lp.initials}</div>
                          <span className="lp-name">{lp.name}</span>
                        </td>

                        <td className="td-left">
                          <span className={`tag ${row.displayClassColor}`}>
                            {row.displayClass}
                          </span>
                        </td>

                        <td className="td-right">{row.commitmentCell}</td>

                        <td className="td-right">
                          {formatPercent(
                            totals.commitmentNumber > 0
                              ? (sumNumbersFromString(row.commitmentCell) /
                                  totals.commitmentNumber) *
                                  100
                              : 0
                          )}
                        </td>

                        {periods.map((p) => (
                          <td key={p.id} className="td-right">
                            {lp.periodValues?.[p.id] ?? lp.periodValues?.[p.name] ?? ""}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="lp-total-row">
                    <td className="td-left">Total</td>
                    <td />
                    <td className="td-right">{totals.commitment}</td>
                    <td className="td-right">{totals.ownership}</td>

                    {periods.map((p) => (
                      <td key={p.id} className="td-right">
                        {formatAmount(totals.periodTotals[p.id] || 0)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            <button className="side-plus-btn" type="button" onClick={openPeriodModal}>
              +
            </button>
          </div>

          <AddPeriodModal
            open={periodModalOpen}
            onClose={() => setPeriodModalOpen(false)}
            onSave={handleSavePeriod}
          />
        </>
      )}

      {/* ✅ fund-based now */}
      {activeTab === "flows" && <CapitalFlows lps={enrichedLpsForFlows} />}

      {activeTab === "cas" && <CapitalAccountStatement />}
      {activeTab === "limits" && <Limits />}
    </section>
  );
}
