export const pnlPeriods = [
  { id: "q1_2024", label: "Q1 2024 (€)" },
  { id: "q1_2025", label: "Q1 2025 (€)" },
];

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

export const incomeLines = [
  { id: "realized_gain", label: "Realized gain", value: "500 000" },
  { id: "unrealized_gain", label: "Unrealized gain", value: "2 000 000" },
  { id: "fx_gain", label: "FX gain", value: "750 000" },
  { id: "dividends", label: "Dividends & Interests", value: "200 000" },
  { id: "other_income", label: "Other income", value: "50 000" },
];

export const expenseLines = [
  { id: "management_fees", label: "Management fees", value: "1 000 000" },
  { id: "dd_fees", label: "Due diligence fees", value: "500 000" },
  { id: "opex", label: "Opex", value: "150 000" },
  { id: "unrealized_losses", label: "Unrealized losses", value: "50 000" },
  { id: "fx_losses", label: "FX losses", value: "100 000" },
];

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