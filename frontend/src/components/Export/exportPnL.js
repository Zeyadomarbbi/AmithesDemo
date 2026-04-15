import * as XLSX from "xlsx-js-style";

const BLUE_BG  = { fgColor: { rgb: "375A89" } };
const WHITE_FG = { rgb: "FFFFFF" };
const BOLD     = { bold: true };

const blueCell = (v) => ({
  v,
  t: typeof v === "number" ? "n" : "s",
  s: {
    fill: {
      patternType: "solid",
      fgColor: { rgb: "FF375A89" }, // ARGB — alpha prefix required
    },
    font: {
      color: { rgb: "FFFFFFFF" },
      bold: true,
    },
  },
});

const plainCell = (v) => ({
  v,
  t: typeof v === "number" ? "n" : "s",
});

export function exportPnL({ filename, headerPeriods, incomeLines, incomeValues, totalIncomeByPeriod, expenseLines, expenseValues, totalExpensesByPeriod, taxLines, taxValues, totalTaxByPeriod, netByPeriod }) {
  const pids = headerPeriods.map((p) => String(p.id));
  const periodLabels = headerPeriods.map((p) =>
    (p?.label ?? p?.name ?? p?.display_label ?? p?.displayLabel ?? p?.period_name ?? "").trim()
  );

  const rows = [];

  const pushSection = (title, lines, values, totals) => {
    // Section header row
    rows.push([blueCell(title), ...periodLabels.map(blueCell)]);

    // Data rows
    (lines || []).forEach((line, i) => {
      const byPeriod = values?.[i]?.byPeriod || {};
      rows.push([
        plainCell(line?.label || line?.name || ""),
        ...pids.map((pid) => plainCell(Number(byPeriod[pid] || 0))),
      ]);
    });

    // Total row
    rows.push([
      blueCell(`Total ${title}`),
      ...pids.map((pid) => blueCell(Number(totals?.[pid] || 0))),
    ]);
  };

  pushSection("Income",  incomeLines,  incomeValues,  totalIncomeByPeriod);
  rows.push(Array(pids.length + 1).fill(plainCell(""))); // spacer
  pushSection("Expense", expenseLines, expenseValues, totalExpensesByPeriod);
  rows.push(Array(pids.length + 1).fill(plainCell("")));
  pushSection("Tax",     taxLines,     taxValues,     totalTaxByPeriod);
  rows.push(Array(pids.length + 1).fill(plainCell("")));

  // Net row
  rows.push([
    blueCell("Net Profit / Net Loss"),
    ...pids.map((pid) => blueCell(Number(netByPeriod?.[pid] || 0))),
  ]);

  // Build worksheet from cell objects
  const ws = {};
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr] = cell;
    });
  });
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: pids.length } });

  // Column widths
  ws["!cols"] = [
    { wch: 30 },
    ...pids.map(() => ({ wch: 18 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PnL");
  XLSX.writeFile(wb, filename || "pnl.xlsx");
}