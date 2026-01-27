// frontend/src/pages/App/pages/Settings/components/ShareClasses/components/Drawer/NewShareClassDrawer.jsx
import React, { useState, useEffect } from "react";
import { useFileUpload } from "../../../../../../../../hooks/Upload"; // Adjust path as needed
import { 
  ChevronLeftIcon, CloseIcon, CurrencyIcon, PoundIcon, 
  PieChartIcon, CreditCardIcon, CreditCardXIcon, UploadIcon 
} from "../../icons";

import "./NewShareClassDrawer.css";

const NewShareClassDrawer = ({ isOpen, onClose, onCreate }) => {
  // --- Form State ---
  const [name, setName] = useState("");
  const [isin, setIsin] = useState("");
  const [shareValue, setShareValue] = useState("");
  const [issuanceMethod, setIssuanceMethod] = useState("pro-rata");
  const [distributionMethod, setDistributionMethod] = useState("dividend");
  const [description, setDescription] = useState("");
  
  // --- UI State ---
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Reset Form on Open ---
  useEffect(() => {
    if (isOpen) {
      setName("");
      setIsin("");
      setShareValue("");
      setIssuanceMethod("pro-rata");
      setDistributionMethod("dividend");
      setDescription("");
      setUploadedFile(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  // --- File Upload Implementation ---
  const handleFileSelected = (file) => {
    setUploadedFile(file);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation(); 
    setUploadedFile(null);
  };

  const { trigger, InputComponent } = useFileUpload(handleFileSelected);

  // --- SAVE LOGIC (Commits to Database) ---
  const handleSave = async () => {
    // 1. Basic Validation
    if (!name || !shareValue) {
      alert("Please fill in the required fields (Name and Share Value).");
      return;
    }

    setIsSaving(true);

    try {
      // 2. Enum Mapping: Convert UI state to Database ENUMs
      const dbIssuanceMethod = issuanceMethod === "pro-rata" 
        ? "PRO_RATA_CALLED" 
        : "UPFRONT";

      const dbDistributionMethod = distributionMethod === "dividend" 
        ? "DIVIDEND" 
        : "REDEMPTION_OF_SHARES";

      // 3. Construct Payload
      const newShareClassData = {
        share_class_name: name,
        isin_code: isin,
        nominal_value: parseFloat(shareValue), // Ensure it's a number/decimal
        issuance_method: dbIssuanceMethod,
        distribution_method: dbDistributionMethod,
        ppm_description: description,
        document_file: uploadedFile // Changed from 'file' to 'document_file'
      };

      // 4. Call Parent API Function (Commits to DB)
      console.log("Committing to DB...", newShareClassData);
      await onCreate(newShareClassData);

      // 5. Close Drawer on Success
      onClose();
      
    } catch (error) {
      console.error("Failed to save share class:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="share-drawer-overlay">
      <div className={`share-drawer ${isExpanded ? "share-drawer--expanded" : ""}`}>
        
        {/* HEADER */}
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
          <div className="share-drawer-title">New share class</div>
        </div>

        {/* BODY */}
        <div className="share-drawer-body">
          <div className="share-drawer-row share-drawer-row--two">
            <div className="share-drawer-field">
              <div className="share-class-drawer-field-label">
                Share Class Name<span className="required">*</span>
              </div>
              <input
                type="text"
                className="field-input"
                placeholder="Please enter the share class name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="share-drawer-field">
              <div className="share-class-drawer-field-label">ISIN code</div>
              <input
                type="text"
                className="field-input"
                placeholder="ex : FR0000120271"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
              />
            </div>
          </div>

          <div className="share-drawer-field">
            <div className="share-class-drawer-field-label">
              Share value<span className="required">*</span>
            </div>
            <div className="field-input field-input--with-icon">
              <input
                type="number"
                className="field-input-inner"
                placeholder="0,000.00"
                value={shareValue}
                onChange={(e) => setShareValue(e.target.value)}
              />
              <CurrencyIcon />
            </div>
            <div className="share-drawer-help">
              Please enter the full amount in €...
            </div>
          </div>

          <div className="share-drawer-section">
            <div className="share-class-drawer-field-label">Share issuance method</div>
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
            <div className="share-class-drawer-field-label">Distribution method</div>
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
                          {(uploadedFile.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                   </div>
                   <button 
                     type="button" 
                     className="share-file-remove" 
                     onClick={handleRemoveFile}
                   >
                     <CloseIcon />
                   </button>
                </div>
              ) : (
                <>
                  <UploadIcon />
                  <div className="share-upload-text">
                    <span className="upload-trigger">Click to upload</span> or drag and drop
                  </div>
                  <div className="share-upload-hint">
                    SVG, PNG, JPG or GIF (max. 800×400px)
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
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
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewShareClassDrawer;