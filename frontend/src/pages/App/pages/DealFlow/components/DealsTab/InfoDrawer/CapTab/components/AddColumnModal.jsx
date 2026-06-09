import React, { useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import "./NewCapModal.css";

function AddColumnModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [columnType, setColumnType] = useState("NUMBER");

  const handleCreate = () => {
    onCreate?.({
      name,
      columnType,
    });
  };

  return (
    <div className="ncap-overlay" onClick={onClose}>
      <div className="ncap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ncap-header">
          <button className="ncap-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="ncap-body">
          <h2 className="ncap-title">Add a column</h2>

          <div className="ncap-field">
            <label className="ncap-label">Name*</label>
            <input
              type="text"
              className="ncap-input"
              placeholder="Enter column name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="ncap-field">
            <label className="ncap-label">Type*</label>
            <select
              className="ncap-input"
              value={columnType}
              onChange={(e) => setColumnType(e.target.value)}
            >
              <option value="NUMBER">Number</option>
              <option value="TEXT">Text</option>
              <option value="PERCENTAGE">Percentage</option>
            </select>
          </div>
        </div>

        <div className="ncap-footer">
          <button className="ncap-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ncap-btn-next" onClick={handleCreate}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default AddColumnModal;
