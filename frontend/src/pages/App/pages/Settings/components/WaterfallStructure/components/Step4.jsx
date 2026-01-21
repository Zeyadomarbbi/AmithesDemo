// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/components/Step4.jsx
import React from "react";
import { PercentageIcon } from "../Icons";
import "./Steps.css"; 

const Step4 = ({ values, onChange, shareClasses = [] }) => {
  
  // 1. Handle Top-Level Input (Name)
  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  // 2. Handle Envelope Allocation Change
  const handleEnvelopeAllocationChange = (index, val) => {
    const newEnvelopes = [...values.envelopes];
    newEnvelopes[index] = { ...newEnvelopes[index], allocation: val };
    onChange({ ...values, envelopes: newEnvelopes });
  };

  // 3. Handle Checkbox Toggle
  const handleCheckboxChange = (envIndex, shareClassId, checked) => {
    const newEnvelopes = values.envelopes.map(e => ({...e, rules: {...e.rules}}));
    const targetEnv = newEnvelopes[envIndex];
    
    targetEnv.rules[shareClassId] = {
      ...targetEnv.rules[shareClassId],
      isSelected: checked,
      isProRata: true
    };

    onChange({ ...values, envelopes: newEnvelopes });
  };

  return (
    <div className="wf-card">
      <div className="wf-step-title">Step 4</div>

      <div className="wf-step-body">
        
        {values.envelopes.map((env, index) => (
          <React.Fragment key={index}>
            
            {/* Divider: Only show BEFORE Envelope 2 (index 1) */}
            {index === 1 && <div className="wf-divider" />}

            {/* COLUMN 1: Name (Only show for Envelope 1, index 0) */}
            <div className="wf-col-name">
              {index === 0 && (
                <>
                  <label className="wf-label">Name*</label>
                  <div className="wf-field-input">
                    <input 
                      type="text" 
                      className="wf-text-input-inner"
                      value={values.step_name} 
                      onChange={(e) => handleFieldChange("step_name", e.target.value)}
                      placeholder="Special return"
                    />
                  </div>
                </>
              )}
            </div>

            {/* COLUMN 2: Envelope Allocation */}
            <div className="wf-col-rate">
              <label className="wf-label">Enveloppe {index + 1}</label>
              <div className="wf-field-input wf-input-with-unit">
                <input 
                    type="number" 
                    className="wf-text-input-inner"
                    value={env.allocation} 
                    onChange={(e) => handleEnvelopeAllocationChange(index, e.target.value)}
                    placeholder="Ex: 80"
                />
                <PercentageIcon />
              </div>
            </div>

            {/* COLUMN 3: Share Class Checkboxes */}
            <div className="wf-col-classes">
              {shareClasses.map((sc) => {
                const isChecked = env.rules?.[sc.share_class_id]?.isSelected || false;
                return (
                  <div key={sc.share_class_id} className="wf-sc-group">
                    {/* Header Label: Only show for the first row to avoid repetition */}
                    <label 
                      className="wf-label" 
                    >
                      {sc.share_class_name}
                    </label>

                    <div className="wf-checkbox-container">
                      <input 
                        type="checkbox"
                        className="wf-checkbox-custom"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(index, sc.share_class_id, e.target.checked)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
          </React.Fragment>
        ))}

      </div>
    </div>
  );
};

export default Step4;