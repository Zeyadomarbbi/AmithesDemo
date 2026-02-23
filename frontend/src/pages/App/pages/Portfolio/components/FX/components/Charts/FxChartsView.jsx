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
import { parseFxValue } from "../../FXbackwork";
import "./FxChartsView.css";

const normalizeLabel = (label) => String(label || "").replace(/\s/g, "");

const FxChartsView = ({ shared }) => {
  const {
    quarters,
    dealsInvestments,
    isDealsLoading,
    isTimeframesLoading,
    isFundsLoading,
    symbol = "EUR",
  } = shared;

  if (isFundsLoading || isTimeframesLoading || isDealsLoading) return null;

  const chartData = quarters.map((timeframe) => {
    const impactKey = `impact${normalizeLabel(timeframe.display_label)}`;
    const totalImpact = dealsInvestments.reduce((sum, investment) => {
      const fvRows = Array.isArray(investment.fvRows) ? investment.fvRows : [];
      const perInvestment = fvRows.reduce(
        (rowSum, row) => rowSum + parseFxValue(row[impactKey]),
        0
      );
      return sum + perInvestment;
    }, 0);

    return {
      name: timeframe.display_label,
      value: Number((totalImpact / 1000000).toFixed(2)),
    };
  });

  const totalInception = dealsInvestments.reduce((sum, investment) => {
    const fvRows = Array.isArray(investment.fvRows) ? investment.fvRows : [];
    return (
      sum +
      fvRows.reduce((rowSum, row) => rowSum + parseFxValue(row.impactInception), 0)
    );
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
