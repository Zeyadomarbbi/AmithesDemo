import React, { useState, useMemo } from "react";
import "./ProjectedPortfolio.css";

import {
  SortIcon,
  LockOpenIcon,
  LockClosedIcon,
  SensitivityIcon,
} from "../Icons";

import DateInputWithPicker from "../../../../../../../../../../components/DateComponents/DateInput";
import Sensitivity from "../Sensitivity/Sensitivity";

function ProjectedPortfolio({
  rows = [],
  activeMode,
  onChangeRow,
}) {
  const [lockedRows, setLockedRows] = useState([]);
  const [activeSensitivityRowId, setActiveSensitivityRowId] = useState(null);

  const COL_SPAN = 9;

  /* =========================
     Actions
  ========================== */

  const toggleLock = (rowId) => {
    setLockedRows((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  };

  const handleSensitivityClick = (rowId) => {
    setActiveSensitivityRowId((prev) =>
      prev === rowId ? null : rowId
    );
  };

  const handleInputChange = (id, field, value) => {
    onChangeRow?.(id, field, value);
  };

  /* =========================
     Date helpers
  ========================== */

  const formatDateForTable = (dateObj) => {
    if (!dateObj) return "";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}.${month}.${String(year).slice(-2)}`;
  };

  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split(".");
    if (parts.length !== 3) return null;
    let [day, month, year] = parts;
    if (year.length === 2) year = "20" + year;
    return new Date(year, month - 1, day);
  };

  const handleRowDateChange = (rowId, newDate) => {
    handleInputChange(rowId, "exitDate", formatDateForTable(newDate));
  };

  /* =========================
     Summary
  ========================== */

  const summary = useMemo(() => {
    if (!rows.length) {
      return {
        avgDuration: "0 yrs",
        totalCost: "0",
        totalExitVal: "0",
        totalDividends: "0",
        avgIrr: "0.00%",
        avgMoic: "0.00x",
      };
    }

    const parseVal = (v) =>
      parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0;

    const formatNum = (n) =>
      n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    let sum = {
      duration: 0,
      cost: 0,
      exit: 0,
      dividends: 0,
      irr: 0,
      moic: 0,
    };

    rows.forEach((r) => {
      sum.duration += parseVal(r.duration);
      sum.cost += parseVal(r.cost);
      sum.exit += parseVal(r.exit_value);
      sum.dividends += parseVal(r.dividends);
      sum.irr += parseVal(r.irr);
      sum.moic += parseVal(r.moic);
    });

    const count = rows.length;

    return {
      avgDuration: (sum.duration / count).toFixed(1) + " yrs",
      totalCost: formatNum(sum.cost),
      totalExitVal: formatNum(sum.exit),
      totalDividends: formatNum(sum.dividends),
      avgIrr: (sum.irr / count).toFixed(2) + "%",
      avgMoic: (sum.moic / count).toFixed(2) + "x",
    };
  }, [rows]);

  /* =========================
     Render helpers
  ========================== */

  const renderSortableHeader = (text, right = false, showCurrency = false) => (
    <div className={`proj-th-wrap ${right ? "proj-right" : "proj-left"}`}>
      <div className="proj-th-group">
        {text}
        {showCurrency && <span className="proj-currency-indicator">(€)</span>}
        <SortIcon className="proj-sort" />
      </div>
    </div>
  );

  /* =========================
     Render
  ========================== */

  return (
    <div className="portfolio-scenario-section">
      <h3 className="pf-section-title">
        Projected portfolio
        <span className="pf-section-count">{rows.length}</span>
      </h3>

      <div className="proj-table-container no-borders">
        <table className="proj-table content-fit">
          <thead>
            <tr>
              <th>{renderSortableHeader("Deal Name")}</th>
              <th>{renderSortableHeader("Duration")}</th>
              <th className="proj-col-numeric">{renderSortableHeader("Cost", true, true)}</th>
              <th className="proj-col-numeric">{renderSortableHeader("Exit Value", true, true)}</th>
              <th className="proj-col-numeric">{renderSortableHeader("Dividends", true, true)}</th>
              <th className="proj-col-numeric">{renderSortableHeader("IRR", true)}</th>
              <th className="proj-col-numeric">{renderSortableHeader("MOIC", true)}</th>
              <th>{renderSortableHeader("Exit Date")}</th>
              {(activeMode === "target" || activeMode === "sensitivity") && (
                <th className="proj-col-action"></th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, index) => (
              <React.Fragment key={r.id}>
                <tr className={index % 2 === 0 ? "proj-gray" : ""}>
                  <td>
                    <input
                      className="proj-input proj-input-name"
                      value={r.name}
                      onChange={(e) =>
                        handleInputChange(r.id, "name", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      className="proj-input"
                      value={r.duration}
                      onChange={(e) =>
                        handleInputChange(r.id, "duration", e.target.value)
                      }
                    />
                  </td>

                  <td className="proj-right">
                    <input
                      className="proj-input"
                      value={r.cost}
                      onChange={(e) =>
                        handleInputChange(r.id, "cost", e.target.value)
                      }
                    />
                  </td>

                  <td className="proj-right">
                    <input
                      className="proj-input"
                      value={r.exit_value}
                      onChange={(e) =>
                        handleInputChange(r.id, "exit_value", e.target.value)
                      }
                    />
                  </td>

                  <td className="proj-right">
                    <input
                      className="proj-input"
                      value={r.dividends}
                      onChange={(e) =>
                        handleInputChange(r.id, "dividends", e.target.value)
                      }
                    />
                  </td>

                  <td className="proj-right">
                    <input
                      className="proj-input"
                      value={r.irr}
                      onChange={(e) =>
                        handleInputChange(r.id, "irr", e.target.value)
                      }
                    />
                  </td>

                  <td className="proj-right">
                    <input
                      className="proj-input"
                      value={r.moic}
                      onChange={(e) =>
                        handleInputChange(r.id, "moic", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <DateInputWithPicker
                      initialDate={parseDateString(r.exitDate)}
                      onDateChange={(d) => handleRowDateChange(r.id, d)}
                      isSingle
                    />
                  </td>

                  {activeMode === "target" && (
                    <td className="proj-center">
                      <button
                        className={`action-icon-btn ${
                          lockedRows.includes(r.id) ? "locked" : ""
                        }`}
                        onClick={() => toggleLock(r.id)}
                      >
                        {lockedRows.includes(r.id) ? (
                          <LockClosedIcon />
                        ) : (
                          <LockOpenIcon />
                        )}
                      </button>
                    </td>
                  )}

                  {activeMode === "sensitivity" && (
                    <td className="proj-center">
                      <button
                        className="action-icon-btn sensitivity"
                        onClick={() => handleSensitivityClick(r.id)}
                      >
                        <SensitivityIcon />
                      </button>
                    </td>
                  )}
                </tr>

                {activeMode === "sensitivity" &&
                  activeSensitivityRowId === r.id && (
                    <tr>
                      <td colSpan={COL_SPAN}>
                        <Sensitivity rowData={r} />
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))}

            <tr className="proj-summary-row">
              <td>Total</td>
              <td className="proj-right">{summary.avgDuration}</td>
              <td className="proj-right">{summary.totalCost}</td>
              <td className="proj-right">{summary.totalExitVal}</td>
              <td className="proj-right">{summary.totalDividends}</td>
              <td className="proj-right">{summary.avgIrr}</td>
              <td className="proj-right">{summary.avgMoic}</td>
              <td>-</td>
              {(activeMode === "target" || activeMode === "sensitivity") && <td />}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectedPortfolio;
