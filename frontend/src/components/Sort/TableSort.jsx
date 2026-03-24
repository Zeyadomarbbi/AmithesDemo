// TableSort.jsx
import React from "react";
import { SortIcon } from "../Icons/InteractiveIcons";
import "./TableSort.css";

export function useTableSort(data, initialSortKey = "name") {
  const [sortKey, setSortKey] = React.useState(initialSortKey);
  const [sortDir, setSortDir] = React.useState("asc");
  const getVal = (obj, key) => {
    if (!key) return undefined;
    return key.split(".").reduce((o, k) => o?.[k], obj);
  };

  const sorted = React.useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const va = getVal(a, sortKey);
      const vb = getVal(b, sortKey);

      if (va == null) return 1;
      if (vb == null) return -1;

      if (typeof va === "string") {
        const res = va.localeCompare(vb);
        return sortDir === "asc" ? res : -res;
      }
      const res = va - vb;
      return sortDir === "asc" ? res : -res;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return { sorted, sortKey, sortDir, toggleSort };
}

export function SortableHeaderRenderer({ label, columnKey, currentSortKey, toggleSort, center = true, showCurrency = true, showSortIcon = true }) {
    const isActive = currentSortKey === columnKey;

    return (
        <div className={`sort-header-wrap ${center ? "sort-header-center" : "sort-header-left"}`} onClick={() => toggleSort(columnKey)}>
            <div className="sort-header-group">
                {label}
                {showCurrency && <span className="sort-currency-indicator">(€)</span>}
                {showSortIcon && <SortIcon active={isActive} />}
            </div>
        </div>
    );
}