import React, { useState } from "react";
import { useOutletContext, useNavigate, useLocation, useParams } from 'react-router-dom';
import { LIMITS_ROWS } from "../../portfolioData";
import NewLimitPanel from "./components/NewLimitPanel";

// Persistent Hooks and Components
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, apiRowToQuarter } from '../../../../../../components/QuarterSelection/useTimeframes';
import { PlusIcon, SortIcon } from "../../icons.jsx"; // Assuming path to your Icons component

const PortfolioLimitsTab = () => {
  const { fundId } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { timeframeId } = useParams();
  
  // Fetch backend timeframes
  const { quarters, isLoading, setQuarters } = useTimeframes(fundId);
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);

  // Persistence: Save new timeframe to API
  const handleSaveNew = async (newTimeframe) => {
    const payload = {
      fund: fundId,
      display_label: newTimeframe.name,
      full_date: newTimeframe.endDate.toISOString().split('T')[0] 
    };

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/timeframes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Persistence failed");

      const savedRow = await response.json();
      const formatted = apiRowToQuarter(savedRow);

      // Update local state and navigate to the new selection
      setQuarters(prev => [...prev, formatted]);
      handleTimeframeChange(formatted.id);
    } catch (error) {
      console.error("Limits Tab: Persistence error:", error);
    }
  };

  // Navigation: Update URL on selection
  const handleTimeframeChange = (id) => {
    // This keeps the current URL path and only updates the timeframe query
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("timeframe", id);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
  };

  // Find active label for the table header
  const queryParams = new URLSearchParams(location.search);
  const currentTimeframeId = queryParams.get("timeframe") || timeframeId;

  const activeQuarter = quarters.find(q => 
    Number(q.id) === Number(currentTimeframeId)
  );
  
  const currentPeriodLabel = activeQuarter ? activeQuarter.display_label : "Q4 2024";;

  return (
    <>
      <div className="portfolio-limits-root"> {/* Updated container class to match Limits structure */}
        <div className="limits-top-row"> {/* Updated filter row to match Limits structure */}
          <div className="limits-period-wrapper">
            <QuarterSelector 
              options={quarters}
              // FIX: Use currentTimeframeId so the dropdown shows the active selection
              selected={currentTimeframeId ? Number(currentTimeframeId) : null}
              onChange={handleTimeframeChange}
              onSaveNew={handleSaveNew}
              isLoading={isLoading}
              isSingle={true}
            />
          </div>

          {/* New limit button styled based on Limits.jsx */}
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
                <th className="limits-th limits-th-name limits-th--sortable">
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
                <th className="limits-th limits-th-number limits-th--sortable">
                  <span className="limits-th-inner">
                    <span>Limits</span>
                    <SortIcon />
                  </span>
                </th>
                <th className="limits-th limits-th-number limits-th--sortable">
                  <span className="limits-th-inner">
                    <span>{currentPeriodLabel}</span>
                    <SortIcon />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {LIMITS_ROWS.map((row) => (
                <tr key={row.id} className="limits-row">
                  <td className="limits-td limits-td-name">
                    <div className="limits-name-main">{row.name}</div>
                    <button type="button" className="limits-article-link">
                      {row.article}
                    </button>
                  </td>
                  <td className="limits-td limits-td-description">
                    {row.description}
                  </td>
                  <td className="limits-td limits-td-number">
                    {row.limit}
                  </td>
                  <td className="limits-td limits-td-number">
                    {row.q4}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isNewLimitOpen && (
        <NewLimitPanel onClose={() => setIsNewLimitOpen(false)} />
      )}
    </>
  );
};

export default PortfolioLimitsTab;