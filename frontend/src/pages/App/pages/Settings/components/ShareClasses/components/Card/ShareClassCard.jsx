// frontend/src/pages/App/pages/Settings/components/ShareClasses/components/Card/ShareClassCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { FileIcon, MoreActionsIcon, DeleteIcon } from '../../../../../../../../components/Icons/InteractiveIcons';
import Prompt from '../../../../../../components/Toast/Prompt.jsx';
import "./ShareClassCard.css";

const ISSUANCE_MAP = {
  PRO_RATA_CALLED: { label: "Pro Rata Called", variant: "green" },
  UPFRONT: { label: "Upfront", variant: "blue" },
};

const DISTRIBUTION_MAP = {
  DIVIDEND: { label: "Dividend", variant: "blue" },
  REDEMPTION_OF_SHARES: { label: "Redemption of Shares", variant: "purple" },
};

const ShareClassCard = ({ shareClass, onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rawIssuance = shareClass.issuance_method; 
  const rawDistribution = shareClass.distribution_method;

  const issuanceConfig = ISSUANCE_MAP[rawIssuance] || { 
    label: rawIssuance || "–", 
    variant: "gray" 
  };

  const distributionConfig = DISTRIBUTION_MAP[rawDistribution] || { 
    label: rawDistribution || "–", 
    variant: "gray" 
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsPromptOpen(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
    setIsPromptOpen(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setIsPromptOpen(false);
  };

  return (
    <div className="share-card" onClick={onEdit} style={{ cursor: 'pointer' }}>
      <div className="share-card-header">
        <div className="share-card-title">{shareClass.share_class_name}</div>
        <div className="share-card-menu-container" ref={menuRef}>
          <button 
            type="button" 
            className="share-card-menu-btn" 
            aria-label="More actions"
            onClick={handleMenuClick}
          >
            <MoreActionsIcon />
          </button>
          
          {isMenuOpen && (
            <div className="share-card-dropdown">
              <button 
                className="share-card-dropdown-item share-card-dropdown-delete" 
                onClick={handleDeleteClick}
              >
                <DeleteIcon />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="share-card-meta">
        <div className="share-meta-column">
          <div className="share-meta-label">Nominal value</div>
          <div className="share-meta-value">
            {shareClass.nominal_value ? Number(shareClass.nominal_value).toFixed(2) : "–"}
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
        {shareClass.document_url && (
          <a 
            href={shareClass.document_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="share-file-btn"
            style={{ textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <FileIcon />
            <span>{shareClass.document_name}</span>
            <span> - {shareClass.document_size ? `${(shareClass.document_size / 1024).toFixed(2)} KB` : "Unknown"}</span>
          </a>
        )}
      </div>

      {isPromptOpen && (
        <Prompt
          title="Delete Share Class"
          message={`Are you sure you want to delete ${shareClass.share_class_name}?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          type="error"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default ShareClassCard;