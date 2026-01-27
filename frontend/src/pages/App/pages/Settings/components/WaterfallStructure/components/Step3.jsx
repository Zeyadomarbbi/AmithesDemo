import React from "react";
import { PercentageIcon } from "../Icons";
import "./Steps.css";

const Step3 = ({ values, onChange, shareClasses = [] }) => {

  // Top-level fields (step_name, step_rate)
  const handleFieldChange = (field, val) => {
    onChange({ ...values, [field]: val });
  };

  // NEW: Global Checkbox toggle — Updates the root "rules" object
  const handleGlobalCheckboxChange = (shareClassId, checked) => {
    onChange({
      ...values,
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

  // Envelope allocation
  const handleEnvelopeAllocationChange = (index, val) => {
    const newEnvelopes = values.envelopes.map((env, i) =>
      i === index ? { ...env, allocation: val } : env
    );

    onChange({ ...values, envelopes: newEnvelopes });
  };

  // Checkbox toggle — ENVELOPE ONLY
  const handleCheckboxChange = (envIndex, shareClassId, checked) => {
    const newEnvelopes = values.envelopes.map((env, i) => {
      if (i !== envIndex) return env;

      return {
        ...env,
        rules: {
          ...env.rules,
          [shareClassId]: {
            ...env.rules?.[shareClassId],
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
                const rule =
                  env.rules?.[sc.share_class_id];

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