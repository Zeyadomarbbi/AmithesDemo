import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import "./LPsRegister.css";

/* Components & Icons */
import { PlusIcon, TransferIcon } from "../../Icons.jsx";
import SearchBox from "../../../../../../components/SearchBox/SearchBox.jsx";
import AddPeriodModal from "./components/AddClosingPeriod/AddPeriodModal.jsx";
import AddTransferModal from "./components/AddTransferModal/AddTransferModal.jsx";
import LPsDashboard from "./components/LPsDashboard/LPsDashboard.jsx";
import LPDrawer from "./components/LPDrawer/LPDrawer.jsx"
import { PermissionGate } from "../../../../../../hooks/Auth/PermissionGate.jsx";
/* Hooks */
import { useCountries } from "../../../../hooks/Reference/useCountries.js";
import { useCurrencies } from "../../../../hooks/Reference/useCurrencies.js";
import { useFundClosings } from "../../../../hooks/LPsStatement/useClosingPeriods.jsx";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import { useLimitedPartners } from "../../../../hooks/LPsStatement/useLimitedPartners.jsx";
import { useLimitedPartnerFundCommitment } from "../../../../hooks/LPsStatement/useLimitedPartnerFundCommitment.jsx";

/* --- HELPERS --- */

function formatAmount(num) {
  return (Number(num) || 0).toLocaleString("fr-FR");
}

function formatPercent(num) {
  return `${(Number(num) || 0).toFixed(2)}%`;
}

function getInitials(name) {
  if (!name) return "LP";
  return name.split(" ").filter(n => n).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getClassColor(name) {
  if (!name) return "tag-gray";
  const n = String(name).toLowerCase();
  if (n.includes("a1")) return "tag-purple";
  if (n.includes("a2")) return "tag-green";
  if (n.includes("b")) return "tag-yellow";
  return "tag-blue";
}

/**
 * Main Data Transformer
 * Filters by fundId and groups Commitments by LP + Share Class
 */
function buildCommitmentSummary(commitments, closings, limitedPartners, shareClasses, currentFundId) {
  if (!commitments?.length || !limitedPartners?.length) {
    return { summaryRows: [], grandTotal: "0", grandTotalNumeric: 0, closingTotals: {} };
  }

  const lpMap = {};
  let grandTotal = 0;

  // Filter commitments strictly for the current fund
  const activeCommitments = commitments.filter(c => 
    String(c.fund_id || c.fund) === String(currentFundId)
  );

  activeCommitments.forEach(c => {
    // Keys based on provided schema: lp_id, share_class_id, lps_fund_closing_period_id
    const lpId = c.lp_id || c.lp;
    const scId = c.share_class_id || c.share_class;
    const closingId = c.lps_fund_closing_period_id || c.closing_period;
    
    const key = `${lpId}_${scId}`;
    const amount = parseFloat(c.commitment_amount || 0);

    if (!lpMap[key]) {
      const lpInfo = limitedPartners.find(p => String(p.lp_id) === String(lpId)) || {};
      const scInfo = shareClasses.find(sc => String(sc.share_class_id) === String(scId)) || {};
      
      lpMap[key] = {
        lp: lpInfo,
        share_class: scInfo.share_class_name || "Unknown Class",
        closings: {},
        total_commitment: 0
      };
    }

    lpMap[key].closings[closingId] = (lpMap[key].closings[closingId] || 0) + amount;
    lpMap[key].total_commitment += amount;
    grandTotal += amount;
  });

  const summaryRows = Object.values(lpMap).map(item => {
    const row = {
      lp: item.lp,
      displayClass: item.share_class,
      displayClassColor: getClassColor(item.share_class),
      commitmentCell: formatAmount(item.total_commitment),
      totalNumeric: item.total_commitment,
      ownership: grandTotal > 0 ? (item.total_commitment / grandTotal) * 100 : 0,
      closingValues: {}
    };

    closings.forEach(closing => {
      const val = item.closings[closing.lps_fund_closing_period_id] || 0;
      row.closingValues[closing.lps_fund_closing_period_id] = val > 0 ? formatAmount(val) : "—";
    });

    return row;
  });

  const closingTotals = {};
  closings.forEach(closing => {
    const sum = activeCommitments
      .filter(c => String(c.lps_fund_closing_period_id || c.closing_period) === String(closing.lps_fund_closing_period_id))
      .reduce((acc, curr) => acc + parseFloat(curr.commitment_amount || 0), 0);
    closingTotals[closing.lps_fund_closing_period_id] = formatAmount(sum);
  });

  return {
    summaryRows,
    grandTotal: formatAmount(grandTotal),
    grandTotalNumeric: grandTotal,
    closingTotals
  };
}

export default function LPsRegister() {
  const { fundId } = useOutletContext();

  /* --- State --- */
  const [searchTerm, setSearchTerm] = useState("");
  const [activeClass, setActiveClass] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Drawer/Modal States
  const [selectedLP, setSelectedLP] = useState(null);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNewLpOpen, setIsNewLpOpen] = useState(false);

  /* --- Hooks --- */
  const { fundClosings, fetchFundClosings, error: closingsError } = useFundClosings(fundId);
  const { data: shareClasses = [], isLoading: classesLoading } = useShareClasses(fundId);
  const { limitedPartners, fetchLimitedPartners, updateLimitedPartner } = useLimitedPartners();
  const { commitments, fetchCommitments, updateCommitment, createCommitment } = useLimitedPartnerFundCommitment(fundId);
  const { countries, isLoading: countriesLoading } = useCountries();
  const { currencies, isLoading: currenciesLoading } = useCurrencies();
  /* --- Data Loading --- */
  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      await Promise.all([
        fetchFundClosings(),
        fetchLimitedPartners(),
        fetchCommitments()
      ]);
    } catch (e) {
      console.error("❌ Failed to load LP Register data:", e);
    } finally {
      setIsLoadingData(false);
    }
  }, [fundId, fetchFundClosings, fetchLimitedPartners, fetchCommitments]);

  useEffect(() => {
    if (fundId) {
      loadAllData();
    }
  }, [fundId, loadAllData]);

  /* --- Transformation Logic --- */
  /* --- Transformation Logic with Logging --- */
  const summaryData = useMemo(() => {
    return buildCommitmentSummary(
      commitments, 
      fundClosings, 
      limitedPartners, 
      shareClasses, 
      fundId
    );
  }, [commitments, fundClosings, limitedPartners, shareClasses, fundId]);
  const filteredRows = useMemo(() => {
    return summaryData.summaryRows.filter(row => {
      const name = row.lp?.name || "";
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = activeClass ? row.displayClass === activeClass : true;
      return matchesSearch && matchesClass;
    });
  }, [summaryData.summaryRows, searchTerm, activeClass]);

  const tableColumns = useMemo(() => {
    return (fundClosings || []).map((fc) => ({
      id: fc.lps_fund_closing_period_id,
      name: fc.closing_name || `Closing ${fc.date}`,
    }));
  }, [fundClosings]);

  /* --- Handlers --- */
  const handleAddNewLpSuccess = useCallback(async () => {
    // Directly refresh the lists to ensure the Memoized summaryData re-calculates
    await Promise.all([
      fetchLimitedPartners(),
      fetchCommitments()
    ]);
    setIsNewLpOpen(false);
  }, [fetchLimitedPartners, fetchCommitments]);

const handleUpdateLP = async (lpId, lpFields, trancheFields) => {
    setIsLoadingData(true);
    try {
        await updateLimitedPartner(lpId, lpFields);
        
        const tranchePromises = trancheFields.map(t => {
            const payload = { /* ... payload ... */ };
            return t.commitment_id 
                ? updateCommitment(t.commitment_id, payload) 
                : createCommitment(payload);
        });

        await Promise.all(tranchePromises);
        
        // Use 'await' to ensure the state update from the hook completes
        await fetchLimitedPartners();
        await fetchCommitments();
        
        setSelectedLP(null);
    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        setIsLoadingData(false);
    }
};

  const selectedLPCommitments = useMemo(() => {
    if (!selectedLP || !commitments) return [];
    return commitments.filter(c => String(c.lp_id) === String(selectedLP.lp_id));
  }, [selectedLP, commitments]);

  const handleSelectLP = useCallback(async (lp) => {
    await fetchCommitments();
    setSelectedLP(lp);
  }, [fetchCommitments]);

  return (
    <div className="lp-register-container">
      {closingsError && <div className="db-error-msg">{closingsError}</div>}

      <div className="lp-toolbar">
        <div className="lp-toolbar-left">
          <SearchBox 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search by LP..." 
          />
          <div className="lp-class-filter">
            {shareClasses.map((sc) => (
              <button
                key={sc.share_class_id}
                className={`lp-chip ${activeClass === sc.share_class_name ? "lp-chip-active" : ""}`}
                onClick={() => setActiveClass(sc.share_class_name)}
              >
                {sc.share_class_name}
                {activeClass === sc.share_class_name && (
                  <span className="lp-chip-clear" onClick={(e) => { e.stopPropagation(); setActiveClass(null); }}>✕</span>
                )}
              </button>
            ))}
            {classesLoading && <span className="loading-text">Loading classes...</span>}
          </div>
        </div>
        <PermissionGate>
        <div className="lp-toolbar-right">
          <button className="btn-transfer" onClick={() => setIsTransferOpen(true)}>
            <TransferIcon />
            <span>Add transfer</span>
          </button>
          <button className="btn-newlp" onClick={() => setIsNewLpOpen(true)}>
            <PlusIcon /> <span>New LP</span>
          </button>
        </div>
        </PermissionGate>
      </div>

      {isLoadingData ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading Register...</div>
      ) : (
        <LPsDashboard 
          displayRows={filteredRows}
          tableColumns={tableColumns}
          totals={{
            commitment: summaryData.grandTotal,
            commitmentNumber: summaryData.grandTotalNumeric,
            ownership: "100.00%",
            closingTotals: summaryData.closingTotals
          }}
          onSelectLP={handleSelectLP}
          onOpenAddPeriod={() => setPeriodModalOpen(true)}
        />
      )}
      
      {/* --- OVERLAYS --- */}

      <LPDrawer 
          lp={selectedLP} 
          existingCommitments={selectedLPCommitments}
          open={isNewLpOpen || !!selectedLP} 
          onClose={() => { setSelectedLP(null); setIsNewLpOpen(false); }} 
          onSave={async () => {
              await Promise.all([fetchLimitedPartners(), fetchCommitments()]);
              setSelectedLP(null);
              setIsNewLpOpen(false);
          }}
          periods={tableColumns}
          countries={countries}
          countriesLoading={countriesLoading}
          shareClasses={shareClasses}
          classesLoading={classesLoading}
          currencies={currencies}
          currenciesLoading={currenciesLoading}
      />
      <AddPeriodModal 
        open={periodModalOpen} 
        onClose={() => setPeriodModalOpen(false)} 
        onSave={() => { fetchFundClosings(); setPeriodModalOpen(false); }} 
      />

      <AddTransferModal 
        open={isTransferOpen} 
        onClose={() => setIsTransferOpen(false)} 
        onSave={() => { loadAllData(); setIsTransferOpen(false); }}
        lps={summaryData.summaryRows.map(r => r.lp)}
      />
    </div>
  );
}