import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip 
} from 'recharts';
import './FundValueChart.css';

const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const lines = payload.value.split('\n');
  return (
    <g transform={`translate(${x},${y + 12})`}>
      <text textAnchor="middle" className="fvc-chart-xaxis-tick">
        {lines.map((line, index) => (
          <tspan x="0" dy={index === 0 ? 0 : 20} key={index}>{line}</tspan>
        ))}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const value = Number(payload[0].value || 0);
    return (
      <div className="fvc-custom-tooltip">
        <p className="fvc-tooltip-value">
          {`${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m€`}
        </p> 
      </div>
    );
  }
  return null;
};

const formatMillions = (value) => {
  const millions = Number(value || 0);
  return `${millions.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} m`;
};

function FundValueChart({ data = [] }) { 
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="fvc-card-chart-fund-value">
        <div className="fvc-fund-card-header">
          <span className="fvc-fund-title">FUND VALUE CREATION</span>
          <span className="fvc-fund-unit">(m€)</span>
        </div>
        <div className="fvc-chart-body fvc-empty-state">
          No Fund Value Chart Data Available.
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.value || 0));
  const maxTickLabel = formatMillions(maxValue);
  const yAxisWidth = Math.max(34, maxTickLabel.length * 7 + 8);

  return (
    <div className="fvc-card-chart-fund-value">
      <div className="fvc-fund-card-header">
        <span className="fvc-fund-title">FUND VALUE CREATION</span>
        <span className="fvc-fund-unit">(m€)</span>
      </div>

      <div className="fvc-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData} 
            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
            barSize={54} 
          >
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
              tickClassName="fvc-chart-yaxis-tick"
              tickFormatter={formatMillions}
              width={yAxisWidth}
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'transparent' }}
            /> 
            
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <Cell fill="#375A89" />
              <Cell fill="#375A89" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default FundValueChart;