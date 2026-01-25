// src/pages/App/pages/LPsStatement/components/CapitalFlows/NewOperation/OperationStep1.jsx
import React, { useState } from "react";
import "./OperationStep1.css";

// ✅ shared date input with picker + calendar icon
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";

// ✅ your icons file (for dropdown chevron)
import { ChevronDownIcon } from "../../Icons.jsx";

export default function OperationStep1({
  operationName = "",
  setOperationName = () => {},
  operationType = "",
  setOperationType = () => {},
}) {
  // ✅ store Date objects (DateInputWithPicker expects Date or null)
  const [noticeDate, setNoticeDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);

  return (
    <div className="op1">
      {/* Operation name */}
      <div className="op1-field">
        <label className="op1-label">Operation name*</label>
        <input
          className="op1-input"
          placeholder="Please enter the operation name..."
          value={operationName}
          onChange={(e) => setOperationName(e.target.value)}
        />
      </div>

      {/* Operation type (dropdown + chevron icon) */}
      <div className="op1-field">
        <label className="op1-label">Operation type*</label>

        <div className="op1-select-wrap">
          <select
            className="op1-select"
            required
            value={operationType}
            onChange={(e) => setOperationType(e.target.value)}
          >
            <option value="" disabled hidden>
              Choose the operation type
            </option>

            <option value="Capital Call">Capital Call</option>
            <option value="Distribution">Distribution</option>
            <option value="Equalization/Capital Call">
              Equalization/Capital Call
            </option>
          </select>

          <span className="op1-select-icon" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </div>
      </div>

      {/* Dates (use DateInputWithPicker) */}
      <div className="op1-row">
        <div className="op1-field">
          <label className="op1-label">Notice date*</label>

          <div className="op1-date-picker">
            <DateInputWithPicker
              initialDate={noticeDate}
              onDateChange={(d) => setNoticeDate(d)}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
          </div>
        </div>

        <div className="op1-field">
          <label className="op1-label">Due date*</label>

          <div className="op1-date-picker">
            <DateInputWithPicker
              initialDate={dueDate}
              onDateChange={(d) => setDueDate(d)}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
