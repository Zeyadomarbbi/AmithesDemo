// components/PortfolioSummaryTab.jsx
import React, { useState } from "react";

import {
  ChevronDownIcon,
  ArrowSwapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  DownloadIcon,
  iconStyle,
  smallIconStyle,
} from "../icons";


import { UNREALIZED_ROWS, REALIZED_ROWS } from "../portfolioData";
import NewInvestmentModal from "./NewInvestmentModal";



const PortfolioSummaryTab = ({ onSelectInvestment }) => {
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);

  return (
    <>
 
          {/* Toolbar */}
    <div className="portfolio-toolbar">
      <div className="toolbar-left">
        
          <button
            className="timeframe-btn"
            onClick={() => setIsTimeframeOpen((prev) => !prev)}
          >
            <span>Q2 2024</span>
            <ChevronDownIcon
              className="icon-svg caret-icon"
              style={smallIconStyle}
            />
          </button>

          {isTimeframeOpen && (
            <div className="timeframe-menu">
              <button className="timeframe-menu-item">
                <span className="timeframe-menu-item-label">Q1 2024</span>
                <span className="timeframe-menu-item-date">08/03/26</span>
              </button>
              <button className="timeframe-menu-item active">
                <span className="timeframe-menu-item-label">Q2 2024</span>
                <span className="timeframe-menu-item-date">08/07/26</span>
              </button>
              <button className="timeframe-menu-add">
                + Add a new timeframe
              </button>
            </div>
          )}
       
      </div>

      <div className="toolbar-right">
        <button className="ghost-btn">
          <DownloadIcon style={iconStyle} />
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


      {/* Unrealized table */}
      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2 className="portfolio-section-title">
              Unrealized portfolio <span className="portfolio-count">5</span>
            </h2>
            <div className="portfolio-table-tools">
              <button className="icon-circle-btn">
                <MagnifyingGlassIcon className="icon-svg" style={iconStyle} />
              </button>
              <button className="icon-circle-btn">
                <FunnelIcon className="icon-svg" style={iconStyle} />
              </button>
            </div>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th className="col-name">
                    Name <span className="sort-indicator">↕</span>
                  </th>
                  <th>
                    Geography <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Ownership <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Cost (€) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Divid./Int. (€) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    MOIC (net) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Gross IRR <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number col-highlight">
                    Fair value (€) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number col-highlight">
                    Unreal. gain (€) <span className="sort-indicator">↕</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {UNREALIZED_ROWS.map((row) =>
                  row.type === "subtotal" ? (
                    <tr key={row.id} className="portfolio-subtotal-row">
                      <td className="subtotal-name-cell">
                        <ArrowTrendingUpIcon
                          className="icon-svg subtotal-icon"
                          style={iconStyle}
                        />
                        <span>Sub Total</span>
                      </td>
                      <td />
                      <td className="col-number">-</td>
                      <td className="col-number">{row.cost}</td>
                      <td className="col-number">{row.dividends}</td>
                      <td className="col-number">{row.moic}</td>
                      <td className="col-number">{row.irr}</td>
                      <td className="col-number col-highlight">
                        {row.fairValue}
                      </td>
                      <td className="col-number col-highlight">
                        {row.unrealizedGain}
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td
                        className="name-cell compare-name-cell"
                        onClick={() => onSelectInvestment({ ...row })}
                      >
                        <div className="name-main">{row.name}</div>
                        <div className="name-sub">{row.sector}</div>
                      </td>
                      <td>
                        <span className="flag">{row.countryFlag}</span>
                        <span className="geo-label">{row.country}</span>
                      </td>
                      <td className="col-number">{row.ownership}</td>
                      <td className="col-number">{row.cost}</td>
                      <td className="col-number">{row.dividends}</td>
                      <td className="col-number">{row.moic}</td>
                      <td className="col-number">{row.irr}</td>
                      <td className="col-number col-highlight">
                        {row.fairValue}
                      </td>
                      <td className="col-number col-highlight">
                        {row.unrealizedGain}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Realized table */}
      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2 className="portfolio-section-title">
              Realized portfolio <span className="portfolio-count">2</span>
            </h2>
            <div className="portfolio-table-tools">
              <button className="icon-circle-btn">
                <MagnifyingGlassIcon className="icon-svg" style={iconStyle} />
              </button>
              <button className="icon-circle-btn">
                <FunnelIcon className="icon-svg" style={iconStyle} />
              </button>
            </div>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th className="col-name">
                    Name <span className="sort-indicator">↕</span>
                  </th>
                  <th>
                    Geography <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Ownership <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Cost (€) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Divid./Int. (€) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    MOIC (net) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number">
                    Gross IRR <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number col-highlight">
                    Exit value (€) <span className="sort-indicator">↕</span>
                  </th>
                  <th className="col-number col-highlight">
                    Realized (€) <span className="sort-indicator">↕</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {REALIZED_ROWS.map((row) =>
                  row.type === "subtotal" ? (
                    <tr key={row.id} className="portfolio-subtotal-row">
                      <td className="subtotal-name-cell">
                        <ArrowTrendingUpIcon
                          className="icon-svg subtotal-icon"
                          style={iconStyle}
                        />
                        <span>Sub Total</span>
                      </td>
                      <td />
                      <td className="col-number">-</td>
                      <td className="col-number">{row.cost}</td>
                      <td className="col-number">{row.dividends}</td>
                      <td className="col-number">{row.moic}</td>
                      <td className="col-number">{row.irr}</td>
                      <td className="col-number col-highlight">
                        {row.exitValue}
                      </td>
                      <td className="col-number col-highlight">
                        {row.realized}
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td
                        className="name-cell compare-name-cell"
                        onClick={() => onSelectInvestment({ ...row })}
                      >
                        <div className="name-main">{row.name}</div>
                        <div className="name-sub">{row.sector}</div>
                      </td>
                      <td>
                        <span className="flag">{row.countryFlag}</span>
                        <span className="geo-label">{row.country}</span>
                      </td>
                      <td className="col-number">{row.ownership}</td>
                      <td className="col-number">{row.cost}</td>
                      <td className="col-number">{row.dividends}</td>
                      <td className="col-number">{row.moic}</td>
                      <td className="col-number">{row.irr}</td>
                      <td className="col-number col-highlight">
                        {row.exitValue}
                      </td>
                      <td className="col-number col-highlight">
                        {row.realized}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Totals row */}
      <section className="portfolio-total-section">
        <table className="portfolio-table total-table">
          <tbody>
            <tr className="portfolio-subtotal-row total-row">
              <td className="subtotal-name-cell">
                <ArrowTrendingUpIcon
                  className="icon-svg subtotal-icon"
                  style={iconStyle}
                />
                <span>Total</span>
              </td>
              <td />
              <td className="col-number">-</td>
              <td className="col-number">50 500 000</td>
              <td className="col-number">795 000</td>
              <td className="col-number">1.95x</td>
              <td className="col-number">15.26%</td>
              <td className="col-number col-highlight">94 650 000</td>
              <td className="col-number col-highlight">44 150 000</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* New investment modal */}
      {isNewInvestmentOpen && (
        <NewInvestmentModal onClose={() => setIsNewInvestmentOpen(false)} />
      )}
    </>
  );
};

export default PortfolioSummaryTab;
