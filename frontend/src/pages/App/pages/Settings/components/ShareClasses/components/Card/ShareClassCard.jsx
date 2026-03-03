// frontend/src/pages/App/pages/Settings/components/ShareClasses/components/Card/ShareClassCard.jsx
import React from "react";
import { FileIcon, MoreActionsIcon } from "../../../../../../../../components/Icons/icons2";

import "./ShareClassCard.css";

// 1. CONFIGURATION MAPS
// Maps Database Value -> { Display Label, Badge Color }
const ISSUANCE_MAP = {
  PRO_RATA_CALLED: { label: "Pro Rata Called", variant: "green" },
  UPFRONT: { label: "Upfront", variant: "blue" },
};

const DISTRIBUTION_MAP = {
  DIVIDEND: { label: "Dividend", variant: "blue" },
  REDEMPTION_OF_SHARES: { label: "Redemption of Shares", variant: "purple" },
};

const ShareClassCard = ({ shareClass }) => {
  // 2. GET RAW VALUES
  // Use the exact column names from your SQL schema (snake_case)
  const rawIssuance = shareClass.issuance_method; 
  const rawDistribution = shareClass.distribution_method;

  // 3. LOOKUP CONFIG
  // If the value from DB exists in our map, use it. Otherwise fallback to raw text and gray.
  const issuanceConfig = ISSUANCE_MAP[rawIssuance] || { 
    label: rawIssuance || "–", 
    variant: "gray" 
  };

  const distributionConfig = DISTRIBUTION_MAP[rawDistribution] || { 
    label: rawDistribution || "–", 
    variant: "gray" 
  };

  return (
    <div className="share-card">
      <div className="share-card-header">
        <div className="share-card-title">{shareClass.share_class_name}</div>
        <button type="button" className="share-card-menu-btn" aria-label="More actions">
          <MoreActionsIcon />
        </button>
      </div>

      <div className="share-card-meta">
        <div className="share-meta-column">
          <div className="share-meta-label">Nominal value</div>
          <div className="share-meta-value">
            {shareClass.nominal_value || "–"}
          </div>
        </div>

        <div className="share-meta-column">
          <div className="share-meta-label">Share issuance</div>
          <span className={`share-badge share-badge--${issuanceConfig.variant}`}>
            {issuanceConfig.label}
          </span>
        </div>

        <div className="share-meta-column">
          <div className="share-meta-label">Distribution method</div>
          <span className={`share-badge share-badge--${distributionConfig.variant}`}>
            {distributionConfig.label}
          </span>
        </div>

        <div className="share-meta-column">
          <div className="share-meta-label">ISIN Code</div>
          <div className="share-meta-value">
            {shareClass.isin_code || "–"}
          </div>
        </div>
      </div>

      <div className="share-description-block">
        <div className="share-meta-label">Description as per PPM</div>
        <p className="share-meta-value">
          {shareClass.ppm_description || "No description provided."}
        </p>
      </div>

      <div className="share-file-block">
        {(shareClass.document_url) && (
          <a 
            href={shareClass.document_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="share-file-btn"
            style={{ textDecoration: 'none' }} // remove underline
          >
            <FileIcon />
            <span>{shareClass.document_name}</span>
            <span> - {shareClass.document_size ? `${(shareClass.document_size / 1024).toFixed(2)} KB` : "Unknown"}</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ShareClassCard;