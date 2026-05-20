import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip 
} from 'recharts';
import './PortfolioValueChart.css';

const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const lines = payload.value.split('\n');
  return (
    <g transform={`translate(${x},${y + 24})`}> 
      <text 
        transform="rotate(-35)" 
        textAnchor="end" 
        className="pvc-chart-xaxis-tick"
      >
        {lines.map((line, index) => (
          <tspan x="0" dy={index === 0 ? 0 : 14} key={index}>{line}</tspan>
        ))}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const value = Number(payload[0].value || 0) / 1000000;
    return (
      <div className="pvc-custom-tooltip">
        <p className="pvc-tooltip-value">
          {`${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m€`}
        </p>
      </div>
    );
  }
  return null;
};

const formatMillions = (value) => {
  const millions = Number(value || 0) / 1000000;
  return `${millions.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} m`;
};

function PortfolioValueChart({ data = [] }) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="pvc-card-chart-portfolio-value">
        <div className="pvc-fund-card-header">
          <span className="pvc-fund-title">PORTFOLIO VALUE CREATION</span>
          <span className="pvc-fund-unit">(m€)</span>
        </div>
        <div className="pvc-chart-body pvc-empty-state">
          No Portfolio Value Chart Data Available.
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.value || 0));
  const maxTickLabel = formatMillions(maxValue);
  const yAxisWidth = Math.max(34, maxTickLabel.length * 7 + 8);

  return (
    <div className="pvc-card-chart-portfolio-value">
      <div className="pvc-fund-card-header">
        <span className="pvc-fund-title">PORTFOLIO VALUE CREATION</span>
        <span className="pvc-fund-unit">(m€)</span>
      </div>

      <div className="pvc-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 50 }}
            maxBarSize={54}
          >
            <defs>
              <pattern
                id="stripePattern"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="rgba(55, 90, 137, 0.2)" />
                <rect width="2" height="8" fill="#375A89" />
              </pattern>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(204, 205, 206, 0.5)" />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              interval={0}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickClassName="pvc-chart-yaxis-tick"
              tickFormatter={formatMillions}
              width={yAxisWidth}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'transparent' }}
            />

            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isHatched ? "url(#stripePattern)" : "#375A89"}
                  stroke={entry.isHatched ? "#375A89" : "none"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PortfolioValueChart;