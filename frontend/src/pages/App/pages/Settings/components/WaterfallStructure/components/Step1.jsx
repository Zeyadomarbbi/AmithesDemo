// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/components/Step1.jsx
import React from "react";
import "./Steps.css"; 

const Step1 = ({ values, onChange, shareClasses = [] }) => {

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
               value={values.step_name} 
               onChange={(e) => onChange({ ...values, step_name: e.target.value })}
               placeholder="Nominal repayment"
             />
          </div>
        </div>

        {/* COLUMN 2: Rate (Empty in Step 1, but kept for alignment) */}
        <div className="wf-col-rate">
           {/* Placeholder to maintain grid structure */}
        </div>

        {/* COLUMN 3: Share Classes */}
        <div className="wf-col-classes">
          {shareClasses.map((sc) => (
            <div key={sc.share_class_id} className="wf-sc-group">
              <label className="wf-label">{sc.share_class_name}</label>
              
              {/* Static "Pro Rata" Box */}
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