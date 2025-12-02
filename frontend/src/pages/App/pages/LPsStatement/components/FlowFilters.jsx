import React from "react";
import "./FlowFilters.css";

export default function FlowFilters({
  operationFilter,
  setOperationFilter,
  search,
  setSearch,
}) {
  return (
    <div className="cf-filters">
      {/* Search */}
      <input
        type="text"
        className="cf-search"
        placeholder="Search by operation..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filter chips */}
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
