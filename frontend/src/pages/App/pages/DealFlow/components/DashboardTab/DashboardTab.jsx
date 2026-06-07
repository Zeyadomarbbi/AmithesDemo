
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldData from "world-atlas/countries-110m.json";
import { ChevronDownIcon } from "../../../../../../components/Icons/DirectionIcons";
import { useDashboardData } from "/src/pages/App/hooks/DealFlow/useDashboardData";
import Toast from "../../../../components/Toast/Toast";
import { useToast } from "../../../../components/Toast/useToast";
import "./DashboardTab.css";

const ISO2_META = {
  // Europe
  AT: { coords: [16.37, 48.21], region: "Europe" },
  BE: { coords: [4.35, 50.85], region: "Europe" },
  BG: { coords: [23.32, 42.70], region: "Europe" },
  CH: { coords: [7.45, 46.95], region: "Europe" },
  CZ: { coords: [14.47, 50.08], region: "Europe" },
  DE: { coords: [13.40, 52.52], region: "Europe" },
  DK: { coords: [12.57, 55.68], region: "Europe" },
  ES: { coords: [-3.70, 40.42], region: "Europe" },
  FI: { coords: [24.94, 60.17], region: "Europe" },
  FR: { coords: [2.35,  48.86], region: "Europe" },
  GB: { coords: [-0.13, 51.51], region: "Europe" },
  GR: { coords: [23.73, 37.97], region: "Europe" },
  HR: { coords: [15.97, 45.81], region: "Europe" },
  HU: { coords: [19.04, 47.50], region: "Europe" },
  IE: { coords: [-6.27, 53.33], region: "Europe" },
  IT: { coords: [12.49, 41.90], region: "Europe" },
  LU: { coords: [6.13,  49.61], region: "Europe" },
  NL: { coords: [4.90,  52.37], region: "Europe" },
  NO: { coords: [10.75, 59.91], region: "Europe" },
  PL: { coords: [21.01, 52.23], region: "Europe" },
  PT: { coords: [-9.14, 38.72], region: "Europe" },
  RO: { coords: [26.10, 44.44], region: "Europe" },
  RS: { coords: [20.46, 44.80], region: "Europe" },
  SE: { coords: [18.07, 59.33], region: "Europe" },
  SI: { coords: [14.51, 46.05], region: "Europe" },
  SK: { coords: [17.11, 48.15], region: "Europe" },
  TR: { coords: [32.86, 39.93], region: "Europe" },
  UA: { coords: [30.52, 50.45], region: "Europe" },
  // MENA
  AE: { coords: [54.37, 24.47], region: "MENA" },
  BH: { coords: [50.56, 26.21], region: "MENA" },
  DZ: { coords: [3.05,  36.74], region: "MENA" },
  EG: { coords: [31.25, 30.06], region: "MENA" },
  IL: { coords: [35.22, 31.78], region: "MENA" },
  IQ: { coords: [44.39, 33.34], region: "MENA" },
  JO: { coords: [35.93, 31.95], region: "MENA" },
  KW: { coords: [47.99, 29.37], region: "MENA" },
  LB: { coords: [35.50, 33.89], region: "MENA" },
  LY: { coords: [13.19, 32.90], region: "MENA" },
  MA: { coords: [-6.85, 33.99], region: "MENA" },
  OM: { coords: [58.59, 23.59], region: "MENA" },
  QA: { coords: [51.53, 25.29], region: "MENA" },
  SA: { coords: [46.67, 24.69], region: "MENA" },
  TN: { coords: [10.18, 36.82], region: "MENA" },
  // Africa
  AO: { coords: [13.24, -8.84],  region: "Africa" },
  CI: { coords: [-5.55,  7.54],  region: "Africa" },
  CM: { coords: [11.52,  3.87],  region: "Africa" },
  ET: { coords: [38.70,  9.03],  region: "Africa" },
  GA: { coords: [11.52, -0.78],  region: "Africa" },
  GH: { coords: [-0.22,  5.56],  region: "Africa" },
  KE: { coords: [36.82, -1.29],  region: "Africa" },
  MG: { coords: [47.52, -18.91], region: "Africa" },
  MZ: { coords: [35.53, -18.67], region: "Africa" },
  NG: { coords: [8.68,   9.08],  region: "Africa" },
  RW: { coords: [29.87, -1.94],  region: "Africa" },
  SN: { coords: [-14.45, 14.70], region: "Africa" },
  TZ: { coords: [35.74, -6.17],  region: "Africa" },
  UG: { coords: [32.58,  0.32],  region: "Africa" },
  ZA: { coords: [28.05, -26.20], region: "Africa" },
  ZM: { coords: [28.28, -15.42], region: "Africa" },
  ZW: { coords: [29.15, -19.02], region: "Africa" },
};

const NAME_TO_ISO2 = {
  // Europe
  "France": "FR", "Spain": "ES", "Germany": "DE", "United Kingdom": "GB",
  "UK": "GB", "Italy": "IT", "Netherlands": "NL", "Belgium": "BE",
  "Switzerland": "CH", "Sweden": "SE", "Norway": "NO", "Denmark": "DK",
  "Finland": "FI", "Austria": "AT", "Poland": "PL", "Portugal": "PT",
  "Greece": "GR", "Luxembourg": "LU", "Ireland": "IE", "Romania": "RO",
  "Hungary": "HU", "Czech Republic": "CZ", "Czechia": "CZ",
  "Slovakia": "SK", "Croatia": "HR", "Slovenia": "SI", "Serbia": "RS",
  "Bulgaria": "BG", "Ukraine": "UA", "Turkey": "TR",
  // MENA
  "Morocco": "MA", "Tunisia": "TN", "Algeria": "DZ", "Libya": "LY",
  "Egypt": "EG", "UAE": "AE", "United Arab Emirates": "AE",
  "Saudi Arabia": "SA", "Jordan": "JO", "Lebanon": "LB",
  "Israel": "IL", "Iraq": "IQ", "Kuwait": "KW", "Qatar": "QA",
  "Bahrain": "BH", "Oman": "OM",
  // Africa
  "Nigeria": "NG", "South Africa": "ZA", "Kenya": "KE", "Ghana": "GH",
  "Ivory Coast": "CI", "Côte d'Ivoire": "CI", "Senegal": "SN",
  "Gabon": "GA", "Angola": "AO", "Tanzania": "TZ", "Uganda": "UG",
  "Ethiopia": "ET", "Cameroon": "CM", "Rwanda": "RW",
  "Zambia": "ZM", "Zimbabwe": "ZW", "Mozambique": "MZ", "Madagascar": "MG",
};

const REGION_ORDER = ["Europe", "MENA", "Africa"];

const REGION_COLORS = {
  Europe: "#f7a93b",
  MENA:   "#2E6BB0",
  Africa: "#1A3860",
};

// ─── Shared pie helpers ───────────────────────────────────────────────────────

const renderExpandedSlice = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 9}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="df-pie-tooltip">
      <p className="df-pie-tooltip-name">{name}</p>
      <p className="df-pie-tooltip-value">
        <span className="df-pie-tooltip-dot" style={{ backgroundColor: p.color }} />
        {value}
      </p>
    </div>
  );
};

// ─── FilterSelect ────────────────────────────────────────────────────────────

function FilterSelect({ placeholder, options, value, onChange, multi = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // multi: value is string[], single: value is string
  const selected = multi ? (Array.isArray(value) ? value : []) : value;

  const displayLabel = multi
    ? selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} selected`
    : (options.find((o) => o.value === selected)?.label ?? placeholder);

  const hasValue = multi ? selected.length > 0 : !!selected;

  const isSelected = (v) => multi ? selected.includes(v) : selected === v;

  const handleSelect = (v) => {
    if (multi) {
      onChange(isSelected(v) ? selected.filter((x) => x !== v) : [...selected, v]);
      // keep dropdown open for multi
    } else {
      onChange(v);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange(multi ? [] : "");
    if (!multi) setOpen(false);
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`df-filter-btn ${open ? "df-filter-btn--open" : ""}`} ref={ref}>
      <button className="df-filter-trigger" onClick={() => setOpen((o) => !o)} type="button">
        <span className={hasValue ? "df-filter-value" : "df-filter-placeholder"}>
          {displayLabel}
        </span>
        <span className={`df-filter-chevron ${open ? "df-filter-chevron--open" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div className="df-filter-dropdown">
          {hasValue && (
            <div className="df-filter-option df-filter-option--clear" onMouseDown={handleClear}>
              Clear
            </div>
          )}
          {options.map((option) => (
            <div
              key={option.value}
              className={`df-filter-option ${isSelected(option.value) ? "df-filter-option--selected" : ""}`}
              onMouseDown={() => handleSelect(option.value)}
            >
              {multi && (
                <span className="df-filter-check">
                  {isSelected(option.value) ? "✓" : ""}
                </span>
              )}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DonutCard ───────────────────────────────────────────────────────────────

const DonutCard = ({ title, data }) => {
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <div className="df-card df-donut-card">
      <div className="df-card-title">{title}</div>
      <div className="df-donut-wrapper">
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={28} outerRadius={80}
              dataKey="value"
              labelLine={false}
              startAngle={90} endAngle={-270}
              activeIndex={activeIdx ?? -1}
              activeShape={renderExpandedSlice}
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  opacity={activeIdx === null || activeIdx === i ? 1 : 0.3}
                  style={{ transition: "opacity 0.18s ease", cursor: "pointer" }}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="df-legend">
        {data.map((item, i) => (
          <div
            key={i}
            className="df-legend-item"
            style={{
              opacity: activeIdx === null || activeIdx === i ? 1 : 0.35,
              transition: "opacity 0.18s ease",
              cursor: "pointer",
            }}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <span
              className="df-legend-dot"
              style={{
                backgroundColor: item.color,
                transform: activeIdx === i ? "scale(1.45)" : "scale(1)",
                transition: "transform 0.18s ease",
              }}
            />
            <span
              className="df-legend-name"
              style={{ fontWeight: activeIdx === i ? 600 : 400, transition: "font-weight 0.1s" }}
            >
              {item.name}
            </span>
            <span className="df-legend-count">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SectorPieCard (scrollable legend) ───────────────────────────────────────

const SectorPieCard = ({ title, data }) => {
  const [activeIdx, setActiveIdx] = useState(null);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  return (
    <div className="df-card df-sector-card">
      <div className="df-card-title">{title}</div>
      <div className="df-sector-body">
        <div className="df-sector-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={28} outerRadius={82}
                dataKey="value"
                labelLine={false}
                startAngle={90} endAngle={-270}
                activeIndex={activeIdx ?? -1}
                activeShape={renderExpandedSlice}
                onMouseEnter={(_, i) => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    opacity={activeIdx === null || activeIdx === i ? 1 : 0.3}
                    style={{ transition: "opacity 0.18s ease", cursor: "pointer" }}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="df-sector-legend">
          {data.map((item, i) => (
            <div
              key={i}
              className="df-sector-legend-item"
              style={{
                opacity: activeIdx === null || activeIdx === i ? 1 : 0.35,
                transition: "opacity 0.18s ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              <span
                className="df-sector-legend-swatch"
                style={{
                  backgroundColor: item.color,
                  transform: activeIdx === i ? "scale(1.3)" : "scale(1)",
                  transition: "transform 0.18s ease",
                }}
              />
              <div className="df-sector-legend-text">
                <span
                  className="df-sector-legend-name"
                  style={{ fontWeight: activeIdx === i ? 600 : 500 }}
                >
                  {item.name}
                </span>
                <span className="df-sector-legend-pct">
                  {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── GeographyCard ───────────────────────────────────────────────────────────

const GeographyCard = ({ data }) => {
  const [scale, setScale] = useState(380);

  const enriched = useMemo(() => {
    return data
      .map((d) => {
        const iso2 = (d.iso2 || NAME_TO_ISO2[d.name] || "").toUpperCase();
        const meta = iso2 ? ISO2_META[iso2] : null;
        if (!meta) return null;
        return { ...d, iso2, coords: meta.coords, region: meta.region };
      })
      .filter(Boolean);
  }, [data]);

  const grouped = useMemo(() => {
    const groups = {};
    enriched.forEach((d) => {
      if (!groups[d.region]) groups[d.region] = [];
      groups[d.region].push(d);
    });
    Object.keys(groups).forEach((r) => groups[r].sort((a, b) => b.value - a.value));
    return groups;
  }, [enriched]);

  return (
    <div className="df-card df-geo-card">
      <div className="df-card-title">Geography of Deals</div>
      <div className="df-geo-body">
        <div className="df-geo-map">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale, center: [22, 15] }}
            width={800}
            height={520}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={worldData}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#D6E4F0"
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            {enriched.map((d) => (
              <Marker key={d.iso2} coordinates={d.coords}>
                <circle
                  r={Math.max(4, Math.min(8, 3 + Math.log(d.value + 1)))}
                  fill={REGION_COLORS[d.region] || "#1A3860"}
                />
              </Marker>
            ))}
          </ComposableMap>
          <div className="df-geo-zoom-btns">
            <button onClick={() => setScale((s) => Math.min(900, Math.round(s * 1.5)))}>+</button>
            <button onClick={() => setScale((s) => Math.max(150, Math.round(s / 1.5)))}>−</button>
          </div>
        </div>
        <div className="df-geo-legend">
          {REGION_ORDER.filter((r) => grouped[r]).map((region) => (
            <div key={region} className="df-geo-region">
              <div className="df-geo-region-header">
                <span className="df-geo-region-dot" style={{ backgroundColor: REGION_COLORS[region] }} />
                <span className="df-geo-region-name">{region}</span>
              </div>
              {grouped[region].map((d, i) => (
                <div key={i} className="df-geo-legend-item">
                  <span className="df-geo-legend-country">{d.name}</span>
                  <strong className="df-geo-legend-count">{d.value}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── FunnelCard ──────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#1c3a5e",
  "#4a72a8",
  "#254a7b",
  "#8aaacf",
  "#375a89",
  "#aac3e0",
  "#2d5896",
  "#c5d8ed",
  "#6b8fbd",
  "#5b84ba",
];

function applyAmethisColors(data) {
  return data.map((item, i) => ({ ...item, color: PIE_COLORS[i % PIE_COLORS.length] }));
}

const FUNNEL_COLORS = [
  "#1c3a5e",
  "#254a7b",
  "#2d5896",
  "#375a89",
  "#4a72a8",
  "#6b8fbd",
  "#8aaacf",
  "#aac3e0",
];

const FunnelCard = ({ data }) => {
  const sortedByOrder = useMemo(
    () => data.slice().sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity)),
    [data]
  );

  const colorMap = useMemo(() => {
    const map = {};
    sortedByOrder.forEach((item, i) => {
      map[item.id ?? item.stage] = FUNNEL_COLORS[i % FUNNEL_COLORS.length];
    });
    return map;
  }, [sortedByOrder]);

  const chartData = useMemo(
    () =>
      data
        .slice()
        .sort((a, b) => b.value - a.value)
        .map((d) => ({
          value: d.value,
          name: d.stage,
          fill: colorMap[d.id ?? d.stage] || FUNNEL_COLORS[0],
        })),
    [data, colorMap]
  );

  return (
    <div className="df-card df-funnel-card">
      <div className="df-card-title">Deal Flow Funnel</div>
      <div className="df-funnel-body">
        <div className="df-funnel-chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  border: "1px solid rgba(204,205,206,0.5)",
                  borderRadius: 4,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                }}
                formatter={(value, name) => [value, name]}
              />
              <Funnel dataKey="value" data={chartData} isAnimationActive={false} />
            </FunnelChart>
          </ResponsiveContainer>
        </div>
        <div className="df-funnel-legend">
          {sortedByOrder.map((item, i) => (
            <div key={item.id ?? i} className="df-funnel-legend-item">
              <span
                className="df-funnel-legend-dot"
                style={{ backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}
              />
              <span className="df-funnel-legend-name">{item.stage}</span>
              <strong className="df-funnel-legend-count">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── DashboardTab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const [stages, setStages] = useState([]);
  const [fund,   setFund]   = useState("");
  const { toast, showToast, closeToast } = useToast();

  const {
    stageOptions,
    fundOptions,
    sectorData,
    countryData,
    barData,
    fundSeries,
    funnelData,
    isLoading,
    error,
  } = useDashboardData({ stages, fund });

  useEffect(() => {
    if (error) showToast({ type: "error", title: "Dashboard failed", message: error });
  }, [error, showToast]);

  const monthlyTotalData = useMemo(
    () => barData.map((row) => ({
      month: row.month,
      total: fundSeries.reduce((sum, s) => sum + (row[s.key] || 0), 0),
    })),
    [barData, fundSeries]
  );

  const stageDonutData = useMemo(
    () => applyAmethisColors(
      funnelData
        .slice()
        .sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity))
        .map((d) => ({ name: d.stage, value: d.value }))
    ),
    [funnelData]
  );

  const sectorDonutData = useMemo(() => applyAmethisColors(sectorData), [sectorData]);

  return (
    <>
      {/* Filters */}
      <div className="df-filters">
        <FilterSelect placeholder="Select a stage" options={stageOptions} value={stages} onChange={setStages} multi />
        <FilterSelect placeholder="Select a fund"  options={fundOptions}  value={fund}   onChange={setFund}        />
      </div>

      {/* ── BREAKDOWN ── */}
      <div className="df-section-header">
        <span className="df-section-label">Breakdown</span>
        <div className="df-section-line" />
      </div>

      <div className="df-cards-row">
        <SectorPieCard title="Deals per Sector" data={sectorDonutData} />
        <DonutCard     title="Deals per Stage"  data={stageDonutData}  />
      </div>

      <GeographyCard data={countryData} />

      {/* ── EVOLUTION ── */}
      <div className="df-section-header">
        <span className="df-section-label">Evolution</span>
        <div className="df-section-line" />
      </div>

      <div className="df-evolution-row">

        {/* Histogram — non-cumulative total deals per month */}
        <div className="df-card df-bar-card">
          <div className="df-card-title">Evolution of Number of Deals</div>
          <span className="df-badge-this-month">
            {isLoading ? "Loading..." : `${monthlyTotalData.length} months tracked`}
          </span>
          <div className="df-bar-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTotalData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(204,205,206,0.5)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280", fontFamily: "Inter, sans-serif" }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Inter, sans-serif" }} />
                <Tooltip
                  contentStyle={{ border: "1px solid rgba(204,205,206,0.5)", borderRadius: 4, fontFamily: "Inter, sans-serif", fontSize: 12 }}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar dataKey="total" fill="#f7a93b" radius={[4, 4, 0, 0]} name="Number of Deals" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deal Flow Funnel */}
        <FunnelCard data={funnelData} />
1
      </div>

      {toast && (
        <Toast key={toast.key} title={toast.title} message={toast.message}
          type={toast.type} duration={toast.duration} onClose={closeToast} />
      )}
    </>
  );
}

export default DashboardTab;
