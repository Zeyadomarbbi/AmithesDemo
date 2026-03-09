import { useCallback, useEffect, useMemo, useState } from "react";
import { useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import { API_BASE_URL } from "../../../../../../hooks/api/apiConfig";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toSafeArray = (value) => (Array.isArray(value) ? value : []);
const toQuarterDate = (q) => q?.rawDate || q?.date || "";
const buildQuartersKey = (quarters = []) =>
  quarters.map((q) => `${Number(q?.id) || 0}:${toQuarterDate(q)}`).join("|");
const buildRowsSignature = (rows = [], quarters = []) =>
  rows.map((row) => {
    const base = `${row?.id ?? ""}:${row?.name ?? ""}`;
    const tf = quarters.map((q) => {
      const v = row?.timeframes?.[q.id] || {};
      return `${q.id}:${toNumber(v.cost)}:${toNumber(v.fv)}`;
    }).join(",");
    return `${base}|${tf}`;
  }).join(";");

const canonicalType = (value) => {
  const t = String(value || "").trim().toLowerCase();
  if (t.includes("invest"))   return "investment";
  if (t.includes("dividend")) return "dividend";
  if (t.includes("interest")) return "interest";
  if (t.includes("divest"))   return "divestment";
  return "other";
};

const getAmountEur = (row) => {
  const direct = toNumber(row.amount);
  if (direct) return direct;
  const lc = toNumber(row.amount_lc ?? row.amountLC);
  const fx = toNumber(row.fx_rate ?? row.fxRate);
  if (!fx) return 0;
  return lc / fx;
};

const costAsOfDate = (flows = [], cutoffDate) => {
  const cutoff = new Date(cutoffDate);
  return flows
    .filter((flow) => flow?.date)
    .filter((flow) => { const d = new Date(flow.date); return !Number.isNaN(d.getTime()) && d <= cutoff; })
    .filter((flow) => canonicalType(flow.transaction_name) === "investment")
    .reduce((sum, flow) => sum + Math.abs(getAmountEur(flow)), 0);
};

const fvAsOfDate = (fairValues = [], cutoffDate) => {
  const cutoff = new Date(cutoffDate);
  const eligible = fairValues
    .filter((fv) => fv?.date)
    .filter((fv) => { const d = new Date(fv.date); return !Number.isNaN(d.getTime()) && d <= cutoff; })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!eligible.length) return 0;
  return Math.abs(getAmountEur(eligible[eligible.length - 1]));
};

export const useCompareTimeframes = (maxSelections = 2) => {
  const { quarters, isLoading, saveTimeframe } = useTimeframeContext();
  const [selectedTimeframeIds, setSelectedTimeframeIds] = useState([]);

  useEffect(() => {
    if (!quarters.length) return;
    const valid = selectedTimeframeIds.filter((id) =>
      quarters.some((q) => Number(q.id) === Number(id))
    );
    if (valid.length === 0) {
      setSelectedTimeframeIds(quarters.slice(-2).map((q) => Number(q.id)));
      return;
    }
    if (valid.length !== selectedTimeframeIds.length) setSelectedTimeframeIds(valid);
  }, [quarters, selectedTimeframeIds]);

  const handleToggleTimeframe = useCallback((timeframeId) => {
    const id = Number(timeframeId);
    if (!Number.isFinite(id)) return;
    setSelectedTimeframeIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      return [...prev, id].slice(-maxSelections);
    });
  }, [maxSelections]);

  const handleSaveTimeframe = useCallback(async (newTimeframe) => {
    const saved = await saveTimeframe(newTimeframe);
    setSelectedTimeframeIds((prev) => [...prev, Number(saved.id)].slice(-maxSelections));
    return saved;
  }, [maxSelections, saveTimeframe]);

  const activeQuarters = useMemo(() =>
    quarters
      .filter((q) => selectedTimeframeIds.includes(Number(q.id)))
      .sort((a, b) => new Date(b.rawDate || b.date) - new Date(a.rawDate || a.date)),
    [quarters, selectedTimeframeIds]
  );

  return { quarters, isLoading, selectedTimeframeIds, activeQuarters, handleToggleTimeframe, handleSaveTimeframe };
};

export const useCompareRows = (
  fundId,
  activeQuarters = [],
  fallbackRows = [],
  preloadedDataset = null
) => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const preloadedInvestments = preloadedDataset?.investments;
  const preloadedFlows       = preloadedDataset?.flowsByInvestment;
  const preloadedFairValues  = preloadedDataset?.fairValuesByInvestment;
  const preloadedLoadedAt    = preloadedDataset?.loadedAt;
  const preloadedIsLoading   = preloadedDataset?.isLoading;
  const activeQuartersKey    = useMemo(() => buildQuartersKey(activeQuarters), [activeQuarters]);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      if (!fundId) { setRows([]); return; }
      if (preloadedIsLoading) { setIsLoading(true); return; }

      const preloadedRows = toSafeArray(preloadedInvestments);
      if (preloadedRows.length || preloadedLoadedAt) {
        const mapped = preloadedRows.map((inv) => {
          const investmentId = Number(inv.investment_id ?? inv.id);
          const flows      = toSafeArray(preloadedFlows?.[investmentId]);
          const fairValues = toSafeArray(preloadedFairValues?.[investmentId]);
          const timeframes = activeQuarters.reduce((acc, q) => {
            const cutoff = q.rawDate || q.date;
            acc[q.id] = { cost: costAsOfDate(flows, cutoff), fv: fvAsOfDate(fairValues, cutoff) };
            return acc;
          }, {});
          return { id: investmentId, name: inv.name || `Investment #${investmentId}`, sector: inv.sector || "", timeframes };
        });

        const filtered = mapped.filter((row) =>
          activeQuarters.length === 0 ? true :
          activeQuarters.some((q) => { const tf = row.timeframes[q.id] || {}; return toNumber(tf.cost) > 0 || toNumber(tf.fv) > 0; })
        );

        if (!isCancelled) {
          setRows((prev) => {
            const prevSig = buildRowsSignature(prev, activeQuarters);
            const nextSig = buildRowsSignature(filtered, activeQuarters);
            return prevSig === nextSig ? prev : filtered;
          });
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const investmentsRes = await fetch(`${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/`);
        if (!investmentsRes.ok) throw new Error("Failed to fetch investments");

        const investmentsPayload = await investmentsRes.json();
        const investments = toSafeArray(investmentsPayload?.rows || investmentsPayload)
          .filter((row) => Number.isFinite(Number(row.investment_id ?? row.id)));

        const mapped = await Promise.all(investments.map(async (inv) => {
          const investmentId = Number(inv.investment_id ?? inv.id);
          const [flowsRes, fvRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`),
            fetch(`${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`),
          ]);
          const flows      = flowsRes.ok ? toSafeArray(await flowsRes.json()) : [];
          const fairValues = fvRes.ok   ? toSafeArray(await fvRes.json())    : [];
          const timeframes = activeQuarters.reduce((acc, q) => {
            const cutoff = q.rawDate || q.date;
            acc[q.id] = { cost: costAsOfDate(flows, cutoff), fv: fvAsOfDate(fairValues, cutoff) };
            return acc;
          }, {});
          return { id: investmentId, name: inv.name || `Investment #${investmentId}`, sector: inv.sector || "", timeframes };
        }));

        const filtered = mapped.filter((row) =>
          activeQuarters.length === 0 ? true :
          activeQuarters.some((q) => { const tf = row.timeframes[q.id] || {}; return toNumber(tf.cost) > 0 || toNumber(tf.fv) > 0; })
        );

        if (!isCancelled) {
          setRows((prev) => {
            const prevSig = buildRowsSignature(prev, activeQuarters);
            const nextSig = buildRowsSignature(filtered, activeQuarters);
            return prevSig === nextSig ? prev : filtered;
          });
        }
      } catch (error) {
        console.error("Failed to load compare rows:", error);
        if (!isCancelled) {
          setRows((prev) => {
            const prevSig = buildRowsSignature(prev, activeQuarters);
            const nextSig = buildRowsSignature(fallbackRows, activeQuarters);
            return prevSig === nextSig ? prev : fallbackRows;
          });
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    load();
    return () => { isCancelled = true; };
  }, [fundId, activeQuartersKey, fallbackRows, preloadedInvestments, preloadedFlows, preloadedFairValues, preloadedLoadedAt, preloadedIsLoading]);

  return { rows, isLoading };
};

export const buildTotalRow = (rows = [], activeQuarters = []) => {
  const total = { name: "Total", isTotal: true, timeframes: {} };
  activeQuarters.forEach((q) => {
    total.timeframes[q.id] = {
      cost: rows.reduce((sum, row) => sum + toNumber(row.timeframes?.[q.id]?.cost), 0),
      fv:   rows.reduce((sum, row) => sum + toNumber(row.timeframes?.[q.id]?.fv),   0),
    };
  });
  return total;
};

export const formatCompareMoney = (val) => {
  if (val === undefined || val === null) return "-";
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 })
    .format(val).replace(/,/g, " ");
};

export const diffBetweenNewestAndOldest = (row, key, activeQuarters = []) => {
  if (activeQuarters.length < 2) return "-";
  const newestId  = activeQuarters[0].id;
  const oldestId  = activeQuarters[activeQuarters.length - 1].id;
  const newestVal = toNumber(row?.timeframes?.[newestId]?.[key]);
  const oldestVal = toNumber(row?.timeframes?.[oldestId]?.[key]);
  return formatCompareMoney(newestVal - oldestVal);
};

export const getCompareColumnOptions = (activeQuarters = []) => {
  const options = [];
  activeQuarters.forEach((q) => { options.push({ key: `cost:${q.id}`, label: `Cost ${q.display_label}` }); });
  if (activeQuarters.length >= 2) options.push({ key: "change_cost", label: "Change in Cost" });
  activeQuarters.forEach((q) => { options.push({ key: `fv:${q.id}`, label: `FV ${q.display_label}` }); });
  if (activeQuarters.length >= 2) options.push({ key: "change_fv", label: "Change in FV" });
  return options;
};

export const getCompareValueByColumn = (row, columnKey, activeQuarters = []) => {
  if (!row || !columnKey) return 0;
  if (columnKey.startsWith("cost:")) return toNumber(row?.timeframes?.[Number(columnKey.split(":")[1])]?.cost);
  if (columnKey.startsWith("fv:"))   return toNumber(row?.timeframes?.[Number(columnKey.split(":")[1])]?.fv);
  if (columnKey === "change_cost" || columnKey === "change_fv") {
    if (activeQuarters.length < 2) return 0;
    const key      = columnKey === "change_cost" ? "cost" : "fv";
    const newestId = activeQuarters[0].id;
    const oldestId = activeQuarters[activeQuarters.length - 1].id;
    return toNumber(row?.timeframes?.[newestId]?.[key]) - toNumber(row?.timeframes?.[oldestId]?.[key]);
  }
  return 0;
};