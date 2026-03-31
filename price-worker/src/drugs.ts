// Drug definitions for NADAC price lookups.
// nadacSearch: partial string matched against the CMS NADAC ndc_description field.
// packSize: standard OTC pack size used to compute a pack price from per-unit cost.

export type DrugDefinition = {
  key: string;         // matches PRICE_DB key in the app
  genericName: string;
  strength: string;
  nadacSearch: string; // used in SQL LIKE query against NADAC ndc_description
  packSize: number;
  form: string;
};

export const DRUGS: DrugDefinition[] = [
  {
    key: "acetaminophen",
    genericName: "Acetaminophen",
    strength: "500 mg",
    nadacSearch: "acetaminophen 500",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "ibuprofen",
    genericName: "Ibuprofen",
    strength: "200 mg",
    nadacSearch: "ibuprofen 200",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "naproxen",
    genericName: "Naproxen",
    strength: "220 mg",
    nadacSearch: "naproxen sodium 220",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "aspirin",
    genericName: "Aspirin",
    strength: "81 mg",
    nadacSearch: "aspirin 81",
    packSize: 120,
    form: "tablet",
  },
  {
    key: "loratadine",
    genericName: "Loratadine",
    strength: "10 mg",
    nadacSearch: "loratadine 10",
    packSize: 30,
    form: "tablet",
  },
  {
    key: "cetirizine",
    genericName: "Cetirizine HCl",
    strength: "10 mg",
    nadacSearch: "cetirizine 10",
    packSize: 45,
    form: "tablet",
  },
  {
    key: "diphenhydramine",
    genericName: "Diphenhydramine",
    strength: "25 mg",
    nadacSearch: "diphenhydramine 25",
    packSize: 100,
    form: "capsule",
  },
  {
    key: "omeprazole",
    genericName: "Omeprazole",
    strength: "20 mg",
    nadacSearch: "omeprazole",
    packSize: 42,
    form: "capsule",
  },
  {
    key: "famotidine",
    genericName: "Famotidine",
    strength: "20 mg",
    nadacSearch: "famotidine 20",
    packSize: 50,
    form: "tablet",
  },
  {
    key: "loperamide",
    genericName: "Loperamide",
    strength: "2 mg",
    nadacSearch: "loperamide 2",
    packSize: 48,
    form: "capsule",
  },
  {
    key: "simethicone",
    genericName: "Simethicone",
    strength: "125 mg",
    nadacSearch: "simethicone 125",
    packSize: 72,
    form: "tablet",
  },
  {
    key: "guaifenesin",
    genericName: "Guaifenesin",
    strength: "400 mg",
    nadacSearch: "guaifenesin 400",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "dextromethorphan",
    genericName: "Dextromethorphan",
    strength: "15 mg",
    nadacSearch: "dextromethorphan 15",
    packSize: 40,
    form: "tablet",
  },
  {
    key: "fexofenadine",
    genericName: "Fexofenadine HCl",
    strength: "180 mg",
    nadacSearch: "fexofenadine 180",
    packSize: 45,
    form: "tablet",
  },
  {
    key: "bismuth",
    genericName: "Bismuth Subsalicylate",
    strength: "262 mg",
    nadacSearch: "bismuth subsalicylate 262",
    packSize: 48,
    form: "tablet",
  },
  {
    key: "docusate",
    genericName: "Docusate Sodium",
    strength: "100 mg",
    nadacSearch: "docusate sodium 100",
    packSize: 100,
    form: "capsule",
  },
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
// Based on published OTC generic margin research (2.5x–3.2x is typical).
export const STORE_MULTIPLIERS: Record<string, number> = {
  Walmart: 2.5,
  CVS: 3.0,
  Amazon: 2.7,
  Walgreens: 3.2,
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
