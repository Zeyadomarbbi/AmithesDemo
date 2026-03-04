// frontend/src/pages/App/pages/Settings/components/ManagementFees/components/Phase2.jsx
import React from "react";
import DateInputWithPicker from "../../../../../../../components/DateComponents/DateInput.jsx"; 
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';
import "./Phase.css";

const Phase2 = ({ phaseName, values, onChange }) => {

  const handleRateChange = (e) => {
    onChange({ ...values, rate: e.target.value });
  };

  return (
    <div className="mgmt-card">
      <div className="mgmt-phase-title">Phase 2</div>
      <div className="mgmt-phase-body">
        <div className="mgmt-left-container">
          <div className="mgmt-field-input static-field">
            {phaseName}
          </div>
        </div>

        <div className="mgmt-meta-row">
          {/* From Date - Disabled & Synced from Phase 1 */}
          <div className="mgmt-meta-item">
            <div className="mgmt-meta-label">From</div>
            <div className="mgmt-date-wrapper mgmt-disabled">
              <DateInputWithPicker
                // values.dateFrom is now a Date object from parent, so pass directly
                initialDate={values.dateFrom} 
                isSingle={true}
                dateFormat="DD/MM/YYYY"
                disabled={true}
              />
            </div>
          </div>

          <div className="mgmt-meta-item">
            <div className="mgmt-meta-label">Until</div>
            <div className="mgmt-date-input static-value">
               <span className="mgmt-date-input-inner">Last deal exited</span>
            </div>
          </div>

          <div className="mgmt-meta-item">
            <div className="mgmt-meta-label">Rate</div>
            <div className="mgmt-date-input">
              <input
                type="number"
                className="mgmt-date-input-inner"
                value={values.rate}
                onChange={handleRateChange}
                placeholder="Ex: 8"
              />
              <PercentageIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase2;