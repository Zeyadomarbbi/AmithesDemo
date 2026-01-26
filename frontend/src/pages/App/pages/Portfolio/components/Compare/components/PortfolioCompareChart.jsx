import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { ChevronDownIcon } from "../../../icons.jsx"; // Adjust path if needed

const PortfolioCompareChart = ({ chartData, metric, setMetric }) => {
  
  // Dynamic label for the dropdown button
  const getMetricLabel = () => {
    return metric === 'fv' ? 'Change in Fair Value' : 'Change in Cost';
  };

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <section className="compare-chart-section">
      <div className="compare-chart-card">
        <div className="compare-chart-header">
          <span className="compare-chart-title">
             Performance Delta (m€)
          </span>
          
          {/* METRIC DROPDOWN */}
          <div className="quarter-selector-container" style={{ minWidth: 200 }}>
             <div 
                  className={`quarter-selector-button ${isDropdownOpen ? 'active' : ''}`} 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ height: 36 }}
              >
                  <div className="quarter-text-group">
                      <span className="quarter-part">{getMetricLabel()}</span>
                  </div>
                  <div className={`quarter-icon ${isDropdownOpen ? 'open' : ''}`}>
                      <ChevronDownIcon />
                  </div>
              </div>
              
              {isDropdownOpen && (
                  <div className="quarter-dropdown" style={{ minWidth: '100%' }}>
                      <div className="quarter-list">
                          <div 
                              className={`quarter-item ${metric === 'fv' ? 'selected' : ''}`}
                              onClick={() => { setMetric('fv'); setIsDropdownOpen(false); }}
                          >
                              <span className="item-label-bold">Change in Fair Value</span>
                          </div>
                          <div 
                              className={`quarter-item ${metric === 'cost' ? 'selected' : ''}`}
                              onClick={() => { setMetric('cost'); setIsDropdownOpen(false); }}
                          >
                              <span className="item-label-bold">Change in Cost</span>
                          </div>
                      </div>
                  </div>
              )}
          </div>
        </div>

        <div className="compare-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                dy={10} 
                interval={0} // Force all labels to show
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value} m€`, getMetricLabel()]}
              />
              <ReferenceLine y={0} stroke="#E5E7EB" />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value >= 0 ? "#818CF8" : "#EF4444"} // Blue for positive, Red for negative
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

export default PortfolioCompareChart;