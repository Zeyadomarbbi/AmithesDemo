import * as XLSX from "xlsx";

function parseValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const clean = String(value).replace(/[^\d.-]/g, "");
  return parseFloat(clean) || 0;
}

function buildSheet(years, rows, getYearValue) {
  const headers = ["PnL", ...years.map((y) => y.year), "Total cumulated"];

  const dataRows = rows.map((row) => {
    const yearValues = years.map((y) => parseValue(getYearValue(row, y.year)));
    const rowTotal = yearValues.reduce((a, b) => a + b, 0);
    return [row.label ?? "", ...yearValues, rowTotal];
  });

  const wsData = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [{ wch: 28 }, ...years.map(() => ({ wch: 14 })), { wch: 18 }];
  return ws;
}

export function downloadFinancialsAsExcel({ years, financialRows, calculateNetProfitTotal, getYearValue }) {
  const incomeRows  = financialRows.filter((r) => r.category === "Income");
  const expenseRows = financialRows.filter((r) => r.category === "Expense");
  const taxRows     = financialRows.filter((r) => r.category === "Tax");

  // Total sheet: total-band rows + net profit
  const totalRows = financialRows.filter(
    (r) => r.type === "total-band" || r.type === "net-profit"
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet(years, incomeRows,  getYearValue), "Income");
  XLSX.utils.book_append_sheet(wb, buildSheet(years, expenseRows, getYearValue), "Expense");
  XLSX.utils.book_append_sheet(wb, buildSheet(years, taxRows,     getYearValue), "Tax");
  XLSX.utils.book_append_sheet(wb, buildSheet(years, totalRows,   getYearValue), "Summary");

  XLSX.writeFile(wb, "Financial_Projections.xlsx");
}