import React from 'react';
import './PortfolioCard.css';

// Local DataRow component with pc- prefixes (based on previous request)
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
 * The order of the first 6 elements in the array is critical for rendering in two columns (3 rows each).
 *
 * @param {Array<{label: string, value: string}>} data - Metrics data array.
 */
function PortfolioCard({ data }) {
  const dataArray = Array.isArray(data) ? data : [];

  if (dataArray.length === 0) {
    /* Empty state based on FundCard structure, using pc- prefixes */
    return (
      <div className="pc-card-portfolio-wide">
        <div className="pc-fund-card-header">
          <span className="pc-fund-title">PORTFOLIO</span>
          <span className="pc-fund-unit">(m€)</span>
        </div>
        <div className="pc-portfolio-body pc-empty-state">
          No Portfolio Metrics Available.
        </div>
      </div>
    );
  }

  // Split data into two columns (assuming 6 total metrics, 3 per column)
  const leftColumnData = dataArray.slice(0, 3);
  const rightColumnData = dataArray.slice(3, 6);

  // Helper to safely retrieve data by index for consistent rendering
  const getRowProps = (data, index) => {
    const item = data[index];
    if (!item) return { label: '---', value: '---', isMultiLine: false };

    // Determine if the row should be multi-line (only the 3rd item in the original structure)
    const isMultiLine = (item.label === "Porfolio Fair Market Value (B)");

    return { label: item.label, value: item.value, isMultiLine };
  };

  return (
    <div className="pc-card-portfolio-wide">

      {/* HEADER (using pc- prefixes) */}
      <div className="pc-fund-card-header">
        <span className="pc-fund-title">PORTFOLIO</span>
        <span className="pc-fund-unit">(m€)</span>
      </div>

      {/* BODY: Two Columns (using pc- prefixes) */}
      <div className="pc-portfolio-body">

        {/* Left Column */}
        <div className="pc-portfolio-column">
          <PCDataRow {...getRowProps(leftColumnData, 0)} />
          <PCDataRow {...getRowProps(leftColumnData, 1)} />
          {/* Third row (Fair Market Value) is explicitly marked as multi-line */}
          <PCDataRow {...getRowProps(leftColumnData, 2)} isMultiLine={true} />
        </div>

        {/* Right Column */}
        <div className="pc-portfolio-column">
          <PCDataRow {...getRowProps(rightColumnData, 0)} />
          <PCDataRow {...getRowProps(rightColumnData, 1)} />
          <PCDataRow {...getRowProps(rightColumnData, 2)} />
        </div>

      </div>

    </div>
  );
}

export default PortfolioCard;