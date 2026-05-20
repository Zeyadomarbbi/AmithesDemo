// src/pages/App/pages/LPsStatement/components/CapitalFlows/NewOperation/OperationStep1.jsx
import React, { useMemo } from "react";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import SimpleDropdown from "../../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx"
import "./OperationStep1.css";

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
    return arr
      .filter((t) => !shouldHideOperationType(t?.name))
      .map((t) => ({ ...t, operation_type_id: String(t.operation_type_id) }));
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
          <SimpleDropdown
            options={filteredOperationTypes}
            value={String(operationType)}
            onChange={(val) => setOperationType(String(val))}
            placeholder="Choose the operation type"
            labelKey="name"
            valueKey="operation_type_id"
            triggerClassName="op1-input"
          />
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
