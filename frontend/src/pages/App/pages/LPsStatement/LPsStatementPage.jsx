// src/pages/App/pages/LPsStatement/LPsStatementPage.jsx
import React, { useState } from "react";

// main UI (tabs + table)
import LPsStatement, { INITIAL_LPS } from "./components/LPsStatement.jsx";

// modals / drawers
import AddTransferModal from "./components/AddTransferModal.jsx";
import AddPeriodModal from "./components/AddPeriodModal.jsx";
import NewLPDrawer from "./components/NewLPDrawer.jsx";
import LPDetailsDrawer from "./components/LPDetailsDrawer.jsx";

// main CSS for this page (tabs, toolbar, table, etc.)
import "./LPsStatementPage.css";

/* ---------- helpers ---------- */

function getClassColor(shareType) {
  if (!shareType) return "tag-purple";
  const val = shareType.toLowerCase();
  if (val.includes("a1")) return "tag-purple";
  if (val.includes("a2")) return "tag-green";
  if (val.includes("b")) return "tag-yellow";
  return "tag-purple";
}

// remove spaces, turn "61 000 000" → 61000000
function parseAmount(value) {
  if (!value && value !== 0) return 0;
  return Number(String(value).replace(/\s/g, "")) || 0;
}

// format back to "61 000 000"
function formatAmount(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("fr-FR");
}

export default function LPsStatementPage() {
  // 🔥 MAIN LP LIST (dynamic) – use INITIAL_LPS as starting point
  const [lps, setLps] = useState(INITIAL_LPS);

  // periods created from AddPeriodModal (not shown yet, but stored)
  const [periods, setPeriods] = useState([]);

  // selection + modals
  const [selectedLP, setSelectedLP] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNewLpOpen, setIsNewLpOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  const handleSelectLP = (lp) => {
    setSelectedLP(lp);
  };

  const handleCloseDetails = () => {
    setSelectedLP(null);
  };

  /* ===== when New LP is saved from the drawer ===== */
  const handleAddNewLp = (data) => {
    if (!data?.lpName) return;

    const initials = data.lpName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const shareClass = data.shareType || "Class A1";

    const newLp = {
      initials,
      name: data.lpName,
      class: shareClass,
      classColor: getClassColor(shareClass),

      // table values – start from 0
      shares: data.shares || "0",
      commitment: data.commitment
        ? formatAmount(parseAmount(data.commitment))
        : "0",
      ownership: data.ownership || "0.00%",
      firstClosing: data.closing || "-",
      secondClosing: "-",

      // extra fields (details drawer later)
      address: data.address,
      city: data.city,
      zip: data.zip,
      country: data.country,
      iban: data.iban,
      bank: data.bankName,
      bic: data.swift,
      currency: data.currency,
    };

    setLps((prev) => [...prev, newLp]);
    setIsNewLpOpen(false);
  };

  /* ===== when a transfer is saved ===== */
  const handleAddTransfer = (transfer) => {
    if (!transfer) return;
    const { amount, fromLpName, toLpName } = transfer;
    if (!amount || !fromLpName || !toLpName) return;

    setLps((prev) =>
      prev.map((lp) => {
        if (lp.name === fromLpName) {
          const current = parseAmount(lp.commitment);
          return { ...lp, commitment: formatAmount(current - amount) };
        }
        if (lp.name === toLpName) {
          const current = parseAmount(lp.commitment);
          return { ...lp, commitment: formatAmount(current + amount) };
        }
        return lp;
      })
    );

    setIsTransferOpen(false);
  };

  /* ===== when a new period is saved ===== */
  const handleAddPeriod = (period) => {
    if (!period) return;
    setPeriods((prev) => [...prev, period]);
    setIsPeriodOpen(false);
  };

  return (
    <>
      {/* MAIN TAB PAGE */}
      <LPsStatement
        lps={lps} // 🔥 dynamic data
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenNewLp={() => setIsNewLpOpen(true)}
        onOpenPeriod={() => setIsPeriodOpen(true)}
        onSelectLP={handleSelectLP}
      />

      {/* MODALS / DRAWERS */}
      <AddTransferModal
        open={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        lp={selectedLP}
        lps={lps}                 // 🔥 for dropdowns
        onSave={handleAddTransfer} // 🔥 updates commitments
      />

      <AddPeriodModal
        open={isPeriodOpen}
        onClose={() => setIsPeriodOpen(false)}
        onSave={handleAddPeriod}
      />

      <NewLPDrawer
        open={isNewLpOpen}
        onClose={() => setIsNewLpOpen(false)}
        onSave={handleAddNewLp}
      />

      <LPDetailsDrawer
        lp={selectedLP}
        open={!!selectedLP}
        onClose={handleCloseDetails}
      />
    </>
  );
}
