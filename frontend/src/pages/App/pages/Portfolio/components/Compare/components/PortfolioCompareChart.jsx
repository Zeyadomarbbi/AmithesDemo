import React from "react";
import SimpleDropdown from "../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, Legend,
} from "recharts";

const COLORS = ["#818CF8", "#34D399"];

const PortfolioCompareChart = ({ chartData, options = [], selectedKey, setSelectedKey, activeQuarters = [] }) => {
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

  const dropdownOptions = React.useMemo(
    () => options.map((o) => ({ id: o.key, name: o.label })),
    [options]
  );

  const selectedOption = options.find((o) => o.key === selectedKey);
  const selectedLabel = selectedOption?.label || "Select Metric";

  // Map the metric key to the timeframe field
  const metricToField = {
    cost:       "cost",
    fair_value: "fv",
    divestment: "divestment",
    dividends:  "dividends",
    interests:  "interests",
    change_fv:  null, // computed below
    change_cost: null,
  };

  // Build grouped chart data: one entry per investment, one bar key per quarter
  const groupedData = React.useMemo(() => {
    if (!chartData?.length || !activeQuarters?.length) return [];

    return chartData.map((row) => {
      const entry = { name: row.name };

      if (selectedKey === "change_fv" || selectedKey === "change_cost") {
        const field = selectedKey === "change_fv" ? "fv" : "cost";
        const newest = activeQuarters[0];
        const oldest = activeQuarters[activeQuarters.length - 1];
        if (activeQuarters.length >= 2) {
          const newestVal = row.timeframes?.[newest.id]?.[field] ?? 0;
          const oldestVal = row.timeframes?.[oldest.id]?.[field] ?? 0;
          entry[`q_${newest.id}`] = Number(((newestVal - oldestVal) / 1_000_000).toFixed(2));
        }
      } else {
        const field = metricToField[selectedKey];
        if (field) {
          activeQuarters.forEach((q) => {
            entry[`q_${q.id}`] = Number(((row.timeframes?.[q.id]?.[field] ?? 0) / 1_000_000).toFixed(2));
          });
        }
      }

      return entry;
    });
  }, [chartData, activeQuarters, selectedKey]);

  const isChangeMetric = selectedKey === "change_fv" || selectedKey === "change_cost";
  const barsToRender = isChangeMetric
    ? [activeQuarters[0]].filter(Boolean)
    : activeQuarters;

  return (
    <section className="compare-chart-section">
      <div className="compare-chart-card">
        <div className="compare-chart-header">
          <span className="compare-chart-title">Compare Investments (m€)</span>
            <div style={{ width: 220, flexShrink: 0 }}>
              <SimpleDropdown
                options={dropdownOptions}
                value={selectedKey}
                onChange={setSelectedKey}
                placeholder="Select Metric"
                isSingle={true}
                isSearchBar={true}
                searchLabel="Search metric..."
              />
            </div>
        </div>

        <div className="compare-chart-container" ref={containerRef}>
          <BarChart
            width={chartWidth}
            height={300}
            data={groupedData}
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
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              formatter={(value) => [`${value} m€`, selectedLabel]}
            />
            <ReferenceLine y={0} stroke="#E5E7EB" />
            {activeQuarters.length > 1 && <Legend />}
            {barsToRender.map((q, i) => (
              <Bar
                key={q.id}
                dataKey={`q_${q.id}`}
                name={q.display_label}
                radius={[4, 4, 4, 4]}
                barSize={activeQuarters.length > 1 ? 24 : 40}
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </BarChart>
        </div>
      </div>
    </section>
  );
};

export default PortfolioCompareChart;