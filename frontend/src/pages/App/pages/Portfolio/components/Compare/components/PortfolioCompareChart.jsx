import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { ChevronDownIcon } from "../../../icons.jsx";

const PortfolioCompareChart = ({
  chartData,
  options = [],
  selectedKey,
  setSelectedKey,
}) => {
  const selectedOption = options.find((opt) => opt.key === selectedKey) || null;
  const selectedLabel = selectedOption?.label || "Select Column";
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const containerRef = React.useRef(null);
  const [chartWidth, setChartWidth] = React.useState(900);

  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.max(320, Math.floor(entries[0]?.contentRect?.width || 0));
      setChartWidth((prev) => (Math.abs(prev - nextWidth) > 1 ? nextWidth : prev));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isDropdownOpen && searchTerm) setSearchTerm("");
  }, [isDropdownOpen, searchTerm]);

  const filteredOptions = React.useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      String(option?.label || "").toLowerCase().includes(q)
    );
  }, [options, searchTerm]);

  return (
    <section className="compare-chart-section">
      <div className="compare-chart-card">
        <div className="compare-chart-header">
          <span className="compare-chart-title">Compare Investments (mEUR)</span>

          <div className="quarter-selector-container" style={{ minWidth: 220 }}>
            <div
              className={`quarter-selector-button ${isDropdownOpen ? "active" : ""}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ height: 36 }}
            >
              <div className="quarter-text-group">
                <span className="quarter-part">{selectedLabel}</span>
              </div>
              <div className={`quarter-icon ${isDropdownOpen ? "open" : ""}`}>
                <ChevronDownIcon />
              </div>
            </div>

            {isDropdownOpen && (
              <div className="quarter-dropdown" style={{ minWidth: "100%" }}>
                <div className="quarter-search-wrapper">
                  <input
                    type="text"
                    className="quarter-search-input"
                    placeholder="Search column..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="quarter-list">
                  {filteredOptions.map((option) => (
                    <div
                      key={option.key}
                      className={`quarter-item ${selectedKey === option.key ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedKey(option.key);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="item-label-bold">{option.label}</span>
                    </div>
                  ))}
                  {!filteredOptions.length && (
                    <div className="quarter-no-results">No matches found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="compare-chart-container" ref={containerRef}>
          <BarChart
            width={chartWidth}
            height={300}
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              dy={10}
              interval={0}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "#F9FAFB" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [`${value} mEUR`, selectedLabel]}
            />
            <ReferenceLine y={0} stroke="#E5E7EB" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? "#818CF8" : "#EF4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>
    </section>
  );
};

export default PortfolioCompareChart;
