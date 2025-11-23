import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell 
} from 'recharts';
import './PortfolioValueChart.css';

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

function PortfolioValueChart() {
  const data = [
    /* 1. FIX: Add 'isHatched: true' here so the logic knows to use the pattern */
    { name: 'Portfolio\nInvestment Cost', value: 45, isHatched: true }, 
    { name: 'Porfolio\nTotal Value', value: 65 },
  ];

  return (
    <div className="card-chart-portfolio-value">
      <div className="fund-card-header">
        <span className="fund-title">PORTFOLIO VALUE CREATION</span>
        <span className="fund-unit">(m€)</span>
      </div>

      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: 20, bottom: 20 }}
            barSize={54} 
          >
            <defs>
              {/* 2. FIX: Refined Pattern for clean lines */}
              <pattern 
                id="stripePattern" 
                patternUnits="userSpaceOnUse" 
                width="8" 
                height="8" 
                patternTransform="rotate(45)"
              >
                {/* Background Color (Light Blue) */}
                <rect width="8" height="8" fill="rgba(55, 90, 137, 0.2)" />
                {/* The Stripe Line (Dark Blue, 2px wide) */}
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
              tickClassName="chart-yaxis-tick"
              tickFormatter={(value) => `${value},00`} 
              width={40} 
            />
            
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  /* Logic checks isHatched from data above */
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