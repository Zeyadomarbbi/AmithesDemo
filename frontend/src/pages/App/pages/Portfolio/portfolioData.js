// portfolioData.js

export const UNREALIZED_ROWS = [
  {
    id: 1,
    fund_id: 1,
    type: "row",
    name: "Alyra BioTech",
    sector: "Healthcare",
    countryFlag: "🇩🇪",
    country: "Germany",
    ownership: "22.00%",
    cost: "6 000 000",
    dividends: "-",
    moic: "1.80x",
    irr: "14.00%",
    fairValue: "10 000 000",
    unrealizedGain: "4 000 000",
  },
  {
    id: 2,
    fund_id: 1,
    type: "row",
    name: "SBM Health Healthcare",
    sector: "Healthcare",
    countryFlag: "🇫🇷",
    country: "France",
    ownership: "15.00%",
    cost: "6 000 000",
    dividends: "100 000",
    moic: "1.76x",
    irr: "18.71%",
    fairValue: "9 500 000",
    unrealizedGain: "3 500 000",
  },
  {
    id: 3,
    fund_id: 1,
    type: "row",
    name: "Vantech AI",
    sector: "Technology",
    countryFlag: "🇳🇱",
    country: "Netherlands",
    ownership: "10.00%",
    cost: "8 000 000",
    dividends: "200 000",
    moic: "1.50x",
    irr: "9.00%",
    fairValue: "12 000 000",
    unrealizedGain: "4 000 000",
  },
  {
    id: 4,
    fund_id: 1,
    type: "row",
    name: "Medisis Industry",
    sector: "Healthcare",
    countryFlag: "🇬🇧",
    country: "UK",
    ownership: "15.00%",
    cost: "10 000 000",
    dividends: "-",
    moic: "1.50x",
    irr: "12.00%",
    fairValue: "15 000 000",
    unrealizedGain: "5 000 000",
  },
  {
    id: 5,
    fund_id: 1,
    type: "row",
    name: "NeoGrid Industry",
    sector: "Industry",
    countryFlag: "🇫🇷",
    country: "France",
    ownership: "18.00%",
    cost: "10 000 000",
    dividends: "300 000",
    moic: "2.10x",
    irr: "15.00%",
    fairValue: "21 000 000",
    unrealizedGain: "11 000 000",
  },
  {
    id: "unrealized-subtotal",
    type: "subtotal",
    cost: "40 000 000",
    dividends: "500 000",
    moic: "1.92x",
    irr: "13.62%",
    fairValue: "67 500 000",
    unrealizedGain: "27 500 000",
  },
];

export const REALIZED_ROWS = [
  {
    id: 1,
    fund_id: 1,
    type: "row",
    name: "Solenix Capital Bank",
    sector: "Financials",
    countryFlag: "🇳🇴",
    country: "Norway",
    ownership: "12.00%",
    cost: "4 500 000",
    dividends: "95 000",
    moic: "2.30x",
    irr: "16.00%",
    exitValue: "10 350 000",
    realized: "5 850 000",
  },
  {
    id: 2,
    fund_id: 1,
    type: "row",
    name: "Terapia Group Healthcare",
    sector: "Healthcare",
    countryFlag: "🇮🇹",
    country: "Italy",
    ownership: "20.00%",
    cost: "6 000 000",
    dividends: "200 000",
    moic: "2.80x",
    irr: "22.00%",
    exitValue: "16 800 000",
    realized: "10 800 000",
  },
  {
    id: "realized-subtotal",
    type: "subtotal",
    cost: "10 500 000",
    dividends: "295 000",
    moic: "2.50x",
    irr: "19.00%",
    exitValue: "27 150 000",
    realized: "16 650 000",
  },
];

export const LIMITS_DATA = {
  "1": [ // Fund ID
    {
      id: 1,
      name: "Single ticket",
      article: "Art 12.7",
      description: "No single investment shall represent more than 15.00%",
      limit: "15.00%",
      values: {
        "18": "13.15%", // Timeframe ID: Value
        "19": "14.20%"
      }
    },
    {
      id: 2,
      name: "Countries",
      article: "Art 12.8",
      description: "No more than 60.00% shall be invested in Spain",
      limit: "60.00%",
      values: {
        "18": "22.04%",
        "19": "25.10%"
      }
    }
  ]
};

const FX_INVESTMENT_1_ROWS = [
  {
    id: 1,
    type: "row",
    date: "18/06/2021",
    flow: "10 000 000",
    currency: "GBP",
    fxRate: "0.8801",
    impactQ22023: "31 025",
    impactQ32023: "31 025",
    impactQ42023: "21 547",
    impactQ12024: "32 143",
    impactQ22024: "- 5 785",
    impactQ42024: "210 547",
    impactInception: "150 875",
  },
  {
    id: 2,
    type: "row",
    date: "23/10/2021",
    flow: "2 000 000",
    currency: "GBP",
    fxRate: "0.8554",
    impactQ22023: "31 025",
    impactQ32023: "31 025",
    impactQ42023: "31 025",
    impactQ12024: "22 547",
    impactQ22024: "- 10 875",
    impactQ42024: "310 025",
    impactInception: "225 365",
  },

];

const FX_INVESTMENT_2_ROWS = [
  {
    id: 1,
    type: "row",
    date: "01/02/2024",
    flow: "4 500 000",
    currency: "USD",
    fxRate: "1.0807",
    impactQ42023: "-",
    impactQ22024: "124 574",
    impactQ42024: "117 874",
    impactInception: "117 874",
  },
  {
    id: 2,
    type: "row",
    date: "08/02/2024",
    flow: "3 500 000",
    currency: "USD",
    fxRate: "1.0807",
    impactQ42023: "-",
    impactQ22024: "101 631",
    impactQ42024: "97 320",
    impactInception: "97 320",
  },
  {
    id: 3,
    type: "row",
    date: "13/11/2024",
    flow: "2 500 000",
    currency: "USD",
    fxRate: "1.1053",
    impactQ42023: "-",
    impactQ22024: "- 95 157",
    impactQ42024: "- 101 965",
    impactInception: "- 101 965",
  },

];

const FX_INVESTMENT_3_ROWS = [
  {
    id: 1,
    type: "row",
    date: "18/06/2021",
    flow: "100 000 000",
    currency: "MAD",
    fxRate: "10.8801",
    impactQ42023: "210 547",
    impactQ22024: "- 50 785",
    impactQ42024: "210 547",
    impactInception: "150 875",
  },
  {
    id: 2,
    type: "row",
    date: "23/10/2021",
    flow: "20 000 000",
    currency: "MAD",
    fxRate: "10.8554",
    impactQ42023: "310 025",
    impactQ22024: "- 100 875",
    impactQ42024: "310 025",
    impactInception: "225 365",
  },
];

const FX_INVESTMENT_4_ROWS = [
  {
    id: 1,
    type: "row",
    date: "18/06/2021",
    flow: "100 000 000",
    currency: "MAD",
    fxRate: "10.8801",
    impactQ42023: "210 547",
    impactQ22024: "- 50 785",
    impactQ42024: "210 547",
    impactInception: "150 875",
  },
  {
    id: 2,
    type: "row",
    date: "23/10/2021",
    flow: "20 000 000",
    currency: "MAD",
    fxRate: "10.8554",
    impactQ42023: "310 025",
    impactQ22024: "- 100 875",
    impactQ42024: "310 025",
    impactInception: "225 365",
  },
];

export const FX_DEALS_DATA = {
  "1": [ // fundId: 1
    { title: "Investment #1", rows: FX_INVESTMENT_1_ROWS },
    { title: "Investment #2", rows: FX_INVESTMENT_2_ROWS },
    { title: "Investment #3", rows: FX_INVESTMENT_3_ROWS },
  ],
  "2": [ // fundId: 2
    { title: "Investment #4", rows: FX_INVESTMENT_4_ROWS },
  ]
};

export const FX_PORTFOLIO_DATA = {
  "1": {
    rows: [
      {
        id: "inv-1",
        name: "Investment #1",
        cost: "12 000 000",
        currency: "GBP",
        fxEntry: "0.8762",
        impactQ42023: "52 572",
        impactQ22024: "- 16 660",
        impactQ42024: "520 572",
        impactInception: "376 240",
      },
      {
        id: "inv-2",
        name: "Investment #2",
        cost: "10 500 000",
        currency: "USD",
        fxEntry: "1.0964",
        impactQ42023: "-",
        impactQ22024: "131 048",
        impactQ42024: "113 229",
        impactInception: "113 229",
      },
      {
        id: "inv-3",
        name: "Investment #3",
        cost: "120 000 000",
        currency: "MAD",
        fxEntry: "10.8762",
        impactQ42023: "520 572",
        impactQ22024: "- 160 660",
        impactQ42024: "520 572",
        impactInception: "376 240",
      }
    ],
    total: {
      cost: "142 500 000",
      impactQ42023: "573 144",
      impactQ22024: "- 46 272",
      impactQ42024: "1 154 041",
      impactInception: "865 709",
    }
  },
  "2": {
    rows: [
      {
        id: "inv-4",
        name: "Investment #4",
        cost: "120 000 000",
        currency: "MAD",
        fxEntry: "10.8762",
        impactQ42023: "520 572",
        impactQ22024: "- 160 660",
        impactQ42024: "520 572",
        impactInception: "376 240",
      }
    ],
    total: {
      cost: "120 000 000",
      impactQ42023: "520 572",
      impactQ22024: "- 160 660",
      impactQ42024: "520 572",
      impactInception: "376 240",
    }
  }
};


export const PORTFOLIO_COMPARE_DATA = {
  "1": [ // Fund ID: 1
    {
      id: 101,
      name: "Alyra BioTech",
      sector: "BioTech",
      // Data keyed by Timeframe ID (e.g., 18, 19 from your DB)
      timeframes: {
        18: { cost: 8000000, fv: 15000000, moic: 1.88 }, // Oldest (e.g., Q1)
        19: { cost: 8000000, fv: 16500000, moic: 2.06 }, // Newest (e.g., Q2)
        // Add more IDs as needed...
      }
    },
    {
      id: 102,
      name: "SBM Health Healthcare",
      sector: "Healthcare",
      timeframes: {
        18: { cost: 10000000, fv: 16000000, moic: 1.60 },
        19: { cost: 9000000, fv: 12000000, moic: 1.33 }
      }
    },
    {
      id: 103,
      name: "Vantech AI",
      sector: "AI",
      timeframes: {
        18: { cost: 9000000, fv: 18000000, moic: 2.00 },
        19: { cost: 8500000, fv: 15000000, moic: 1.76 }
      }
    }
  ],
  "2": [ // Fund ID: 2
    {
      id: 201,
      name: "Medisis Industry",
      sector: "Industry",
      timeframes: {
        18: { cost: 9000000, fv: 13000000, moic: 1.44 },
        19: { cost: 9000000, fv: 13000000, moic: 1.44 }
      }
    }
  ]
};
