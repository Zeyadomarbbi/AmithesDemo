import React, { useEffect } from "react";
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';
import "./Steps.css";

const Step2 = ({ values, onChange, shareClasses = [] }) => {

  // LOGIC: Sync Share Classes to Rules State
  // If a share class exists in the fund but not in this step's rules, add it (unselected).
  useEffect(() => {
    if (!values || !shareClasses.length) return;

    const currentRules = values.rules || {};
    let hasChanges = false;
    const newRules = { ...currentRules };

    // 1. Sync Rules
    shareClasses.forEach(sc => {
      if (!newRules[sc.share_class_id]) {
        hasChanges = true;
        newRules[sc.share_class_id] = {
          step_rule_id: null,
          share_class_name: sc.share_class_name,
          isSelected: false, // Default to unchecked for Hurdles
          isProRata: true,   // Hurdles are typically pro-rata among selected
          fixedPercentage: null
        };
      }
    });

    // 2. Ensure Envelopes are cleared (Step 2 has no envelopes)
    const hasEnvelopes = values.envelopes && values.envelopes.length > 0;

    if (hasChanges || hasEnvelopes) {
      onChange({ 
        ...values, 
        rules: newRules, 
        envelopes: [] // Force empty
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareClasses.length, Object.keys(values?.rules || {}).length]);

  // Handle Text/Number Inputs
  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  // Handle Checkbox Toggle
  const handleCheckboxChange = (shareClassId, checked) => {
    const existingRule = values.rules?.[shareClassId];
    
    onChange({
      ...values,
      rules: {
        ...values.rules,
        [shareClassId]: {
          ...existingRule,
          // Ensure we preserve the ID if it exists, or look it up
          share_class_name: existingRule?.share_class_name || shareClasses.find(sc => sc.share_class_id === shareClassId)?.share_class_name,
          isSelected: checked,
          // Force strict validation constraints for Step 2
          isProRata: true,
          fixedPercentage: null
        }
      }
    });
  };

  if (!values) return null;

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