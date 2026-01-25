// frontend/src/pages/App/pages/Settings/components/ManagementFees/ManagementFees.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useManagementFeePhases } from "../../../../hooks/FundManFee/useFundManFeePhases.js";
import { useFundManagementFeeRules } from "../../../../hooks/FundManFee/useFundManFeeRules.js";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import Phase1 from "./components/Phase1";
import Phase2 from "./components/Phase2";
import "./ManagementFees.css";

const ManagementFees = () => {
  const { fundId } = useOutletContext();
  const { phases } = useManagementFeePhases();
  const { data: shareClasses, isLoading: shareClassesLoading } = useShareClasses(fundId);
  const { fetchRules, createRule, updateRule, isLoading: isSaving } = useFundManagementFeeRules();

  // --- Date Defaults ---
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  // --- State for Data Values ---
  const [phase1Data, setPhase1Data] = useState({
    dateFrom: today,
    dateUntil: nextYear,
    rates: {} 
  });

  const [phase2Data, setPhase2Data] = useState({
    dateFrom: nextYear,
    rate: ""
  });

  // --- State for Rule IDs ---
  const [phase1Ids, setPhase1Ids] = useState({}); 
  const [phase2Id, setPhase2Id] = useState(null); 

  // --- 1. Load Data on Mount ---
  useEffect(() => {
    if (!fundId) return;

    const loadData = async () => {
      const rules = await fetchRules(fundId);
      
      if (rules && rules.length > 0) {
        // --- Process Phase 1 ---
        const p1Rules = rules.filter(r => r.phase === 1);
        
        if (p1Rules.length > 0) {
          const firstRule = p1Rules[0];
          const loadedRates = {};
          const loadedIds = {};

          p1Rules.forEach(r => {
            if(r.share_class) {
              loadedRates[r.share_class] = r.rate_percentage; 
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

        // --- Process Phase 2 ---
        const p2Rule = rules.find(r => r.phase === 2);
        if (p2Rule) {
          setPhase2Data({
            dateFrom: new Date(p2Rule.date_from),
            rate: p2Rule.rate_percentage
          });
          setPhase2Id(p2Rule.fee_rule_id); 
        }
      }
    };
    loadData();
  }, [fundId, fetchRules]);

  // --- 2. Handlers ---
  const handlePhase1Change = (newData) => {
    setPhase1Data(newData);
    // Sync Phase 2 Date if Phase 1 Until changes
    if (newData.dateUntil && phase1Data.dateUntil && newData.dateUntil.getTime() !== phase1Data.dateUntil.getTime()) {
      setPhase2Data((prev) => ({ ...prev, dateFrom: newData.dateUntil }));
    }
  };

  // --- 3. Save Logic (Upsert) ---
  const handleSave = async () => {
    try {
      const saveRequests = [];
      const formatDate = (d) => d ? d.toISOString().split('T')[0] : null;

      // --- Phase 1: Loop Share Classes ---
      if (shareClasses) {
        shareClasses.forEach(sc => {
          const rate = phase1Data.rates[sc.share_class_id];
          const existingId = phase1Ids[sc.share_class_id]; 
          
          if (rate) {
             const payload = {
                phaseId: 1,
                shareClassId: sc.share_class_id,
                dateFrom: formatDate(phase1Data.dateFrom),
                dateUntil: formatDate(phase1Data.dateUntil),
                ratePercentage: parseFloat(rate)
             };

             if (existingId) {
                // UPDATE Phase 1
                saveRequests.push(updateRule(existingId, { ...payload, fundId }));
             } else {
                // CREATE Phase 1
                saveRequests.push(createRule({ ...payload, fundId }));
             }
          }
        });
      }

      // --- Phase 2: Single Rule ---
      if (phase2Data.rate) {
         const payload = {
            phaseId: 2,
            shareClassId: null,
            dateFrom: formatDate(phase2Data.dateFrom),
            dateUntil: null,
            ratePercentage: parseFloat(phase2Data.rate)
         };

         if (phase2Id) {
            // FIXED: Use phase2Id here, NOT existingId
            saveRequests.push(updateRule(phase2Id, { ...payload, fundId }));
         } else {
            // CREATE Phase 2
            saveRequests.push(createRule({ ...payload, fundId }));
         }
      }

      console.log("Processing requests...", saveRequests.length);
      await Promise.all(saveRequests);
      
      alert("Management fees saved successfully.");
      window.location.reload(); 

    } catch (err) {
      console.error(err);
      alert("Failed to save: " + err.message);
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
    </div>
  );
};

export default ManagementFees;