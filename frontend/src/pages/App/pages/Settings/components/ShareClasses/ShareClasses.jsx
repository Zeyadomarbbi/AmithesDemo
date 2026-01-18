import React, { useState } from "react";
import "./ShareClasses.css";

const SHARE_CLASSES = [
  {
    id: "A",
    name: "Class A",
    nominalValue: "€1,000",
    shareIssuance: {
      label: "Pro rata capital called",
      variant: "green",
    },
    distributionMethod: {
      label: "Dividend",
      variant: "blue",
    },
    isinCode: "FR0000120271",
    descriptionTitle: "Description as per PPM",
    description:
      "This share class is reserved for institutional investors with a minimum commitment of €25M. Capital is called on a pro-rata basis depending on deal flow and fund phase. No redemption is allowed before fund maturity. Carried interest applies after a preferred return of 8%.",
    ppmFileName: "class-A.pdf",
  },
  {
    id: "B",
    name: "Class B",
    nominalValue: "€1,000",
    shareIssuance: {
      label: "Upfront",
      variant: "blue",
    },
    distributionMethod: {
      label: "Redemption of share",
      variant: "purple",
    },
    isinCode: "FR0000120272",
    descriptionTitle: "Description as per PPM",
    description:
      "This share class is reserved for institutional investors with a minimum commitment of €25M. Capital is called on a pro-rata basis depending on deal flow and fund phase. No redemption is allowed before fund maturity. Carried interest applies after a preferred return of 8%.",
    ppmFileName: "class-A.pdf",
  },
];

const ShareClasses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewShareOpen, setIsNewShareOpen] = useState(false);
  const [issuanceMethod, setIssuanceMethod] = useState("pro-rata");
  const [distributionMethod, setDistributionMethod] = useState("dividend");

  const filteredShareClasses = SHARE_CLASSES.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="share-classes-wrap">
      <div className="share-search">
        <span className="share-search-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.33331 2.66732C4.75598 2.66732 2.66665 4.75666 2.66665 7.33398C2.66665 9.91131 4.75598 12.0007 7.33331 12.0007C8.59061 12.0007 9.73178 11.5034 10.5709 10.6949C10.5885 10.6721 10.6077 10.6501 10.6286 10.6292C10.6495 10.6083 10.6714 10.5891 10.6942 10.5716C11.5028 9.73245 12 8.59128 12 7.33398C12 4.75666 9.91064 2.66732 7.33331 2.66732ZM12.0212 11.0791C12.8423 10.0527 13.3333 8.75066 13.3333 7.33398C13.3333 4.02028 10.647 1.33398 7.33331 1.33398C4.0196 1.33398 1.33331 4.02028 1.33331 7.33398C1.33331 10.6477 4.0196 13.334 7.33331 13.334C8.74999 13.334 10.052 12.843 11.0784 12.0219L13.5286 14.4721C13.7889 14.7324 14.211 14.7324 14.4714 14.4721C14.7317 14.2117 14.7317 13.7896 14.4714 13.5292L12.0212 11.0791Z" fill="#375A89"/>
          </svg>
        </span>
        <input
          type="text"
          className="share-search-input"
          placeholder="Search by share class..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="share-list">
        {filteredShareClasses.slice(0, 1).map((cls) => (
          <div key={cls.id} className="share-card">
            <div className="share-card-header">
              <div className="share-card-title">{cls.name}</div>
              <button
                type="button"
                className="share-card-menu-btn"
                aria-label="More actions"
              >
                ⋮
              </button>
            </div>

            <div className="share-card-meta">
              <div className="share-meta-column">
                <div className="share-meta-label">Nominal value</div>
                <div className="share-meta-value">{cls.nominalValue}</div>
              </div>

              <div className="share-meta-column">
                <div className="share-meta-label">Share issuance</div>
                <span
                  className={`share-badge share-badge--${cls.shareIssuance.variant}`}
                >
                  {cls.shareIssuance.label}
                </span>
              </div>

              <div className="share-meta-column">
                <div className="share-meta-label">Distribution method</div>
                <span
                  className={`share-badge share-badge--${cls.distributionMethod.variant}`}
                >
                  {cls.distributionMethod.label}
                </span>
              </div>

              <div className="share-meta-column">
                <div className="share-meta-label">ISIN Code</div>
                <div className="share-meta-value">{cls.isinCode}</div>
              </div>
            </div>

            <div className="share-description-block">
              <div className="share-desc-title">{cls.descriptionTitle}</div>
              <p className="share-desc-text">{cls.description}</p>
            </div>

            <button type="button" className="share-file-btn">
              <span className="share-file-icon">
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 1.4C0 0.626801 0.626801 0 1.4 0H7L11.2 4.2V12.6C11.2 13.3732 10.5732 14 9.8 14H1.4C0.626799 14 0 13.3732 0 12.6V1.4Z" fill="#375A89"/>
                  <path opacity="0.3" d="M7 0L11.2 4.2H8.4C7.6268 4.2 7 3.5732 7 2.8V0Z" fill="white"/>
                </svg>
              </span>
              <span>{cls.ppmFileName}</span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="share-new-btn"
        onClick={() => setIsNewShareOpen(true)}
      >
        <span className="share-new-icon">＋</span>
        <span>New share class</span>
      </button>

      {isNewShareOpen && (
        <div className="share-drawer-overlay">
          <div className="share-drawer">
            <div className="share-drawer-header">
              <button
                type="button"
                className="share-drawer-back"
                onClick={() => setIsNewShareOpen(false)}
              >
                ‹
              </button>
              <div className="share-drawer-title">New share class</div>
              <button
                type="button"
                className="share-drawer-close"
                onClick={() => setIsNewShareOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="share-drawer-body">
              <div className="share-drawer-row share-drawer-row--two">
                <div className="share-drawer-field">
                  <div className="field-label">
                    Share Class Name<span className="required">*</span>
                  </div>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Please enter the share class name"
                  />
                </div>

                <div className="share-drawer-field">
                  <div className="field-label">ISIN code</div>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="ex : FR0000120271"
                  />
                </div>
              </div>

              <div className="share-drawer-field">
                <div className="field-label">
                  Share value<span className="required">*</span>
                </div>
                <div className="field-input field-input--with-icon">
                  <input
                    type="text"
                    className="field-input-inner"
                    placeholder="0,000.00"
                  />
                  <span className="field-icon">€</span>
                </div>
                <div className="share-drawer-help">
                  Please enter the full amount in €...
                </div>
              </div>

              <div className="share-drawer-section">
                <div className="field-label">Share issuance method</div>
                <div className="share-toggle-group">
                  <button
                    type="button"
                    className={`share-toggle-btn${
                      issuanceMethod === "upfront" ? " share-toggle-btn--active" : ""
                    }`}
                    onClick={() => setIssuanceMethod("upfront")}
                  >
                    £ Upfront
                  </button>
                  <button
                    type="button"
                    className={`share-toggle-btn${
                      issuanceMethod === "pro-rata" ? " share-toggle-btn--active" : ""
                    }`}
                    onClick={() => setIssuanceMethod("pro-rata")}
                  >
                    ⏱ Pro rata capital called
                  </button>
                </div>
              </div>

              <div className="share-drawer-section">
                <div className="field-label">Distribution method</div>
                <div className="share-toggle-group">
                  <button
                    type="button"
                    className={`share-toggle-btn${
                      distributionMethod === "redemption" ? " share-toggle-btn--active" : ""
                    }`}
                    onClick={() => setDistributionMethod("redemption")}
                  >
                    ⬇ Redemption of share
                  </button>
                  <button
                    type="button"
                    className={`share-toggle-btn${
                      distributionMethod === "dividend" ? " share-toggle-btn--active" : ""
                    }`}
                    onClick={() => setDistributionMethod("dividend")}
                  >
                    ☰ Dividend
                  </button>
                </div>
              </div>

              <div className="share-drawer-field">
                <div className="field-label">Description as per PPM</div>
                <textarea
                  className="share-drawer-textarea"
                  placeholder="Please type the description here..."
                />
              </div>

              <div className="share-drawer-section">
                <div className="field-label">Files</div>
                <div className="share-upload-box">
                  <div className="share-upload-icon">⬆</div>
                  <div className="share-upload-text">
                    Click to upload or drag and drop
                  </div>
                  <div className="share-upload-hint">
                    SVG, PNG, JPG or GIF (max. 800×400px)
                  </div>
                </div>
              </div>
            </div>

            <div className="share-drawer-footer">
              <button
                type="button"
                className="share-drawer-footer-btn share-drawer-footer-btn--ghost"
                onClick={() => setIsNewShareOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="share-drawer-footer-btn share-drawer-footer-btn--primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareClasses;