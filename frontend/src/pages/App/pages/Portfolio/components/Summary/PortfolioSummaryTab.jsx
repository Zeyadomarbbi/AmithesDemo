// components/PortfolioSummaryTab.jsx
import React, { useState } from "react";
import { useOutletContext, useParams } from 'react-router-dom';

import "./PortfolioSummaryTab.css";

import {
  ChevronDownIcon,
  ArrowSwapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  DownloadIcon,
  iconStyle,
  smallIconStyle,
} from "../../icons";


import { UNREALIZED_ROWS, REALIZED_ROWS } from "../../portfolioData";
import NewInvestmentModal from "./components/NewInvestmentModal";



const PortfolioSummaryTab = ({ onSelectInvestment }) => {
  const { fundId } = useOutletContext();
  const numericFundId = Number(fundId);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);

  const unrealizedRows = UNREALIZED_ROWS.filter(
    r => r.fund_id === numericFundId
  );

  const realizedRows = REALIZED_ROWS.filter(
    r => r.fund_id === numericFundId
  );

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
                  <th className="sort-indicatore">
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
                {unrealizedRows.map((row) =>
                  row.type === "subtotal" ? (
                    <tr key={row.id} className="portfolio-subtotal-row">
                      <td className="subtotal-name-cell">
                        <button className="subtotal-btn"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M10.8333 1.66667C10.3731 1.66667 10 1.29357 10 0.833333C10 0.373096 10.3731 0 10.8333 0H15.8333C16.2936 0 16.6667 0.373096 16.6667 0.833333V5.83333C16.6667 6.29357 16.2936 6.66667 15.8333 6.66667C15.3731 6.66667 15 6.29357 15 5.83333V2.84518L10.5893 7.25592C10.2638 7.58136 9.73618 7.58136 9.41074 7.25592C9.08531 6.93049 9.08531 6.40285 9.41074 6.07741L13.8215 1.66667H10.8333ZM7.25592 9.41074C7.58136 9.73618 7.58136 10.2638 7.25592 10.5893L2.84518 15H5.83333C6.29357 15 6.66667 15.3731 6.66667 15.8333C6.66667 16.2936 6.29357 16.6667 5.83333 16.6667H0.833333C0.61232 16.6667 0.400358 16.5789 0.244078 16.4226C0.0877973 16.2663 0 16.0543 0 15.8333L2.48353e-07 10.8333C2.48353e-07 10.3731 0.373096 10 0.833333 10C1.29357 10 1.66667 10.3731 1.66667 10.8333L1.66667 13.8215L6.07741 9.41074C6.40285 9.08531 6.93048 9.08531 7.25592 9.41074Z" fill="white"/>
</svg>

</button>

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
                {realizedRows.map((row) =>
                  row.type === "subtotal" ? (
                    <tr key={row.id} className="portfolio-subtotal-row">
                      <td className="subtotal-name-cell">
                        <button className="subtotal-btn">
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.8333 1.66667C10.3731 1.66667 10 1.29357 10 0.833333C10 0.373096 10.3731 0 10.8333 0H15.8333C16.2936 0 16.6667 0.373096 16.6667 0.833333V5.83333C16.6667 6.29357 16.2936 6.66667 15.8333 6.66667C15.3731 6.66667 15 6.29357 15 5.83333V2.84518L10.5893 7.25592C10.2638 7.58136 9.73618 7.58136 9.41074 7.25592C9.08531 6.93049 9.08531 6.40285 9.41074 6.07741L13.8215 1.66667H10.8333ZM7.25592 9.41074C7.58136 9.73618 7.58136 10.2638 7.25592 10.5893L2.84518 15H5.83333C6.29357 15 6.66667 15.3731 6.66667 15.8333C6.66667 16.2936 6.29357 16.6667 5.83333 16.6667H0.833333C0.61232 16.6667 0.400358 16.5789 0.244078 16.4226C0.0877973 16.2663 0 16.0543 0 15.8333L2.48353e-07 10.8333C2.48353e-07 10.3731 0.373096 10 0.833333 10C1.29357 10 1.66667 10.3731 1.66667 10.8333L1.66667 13.8215L6.07741 9.41074C6.40285 9.08531 6.93048 9.08531 7.25592 9.41074Z" fill="white"/>
  </svg>
</button>

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
                <button className="subtotal-btn">
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.8333 1.66667C10.3731 1.66667 10 1.29357 10 0.833333C10 0.373096 10.3731 0 10.8333 0H15.8333C16.2936 0 16.6667 0.373096 16.6667 0.833333V5.83333C16.6667 6.29357 16.2936 6.66667 15.8333 6.66667C15.3731 6.66667 15 6.29357 15 5.83333V2.84518L10.5893 7.25592C10.2638 7.58136 9.73618 7.58136 9.41074 7.25592C9.08531 6.93049 9.08531 6.40285 9.41074 6.07741L13.8215 1.66667H10.8333ZM7.25592 9.41074C7.58136 9.73618 7.58136 10.2638 7.25592 10.5893L2.84518 15H5.83333C6.29357 15 6.66667 15.3731 6.66667 15.8333C6.66667 16.2936 6.29357 16.6667 5.83333 16.6667H0.833333C0.61232 16.6667 0.400358 16.5789 0.244078 16.4226C0.0877973 16.2663 0 16.0543 0 15.8333L2.48353e-07 10.8333C2.48353e-07 10.3731 0.373096 10 0.833333 10C1.29357 10 1.66667 10.3731 1.66667 10.8333L1.66667 13.8215L6.07741 9.41074C6.40285 9.08531 6.93048 9.08531 7.25592 9.41074Z" fill="white"/>
  </svg>
</button>

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
