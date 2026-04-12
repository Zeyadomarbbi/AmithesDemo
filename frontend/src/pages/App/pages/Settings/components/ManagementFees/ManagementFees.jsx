// frontend/src/pages/App/pages/Settings/components/ManagementFees/ManagementFees.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useFundManagementFeeRules, useManagementFeePhases } from "../../../../hooks/Fund/useFundManagementFee.js"; 
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import Phase1 from "./components/Phase1";
import Phase2 from "./components/Phase2";
import PhasePPM from "./components/PhasePPM";
import Toast from "../../../../components/Toast/Toast.jsx";
import { PageSpinner, PageError, PageNoData } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
import "./ManagementFees.css";

const ManagementFees = () => {
  const { fundId } = useOutletContext();
  const [toast, setToast] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [initialState, setInitialState] = useState({ p1Rates: {}, p2Rate: "", p1From: null, p1Until: null, p2From: null });
  const [ppmDescription, setPpmDescription] = useState("");
  
  const { phases } = useManagementFeePhases();
  const { data: shareClasses, isLoading: shareClassesLoading, error: shareClassesError } = useShareClasses(fundId);
  const { fetchRules, createRule, updateRule, isLoading: isSaving } = useFundManagementFeeRules();

  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  const [phase1Data, setPhase1Data] = useState({ dateFrom: today, dateUntil: nextYear, rates: {} });
  const [phase2Data, setPhase2Data] = useState({ dateFrom: nextYear, rate: "" });
  const [phase1Ids, setPhase1Ids] = useState({}); 
  const [phase2Id, setPhase2Id] = useState(null);

  const loadData = useCallback(async () => {
    if (!fundId) return;
    try {
      const rules = await fetchRules(fundId);
      if (rules && rules.length > 0) {
        const p1Rules = rules.filter(r => r.phase === 1);
        const loadedRates = {};
        const loadedIds = {};

        if (p1Rules.length > 0) {
          const firstRule = p1Rules[0];
          p1Rules.forEach(r => {
            if(r.share_class) {
              loadedRates[r.share_class] = r.rate; 
              loadedIds[r.share_class] = r.fee_rule_id;       
            }
          });

          const p1From = new Date(firstRule.date_from);
          const p1Until = new Date(firstRule.date_until);

          setPhase1Data({ dateFrom: p1From, dateUntil: p1Until, rates: loadedRates });
          setPhase1Ids(loadedIds);
        }

        const p2Rule = rules.find(r => r.phase === 2);
        let p2Rate = "";
        let p2From = nextYear;
        if (p2Rule) {
          p2Rate = p2Rule.rate;
          p2From = new Date(p2Rule.date_from);
          setPhase2Data({ dateFrom: p2From, rate: p2Rate });
          setPhase2Id(p2Rule.fee_rule_id); 
        }

        // 2. Capture initial state for diffing
        setInitialState({
          p1Rates: loadedRates,
          p2Rate: p2Rate,
          p1From: p1Rules[0]?.date_from || null,
          p1Until: p1Rules[0]?.date_until || null,
          p2From: p2Rule?.date_from || null
        });
      }
    } catch (err) {
      setInitError(err.message || "Failed to load management fee rules");
    } finally {
      setIsInitialLoading(false);
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

  const changeTracker = useMemo(() => {
    const changes = [];
    const formatDate = (d) => d instanceof Date ? d.toISOString().split('T')[0] : d;

    // Check Phase 1 Dates
    if (formatDate(phase1Data.dateFrom) !== initialState.p1From) changes.push("p1From");
    if (formatDate(phase1Data.dateUntil) !== initialState.p1Until) changes.push("p1Until");

    // Check Phase 1 Rates (per share class)
    if (shareClasses) {
      shareClasses.forEach(sc => {
        const currentRate = phase1Data.rates[sc.share_class_id];
        const initialRate = initialState.p1Rates[sc.share_class_id];
        
        // Handle undefined/empty string vs number normalization
        const normCurrent = (currentRate === "" || currentRate === undefined) ? null : parseFloat(currentRate);
        const normInitial = (initialRate === "" || initialRate === undefined) ? null : parseFloat(initialRate);
        
        if (normCurrent !== normInitial) {
          changes.push(`sc_${sc.share_class_id}`);
        }
      });
    }

    // Check Phase 2
    if (formatDate(phase2Data.dateFrom) !== initialState.p2From) changes.push("p2From");
    const p2Curr = (phase2Data.rate === "" || phase2Data.rate === undefined) ? null : parseFloat(phase2Data.rate);
    const p2Init = (initialState.p2Rate === "" || initialState.p2Rate === undefined) ? null : parseFloat(initialState.p2Rate);
    if (p2Curr !== p2Init) changes.push("p2Rate");

    return {
      hasChanges: changes.length > 0,
      count: changes.length
    };
  }, [phase1Data, phase2Data, initialState, shareClasses]);

  const canSave = !isSaving && changeTracker.hasChanges;
  if (shareClassesLoading || isInitialLoading) return <PageSpinner label="Loading management fees..." />;
  if (shareClassesError || initError) return <PageError message={shareClassesError || initError} />;
  if (!shareClasses || shareClasses.length === 0) {
    return <PageNoData message="In order to set Management Fees, Share Classes must be initiated." />;
  }

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
            disabled={!canSave}
          >
            {isSaving 
              ? "Saving..." 
              : changeTracker.hasChanges 
                ? `Save (${changeTracker.count})` 
                : "Save"
            }
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