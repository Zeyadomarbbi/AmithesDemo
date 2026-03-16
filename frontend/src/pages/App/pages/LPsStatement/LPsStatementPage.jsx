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
import { useLimitedPartners } from "../../hooks/LPsStatement/useLimitedPartners.jsx";
import { useLimitedPartnerFundCommitment } from "../../hooks/LPsStatement/useLimitedPartnerFundCommitment.jsx";
import { useShareClasses } from "../../hooks/useShareClass.js";

const TABS = [
  { label: "LPs Register", path: "lps-register" },
  { label: "Capital Flows", path: "capital-flows" },
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
  const {
    limitedPartners,
    fetchLimitedPartners,
    createLimitedPartner,
    updateLimitedPartner,
    deleteLimitedPartner,
  } = useLimitedPartners();
  const { data: shareClasses = [], isLoading: classesLoading } = useShareClasses(fundId);
  // ✅ Commitments list (fund-scoped)
  const {
    commitments,
    loading: isLoadingCommitments,
    fetchCommitments,
    createCommitment,
    updateCommitment,
    deleteCommitment,
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

  const lps = useMemo(() => {
    const lpList = Array.isArray(limitedPartners) ? limitedPartners : [];
    const commList = Array.isArray(commitments) ? commitments : [];

    // only keep LPs with a commitment in this fund
    const committedLpIds = new Set(commList.map(c => String(c.lp_id)));

    const sumByLp = new Map();
    const sumByLpAndClass = new Map();

    for (const c of commList) {
      const lpKey = String(c?.lp_id);
      const scKey = String(c?.share_class_id ?? c?.share_class ?? "-");
      const amt = toNum(c?.commitment_amount);

      sumByLp.set(lpKey, (sumByLp.get(lpKey) || 0) + amt);

      const k = `${lpKey}__${scKey}`;
      sumByLpAndClass.set(k, (sumByLpAndClass.get(k) || 0) + amt);
    }

    const fundTotal = Array.from(sumByLp.values()).reduce((a, b) => a + b, 0);

    return lpList
      .filter(lp => committedLpIds.has(String(pickLpId(lp, "")))) // filter by fund commitments
      .map((lp, idx) => {
        const rawId = pickLpId(lp, `lp_${idx}`);
        const id = String(rawId);

        const name = pickLpName(lp);
        const commitmentTotal = sumByLp.get(id) || 0;

        const classIds = new Set();
        for (const c of commList) {
          if (String(c?.lp_id) !== id) continue;
          classIds.add(String(c?.share_class_id ?? c?.share_class ?? "-"));  // ← was c?.share_class
        }

        const sharesRows = Array.from(classIds).map(scId => {
          const key = `${id}__${scId}`;
          return { type: scId, commitment: sumByLpAndClass.get(key) || 0 };
        });

        const ownershipPercent = fundTotal > 0 ? (commitmentTotal / fundTotal) * 100 : 0;

        return {
          id,
          lp_id: rawId,
          name,
          commitment: commitmentTotal,
          ownershipPercent,
          sharesRows,
          raw: lp,
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
              lps,
              limitedPartnersRaw: limitedPartners,
              shareClasses,
              commitments,
              reloadAll,
              isLoadingLps: isLoadingLps || isLoadingCommitments,
              createCommitment,
              updateCommitment,
              deleteCommitment,
              createLimitedPartner,    // ← add
              updateLimitedPartner,    // ← add
              deleteLimitedPartner,    // ← add
            }}
          />
        </div>
      </div>
    </div>
  );
}
