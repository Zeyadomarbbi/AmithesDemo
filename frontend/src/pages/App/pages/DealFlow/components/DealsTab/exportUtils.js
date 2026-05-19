import * as XLSX from "xlsx";

function sanitizeSheetName(name) {
  return String(name || "Sheet1")
    .replace(/[\\/*?:[\]]/g, " ")
    .slice(0, 31) || "Sheet1";
}

function sanitizeFileName(name) {
  return String(name || "export")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .trim()
    .replace(/\s+/g, "_") || "export";
}

export function exportRowsToExcel({ rows, columns, sheetName, fileName }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  const data = safeRows.map((row) => {
    const output = {};
    safeColumns.forEach((column) => {
      output[column.header] = typeof column.value === "function" ? column.value(row) : "";
    });
    return output;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName));
  XLSX.writeFile(workbook, `${sanitizeFileName(fileName)}.xlsx`);
}
