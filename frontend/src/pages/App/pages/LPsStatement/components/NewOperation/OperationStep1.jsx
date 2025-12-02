import React, { useState } from "react";
import "./OperationStep1.css";

export default function OperationStep1() {
  const [operationName, setOperationName] = useState("");
  const [operationType, setOperationType] = useState("Capital Call");
  const [noticeDate, setNoticeDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  return (
    <div className="op1">
      <div className="op1-field">
        <label className="op1-label">Operation name*</label>
        <input
          className="op1-input"
          placeholder="Please enter the operation name..."
          value={operationName}
          onChange={(e) => setOperationName(e.target.value)}
        />
      </div>

      <div className="op1-field">
        <label className="op1-label">Operation type*</label>

        {/* chips + fake dropdown on the right */}
        <div className="op1-type-row">
          <div className="op1-type-chips">
            <button
              type="button"
              className={
                operationType === "Equalization"
                  ? "op1-type-chip op1-type-chip--blue is-active"
                  : "op1-type-chip op1-type-chip--blue"
              }
              onClick={() => setOperationType("Equalization")}
            >
              Equalization
            </button>
            <button
              type="button"
              className={
                operationType === "Capital Call"
                  ? "op1-type-chip op1-type-chip--green is-active"
                  : "op1-type-chip op1-type-chip--green"
              }
              onClick={() => setOperationType("Capital Call")}
            >
              Capital Call
            </button>
          </div>

          {/* right side fake dropdown – just visual for now */}
          <div className="op1-type-select">
            <span>{operationType}</span>
            <span className="op1-select-arrow">▾</span>
          </div>
        </div>
      </div>

      <div className="op1-row">
        <div className="op1-field">
          <label className="op1-label">Notice date*</label>
          <div className="op1-date-wrap">
            <input
              className="op1-input"
              placeholder="00/00/00"
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
            />
            <span className="op1-date-icon">📅</span>
          </div>
        </div>

        <div className="op1-field">
          <label className="op1-label">Due date*</label>
          <div className="op1-date-wrap">
            <input
              className="op1-input"
              placeholder="00/00/00"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <span className="op1-date-icon">📅</span>
          </div>
        </div>
      </div>
    </div>
  );
}
