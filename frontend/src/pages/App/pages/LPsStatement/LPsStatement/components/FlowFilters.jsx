import React from "react";
import "./FlowFilters.css";

/* 🔍 Search icon – Figma SVG */
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_21781_20960)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.33301 2.66732C4.75568 2.66732 2.66634 4.75666 2.66634 7.33398C2.66634 9.91131 4.75568 12.0007 7.33301 12.0007C8.5903 12.0007 9.73147 11.5034 10.5706 10.6949C10.5881 10.6721 10.6074 10.6501 10.6283 10.6292C10.6492 10.6083 10.6711 10.5891 10.6939 10.5716C11.5025 9.73245 11.9997 8.59128 11.9997 7.33398C11.9997 4.75666 9.91034 2.66732 7.33301 2.66732ZM12.0209 11.0791C12.842 10.0527 13.333 8.75066 13.333 7.33398C13.333 4.02028 10.6467 1.33398 7.33301 1.33398C4.0193 1.33398 1.33301 4.02028 1.33301 7.33398C1.33301 10.6477 4.0193 13.334 7.33301 13.334C8.74968 13.334 10.0517 12.843 11.0781 12.0219L13.5283 14.4721C13.7886 14.7324 14.2107 14.7324 14.4711 14.4721C14.7314 14.2117 14.7314 13.7896 14.4711 13.5292L12.0209 11.0791Z"
        fill="#375A89"
      />
    </g>
    <defs>
      <clipPath id="clip0_21781_20960">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default function FlowFilters({
  operationFilter,
  setOperationFilter,
  search,
  setSearch,
}) {
  return (
    <div className="cf-filters">
      {/* =========================
          SEARCH BAR + ICON
      ========================== */}
      <div className="cf-search-wrapper">
        <span className="cf-search-icon">
          <SearchIcon />
        </span>

        <input
          type="text"
          className="cf-search"
          placeholder="Search by operation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* =========================
          FILTER CHIPS
      ========================== */}
      <div className="cf-filter-chips">
        <button
          className={
            operationFilter === "All operations"
              ? "cf-filter-chip cf-filter-chip--active"
              : "cf-filter-chip"
          }
          onClick={() => setOperationFilter("All operations")}
        >
          All operations
        </button>

        <button
          className={
            operationFilter === "Capital call"
              ? "cf-filter-chip cf-filter-chip--active"
              : "cf-filter-chip"
          }
          onClick={() => setOperationFilter("Capital call")}
        >
          Capital call
        </button>

        <button
          className={
            operationFilter === "Distribution"
              ? "cf-filter-chip cf-filter-chip--active"
              : "cf-filter-chip"
          }
          onClick={() => setOperationFilter("Distribution")}
        >
          Distribution
        </button>
      </div>
    </div>
  );
}
