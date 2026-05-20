import React, { useEffect } from "react";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useCapTableBackend } from "../../Deals_backend_work";
import "../EventsTab/EventsTab.css";
import "./CapTable.css";

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : parsed.toLocaleString("en-US");
}

function totalShares(entries) {
  return entries.reduce((sum, entry) => (
    sum
    + Number(entry.seriesA || 0)
    + Number(entry.seriesB || 0)
    + Number(entry.common || 0)
    + Number(entry.preferred || 0)
    + Number(entry.seed || 0)
    + Number(entry.esop || 0)
  ), 0);
}

export default function CapTable({ dealId, onSaveStateChange }) {
  const { snapshots, isLoading, error } = useCapTableBackend(dealId);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: null, isDirty: false, isSaving: false });
  }, [onSaveStateChange]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: "error",
      title: "Cap table failed",
      message: error,
    });
  }, [error, showToast]);

  return (
    <div className="deal-subtab-shell">
      <div className="deal-subtab-header">
        <div>
          <h3 className="deal-subtab-title">Cap table</h3>
          <p className="deal-subtab-subtitle">Snapshots and shareholder breakdown for this deal.</p>
        </div>
        <span className="deal-subtab-badge">{snapshots.length} snapshot{snapshots.length === 1 ? "" : "s"}</span>
      </div>

      {isLoading ? (
        <div className="deal-subtab-empty">Loading cap table...</div>
      ) : snapshots.length === 0 ? (
        <div className="deal-subtab-empty">No cap table snapshots available for this deal yet.</div>
      ) : (
        <div className="deal-subtab-list">
          {snapshots.map((snapshot) => (
            <article key={snapshot.id} className="deal-subtab-card">
              <div className="deal-subtab-card-top">
                <div>
                  <h4 className="deal-subtab-card-title">{snapshot.name || "Untitled snapshot"}</h4>
                  <p className="deal-subtab-card-meta">
                    {snapshot.snapshotDate || "-"} • {snapshot.entries.length} holder{snapshot.entries.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="deal-subtab-pill">{displayValue(totalShares(snapshot.entries))} shares</span>
              </div>

              <div className="deal-cap-table-wrap">
                <table className="deal-cap-table">
                  <thead>
                    <tr>
                      <th>Shareholder</th>
                      <th>Series A</th>
                      <th>Series B</th>
                      <th>Common</th>
                      <th>Preferred</th>
                      <th>Seed</th>
                      <th>ESOP</th>
                      <th>FD %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.entries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="deal-cap-table-empty">No entries in this snapshot.</td>
                      </tr>
                    ) : (
                      snapshot.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.shareholderName || "-"}</td>
                          <td>{displayValue(entry.seriesA)}</td>
                          <td>{displayValue(entry.seriesB)}</td>
                          <td>{displayValue(entry.common)}</td>
                          <td>{displayValue(entry.preferred)}</td>
                          <td>{displayValue(entry.seed)}</td>
                          <td>{displayValue(entry.esop)}</td>
                          <td>{displayValue(entry.fullyDilutedPercentage)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}

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
    </div>
  );
}
