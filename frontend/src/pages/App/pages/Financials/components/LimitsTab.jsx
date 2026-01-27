import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import "./limitstab/Limits.css";

import NewLimitDrawer from "./limitstab/NewLimitDrawer.jsx";
import { SortIcon, PlusIcon } from "../../../../../components/Icons.jsx";

// Import Hooks and Utils for QuarterSelector
import QuarterSelector from "../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, apiRowToQuarter } from '../../../../../components/QuarterSelection/useTimeframes';

const INITIAL_LIMITS = [
  {
    name: "Shares A",
    article: "Art 12.7",
    description: "Shares A shall represent 99.00% of the total commitment",
    limit: "99.00%",
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
    q1: "1.00%",
    q2: "1.00%",
    q3: "1.00%",
    q4: "1.00%",
  },
];

export default function LimitsTab() {
  const { fundId } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Fetch Timeframes
  const { quarters, isLoading, setQuarters } = useTimeframes(fundId);
  
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);
  const [limits, setLimits] = useState(INITIAL_LIMITS);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  // 2. Resolve Active Timeframe from URL (Same logic as PortfolioCompareTab)
  const queryParams = new URLSearchParams(location.search);
  const selectedIdParam = queryParams.get("timeframe");
  
  // Use parseInt to sanitize and filter out '0' or invalid IDs
  const selectedTimeframeId = useMemo(() => {
    const id = parseInt(selectedIdParam, 10);
    return !isNaN(id) && id > 0 ? id : null;
  }, [selectedIdParam]);

  // 3. Synchronize: Auto-select most recent timeframe if none in URL and data is ready
  useEffect(() => {
    if (!isLoading && quarters.length > 0 && !selectedTimeframeId) {
      handleTimeframeChange(quarters[0].id);
    }
  }, [quarters, isLoading, selectedTimeframeId]);

  const activeQuarter = useMemo(() => {
    return quarters.find(q => q.id === selectedTimeframeId) || quarters[0];
  }, [quarters, selectedTimeframeId]);

  // 4. Handle Selection Change (Updates URL)
  const handleTimeframeChange = (id) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("timeframe", id);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const handleSaveNewTimeframe = async (newTimeframe) => {
    const payload = {
      fund: fundId,
      display_label: newTimeframe.name,
      full_date: newTimeframe.endDate.toISOString().split('T')[0] 
    };

    try {
      const response = await fetch(`https://dual-pam-bbi-59551b8d.koyeb.app/api/funds/${fundId}/timeframes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Persistence failed");

      const savedRow = await response.json();
      const formatted = apiRowToQuarter(savedRow);

      setQuarters(prev => [...prev, formatted]);
      handleTimeframeChange(formatted.id);
    } catch (error) {
      console.error("Limits Tab: Persistence error:", error);
    }
  };

  const handleSaveNewLimit = (newLimit) => {
    if (!newLimit) return;
    setLimits((prev) => [...prev, newLimit]);
    setIsNewLimitOpen(false);
  };

  // 5. Derive keys for table column logic
  const { activeQuarterKey, activeQuarterLabel } = useMemo(() => {
    if (isLoading || !activeQuarter) {
      return { activeQuarterKey: "q4", activeQuarterLabel: "Loading..." };
    }

    const qNum = activeQuarter.quarter || 
                 activeQuarter.display_label?.replace(/[^\d]/g, "")?.charAt(0) || 
                 "4";
    
    return {
      activeQuarterKey: `q${qNum}`,
      activeQuarterLabel: activeQuarter.display_label,
    };
  }, [activeQuarter, isLoading]);

  // Sorting and Parsing
  const parsePct = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s === "-") return null;
    const n = Number(s.replace(/\s+/g, "").replace("%", "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const setSortKey = (key) => {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  };

  const sortedLimits = useMemo(() => {
    if (!sort.key) return limits;
    const dir = sort.dir === "asc" ? 1 : -1;
    const rows = [...limits];

    rows.sort((a, b) => {
      let av, bv;
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
      } else {
        av = parsePct(a[sort.key]);
        bv = parsePct(b[sort.key]);
      }
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
        <div className="limits-top-row">
          <div className="limits-period-wrapper">
            <QuarterSelector
              options={quarters}
              selected={selectedTimeframeId}
              onChange={handleTimeframeChange}
              onSaveNew={handleSaveNewTimeframe}
              isLoading={isLoading}
              isSingle={true}
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
                <th className="limits-th limits-th-description limits-th--sortable" onClick={() => setSortKey("description")}>
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
                <th className="limits-th limits-th-number limits-th--sortable" onClick={() => setSortKey(activeQuarterKey)}>
                  <span className="limits-th-inner">
                    <span>{activeQuarterLabel}</span>
                    <SortIcon />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLimits.map((row, index) => (
                <tr key={`${row.name}-${index}`} className="limits-row">
                  <td className="limits-td limits-td-name">
                    <div className="limits-name-main">{row.name}</div>
                    <button type="button" className="limits-article-link">
                      {row.article}
                    </button>
                  </td>
                  <td className="limits-td limits-td-description">{row.description}</td>
                  <td className="limits-td limits-td-number">{row.limit}</td>
                  <td className="limits-td limits-td-number">
                    {row[activeQuarterKey] ?? "-"}
                  </td>
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