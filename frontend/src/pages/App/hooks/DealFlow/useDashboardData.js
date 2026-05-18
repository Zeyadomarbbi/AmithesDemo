// Replace the mock data blocks below with real API calls when the backend is ready.
// The hook signature — useDashboardData({ status, stage, fund }) — stays the same.

const MOCK_SECTOR_DATA = [
  { name: "Healthcare", value: 4,  color: "#E8734A" },
  { name: "Utilities",  value: 13, color: "#375A89" },
  { name: "Energy",     value: 3,  color: "#C8A97A" },
];

const MOCK_COUNTRY_DATA = [
  { name: "Egypt",       value: 8, color: "#7B6FC6" },
  { name: "Ivory Coast", value: 7, color: "#D94F5C" },
  { name: "Morocco",     value: 5, color: "#F5C842" },
];

const MOCK_CURRENCY_DATA = [
  { name: "USD", value: 9, color: "#E8734A" },
  { name: "EUR", value: 9, color: "#375A89" },
  { name: "MAD", value: 9, color: "#F5C842" },
  { name: "EGP", value: 9, color: "#4A5568" },
];

const MOCK_BAR_DATA = [
  { month: "Dec", fundIII: 1, menaIII: 0, menaII: 1 },
  { month: "Jan", fundIII: 2, menaIII: 1, menaII: 1 },
  { month: "Feb", fundIII: 1, menaIII: 0, menaII: 1 },
  { month: "Mar", fundIII: 2, menaIII: 0, menaII: 1 },
  { month: "Apr", fundIII: 2, menaIII: 0, menaII: 0 },
  { month: "May", fundIII: 1, menaIII: 0, menaII: 0 },
  { month: "Jun", fundIII: 5, menaIII: 2, menaII: 1 },
];

const MOCK_FUNNEL_DATA = [
  { stage: "Dropped",  value: 70 },
  { stage: "Briefing", value: 30 },
  { stage: "IC 1",     value: 21 },
  { stage: "IC 2",     value: 12 },
  { stage: "Invested", value: 9  },
];

const MOCK_BAR_TOTALS = { fundIII: 14, menaIII: 3, menaII: 5 };

export function useDashboardData({ status, stage, fund } = {}) {
  // TODO: replace with API call, e.g.:
  // const { data, isLoading } = useQuery(['dashboard', status, stage, fund], () =>
  //   fetchDashboardData({ status, stage, fund })
  // );

  return {
    sectorData:   MOCK_SECTOR_DATA,
    countryData:  MOCK_COUNTRY_DATA,
    currencyData: MOCK_CURRENCY_DATA,
    barData:      MOCK_BAR_DATA,
    barTotals:    MOCK_BAR_TOTALS,
    funnelData:   MOCK_FUNNEL_DATA,
    isLoading:    false,
  };
}
