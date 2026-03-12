import React, { useEffect } from "react";
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';
import { noScroll } from '../../../../../../../components/disableNumberScroll'
import "./Steps.css";

const Step3 = ({ values, onChange, shareClasses = [] }) => {

  // LOGIC: Robust Sync for BOTH Global Rules and Envelope Rules
  useEffect(() => {
    if (!values || !shareClasses.length) return;

    let hasChanges = false;

    // 1. Sync Global Rules (Step Level)
    const currentRules = values.rules || {};
    const newGlobalRules = { ...currentRules };
    
    shareClasses.forEach(sc => {
      if (!newGlobalRules[sc.share_class_id]) {
        hasChanges = true;
        newGlobalRules[sc.share_class_id] = {
          step_rule_id: null,
          share_class_name: sc.share_class_name,
          isSelected: false,
          isProRata: true,
          fixedPercentage: null
        };
      }
    });

    // 2. Initialize Envelopes if completely missing (Default to 2: Catch-up & Residual)
    let currentEnvelopes = values.envelopes && values.envelopes.length > 0 
      ? values.envelopes 
      : [1, 2].map(num => ({ 
          id: null, 
          number: num, 
          allocation: "", 
          rules: {} 
        }));
    
    // If we had to create default envelopes, flag change
    if (!values.envelopes || values.envelopes.length === 0) hasChanges = true;

    // 3. Deep Sync Rules INSIDE Envelopes
    const syncedEnvelopes = currentEnvelopes.map(env => {
      const newEnvRules = { ...env.rules };
      let envChanged = false;

      shareClasses.forEach(sc => {
        if (!newEnvRules[sc.share_class_id]) {
          envChanged = true;
          hasChanges = true; // Flag main update
          newEnvRules[sc.share_class_id] = {
            envelope_rule_id: null,
            share_class_name: sc.share_class_name,
            isSelected: false,
            isProRata: true,
            fixedPercentage: null
          };
        }
      });
      return envChanged ? { ...env, rules: newEnvRules } : env;
    });

    // 4. Apply Updates if needed
    if (hasChanges) {
      onChange({
        ...values,
        rules: newGlobalRules,
        envelopes: syncedEnvelopes
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareClasses.length, values.envelopes?.length, Object.keys(values.rules || {}).length]);

  // --- Handlers ---

  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  const handleGlobalCheckboxChange = (shareClassId, checked) => {
    const existingRule = values.rules?.[shareClassId];
    // Fallback lookup
    const scName = existingRule?.share_class_name || shareClasses.find(sc => sc.share_class_id === shareClassId)?.share_class_name;
    
    onChange({
      ...values,
      rules: {
        ...values.rules,
        [shareClassId]: {
          ...existingRule,
          share_class_name: scName,
          isSelected: checked,
          isProRata: true,
          fixedPercentage: null
        }
      }
    });
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
      const scName = existingRule?.share_class_name || shareClasses.find(sc => sc.share_class_id === shareClassId)?.share_class_name;

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

  if (!values) return null;
  
  return (
    <div className="wf-card">
      <div className="wf-step-title">Step 3</div>

      <div className="wf-step-body">

        {/* ROW 1 — Step meta */}
        <div className="wf-col-name">
          <label className="wf-label">Name*</label>
          <div className="wf-field-input">
            <input
              type="text"
              className="wf-text-input-inner"
              value={values.step_name || ""}
              onChange={(e) =>
                handleFieldChange("step_name", e.target.value)
              }
              placeholder="Catch-up"
            />
          </div>
        </div>

        <div className="wf-col-rate">
          <label className="wf-label">% Hurdle*</label>
          <div className="wf-field-input wf-input-with-unit">
            <input
              type="number"
              onWheel={noScroll}
              className="wf-text-input-inner"
              value={values.step_rate || ""}
              onChange={(e) =>
                handleFieldChange("step_rate", e.target.value)
              }
              placeholder="Ex: 8"
            />
            <PercentageIcon />
          </div>
        </div>

        {/* Global Share Class Selection (Step-level rules) */}
        <div className="wf-col-classes">
          {shareClasses.map(sc => {
            const globalRule = values.rules?.[sc.share_class_id];
            return (
              <div key={sc.share_class_id} className="wf-sc-group">
                <label className="wf-label">
                  {sc.share_class_name}
                </label>
                <div className="wf-checkbox-container">
                  <input
                    type="checkbox"
                    className="wf-checkbox-custom"
                    checked={!!globalRule?.isSelected}
                    onChange={(e) =>
                      handleGlobalCheckboxChange(sc.share_class_id, e.target.checked)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Envelopes */}
        {values.envelopes.map((env, index) => (
          <React.Fragment key={index}>
            <div className="wf-divider" />

            <div className="wf-col-name" />

            <div className="wf-col-rate">
              <label className="wf-label">
                Envelope {index + 1}
              </label>
              <div className="wf-field-input wf-input-with-unit">
                <input
                  type="number"
                  onWheel={noScroll}
                  className="wf-text-input-inner"
                  value={env.allocation || ""}
                  onChange={(e) =>
                    handleEnvelopeAllocationChange(
                      index,
                      e.target.value
                    )
                  }
                  placeholder="Ex: 100"
                />
                <PercentageIcon />
              </div>
            </div>

            <div className="wf-col-classes">
              {shareClasses.map(sc => {
                const rule = env.rules?.[sc.share_class_id];

                return (
                  <div
                    key={sc.share_class_id}
                    className="wf-sc-group"
                  >
                    <label className="wf-label">
                      {sc.share_class_name}
                    </label>
                    <div className="wf-checkbox-container">
                      <input
                        type="checkbox"
                        className="wf-checkbox-custom"
                        checked={!!rule?.isSelected}
                        onChange={(e) =>
                          handleCheckboxChange(
                            index,
                            sc.share_class_id,
                            e.target.checked
                          )
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

export default Step3;