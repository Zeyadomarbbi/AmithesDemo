import React, { useState, useEffect } from "react";
import { useLocation, Outlet, useParams, NavLink, Navigate } from "react-router-dom";
import { useFundDetails } from '../../hooks/useFundDetails.js';
import { useFundData } from '../../hooks/useFundData.js'; // Import the update hook
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
  
  // 1. Fetch data from server
  const { fund: serverFund, isFundLoading, error } = useFundDetails(fundId);
  
  // 2. Get the update function from your hook
  const { updateFund } = useFundData(); 

  // 3. Local "Draft" State - initialized as null
  const [draftData, setDraftData] = useState(null);
  const [isGlobalSaving, setIsGlobalSaving] = useState(false);

  // 4. Sync Draft with Server Data initially (One time)
  useEffect(() => {
    if (serverFund && !draftData) {
      setDraftData(serverFund);
    }
  }, [serverFund]); // Only runs when server data arrives

  // 5. Helper for children to update the Draft
  const updateDraft = (updates) => {
    setDraftData((prev) => ({ ...prev, ...updates }));
  };

  // 6. THE REAL SAVE FUNCTION
  const handleManualSave = async () => {
    if (!draftData) return;
    
    setIsGlobalSaving(true);
    
    // Construct payload matching your Django Backend expectations (snake_case)
    const payload = {
      legal_name: draftData.legal_name,
      short_name: draftData.short_name,
      fund_strategy: draftData.fund_strategy,
      legal_form: draftData.legal_form,
      management_company: draftData.management_company,
      
      // Backend expects 'currency_id', draft likely has 'currency' (the ID)
      currency_id: draftData.currency, 
      
      // Backend expects 'phase_id', draft likely has 'phase' (the ID)
      phase_id: draftData.phase,       
      
      // Backend expects 'formation_date_string' as DD/MM/YYYY
      formation_date_string: draftData.formation_date_string,
    };

    try {
      const result = await updateFund(fundId, payload);
      if (result.success) {
        console.log("Global Save Successful");
        // Optional: Show a success toast here
      } else {
        console.error("Save Failed:", result.error);
        alert("Failed to save changes");
      }
    } catch (err) {
      console.error("Unexpected error saving:", err);
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

        <div className="fund-settings-content-area">
          {/* Pass draftData and updateDraft to all tabs via Context */}
          <Outlet context={{ 
            fund: draftData, 
            updateDraft, 
            fundId 
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