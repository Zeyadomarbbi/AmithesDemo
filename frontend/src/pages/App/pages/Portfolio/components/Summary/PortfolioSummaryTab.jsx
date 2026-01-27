import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

/* ===== Components ===== */
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes } from "../../../../../../components/QuarterSelection/useTimeframes";
import NewInvestmentModal from "./components/NewInvestmentModal";
import InvestmentDetailsDrawer from "./components/InvestmentDetails/InvestmentDetailsDrawer";

/* ===== Styles ===== */
import "./PortfolioSummaryTab.css";

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
              <button className="icon-circle-btn">
                <MagnifyingGlassIcon style={iconStyle} />
              </button>
              <button className="icon-circle-btn">
                <FunnelIcon style={iconStyle} />
              </button>
            </div>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Geography</th>
                  <th>Ownership</th>
                  <th>Cost</th>
                  <th>Dividends</th>
                  <th>MOIC</th>
                  <th>IRR</th>
                  <th className="col-highlight">Fair Value</th>
                  <th className="col-highlight">Unrealized Gain</th>
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
                  <th>Name</th>
                  <th>Geography</th>
                  <th>Ownership</th>
                  <th>Cost</th>
                  <th>Dividends</th>
                  <th>MOIC</th>
                  <th>IRR</th>
                  <th className="col-highlight">Exit Value</th>
                  <th className="col-highlight">Realized</th>
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
