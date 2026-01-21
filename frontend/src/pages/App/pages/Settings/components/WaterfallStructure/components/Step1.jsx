// frontend/src/pages/App/pages/Settings/components/WaterfallStructure/components/Step1.jsx
import React from "react";
import "./Steps.css"; 

const Step1 = ({ values, onChange, shareClasses = [] }) => {
  
  const handleNameChange = (e) => {
    onChange({ ...values, name: e.target.value });
  };

  return (
    <div className="wf-card">
      <div className="wf-step-title">Step 1</div>

      <div className="wf-step-body">
        {/* Left Side: Name Input (mimicking the Left Container of Phase 2) */}
        <div className="wf-left-container">
          {/* We add a label here since this is an editable input, unlike the static text in Phase 2 */}
          <div className="wf-meta-label" style={{ marginBottom: "0.5rem" }}>Name*</div>
          <div className="wf-field-input">
             <input 
               type="text" 
               className="wf-text-input-inner"
               value={values.name} 
               onChange={handleNameChange}
               placeholder="Nominal repayment"
             />
          </div>
        </div>

        {/* Right Side: Share Classes Grid */}
        <div className="wf-meta-row">
          {shareClasses.map((sc) => (
            <div key={sc.share_class_id} className="wf-meta-item">
              <div className="wf-meta-label">{sc.share_class_name}</div>
              
              {/* Static "Pro Rata" Box styled to look like the inputs */}
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