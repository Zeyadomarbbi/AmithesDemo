import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import "./Limits.css";

import NewLimitDrawer from "./LimitsDrawer/NewLimitDrawer.jsx";
import { SortIcon, PlusIcon } from '/src/components/Icons/InteractiveIcons';
import QuarterSelector from "/src/components/QuarterSelection/QuarterSelector.jsx";
import { useTimeframes, apiRowToQuarter } from "../../../../hooks/Core/useTimeframes.jsx"
const INITIAL_LIMITS = {
  "1": [
    {
      id: "init_1",
      name: "Shares A",
      article: "Art 12.7",
      description: "Shares A shall represent 99.00% of the total commitment",
      limit: "99.00%",
      values: { 18: "13.15%", 19: "13.15%" } 
    },
    {
      id: "init_2",
      name: "Shares B",
      article: "Art 12.8",
      description: "Shares B shall represent 1.00% of the total commitment",
      limit: "1.00%",
      values: { 18: "1.00%", 19: "1.00%" }
    },
  ]
};

export default function LimitsTab() {
  const { fundId } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { quarters, isLoading, setQuarters } = useTimeframes(fundId);

  // 1. Initialize state from URL Search Params
  const [selectedTimeframeIds, setSelectedTimeframeIds] = useState(() => {
    const ids = searchParams.get("timeframes");
    return ids ? ids.split(",").map(Number).filter(id => !isNaN(id)) : [];
  });

  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);
  const [limits, setLimits] = useState(() => INITIAL_LIMITS[fundId] || []);

  // 2. Sync State back to URL Address Bar (encoded with %2C automatically)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedTimeframeIds.length > 0) {
      params.set("timeframes", selectedTimeframeIds.join(","));
    } else {
      params.delete("timeframes");
    }
    setSearchParams(params, { replace: true });
  }, [selectedTimeframeIds, setSearchParams]);

  useEffect(() => {
    setLimits(INITIAL_LIMITS[fundId] || []);
  }, [fundId]);

  const [sort, setSort] = useState({ key: null, dir: "asc" });

  // 3. Resolve Header periods
  const headerPeriods = useMemo(() => {
    const list = Array.isArray(quarters) ? quarters : [];
    const sorted = list.slice().sort(
      (a, b) => new Date(b.full_date || b.date) - new Date(a.full_date || a.date)
    );

    // Default: Show latest 2 if no selection in URL
    if (selectedTimeframeIds.length === 0) return sorted.slice(0, 2);
    
    const selectedSet = new Set(selectedTimeframeIds.map(Number));
    return sorted.filter((q) => selectedSet.has(Number(q.id)));
  }, [quarters, selectedTimeframeIds]);

  const handleToggleTimeframe = (id) => {
    const numId = Number(id);
    setSelectedTimeframeIds((prev) => {
      if (prev.includes(numId)) return prev.filter((x) => x !== numId);
      return [...prev, numId];
    });
  };

  const handleSaveNewTimeframe = async (newTimeframe) => {
    const payload = {
      fund: fundId,
      display_label: newTimeframe.name,
      full_date: newTimeframe.endDate.toISOString().split("T")[0],
    };

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/timeframes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Persistence failed");

      const savedRow = await response.json();
      const formatted = apiRowToQuarter(savedRow);
      setQuarters((prev) => [...prev, formatted]);
      handleToggleTimeframe(formatted.id);
    } catch (error) {
      console.error("LimitsTab: Persistence error:", error);
    }
  };

  const handleSaveNewLimit = (newLimit) => {
    if (!newLimit) return;
    setLimits((prev) => [...prev, newLimit]);
    setIsNewLimitOpen(false);
  };

  const setSortKey = (key) => {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  };

  const parsePct = (v) => {
    if (v == null) return null;
    const n = parseFloat(String(v).replace("%", "").replace(",", "."));
    return isFinite(n) ? n : null;
  };

  const sortedLimits = useMemo(() => {
    if (!sort.key) return limits;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...limits].sort((a, b) => {
      let av, bv;
      if (sort.key === "name") {
        av = (a.name || "").toLowerCase();
        bv = (b.name || "").toLowerCase();
        return av.localeCompare(bv) * dir;
      }
      av = parsePct(a[sort.key]);
      bv = parsePct(b[sort.key]);
      if (av === bv) return 0;
      return (av === null ? 1 : bv === null ? -1 : av - bv) * dir;
    });
  }, [limits, sort]);

  return (
    <>
      <div className="limits-root">
        <div className="limits-top-row">
          <div className="limits-period-wrapper">
            <QuarterSelector
              options={quarters}
              selected={selectedTimeframeIds}
              onChange={handleToggleTimeframe}
              onSaveNew={handleSaveNewTimeframe}
              isLoading={isLoading}
              isSingle={false}
            />
          </div>

          <button
            type="button"
            className="limits-new-btn"
            onClick={() => setIsNewLimitOpen(true)}
          >
            <span className="limits-new-plus" aria-hidden="true">
              <PlusIcon />
            </span>
            <span>New limit</span>
          </button>
        </div>

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
                <th className="limits-th limits-th-description">
                  <span className="limits-th-inner">
                    <span>Description</span>
                  </span>
                </th>
                <th className="limits-th limits-th-number limits-th--sortable" onClick={() => setSortKey("limit")}>
                  <span className="limits-th-inner">
                    <span>Limits</span>
                    <SortIcon />
                  </span>
                </th>
                {headerPeriods.map((p) => (
                  <th key={p.id} className="limits-th limits-th-number">
                    <span className="limits-th-inner">
                      <span>{p.label || p.display_label}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedLimits.map((row) => (
                <tr key={row.id || row.name} className="limits-row">
                  <td className="limits-td limits-td-name">
                    <div className="limits-name-main">{row.name}</div>
                    <button type="button" className="limits-article-link">
                      {row.article}
                    </button>
                  </td>
                  <td className="limits-td limits-td-description">{row.description}</td>
                  <td className="limits-td limits-td-number">{row.limit}</td>
                  {headerPeriods.map((p) => (
                    <td key={p.id} className="limits-td limits-td-number">
                      {row.values?.[p.id] || row[`q${p.quarter}`] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewLimitDrawer
        open={isNewLimitOpen}
        onClose={() => setIsNewLimitOpen(false)}
        onSave={handleSaveNewLimit}
      />
    </>
  );
}