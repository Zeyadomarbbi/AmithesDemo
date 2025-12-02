import React from "react";
import "./FlowHeader.css";

export default function FlowHeader({ onNewOperation }) {
  return (
    <div className="cf-header">
      <button
        type="button"
        className="cf-new-op-btn"
        onClick={onNewOperation}
      >
        + New operation
      </button>
    </div>
  );
}
