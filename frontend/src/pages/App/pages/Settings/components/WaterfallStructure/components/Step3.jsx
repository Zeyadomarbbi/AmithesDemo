// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/components/Step3.jsx
import React from "react";
import { PercentageIcon } from "../Icons";
import "./Steps.css"; 

const Step3 = ({ values, onChange, shareClasses = [] }) => {
  
  // 1. Handle Top-Level Input (Name, Rate)
  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  // 2. Handle Envelope Allocation Change (Rate column for envelopes)
  const handleEnvelopeAllocationChange = (index, val) => {
    const newEnvelopes = [...values.envelopes];
    newEnvelopes[index] = { ...newEnvelopes[index], allocation: val };
    onChange({ ...values, envelopes: newEnvelopes });
  };

  // 3. Handle Checkbox Toggle
    const handleCheckboxChange = (envIndex, shareClassId, checked) => {
    if (envIndex === -1) {
        // Top-level rule
        onChange({
        ...values,
        rules: {
            ...values.rules,
            [shareClassId]: {
            ...values.rules?.[shareClassId],
            isSelected: checked,
            isProRata: true
            }
        }
        });
    } else {
        // Envelope-level rule
        const newEnvelopes = values.envelopes.map(e => ({...e, rules: {...e.rules}}));
        const targetEnv = newEnvelopes[envIndex];
        
        targetEnv.rules[shareClassId] = {
        ...targetEnv.rules[shareClassId],
        isSelected: checked,
        isProRata: true
        };

        onChange({ ...values, envelopes: newEnvelopes });
    }
    };

  return (
    <div className="wf-card">
      <div className="wf-step-title">Step 3</div>

      <div className="wf-step-body">
        
        {/* ======================= ROW 1: Main Info ======================= */}

        {/* COLUMN 1: Name */}
        <div className="wf-col-name">
          <label className="wf-label">Name*</label>
          <div className="wf-field-input">
             <input 
               type="text" 
               className="wf-text-input-inner"
               value={values.step_name} 
               onChange={(e) => handleFieldChange("step_name", e.target.value)}
               placeholder="Catch-up"
             />
          </div>
        </div>

        {/* COLUMN 2: Global Rate (% Hurdle) */}
        <div className="wf-col-rate">
          <label className="wf-label">% Hurdle*</label>
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

        {/* COLUMN 3: Share Class HEADERS (Names only) */}
        <div className="wf-col-classes">
          {shareClasses.map((sc) => {
             // Check if rule exists and is selected in Envelope 1
             const isChecked = values.rules?.[sc.share_class_id]?.isSelected || false;
             return (
              <div key={sc.share_class_id} className="wf-sc-group">
                <label className="wf-label">{sc.share_class_name}</label>
                
                {/* Custom Checkbox Wrapper */}
                <div className="wf-checkbox-container">
                  <input 
                    type="checkbox"
                    className="wf-checkbox-custom"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(-1, sc.share_class_id, e.target.checked)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================= ROW 2 & 3: Envelopes ======================= */}

        {values.envelopes.map((env, index) => (
          <React.Fragment key={index}>
            <div className="wf-divider" />

            {/* COLUMN 1: Envelope Label (Aligned with Name column) */}
            <div className="wf-col-name">

            </div>

            {/* COLUMN 2: Envelope Allocation (The Rate Input instance) */}
            <div className="wf-col-rate">
            <label className="wf-label">Enveloppe {index + 1}</label>
              <div className="wf-field-input wf-input-with-unit">
                <input 
                    type="number" 
                    className="wf-text-input-inner"
                    value={env.allocation} 
                    onChange={(e) => handleEnvelopeAllocationChange(index, e.target.value)}
                    placeholder="Ex: 100"
                />
                <PercentageIcon />
              </div>
            </div>

            {/* COLUMN 3: Checkboxes (Aligned under Class Headers) */}
            <div className="wf-col-classes">
            {shareClasses.map((sc) => {
                // Check if rule exists and is selected in Envelope 1
                const isChecked = env.rules?.[sc.share_class_id]?.isSelected || false;
                return (
                <div key={sc.share_class_id} className="wf-sc-group">
                    <label className="wf-label">{sc.share_class_name}</label>
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

export default Step3;