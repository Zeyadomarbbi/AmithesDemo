import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatValue(value, suffix) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  switch (suffix) {
    case "%":  return `${num.toFixed(2)}%`;
    case "x":  return `${num.toFixed(2)}x`;
    default: {
      // Number formatter: space-separated thousands
      return num.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
  }
}

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const HEADER_FILL = { fill: "375A89", type: ShadingType.CLEAR };
const ALT_FILL    = { fill: "F8FAFC", type: ShadingType.CLEAR };
// Added a specific fill for expanded rows to match the UI grey
const EXPANDED_FILL = { fill: "F3F4F6", type: ShadingType.CLEAR }; 
const CELL_MARGINS = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: HEADER_FILL,
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18, font: "Arial" })],
      }),
    ],
  });
}

// Added textColor parameter to style the waterfall labels differently
function dataCell(text, width, isKpi = false, fillStyle = undefined, textColor = "000000") {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: fillStyle,
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: isKpi ? AlignmentType.LEFT : AlignmentType.RIGHT,
        children: [new TextRun({ text, size: 18, font: "Arial", bold: isKpi, color: textColor })],
      }),
    ],
  });
}

// ─── Main export ────────────────────────────────────────────────────────────

// NOTE: Added navDetails to the destructured arguments
export async function downloadCASAsWord({ rows, columns, adjustedNavValues, navDetails, timeframeLabel }) {
  // Page: A4 landscape with 0.75" margins
  // Content width = 16838 - 2*1080 = 14678 DXA
  const CONTENT_WIDTH = 14678;
  const KPI_COL_WIDTH = 3200;
  const dataColWidth  = Math.floor((CONTENT_WIDTH - KPI_COL_WIDTH) / columns.length);
  // Recalculate to ensure exact sum
  const totalDataWidth = CONTENT_WIDTH - KPI_COL_WIDTH;
  const colWidths = [KPI_COL_WIDTH, ...columns.map(() => Math.floor(totalDataWidth / columns.length))];
  // Adjust last column for rounding
  const widthSum = colWidths.reduce((a, b) => a + b, 0);
  colWidths[colWidths.length - 1] += CONTENT_WIDTH - widthSum;

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("KPIs", colWidths[0]),
      ...columns.map((col, i) => headerCell(col.label, colWidths[i + 1])),
    ],
  });

  // Data rows
  const dataRows = rows.map((row, rowIdx) => {
    const isAlt = rowIdx % 2 === 1;
    const fill = isAlt ? ALT_FILL : undefined;
    return new TableRow({
      children: [
        dataCell(row.kpi, colWidths[0], true, fill),
        ...columns.map((col, i) =>
          dataCell(formatValue(row.values?.[col.key], row.suffix), colWidths[i + 1], false, fill)
        ),
      ],
    });
  });

  // Adjusted NAV row (if any values exist)
  const hasAdjustedNav = Object.values(adjustedNavValues ?? {}).some(
    (v) => v !== "" && v !== null && v !== undefined
  );

  const adjustedNavRow = hasAdjustedNav
    ? new TableRow({
        children: [
          dataCell("    Adjusted NAV", colWidths[0], true, EXPANDED_FILL),
          ...columns.map((col, i) =>
            dataCell(
              formatValue(adjustedNavValues?.[col.key], undefined),
              colWidths[i + 1],
              false,
              EXPANDED_FILL
            )
          ),
        ],
      })
    : null;

  // Waterfall Details
  const waterfallMetrics = [
    { key: 'nominal', label: 'Nominal' },
    { key: 'hurdle',  label: 'Hurdle' },
    { key: 'catchup', label: 'Catch-up' },
    { key: 'special', label: 'Special Return' }
  ];

  const waterfallRows = [];
  // Only render if navDetails data is provided
  if (navDetails && navDetails.length > 0) {
    waterfallMetrics.forEach(metric => {
      const rowChildren = [
        // KPI Cell - Note the custom grey text color ("666666") and expanded fill
        dataCell(metric.label, colWidths[0], false, EXPANDED_FILL, "666666") 
      ];

      columns.forEach((col, i) => {
        // Map column key back to navDetails label ("total" -> "Fund")
        const targetLabel = col.key === "total" ? "Fund" : col.key;
        const colData = navDetails.find((d) => d.label === targetLabel);
        const val = colData ? colData[metric.key] : null;

        // Data Cell
        rowChildren.push(dataCell(formatValue(val), colWidths[i + 1], false, EXPANDED_FILL));
      });

      waterfallRows.push(new TableRow({ children: rowChildren }));
    });
  }

  // Combine all rows into the final table
  const tableRows = [
      headerRow, 
      ...dataRows, 
      ...(adjustedNavRow ? [adjustedNavRow] : []),
      ...waterfallRows // Append waterfall rows at the bottom
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,
              height: 16838,
              orientation: "landscape",
            },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: "Capital Account Statement",
                bold: true,
                size: 32,
                font: "Arial",
                color: "375A89",
              }),
            ],
          }),

          // Timeframe subtitle
          ...(timeframeLabel
            ? [
                new Paragraph({
                  spacing: { after: 320 },
                  children: [
                    new TextRun({
                      text: `Period: ${timeframeLabel}`,
                      size: 20,
                      font: "Arial",
                      color: "64748B",
                    }),
                  ],
                }),
              ]
            : []),

          // Table
          new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            columnWidths: colWidths,
            rows: tableRows,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  const filename = `Capital_Account_Statement${timeframeLabel ? `_${timeframeLabel}` : ""}.docx`;
  saveAs(buffer, filename);
}