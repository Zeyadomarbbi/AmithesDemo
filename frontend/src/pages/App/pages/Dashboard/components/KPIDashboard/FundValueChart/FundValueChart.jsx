import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell 
} from 'recharts';
import './FundValueChart.css';

const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const lines = payload.value.split('\n');
  return (
    <g transform={`translate(${x},${y + 12})`}>
      <text textAnchor="middle" className="chart-xaxis-tick">
        {lines.map((line, index) => (
          <tspan x="0" dy={index === 0 ? 0 : 20} key={index}>{line}</tspan>
        ))}
      </text>
    </g>
  );
};

function FundValueChart() {
  const data = [
    { name: 'Total\nAmount Called', value: 30 }, 
    { name: 'Total\nFund Value', value: 60 },
  ];

  return (
    <div className="card-chart-fund-value">
      <div className="fund-card-header">
        <span className="fund-title">FUND VALUE CREATION</span>
        <span className="fund-unit">(m€)</span>
      </div>

      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: 20, bottom: 20 }}
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
              tickClassName="chart-yaxis-tick"
              tickFormatter={(value) => `${value},00`} 
              width={40} 
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