import { ChevronDownIcon } from "@heroicons/react/24/outline";

const smallIconStyle = { color: "#111827", width: 14, height: 14 };

const FxChartsView = () => (
  <section className="fx-charts-section">
    <div className="fx-charts-filters-row">
      {["Investment", "Currency", "Timeframes"].map(filter => (
        <button key={filter} className="dropdown-btn">
          <span>{filter}</span>
          <ChevronDownIcon className="icon-svg caret-icon" style={smallIconStyle} />
        </button>
      ))}
    </div>

    <div className="fx-charts-card">
      <div className="fx-charts-header">
        <div className="fx-charts-title">FX Gains / Losses (m€)</div>
        <button className="fx-charts-menu-btn">…</button>
      </div>
      <div className="fx-charts-body">
        <div className="fx-charts-plot" />
        <div className="fx-charts-xlabels">
          {["Q4 23", "Q2 24", "Q4 24", "Q2 25", "Q4 25"].map(q => <span key={q}>{q}</span>)}
        </div>
      </div>
    </div>
  </section>
);

export default FxChartsView;