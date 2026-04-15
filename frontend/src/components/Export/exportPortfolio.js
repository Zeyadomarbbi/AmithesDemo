import * as XLSX from "xlsx-js-style";

const blueCell = (v, isPercentage = false) => ({
  v: v ?? "",
  t: typeof v === "number" ? "n" : "s",
  z: isPercentage ? "0.00%" : undefined,
  s: {
    fill: { patternType: "solid", fgColor: { rgb: "FF375A89" } },
    font: { color: { rgb: "FFFFFFFF" }, bold: true },
    alignment: { horizontal: "center" }
  },
});

const plainCell = (v, isPercentage = false) => ({
  v: v ?? "",
  t: typeof v === "number" ? "n" : "s",
  z: isPercentage ? "0.00%" : "#,##0.00",
});

const subtotalCell = (v, isPercentage = false) => ({
  v: v ?? "",
  t: typeof v === "number" ? "n" : "s",
  z: isPercentage ? "0.00%" : "#,##0.00",
  s: { font: { bold: true }, fill: { patternType: "solid", fgColor: { rgb: "FFF1F5F9" } } }
});


export const exportPortfolioSummary = (filename, sections, totalSummary, sectionVisibleKeys) => {
  try {
    const rows = [];
    const columnMapping = {
      country: "Geography",
      ownership: "Ownership",
      cost: "Cost",
      dividends: "Dividends",
      moicIncl: "MOIC (incl. div)",
      moicExcl: "MOIC (excl. div)",
      irr: "Gross IRR",
      value: "Value",
      gain: "Gain"
    };

    sections.forEach((section) => {
      const visibleKeys = sectionVisibleKeys[section.key] || [];
      const activeHeaders = ["Name", ...visibleKeys.map(key => columnMapping[key] || key)];
      const colCount = activeHeaders.length;

      rows.push([
        blueCell(section.title), 
        ...Array.from({ length: colCount - 1 }, () => blueCell(""))
      ]);

      rows.push(activeHeaders.map(h => ({ 
        v: h, 
        t: "s",
        s: { font: { bold: true }, border: { bottom: { style: "thin" } }, alignment: { horizontal: "center" } } 
      })));

      section.rows.forEach((r) => {
        const rowData = [plainCell(r.name)];
        visibleKeys.forEach(key => {
          if (key === "country") rowData.push(plainCell(r.country));
          else if (key === "ownership") rowData.push(plainCell(r.ownership ? r.ownership / 100 : 0, true));
          else if (key === "cost") rowData.push(plainCell(r.cost));
          else if (key === "dividends") rowData.push(plainCell(r.dividends));
          else if (key === "moicIncl") rowData.push(plainCell(r.moicIncl));
          else if (key === "moicExcl") rowData.push(plainCell(r.moicExcl));
          else if (key === "irr") rowData.push(plainCell(r.irr, true));
          else if (key === "value") rowData.push(plainCell(r.status === "realized" ? r.exitValue : r.fairValue));
          else if (key === "gain") rowData.push(plainCell(r.gain));
        });
        rows.push(rowData);
      });

      const subtotalRow = [subtotalCell(`Subtotal ${section.title}`)];
      visibleKeys.forEach(key => {
        const val = section.subtotal?.[key === "value" ? "value" : key];
        subtotalRow.push(subtotalCell(val, key === "irr" || key === "ownership"));
      });
      rows.push(subtotalRow);
      rows.push(Array.from({ length: colCount }, () => plainCell("")));
    });

    const summaryKeys = sectionVisibleKeys["summary"] || [];
    const summaryColCount = summaryKeys.length + 1;

    rows.push([
      blueCell("GRAND TOTAL SUMMARY"), 
      ...Array.from({ length: summaryColCount - 1 }, () => blueCell(""))
    ]);
    
    const grandTotalRow = [subtotalCell("Portfolio Total")];
    summaryKeys.forEach(key => {
      const val = totalSummary?.[key === "value" ? "value" : key];
      grandTotalRow.push(subtotalCell(val, key === "irr" || key === "ownership"));
    });
    rows.push(grandTotalRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Apply dynamic column width based on the largest section to prevent overlap clipping
    const maxCols = Math.max(...sections.map(s => (sectionVisibleKeys[s.key] || []).length));
    ws["!cols"] = [{ wch: 30 }, ...Array(maxCols).fill({ wch: 15 })];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Portfolio Summary");
    XLSX.writeFile(wb, filename);

  } catch (error) {
    console.error("Excel generation failed:", error);
  }
};