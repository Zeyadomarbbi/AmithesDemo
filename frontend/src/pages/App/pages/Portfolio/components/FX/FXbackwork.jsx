import { useCallback, useEffect, useMemo, useState } from "react";
import { useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";

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

const isYearEndDate = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  return d.getMonth() === 11 && d.getDate() === 31;
};

const buildHistoricalLabel = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue || "");
  if (isYearEndDate(d)) return `FY ${String(d.getFullYear()).slice(-2)}`;
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
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

const buildHistoricalTimeframesFromFairValues = (fairValues = []) => {
  const seen = new Set();
  return fairValues
    .filter((fairValue) => fairValue?.date)
    .map((fairValue) => {
      const rawDate = fairValue.date;
      return {
        id: fairValue.fair_value_id ?? fairValue.id ?? rawDate,
        rawDate,
        date: rawDate,
        display_label: buildHistoricalLabel(rawDate),
      };
    })
    .filter((timeframe) => {
      if (!timeframe.rawDate || seen.has(timeframe.rawDate)) return false;
      seen.add(timeframe.rawDate);
      return true;
    })
    .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
};

const matchesTimeframeDate = (itemDate, timeframeDate) => {
  const item = new Date(itemDate);
  const timeframe = new Date(timeframeDate);
  if (Number.isNaN(item.getTime()) || Number.isNaN(timeframe.getTime())) return false;
  return item.getFullYear() === timeframe.getFullYear() && item.getMonth() === timeframe.getMonth();
};

const filterFairValuesBySelectedTimeframes = (fairValues = [], selectedTimeframes = []) => {
  if (!selectedTimeframes.length) return fairValues;
  return fairValues.filter((fairValue) =>
    selectedTimeframes.some((timeframe) =>
      matchesTimeframeDate(fairValue?.date, timeframe?.rawDate || timeframe?.date)
    )
  );
};

const getFxForExactQuarter = (rowsWithFx, referenceDate) => {
  if (!rowsWithFx.length) return null;
  const target = getYearAndQuarter(referenceDate);
  if (!target) return null;

  // 1. Try exact quarter match first
  const matched = rowsWithFx
    .filter((row) => row?.__date)
    .filter((row) => {
      const yq = getYearAndQuarter(row.__date);
      return yq && yq.year === target.year && yq.quarter === target.quarter;
    })
    .sort((a, b) => a.__date - b.__date);

  if (matched.length) return matched[matched.length - 1].__fx;

  // 2. Fall back to the closest fx rate on or before the reference date
  const refDate = new Date(referenceDate);
  const before = rowsWithFx
    .filter((row) => row?.__date && row.__date <= refDate)
    .sort((a, b) => a.__date - b.__date);

  if (before.length) return before[before.length - 1].__fx;

  // 3. If nothing before, take the earliest available
  return rowsWithFx[0].__fx;
};

const getFxForSameQuarterExactYear = (rowsWithFx, referenceDate) => {
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

  return matched.length ? matched[matched.length - 1].__fx : null;
};

const getLastFlowOnOrBeforeDate = (flows = [], cutoffDate) => {
  const cutoff = new Date(cutoffDate);
  if (Number.isNaN(cutoff.getTime())) return null;
  const rows = flows
    .filter((flow) => flow?.date)
    .map((flow) => ({
      flow,
      date: new Date(flow.date),
      fx: Number(flow.fx_rate ?? flow.fxRate),
    }))
    .filter((item) =>
      !Number.isNaN(item.date.getTime()) &&
      item.date <= cutoff
    )
    .sort((a, b) => a.date - b.date);

  return rows.length ? rows[rows.length - 1].flow : null;
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
  allFlows = [],
  allFairValues = [],
  selectedTimeframes,
}) => {
  const costLc = Math.abs(parseFxValue(flow.amount_lc));
  const sortedCombinedTimeline = getSortedFlowsWithFx(
    [
      ...allFairValues.map((fv) => ({ date: fv.date, fx_rate: fv.fx_rate })),
      ...allFlows.map((timelineFlow) => ({
        date: timelineFlow.date,
        fx_rate: timelineFlow.fx_rate ?? timelineFlow.fxRate,
      })),
    ]
  );
  const sortedFxTimeline = sortedCombinedTimeline;
  const latestTimelineDate = sortedFxTimeline.length
    ? sortedFxTimeline[sortedFxTimeline.length - 1].__date
    : null;
  const latestFx = latestTimelineDate
    ? getFxForExactQuarter(sortedFxTimeline, latestTimelineDate)
    : null;
  const flowDateFx = getFxAsOfDate(sortedFxTimeline, flow.date);
  const fxAtInvestmentDate = getFxAsOfDate(sortedFxTimeline, flow.date);
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
      flowDateFx && latestFx
        ? formatFxValue(costLc / latestFx - costLc / flowDateFx)
        : "-",
  };

  selectedTimeframes.forEach((timeframe, index) => {
    const impactKey = toImpactKeyForQuarter(timeframe.display_label);
    const fxAsOfKey = toFxAsOfKeyForQuarter(timeframe.display_label);

    const timeframeDate = timeframe.rawDate || timeframe.date;
    const timeframeQuarterDate = getQuarterAnchorDate(timeframeDate) || timeframeDate;
    const fxAtDateForTimeframe = getFxForExactQuarter(sortedFxTimeline, timeframeQuarterDate);
    const sameQuarterLastYearDate = getSameQuarterLastYearEndDate(timeframeDate);
    const isOldestTimeframe = index === selectedTimeframes.length - 1;
    const fxAtDate = fxAtDateForTimeframe;
    const fxOneYearBefore = isOldestTimeframe
      ? flowDateFx
      : (
        sameQuarterLastYearDate
          ? (getFxForSameQuarterExactYear(sortedFxTimeline, sameQuarterLastYearDate) ?? flowDateFx)
          : flowDateFx
      );

    row[impactKey] =
      fxAtDate && fxOneYearBefore
        ? formatFxValue(costLc / fxAtDate - costLc / fxOneYearBefore)
        : "-";
    row[fxAsOfKey] = fxAtDateForTimeframe ? formatFxRate(fxAtDateForTimeframe) : "-";
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

  // Sort all fair values by date to build fx timeline
  const sortedFxTimeline = getSortedFlowsWithFx(
    allFairValues.map((fv) => ({ date: fv.date, fx_rate: fv.fx_rate }))
  );
  const oldestFx = sortedFxTimeline.length ? sortedFxTimeline[0].__fx : null;

  // Use this fair value's own fx_rate directly
  const thisFx = Number(fairValue.fx_rate ?? fairValue.fxRate);
  const thisFxValid = Number.isFinite(thisFx) && thisFx > 0;

  // fxOneYearBefore = fx of same quarter previous year
  const sameQuarterLastYearDate = getSameQuarterLastYearEndDate(fairValue.date);
  const fxOneYearBefore = sameQuarterLastYearDate
    ? getFxForExactQuarter(sortedFxTimeline, sameQuarterLastYearDate)
    : oldestFx;

  const row = {
    id: fairValue.fair_value_id ?? fairValue.id ?? `${investment.investment_id}-${fairValue.date}`,
    type: "row",
    rawDate: fairValue.date || null,
    date: formatDateDisplay(fairValue.date),
    fairValueOnDate: formatFxValue(fairValueDisplay),
    currency: investment.currency_code || "-",
    // fx rate = this fair value's own fx rate
    fxRate: thisFxValid ? formatFxRate(thisFx) : "-",
    // impact = (fvLc / thisFx) - (fvLc / fxOneYearBefore)
    impactPeriod:
      thisFxValid && fxOneYearBefore
        ? formatFxValue(fairValueLc / thisFx - fairValueLc / fxOneYearBefore)
        : "-",
    // inception = (fvLc / thisFx) - (fvLc / oldestFx)
    impactInception:
      thisFxValid && oldestFx
        ? formatFxValue(fairValueLc / thisFx - fairValueLc / oldestFx)
        : "-",
  };

  // Populate timeframe-keyed fields for compatibility with resolveImpactKeys
  selectedTimeframes.forEach((timeframe) => {
    const impactKey = toImpactKeyForQuarter(timeframe.display_label);
    const fxAsOfKey = toFxAsOfKeyForQuarter(timeframe.display_label);

    const timeframeDate = timeframe.rawDate || timeframe.date;
    const timeframeQuarterDate = getQuarterAnchorDate(timeframeDate) || timeframeDate;
    const fxAtTimeframe = getFxForExactQuarter(sortedFxTimeline, timeframeQuarterDate);
    const sameQuarterLastYearForTf = getSameQuarterLastYearEndDate(timeframeDate);
    const isOldestTimeframe = timeframe === selectedTimeframes[selectedTimeframes.length - 1];
    const fxOneYearBeforeForTf = sameQuarterLastYearForTf
      ? getFxForExactQuarter(sortedFxTimeline, sameQuarterLastYearForTf)
      : thisFx;

    row[impactKey] =
      fxAtTimeframe && (isOldestTimeframe ? thisFxValid : fxOneYearBeforeForTf)
        ? formatFxValue(
          fairValueLc / fxAtTimeframe -
          fairValueLc / (isOldestTimeframe ? thisFx : fxOneYearBeforeForTf)
        )
        : "-";
    row[fxAsOfKey] = fxAtTimeframe ? formatFxRate(fxAtTimeframe) : "-";
  });

  row.impactInception =
    thisFxValid && oldestFx
      ? formatFxValue(fairValueLc / thisFx - fairValueLc / oldestFx)
      : "-";

  if (selectedTimeframes.length) {
    const latestTimeframe = selectedTimeframes[0];
    const latestTimeframeDate = latestTimeframe?.rawDate || latestTimeframe?.date;
    const latestTimeframeQuarterDate = getQuarterAnchorDate(latestTimeframeDate) || latestTimeframeDate;
    const latestFxForInception = getFxForExactQuarter(sortedFxTimeline, latestTimeframeQuarterDate);

    row.impactInception =
      thisFxValid && latestFxForInception
        ? formatFxValue(fairValueLc / latestFxForInception - fairValueLc / thisFx)
        : row.impactInception;
  }

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
  const preloadedIsLoading = preloadedDataset?.isLoading;

  const selectedTimeframesKey = useMemo(
    () => selectedTimeframes.map((tf) => `${tf.id}:${tf.rawDate || tf.date}`).join("|"),
    [selectedTimeframes]
  );

  useEffect(() => {
    let isCancelled = false;

    if (preloadedIsLoading) {
      setIsLoading(true);
      return;
    }

    const preloadedRows = toSafeArray(preloadedInvestments);
    const byInvestment = preloadedRows.map((investment) => {
      const investmentId = Number(investment.investment_id ?? investment.id);
      const flows = toSafeArray(investment.transaction_flows);
      const costFlows = flows.filter(isInvestmentCostFlow);
      const fairValues = toSafeArray(investment.fair_value_flows);
      const historicalTimeframes = buildHistoricalTimeframesFromFairValues(fairValues);
      const filteredFairValues = filterFairValuesBySelectedTimeframes(fairValues, selectedTimeframes);

      return {
        title: investment.name || `Investment #${investmentId}`,
        timeframes: historicalTimeframes,
        costRows: costFlows.map((flow) =>
          buildFxRowFromFlow({
            flow,
            investment,
            allFlows: flows,
            allFairValues: fairValues,
            selectedTimeframes: historicalTimeframes,
          })
        ),
        fvRows: filteredFairValues.map((fairValue) =>
          buildFxRowFromFairValue({ fairValue, investment, allFairValues: fairValues, selectedTimeframes: historicalTimeframes })
        ),
      };
    });

    if (!isCancelled) {
      setInvestments(byInvestment);
      setIsLoading(false);
    }

    return () => { isCancelled = true; };
  }, [
    selectedTimeframesKey,
    preloadedInvestments,
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
