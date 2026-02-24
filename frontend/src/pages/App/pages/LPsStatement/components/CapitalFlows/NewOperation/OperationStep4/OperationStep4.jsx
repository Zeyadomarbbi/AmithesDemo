// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationStep4.jsx
import React, { useState } from "react";
import "./OperationStep4.css";

function fmtMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  const pct = Math.abs(num) <= 1 ? num * 100 : num;
  return `${pct.toFixed(2)}%`;
}

function initialsFromName(name = "") {
  return String(name).trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "LP";
}

/* ------------------------------------------------------------------
   TEMPLATE LIST (static — template linking is future scope)
-------------------------------------------------------------------*/
const TEMPLATE_ROWS = [
  { id: 1, name: "Template CCC", description: "Description courte", tags: ["OR", "HR", "MT", "JZ", "OF +5"] },
  { id: 2, name: "Template AAA", description: "Class A1",            tags: ["OR", "HR", "MT", "JZ", "OF +5"] },
  { id: 3, name: "Template BBB", description: "Class B",             tags: ["OR", "HR", "MT", "JZ", "OF +5"] },
  { id: 4, name: "Template BBB", description: "Class B",             tags: ["OR", "HR", "MT", "JZ", "OF +5"] },
];

/* ---------- DOC + PDF SMALL ICONS FOR ACTION COLUMN ---------- */
const DocFileIcon = () => (
  <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.07031 0.75H15.0098L20.3203 6.06055V16C20.3203 17.7949 18.8652 19.25 17.0703 19.25H9.07031C7.27539 19.25 5.82031 17.7949 5.82031 16V4C5.82031 2.20507 7.27539 0.75 9.07031 0.75Z"
      stroke="#D0D5DD" strokeWidth="1.5"
    />
    <path
      d="M15.0703 0.25V2C15.0703 4.20914 16.8612 6 19.0703 6H20.8203"
      stroke="#D0D5DD" strokeWidth="1.5"
    />
    <rect y="7.26562" width="18.64" height="7.77144" rx="1.3549" fill="#155EEF" />
  </svg>
);

const PdfFileIcon = () => (
  <span className="op4-file-badge-pdf">PDF</span>
);

/* ---------- EXTRACT ICON ---------- */
const ExtractIcon = () => (
  <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.83913 2.87528e-07L7.33333 6.05419e-07C7.51015 6.05419e-07 7.67971 0.0702385 7.80474 0.195263L11.8047 4.19526C11.9298 4.32029 12 4.48986 12 4.66667V10.8276C12 11.3642 12 11.8071 11.9705 12.1679C11.9399 12.5426 11.8742 12.8871 11.7094 13.2106C11.4537 13.7124 11.0457 14.1204 10.544 14.376C10.2204 14.5409 9.87595 14.6066 9.50122 14.6372C9.14042 14.6667 8.69752 14.6667 8.16088 14.6667H3.83912C3.30248 14.6667 2.85958 14.6667 2.49878 14.6372C2.12405 14.6066 1.77958 14.5409 1.45603 14.376C0.95426 14.1204 0.546312 13.7124 0.29065 13.2106C0.125789 12.8871 0.0600798 12.5426 0.029463 12.1679C-1.52091e-05 11.8071 -8.21607e-06 11.3642 2.87528e-07 10.8275V3.83913C-8.21607e-06 3.30249 -1.52091e-05 2.85958 0.029463 2.49878C0.0600798 2.12405 0.125789 1.77958 0.29065 1.45603C0.546312 0.95426 0.95426 0.546312 1.45603 0.29065C1.77958 0.125789 2.12405 0.0600798 2.49878 0.029463C2.85958 -1.52091e-05 3.30249 -8.21607e-06 3.83913 2.87528e-07ZM2.60736 1.35837C2.31508 1.38225 2.16561 1.42553 2.06135 1.47866C1.81046 1.60649 1.60649 1.81046 1.47866 2.06135C1.42553 2.16561 1.38225 2.31508 1.35837 2.60736C1.33385 2.90742 1.33333 3.29561 1.33333 3.86667V10.8C1.33333 11.3711 1.33385 11.7592 1.35837 12.0593C1.38225 12.3516 1.42553 12.5011 1.47866 12.6053C1.60649 12.8562 1.81046 13.0602 2.06135 13.188C2.16561 13.2411 2.31508 13.2844 2.60736 13.3083C2.90742 13.3328 3.29561 13.3333 3.86667 13.3333H8.13333C8.70439 13.3333 9.09258 13.3328 9.39264 13.3083C9.68492 13.2844 9.83439 13.2411 9.93865 13.188C10.1895 13.0602 10.3935 12.8562 10.5213 12.6053C10.5745 12.5011 10.6178 12.3516 10.6416 12.0593C10.6661 11.7592 10.6667 11.3711 10.6667 10.8V5.33338L8.37874 5.33338C8.21048 5.3334 8.04662 5.33342 7.90785 5.32208C7.75545 5.30963 7.57563 5.28026 7.39468 5.18806C7.1438 5.06023 6.93982 4.85625 6.81199 4.60537C6.71979 4.42442 6.69042 4.2446 6.67796 4.0922C6.66663 3.95343 6.66665 3.78956 6.66667 3.6213L6.66667 1.33333H3.86667C3.29561 1.33333 2.90742 1.33385 2.60736 1.35837ZM8 2.27614L9.72391 4.00005H8.4C8.20232 4.00005 8.09415 3.99953 8.01642 3.99318C8.01333 3.99293 8.0104 3.99267 8.00763 3.99242C8.00738 3.98965 8.00712 3.98672 8.00687 3.98363C8.00052 3.9059 8 3.79773 8 3.60005V2.27614ZM6 6.66667C6.36819 6.66667 6.66667 6.96515 6.66667 7.33333L6.66667 9.72386L7.5286 8.86193C7.78895 8.60158 8.21106 8.60158 8.47141 8.86193C8.73176 9.12228 8.73176 9.54439 8.47141 9.80474L6.47141 11.8047C6.34638 11.9298 6.17681 12 6 12C5.82319 12 5.65362 11.9298 5.5286 11.8047L3.5286 9.80474C3.26825 9.54439 3.26825 9.12228 3.5286 8.86193C3.78895 8.60158 4.21106 8.60158 4.47141 8.86193L5.33333 9.72386L5.33333 7.33333C5.33333 6.96514 5.63181 6.66667 6 6.66667Z"
      fill="#375A89"
    />
  </svg>
);

/* ------------------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------------------*/
export default function OperationStep4({
  operationName = "",
  operationTypeName = "",
  noticeDate = null,
  dueDate = null,
  totalFundCommitment = 0,
  step2Result = {},
  lps = [],
  isSaving = false,
  saveError = null,
}) {
  const [activeTab, setActiveTab] = useState("lps");

  // ── Build LP name lookup ──────────────────────────────────────────────────
  const lpNameById = {};
  (Array.isArray(lps) ? lps : []).forEach((lp) => {
    const id = String(lp?.lp_id ?? lp?.id ?? "");
    if (id) lpNameById[id] = lp?.name ?? lp?.fullName ?? null;
  });

  // ── Build real LP rows from step2Result.perLp ─────────────────────────────
  const lpRows = Object.entries(step2Result?.perLp || {}).map(([lpId, lpData]) => {
    const name = lpNameById[lpId] ?? `LP ${lpId}`;
    return {
      id: lpId,
      initials: initialsFromName(name),
      name,
      shareClass: lpData?.shareClassId ? `Class ${lpData.shareClassId}` : "—",
      calledAmount: fmtMoney(lpData?.mainAmount ?? 0),
      calledPct: fmtPct(lpData?.calledPct ?? 0),
      sharesIssued: lpData?.sharesIssued != null
        ? Number(lpData.sharesIssued).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
        : "—",
      selected: true,
      isLinkOnly: true,
      templateLabel: "Link template",
      linkedIcons: ["doc", "pdf"],
    };
  });

  const grandTotal = fmtMoney(step2Result?.total_operation_amount ?? 0);

  const handleUploadClick = () => {
    document.getElementById("op4-upload-input")?.click();
  };

  return (
    <div className="op4-wrapper">
      {/* hidden file input */}
      <input id="op4-upload-input" type="file" style={{ display: "none" }} />

      {/* ── Save status messages ──────────────────────────────────────────── */}
      {saveError?.message && (
        <div style={{ margin: "8px 0", color: "#b42318", fontSize: 12 }}>
          {saveError.message}
        </div>
      )}
      {isSaving && (
        <div style={{ margin: "8px 0", color: "#667085", fontSize: 12 }}>
          Saving operation…
        </div>
      )}

      {/* ================== TOP RIGHT TOGGLE ================== */}
      <div className="op4-top-row">
        <div className="op4-top-right">
          <div className="op4-toggle-group">
            <button
              type="button"
              className={"op4-toggle-btn" + (activeTab === "lps" ? " op4-toggle-btn--active" : "")}
              onClick={() => setActiveTab("lps")}
            >
              LPs List
            </button>
            <button
              type="button"
              className={"op4-toggle-btn" + (activeTab === "template" ? " op4-toggle-btn--active" : "")}
              onClick={() => setActiveTab("template")}
            >
              Template
            </button>
          </div>

          {activeTab === "template" && (
            <button className="op4-upload-btn" type="button" onClick={handleUploadClick}>
              <span className="op4-upload-icon" aria-hidden="true">↑</span>
              Upload new template
            </button>
          )}
        </div>
      </div>

      {/* ================== CONTENT BY TAB ================== */}
      {activeTab === "lps" ? (
        /* ---------- LPs LIST TABLE ---------- */
        <div className="op4-table-wrapper">
          <div className="op4-table">
            {/* header row */}
            <div className="op4-row op4-row-header">
              <div className="op4-cell op4-cell-check">
                <input type="checkbox" />
              </div>
              <div className="op4-cell op4-cell-lp">
                <span className="op4-header-text">LPs</span>
              </div>
              <div className="op4-cell op4-cell-share-class">
                <span className="op4-header-text">Share Class</span>
                <span className="op4-sort-icon">◇</span>
              </div>
              <div className="op4-cell op4-cell-called">
                <span className="op4-header-text">Called Amount (€)</span>
                <span className="op4-sort-icon">◇</span>
              </div>
              <div className="op4-cell op4-cell-linked">
                <span className="op4-header-text">Linked to</span>
              </div>
              <div className="op4-cell op4-cell-action">
                <span className="op4-header-text">Action</span>
              </div>
            </div>

            {/* body rows — real data from step2Result */}
            {lpRows.length === 0 && (
              <div style={{ padding: "16px", color: "#667085", fontSize: 13 }}>
                No LP data available.
              </div>
            )}

            {lpRows.map((row) => (
              <div
                key={row.id}
                className={"op4-row op4-row-body" + (row.selected ? " op4-row-selected" : "")}
              >
                <div className="op4-cell op4-cell-check">
                  <input type="checkbox" defaultChecked={row.selected} />
                </div>
                <div className="op4-cell op4-cell-lp">
                  <div className="op4-lp-pill">{row.initials}</div>
                  <button className="op4-lp-name" type="button">{row.name}</button>
                </div>
                <div className="op4-cell op4-cell-share-class">
                  <span className="op4-class-pill">{row.shareClass}</span>
                </div>
                <div className="op4-cell op4-cell-called">
                  <span className="op4-number">{row.calledAmount}</span>
                </div>
                <div className="op4-cell op4-cell-linked">
                  <button
                    type="button"
                    className={"op4-linked-btn" + (row.isLinkOnly ? " op4-linked-btn-link" : "")}
                  >
                    <span className={row.isLinkOnly ? "op4-linked-link-icon" : "op4-linked-icon"} aria-hidden="true">
                      {row.isLinkOnly ? "⛓" : ""}
                    </span>
                    <span className="op4-linked-label">{row.templateLabel}</span>
                  </button>
                </div>
                <div className="op4-cell op4-cell-action">
                  {row.linkedIcons.includes("doc") && (
                    <button type="button" className="op4-file-icon op4-file-icon-doc">
                      <DocFileIcon />
                    </button>
                  )}
                  {row.linkedIcons.includes("pdf") && (
                    <button type="button" className="op4-file-icon op4-file-icon-pdf">
                      <PdfFileIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* total bar */}
            <div className="op4-total-row">
              <div className="op4-total-label">Total</div>
              <div className="op4-total-value">€ {grandTotal}</div>
            </div>
          </div>
        </div>
      ) : (
        /* ---------- TEMPLATE PAGE ---------- */
        <div className="op4-template-layout">
          <div className="op4-template-left">
            <div className="op4-template-search-wrapper">
              <span className="op4-template-search-icon" aria-hidden="true">🔍</span>
              <input className="op4-template-search-input" placeholder="Search by template..." />
            </div>

            <label className="op4-template-select-all">
              <input type="checkbox" />
              <span>Select all ({TEMPLATE_ROWS.length})</span>
            </label>

            <div className="op4-template-list">
              {TEMPLATE_ROWS.map((tpl) => (
                <div key={tpl.id} className="op4-template-card">
                  <div className="op4-template-card-main">
                    <div className="op4-template-text">
                      <div className="op4-template-name">{tpl.name}</div>
                      <div className="op4-template-desc">{tpl.description}</div>
                      <div className="op4-template-tags-row">
                        {tpl.tags.map((tag) => (
                          <span key={tag} className="op4-template-tag-pill">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="op4-template-actions">
                      <button type="button" className="op4-extract-btn">
                        <span className="op4-extract-doc-icon" aria-hidden="true">
                          <ExtractIcon />
                        </span>
                        <span>Extract</span>
                      </button>
                      <button type="button" className="op4-more-btn" aria-label="More">⋮</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ✅ No right preview column — empty box removed */}
        </div>
      )}
    </div>
  );
}
