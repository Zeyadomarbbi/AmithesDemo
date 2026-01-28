// frontend/src/pages/App/pages/Settings/components/ManagementFees/ManagementFees.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useFundManagementFeeRules, useManagementFeePhases } from "../../../../hooks/Fund/useFundManagementFee.js"; // Check this path
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

  // --- State for Rule IDs (to track updates vs creates) ---
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
              // FIX 1: Read 'rate' instead of 'rate_percentage' (matches Serializer)
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

        // --- Process Phase 2 ---
        const p2Rule = rules.find(r => r.phase === 2);
        if (p2Rule) {
          setPhase2Data({
            dateFrom: new Date(p2Rule.date_from),
            // FIX 1: Read 'rate'
            rate: p2Rule.rate
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
          
          if (rate !== undefined && rate !== "") {
             // FIX 2: Construct payload with snake_case keys for Django
             const payload = {
                phase: 1,
                share_class: sc.share_class_id,
                date_from: formatDate(phase1Data.dateFrom),
                date_until: formatDate(phase1Data.dateUntil),
                rate: parseFloat(rate) // Serializer expects 'rate'
             };

             if (existingId) {
                // FIX 3: Pass fundId as first arg, ruleId as second, payload as third
                saveRequests.push(updateRule(fundId, existingId, payload));
             } else {
                // FIX 3: Pass fundId as first arg, payload as second
                saveRequests.push(createRule(fundId, payload));
             }
          }
        });
      }

      // --- Phase 2: Single Rule ---
      if (phase2Data.rate !== undefined && phase2Data.rate !== "") {
         const payload = {
            phase: 2,
            share_class: null, // Explicitly null for Phase 2
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

      console.log("Processing requests...", saveRequests.length);
      await Promise.all(saveRequests);
      
      // Optional: Refetch to sync IDs instead of reloading
      const freshRules = await fetchRules(fundId);
      // Logic to update IDs from freshRules could go here...
      
      alert("Management fees saved successfully.");
      // Using reload is okay for MVP to ensure clean state
      window.location.reload(); 

    } catch (err) {
      console.error(err);
      // Extract specific error message if available
      const msg = err.message || JSON.stringify(err);
      alert("Failed to save: " + msg);
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