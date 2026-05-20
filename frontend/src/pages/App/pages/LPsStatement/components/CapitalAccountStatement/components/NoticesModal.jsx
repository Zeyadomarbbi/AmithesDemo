import React, { useRef, useState } from "react";
import SearchBar from "/src/components/SearchBar/SearchBar.jsx";
import "./NoticesModal.css";

const MOCK_ROWS = [
  {
    id: 1,
    initials: "OR",
    name: "Ophéa Real",
    shareClass: "Class A1",
    period: "Q4 2025",
    linkedLabel: "Template CCC",
  },
  {
    id: 2,
    initials: "CP",
    name: "CV Partners",
    shareClass: "Class A2",
    period: "Q4 2025",
    linkedLabel: "Link templates",
  },
  {
    id: 3,
    initials: "SC",
    name: "SA Capital",
    shareClass: "Class B",
    period: "Q4 2025",
    linkedLabel: "Template CCC",
  },
];

const MOCK_TEMPLATES = [
  {
    id: "CCC",
    name: "Template CCC",
    subtitle: "Description courte",
    tags: ["OR", "HR", "MT", "JZ", "+5"],
  },
  {
    id: "AAA",
    name: "Template AAA",
    subtitle: "Class A1",
    tags: ["OR", "HR", "MT", "JZ", "+5"],
  },
  {
    id: "BBB1",
    name: "Template BBB",
    subtitle: "Class B",
    tags: ["OR", "HR", "MT", "JZ", "+5"],
  },
  {
    id: "BBB2",
    name: "Template BBB",
    subtitle: "Class B",
    tags: ["OR", "HR", "MT", "+3"],
  },
];

export default function NoticesModal({ isOpen, onClose }) {
  const uploadInputRef = useRef(null);
  const [templateSearch, setTemplateSearch] = useState("");


  if (!isOpen) return null;

  const handleUploadClick = () => {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  };

  const handleUploadChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      console.log("Uploaded templates:", files);
      // later: send to backend / update state
    }
  };

  return (
    <div className="nm-backdrop">
      <div className="nm-modal">
        {/* HEADER */}
        <div className="nm-header">
          <div className="nm-title-block">
            <h2 className="nm-title">Notices</h2>
            <button className="nm-tab nm-tab-active">Description</button>
          </div>
          <button className="nm-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="nm-body">
          {/* LEFT – FIXED 662px AREA */}
          <div className="nm-left">
            <table className="nm-table">
              <thead>
                <tr className="nm-row">
                  <th className="nm-th-checkbox">
                    <div className="nm-checkbox" />
                  </th>
                  <th className="nm-th">LPs</th>
                  <th className="nm-th">Share Class</th>
                  <th className="nm-th">Period</th>
                  <th className="nm-th nm-th-right">Linked to</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ROWS.map((row) => (
                  <tr key={row.id} className="nm-row">
                    {/* checkbox */}
                    <td className="nm-td-checkbox">
                      <div className="nm-checkbox" />
                    </td>

                    {/* LP avatar + name */}
                    <td className="nm-td nm-td-lp">
                      <div className="nm-avatar">{row.initials}</div>
                      <button className="nm-link">{row.name}</button>
                    </td>

                    {/* share class badge */}
                    <td className="nm-td">
                      <span className="nm-share-badge">{row.shareClass}</span>
                    </td>

                    {/* period text */}
                    <td className="nm-td">
                      <span className="nm-period">{row.period}</span>
                    </td>

                    {/* linked template button + DOC/PDF pills */}
                    <td className="nm-td nm-td-right">
                      <button className="nm-doc-link">
                        <span className="nm-doc-icon" />
                        <span>{row.linkedLabel}</span>
                      </button>
                      <span className="nm-file-icons">
                        <span className="nm-file-icon nm-file-icon-doc">
                          DOC
                        </span>
                        <span className="nm-file-icon nm-file-icon-pdf">
                          PDF
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* bottom blue selection bar */}
            <div className="nm-selection-bar" />
          </div>

          {/* RIGHT – TEMPLATES PANEL */}
          <div className="nm-right">
            <div className="nm-right-header">
              <div className="nm-right-title">
                Templates <span className="nm-right-count">4</span>
              </div>

              <button
                type="button"
                className="nm-upload-btn"
                onClick={handleUploadClick}
              >
                <div className="nm-upload-icon" />
                Upload new template
              </button>

              {/* hidden file input */}
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                accept=".doc,.docx,.pdf"
                className="nm-upload-input-hidden"
                onChange={handleUploadChange}
              />
            </div>
              <SearchBar
                placeholder="Search by template..."
                onSearch={setTemplateSearch}
              />
            {/* cards */}
            <div className="nm-template-list">
              {MOCK_TEMPLATES
  .filter((tpl) =>
    (tpl.name || "").toLowerCase().includes(templateSearch.toLowerCase())
  )
  .map((tpl) => (
                <div key={tpl.id} className="nm-template-card">
                  <div className="nm-template-main">
                    <div>
                      <div className="nm-template-name">{tpl.name}</div>
                      <div className="nm-template-subtitle">
                        {tpl.subtitle}
                      </div>
                      <div className="nm-template-tags">
                        {tpl.tags.map((tag) => (
                          <span
                            key={tag}
                            className={
                              "nm-template-tag" +
                              (tag.startsWith("+")
                                ? " nm-template-tag-more"
                                : "")
                            }
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="nm-template-actions">
                    <button className="nm-three-dots">
                      <span />
                      <span />
                      <span />
                    </button>
                    <button className="nm-extract-btn">Extract</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
