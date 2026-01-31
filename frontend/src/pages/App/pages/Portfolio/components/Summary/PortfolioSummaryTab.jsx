import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

/* ===== Components ===== */
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes } from "../../../../hooks/Core/useTimeframes";
import NewInvestmentModal from "./components/NewInvestmentModal";
import InvestmentDetailsDrawer from "./components/InvestmentDetails/InvestmentDetailsDrawer";

/* ===== Styles ===== */
import "./PortfolioSummaryTab.css";
const SortIcon = () => (
  <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '8px', verticalAlign: 'middle' }}>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5286 0.195262C3.78894 -0.0650874 4.21106 -0.0650874 4.4714 0.195262L7.80474 3.5286C8.06509 3.78894 8.06509 4.21106 7.80474 4.4714C7.54439 4.73175 7.12228 4.73175 6.86193 4.4714L4 1.60948L1.13807 4.4714C0.877722 4.73175 0.455612 4.73175 0.195262 4.4714C-0.0650874 4.21106 -0.0650874 3.78894 0.195262 3.5286L3.5286 0.195262ZM0.195262 7.5286C0.455612 7.26825 0.877722 7.26825 1.13807 7.5286L4 10.3905L6.86193 7.5286C7.12228 7.26825 7.54439 7.26825 7.80474 7.5286C8.06509 7.78895 8.06509 8.21106 7.80474 8.47141L4.4714 11.8047C4.21106 12.0651 3.78894 12.0651 3.5286 11.8047L0.195262 8.47141C-0.0650874 8.21106 -0.0650874 7.78895 0.195262 7.5286Z" fill="#375A89"/>
  </svg>
);
/* ===== Icons ===== */
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DownloadIcon,
  iconStyle,
} from "../../icons";

/* ================= Utils ================= */
const toNumber = (v) =>
  Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

/* ================= Component ================= */
const PortfolioSummaryTab = () => {
  const { fundId } = useOutletContext();
  const numericFundId = Number(fundId);

  /* ===== Timeframes ===== */
  const { quarters = [], isLoading } = useTimeframes(numericFundId);
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  /* ===== Modals / Drawers ===== */
  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  /* ===== Investments State ===== */
  const [unrealizedRows, setUnrealizedRows] = useState([]);
  const [realizedRows, setRealizedRows] = useState([]);

  /* ================= Add Investment ================= */
  const handleAddInvestment = ({
    name,
    country,
    sector,
    ownership,
    currency,
  }) => {
    const base = {
      id: `${Date.now()}-${Math.random()}`,
      fund_id: numericFundId,
      name,
      country,
      sector,
      ownership,
      currency,
      cost: 0,
      dividends: 0,
      moic: 0,
      irr: 0,
    };

    setUnrealizedRows((prev) => [
      ...prev,
      {
        ...base,
        fairValue: 0,
        unrealizedGain: 0,
      },
    ]);

    setRealizedRows((prev) => [
      ...prev,
      {
        ...base,
        exitValue: 0,
        realized: 0,
      },
    ]);
  };

  /* ================= Sub Totals ================= */
  const unrealizedSubtotal = useMemo(() => ({
    cost: unrealizedRows.reduce((s, r) => s + toNumber(r.cost), 0),
    dividends: unrealizedRows.reduce((s, r) => s + toNumber(r.dividends), 0),
    moic: unrealizedRows.reduce((s, r) => s + toNumber(r.moic), 0),
    irr: unrealizedRows.reduce((s, r) => s + toNumber(r.irr), 0),
    fairValue: unrealizedRows.reduce((s, r) => s + toNumber(r.fairValue), 0),
    unrealizedGain: unrealizedRows.reduce(
      (s, r) =>
        s +
        toNumber(r.fairValue) +
        toNumber(r.dividends) +
        toNumber(r.cost),
      0
    ),
  }), [unrealizedRows]);

  const realizedSubtotal = useMemo(() => ({
    cost: realizedRows.reduce((s, r) => s + toNumber(r.cost), 0),
    dividends: realizedRows.reduce((s, r) => s + toNumber(r.dividends), 0),
    moic: realizedRows.reduce((s, r) => s + toNumber(r.moic), 0),
    irr: realizedRows.reduce((s, r) => s + toNumber(r.irr), 0),
    exitValue: realizedRows.reduce((s, r) => s + toNumber(r.exitValue), 0),
    realized: realizedRows.reduce(
      (s, r) =>
        s +
        toNumber(r.exitValue) +
        toNumber(r.dividends) +
        toNumber(r.cost),
      0
    ),
  }), [realizedRows]);

  /* ================= TOTAL ================= */
  const total = {
    cost: unrealizedSubtotal.cost + realizedSubtotal.cost,
    dividends: unrealizedSubtotal.dividends + realizedSubtotal.dividends,
    moic: unrealizedSubtotal.moic + realizedSubtotal.moic,
    irr: unrealizedSubtotal.irr + realizedSubtotal.irr,
    value: unrealizedSubtotal.fairValue + realizedSubtotal.exitValue,
    gain: unrealizedSubtotal.unrealizedGain + realizedSubtotal.realized,
  };

  /* ================= Render ================= */
  return (
    <>
      {/* ===== Toolbar ===== */}
      <div className="portfolio-toolbar">
        <div className="toolbar-left">
          <QuarterSelector
            options={quarters}
            selected={selectedQuarter}
            onChange={setSelectedQuarter}
            isLoading={isLoading}
            isSingle
            allowAddNew={false}
          />
        </div>

        <div className="toolbar-right">
          <button className="ghost-btn">
            <DownloadIcon />
            <span>Download</span>
          </button>

          <button
            className="primary-btn"
            onClick={() => setIsNewInvestmentOpen(true)}
          >
            + New investment
          </button>
        </div>
      </div>

      {/* ===== Unrealized ===== */}
      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2>
              Unrealized portfolio
              <span className="portfolio-count">{unrealizedRows.length}</span>
            </h2>
            <div className="portfolio-table-tools">
              <button className="icon-circle-btn search-btn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd"
                      d="M5.33333 1.33333C3.12419 1.33333 1.33333 3.12419 1.33333 5.33333C1.33333 7.54247 3.12419 9.33333 5.33333 9.33333C7.54247 9.33333 9.33333 7.54247 9.33333 5.33333C9.33333 3.12419 7.54247 1.33333 5.33333 1.33333ZM0 5.33333C0 2.38781 2.38781 0 5.33333 0C8.27885 0 10.6667 2.38781 10.6667 5.33333C10.6667 6.56579 10.2486 7.70061 9.5466 8.60373L13.1381 12.1953C13.3984 12.4556 13.3984 12.8777 13.1381 13.1381C12.8777 13.3984 12.4556 13.3984 12.1953 13.1381L8.60379 9.54655C7.70067 10.2486 6.56582 10.6667 5.33333 10.6667C2.38781 10.6667 0 8.27885 0 5.33333Z"
                      fill="#375A89"/>
                  </svg>
                </button>

              <button className="icon-circle-btn filter-btn">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 9C2 4.58172 5.58172 1 10 1H26C30.4183 1 34 4.58172 34 9V25C34 29.4183 30.4183 33 26 33H10C5.58172 33 2 29.4183 2 25V9Z" fill="white"/>
                      <path d="M10 1.5H26C30.1421 1.5 33.5 4.85786 33.5 9V25C33.5 29.1421 30.1421 32.5 26 32.5H10C5.85786 32.5 2.5 29.1421 2.5 25V9C2.5 4.85786 5.85786 1.5 10 1.5Z"
                        stroke="#CCCDCE" strokeOpacity="0.5"/>
                      <path d="M11.334 13H24.667M13.334 17H22.667M15.334 21H20.667"
                        stroke="#375A89" strokeWidth="1.333" strokeLinecap="round"/>
                    </svg>
                  </button>
            </div>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Name <SortIcon /></th>
                  <th>Geography <SortIcon /></th>
                  <th>Ownership <SortIcon /></th>
                  <th>Cost <SortIcon /></th>
                  <th>Dividends <SortIcon /></th>
                  <th>MOIC <SortIcon /></th>
                  <th>IRR <SortIcon /></th>
                  <th className="col-highlight">Fair Value <SortIcon /></th>
                  <th className="col-highlight">Unrealized Gain <SortIcon /></th>
                </tr>
              </thead>
              <tbody>
                {unrealizedRows.map((r) => (
                  <tr key={r.id}>
                    <td
                      className="name-cell"
                      onClick={() => setSelectedInvestment(r)}
                    >
                      <div className="name-main">{r.name}</div>
                      <div className="name-sub">{r.sector}</div>
                    </td>
                    <td>{r.country}</td>
                    <td>{r.ownership}</td>
                    <td>{r.cost}</td>
                    <td>{r.dividends}</td>
                    <td>{r.moic}</td>
                    <td>{r.irr}</td>
                    <td className="col-highlight">{r.fairValue}</td>
                    <td className="col-highlight">{r.unrealizedGain}</td>
                  </tr>
                ))}

                <tr className="portfolio-subtotal-row">
                  <td className="subtotal-name-cell">Sub Total</td>
                  <td />
                  <td />
                  <td>{unrealizedSubtotal.cost}</td>
                  <td>{unrealizedSubtotal.dividends}</td>
                  <td>{unrealizedSubtotal.moic}</td>
                  <td>{unrealizedSubtotal.irr}</td>
                  <td className="col-highlight">
                    {unrealizedSubtotal.fairValue}
                  </td>
                  <td className="col-highlight">
                    {unrealizedSubtotal.unrealizedGain}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== Realized ===== */}
      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2>
              Realized portfolio
              <span className="portfolio-count">{realizedRows.length}</span>
            </h2>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Name <SortIcon /></th>
                  <th>Geography <SortIcon /></th>
                  <th>Ownership <SortIcon /></th>
                  <th>Cost <SortIcon /></th>
                  <th>Dividends <SortIcon /></th>
                  <th>MOIC <SortIcon /></th>
                  <th>IRR <SortIcon /></th>
                  <th className="col-highlight">Exit Value <SortIcon /></th>
                  <th className="col-highlight">Realized <SortIcon /></th>
                </tr>
              </thead>
              <tbody>
                {realizedRows.map((r) => (
                  <tr key={r.id}>
                    <td
                      className="name-cell"
                      onClick={() => setSelectedInvestment(r)}
                    >
                      <div className="name-main">{r.name}</div>
                      <div className="name-sub">{r.sector}</div>
                    </td>
                    <td>{r.country}</td>
                    <td>{r.ownership}</td>
                    <td>{r.cost}</td>
                    <td>{r.dividends}</td>
                    <td>{r.moic}</td>
                    <td>{r.irr}</td>
                    <td className="col-highlight">{r.exitValue}</td>
                    <td className="col-highlight">{r.realized}</td>
                  </tr>
                ))}

                <tr className="portfolio-subtotal-row">
                  <td className="subtotal-name-cell">Sub Total</td>
                  <td />
                  <td />
                  <td>{realizedSubtotal.cost}</td>
                  <td>{realizedSubtotal.dividends}</td>
                  <td>{realizedSubtotal.moic}</td>
                  <td>{realizedSubtotal.irr}</td>
                  <td className="col-highlight">
                    {realizedSubtotal.exitValue}
                  </td>
                  <td className="col-highlight">
                    {realizedSubtotal.realized}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2>
              Projected portfolio
              <span className="portfolio-count">{realizedRows.length}</span>
            </h2>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Name <SortIcon /></th>
                  <th>Geography <SortIcon /></th>
                  <th>Ownership <SortIcon /></th>
                  <th>Cost <SortI con /></th>
                  <th>Dividends <SortIcon /></th>
                  <th>MOIC <SortIcon /></th>
                  <th>IRR <SortIcon /></th>
                  <th className="col-highlight">Exit Value <SortIcon /></th>
                  <th className="col-highlight">Realized <SortIcon /></th>
                </tr>
              </thead>
              <tbody>
                {realizedRows.map((r) => (
                  <tr key={r.id}>
                    <td
                      className="name-cell"
                      onClick={() => setSelectedInvestment(r)}
                    >
                      <div className="name-main">{r.name}</div>
                      <div className="name-sub">{r.sector}</div>
                    </td>
                    <td>{r.country}</td>
                    <td>{r.ownership}</td>
                    <td>{r.cost}</td>
                    <td>{r.dividends}</td>
                    <td>{r.moic}</td>
                    <td>{r.irr}</td>
                    <td className="col-highlight">{r.exitValue}</td>
                    <td className="col-highlight">{r.realized}</td>
                  </tr>
                ))}

                <tr className="portfolio-subtotal-row">
                  <td className="subtotal-name-cell">Sub Total</td>
                  <td />
                  <td />
                  <td>{realizedSubtotal.cost}</td>
                  <td>{realizedSubtotal.dividends}</td>
                  <td>{realizedSubtotal.moic}</td>
                  <td>{realizedSubtotal.irr}</td>
                  <td className="col-highlight">
                    {realizedSubtotal.exitValue}
                  </td>
                  <td className="col-highlight">
                    {realizedSubtotal.realized}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {/* ===== TOTAL ===== */}
      <section className="portfolio-total-section">
        <div className="portfolio-table-scroll">
          <table className="portfolio-table total-table">
            <tbody>
              <tr className="portfolio-subtotal-row total-row">
                <td className="subtotal-name-cell">Total</td>
                <td />
                <td />
                <td>{total.cost}</td>
                <td>{total.dividends}</td>
                <td>{total.moic}</td>
                <td>{total.irr}</td>
                <td className="col-highlight">{total.value}</td>
                <td className="col-highlight">{total.gain}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Modals / Drawers ===== */}
      {isNewInvestmentOpen && (
        <NewInvestmentModal
          onClose={() => setIsNewInvestmentOpen(false)}
          onSave={handleAddInvestment}
        />
      )}

      {selectedInvestment && (
        <InvestmentDetailsDrawer
          investment={selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
        />
      )}
    </>
  );
};

export default PortfolioSummaryTab;
