// frontend/src/pages/App/pages/Settings/components/ManagementFees/ManagementFees.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useFundManagementFeeRules, useManagementFeePhases } from "../../../../hooks/Fund/useFundManagementFee.js"; 
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import Phase1 from "./components/Phase1";
import Phase2 from "./components/Phase2";
import Toast from "../../../../components/Toast/Toast.jsx"; // Import Toast
import "./ManagementFees.css";

const ManagementFees = () => {
  const { fundId } = useOutletContext();
  const [toast, setToast] = useState(null); // Toast state
  const { phases } = useManagementFeePhases();
  const { data: shareClasses, isLoading: shareClassesLoading } = useShareClasses(fundId);
  const { fetchRules, createRule, updateRule, isLoading: isSaving } = useFundManagementFeeRules();

  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  const [phase1Data, setPhase1Data] = useState({
    dateFrom: today,
    dateUntil: nextYear,
    rates: {} 
  });

  const [phase2Data, setPhase2Data] = useState({
    dateFrom: nextYear,
    rate: ""
  });

  const [phase1Ids, setPhase1Ids] = useState({}); 
  const [phase2Id, setPhase2Id] = useState(null); 

  // Abstracted load logic so we can call it after saving
  const loadData = useCallback(async () => {
    if (!fundId) return;
    const rules = await fetchRules(fundId);
    
    if (rules && rules.length > 0) {
      const p1Rules = rules.filter(r => r.phase === 1);
      
      if (p1Rules.length > 0) {
        const firstRule = p1Rules[0];
        const loadedRates = {};
        const loadedIds = {};

        p1Rules.forEach(r => {
          if(r.share_class) {
            loadedRates[r.share_class] = r.rate; 
            loadedIds[r.share_class] = r.fee_rule_id;       
          }
        });

        setPhase1Data({
          dateFrom: new Date(firstRule.date_from),
          dateUntil: new Date(firstRule.date_until),
          rates: loadedRates
        });
        setPhase1Ids(loadedIds);
      }

      const p2Rule = rules.find(r => r.phase === 2);
      if (p2Rule) {
        setPhase2Data({
          dateFrom: new Date(p2Rule.date_from),
          rate: p2Rule.rate
        });
        setPhase2Id(p2Rule.fee_rule_id); 
      }
    }
  }, [fundId, fetchRules]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePhase1Change = (newData) => {
    setPhase1Data(newData);
    if (newData.dateUntil && phase1Data.dateUntil && newData.dateUntil.getTime() !== phase1Data.dateUntil.getTime()) {
      setPhase2Data((prev) => ({ ...prev, dateFrom: newData.dateUntil }));
    }
  };

  const handleSave = async () => {
    try {
      const saveRequests = [];
      const formatDate = (d) => d ? d.toISOString().split('T')[0] : null;

      if (shareClasses) {
        shareClasses.forEach(sc => {
          const rate = phase1Data.rates[sc.share_class_id];
          const existingId = phase1Ids[sc.share_class_id]; 
          
          if (rate !== undefined && rate !== "") {
             const payload = {
                phase: 1,
                share_class: sc.share_class_id,
                date_from: formatDate(phase1Data.dateFrom),
                date_until: formatDate(phase1Data.dateUntil),
                rate: parseFloat(rate)
             };

             if (existingId) {
                saveRequests.push(updateRule(fundId, existingId, payload));
             } else {
                saveRequests.push(createRule(fundId, payload));
             }
          }
        });
      }

      if (phase2Data.rate !== undefined && phase2Data.rate !== "") {
         const payload = {
            phase: 2,
            share_class: null,
            date_from: formatDate(phase2Data.dateFrom),
            date_until: null,
            rate: parseFloat(phase2Data.rate)
         };

         if (phase2Id) {
            saveRequests.push(updateRule(fundId, phase2Id, payload));
         } else {
            saveRequests.push(createRule(fundId, payload));
         }
      }

      await Promise.all(saveRequests);
      
      // Sync fresh IDs and data without page reload
      await loadData();
      
      setToast({
        type: "success",
        title: "Fees Saved",
        message: "Management fee rules have been successfully updated."
      });

    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        title: "Save Failed",
        message: err.message || "An error occurred while saving fee rules."
      });
    }
  };

  return (
    <div className="mgmt-wrapper">
      <div className="mgmt-content">
        <Phase1
          phaseName="Commitment"
          shareClasses={shareClasses}
          isLoading={shareClassesLoading}
          values={phase1Data}
          onChange={handlePhase1Change}
        />
        
        <Phase2 
          phaseName="Cost" 
          values={phase2Data}
          onChange={setPhase2Data}
        />
      </div>
      <div className="mgmt-footer">
        <div className="mgmt-actions">
          <button 
            className="mgmt-btn-save" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ManagementFees;