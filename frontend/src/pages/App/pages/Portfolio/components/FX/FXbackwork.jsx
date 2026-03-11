import { useCallback, useEffect, useMemo, useState } from "react";
import { useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import { API_BASE_URL } from "../../../../../../hooks/api/apiConfig";

export const parseFxValue = (value) => {
  if (!value || value === "-") return 0;
  return parseFloat(String(value).replace(/\s/g, "").replace("âˆ’", "-"));
};

export const formatFxValue = (numberValue) => {
  if (numberValue === 0) return "-";
  const formatted = new Intl.NumberFormat("en-US")
    .format(Math.abs(numberValue))
    .replace(/,/g, " ");
  return numberValue < 0 ? `- ${formatted}` : formatted;
};

export const formatImpactHeader = (impactKey) =>
  impactKey.replace("impact", "Impact ").replace(/(\d{4})$/, " $1");

const normalizeQuarterLabel = (label) => String(label || "").replace(/\s/g, "");

const toImpactKeyForQuarter = (displayLabel) =>
  `impact${normalizeQuarterLabel(displayLabel)}`;

const toFxAsOfKeyForQuarter = (displayLabel) =>
  `fxAsOf${normalizeQuarterLabel(displayLabel)}`;

const toFairValueKeyForQuarter = (displayLabel) =>
  `fairValue${normalizeQuarterLabel(displayLabel)}`;

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return String(isoDate);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatFxRate = (rate) => {
  const n = Number(rate);
  if (!Number.isFinite(n) || n === 0) return "-";
  return n.toFixed(4);
};

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const canonicalFlowType = (value) => {
  const type = String(value || "").trim().toLowerCase();
  if (!type) return "";
  if (type.includes("partial") && type.includes("divest")) return "Partial divestment";
  if (type.includes("divest")) return "Divestment";
  if (type.includes("dividend")) return "Dividend";
  if (type.includes("interest")) return "Interest";
  if (type.includes("investment")) return "Investment";
  if (type.includes("invest")) return "Investment";
  if (type.includes("other")) return "Other";
  return type;
};

const getFlowTypeName = (flow) =>
  flow?.transaction_name ??
  flow?.transaction_type_name ??
  flow?.transaction_type?.name ??
  flow?.transaction_type ??
  flow?.type ??
  "";

const isInvestmentCostFlow = (flow) =>
  canonicalFlowType(getFlowTypeName(flow)) === "Investment";

const pickLatestByDate = (rows, cutoffDate) => {
  const cutoff = cutoffDate ? new Date(cutoffDate) : null;
  const filtered = rows
    .filter((row) => row?.date)
    .filter((row) => {
      if (!cutoff) return true;
      const rowDate = new Date(row.date);
      return !Number.isNaN(rowDate.getTime()) && rowDate <= cutoff;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return filtered.length ? filtered[filtered.length - 1] : null;
};

const getSortedFlowsWithFx = (flows = []) =>
  flows
    .filter((flow) => flow?.date)
    .map((flow) => ({
      ...flow,
      __date: new Date(flow.date),
      __fx: Number(flow.fx_rate ?? flow.fxRate),
    }))
    .filter((flow) => !Number.isNaN(flow.__date.getTime()) && Number.isFinite(flow.__fx) && flow.__fx > 0)
    .sort((a, b) => a.__date - b.__date);

const getFxAsOfDate = (sortedFlows, cutoffDate) => {
  if (!sortedFlows.length) return null;
  const cutoff = new Date(cutoffDate);
  if (Number.isNaN(cutoff.getTime())) return null;

  const eligible = sortedFlows.filter((flow) => flow.__date <= cutoff);
  if (eligible.length) return eligible[eligible.length - 1].__fx;
  return sortedFlows[0].__fx;
};

const getQuarterIndex = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor(d.getMonth() / 3);
};

const getYearAndQuarter = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), quarter: getQuarterIndex(d) };
};

const getQuarterEndDate = (year, quarterIndex) => {
  if (!Number.isFinite(year) || !Number.isFinite(quarterIndex)) return null;
  return new Date(year, quarterIndex * 3 + 3, 0);
};

const getQuarterAnchorDate = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  const q = getQuarterIndex(d);
  return getQuarterEndDate(d.getFullYear(), q);
};

const getSameQuarterLastYearEndDate = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  const q = getQuarterIndex(d);
  return getQuarterEndDate(d.getFullYear() - 1, q);
};

const getFxForExactQuarter = (rowsWithFx, referenceDate) => {
  if (!rowsWithFx.length) return null;
  const target = getYearAndQuarter(referenceDate);
  if (!target) return null;

  const matched = rowsWithFx
    .filter((row) => row?.__date)
    .filter((row) => {
      const yq = getYearAndQuarter(row.__date);
      return yq && yq.year === target.year && yq.quarter === target.quarter;
    })
    .sort((a, b) => a.__date - b.__date);

  if (!matched.length) return null;
  return matched[matched.length - 1].__fx;
};

export const getLatestFxRowByCutoff = (rows = [], selectedTimeframes = []) => {
  const validRows = rows
    .filter((row) => row?.rawDate || row?.date)
    .map((row) => ({
      row,
      date: new Date(row.rawDate || row.date),
    }))
    .filter((item) => !Number.isNaN(item.date.getTime()));

  if (!validRows.length) return null;

  const cutoffCandidates = selectedTimeframes
    .map((tf) => new Date(tf?.rawDate || tf?.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  const cutoff = cutoffCandidates.length ? cutoffCandidates[cutoffCandidates.length - 1] : null;
  const eligible = cutoff
    ? validRows.filter((item) => item.date <= cutoff)
    : validRows;
  const targetPool = eligible.length ? eligible : validRows;
  const latest = targetPool.sort((a, b) => a.date - b.date)[targetPool.length - 1];

  return latest?.row || null;
};

export const resolveImpactKeys = (rows = [], selectedTimeframes = []) => {
  const dataRows = rows.filter((row) => row.type !== "total");
  const availableKeys = Object.keys(dataRows[0] || {}).filter(
    (key) => key.startsWith("impact") && key !== "impactInception"
  );

  if (!selectedTimeframes.length) return availableKeys;

  const availableMap = new Map(
    availableKeys.map((key) => [key.toLowerCase(), key])
  );

  return selectedTimeframes
    .map((timeframe) => availableMap.get(toImpactKeyForQuarter(timeframe.display_label).toLowerCase()))
    .filter(Boolean);
};

export const calculateDealTableTotals = (rows = [], impactKeys = []) => {
  const dataRows = rows.filter((row) => row.type !== "total");
  const totalFlow = dataRows.reduce(
    (sum, row) => sum + parseFxValue(row.flow ?? row.fairValueOnDate),
    0
  );
  const totalInception = dataRows.reduce(
    (sum, row) => sum + parseFxValue(row.impactInception),
    0
  );

  const impactTotals = impactKeys.reduce((acc, key) => {
    acc[key] = dataRows.reduce((sum, row) => sum + parseFxValue(row[key]), 0);
    return acc;
  }, {});

  return { dataRows, totalFlow, totalInception, impactTotals };
};

export const splitDealRowsIntoTwoTables = (rows = []) => {
  const dataRows = rows.filter((row) => row.type !== "total");
  if (dataRows.length <= 1) {
    return { firstTableRows: dataRows, secondTableRows: [] };
  }

  const splitIndex = Math.ceil(dataRows.length / 2);
  return {
    firstTableRows: dataRows.slice(0, splitIndex),
    secondTableRows: dataRows.slice(splitIndex),
  };
};

const buildFxRowFromFlow = ({
  flow,
  investment,
  allFairValues = [],
  selectedTimeframes,
}) => {
  const costLc = Math.abs(parseFxValue(flow.amount_lc));
  const sortedFairValueFx = getSortedFlowsWithFx(
    allFairValues.map((fv) => ({ date: fv.date, fx_rate: fv.fx_rate }))
  );
  const sortedFxTimeline = sortedFairValueFx;
  const oldestFx = sortedFxTimeline.length ? sortedFxTimeline[0].__fx : null;
  const latestFx = sortedFxTimeline.length
    ? sortedFxTimeline[sortedFxTimeline.length - 1].__fx
    : null;
  const fxAtInvestmentDate = getFxForExactQuarter(sortedFxTimeline, flow.date);
  const hasInvestmentDateFx = Number.isFinite(fxAtInvestmentDate) && fxAtInvestmentDate > 0;

  const row = {
    id: flow.flow_id ?? flow.id ?? `${investment.investment_id}-${flow.date}`,
    type: "row",
    rawDate: flow.date || null,
    date: formatDateDisplay(flow.date),
    flow: formatFxValue(costLc),
    currency: investment.currency_code || "-",
    fxRate: formatFxRate(hasInvestmentDateFx ? fxAtInvestmentDate : null),
    impactInception:
      oldestFx && latestFx
        ? formatFxValue(costLc / latestFx - costLc / oldestFx)
        : "-",
  };

  selectedTimeframes.forEach((timeframe) => {
    const impactKey = toImpactKeyForQuarter(timeframe.display_label);
    const fxAsOfKey = toFxAsOfKeyForQuarter(timeframe.display_label);

    const timeframeDate = timeframe.rawDate || timeframe.date;
    const timeframeQuarterDate = getQuarterAnchorDate(timeframeDate) || timeframeDate;
    const fxAtDate = getFxForExactQuarter(sortedFxTimeline, timeframeQuarterDate);
    const sameQuarterLastYearDate = getSameQuarterLastYearEndDate(timeframeDate);
    const fxOneYearBefore = sameQuarterLastYearDate
      ? getFxForExactQuarter(sortedFxTimeline, sameQuarterLastYearDate)
      : oldestFx;

    row[impactKey] =
      fxAtDate && fxOneYearBefore
        ? formatFxValue(costLc / fxAtDate - costLc / fxOneYearBefore)
        : "-";
    row[fxAsOfKey] = fxAtDate ? formatFxRate(fxAtDate) : "-";
  });

  return row;
};

const buildFxRowFromFairValue = ({
  fairValue,
  investment,
  allFairValues,
  selectedTimeframes,
}) => {
  const fairValueLc = parseFxValue(fairValue.amount_lc);
  const fairValueEur = Number(fairValue.amount);
  const fairValueDisplay = Number.isFinite(fairValueEur) && fairValueEur !== 0
    ? fairValueEur
    : fairValueLc;
  const sortedFairValueFx = getSortedFlowsWithFx(
    allFairValues.map((fv) => ({ date: fv.date, fx_rate: fv.fx_rate }))
  );
  const sortedFxTimeline = sortedFairValueFx;
  const oldestFx = sortedFxTimeline.length ? sortedFxTimeline[0].__fx : null;
  const latestFx = sortedFxTimeline.length
    ? sortedFxTimeline[sortedFxTimeline.length - 1].__fx
    : null;

  const row = {
    id: fairValue.fair_value_id ?? fairValue.id ?? `${investment.investment_id}-${fairValue.date}`,
    type: "row",
    rawDate: fairValue.date || null,
    date: formatDateDisplay(fairValue.date),
    fairValueOnDate: formatFxValue(fairValueDisplay),
    currency: investment.currency_code || "-",
    fxRate: formatFxRate(fairValue.fx_rate ?? fairValue.fxRate),
    impactInception:
      oldestFx && latestFx
        ? formatFxValue(fairValueLc / latestFx - fairValueLc / oldestFx)
        : "-",
  };

  selectedTimeframes.forEach((timeframe) => {
    const impactKey = toImpactKeyForQuarter(timeframe.display_label);
    const fxAsOfKey = toFxAsOfKeyForQuarter(timeframe.display_label);
    const fairValueKey = toFairValueKeyForQuarter(timeframe.display_label);

    const timeframeDate = timeframe.rawDate || timeframe.date;
    const timeframeQuarterDate = getQuarterAnchorDate(timeframeDate) || timeframeDate;
    const fxAtDate = getFxForExactQuarter(sortedFxTimeline, timeframeQuarterDate);
    const sameQuarterLastYearDate = getSameQuarterLastYearEndDate(timeframeDate);
    const fxOneYearBefore = sameQuarterLastYearDate
      ? getFxForExactQuarter(sortedFxTimeline, sameQuarterLastYearDate)
      : oldestFx;
    const latestFairValue = pickLatestByDate(allFairValues, timeframeQuarterDate);

    row[impactKey] =
      fxAtDate && fxOneYearBefore
        ? formatFxValue(fairValueLc / fxAtDate - fairValueLc / fxOneYearBefore)
        : "-";
    row[fxAsOfKey] = fxAtDate ? formatFxRate(fxAtDate) : "-";
    row[fairValueKey] = latestFairValue
      ? formatFxValue(
          Number.isFinite(Number(latestFairValue.amount)) &&
            Number(latestFairValue.amount) !== 0
            ? Number(latestFairValue.amount)
            : parseFxValue(latestFairValue.amount_lc)
        )
      : "-";
  });

  return row;
};

export const useFxDealsRows = (
  fundId,
  selectedTimeframes = [],
  fallbackData = [],
  preloadedDataset = null
) => {
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const preloadedInvestments = preloadedDataset?.investments;
  const preloadedFlows = preloadedDataset?.flowsByInvestment;
  const preloadedFairValues = preloadedDataset?.fairValuesByInvestment;
  const preloadedLoadedAt = preloadedDataset?.loadedAt;
  const preloadedIsLoading = preloadedDataset?.isLoading;

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      if (!fundId) {
        setInvestments([]);
        return;
      }

      const preloadedRows = toSafeArray(preloadedInvestments);
      if (preloadedIsLoading) {
        setIsLoading(true);
        return;
      }
      if (preloadedRows.length) {
        const byInvestment = preloadedRows.map((investment) => {
          const investmentId = Number(investment.investment_id ?? investment.id);
          const flows = toSafeArray(preloadedFlows?.[investmentId]);
          const costFlows = flows.filter(isInvestmentCostFlow);
          const fairValues = toSafeArray(preloadedFairValues?.[investmentId]);

          const flowRows = costFlows.map((flow) =>
            buildFxRowFromFlow({
              flow,
              investment,
              allFairValues: fairValues,
              selectedTimeframes,
            })
          );
          const fairValueRows = fairValues.map((fairValue) =>
            buildFxRowFromFairValue({
              fairValue,
              investment,
              allFairValues: fairValues,
              selectedTimeframes,
            })
          );

          return {
            title: investment.name || `Investment #${investmentId}`,
            costRows: flowRows,
            fvRows: fairValueRows,
          };
        });

        if (!isCancelled) {
          setInvestments(byInvestment);
          setIsLoading(false);
        }
        return;
      }
      if (preloadedLoadedAt) {
        if (!isCancelled) {
          setInvestments([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/`
        );
        if (!res.ok) throw new Error("Failed to fetch portfolio investments");

        const payload = await res.json();
        const portfolioRows = toSafeArray(payload?.rows || payload);
        const mappedInvestments = portfolioRows.filter(
          (row) => Number.isFinite(Number(row.investment_id ?? row.id))
        );

        const byInvestment = await Promise.all(
          mappedInvestments.map(async (investment) => {
            const investmentId = Number(investment.investment_id ?? investment.id);
            const [flowsRes, fairValuesRes] = await Promise.all([
              fetch(
                `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`
              ),
              fetch(
                `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`
              ),
            ]);

            const flows = flowsRes.ok ? toSafeArray(await flowsRes.json()) : [];
            const costFlows = flows.filter(isInvestmentCostFlow);
            const fairValues = fairValuesRes.ok
              ? toSafeArray(await fairValuesRes.json())
              : [];

            const flowRows = costFlows.map((flow) =>
              buildFxRowFromFlow({
                flow,
                investment,
                allFairValues: fairValues,
                selectedTimeframes,
              })
            );
            const fairValueRows = fairValues.map((fairValue) =>
              buildFxRowFromFairValue({
                fairValue,
                investment,
                allFairValues: fairValues,
                selectedTimeframes,
              })
            );

            return {
              title: investment.name || `Investment #${investmentId}`,
              costRows: flowRows,
              fvRows: fairValueRows,
            };
          })
        );

        if (!isCancelled) {
          setInvestments(byInvestment);
        }
      } catch (error) {
        console.error("Failed to load FX deals rows:", error);
        if (!isCancelled) {
          const mappedFallback = fallbackData.map((item) => ({
            title: item.title,
            costRows: item.rows || [],
            fvRows: item.rows || [],
          }));
          setInvestments(mappedFallback);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [
    fundId,
    fallbackData,
    selectedTimeframes,
    preloadedInvestments,
    preloadedFlows,
    preloadedFairValues,
    preloadedLoadedAt,
    preloadedIsLoading,
  ]);

  return { investments, isLoading };
};

export const useFxDealsTimeframes = (maxSelections = null) => {
  const { quarters, isLoading, saveTimeframe } = useTimeframeContext();
  const [selectedTimeframeIds, setSelectedTimeframeIds] = useState([]);
  const [debouncedSelectedTimeframeIds, setDebouncedSelectedTimeframeIds] = useState([]);

  useEffect(() => {
    if (!quarters.length) return;
    const hasAnySelected = selectedTimeframeIds.some((id) =>
      quarters.some((quarter) => Number(quarter.id) === Number(id))
    );
    if (!hasAnySelected) {
      const latest = quarters[quarters.length - 1];
      setSelectedTimeframeIds([Number(latest.id)]);
    }
  }, [quarters, selectedTimeframeIds]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSelectedTimeframeIds(selectedTimeframeIds);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedTimeframeIds]);

  const handleToggleTimeframe = useCallback((timeframeId) => {
    const id = Number(timeframeId);
    if (!Number.isFinite(id)) return;
    setSelectedTimeframeIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      const next = [...prev, id];
      if (Number.isFinite(Number(maxSelections)) && Number(maxSelections) > 0) return next.slice(-Number(maxSelections));
      return next;
    });
  }, [maxSelections]);

  const handleSaveTimeframe = useCallback(async (newTimeframe) => {
    const saved = await saveTimeframe(newTimeframe);
    setSelectedTimeframeIds((prev) => {
      const next = [...prev, Number(saved.id)];
      if (Number.isFinite(Number(maxSelections)) && Number(maxSelections) > 0) return next.slice(-Number(maxSelections));
      return next;
    });
    return saved;
  }, [maxSelections, saveTimeframe]);

  const selectedTimeframes = useMemo(() =>
    quarters.filter((quarter) => selectedTimeframeIds.includes(Number(quarter.id))),
    [quarters, selectedTimeframeIds]
  );

  const debouncedSelectedTimeframes = useMemo(() =>
    quarters.filter((quarter) => debouncedSelectedTimeframeIds.includes(Number(quarter.id))),
    [quarters, debouncedSelectedTimeframeIds]
  );

  return {
    quarters,
    isLoading,
    selectedTimeframeIds,
    selectedTimeframes,
    debouncedSelectedTimeframeIds,
    debouncedSelectedTimeframes,
    handleToggleTimeframe,
    handleSaveTimeframe,
  };
};