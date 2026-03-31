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
    nadacSearch: "ACETAMINOPHEN 500MG TAB",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "ibuprofen",
    genericName: "Ibuprofen",
    strength: "200 mg",
    nadacSearch: "IBUPROFEN 200MG TAB",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "naproxen",
    genericName: "Naproxen",
    strength: "220 mg",
    nadacSearch: "NAPROXEN SODIUM 220MG TAB",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "aspirin",
    genericName: "Aspirin",
    strength: "81 mg",
    nadacSearch: "ASPIRIN 81MG EC TAB",
    packSize: 120,
    form: "tablet",
  },
  {
    key: "loratadine",
    genericName: "Loratadine",
    strength: "10 mg",
    nadacSearch: "LORATADINE 10MG TAB",
    packSize: 30,
    form: "tablet",
  },
  {
    key: "cetirizine",
    genericName: "Cetirizine HCl",
    strength: "10 mg",
    nadacSearch: "CETIRIZINE HCL 10MG TAB",
    packSize: 45,
    form: "tablet",
  },
  {
    key: "diphenhydramine",
    genericName: "Diphenhydramine",
    strength: "25 mg",
    nadacSearch: "DIPHENHYDRAMINE HCL 25MG CAP",
    packSize: 100,
    form: "capsule",
  },
  {
    key: "omeprazole",
    genericName: "Omeprazole",
    strength: "20 mg",
    nadacSearch: "OMEPRAZOLE 20MG CAP",
    packSize: 42,
    form: "capsule",
  },
  {
    key: "famotidine",
    genericName: "Famotidine",
    strength: "20 mg",
    nadacSearch: "FAMOTIDINE 20MG TAB",
    packSize: 50,
    form: "tablet",
  },
  {
    key: "loperamide",
    genericName: "Loperamide",
    strength: "2 mg",
    nadacSearch: "LOPERAMIDE HCL 2MG CAP",
    packSize: 48,
    form: "capsule",
  },
  {
    key: "simethicone",
    genericName: "Simethicone",
    strength: "125 mg",
    nadacSearch: "SIMETHICONE 125MG TAB",
    packSize: 72,
    form: "tablet",
  },
  {
    key: "guaifenesin",
    genericName: "Guaifenesin",
    strength: "400 mg",
    nadacSearch: "GUAIFENESIN 400MG TAB",
    packSize: 100,
    form: "tablet",
  },
  {
    key: "dextromethorphan",
    genericName: "Dextromethorphan",
    strength: "15 mg",
    nadacSearch: "DEXTROMETHORPHAN HBR 15MG TAB",
    packSize: 40,
    form: "tablet",
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
