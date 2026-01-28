import React, { useEffect } from "react";
import "./Steps.css"; 

const Step1 = ({ values, onChange, shareClasses = [] }) => {
  
  // LOGIC: Ensure State has "Implicit" Rules for every Share Class
  // Even though the user can't edit them, the backend needs them to know
  // that these share classes are participating.
  useEffect(() => {
    if (!values || !shareClasses.length) return;

    const currentRules = values.rules || {};
    const missingRules = shareClasses.some(sc => !currentRules[sc.share_class_id]);
    const missingRate = !values.step_rate;

    // Only update if data is missing to prevent infinite loops
    if (missingRules || missingRate) {
      const newRules = { ...currentRules };
      
      shareClasses.forEach(sc => {
        // If rule doesn't exist, create the "Fixed Pro Rata" rule
        if (!newRules[sc.share_class_id]) {
          newRules[sc.share_class_id] = {
            step_rule_id: null, // New rule
            share_class_name: sc.share_class_name,
            isSelected: true,   // Always selected
            isProRata: true,    // Always Pro Rata
            fixedPercentage: null
          };
        }
      });

      onChange({
        ...values,
        step_rate: values.step_rate || 100, // Default to 100% if empty
        rules: newRules,
      });
    }
    // DEPENDENCIES: Only re-run if share class count changes or rules length changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareClasses.length, Object.keys(values?.rules || {}).length]);

  if (!values) return null;

  return (
    <div className="wf-card">
      <div className="wf-step-title">Step 1</div>
      <div className="wf-step-body">

        {/* COLUMN 1: Name */}
        <div className="wf-col-name">
          <label className="wf-label">Name*</label>
          <div className="wf-field-input">
            <input 
              type="text" 
              className="wf-text-input-inner"
              value={values.step_name || ""} 
              onChange={(e) => onChange({ ...values, step_name: e.target.value })}
              placeholder="Nominal repayment"
            />
          </div>
        </div>

        {/* COLUMN 2: Rate (Static 100%) */}
        <div className="wf-col-rate">
        </div>

        {/* COLUMN 3: Share Classes (Visual Representation of Global Rules) */}
        <div className="wf-col-classes">
          {shareClasses.map((sc) => (
            <div key={sc.share_class_id} className="wf-sc-group">
              <label className="wf-label">{sc.share_class_name}</label>
              <div className="wf-static-input-box">
                <span className="wf-static-inner">Pro Rata</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Step1;