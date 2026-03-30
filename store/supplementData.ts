import { MedProduct } from "./useMedStore";

// Hardcoded common supplements so they always work
// even if NIH DSLD API is unavailable
export const SUPPLEMENT_DB: Record<string, MedProduct> = {
  "vitamin c": {
    brandName: "Vitamin C",
    manufacturer: "Various manufacturers",
    form: "tablet / capsule",
    ingredients: [
      {
        name: "Ascorbic Acid (Vitamin C)",
        concentration: "500 mg",
        purpose: "Antioxidant · Immune support",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "vitamin-c",
  },
  "vitamin d": {
    brandName: "Vitamin D3",
    manufacturer: "Various manufacturers",
    form: "softgel",
    ingredients: [
      {
        name: "Cholecalciferol (Vitamin D3)",
        concentration: "1000 IU",
        purpose: "Bone health · Immune support",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "vitamin-d",
  },
  "vitamin d3": {
    brandName: "Vitamin D3",
    manufacturer: "Various manufacturers",
    form: "softgel",
    ingredients: [
      {
        name: "Cholecalciferol (Vitamin D3)",
        concentration: "1000 IU",
        purpose: "Bone health · Immune support",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "vitamin-d",
  },
  calcium: {
    brandName: "Calcium",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Calcium Carbonate",
        concentration: "600 mg",
        purpose: "Bone health · Muscle function",
      },
      {
        name: "Vitamin D3",
        concentration: "400 IU",
        purpose: "Calcium absorption",
      },
    ],
    servingSizeAlert:
      "Take with food — calcium carbonate requires stomach acid for absorption.",
    isBTC: false,
    genericKey: "calcium",
  },
  "calcium citrate": {
    brandName: "Calcium Citrate",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Calcium Citrate",
        concentration: "630 mg",
        purpose: "Bone health · Muscle function",
      },
      {
        name: "Vitamin D3",
        concentration: "500 IU",
        purpose: "Calcium absorption",
      },
    ],
    servingSizeAlert:
      "Can be taken without food — calcium citrate does not require stomach acid.",
    isBTC: false,
    genericKey: "calcium-citrate",
  },
  "fish oil": {
    brandName: "Fish Oil (Omega-3)",
    manufacturer: "Various manufacturers",
    form: "softgel",
    ingredients: [
      {
        name: "EPA (Eicosapentaenoic Acid)",
        concentration: "360 mg",
        purpose: "Heart health · Anti-inflammatory",
      },
      {
        name: "DHA (Docosahexaenoic Acid)",
        concentration: "240 mg",
        purpose: "Brain health · Eye health",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "fish-oil",
  },
  "omega 3": {
    brandName: "Omega-3 Fish Oil",
    manufacturer: "Various manufacturers",
    form: "softgel",
    ingredients: [
      {
        name: "EPA (Eicosapentaenoic Acid)",
        concentration: "360 mg",
        purpose: "Heart health · Anti-inflammatory",
      },
      {
        name: "DHA (Docosahexaenoic Acid)",
        concentration: "240 mg",
        purpose: "Brain health · Eye health",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "omega-3",
  },
  melatonin: {
    brandName: "Melatonin",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Melatonin",
        concentration: "5 mg",
        purpose: "Sleep support · Circadian rhythm",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "melatonin",
  },
  magnesium: {
    brandName: "Magnesium",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Magnesium Oxide",
        concentration: "250 mg",
        purpose: "Muscle function · Nerve function · Sleep",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "magnesium",
  },
  zinc: {
    brandName: "Zinc",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Zinc Gluconate",
        concentration: "50 mg",
        purpose: "Immune support · Wound healing",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "zinc",
  },
  iron: {
    brandName: "Iron (Ferrous Sulfate)",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Ferrous Sulfate",
        concentration: "325 mg",
        purpose: "Iron deficiency · Red blood cell production",
      },
    ],
    servingSizeAlert:
      "Best absorbed on empty stomach. May cause stomach upset — take with food if needed.",
    isBTC: false,
    genericKey: "iron",
  },
  biotin: {
    brandName: "Biotin (Vitamin B7)",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Biotin (Vitamin B7)",
        concentration: "5000 mcg",
        purpose: "Hair health · Nail strength · Energy metabolism",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "biotin",
  },
  b12: {
    brandName: "Vitamin B12",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Cyanocobalamin (Vitamin B12)",
        concentration: "1000 mcg",
        purpose: "Energy · Nerve function · Red blood cells",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "b12",
  },
  "vitamin b12": {
    brandName: "Vitamin B12",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Cyanocobalamin (Vitamin B12)",
        concentration: "1000 mcg",
        purpose: "Energy · Nerve function · Red blood cells",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "b12",
  },
  "folic acid": {
    brandName: "Folic Acid (Vitamin B9)",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Folic Acid",
        concentration: "400 mcg",
        purpose: "Cell growth · Pregnancy support · Heart health",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "folic-acid",
  },
  probiotics: {
    brandName: "Probiotic",
    manufacturer: "Various manufacturers",
    form: "capsule",
    ingredients: [
      {
        name: "Lactobacillus acidophilus",
        concentration: "1 billion CFU",
        purpose: "Digestive health · Gut flora",
      },
      {
        name: "Bifidobacterium lactis",
        concentration: "1 billion CFU",
        purpose: "Immune support · Digestion",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "probiotic",
  },
  probiotic: {
    brandName: "Probiotic",
    manufacturer: "Various manufacturers",
    form: "capsule",
    ingredients: [
      {
        name: "Lactobacillus acidophilus",
        concentration: "1 billion CFU",
        purpose: "Digestive health · Gut flora",
      },
      {
        name: "Bifidobacterium lactis",
        concentration: "1 billion CFU",
        purpose: "Immune support · Digestion",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "probiotic",
  },
  turmeric: {
    brandName: "Turmeric (Curcumin)",
    manufacturer: "Various manufacturers",
    form: "capsule",
    ingredients: [
      {
        name: "Turmeric Root Extract (Curcumin)",
        concentration: "500 mg",
        purpose: "Anti-inflammatory · Antioxidant · Joint support",
      },
      {
        name: "Black Pepper Extract (BioPerine)",
        concentration: "5 mg",
        purpose: "Enhanced absorption",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "turmeric",
  },
  glucosamine: {
    brandName: "Glucosamine",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Glucosamine Sulfate",
        concentration: "1500 mg",
        purpose: "Joint health · Cartilage support",
      },
      {
        name: "Chondroitin Sulfate",
        concentration: "1200 mg",
        purpose: "Joint cushioning",
      },
    ],
    servingSizeAlert:
      "Full daily dose may be split — take 500 mg three times daily with meals.",
    isBTC: false,
    genericKey: "glucosamine",
  },
  coq10: {
    brandName: "CoQ10 (Coenzyme Q10)",
    manufacturer: "Various manufacturers",
    form: "softgel",
    ingredients: [
      {
        name: "Coenzyme Q10 (Ubiquinone)",
        concentration: "200 mg",
        purpose: "Heart health · Energy production · Antioxidant",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "coq10",
  },
  elderberry: {
    brandName: "Elderberry",
    manufacturer: "Various manufacturers",
    form: "gummy / capsule",
    ingredients: [
      {
        name: "Black Elderberry Extract",
        concentration: "200 mg",
        purpose: "Immune support · Antioxidant",
      },
      { name: "Vitamin C", concentration: "45 mg", purpose: "Immune support" },
      { name: "Zinc", concentration: "3.75 mg", purpose: "Immune support" },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "elderberry",
  },
  multivitamin: {
    brandName: "Multivitamin",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Vitamin A",
        concentration: "900 mcg",
        purpose: "Vision · Immune system",
      },
      {
        name: "Vitamin C",
        concentration: "90 mg",
        purpose: "Antioxidant · Immune support",
      },
      { name: "Vitamin D3", concentration: "1000 IU", purpose: "Bone health" },
      { name: "Vitamin E", concentration: "15 mg", purpose: "Antioxidant" },
      {
        name: "B-Complex",
        concentration: "Various",
        purpose: "Energy metabolism",
      },
      { name: "Calcium", concentration: "200 mg", purpose: "Bone health" },
      { name: "Zinc", concentration: "11 mg", purpose: "Immune support" },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "multivitamin",
  },
  selenium: {
    brandName: "Selenium",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Selenium (as Selenomethionine)",
        concentration: "200 mcg",
        purpose: "Antioxidant · Thyroid health",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "selenium",
  },
  potassium: {
    brandName: "Potassium",
    manufacturer: "Various manufacturers",
    form: "tablet",
    ingredients: [
      {
        name: "Potassium Gluconate",
        concentration: "550 mg",
        purpose: "Heart function · Muscle contraction · Blood pressure",
      },
    ],
    servingSizeAlert: null,
    isBTC: false,
    genericKey: "potassium",
  },
};

export function lookupSupplement(query: string): MedProduct | null {
  const key = query.trim().toLowerCase();
  // Exact match first
  if (SUPPLEMENT_DB[key]) return SUPPLEMENT_DB[key];
  // Partial match
  const match = Object.keys(SUPPLEMENT_DB).find(
    (k) => key.includes(k) || k.includes(key),
  );
  return match ? SUPPLEMENT_DB[match] : null;
}
