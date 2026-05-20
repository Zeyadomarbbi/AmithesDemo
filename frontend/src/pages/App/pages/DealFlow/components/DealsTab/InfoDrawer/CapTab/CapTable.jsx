import React, { useEffect } from "react";

export default function CapTable({ dealId, onSaveStateChange }) {
  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: null, isDirty: false, isSaving: false });
  }, [onSaveStateChange]);

  return (
    <div>
      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#14213d" }}>Cap table</h3>
    </div>
  );
}
