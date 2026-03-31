import React from 'react';
import './PortfolioCard.css';

const PCDataRow = ({ label, value, isMultiLine = false }) => (
  <div className={`pc-portfolio-data-row ${isMultiLine ? 'pc-multi-line' : ''}`}>
    <span className="pc-row-label">{label}</span>
    <div className="pc-row-separator"></div>
    <span className="pc-row-value">{value}</span>
  </div>
);

/**
 * PortfolioCard component displays key portfolio metrics in a two-column layout.
 * It accepts 'data' as a prop, which is expected to be an array of { label, value } objects.
 * Rows are split dynamically across two columns.
 *
 * @param {Array<{label: string, value: string}>} data - Metrics data array.
 */
function PortfolioCard({ data, isLoading = false }) {
  const dataArray = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <div className="pc-card-portfolio-wide">
        <div className="pc-fund-card-header">
          <span className="pc-fund-title">PORTFOLIO</span>
          <span className="pc-fund-unit">(€)</span>
        </div>
        <div className="pc-portfolio-body pc-empty-state">
          Loading Portfolio Metrics...
        </div>
      </div>
    );
  }

  if (dataArray.length === 0) {
    return (
      <div className="pc-card-portfolio-wide">
        <div className="pc-fund-card-header">
          <span className="pc-fund-title">PORTFOLIO</span>
          <span className="pc-fund-unit">(€)</span>
        </div>
        <div className="pc-portfolio-body pc-empty-state">
          No Portfolio Metrics Available.
        </div>
      </div>
    );
  }

  const middleIndex = Math.ceil(dataArray.length / 2);
  const leftColumnData = dataArray.slice(0, middleIndex);
  const rightColumnData = dataArray.slice(middleIndex);

  const getRowProps = (item) => {
    if (!item) return { label: '---', value: '---', isMultiLine: false };

    const isMultiLine = item.label === 'Portfolio Fair Market Value (D)';

    return { label: item.label, value: item.value, isMultiLine };
  };

  return (
    <div className="pc-card-portfolio-wide">
      <div className="pc-fund-card-header">
        <span className="pc-fund-title">PORTFOLIO</span>
        <span className="pc-fund-unit">(€)</span>
      </div>

      <div className="pc-portfolio-body">
        <div className="pc-portfolio-column">
          {leftColumnData.map((item, index) => (
            <PCDataRow
              key={`${item.label}-${index}`}
              {...getRowProps(item)}
            />
          ))}
        </div>

        <div className="pc-portfolio-column">
          {rightColumnData.map((item, index) => (
            <PCDataRow
              key={`${item.label}-${index}`}
              {...getRowProps(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PortfolioCard;
