import React, { useState, useEffect } from "react";
import { useLocation, Outlet, useParams, NavLink, Navigate } from "react-router-dom";
import { useFundDetails } from '../../hooks/useFundDetails.js';
import { useFundData } from '../../hooks/useFundData'; 
import { useShareClasses } from '../../hooks/useShareClass.js'; 

import "./SettingsPage.css";

const TABS = [
  { label: "Fund Identity", path: "fund-identity" },
  { label: "Share Classes", path: "share-classes" },
  { label: "Waterfall Structure", path: "waterfall-structure" },
  { label: "Management fees", path: "management-fees" },
];

const SettingsPage = () => {
  const location = useLocation();
  const { fundId } = useParams();
  
  // 1. Data Fetching
  const { fund: serverFund, isFundLoading, error } = useFundDetails(fundId);
  const { updateFund } = useFundData();
  
  // 2. Initialize Share Class Hook
  const { 
    data: savedShareClasses,      // <--- GET DATA
    isLoading: isShareClassLoading, // <--- GET LOADING STATE
    error: shareClassError,         // <--- GET ERROR
    create: createShareClass, 
    fetchAll: refetchShareClasses 
  } = useShareClasses(fundId);

  // 3. Local State
  const [draftData, setDraftData] = useState(null);
  const [isGlobalSaving, setIsGlobalSaving] = useState(false);
  
  // --- Pending Share Classes Queue ---
  const [pendingShareClasses, setPendingShareClasses] = useState([]);

  // --- RESET STATE WHEN FUND ID CHANGES ---
  useEffect(() => {
    setDraftData(null); 
    setPendingShareClasses([]);
  }, [fundId]);

  // --- SYNC DRAFT DATA ---
  useEffect(() => {
    if (serverFund) {
      setDraftData(serverFund);
    }
  }, [serverFund]);

  const updateDraft = (updates) => {
    setDraftData((prev) => ({ ...prev, ...updates }));
  };

  // --- GLOBAL SAVE FUNCTION ---
  const handleManualSave = async () => {
    if (!draftData) return;
    
    setIsGlobalSaving(true);
    
    // FIX 1: Match keys to what backend likely expects (remove _id suffix)
    const fundPayload = {
      legal_name: draftData.legal_name,
      short_name: draftData.short_name,
      fund_strategy: draftData.fund_strategy,
      legal_form: draftData.legal_form,
      management_company: draftData.management_company,
      // If your backend serializer field is named 'currency', send 'currency'.
      currency: draftData.currency, 
      phase: draftData.phase,       
      formation_date_string: draftData.formation_date_string,
    };

    try {
      // 1. Save Fund Identity
      console.log("Saving Fund Identity...", fundPayload);
      const fundResult = await updateFund(fundId, fundPayload);
      
      // If this fails (400), the catch block runs and step 2 is skipped.
      if (!fundResult.success) {
        // Log the specific error from backend to help debug
        console.error("Fund Save Error Details:", fundResult.error);
        throw new Error("Failed to save Fund Identity. Please check the form.");
      }

      // 2. Save Pending Share Classes (in parallel)
      if (pendingShareClasses.length > 0) {
        console.log("Saving Share Classes...", pendingShareClasses.length);
        console.log("Pending Share Classes Data:", pendingShareClasses);
        const shareClassPromises = pendingShareClasses.map((sc) => {
           // FIX 2: Remove the temporary 'id' and 'isLocal' flag before sending to API
           // We don't want to send "id": "temp-123" to the backend.
           const { id, isLocal, ...cleanPayload } = sc;
           return createShareClass(cleanPayload);
        });

        await Promise.all(shareClassPromises);
        await refetchShareClasses();
        // Clear the queue after successful save
        setPendingShareClasses([]);
      }

      console.log("Global Save Successful");
      // Optional: Add a success notification/toast here

    } catch (err) {
      console.error("Unexpected error saving:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsGlobalSaving(false);
    }
  };

  if (location.pathname.endsWith('/settings') || location.pathname.endsWith('/settings/')) {
    return <Navigate to="fund-identity" replace />;
  }

  if (isFundLoading || !draftData) return <div className="settings-loader">Loading...</div>;
  if (error) return <div className="settings-error">Error: {error}</div>;

  return (
    <div className="fund-settings-page">
      <div className="fund-settings-container">
        <div className="fund-settings-header">
          <h1 className="fund-settings-title">Fund Setup</h1>
          <div className="fund-settings-tabs-container">
            <div className="fund-settings-tabs">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) => 
                    `fund-settings-tab ${isActive ? "fund-settings-tab--active" : ""}`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <div className="fund-settings-content-area">
          <Outlet context={{ 
            fund: draftData, 
            updateDraft, 
            fundId,
            pendingShareClasses,      
            setPendingShareClasses,   
            savedShareClasses,      
            isShareClassLoading,
            shareClassError
          }} />
        </div>

        <div className="fund-settings-footer">
          <div className="settings-actions">
            <button 
              className="fund-settings-btn-save" 
              onClick={handleManualSave}
              disabled={isGlobalSaving}
            >
              {isGlobalSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;