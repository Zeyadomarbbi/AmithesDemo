import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useTimeframes } from '../../../../hooks/Core/useTimeframes';

import FundCard from './FundKPIs/FundCard/FundCard';
import FundValueChart from './FundKPIs/FundValueChart/FundValueChart';
import PortfolioValueChart from './PortfolioKPIs/PortfolioValueChart/PortfolioValueChart';
import PortfolioCard from './PortfolioKPIs/PortfolioCard/PortfolioCard';
import { fetchPortfolioValueCreationKPIs } from './PortfolioKPIs/PortfolioCard/portfolioCardnChartCalculations';
import { useCASKPIs } from '../../../../hooks/LPsStatement/useCASKPIs';
import useApi from '../../../../../../hooks/api/useApi';
import './KPIDashboard.css';

function GlobalSpinner() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(2px)',
      zIndex: 10,
      gap: 12,
      minHeight: '400px',
      borderRadius: '8px'
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '2.5px solid #e5e7eb',
        borderTopColor: '#6b7280',
        animation: 'spin 0.75s linear infinite',
      }} />
      <span style={{
        fontSize: 12,
        color: '#9ca3af',
        letterSpacing: '0.03em',
        fontWeight: 500,
      }}>
        Running API calculations...
      </span>
    </div>
  );
}

function KPIDashboard() {
  const { fundId } = useOutletContext();
  const { timeframeId } = useParams();
  const api = useApi();
  const { quarters, isLoading: isTimeframesLoading } = useTimeframes(fundId);

  // Debounce logic
  const [debouncedTimeframeId, setDebouncedTimeframeId] = useState(timeframeId);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTimeframeId(timeframeId);
    }, 400); // 400ms delay
    return () => clearTimeout(timer);
  }, [timeframeId]);

  const [portfolioCardData, setPortfolioCardData] = useState([]);
  const [portfolioValueChartData, setPortfolioValueChartData] = useState([]);
  const [isPortfolioCardLoading, setIsPortfolioCardLoading] = useState(false);
  
  // Pass debounced ID to hooks and memos
  const { data: casData, isLoading: casLoading } = useCASKPIs(fundId, debouncedTimeframeId);
  
  const selectedTimeframeDate = useMemo(() => {
    const selected = quarters?.find((q) => String(q.id) === String(debouncedTimeframeId));
    return selected?.rawDate || null;
  }, [quarters, debouncedTimeframeId]);

  useEffect(() => {
    if (!fundId || !debouncedTimeframeId || isTimeframesLoading) return;
    if (!selectedTimeframeDate) {
      setPortfolioCardData([]);
      setPortfolioValueChartData([]);
      return;
    }

    let isCancelled = false;

    const loadPortfolioCardData = async () => {
      try {
        setIsPortfolioCardLoading(true);
        const result = await fetchPortfolioValueCreationKPIs(
          api,
          {
          fundId: Number(fundId),
          cutoffDate: selectedTimeframeDate,
        });
        if (!isCancelled) {
          setPortfolioCardData(result.cardData);
          setPortfolioValueChartData(result.chartData || []);
        }
      } catch (error) {
        console.error('Failed to load portfolio value creation KPIs:', error);
        if (!isCancelled) {
          setPortfolioCardData([]);
          setPortfolioValueChartData([]);
        }
      } finally {
        if (!isCancelled) {
          setIsPortfolioCardLoading(false);
        }
      }
    };

    loadPortfolioCardData();

    return () => {
      isCancelled = true;
    };
  }, [fundId, debouncedTimeframeId, selectedTimeframeDate, isTimeframesLoading]);

  const fundCardData = useMemo(() => {
    if (!casData?.basic_kpis) return [];
    const k = casData.basic_kpis;
    const irr = casData.irr;
    
    const fmt = (v) => v != null ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A';
    const fmtX = (v) => v != null ? `${v.toFixed(2)}x` : 'N/A';
    const fmtPct = (v) => v != null ? `${(v).toFixed(2)}%` : 'N/A';

    return [
      { label: 'Total Commitments', value: fmt(k.commitment?.total) },
      { label: 'Amount Called',     value: fmt(k.capital_called?.total) },
      { label: '% Called',          value: fmtPct(k.pct_called?.total) },
      { label: 'Distributions (A)', value: fmt(k.distributed?.total) },
      { label: 'NAV (B)',           value: fmt(k.nav?.total) },
      { label: 'Total Value (A+B)', value: fmt(k.total_value?.total) },
      { label: 'DPI',               value: fmtX(k.dpi?.total) },
      { label: 'RVPI',              value: fmtX(k.rvpi?.total) },
      { label: 'TVPI',              value: fmtX(k.tvpi?.total) },
      { label: 'Net IRR',           value: fmtPct(irr?.fund_irr) },
    ];
  }, [casData]);

  const fundChartData = useMemo(() => {
    if (!casData?.basic_kpis) return [];
    const k = casData.basic_kpis;
    const toM = (v) => v != null ? parseFloat((v / 1_000_000).toFixed(2)) : 0;
    return [
      { name: 'Capital\nCalled',  value: toM(k.capital_called?.total) },
      { name: 'Total\nValue',     value: toM(k.total_value?.total) },
    ];
  }, [casData]);

  // Activate global spinner instantly upon URL change, persisting until debounced fetch resolves
  const isDebouncing = timeframeId !== debouncedTimeframeId;
  const isGlobalLoading = isTimeframesLoading || casLoading || isPortfolioCardLoading || isDebouncing;

  if (!timeframeId) {
    return <div className="no-selection-message">Please select a timeframe to view data.</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '400px' }}>
      {isGlobalLoading && <GlobalSpinner />}
      <div className="kpi-dashboard-grid">
        <FundCard data={fundCardData} />
        <FundValueChart data={fundChartData} />
        <PortfolioValueChart data={portfolioValueChartData} />
        <PortfolioCard data={portfolioCardData} />
      </div>
    </div>
  );
}

export default KPIDashboard;