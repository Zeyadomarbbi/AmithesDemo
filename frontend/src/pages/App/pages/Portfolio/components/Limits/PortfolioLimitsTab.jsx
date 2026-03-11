import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation, useParams } from 'react-router-dom';
import { LIMITS_DATA } from "../../portfolioData";
import NewLimitPanel from "./components/NewLimitPanel";
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, apiRowToQuarter } from '../../../../hooks/Core/useTimeframes';
import { PlusIcon, SortIcon } from "../../icons.jsx";
import "./PortfolioLimitsTab.css";

const PortfolioLimitsTab = () => {
  const { fundId } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { timeframeId: paramTid } = useParams();

  const { quarters, isLoading, setQuarters } = useTimeframes(fundId);
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);
  const [localLimits, setLocalLimits] = useState(LIMITS_DATA[fundId] || []);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const queryParams = new URLSearchParams(location.search);
  const currentTimeframeId = queryParams.get("timeframe") || paramTid;

  useEffect(() => {
    setLocalLimits(LIMITS_DATA[fundId] || []);
  }, [fundId]);

  const handleTimeframeChange = (id) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("timeframe", id);
    navigate({ pathname: location.pathname, search: searchParams.toString() }, { replace: true });
  };

  const handleCreateLimit = (formData) => {
    const newEntry = {
      id: Date.now(),
      name: formData.name,
      article: formData.ppm_reference || "N/A",
      description: formData.description,
      limit: formData.rate ? `${formData.rate}%` : "",
      values: {
        [currentTimeframeId]: formData.rate ? `${formData.rate}%` : "-"
      }
    };
    setLocalLimits(prev => [...prev, newEntry]);
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
    if (!sort.key) return localLimits;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...localLimits].sort((a, b) => {
      if (sort.key === "name") {
        return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase()) * dir;
      }
      const av = parsePct(a[sort.key]);
      const bv = parsePct(b[sort.key]);
      if (av === bv) return 0;
      return (av === null ? 1 : bv === null ? -1 : av - bv) * dir;
    });
  }, [localLimits, sort]);

  const activeQuarter = quarters.find(q => Number(q.id) === Number(currentTimeframeId));
  const currentPeriodLabel = activeQuarter ? (activeQuarter.label || activeQuarter.display_label) : "Select Period";

  return (
    <>
      <div className="limits-root">
        <div className="limits-top-row">
          <div className="limits-period-wrapper">
            <QuarterSelector
              options={quarters}
              selected={currentTimeframeId ? Number(currentTimeframeId) : null}
              onChange={handleTimeframeChange}
              onSaveNew={() => {}}
              isLoading={isLoading}
              isSingle={true}
            />
          </div>

          <button type="button" className="limits-new-btn" onClick={() => setIsNewLimitOpen(true)}>
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
                <th className="limits-th limits-th-number limits-th--sortable" onClick={() => setSortKey("period")}>
                  <span className="limits-th-inner">
                    <span>{currentPeriodLabel}</span>
                    <SortIcon />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLimits.map((row) => (
                <tr key={row.id} className="limits-row">
                  <td className="limits-td limits-td-name">
                    <div className="limits-name-main">{row.name}</div>
                    <button type="button" className="limits-article-link">{row.article}</button>
                  </td>
                  <td className="limits-td limits-td-description">{row.description}</td>
                  <td className="limits-td limits-td-number">{row.limit}</td>
                  <td className="limits-td limits-td-number">
                    {row.values?.[currentTimeframeId] || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewLimitPanel
        open={isNewLimitOpen}
        onClose={() => setIsNewLimitOpen(false)}
        onSave={handleCreateLimit}
      />
    </>
  );
};

export default PortfolioLimitsTab;
