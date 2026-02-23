// frontend/src/pages/App/pages/LPsStatement/LPsStatementPage.jsx
import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  Outlet,
  useParams,
  NavLink,
  useLocation,
  Navigate,
} from "react-router-dom";
import "./LPsStatementPage.css";

/* Hooks (DO NOT CHANGE THEIR FILES) */
import { useLimitedPartners } from "/src/pages/App/hooks/LPsStatement/useLimitedPartners.jsx";
import { useLimitedPartnerFundCommitment } from "/src/pages/App/hooks/LPsStatement/useLimitedPartnerFundCommitment.jsx";

const TABS = [
  { label: "LPs Register", path: "lps-register" },
  { label: "Capital flows", path: "capital-flows" },
  { label: "Capital Account Statement", path: "capital-account-statement" },
  { label: "Limits", path: "lps-limits" },
];

/* ---------- helpers ---------- */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickLpId(lp, fallback) {
  const raw = lp?.lp_id ?? lp?.id ?? lp?.pk ?? lp?.lpId ?? null;
  return raw === null || raw === undefined ? fallback : raw;
}

function pickLpName(lp) {
  const raw =
    lp?.name ??
    lp?.lp_name ??
    lp?.limited_partner_name ??
    lp?.limitedPartnerName ??
    lp?.partner_name ??
    lp?.full_name ??
    lp?.fullName ??
    lp?.label ??
    lp?.title ??
    "";

  const s = String(raw || "").trim();
  return s || "—";
}

export default function LPsStatementPage() {
  const { fundId } = useParams();
  const location = useLocation();

  const [isLoadingLps, setIsLoadingLps] = useState(false);

  // ✅ LP identity list
  const { limitedPartners, fetchLimitedPartners } = useLimitedPartners();

  // ✅ Commitments list (fund-scoped)
  const {
    commitments,
    loading: isLoadingCommitments,
    fetchCommitments,
  } = useLimitedPartnerFundCommitment(fundId);

  // ✅ reload everything needed for calculations
  const reloadAll = useCallback(async () => {
    if (!fundId) return;

    setIsLoadingLps(true);
    try {
      await Promise.all([fetchLimitedPartners(), fetchCommitments()]);
    } catch (e) {
      console.error("Failed to load LPs/Commitments:", e);
    } finally {
      setIsLoadingLps(false);
    }
  }, [fundId, fetchLimitedPartners, fetchCommitments]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  /**
   * ✅ NORMALIZED LPs for Step2/Step3 calculations
   * Shape:
   *  {
   *    id, lp_id, name,
   *    commitment, ownershipPercent,
   *    sharesRows: [{ type, commitment }]
   *  }
   */
  const lps = useMemo(() => {
    const lpList = Array.isArray(limitedPartners) ? limitedPartners : [];
    const commList = Array.isArray(commitments) ? commitments : [];

    // sumByLp: lpId -> totalCommitment
    const sumByLp = new Map();

    // sumByLpAndClass: `${lpId}__${shareClassId}` -> totalCommitment
    const sumByLpAndClass = new Map();

    for (const c of commList) {
      const lpIdRaw = c?.lp;
      if (lpIdRaw === null || lpIdRaw === undefined) continue;

      const lpKey = String(lpIdRaw);
      const scKey = String(c?.share_class ?? "-");
      const amt = toNum(c?.commitment_amount);

      sumByLp.set(lpKey, (sumByLp.get(lpKey) || 0) + amt);

      const k = `${lpKey}__${scKey}`;
      sumByLpAndClass.set(k, (sumByLpAndClass.get(k) || 0) + amt);
    }

    const fundTotal = Array.from(sumByLp.values()).reduce((a, b) => a + b, 0);

    return lpList.map((lp, idx) => {
      const rawId = pickLpId(lp, `lp_${idx}`);
      const id = String(rawId);

      const name = pickLpName(lp);

      const commitmentTotal = sumByLp.get(id) || 0;

      // build unique share class rows for this LP
      const classIds = new Set();
      for (const c of commList) {
        if (String(c?.lp) !== id) continue;
        classIds.add(String(c?.share_class ?? "-"));
      }

      const sharesRows = Array.from(classIds).map((scId) => {
        const key = `${id}__${scId}`;
        const classSum = sumByLpAndClass.get(key) || 0;

        // Step2 supports: r.type OR r.shareClass OR r.class
        // we store numeric id as "type" for now (we can map to names later using useShareClasses)
        return {
          type: scId,
          commitment: classSum, // keep number, Step2 parses fine
        };
      });

      const ownershipPercent = fundTotal > 0 ? (commitmentTotal / fundTotal) * 100 : 0;

      return {
        id,                 // ✅ used in Step2 rows + Step3 keys
        lp_id: rawId,       // ✅ keeps compatibility with existing code
        name,               // ✅ fixes "Unknown" display
        commitment: commitmentTotal,
        ownershipPercent,   // percent 0..100 (Step2 parsePercent handles it)
        sharesRows,
        raw: lp,            // keep original untouched (safe)
      };
    });
  }, [limitedPartners, commitments]);

  // redirect base tab
  if (
    location.pathname.endsWith("/lps-statement") ||
    location.pathname.endsWith("/lps-statement/")
  ) {
    return <Navigate to="lps-register" replace />;
  }

  return (
    <div className="lp-page">
      <div className="lp-page-container">
        <div className="lp-page-header">
          <h1 className="lp-page-title">LPs Statement</h1>

          <div className="lp-page-tabs-container">
            <div className="lp-page-tabs">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) =>
                    `lp-page-tab ${isActive ? "lp-page-tab--active" : ""}`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <div className="lp-page-content-area">
          <Outlet
            context={{
              fundId,
              lps, // ✅ normalized for Operation Step2/3 + can be used by LPsRegister if you want
              limitedPartnersRaw: limitedPartners, // ✅ raw hook output (in case other pages rely on original fields)
              commitments, // ✅ fund commitments list
              reloadAll, // ✅ refresh LPs + commitments
              isLoadingLps: isLoadingLps || isLoadingCommitments,
            }}
          />
        </div>
      </div>
    </div>
  );
}
