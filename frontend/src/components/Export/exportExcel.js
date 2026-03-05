import * as XLSX from "xlsx";

const sanitizeSheetName = (name) => {
  const safe = String(name || "Sheet")
    .replace(/[:\\/?*\[\]]/g, " ")
    .trim();
  return safe.slice(0, 31) || "Sheet";
};

export const exportWorkbook = (filename, sheets = []) => {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet, index) => {
    const name = sanitizeSheetName(sheet?.name || `Sheet ${index + 1}`);
    const rows = Array.isArray(sheet?.rows) ? sheet.rows : [];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, filename);
};
