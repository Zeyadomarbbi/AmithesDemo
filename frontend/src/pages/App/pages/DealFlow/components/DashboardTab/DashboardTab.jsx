import React, { useState, useRef, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { ChevronDownIcon } from "../../../../../../components/Icons/DirectionIcons";
import { useDashboardData } from "/src/pages/App/hooks/DealFlow/useDashboardData";
import Toast from "../../../../components/Toast/Toast";
import { useToast } from "../../../../components/Toast/useToast";
import "./DashboardTab.css";

function FilterSelect({ placeholder, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`df-filter-btn ${open ? "df-filter-btn--open" : ""}`} ref={ref}>
      <button
        className="df-filter-trigger"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className={value ? "df-filter-value" : "df-filter-placeholder"}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={`df-filter-chevron ${open ? "df-filter-chevron--open" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div className="df-filter-dropdown">
          {value && (
            <div
              className="df-filter-option df-filter-option--clear"
              onMouseDown={() => { onChange(""); setOpen(false); }}
            >
              Clear
            </div>
          )}
          {options.map((option) => (
            <div
              key={option.value}
              className={`df-filter-option ${value === option.value ? "df-filter-option--selected" : ""}`}
              onMouseDown={() => { onChange(option.value); setOpen(false); }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

const DonutCard = ({ title, data }) => (
  <div className="df-card df-donut-card">
    <div className="df-card-title">{title}</div>
    <div className="df-donut-wrapper">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            dataKey="value"
            labelLine={false}
            label={renderDonutLabel}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="df-legend">
      {data.map((item, i) => (
        <div key={i} className="df-legend-item">
          <span className="df-legend-dot" style={{ backgroundColor: item.color }} />
          <span className="df-legend-name">{item.name}</span>
          <span className="df-legend-count">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

function DashboardTab() {
  const [status, setStatus] = useState("");
  const [stage,  setStage]  = useState("");
  const [fund,   setFund]   = useState("");
  const { toast, showToast, closeToast } = useToast();

  const {
    statusOptions,
    stageOptions,
    fundOptions,
    sectorData,
    countryData,
    currencyData,
    barData,
    barTotals,
    fundSeries,
    funnelData,
    isLoading,
    error,
  } =
    useDashboardData({ status, stage, fund });

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        title: "Dashboard failed",
        message: error,
      });
    }
  }, [error, showToast]);

  return (
    <>
      {/* Filters */}
      <div className="df-filters">
        <FilterSelect
          placeholder="Select a status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
        <FilterSelect
          placeholder="Select a stage"
          options={stageOptions}
          value={stage}
          onChange={setStage}
        />
        <FilterSelect
          placeholder="Select a fund"
          options={fundOptions}
          value={fund}
          onChange={setFund}
        />
      </div>

      {/* Breakdown */}
      <div className="df-section-header">
        <span className="df-section-label">Breakdown</span>
        <div className="df-section-line" />
      </div>

      <div className="df-cards-row">
        <DonutCard title="Breakdown by sector"   data={sectorData}   />
        <DonutCard title="Breakdown by country"  data={countryData}  />
        <DonutCard title="Breakdown by currency" data={currencyData} />
      </div>

      {/* Evolution */}
      <div className="df-section-header">
        <span className="df-section-label">Evolution</span>
        <div className="df-section-line" />
      </div>

      <div className="df-evolution-row">

        {/* Bar chart */}
        <div className="df-card df-bar-card">
          <div className="df-card-title">Number of deal</div>
          <span className="df-badge-this-month">{isLoading ? "Loading..." : `${barData.length} months tracked`}</span>

          <div className="df-bar-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="rgba(204,205,206,0.5)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280", fontFamily: "Inter, sans-serif" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Inter, sans-serif" }}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid rgba(204,205,206,0.5)",
                    borderRadius: 4,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                {fundSeries.map((series, index) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    stackId="a"
                    fill={series.color}
                    radius={index === fundSeries.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="df-bar-legend">
            {fundSeries.map((series) => (
              <div key={series.key} className="df-bar-legend-item">
                <span className="df-bar-legend-dot" style={{ backgroundColor: series.color }} />
                <span className="df-bar-legend-name">{series.name}</span>
                <strong className="df-bar-legend-val">{barTotals[series.key] ?? series.total ?? 0}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel chart */}
        <div className="df-card df-funnel-card">
          <div className="df-card-title">Funnel chart stages</div>

          <div className="df-funnel-headers">
            {funnelData.map((d, i) => (
              <div key={i} className="df-funnel-col">
                <span className="df-funnel-stage-label">{d.stage}</span>
                <strong className="df-funnel-stage-value">{d.value}</strong>
              </div>
            ))}
          </div>

          <div className="df-funnel-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={funnelData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="funnelHorizGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#B8D5EC" />
                    <stop offset="60%"  stopColor="#4A7DB5" />
                    <stop offset="100%" stopColor="#1A3860" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="stage" hide />
                <YAxis hide />
                <Area
                  type="linear"
                  dataKey="value"
                  data={funnelData}
                  stroke="none"
                  fill="url(#funnelHorizGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {toast && (
        <Toast
          key={toast.key}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </>
  );
}

export default DashboardTab;
