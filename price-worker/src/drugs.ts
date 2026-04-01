// Drug definitions for NADAC price lookups.
// nadacSearch: partial string matched against the CMS NADAC ndc_description field.
// packSize: standard OTC pack size used to compute a pack price from per-unit cost.
//
// Keys are strength-specific (e.g. "acetaminophen_500") so each OTC strength
// gets its own live price from NADAC.

export type DrugDefinition = {
  key: string;         // matches priceKey in the app's otcDatabase
  genericName: string;
  strength: string;
  nadacSearch: string; // used in SQL LIKE query against NADAC ndc_description
  packSize: number;
  form: string;
};

export const DRUGS: DrugDefinition[] = [
  // ── Acetaminophen ───────────────────────────────────────────────────────
  {
    key: "acetaminophen_325",
    genericName: "Acetaminophen",
    strength: "325 mg",
    nadacSearch: "acetaminophen 325",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "acetaminophen_500",
    genericName: "Acetaminophen",
    strength: "500 mg",
    nadacSearch: "acetaminophen 500",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "acetaminophen_650",
    genericName: "Acetaminophen",
    strength: "650 mg ER",
    nadacSearch: "acetaminophen 650",
    packSize: 100,
    form: "tablet",
  },

  // ── Ibuprofen ───────────────────────────────────────────────────────────
  {
    key: "ibuprofen",
    genericName: "Ibuprofen",
    strength: "200 mg",
    nadacSearch: "ibuprofen 200",
    packSize: 100,
    form: "tablet",
  },

  // ── Naproxen ────────────────────────────────────────────────────────────
  {
    key: "naproxen",
    genericName: "Naproxen",
    strength: "220 mg",
    nadacSearch: "naproxen sodium 220",
    packSize: 100,
    form: "tablet",
  },

  // ── Aspirin ─────────────────────────────────────────────────────────────
  {
    key: "aspirin_81",
    genericName: "Aspirin",
    strength: "81 mg",
    nadacSearch: "aspirin 81",
    packSize: 120,
    form: "tablet",
  },
  {
    key: "aspirin_325",
    genericName: "Aspirin",
    strength: "325 mg",
    nadacSearch: "aspirin 325",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "aspirin_500",
    genericName: "Aspirin",
    strength: "500 mg",
    nadacSearch: "aspirin 500",
    packSize: 100,
    form: "tablet",
  },

  // ── Loratadine ──────────────────────────────────────────────────────────
  {
    key: "loratadine",
    genericName: "Loratadine",
    strength: "10 mg",
    nadacSearch: "loratadine 10",
    packSize: 30,
    form: "tablet",
  },

  // ── Cetirizine ──────────────────────────────────────────────────────────
  {
    key: "cetirizine_5",
    genericName: "Cetirizine HCl",
    strength: "5 mg",
    nadacSearch: "cetirizine 5",
    packSize: 45,
    form: "tablet",
  },
  {
    key: "cetirizine_10",
    genericName: "Cetirizine HCl",
    strength: "10 mg",
    nadacSearch: "cetirizine 10",
    packSize: 45,
    form: "tablet",
  },

  // ── Diphenhydramine ─────────────────────────────────────────────────────
  {
    key: "diphenhydramine_25",
    genericName: "Diphenhydramine",
    strength: "25 mg",
    nadacSearch: "diphenhydramine 25",
    packSize: 100,
    form: "capsule",
  },
  {
    key: "diphenhydramine_50",
    genericName: "Diphenhydramine",
    strength: "50 mg",
    nadacSearch: "diphenhydramine 50",
    packSize: 100,
    form: "capsule",
  },

  // ── Fexofenadine ────────────────────────────────────────────────────────
  {
    key: "fexofenadine_60",
    genericName: "Fexofenadine HCl",
    strength: "60 mg",
    nadacSearch: "fexofenadine 60",
    packSize: 45,
    form: "tablet",
  },
  {
    key: "fexofenadine_180",
    genericName: "Fexofenadine HCl",
    strength: "180 mg",
    nadacSearch: "fexofenadine 180",
    packSize: 45,
    form: "tablet",
  },

  // ── Omeprazole ──────────────────────────────────────────────────────────
  {
    key: "omeprazole",
    genericName: "Omeprazole",
    strength: "20 mg",
    nadacSearch: "omeprazole",
    packSize: 42,
    form: "capsule",
  },

  // ── Famotidine ──────────────────────────────────────────────────────────
  {
    key: "famotidine_10",
    genericName: "Famotidine",
    strength: "10 mg",
    nadacSearch: "famotidine 10",
    packSize: 50,
    form: "tablet",
  },
  {
    key: "famotidine_20",
    genericName: "Famotidine",
    strength: "20 mg",
    nadacSearch: "famotidine 20",
    packSize: 50,
    form: "tablet",
  },

  // ── Loperamide ──────────────────────────────────────────────────────────
  {
    key: "loperamide",
    genericName: "Loperamide",
    strength: "2 mg",
    nadacSearch: "loperamide 2",
    packSize: 48,
    form: "capsule",
  },

  // ── Simethicone ─────────────────────────────────────────────────────────
  {
    key: "simethicone_80",
    genericName: "Simethicone",
    strength: "80 mg",
    nadacSearch: "simethicone 80",
    packSize: 72,
    form: "tablet",
  },
  {
    key: "simethicone_125",
    genericName: "Simethicone",
    strength: "125 mg",
    nadacSearch: "simethicone 125",
    packSize: 72,
    form: "tablet",
  },
  {
    key: "simethicone_180",
    genericName: "Simethicone",
    strength: "180 mg",
    nadacSearch: "simethicone 180",
    packSize: 72,
    form: "tablet",
  },

  // ── Guaifenesin ─────────────────────────────────────────────────────────
  {
    key: "guaifenesin_200",
    genericName: "Guaifenesin",
    strength: "200 mg",
    nadacSearch: "guaifenesin 200",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "guaifenesin_400",
    genericName: "Guaifenesin",
    strength: "400 mg",
    nadacSearch: "guaifenesin 400",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "guaifenesin_600",
    genericName: "Guaifenesin",
    strength: "600 mg ER",
    nadacSearch: "guaifenesin 600",
    packSize: 40,
    form: "tablet",
  },
  {
    key: "guaifenesin_1200",
    genericName: "Guaifenesin",
    strength: "1200 mg ER",
    nadacSearch: "guaifenesin 1200",
    packSize: 28,
    form: "tablet",
  },

  // ── Dextromethorphan ────────────────────────────────────────────────────
  {
    key: "dextromethorphan",
    genericName: "Dextromethorphan",
    strength: "15 mg",
    nadacSearch: "dextromethorphan 15",
    packSize: 40,
    form: "tablet",
  },

  // ── Bismuth ─────────────────────────────────────────────────────────────
  {
    key: "bismuth",
    genericName: "Bismuth Subsalicylate",
    strength: "262 mg",
    nadacSearch: "bismuth subsalicylate 262",
    packSize: 48,
    form: "tablet",
  },

  // ── Docusate ────────────────────────────────────────────────────────────
  {
    key: "docusate_100",
    genericName: "Docusate Sodium",
    strength: "100 mg",
    nadacSearch: "docusate sodium 100",
    packSize: 100,
    form: "capsule",
  },
  {
    key: "docusate_250",
    genericName: "Docusate Sodium",
    strength: "250 mg",
    nadacSearch: "docusate sodium 250",
    packSize: 100,
    form: "capsule",
  },

  // ── Hydrocortisone ──────────────────────────────────────────────────────
  {
    key: "hydrocortisone",
    genericName: "Hydrocortisone",
    strength: "1% Cream",
    nadacSearch: "hydrocortisone 1%",
    packSize: 1,
    form: "cream",
  },
];

// Store brand names used to label generic items
export const STORE_BRANDS: Record<string, string> = {
  Walmart: "Equate",
  CVS: "CVS Health",
  Amazon: "Amazon Basic Care",
  Walgreens: "Walgreens Brand",
};

// Retail price multiplier over NADAC acquisition cost, per store.
// OTC generics use lower margins (1.3-1.8x) than Rx drugs because
// they are priced competitively as store-brand loss leaders.
export const STORE_MULTIPLIERS: Record<string, number> = {
  Walmart: 1.3,
  CVS: 1.6,
  Amazon: 1.4,
  Walgreens: 1.7,
};

// Deep-link search URLs per store
export const STORE_URLS: Record<string, (query: string) => string> = {
  Walmart: (q) =>
    `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  CVS: (q) =>
    `https://www.cvs.com/search?searchTerm=${encodeURIComponent(q)}`,
  Amazon: (q) =>
    `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  Walgreens: (q) =>
    `https://www.walgreens.com/search/results.jsp?Ntt=${encodeURIComponent(q)}`,
};
