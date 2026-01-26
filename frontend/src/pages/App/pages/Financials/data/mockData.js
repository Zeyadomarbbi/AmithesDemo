// frontend/src/pages/App/pages/Financials/data/mockData.js

export const pnlPeriods = [
  { id: "q1_2024", label: "Q1 2024 (€)" },
  { id: "q1_2025", label: "Q1 2025 (€)" },
];

/**
 * If QuarterSelector needs these, keep them.
 * Otherwise you can delete them later.
 */
export const timeframeData = [
  { id: 1, label: "Q1 2024", date: "08/03/26", checked: true },
  { id: 2, label: "Q1 2025", date: "08/07/26", checked: true },
];

export const quarterOptions = [
  { id: 1, label: "Q1 2024", date: "08/03/26" },
  { id: 2, label: "Q2 2024", date: "08/07/26" },
  { id: 3, label: "Q3 2024", date: "08/10/26" },
  { id: 4, label: "Q4 2024", date: "08/12/26" },
];

/**
 * ✅ Lines = labels only (UI renders the inputs from incomeValues/expenseValues)
 * ✅ isCustom false so pencil/edit icon shows only for base rows
 */
export const incomeLines = [
  { id: "realized_gain", label: "Realized gain", isCustom: false },
  { id: "unrealized_gain", label: "Unrealized gain", isCustom: false },
  { id: "fx_gain", label: "FX gain", isCustom: false },
  { id: "dividends", label: "Dividends & Interests", isCustom: false },
  { id: "other_income", label: "Other income", isCustom: false },
];

export const expenseLines = [
  { id: "management_fees", label: "Management fees", isCustom: false },
  { id: "dd_fees", label: "Due diligence fees", isCustom: false },
  { id: "opex", label: "Opex", isCustom: false },
  { id: "unrealized_losses", label: "Unrealized losses", isCustom: false },
  { id: "fx_losses", label: "FX losses", isCustom: false },
];

/**
 * Limits tab mock stays the same (until we wire DB later) */
export const limitsRows = [
  {
    id: "due_dil_fees",
    name: "Due dil. fees",
    article: "Art 8.7",
    description: "Due diligence fees borne by the fund shall be capped to 2.00%",
    limit: "2.00%",
    q4: "1.17%",
    scenario: "2.05%",
    breach: true,
  },
  {
    id: "opex",
    name: "Opex",
    article: "Art 8.8",
    description: "Operating expenses borne by the fund shall be capped to 4.00%",
    limit: "4.00%",
    q4: "2.14%",
    scenario: "3.75%",
    breach: false,
  },
  {
    id: "man_fees",
    name: "Man. fees",
    article: "Art 8.9",
    description: "Management Fee to be paid shall be capped to 17.00%",
    limit: "17.00%",
    q4: "5.14%",
    scenario: "15.75%",
    breach: false,
  },
];
