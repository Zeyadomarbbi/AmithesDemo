import React from "react";
import { PercentageIcon } from "../Icons";
import "./Steps.css";

const Step4 = ({ values, onChange, shareClasses = [] }) => {

  // Step name and ensure step_rate is null for this type
  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val, step_rate: null });
  };

  // Envelope allocation mapping
  const handleEnvelopeAllocationChange = (index, val) => {
    const newEnvelopes = values.envelopes.map((env, i) =>
      i === index ? { ...env, allocation: val } : env
    );
    onChange({ ...values, envelopes: newEnvelopes });
  };

  // Checkbox toggle — scoped to specific envelope dictionary
  const handleCheckboxChange = (envIndex, shareClassId, checked) => {
    const newEnvelopes = values.envelopes.map((env, i) => {
      if (i !== envIndex) return env;

      return {
        ...env,
        rules: {
          ...env.rules,
          [shareClassId]: {
            isSelected: checked,
            isProRata: true,
            fixedPercentage: null
          }
        }
      };
    });

    onChange({ ...values, envelopes: newEnvelopes });
  };

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