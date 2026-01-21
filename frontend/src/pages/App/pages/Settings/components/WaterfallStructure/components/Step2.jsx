// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/components/Step2.jsx
import React from "react";
import { PercentageIcon } from "../Icons"; // Ensure correct import path
import "./Steps.css"; 

const Step2 = ({ values, onChange, shareClasses = [] }) => {
  
  // 1. Handle Top-Level Input (Name, Rate)
  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  // 2. Handle Checkbox Toggle
  // Even though Step 2 has no visible "Envelopes", we store the selection 
  // inside 'Envelope 1' (index 0) to satisfy the backend data model.
  const handleCheckboxChange = (shareClassId, checked) => {
    // Deep copy envelopes to avoid mutating state directly
    const newEnvelopes = values.envelopes.map(e => ({...e, rules: {...e.rules}}));
    const env1 = newEnvelopes[0]; // Target Envelope 1
    
    // Update the specific rule
    env1.rules[shareClassId] = {
      ...env1.rules[shareClassId],
      isSelected: checked,
      isProRata: true // Default to Pro Rata for Step 2 logic
    };

    onChange({ ...values, envelopes: newEnvelopes });
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
               value={values.step_name} 
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
               value={values.hurdle_rate} 
               onChange={(e) => handleFieldChange("hurdle_rate", e.target.value)}
               placeholder="Ex: 8"
             />
             <PercentageIcon />
          </div>
        </div>

        {/* COLUMN 3: Share Classes (Checkboxes) */}
        {/* This uses the same CSS class as Step 3, so it will auto-scroll if needed */}
        <div className="wf-col-classes">
          {shareClasses.map((sc) => {
             // Check if rule exists and is selected in Envelope 1
             const isChecked = values.envelopes[0]?.rules[sc.share_class_id]?.isSelected || false;

             return (
              <div key={sc.share_class_id} className="wf-sc-group">
                <label className="wf-label">{sc.share_class_name}</label>
                
                {/* Custom Checkbox Wrapper */}
                <div className="wf-checkbox-container">
                  <input 
                    type="checkbox"
                    className="wf-checkbox-custom"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(sc.share_class_id, e.target.checked)}
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