import React from "react";
import { PercentageIcon } from "../Icons";
import "./Steps.css";

export const Step2 = ({ values, onChange, shareClasses = [] }) => {

  // Top-level fields
  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  // Checkbox toggle — OBJECT MAP, NOT ARRAY
  const handleCheckboxChange = (shareClassId, checked) => {
    onChange({
      ...values,
      // Ensure we explicitly clear envelopes since this step doesn't use them
      envelopes: [], 
      rules: {
        ...values.rules,
        [shareClassId]: {
          isSelected: checked,
          isProRata: true,
          fixedPercentage: null
        }
      }
    });
  };
  
return (
    <div className="wf-card">
      <div className="wf-step-title">Step 2</div>

      <div className="wf-step-body">
        {/* COLUMN 1: Name */}
        <div className="wf-col-name">
          <label className="wf-label">Name*</label>
          <div className="wf-field-input">
            <input
              type="text"
              className="wf-text-input-inner"
              value={values.step_name || ""}
              onChange={(e) => handleFieldChange("step_name", e.target.value)}
              placeholder="Hurdle"
            />
          </div>
        </div>

        {/* COLUMN 2: Rate */}
        <div className="wf-col-rate">
          <label className="wf-label">Rate*</label>
          <div className="wf-field-input wf-input-with-unit">
            <input
              type="number"
              className="wf-text-input-inner"
              value={values.step_rate || ""}
              onChange={(e) => handleFieldChange("step_rate", e.target.value)}
              placeholder="Ex: 8"
            />
            <PercentageIcon />
          </div>
        </div>

        {/* COLUMN 3: Share Classes (Global Selection) */}
        <div className="wf-col-classes">
          {shareClasses.map(sc => {
            // Read from Global Rules
            const rule = values.rules?.[sc.share_class_id];

            return (
              <div key={sc.share_class_id} className="wf-sc-group">
                <label className="wf-label">
                  {sc.share_class_name}
                </label>
                <div className="wf-checkbox-container">
                  <input
                    type="checkbox"
                    className="wf-checkbox-custom"
                    checked={!!rule?.isSelected}
                    onChange={(e) =>
                      handleCheckboxChange(sc.share_class_id, e.target.checked)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Step2;