import React, { useEffect } from "react";
import "./Steps.css"; 

const Step1 = ({ values, onChange, shareClasses = [] }) => {

  // Initialize Step 1: Force Global Rules and Empty Envelopes
  useEffect(() => {
    const hasNoRules = !values.rules || Object.keys(values.rules).length === 0;
    const hasEnvelopes = values.envelopes && values.envelopes.length > 0;

    if (hasNoRules || hasEnvelopes) {
      const globalRules = {};
      
      shareClasses.forEach(sc => {
        globalRules[sc.share_class_id] = {
          step_rule_id: null,
          share_class_name: sc.share_class_name,
          isSelected: true,
          isProRata: true,
          fixedPercentage: 100
        };
      });

      onChange({
        ...values,
        step_rate: 100,
        rules: globalRules,
        envelopes: []
      });
    }
  }, [shareClasses, values, onChange]);

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