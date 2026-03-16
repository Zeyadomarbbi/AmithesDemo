import React from "react";
import "./FlowFilters.css";
import SearchBox from "/src/components/SearchBox/SearchBox.jsx";

export default function FlowFilters({
  operationFilter,
  setOperationFilter,
  search,
  setSearch,
  variant = "all", // "all" | "searchOnly" | "chipsOnly"
}) {
  const showSearch = variant !== "chipsOnly";
  const showChips = variant !== "searchOnly";

  const variantClass =
    variant === "searchOnly"
      ? "cf-filters--searchOnly"
      : variant === "chipsOnly"
      ? "cf-filters--chipsOnly"
      : "";

  return (
    <div className={`cf-filters ${variantClass}`.trim()}>
      {/* =========================
          SEARCH BAR
      ========================== */}
      {showSearch && (
        <SearchBox
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by operation..."
        />
      )}

      {/* =========================
          FILTER CHIPS
      ========================== */}
      {showChips && (
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
      )}
    </div>
  );
}
