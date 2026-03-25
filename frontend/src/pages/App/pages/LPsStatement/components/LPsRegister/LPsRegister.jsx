import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";

/* Components & Icons */
import { PlusIcon, TransferIcon, FilterColumnsIcon, CheckMarkIcon } from "../../../../../../components/Icons/InteractiveIcons.jsx";
import SearchBox from "../../../../../../components/SearchBox/SearchBox.jsx";
import AddPeriodModal from "./components/AddClosingPeriod/AddPeriodModal.jsx";
import AddTransferModal from "./components/AddTransferModal/AddTransferModal.jsx";
import LPsDashboard from "./components/LPsDashboard/LPsDashboard.jsx";
import LPDrawer from "./components/LPDrawer/LPDrawer.jsx"
import { PermissionGate } from "../../../../../../hooks/Auth/PermissionGate.jsx";
import { PageSpinner, PageError } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
/* Hooks */
import { useCountries } from "../../../../hooks/Reference/useCountries.js";
import { useCurrencies } from "../../../../hooks/Reference/useCurrencies.js";
import { useFundClosings } from "../../../../hooks/LPsStatement/useClosingPeriods.jsx";
import "./LPsRegister.css";


function generatePalette(count) {
  return Array.from({ length: count }, (_, i) => {
    const hue = Math.round((i / count) * 360);
    return {
      bg: `hsl(${hue}, 80%, 93%)`,
      color: `hsl(${hue}, 60%, 30%)`,
    };
  });
}

function buildClassColorMap(uniqueClasses) {
  const palette = generatePalette(uniqueClasses.length || 1);
  const map = {};
  uniqueClasses.forEach((cls, idx) => {
    map[cls] = palette[idx];
  });
  return map;
}

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
        totalNumeric: item.total_commitment,
        ownership: grandTotal > 0 ? (item.total_commitment / grandTotal) * 100 : 0,
        closingValues: {}
      };

      // --- CUMULATIVE LOGIC ---
      let runningTotal = 0;
      
      // closings must be sorted by date/sequence for this to work
      closings.forEach(closing => {
        const closingId = closing.lps_fund_closing_period_id;
        const trancheAmount = item.closings[closingId] || 0;
        
        runningTotal += trancheAmount;
        
        // Store the accumulation for this specific period
        row.closingValues[closingId] = runningTotal;
      });

      return row;
    });

    // --- CUMULATIVE FOOTER TOTALS ---
    const closingTotals = {};
    let totalRunningBalance = 0;

    closings.forEach(closing => {
      const closingId = closing.lps_fund_closing_period_id;
      const trancheSum = activeCommitments
        .filter(c => String(c.lps_fund_closing_period_id) === String(closingId))
        .reduce((acc, curr) => acc + parseFloat(curr.commitment_amount || 0), 0);
      
      totalRunningBalance += trancheSum;
      closingTotals[closingId] = totalRunningBalance;
    });

    return {
      summaryRows,
      grandTotal: formatAmount(grandTotal),
      grandTotalNumeric: grandTotal,
      closingTotals
    };
  }

export default function LPsRegister() {
  const outlet = useOutletContext() || {};
  const fundId = outlet.fundId;
  const limitedPartners = outlet.limitedPartnersRaw || [];
  const {
    commitments,
    reloadAll,
    createCommitment,
    updateCommitment,
    deleteCommitment,
    createLimitedPartner,    // ← add
    updateLimitedPartner,    // ← add
  } = outlet;
  /* --- State --- */
  const [searchTerm, setSearchTerm] = useState("");
  const [activeClass, setActiveClass] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Drawer/Modal States
  const [selectedLP, setSelectedLP] = useState(null);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNewLpOpen, setIsNewLpOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [colSearchTerm, setColSearchTerm] = useState("");
  const pickerRef = useRef(null);
  /* --- Hooks --- */
  const { fundClosings, fetchFundClosings, error: closingsError } = useFundClosings(fundId);
  const shareClasses = outlet.shareClasses || [];
  const { countries, isLoading: countriesLoading } = useCountries();
  const { currencies, isLoading: currenciesLoading } = useCurrencies();
  const classColorMap = useMemo(() => {
    const uniqueClasses = [...new Set((shareClasses || []).map(sc => sc.share_class_name))];
    return buildClassColorMap(uniqueClasses);
  }, [shareClasses]);
  /* --- Data Loading --- */
  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      await Promise.all([
        fetchFundClosings(),
        reloadAll()
      ]);
    } catch (e) {
      console.error("❌ Failed to load LP Register data:", e);
    } finally {
      setIsLoadingData(false);
    }
  }, [fundId, fetchFundClosings, reloadAll]);

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
      id:   fc.lps_fund_closing_period_id,
      name: fc.closing_name || `Closing ${fc.date}`,
      date: fc.date,
    }));
  }, [fundClosings]);

  useEffect(() => {
    setVisibleColumns(tableColumns.map(c => c.id));
  }, [tableColumns]);

  const toggleColumn = (id) => {
    setVisibleColumns(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const allClosingsSelected = visibleColumns.length === tableColumns.length && tableColumns.length > 0;
  const toggleAllColumns = () => {
    if (allClosingsSelected) {
      setVisibleColumns([]);
    } else {
      setVisibleColumns(tableColumns.map(c => c.id));
    }
  };
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setColPickerOpen(false);
        setColSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLPCommitments = useMemo(() => {
    if (!selectedLP || !commitments) return [];
    return commitments.filter(c => String(c.lp_id) === String(selectedLP.lp_id));
  }, [selectedLP, commitments]);

  const handleSelectLP = useCallback(async (lp) => {
    await reloadAll();
    setSelectedLP(lp);
  }, [reloadAll]);

  const filteredTotals = useMemo(() => {
    const grandTotal = filteredRows.reduce((sum, r) => sum + r.totalNumeric, 0);

    const closingTotals = {};
    tableColumns.forEach((col) => {
      let running = 0;
      filteredRows.forEach((row) => {
        running += row.closingValues[col.id] || 0;
      });
      closingTotals[col.id] = running;
    });

    return {
      commitment: formatAmount(grandTotal),
      commitmentNumber: grandTotal,
      ownership: grandTotal > 0 ? `${((grandTotal / summaryData.grandTotalNumeric) * 100).toFixed(2)}%` : "0.00%",
      closingTotals,
    };
  }, [filteredRows, tableColumns]);
  
  const isFullyLoading = isLoadingData || countriesLoading || currenciesLoading;

  return (
    <div className="lp-register-container">
      <div className="lp-toolbar">
        {/* Row 1 */}
        <div className="lp-toolbar-row">
          <div className="lp-toolbar-left">
            <SearchBox 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search by LP..." 
            />
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
              <button className="btn-newlp" onClick={() => setPeriodModalOpen(true)}>
                <PlusIcon />
                <span>Add closing period</span>
              </button>
            </div>
          </PermissionGate>
        </div>

        {/* Row 2 */}
        <div className="lp-toolbar-row">
          <div className="lp-toolbar-left">
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
            </div>
          </div>
          <div className="lp-toolbar-right">
            <div className="lp-col-picker-wrapper" ref={pickerRef}>
              <button className="btn-col-picker" onClick={() => setColPickerOpen(prev => !prev)}>
                <FilterColumnsIcon />
              </button>
              {colPickerOpen && (
                <div className="lp-col-picker-dropdown">
                  <div className="quarter-search-wrapper">
                    <SearchBox
                      value={colSearchTerm}
                      onChange={(e) => setColSearchTerm(e.target.value)}
                      placeholder="Search columns..."
                    />
                  </div>
                  <div className="lp-col-picker-list">
                    <div
                      className={`lp-col-picker-item ${allClosingsSelected ? "selected" : ""}`}
                      onClick={toggleAllColumns}
                    >
                      <div className={`lp-col-picker-checkbox ${allClosingsSelected ? "checked" : ""}`}>
                        {allClosingsSelected && <CheckMarkIcon />}
                      </div>
                      <span className="item-label-bold">All Closings</span>
                    </div>

                    {tableColumns
                      .filter(col => col.name.toLowerCase().includes(colSearchTerm.toLowerCase()))
                      .map(col => {
                        const isChecked = visibleColumns.includes(col.id);
                        return (
                          <div
                            key={col.id}
                            className={`lp-col-picker-item ${isChecked ? "selected" : ""}`}
                            onClick={() => toggleColumn(col.id)}
                          >
                            <div className={`lp-col-picker-checkbox ${isChecked ? "checked" : ""}`}>
                              {isChecked && <CheckMarkIcon />}
                            </div>
                            <span className="item-label-bold">{col.name}</span>
                          </div>
                        );
                      })}
                    {!tableColumns.filter(col => col.name.toLowerCase().includes(colSearchTerm.toLowerCase())).length && (
                      <div className="quarter-no-results">No matches found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFullyLoading ? (
        <PageSpinner label="Loading Register..." />
      ) : closingsError ? (
        <PageError message={closingsError} />
      ) : (
        <LPsDashboard 
          displayRows={filteredRows}
          tableColumns={tableColumns}
          totals={filteredTotals}
          onSelectLP={handleSelectLP}
          visibleColumnIds={visibleColumns}
          classColorMap={classColorMap}
        />
      )}

      <LPDrawer 
        lp={selectedLP} 
        existingCommitments={selectedLPCommitments}
        open={isNewLpOpen || !!selectedLP} 
        onClose={() => { setSelectedLP(null); setIsNewLpOpen(false); }} 
        onSave={async () => {
          await reloadAll();
          setSelectedLP(null);
          setIsNewLpOpen(false);
        }}
        periods={tableColumns}
        countries={countries}
        countriesLoading={countriesLoading}
        shareClasses={shareClasses}
        currencies={currencies}
        currenciesLoading={currenciesLoading}
        createCommitment={createCommitment}
        updateCommitment={updateCommitment}
        deleteCommitment={deleteCommitment}
        createLimitedPartner={createLimitedPartner}    // ← add
        updateLimitedPartner={updateLimitedPartner} 
        classColorMap={classColorMap}
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