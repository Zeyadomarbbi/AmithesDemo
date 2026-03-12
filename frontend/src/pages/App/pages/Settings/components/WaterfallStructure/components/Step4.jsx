import React, { useEffect } from "react";
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';
import { noScroll } from '../../../../../../../components/disableNumberScroll'
import "./Steps.css";

const Step4 = ({ values, onChange, shareClasses = [] }) => {
  
  // LOGIC: Deep Sync for Envelopes
  useEffect(() => {
    if (!values || !shareClasses.length) return;

    // 1. Initialize Envelopes if missing (Default to 2 splits for Special Return)
    let currentEnvelopes = values.envelopes && values.envelopes.length > 0 
      ? values.envelopes 
      : [1, 2].map(num => ({ 
          id: null, 
          number: num, 
          allocation: "", 
          rules: {} 
        }));

    let hasChanges = false;

    // 2. Sync Rules INSIDE each Envelope
    const syncedEnvelopes = currentEnvelopes.map(env => {
      const newRules = { ...env.rules };
      let envChanged = false;

      shareClasses.forEach(sc => {
        if (!newRules[sc.share_class_id]) {
          envChanged = true;
          hasChanges = true;
          newRules[sc.share_class_id] = {
            envelope_rule_id: null,
            share_class_name: sc.share_class_name,
            isSelected: false,
            isProRata: true,
            fixedPercentage: null
          };
        }
      });
      return envChanged ? { ...env, rules: newRules } : env;
    });

    // 3. Check for invalid Top-Level data (Step 4 must NOT have rate or global rules)
    const hasGlobalRules = values.rules && Object.keys(values.rules).length > 0;
    const hasRate = values.step_rate !== null && values.step_rate !== "";

    if (hasChanges || !values.envelopes || values.envelopes.length === 0 || hasGlobalRules || hasRate) {
      onChange({
        ...values,
        envelopes: syncedEnvelopes,
        rules: {},        // Force Empty Global Rules
        step_rate: null   // Force Null Rate
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareClasses.length, values.envelopes?.length]); // Re-run if SC count or Envelope count changes

  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  const handleEnvelopeAllocationChange = (index, val) => {
    const newEnvelopes = values.envelopes.map((env, i) =>
      i === index ? { ...env, allocation: val } : env
    );
    onChange({ ...values, envelopes: newEnvelopes });
  };

  const handleCheckboxChange = (envIndex, shareClassId, checked) => {
    const newEnvelopes = values.envelopes.map((env, i) => {
      if (i !== envIndex) return env;
      
      const existingRule = env.rules?.[shareClassId];
      // Fallback lookup if rule didn't exist in state yet
      const scName = existingRule?.share_class_name || shareClasses.find(s => s.share_class_id === shareClassId)?.share_class_name;

      return {
        ...env,
        rules: {
          ...env.rules,
          [shareClassId]: {
            ...existingRule,
            share_class_name: scName,
            isSelected: checked,
            isProRata: true,
            fixedPercentage: null
          }
        }
      };
    });
    onChange({ ...values, envelopes: newEnvelopes });
  };

  if (!values || !values.envelopes) return null;

  return (
    <div className="wf-card">
      <div className="wf-step-title">Step 4</div>

      <div className="wf-step-body">
        {values.envelopes.map((env, index) => (
          <React.Fragment key={index}>
            
            {index > 0 && <div className="wf-divider" />}

            {/* COLUMN 1: Name (Only rendered for the first row) */}
            <div className="wf-col-name">
              {index === 0 && (
                <>
                  <label className="wf-label">Name*</label>
                  <div className="wf-field-input">
                    <input
                      type="text"
                      className="wf-text-input-inner"
                      value={values.step_name || ""}
                      onChange={(e) => handleFieldChange("step_name", e.target.value)}
                      placeholder="Special return"
                    />
                  </div>
                </>
              )}
            </div>

            {/* COLUMN 2: Envelope Allocation */}
            <div className="wf-col-rate">
              <label className="wf-label">
                Envelope {index + 1} %
              </label>
              <div className="wf-field-input wf-input-with-unit">
                <input
                  type="number"
                  onWheel={noScroll}
                  className="wf-text-input-inner"
                  value={env.allocation || ""}
                  onChange={(e) => handleEnvelopeAllocationChange(index, e.target.value)}
                  placeholder="Ex: 80"
                />
                <PercentageIcon />
              </div>
            </div>

            {/* COLUMN 3: Share Classes (Envelope-Specific Rules) */}
            <div className="wf-col-classes">
              {shareClasses.map(sc => {
                const rule = env.rules?.[sc.share_class_id];

                return (
                  <div key={sc.share_class_id} className="wf-sc-group">
                    <label className="wf-label">{sc.share_class_name}</label>
                    <div className="wf-checkbox-container">
                      <input
                        type="checkbox"
                        className="wf-checkbox-custom"
                        checked={!!rule?.isSelected}
                        onChange={(e) =>
                          handleCheckboxChange(index, sc.share_class_id, e.target.checked)
                        }
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