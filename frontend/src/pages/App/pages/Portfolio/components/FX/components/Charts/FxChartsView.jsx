import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getLatestFxRowByCutoff, parseFxValue } from "../../FXbackwork";
import { ChevronDownIcon } from "../../Icons";
import QuarterSelector from "../../../../../../../../components/QuarterSelection/QuarterSelector";
import "./FxChartsView.css";

const normalizeLabel = (label) => String(label || "").replace(/\s/g, "");

const FxChartsView = ({ shared }) => {
  const {
    quarters,
    dealsInvestments,
    isDealsLoading,
    isTimeframesLoading,
    isFundsLoading,
    selectedTimeframeIds,
    debouncedSelectedTimeframes,
    handleToggleTimeframe,
    handleSaveTimeframe,
    symbol = "EUR",
  } = shared;

  if (isFundsLoading || isTimeframesLoading || isDealsLoading) return null;

  const [selectedInvestmentKey, setSelectedInvestmentKey] = React.useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const investmentOptions = React.useMemo(
    () => [
      { key: "all", label: "All Investments" },
      ...dealsInvestments.map((investment, index) => ({
        key: String(index),
        label: investment.title || `Investment #${index + 1}`,
      })),
    ],
    [dealsInvestments]
  );

  React.useEffect(() => {
    const stillValid = investmentOptions.some((opt) => opt.key === selectedInvestmentKey);
    if (!stillValid) setSelectedInvestmentKey("all");
  }, [investmentOptions, selectedInvestmentKey]);

  React.useEffect(() => {
    if (!isDropdownOpen && searchTerm) setSearchTerm("");
  }, [isDropdownOpen, searchTerm]);

  const filteredInvestmentOptions = React.useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();
    if (!q) return investmentOptions;
    return investmentOptions.filter((option) =>
      String(option?.label || "").toLowerCase().includes(q)
    );
  }, [investmentOptions, searchTerm]);

  const filteredInvestments = React.useMemo(() => {
    if (selectedInvestmentKey === "all") return dealsInvestments;
    const idx = Number(selectedInvestmentKey);
    if (!Number.isFinite(idx)) return dealsInvestments;
    return dealsInvestments[idx] ? [dealsInvestments[idx]] : dealsInvestments;
  }, [dealsInvestments, selectedInvestmentKey]);

  const selectedLabel =
    investmentOptions.find((opt) => opt.key === selectedInvestmentKey)?.label ||
    "All Investments";

  const activeTimeframes =
    debouncedSelectedTimeframes && debouncedSelectedTimeframes.length
      ? debouncedSelectedTimeframes
      : quarters;

  const chartData = activeTimeframes.map((timeframe) => {
    const impactKey = `impact${normalizeLabel(timeframe.display_label)}`;
    const totalImpact = filteredInvestments.reduce((sum, investment) => {
      const fvRows = Array.isArray(investment.fvRows) ? investment.fvRows : [];
      const latestFvRow = getLatestFxRowByCutoff(fvRows, [timeframe]);
      return sum + parseFxValue(latestFvRow?.[impactKey]);
    }, 0);

    return {
      name: timeframe.display_label,
      value: Number((totalImpact / 1000000).toFixed(2)),
    };
  });

  const totalInception = filteredInvestments.reduce((sum, investment) => {
    const fvRows = Array.isArray(investment.fvRows) ? investment.fvRows : [];
    const latestFvRow = getLatestFxRowByCutoff(fvRows, activeTimeframes);
    return sum + parseFxValue(latestFvRow?.impactInception);
  }, 0);

  const finalChartData = [
    ...chartData,
    {
      name: "Inception",
      value: Number((totalInception / 1000000).toFixed(2)),
    },
  ];

  return (
    <section className="fx-charts-section">
      <div className="fx-charts-card">
        <div className="fx-charts-header">
          <div className="fx-charts-title">FX Gains / Losses (m{symbol})</div>
          <div className="fx-charts-controls">
            <div className="limits-period-wrapper fx-charts-timeframes">
              <QuarterSelector
                options={quarters}
                selected={selectedTimeframeIds}
                onChange={handleToggleTimeframe}
                onSaveNew={handleSaveTimeframe}
                isLoading={isTimeframesLoading}
                isSingle={false}
              />
            </div>

            <div className="dropdown-container">
              <div
                className={`dropdown-btn ${isDropdownOpen ? "active" : ""}`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                <span>{selectedLabel}</span>
                <ChevronDownIcon />
              </div>

              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  <div className="quarter-search-wrapper">
                    <input
                      type="text"
                      className="quarter-search-input"
                      placeholder="Search investment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {filteredInvestmentOptions.map((option) => (
                    <div
                      key={option.key}
                      className={`dropdown-item ${selectedInvestmentKey === option.key ? "active" : ""}`}
                      onClick={() => {
                        setSelectedInvestmentKey(option.key);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                  {!filteredInvestmentOptions.length && (
                    <div className="quarter-no-results">No matches found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="fx-charts-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={finalChartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F3F4F6"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                dy={10}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "#F9FAFB" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                {finalChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.value >= 0 ? "#818CF8" : "#EF4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default FxChartsView;
