import React from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import "./NewCapModal.css";

function ConfirmActionModal({
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  onClose,
  onConfirm,
}) {
  return (
    <div className="ncap-overlay" onClick={onClose}>
      <div className="ncap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ncap-header">
          <button className="ncap-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="ncap-body">
          <h2 className="ncap-title">{title}</h2>
          <p className="ncap-copy">{message}</p>
        </div>

        <div className="ncap-footer">
          <button className="ncap-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ncap-btn-next ncap-btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionModal;
