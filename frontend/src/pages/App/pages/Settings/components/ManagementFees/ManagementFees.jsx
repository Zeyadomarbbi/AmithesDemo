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
  const [initialState, setInitialState] = useState(null);
  const [ppmDescription, setPpmDescription] = useState("");

  const { phases } = useManagementFeePhases();
  const { data: shareClasses, isLoading: shareClassesLoading, error: shareClassesError } = useShareClasses(fundId);
  const { fetchRules, createRule, updateRule, bulkSaveRules, isLoading: isSaving } = useFundManagementFeeRules();

  // Stabilize base dates to prevent dependency array loops
  const { today, nextYear } = useMemo(() => {
    const t = new Date();
    const ny = new Date();
    ny.setFullYear(t.getFullYear() + 1);
    return { today: t, nextYear: ny };
  }, []);

  const [phase1Data, setPhase1Data] = useState({ dateFrom: today, dateUntil: nextYear, rates: {} });
  const [phase2Data, setPhase2Data] = useState({ dateFrom: nextYear, rate: "" });
  const [phase1Ids, setPhase1Ids] = useState({});
  const [phase2Id, setPhase2Id] = useState(null);

  const formatDate = (d) => d instanceof Date ? d.toISOString().split('T')[0] : (d || null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!fundId) return;
    try {
      if (!isRefresh) setIsInitialLoading(true);
      const rules = await fetchRules(fundId);
      
      // Setup exact defaults
      let p1From = today;
      let p1Until = nextYear;
      let p1Rates = {};
      let p1Ids = {};
      
      let p2From = nextYear;
      let p2Rate = "";
      let p2Desc = "";
      let p2RuleId = null;

      // Hydrate with server data if available
      if (rules && rules.length > 0) {
        const p1Rules = rules.filter(r => r.phase === 1);
        if (p1Rules.length > 0) {
          p1From = new Date(p1Rules[0].date_from);
          p1Until = new Date(p1Rules[0].date_until);
          p1Rules.forEach(r => {
            if (r.share_class) {
              p1Rates[r.share_class] = r.rate;
              p1Ids[r.share_class] = r.fee_rule_id;
            }
          });
        }

        const p2Rule = rules.find(r => r.phase === 2);
        if (p2Rule) {
          p2From = new Date(p2Rule.date_from);
          p2Rate = p2Rule.rate;
          p2Desc = p2Rule.ppm_description || "";
          p2RuleId = p2Rule.fee_rule_id;
        }
      }

      // 1. Set Live State
      setPhase1Data({ dateFrom: p1From, dateUntil: p1Until, rates: p1Rates });
      setPhase1Ids(p1Ids);
      setPhase2Data({ dateFrom: p2From, rate: p2Rate });
      setPhase2Id(p2RuleId);
      setPpmDescription(p2Desc);

      // 2. Set Initial State immediately with identical values
      setInitialState({
        p1From: formatDate(p1From),
        p1Until: formatDate(p1Until),
        p1Rates: { ...p1Rates },
        p2From: formatDate(p2From),
        p2Rate: p2Rate,
        p2Desc: p2Desc,
      });

    } catch (err) {
      setInitError(err.message || "Failed to load management fee rules");
    } finally {
      setIsInitialLoading(false);
    }
  }, [fundId, fetchRules, today, nextYear]);

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
      // Process Phase 1
      if (shareClasses) {
        for (const sc of shareClasses) {
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
              await updateRule(fundId, existingId, payload);
            } else {
              await createRule(fundId, payload);
            }
          }
        }
      }

      // Process Phase 2
      const hasP2Rate = phase2Data.rate !== undefined && phase2Data.rate !== "";
      const hasP2Desc = ppmDescription && ppmDescription.trim() !== "";

      if (hasP2Rate || hasP2Desc) {
        const payload = {
          phase: 2,
          share_class: null,
          date_from: formatDate(phase2Data.dateFrom),
          date_until: null,
          rate: hasP2Rate ? parseFloat(phase2Data.rate) : 0, 
          ppm_description: ppmDescription || null,
        };

        if (phase2Id) {
          await updateRule(fundId, phase2Id, payload);
        } else {
          await createRule(fundId, payload);
        }
      }
      
      await new Promise(r => setTimeout(r, 200));
      setInitialState({
        p1From: formatDate(phase1Data.dateFrom),
        p1Until: formatDate(phase1Data.dateUntil),
        p1Rates: { ...phase1Data.rates },
        p2From: formatDate(phase2Data.dateFrom),
        p2Rate: phase2Data.rate,
        p2Desc: ppmDescription,
      });

      setToast({
        type: "success",
        title: "Saved Successfully",
        message: "Management fee rules and PPM Description have been updated."
      });

      await loadData(true);

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
    if (!initialState) return { hasChanges: false, count: 0 };
    
    const changes = [];

    if (formatDate(phase1Data.dateFrom) !== initialState.p1From) changes.push("p1From");
    if (formatDate(phase1Data.dateUntil) !== initialState.p1Until) changes.push("p1Until");

    if (shareClasses) {
      shareClasses.forEach(sc => {
        const currentRate = phase1Data.rates[sc.share_class_id];
        const initialRate = initialState.p1Rates[sc.share_class_id];
        if ((currentRate ?? "") !== (initialState.p1Rates[sc.share_class_id] ?? "")) {
          changes.push(`sc_${sc.share_class_id}`);
        }
      });
    }

    if (formatDate(phase2Data.dateFrom) !== initialState.p2From) changes.push("p2From");
    
    if ((phase2Data.rate ?? "") !== (initialState.p2Rate ?? "")) {
      changes.push("p2Rate");
    }

    if ((ppmDescription || "") !== (initialState.p2Desc || "")) changes.push("p2Desc");

    return { hasChanges: changes.length > 0, count: changes.length };
  }, [phase1Data, phase2Data, ppmDescription, initialState, shareClasses]);

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
        <PhasePPM
          value={ppmDescription}
          onChange={setPpmDescription}
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