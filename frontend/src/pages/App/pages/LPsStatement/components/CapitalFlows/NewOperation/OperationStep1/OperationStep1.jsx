// src/pages/App/pages/LPsStatement/components/CapitalFlows/NewOperation/OperationStep1.jsx
import React, { useMemo } from "react";
import "./OperationStep1.css";

import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import { ChevronDownIcon } from "../../../../Icons.jsx";


function shouldHideOperationType(name = "") {
  const n = String(name || "").toLowerCase();
  const hasEq = n.includes("equalization");
  const hasCap = n.includes("capital");
  return hasEq && !hasCap;
}

export default function OperationStep1({
  operationName = "",
  setOperationName = () => {},

  operationType = "",
  setOperationType = () => {},

  noticeDate = null,
  setNoticeDate = () => {},

  dueDate = null,
  setDueDate = () => {},

  operationTypes = [],
}) {
  const filteredOperationTypes = useMemo(() => {
    const arr = Array.isArray(operationTypes) ? operationTypes : [];
    return arr.filter((t) => !shouldHideOperationType(t?.name));
  }, [operationTypes]);

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

            {/* ✅ from backend: [{operation_type_id, name, ...}] */}
            {Array.isArray(filteredOperationTypes) &&
            filteredOperationTypes.length > 0 ? (
              filteredOperationTypes.map((t) => (
                <option
                  key={String(t.operation_type_id)}
                  value={String(t.operation_type_id)}
                >
                  {t.name}
                </option>
              ))
            ) : (
              // fallback (UI won't break if backend not loaded)
              <>
                <option value="1">Capital Call</option>
                <option value="2">Distribution</option>
                <option value="3">Equalization/Capital Call</option>
              </>
            )}
          </select>

          <span className="op1-select-icon" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </div>
      </div>

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
