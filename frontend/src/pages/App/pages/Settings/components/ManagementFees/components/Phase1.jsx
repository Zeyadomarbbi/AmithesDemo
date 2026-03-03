// frontend/src/pages/App/pages/Settings/components/ManagementFees/components/Phase1.jsx
import React from "react";
import DateInputWithPicker from "../../../../../../../components/DateComponents/DateInput.jsx"; 
import { PercentageIcon } from "../../../../Scenario/components/ScenarioList/Details/components/Portfolio/Icons.jsx";
import "./Phase.css";

const Phase1 = ({ phaseName, shareClasses = [], isLoading, values, onChange }) => {

  const handleDateChange = (field, newDate) => {
    onChange({ ...values, [field]: newDate });
  };

  const handleRateChange = (scId, val) => {
    const updatedRates = { ...values.rates, [scId]: val };
    onChange({ ...values, rates: updatedRates });
  };

  return (
    <div className="mgmt-card">
      <div className="mgmt-phase-title">Phase 1</div>
      <div className="mgmt-phase-body">
        {/* Left Side: Static Field */}
        <div className="mgmt-left-container">
          <div className="mgmt-field-input static-field">
            {phaseName}
          </div>
        </div>

        <div className="mgmt-meta-row">
          {isLoading ? (
            <div className="mgmt-loading-text">Loading share classes...</div>
          ) : (
            <>
              {/* 1. Date From */}
              <div className="mgmt-meta-item">
                <div className="mgmt-meta-label">From</div>
                <div className="mgmt-date-wrapper">
                  <DateInputWithPicker
                    initialDate={values.dateFrom}
                    onDateChange={(date) => handleDateChange('dateFrom', date)}
                    isSingle={true}
                    dateFormat="DD/MM/YYYY"
                  />
                </div>
              </div>

              {/* 2. Date Until */}
              <div className="mgmt-meta-item">
                <div className="mgmt-meta-label">Until</div>
                <div className="mgmt-date-wrapper">
                  <DateInputWithPicker
                    initialDate={values.dateUntil}
                    onDateChange={(date) => handleDateChange('dateUntil', date)}
                    isSingle={true}
                    dateFormat="DD/MM/YYYY"
                  />
                </div>
              </div>

              {/* 3. Share Classes Loop */}
              {shareClasses.map((sc) => (
                <div key={sc.share_class_id} className="mgmt-meta-item">
                  <div className="mgmt-meta-label">{sc.share_class_name}</div>
                  <div className="mgmt-date-input">
                    <input
                      type="number"
                      className="mgmt-date-input-inner"
                      value={values.rates[sc.share_class_id] || ""}
                      onChange={(e) => handleRateChange(sc.share_class_id, e.target.value)}
                      placeholder="Ex: 8"
                    />
                    <PercentageIcon />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Phase1;