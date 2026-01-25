// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationStep4.jsx
import React, { useState } from "react";
import "./OperationStep4.css";

/* ------------------------------------------------------------------
   INLINE SVG PREVIEW CARD (from your Figma SVG)
-------------------------------------------------------------------*/
const TemplatePreviewSvg = () => (
  <svg
    width="311"
    height="105"
    viewBox="0 0 311 105"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="311" height="104.32" rx="8" fill="white" />
    <rect
      x="0.5"
      y="0.5"
      width="310"
      height="103.32"
      rx="7.5"
      stroke="#CCCDCE"
      strokeOpacity="0.5"
    />
    <path
      d="M15.6165 22.1406V20.8182H23.4964V22.1406H20.3196V31H18.7884V22.1406H15.6165ZM27.4422 31.1541C26.6898 31.1541 26.0419 30.9934 25.4983 30.6719C24.9581 30.3471 24.5405 29.8913 24.2455 29.3047C23.9538 28.7147 23.808 28.0237 23.808 27.2315C23.808 26.4493 23.9538 25.7599 24.2455 25.1634C24.5405 24.5668 24.9514 24.1011 25.4784 23.7663C26.0087 23.4316 26.6285 23.2642 27.3378 23.2642C27.7687 23.2642 28.1863 23.3355 28.5906 23.478C28.995 23.6205 29.3579 23.8442 29.6794 24.1491C30.0009 24.4541 30.2545 24.8501 30.4401 25.3374C30.6257 25.8213 30.7185 26.4096 30.7185 27.1023V27.6293H24.6482V26.5156H29.2618C29.2618 26.1245 29.1823 25.7782 29.0232 25.4766C28.8641 25.1716 28.6404 24.9313 28.352 24.7557C28.067 24.58 27.7322 24.4922 27.3477 24.4922C26.9301 24.4922 26.5655 24.5949 26.254 24.8004C25.9458 25.0026 25.7071 25.2678 25.5381 25.5959C25.3724 25.9207 25.2895 26.2737 25.2895 26.6548V27.5249C25.2895 28.0353 25.379 28.4695 25.558 28.8274C25.7403 29.1854 25.9938 29.4588 26.3186 29.6477C26.6434 29.8333 27.0229 29.9261 27.4571 29.9261C27.7388 29.9261 27.9957 29.8864 28.2277 29.8068C28.4597 29.724 28.6602 29.6013 28.8293 29.4389C28.9983 29.2765 29.1276 29.076 29.2171 28.8374L30.624 29.0909C30.5113 29.5052 30.3092 29.8681 30.0175 30.1797C29.7291 30.4879 29.3662 30.7282 28.9287 30.9006C28.4945 31.0696 27.999 31.1541 27.4422 31.1541ZM32.5078 31V23.3636H33.9347V24.6065H34.0291C34.1882 24.1856 34.4484 23.8575 34.8097 23.6222C35.1709 23.3835 35.6035 23.2642 36.1072 23.2642C36.6177 23.2642 37.0452 23.3835 37.3899 23.6222C37.7379 23.8608 37.9948 24.1889 38.1605 24.6065H38.2401C38.4223 24.1989 38.7124 23.8741 39.1101 23.6321C39.5078 23.3868 39.9818 23.2642 40.532 23.2642C41.2247 23.2642 41.7898 23.4813 42.2273 23.9155C42.6681 24.3497 42.8885 25.0043 42.8885 25.8793V31H41.402V26.0185C41.402 25.5014 41.2611 25.1269 40.9794 24.8949C40.6977 24.6629 40.3613 24.5469 39.9702 24.5469C39.4863 24.5469 39.1101 24.696 38.8416 24.9943C38.5731 25.2893 38.4389 25.6688 38.4389 26.1328V31H36.9574V25.924C36.9574 25.5097 36.8281 25.1766 36.5696 24.9247C36.3111 24.6728 35.9747 24.5469 35.5604 24.5469C35.2786 24.5469 35.0185 24.6214 34.7798 24.7706C34.5445 24.9164 34.3539 25.1203 34.2081 25.3821C34.0656 25.6439 33.9943 25.9472 33.9943 26.2919V31H32.5078Z"
      fill="#1C1917"
    />
    <path
      d="M45.0209 33.8636V23.3636H46.4726V24.6016H46.5968C46.683 24.4425 46.8073 24.2585 46.9697 24.0497C47.1321 23.8409 47.3575 23.6586 47.6459 23.5028C47.9342 23.3438 48.3154 23.2642 48.7893 23.2642C49.4058 23.2642 49.956 23.42 50.4399 23.7315C50.9238 24.0431 51.3033 24.4922 51.5784 25.0788C51.8568 25.6655 51.996 26.3714 51.996 27.1967C51.996 28.022 51.8584 28.7296 51.5834 29.3196C51.3083 29.9062 50.9304 30.3587 50.4498 30.6768C49.9692 30.9917 49.4207 31.1491 48.8042 31.1491C48.3402 31.1491 47.9607 31.0713 47.6657 30.9155C47.3741 30.7597 47.1454 30.5774 46.9797 30.3686C46.8139 30.1598 46.6863 29.9742 46.5968 29.8118H46.5074V33.8636H45.0209Z"
      fill="#1C1917"
    />
  </svg>
);

/* ------------------------------------------------------------------
   DATA FOR LPs TABLE + TEMPLATE LIST
-------------------------------------------------------------------*/

// LPs table rows (LPs List tab)
const LPS_ROWS = [
  {
    id: 1,
    initials: "OR",
    name: "Ophéa Real",
    shareClass: "Class A1",
    calledAmount: "2 500 000",
    templateLabel: "Template CCC",
    isLinkOnly: false,
    linkedIcons: ["doc", "pdf"],
    selected: true,
  },
  {
    id: 2,
    initials: "CV",
    name: "CV Partners",
    shareClass: "Class A2",
    calledAmount: "2 500 000",
    templateLabel: "Link template",
    isLinkOnly: true,
    linkedIcons: ["doc", "pdf"],
    selected: false,
  },
  {
    id: 3,
    initials: "SC",
    name: "SA Capital",
    shareClass: "Class B",
    calledAmount: "2 500 000",
    templateLabel: "Template CCC",
    isLinkOnly: false,
    linkedIcons: ["doc", "pdf"],
    selected: false,
  },
];

// Template cards (Template tab)
const TEMPLATE_ROWS = [
  {
    id: 1,
    name: "Template CCC",
    description: "Description courte",
    tags: ["OR", "HR", "MT", "JZ", "OF +5"],
  },
  {
    id: 2,
    name: "Template AAA",
    description: "Class A1",
    tags: ["OR", "HR", "MT", "JZ", "OF +5"],
  },
  {
    id: 3,
    name: "Template BBB",
    description: "Class B",
    tags: ["OR", "HR", "MT", "JZ", "OF +5"],
  },
  {
    id: 4,
    name: "Template BBB",
    description: "Class B",
    tags: ["OR", "HR", "MT", "JZ", "OF +5"],
  },
];

/* ---------- DOC + PDF SMALL ICONS FOR ACTION COLUMN ---------- */

const DocFileIcon = () => (
  <svg
    width="22"
    height="20"
    viewBox="0 0 22 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.07031 0.75H15.0098L20.3203 6.06055V16C20.3203 17.7949 18.8652 19.25 17.0703 19.25H9.07031C7.27539 19.25 5.82031 17.7949 5.82031 16V4C5.82031 2.20507 7.27539 0.75 9.07031 0.75Z"
      stroke="#D0D5DD"
      strokeWidth="1.5"
    />
    <path
      d="M15.0703 0.25V2C15.0703 4.20914 16.8612 6 19.0703 6H20.8203"
      stroke="#D0D5DD"
      strokeWidth="1.5"
    />
    <rect y="7.26562" width="18.64" height="7.77144" rx="1.3549" fill="#155EEF" />
    {/* (paths for the DOC letters inside – unchanged) */}
  </svg>
);

const PdfFileIcon = () => (
  <span className="op4-file-badge-pdf">PDF</span>
);

/* ---------- EXTRACT ICON (your 12x15 SVG) ---------- */

const ExtractIcon = () => (
  <svg
    width="12"
    height="15"
    viewBox="0 0 12 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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

export default function OperationStep4() {
  const [activeTab, setActiveTab] = useState("lps"); // "lps" | "template"
  const totalCalled = "7 500 000";

  // simple handler to open file picker when clicking Upload new template
  const handleUploadClick = () => {
    const input = document.getElementById("op4-upload-input");
    if (input) {
      input.click();
    }
  };

  return (
    <div className="op4-wrapper">
      {/* hidden input used by the upload button */}
      <input
        id="op4-upload-input"
        type="file"
        style={{ display: "none" }}
      />

      {/* ================== TOP RIGHT TOGGLE ================== */}
      <div className="op4-top-row">
        {/* NEW: wrapper so button is under the tabs on the right */}
        <div className="op4-top-right">
          <div className="op4-toggle-group">
            <button
              type="button"
              className={
                "op4-toggle-btn" +
                (activeTab === "lps" ? " op4-toggle-btn--active" : "")
              }
              onClick={() => setActiveTab("lps")}
            >
              LPs List
            </button>
            <button
              type="button"
              className={
                "op4-toggle-btn" +
                (activeTab === "template" ? " op4-toggle-btn--active" : "")
              }
              onClick={() => setActiveTab("template")}
            >
              Template
            </button>
          </div>

          {activeTab === "template" && (
            <button
              className="op4-upload-btn"
              type="button"
              onClick={handleUploadClick}
            >
              <span className="op4-upload-icon" aria-hidden="true">
                ↑
              </span>
              Upload new template
            </button>
          )}
        </div>
      </div>

      {/* ================== CONTENT BY TAB ================== */}
      {activeTab === "lps" ? (
        /* ---------- LPs LIST TABLE (your old view) ---------- */
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

            {/* body rows */}
            {LPS_ROWS.map((row) => (
              <div
                key={row.id}
                className={
                  "op4-row op4-row-body" +
                  (row.selected ? " op4-row-selected" : "")
                }
              >
                <div className="op4-cell op4-cell-check">
                  <input type="checkbox" defaultChecked={row.selected} />
                </div>

                <div className="op4-cell op4-cell-lp">
                  <div className="op4-lp-pill">{row.initials}</div>
                  <button className="op4-lp-name" type="button">
                    {row.name}
                  </button>
                </div>

                <div className="op4-cell op4-cell-share-class">
                  <span className="op4-class-pill">{row.shareClass}</span>
                </div>

                <div className="op4-cell op4-cell-called">
                  <span className="op4-number">{row.calledAmount}</span>
                </div>

                <div className="op4-cell op4-cell-linked">
                  {!row.isLinkOnly ? (
                    <button type="button" className="op4-linked-btn">
                      <span className="op4-linked-icon" aria-hidden="true" />
                      <span className="op4-linked-label">
                        {row.templateLabel}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="op4-linked-btn op4-linked-btn-link"
                    >
                      <span
                        className="op4-linked-link-icon"
                        aria-hidden="true"
                      >
                        ⛓
                      </span>
                      <span className="op4-linked-label">
                        {row.templateLabel}
                      </span>
                    </button>
                  )}
                </div>

                <div className="op4-cell op4-cell-action">
                  {row.linkedIcons.includes("doc") && (
                    <button
                      type="button"
                      className="op4-file-icon op4-file-icon-doc"
                    >
                      <DocFileIcon />
                    </button>
                  )}
                  {row.linkedIcons.includes("pdf") && (
                    <button
                      type="button"
                      className="op4-file-icon op4-file-icon-pdf"
                    >
                      <PdfFileIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* total bar */}
            <div className="op4-total-row">
              <div className="op4-total-label">Total</div>
              <div className="op4-total-value">{totalCalled}</div>
            </div>
          </div>
        </div>
      ) : (
        /* ---------- TEMPLATE PAGE (NO RIGHT EMPTY BOX) ---------- */
        <div className="op4-template-layout">
          {/* Left column: search + list of template cards */}
          <div className="op4-template-left">
            <div className="op4-template-search-wrapper">
              <span className="op4-template-search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                className="op4-template-search-input"
                placeholder="Search by template..."
              />
            </div>

            <label className="op4-template-select-all">
              <input type="checkbox" />
              <span>Select all (4)</span>
            </label>

            <div className="op4-template-list">
              {TEMPLATE_ROWS.map((tpl) => (
                <div key={tpl.id} className="op4-template-card">
                  <div className="op4-template-card-main">
                    <div className="op4-template-text">
                      <div className="op4-template-name">{tpl.name}</div>
                      <div className="op4-template-desc">
                        {tpl.description}
                      </div>
                      <div className="op4-template-tags-row">
                        {tpl.tags.map((tag) => (
                          <span
                            key={tag}
                            className="op4-template-tag-pill"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="op4-template-actions">
                      {/* Extract button with your new icon */}
                      <button
                        type="button"
                        className="op4-extract-btn"
                      >
                        <span
                          className="op4-extract-doc-icon"
                          aria-hidden="true"
                        >
                          <ExtractIcon />
                        </span>
                        <span>Extract</span>
                      </button>

                      <button
                        type="button"
                        className="op4-more-btn"
                        aria-label="More"
                      >
                        ⋮
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ Removed the right preview column so the empty box disappears */}
        </div>
      )}
    </div>
  );
}
