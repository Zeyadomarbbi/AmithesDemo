import { useCallback, useEffect, useMemo, useState } from "react";
import { useTimeframeContext  } from "../../../../hooks/Core/TimeframeContext";
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
  rows
    .map((row) => {
      const base = `${row?.id ?? ""}:${row?.name ?? ""}`;
      const tf = quarters
        .map((q) => {
          const v = row?.timeframes?.[q.id] || {};
          return `${q.id}:${toNumber(v.cost)}:${toNumber(v.fv)}:${toNumber(v.dividends)}:${toNumber(v.interests)}:${toNumber(v.divestment)}`;
        })
        .join(",");
      return `${base}|${tf}`;
    })
    .join(";");

const canonicalType = (value) => {
  const t = String(value || "").trim().toLowerCase();
  if (t.includes("invest")) return "investment";
  if (t.includes("dividend")) return "dividend";
  if (t.includes("interest")) return "interest";
  if (t.includes("divest")) return "divestment";
  return "other";
};

const sumFlowsByTypeAsOfDate = (flows = [], cutoffDate, acceptedTypes = []) => {
  const cutoff = new Date(cutoffDate);
  const accepted = new Set(acceptedTypes);
  return flows
    .filter((flow) => flow?.date)
    .filter((flow) => {
      const d = new Date(flow.date);
      return !Number.isNaN(d.getTime()) && d <= cutoff;
    })
    .filter((flow) => accepted.has(canonicalType(flow.transaction_name)))
    .reduce((sum, flow) => sum + Math.abs(getAmountEur(flow)), 0);
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
    .filter((flow) => {
      const d = new Date(flow.date);
      return !Number.isNaN(d.getTime()) && d <= cutoff;
    })
    .filter((flow) => canonicalType(flow.transaction_name) === "investment")
    .reduce((sum, flow) => sum + Math.abs(getAmountEur(flow)), 0);
};

const fvAsOfDate = (fairValues = [], cutoffDate) => {
  const cutoff = new Date(cutoffDate);
  const eligible = fairValues
    .filter((fv) => fv?.date)
    .filter((fv) => {
      const d = new Date(fv.date);
      return !Number.isNaN(d.getTime()) && d <= cutoff;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!eligible.length) return 0;
  const latest = eligible[eligible.length - 1];
  return Math.abs(getAmountEur(latest));
};

export const useCompareTimeframes = (fundId, maxSelections = 2) => {
  const { quarters, isLoading, saveTimeframe } = useTimeframeContext();
  const [selectedTimeframeIds, setSelectedTimeframeIds] = useState([]);

  useEffect(() => {
    if (!quarters.length) return;
    const valid = selectedTimeframeIds.filter((id) =>
      quarters.some((q) => Number(q.id) === Number(id))
    );

    if (valid.length === 0) {
      const latestTwo = quarters.slice(-2).map((q) => Number(q.id));
      setSelectedTimeframeIds(latestTwo);
      return;
    }

    if (valid.length !== selectedTimeframeIds.length) {
      setSelectedTimeframeIds(valid);
    }
  }, [quarters, selectedTimeframeIds]);

  const handleToggleTimeframe = useCallback(
    (timeframeId) => {
      const id = Number(timeframeId);
      if (!Number.isFinite(id)) return;
      setSelectedTimeframeIds((prev) => {
        if (prev.includes(id)) return prev.filter((item) => item !== id);
        return [...prev, id].slice(-maxSelections);
      });
    },
    [maxSelections]
  );

  const handleSaveTimeframe = useCallback(
    async (newTimeframe) => {
      const saved = await saveTimeframe(newTimeframe);
      setSelectedTimeframeIds((prev) => [...prev, Number(saved.id)].slice(-maxSelections));
      return saved;
    },
    [maxSelections, saveTimeframe]
  );

  const activeQuarters = useMemo(
    () =>
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
  const preloadedIsLoading = preloadedDataset?.isLoading;
  const activeQuartersKey = useMemo(() => buildQuartersKey(activeQuarters), [activeQuarters]);

  useEffect(() => {
    let isCancelled = false;

    if (preloadedIsLoading) {
      setIsLoading(true);
      return;
    }

    const preloadedRows = toSafeArray(preloadedInvestments);
    const mapped = preloadedRows.map((inv) => {
      const investmentId = Number(inv.investment_id ?? inv.id);
      const flows = toSafeArray(inv.transaction_flows);
      const fairValues = toSafeArray(inv.fair_value_flows);

      const timeframes = activeQuarters.reduce((acc, q) => {
        const cutoff = q.rawDate || q.date;
        acc[q.id] = {
          cost: costAsOfDate(flows, cutoff),
          fv: fvAsOfDate(fairValues, cutoff),
          dividends: sumFlowsByTypeAsOfDate(flows, cutoff, ["dividend"]),
          interests: sumFlowsByTypeAsOfDate(flows, cutoff, ["interest"]),
          divestment: sumFlowsByTypeAsOfDate(flows, cutoff, ["divestment"]),
        };
        return acc;
      }, {});

      return {
        id: investmentId,
        name: inv.name || `Investment #${investmentId}`,
        sector: inv.sector || "",
        timeframes,
      };
    });

    if (!isCancelled) {
      setRows((prev) => {
        const prevSig = buildRowsSignature(prev, activeQuarters);
        const nextSig = buildRowsSignature(mapped, activeQuarters);
        return prevSig === nextSig ? prev : mapped;
      });
      setIsLoading(false);
    }

    return () => { isCancelled = true; };
  }, [
    activeQuartersKey,
    preloadedInvestments,
    preloadedIsLoading,
  ]);

  return { rows, isLoading };
};

export const buildTotalRow = (rows = [], activeQuarters = []) => {
  const total = { name: "Total", isTotal: true, timeframes: {} };

  activeQuarters.forEach((q) => {
    const cost = rows.reduce((sum, row) => sum + toNumber(row.timeframes?.[q.id]?.cost), 0);
    const fv = rows.reduce((sum, row) => sum + toNumber(row.timeframes?.[q.id]?.fv), 0);
    const dividends = rows.reduce((sum, row) => sum + toNumber(row.timeframes?.[q.id]?.dividends), 0);
    const interests = rows.reduce((sum, row) => sum + toNumber(row.timeframes?.[q.id]?.interests), 0);
    const divestment = rows.reduce((sum, row) => sum + toNumber(row.timeframes?.[q.id]?.divestment), 0);
    total.timeframes[q.id] = { cost, fv, dividends, interests, divestment };
  });

  return total;
};

export const formatCompareMoney = (val) => {
  if (val === undefined || val === null) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  })
    .format(val)
    .replace(/,/g, " ");
};

export const diffBetweenNewestAndOldest = (row, key, activeQuarters = []) => {
  if (activeQuarters.length < 2) return "-";
  const newestId = activeQuarters[0].id;
  const oldestId = activeQuarters[activeQuarters.length - 1].id;
  const newestVal = toNumber(row?.timeframes?.[newestId]?.[key]);
  const oldestVal = toNumber(row?.timeframes?.[oldestId]?.[key]);
  return formatCompareMoney(newestVal - oldestVal);
};

export const getCompareTableColumnOptions = (activeQuarters = []) => {
  const options = [];

  activeQuarters.forEach((q) => {
    options.push({
      key: `cost:${q.id}`,
      label: `Cost ${q.display_label}`,
    });
  });

  if (activeQuarters.length >= 2) {
    options.push({
      key: "change_cost",
      label: "Change in Cost",
    });
  }

  activeQuarters.forEach((q) => {
    options.push({
      key: `fv:${q.id}`,
      label: `FV ${q.display_label}`,
    });
  });

  if (activeQuarters.length >= 2) {
    options.push({
      key: "change_fv",
      label: "Change in FV",
    });
  }

  activeQuarters.forEach((q) => {
    options.push({
      key: `divestment:${q.id}`,
      label: `Divestment ${q.display_label}`,
    });
  });

  activeQuarters.forEach((q) => {
    options.push({
      key: `dividends:${q.id}`,
      label: `Dividends ${q.display_label}`,
    });
  });

  return options;
};

export const getCompareChartMetricOptions = () => [
  { key: "cost", label: "Cost" },
  { key: "fair_value", label: "Fair Value" },
  { key: "change_fv", label: "Change in Fair Value" },
  { key: "divestment", label: "Divestment" },
  { key: "dividends", label: "Dividends" },
  { key: "interests", label: "Interests" },
];

export const getCompareValueByColumn = (row, columnKey, activeQuarters = []) => {
  if (!row || !columnKey) return 0;

  if (columnKey.startsWith("cost:")) {
    const id = Number(columnKey.split(":")[1]);
    return toNumber(row?.timeframes?.[id]?.cost);
  }

  if (columnKey.startsWith("fv:")) {
    const id = Number(columnKey.split(":")[1]);
    return toNumber(row?.timeframes?.[id]?.fv);
  }

  if (columnKey.startsWith("divestment:")) {
    const id = Number(columnKey.split(":")[1]);
    return toNumber(row?.timeframes?.[id]?.divestment);
  }

  if (columnKey.startsWith("dividends:")) {
    const id = Number(columnKey.split(":")[1]);
    return toNumber(row?.timeframes?.[id]?.dividends);
  }

  const newestId = activeQuarters[0]?.id;
  const oldestId = activeQuarters[activeQuarters.length - 1]?.id;

  if (columnKey === "cost") {
    return toNumber(row?.timeframes?.[newestId]?.cost);
  }

  if (columnKey === "fair_value") {
    return toNumber(row?.timeframes?.[newestId]?.fv);
  }

  if (columnKey === "divestment") {
    return toNumber(row?.timeframes?.[newestId]?.divestment);
  }

  if (columnKey === "dividends") {
    return toNumber(row?.timeframes?.[newestId]?.dividends);
  }

  if (columnKey === "interests") {
    return toNumber(row?.timeframes?.[newestId]?.interests);
  }

  if (columnKey === "change_cost") {
    if (activeQuarters.length < 2) return 0;
    const newestVal = toNumber(row?.timeframes?.[newestId]?.cost);
    const oldestVal = toNumber(row?.timeframes?.[oldestId]?.cost);
    return newestVal - oldestVal;
  }

  if (columnKey === "change_fv") {
    if (activeQuarters.length < 2) return 0;
    const newestVal = toNumber(row?.timeframes?.[newestId]?.fv);
    const oldestVal = toNumber(row?.timeframes?.[oldestId]?.fv);
    return newestVal - oldestVal;
  }

  return 0;
};
