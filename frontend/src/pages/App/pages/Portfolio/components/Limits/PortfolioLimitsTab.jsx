import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation, useParams } from 'react-router-dom';
import { LIMITS_DATA } from "../../portfolioData";
import NewLimitPanel from "./components/NewLimitPanel";
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, apiRowToQuarter } from '../../../../../../components/QuarterSelection/useTimeframes';
import { PlusIcon, SortIcon } from "../../icons.jsx"; 

const PortfolioLimitsTab = () => {
  const { fundId } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { timeframeId: paramTid } = useParams();
  
  const { quarters, isLoading, setQuarters } = useTimeframes(fundId);
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);
  
  // Local state for limits to allow immediate UI updates on "Save"
  const [localLimits, setLocalLimits] = useState(LIMITS_DATA[fundId] || []);

  const queryParams = new URLSearchParams(location.search);
  const currentTimeframeId = queryParams.get("timeframe") || paramTid;

  // Sync local limits if fundId changes
  useEffect(() => {
    setLocalLimits(LIMITS_DATA[fundId] || []);
  }, [fundId]);

  const handleTimeframeChange = (id) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("timeframe", id);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
  };

  const handleCreateLimit = (formData) => {
    // formData contains the state from NewLimitPanel
    const newEntry = {
      id: Date.now(), 
      name: formData.name,
      article: formData.ppm_reference || "N/A",
      description: formData.description,
      limit: `${formData.min_max}%`, // This ensures the '50%' is captured as the limit definition
      values: {
        // Use the rate from the form for the currently selected quarter (e.g., Q1 2020)
        [currentTimeframeId]: `${formData.rate}%` 
      }
    };

    setLocalLimits(prev => [...prev, newEntry]);
    setIsNewLimitOpen(false);
  };

  const activeQuarter = quarters.find(q => Number(q.id) === Number(currentTimeframeId));
  const currentPeriodLabel = activeQuarter ? activeQuarter.display_label : "Select Period";

  return (
    <>
      <div className="portfolio-limits-root">
        <div className="limits-top-row">
          <div className="limits-period-wrapper">
            <QuarterSelector 
              options={quarters}
              selected={currentTimeframeId ? Number(currentTimeframeId) : null}
              onChange={handleTimeframeChange}
              onSaveNew={() => {}} // Timeframe creation handled elsewhere or left empty
              isLoading={isLoading}
              isSingle={true}
            />
          </div>

          <button className="limits-new-btn" onClick={() => setIsNewLimitOpen(true)}>
            <span className="limits-new-plus"><PlusIcon /></span>
            <span>New limit</span>
          </button>
        </div>

        <div className="limits-table-wrapper">
          <table className="limits-table">
            <thead>
              <tr>
                <th className="limits-th">Name <SortIcon /></th>
                <th className="limits-th">Description</th>
                <th className="limits-th">Limits <SortIcon /></th>
                {/* Dynamically show ONLY the selected quarter column */}
                <th className="limits-th">{currentPeriodLabel} <SortIcon /></th>
              </tr>
            </thead>
            <tbody>
              {localLimits.map((row) => (
                <tr key={row.id} className="limits-row">
                  <td className="limits-td">
                    <div className="limits-name-main">{row.name}</div>
                    <button className="limits-article-link">{row.article}</button>
                  </td>
                  <td className="limits-td">{row.description}</td>
                  <td className="limits-td">{row.limit}</td>
                  {/* Extract value specifically for the active timeframe */}
                  <td className="limits-td">
                    {row.values[currentTimeframeId] || "-"}
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