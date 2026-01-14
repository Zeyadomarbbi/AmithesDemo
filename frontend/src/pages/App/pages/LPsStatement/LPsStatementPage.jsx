// src/pages/App/pages/LPsStatement/LPsStatementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

// main UI (tabs + table)
import LPsStatement, { INITIAL_LPS } from "./components/LpRegister/LPsStatement.jsx";

// modals / drawers
import AddTransferModal from "./components/LpRegister/AddTransferModal.jsx";
import NewLPDrawer from "./components/LpRegister/NewLPDrawer.jsx";
import LPDetailsDrawer from "./components/LpRegister/LPDetailsDrawer.jsx";

// main CSS for this page (tabs, toolbar, table, etc.)
import "./LPsStatementPage.css";

/* ---------- helpers ---------- */

function getClassColor(shareType) {
  if (!shareType) return "tag-purple";
  const val = String(shareType).toLowerCase();
  if (val.includes("a1")) return "tag-purple";
  if (val.includes("a2")) return "tag-green";
  if (val.includes("b")) return "tag-yellow";
  return "tag-purple";
}

function parseAmount(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  return Number(cleaned) || 0;
}

function formatAmount(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("fr-FR");
}

function initialsFromName(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeLpRegisterResponse(rows) {
  if (!Array.isArray(rows)) return [];

  const looksLikeUiShape = rows.some(
    (x) => x && (x.initials || x.sharesRows || x.commitment)
  );

  if (looksLikeUiShape) {
    return rows.map((lp) => ({
      id: lp.id ?? lp.lp_id ?? `lp-${Math.random().toString(16).slice(2)}`,
      initials: lp.initials ?? initialsFromName(lp.name ?? lp.lp_name ?? ""),
      name: lp.name ?? lp.lp_name ?? "",
      class: lp.class ?? lp.share_class ?? "",
      classColor: lp.classColor ?? getClassColor(lp.class ?? lp.share_class ?? ""),
      commitment: lp.commitment ?? "",
      ownership: lp.ownership ?? "0.00%",
      periodValues: lp.periodValues ?? {},
      sharesRows: Array.isArray(lp.sharesRows) ? lp.sharesRows : [],
      ...lp,
    }));
  }

  const byLp = new Map();

  for (const r of rows) {
    const lpId = r.lp_id ?? r.id;
    if (!lpId) continue;

    const lpName = r.lp_name ?? r.name ?? "";
    const shareClass =
      r.share_class_name ?? r.share_class ?? r.share_type ?? "";
    const closing = r.period_name ?? r.closing_period ?? r.closing ?? "";
    const commitmentAmount = r.commitment_amount ?? r.commitment ?? "";
    const currencySymbol = r.currency_symbol ?? "";

    if (!byLp.has(lpId)) {
      byLp.set(lpId, {
        id: lpId,
        initials: initialsFromName(lpName),
        name: lpName,
        class: shareClass || "Class A1",
        classColor: getClassColor(shareClass || "Class A1"),
        commitment: "0",
        ownership: "0.00%",
        periodValues: {},
        sharesRows: [],
      });
    }

    const lp = byLp.get(lpId);

    if (shareClass || commitmentAmount || closing) {
      const rowCommitment =
        commitmentAmount === "" ||
        commitmentAmount === null ||
        commitmentAmount === undefined
          ? ""
          : `${commitmentAmount} ${currencySymbol}`.trim();

      lp.sharesRows.push({
        id: `row-${lpId}-${Math.random().toString(16).slice(2)}`,
        type: shareClass || "-",
        currency: r.currency_name ?? r.currency ?? "",
        commitment: rowCommitment,
        closing: closing || "",
        classColor: getClassColor(shareClass),
      });

      if (closing && rowCommitment) lp.periodValues[closing] = rowCommitment;
    }
  }

  return Array.from(byLp.values()).map((lp) => {
    const total = (lp.sharesRows || []).reduce(
      (acc, sr) => acc + parseAmount(sr.commitment),
      0
    );
    return { ...lp, commitment: formatAmount(total) };
  });
}

// stable key for merging
function lpKey(lp) {
  return String(lp?.id ?? lp?.lp_id ?? lp?.name ?? "");
}

export default function LPsStatementPage() {
  const { fundId } = useParams();
  const fundKey = (fundId ?? "1").toString();

  const [lpsByFund, setLpsByFund] = useState({});
  const lps = useMemo(
    () => lpsByFund[fundKey] ?? INITIAL_LPS,
    [lpsByFund, fundKey]
  );

  const setLps = (updater) => {
    setLpsByFund((prev) => {
      const current = prev[fundKey] ?? INITIAL_LPS;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [fundKey]: next };
    });
  };

  // selection + modals
  const [selectedLP, setSelectedLP] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNewLpOpen, setIsNewLpOpen] = useState(false);

  const [drawerPeriods, setDrawerPeriods] = useState([]);

  const handleSelectLP = (lp) => setSelectedLP(lp);
  const handleCloseDetails = () => setSelectedLP(null);

  const handleOpenNewLp = (open, incomingPeriods) => {
    setIsNewLpOpen(!!open);
    setDrawerPeriods(Array.isArray(incomingPeriods) ? incomingPeriods : []);
  };

  // ✅ LOAD LP REGISTER FOR THIS FUND (but DO NOT overwrite local added LPs)
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`/api/funds/${fundKey}/lp-register/`, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const normalized = normalizeLpRegisterResponse(json);

        if (ignore) return;

        setLpsByFund((prev) => {
          const current = prev[fundKey] ?? [];
          if (current.length === 0) {
            // first load
            return { ...prev, [fundKey]: normalized };
          }

          // merge: keep current (local) + add missing from server
          const seen = new Set(current.map(lpKey));
          const merged = [...current];
          for (const s of normalized) {
            const k = lpKey(s);
            if (!k) continue;
            if (!seen.has(k)) merged.push(s);
          }
          return { ...prev, [fundKey]: merged };
        });
      } catch (e) {
        // ✅ no red UI, just log for debugging
        console.error("LP register fetch failed:", e);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [fundKey]);

  const handleAddNewLp = (data) => {
    if (!data?.lpName) return;

    const rows = Array.isArray(data.sharesRows) ? data.sharesRows : [];
    const shareClass = rows[0]?.type || "Class A1";

    const periodValues = {};
    let totalCommitment = 0;

    rows.forEach((r) => {
      const key = String(r?.closing || "").trim();
      const val = String(r?.commitment || "").trim();
      if (!key || !val) return;

      periodValues[key] = val;
      totalCommitment += parseAmount(val);
    });

    const newLp = {
      id: `lp-${Date.now()}`,
      initials: initialsFromName(data.lpName),
      name: data.lpName,
      class: shareClass,
      classColor: getClassColor(shareClass),

      commitment: formatAmount(totalCommitment),
      ownership: "0.00%",

      periodValues,
      sharesRows: rows,

      address: data.address,
      city: data.city,
      zip: data.zip,
      country: data.country,
      iban: data.iban,
      bank: data.bankName,
      bic: data.swift,
    };

    setLps((prev) => [...prev, newLp]);
    setIsNewLpOpen(false);
  };

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

  return (
    <>
      <LPsStatement
        lps={lps}
        setLps={setLps}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenNewLp={handleOpenNewLp}
        onSelectLP={handleSelectLP}
      />

      <AddTransferModal
        open={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        lp={selectedLP}
        lps={lps}
        onSave={handleAddTransfer}
      />

      <NewLPDrawer
        open={isNewLpOpen}
        onClose={() => setIsNewLpOpen(false)}
        onSave={handleAddNewLp}
        periods={drawerPeriods}
      />

      <LPDetailsDrawer
        lp={selectedLP}
        open={!!selectedLP}
        onClose={handleCloseDetails}
      />
    </>
  );
}
