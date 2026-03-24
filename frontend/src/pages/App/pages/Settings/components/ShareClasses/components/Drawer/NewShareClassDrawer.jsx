// frontend/src/pages/App/pages/Settings/components/ShareClasses/components/Drawer/NewShareClassDrawer.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useFileUpload } from "../../../../../../../../hooks/Upload"; 
import { ChevronLeftIcon } from '/src/components/Icons/DirectionIcons';
import { CloseIcon, UploadIcon } from '/src/components/Icons/InteractiveIcons';
import { CurrencyIcon, PoundIcon, CreditCardIcon, CreditCardXIcon } from '/src/components/Icons/FinancialIcons';
import { PieChartIcon } from '/src/components/Icons/AnalysisIcons';

import "./NewShareClassDrawer.css";

const NewShareClassDrawer = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState("");
  const [isin, setIsin] = useState("");
  const [shareValue, setShareValue] = useState("");
  const [issuanceMethod, setIssuanceMethod] = useState("pro-rata");
  const [distributionMethod, setDistributionMethod] = useState("dividend");
  const [description, setDescription] = useState("");
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.share_class_name || "");
        setIsin(initialData.isin_code || "");
        setShareValue(initialData.nominal_value !== undefined && initialData.nominal_value !== null ? String(initialData.nominal_value) : "");
        setIssuanceMethod(initialData.issuance_method === "UPFRONT" ? "upfront" : "pro-rata");
        setDistributionMethod(initialData.distribution_method === "REDEMPTION_OF_SHARES" ? "redemption" : "dividend");
        setDescription(initialData.ppm_description || "");
        setUploadedFile(initialData.document_name ? { name: initialData.document_name, size: initialData.document_size } : null);
      } else {
        setName("");
        setIsin("");
        setShareValue("");
        setIssuanceMethod("pro-rata");
        setDistributionMethod("dividend");
        setDescription("");
        setUploadedFile(null);
      }
      setIsSaving(false);
    }
  }, [isOpen, initialData]);

  const isFormValid = useMemo(() => {
    return (
      name.trim() !== "" && 
      shareValue !== "" && 
      !isNaN(parseFloat(shareValue)) &&
      issuanceMethod !== "" &&
      distributionMethod !== ""
    );
  }, [name, shareValue, issuanceMethod, distributionMethod]);

  const handleFileSelected = (file) => {
    setUploadedFile(file);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation(); 
    setUploadedFile(null);
  };

  const { trigger, InputComponent } = useFileUpload(handleFileSelected);

  const handleSaveAction = async () => {
    if (!isFormValid || isSaving) return;

    setIsSaving(true);

    try {
      const dbIssuanceMethod = issuanceMethod === "pro-rata" ? "PRO_RATA_CALLED" : "UPFRONT";
      const dbDistributionMethod = distributionMethod === "dividend" ? "DIVIDEND" : "REDEMPTION_OF_SHARES";

      const shareClassData = {
        share_class_name: name,
        isin_code: isin,
        nominal_value: shareValue ? parseFloat(shareValue) : 0,
        issuance_method: dbIssuanceMethod,
        distribution_method: dbDistributionMethod,
        ppm_description: description,
        document_file: (uploadedFile instanceof File) ? uploadedFile : null,
        clear_document: (!uploadedFile && initialData?.document_name) ? true : false
      };

      await onSave(shareClassData, initialData?.share_class_id);
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="share-drawer-overlay">
      <div className={`share-drawer ${isExpanded ? "share-drawer--expanded" : ""}`}>
        
        <div className="share-drawer-header">
          <div className="share-drawer-header-actions">
            <button 
              type="button" 
              className={`share-drawer-back ${isExpanded ? "share-drawer-back--rotated" : ""}`} 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronLeftIcon />
            </button>
            <button type="button" className="share-drawer-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="share-drawer-title">{initialData ? "Edit share class" : "New share class"}</div>
        </div>

        <div className="share-drawer-body">
          <div className="share-drawer-row share-drawer-row--two">
            <div className="share-drawer-field">
              <div className="share-class-drawer-field-label">
                Share Class Name<span className="required">*</span>
              </div>
              <div className="share-class-field-input share-class-field-input--with-icon">
                <input
                  type="text"
                  className="field-input-inner"
                  placeholder="Please enter the share class name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="share-drawer-field">
              <div className="share-class-drawer-field-label">ISIN code</div>
              <div className="share-class-field-input share-class-field-input--with-icon">
                <input
                  type="text"
                  className="field-input-inner"
                  placeholder="ex : FR0000120271"
                  value={isin}
                  onChange={(e) => setIsin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="share-drawer-field">
            <div className="share-class-drawer-field-label">
              Share value<span className="required">*</span>
            </div>
            <div className="share-class-field-input share-class-field-input--with-icon">
              <input
                type="number"
                className="field-input-inner"
                placeholder="ex: 1000"
                value={shareValue}
                onChange={(e) => setShareValue(e.target.value)}
              />
              <CurrencyIcon />
            </div>
          </div>

          <div className="share-drawer-section">
            <div className="share-class-drawer-field-label">
              Share issuance method<span className="required">*</span>
            </div>
              <div className="share-toggle-group">
                <button
                  type="button"
                  className={`share-toggle-btn${issuanceMethod === "upfront" ? " share-toggle-btn--active" : ""}`}
                  onClick={() => setIssuanceMethod("upfront")}
                >
                  <PoundIcon /> <span>Upfront</span> 
                </button>
                <button
                  type="button"
                  className={`share-toggle-btn${issuanceMethod === "pro-rata" ? " share-toggle-btn--active" : ""}`}
                  onClick={() => setIssuanceMethod("pro-rata")}
                >
                  <PieChartIcon /> <span>Pro rata capital called</span>
                </button>
              </div>
          </div>

          <div className="share-drawer-section">
            <div className="share-class-drawer-field-label">
              Distribution method<span className="required">*</span>
            </div>
            <div className="share-toggle-group">
              <button
                type="button"
                className={`share-toggle-btn${distributionMethod === "redemption" ? " share-toggle-btn--active" : ""}`}
                onClick={() => setDistributionMethod("redemption")}
              >
                <CreditCardIcon /> <span>Redemption of share</span>
              </button>
              <button
                type="button"
                className={`share-toggle-btn${distributionMethod === "dividend" ? " share-toggle-btn--active" : ""}`}
                onClick={() => setDistributionMethod("dividend")}
              >
                <CreditCardXIcon /> <span>Dividend</span>
              </button>
            </div>
          </div>

          <div className="share-drawer-field">
            <div className="share-class-drawer-field-label">Description as per PPM</div>
            <textarea
              className="share-drawer-textarea"
              placeholder="Please type the description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="share-drawer-section">
            <div className="share-class-drawer-field-label">Files</div>
            <div 
              className={`share-upload-box ${uploadedFile ? "share-upload-box--has-file" : ""}`} 
              onClick={!uploadedFile ? trigger : undefined} 
              style={{ cursor: uploadedFile ? "default" : "pointer" }}
            >
              <InputComponent />
              {uploadedFile ? (
                <div className="share-file-preview">
                    <div className="share-file-info">
                      <div className="share-file-icon">📄</div>
                      <div className="share-file-details">
                        <span className="share-file-name">{uploadedFile.name}</span>
                        <span className="share-file-size">
                          {uploadedFile.size ? (uploadedFile.size / 1024).toFixed(0) : 0} KB
                        </span>
                      </div>
                    </div>
                    <button type="button" className="share-file-remove" onClick={handleRemoveFile}>
                      <CloseIcon />
                    </button>
                </div>
              ) : (
                <>
                  <UploadIcon />
                  <div className="share-upload-text">
                    <span className="upload-trigger">Click to upload</span> or drag and drop
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="share-drawer-footer">
          <button
            type="button"
            className="share-drawer-footer-btn share-drawer-footer-btn--cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="share-drawer-footer-btn share-drawer-footer-btn--save"
            onClick={handleSaveAction}
            disabled={isSaving || !isFormValid}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewShareClassDrawer;