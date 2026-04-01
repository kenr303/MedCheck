import { findOTCFamily } from "./otcDatabase";
import { lookupSupplement } from "./supplementData";
import { Ingredient, MedProduct } from "./useMedStore";

export function cleanIngredientName(raw: string): {
  name: string;
  concentration: string;
} {
  let s = raw
    .replace(/active\s+ingredient[s]?\s*(\(in\s+each\s+[\w\s]+\))?\s*/gi, "")
    .replace(/each\s+[\w\s]+\s+contains\s*/gi, "")
    .replace(/^\s*[:;-]\s*/g, "")
    .trim();
  const concMatch = s.match(
    /([\d.]+\s*(?:mg|mcg|mL|g|%|IU|units?)(?:\s*\/\s*[\w.]+)?)\s*$/i,
  );
  const concentration = concMatch ? concMatch[1].trim() : "";
  const name = concMatch ? s.slice(0, concMatch.index).trim() : s;
  return { name: name || s, concentration };
}

export function parseIngredients(r: any): Ingredient[] {
  const purposeList: string[] = (r.purpose || []).map((p: string) =>
    p.replace(/^purpose\s*/i, "").trim(),
  );
  const raw: string[] = r.active_ingredient || r.active_ingredients || [];
  if (raw.length === 0) return [];
  return raw.map((ing: string, i: number) => {
    const { name, concentration } = cleanIngredientName(ing);
    return {
      name,
      concentration,
      purpose: purposeList[i] || purposeList[0] || "",
    };
  });
}

function scoreFDAResult(r: any, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  const brand = (r.openfda?.brand_name?.[0] || "").toLowerCase();
  const generic = (r.openfda?.generic_name?.[0] || "").toLowerCase();
  const substance = (r.openfda?.substance_name?.[0] || "").toLowerCase();
  if (brand === q || generic === q || substance === q) score += 10;
  else if (brand.startsWith(q) || generic.startsWith(q) || substance.startsWith(q)) score += 6;
  else if (brand.includes(q) || generic.includes(q) || substance.includes(q)) score += 3;
  const ingredients = parseIngredients(r);
  if (ingredients.length > 0) score += 4;
  const otcText = JSON.stringify(r.openfda || "").toLowerCase();
  if (otcText.includes("otc") || (r.product_type || "").toLowerCase().includes("otc")) score += 1;
  return score;
}

function buildProduct(r: any, query: string): MedProduct {
  const brandName =
    r.openfda?.brand_name?.[0] ||
    r.brand_name?.[0] ||
    r.openfda?.generic_name?.[0] ||
    query;
  const manufacturer =
    r.openfda?.manufacturer_name?.[0] || r.manufacturer_name?.[0] || "";
  const form = (r.dosage_form?.[0] || "").toLowerCase();
  const servingSizeRaw = (r.dosage_and_administration?.[0] || "").toLowerCase();
  const servingSizeAlert =
    servingSizeRaw.includes("2 tablet") ||
    servingSizeRaw.includes("2 capsule") ||
    servingSizeRaw.includes("two tablet") ||
    servingSizeRaw.includes("two capsule")
      ? "Dose requires 2 units — not 1. Check the label carefully."
      : null;
  const allText = JSON.stringify(r).toLowerCase();
  const isBTC =
    allText.includes("pseudoephedrine") || allText.includes("ephedrine");
  const genericKey = (r.openfda?.generic_name?.[0] || "")
    .toLowerCase()
    .split(" ")[0];
  return {
    brandName,
    manufacturer,
    form,
    ingredients: parseIngredients(r),
    servingSizeAlert,
    isBTC,
    genericKey,
  };
}

export async function lookupFDA(
  query: string,
): Promise<{ product: MedProduct; raw: any } | null> {
  const q = encodeURIComponent(query.trim());
  const urls = [
    `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${q}&limit=5`,
    `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${q}&limit=5`,
    `https://api.fda.gov/drug/label.json?search=openfda.substance_name:${q}&limit=5`,
    `https://api.fda.gov/drug/label.json?search=${q}&limit=5`,
  ];
  const candidates: Array<{ r: any; score: number }> = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.results?.length) continue;
      for (const r of data.results) {
        if (parseIngredients(r).length === 0) continue;
        candidates.push({ r, score: scoreFDAResult(r, query.trim()) });
      }
    } catch (e) {
      console.error("[lookupFDA] fetch error:", e);
      continue;
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0].r;
  return { product: buildProduct(best, query.trim()), raw: best };
}

// Build a deduplication key from a raw FDA result so we don't show duplicate
// entries that differ only by manufacturer or lot number.
function buildDedupeKey(r: any): string {
  const ingredients = parseIngredients(r);
  const names = ingredients
    .map((i) => i.name.toLowerCase().replace(/\s+/g, ""))
    .sort()
    .join("+");
  const strengths = ingredients
    .map((i) => i.concentration.toLowerCase().replace(/\s+/g, ""))
    .sort()
    .join("+");
  const form = (r.dosage_form?.[0] || "").toLowerCase().split(" ")[0];
  return `${names}_${strengths}_${form}`;
}

// Fetch multiple distinct FDA results for a query (parallel requests, deduped).
export async function searchFDAMultiple(
  query: string,
): Promise<Array<{ product: MedProduct; raw: any }>> {
  const q = encodeURIComponent(query.trim());
  const urls = [
    `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${q}"&limit=10`,
    `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${q}"&limit=10`,
    `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${q}"&limit=10`,
  ];

  const responses = await Promise.allSettled(
    urls.map((url) =>
      fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
    ),
  );

  const seen = new Set<string>();
  const candidates: Array<{ product: MedProduct; raw: any; score: number }> =
    [];

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    const data = result.value;
    if (!data.results?.length) continue;
    for (const r of data.results) {
      if (parseIngredients(r).length === 0) continue;
      const key = buildDedupeKey(r);
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        product: buildProduct(r, query.trim()),
        raw: r,
        score: scoreFDAResult(r, query.trim()),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 8).map(({ product, raw }) => ({ product, raw }));
}

export interface MultiSearchResult {
  product: MedProduct;
  raw: any;
  source: "drug" | "supplement";
}

// Main multi-result lookup. Returns an array:
//   length 0  → not found
//   length 1  → auto-select (exact/curated match)
//   length >1 → show picker list to user
export async function lookupProductsMulti(
  query: string,
): Promise<MultiSearchResult[]> {
  const q = query.trim();

  // 1. Curated OTC database — authoritative single match with variant picker
  const otcProduct = lookupOTC(q);
  if (otcProduct) {
    return [{ product: otcProduct, raw: null, source: "drug" }];
  }

  // 2. Local supplement database — authoritative single match
  if (looksLikeSupplement(q)) {
    const local = lookupSupplement(q);
    if (local) return [{ product: local, raw: null, source: "supplement" }];
  }

  // 3. FDA multi-search — returns multiple distinct products
  const fdaResults = await searchFDAMultiple(q);
  if (fdaResults.length > 0) {
    return fdaResults.map((r) => ({
      product: r.product,
      raw: r.raw,
      source: "drug" as const,
    }));
  }

  // 4. DSLD supplement fallback
  if (looksLikeSupplement(q)) {
    const dsld = await lookupDSLD(q);
    if (dsld) return [{ product: dsld, raw: null, source: "supplement" }];
  }

  // 5. Broad DSLD attempt for anything not found above
  const dsld = await lookupDSLD(q);
  if (dsld) return [{ product: dsld, raw: null, source: "supplement" }];

  return [];
}

export async function lookupDSLD(query: string): Promise<MedProduct | null> {
  try {
    const q = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://api.ods.od.nih.gov/dsld/v9/browse-products?name=${q}&limit=1`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.length) return null;
    const product = data.data[0];
    const detailRes = await fetch(
      `https://api.ods.od.nih.gov/dsld/v9/product/${product.id}/label-info`,
    );
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();
    const ingredients: Ingredient[] = (detail.servingIngredients || [])
      .map((ing: any) => ({
        name: ing.ingredientName || ing.name || "",
        concentration: ing.quantity
          ? `${ing.quantity} ${ing.unit || ""}`.trim()
          : "",
        purpose: ing.role || "",
      }))
      .filter((i: Ingredient) => i.name);
    const servingSizeQty = detail.servingSize?.quantity || "";
    const servingSizeUnit = detail.servingSize?.unit || "";
    const servingSizeAlert =
      (parseInt(servingSizeQty) > 1 &&
        servingSizeUnit.toLowerCase().includes("tablet")) ||
      (parseInt(servingSizeQty) > 1 &&
        servingSizeUnit.toLowerCase().includes("capsule"))
        ? `Serving size is ${servingSizeQty} ${servingSizeUnit} — not 1.`
        : null;
    return {
      brandName: product.brandName || product.name || query,
      manufacturer: product.manufacturer || "",
      form: servingSizeUnit || "supplement",
      ingredients,
      servingSizeAlert,
      isBTC: false,
      genericKey: "",
    };
  } catch (e) {
    console.error("[lookupDSLD] error:", e);
    return null;
  }
}

export async function lookupByUPC(upc: string): Promise<MedProduct | null> {
  // Helper: given a product title from a UPC database, try OTC → FDA → DSLD
  async function resolveByName(name: string): Promise<MedProduct | null> {
    const otc = lookupOTC(name);
    if (otc) return otc;
    const keyword = extractDrugKeyword(name);
    if (keyword !== name) {
      const otcKw = lookupOTC(keyword);
      if (otcKw) return otcKw;
    }
    const fdaResult = await lookupFDA(name);
    if (fdaResult) return fdaResult.product;
    if (keyword !== name) {
      const fdaKw = await lookupFDA(keyword);
      if (fdaKw) return fdaKw.product;
    }
    return await lookupDSLD(name);
  }

  // 1. FDA by UPC / NDC
  const fdaUrls = [
    `https://api.fda.gov/drug/label.json?search=openfda.upc:${upc}&limit=5`,
    `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:${upc}&limit=5`,
  ];
  for (const url of fdaUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.results?.length > 0) {
        const r = data.results[0];
        const genericName = r.openfda?.generic_name?.[0] || "";
        if (genericName) {
          const otc = lookupOTC(genericName);
          if (otc) return otc;
        }
        return buildProduct(r, genericName || upc);
      }
    } catch (e) {
      console.error("[lookupByUPC] FDA fetch error:", e);
      continue;
    }
  }

  // 2. Open Food Facts
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${upc}.json`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const name = data.product.product_name || data.product.generic_name || "";
      if (name) {
        const result = await resolveByName(name);
        if (result) return result;
      }
    }
  } catch (e) {
    console.error("[lookupByUPC] Open Food Facts error:", e);
  }

  // 3. UPCItemDB
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.items?.length > 0) {
      const title = data.items[0].title || "";
      if (title) {
        const result = await resolveByName(title);
        if (result) return result;
      }
    }
  } catch (e) {
    console.error("[lookupByUPC] UPCItemDB error:", e);
  }

  return null;
}

// Extract the most likely drug name keyword from a product title.
// e.g. "Equate Extra Strength Acetaminophen 500mg Tablets 100ct" → "Acetaminophen"
function extractDrugKeyword(title: string): string {
  const SKIP = new Set([
    "extra", "strength", "regular", "maximum", "original", "formula",
    "tablets", "tablet", "capsules", "capsule", "caplets", "caplet",
    "softgels", "softgel", "gummies", "gummy", "liquid", "gel", "cream",
    "count", "ct", "mg", "mcg", "pack", "value", "size", "plus", "and",
    "with", "for", "the", "of", "non", "drowsy", "coated", "enteric",
    "equate", "cvs", "walgreens", "walmart", "amazon", "basic", "care",
    "brand", "generic", "health", "store",
  ]);
  const words = title.split(/[\s,/]+/);
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (clean.length >= 4 && !SKIP.has(clean) && !/^\d+$/.test(clean)) {
      return clean;
    }
  }
  return title;
}

const SUPPLEMENT_KEYWORDS = [
  "vitamin",
  "calcium",
  "magnesium",
  "zinc",
  "iron",
  "omega",
  "fish oil",
  "probiotic",
  "melatonin",
  "biotin",
  "collagen",
  "turmeric",
  "elderberry",
  "echinacea",
  "glucosamine",
  "coq10",
  "b12",
  "folate",
  "folic",
  "selenium",
  "potassium",
  "multivitamin",
  "supplement",
  "herbal",
];

export function looksLikeSupplement(query: string): boolean {
  const q = query.toLowerCase();
  return SUPPLEMENT_KEYWORDS.some((k) => q.includes(k));
}

/**
 * Primary lookup for common OTC drugs. Uses the curated OTC family database.
 * Returns the canonical product with the full family attached for UI variant selection.
 */
export function lookupOTC(query: string): MedProduct | null {
  const match = findOTCFamily(query);
  if (!match) return null;
  const { family } = match;
  const defaultVariant = family.variants[family.defaultVariantIndex] ?? family.variants[0];
  const defaultStrength = defaultVariant.strengths[defaultVariant.defaultStrengthIndex] ?? defaultVariant.strengths[0];
  return {
    brandName: family.familyName,
    manufacturer: "",
    form: defaultVariant.form ?? "",
    ingredients: defaultStrength.ingredients,
    servingSizeAlert: null,
    isBTC: defaultVariant.isBTC ?? false,
    genericKey: match.key,
    otcFamily: family,
    priceKey: defaultStrength.priceKey || match.key,
    otcNote: defaultVariant.note,
  };
}

export async function lookupProduct(query: string): Promise<{
  product: MedProduct;
  raw: any;
  source: "drug" | "supplement";
} | null> {
  const q = query.trim();

  // 1. Check curated OTC database first — most accurate for common drugs
  const otcProduct = lookupOTC(q);
  if (otcProduct) return { product: otcProduct, raw: null, source: "drug" };

  // 2. Check local supplement database
  if (looksLikeSupplement(q)) {
    const local = lookupSupplement(q);
    if (local) return { product: local, raw: null, source: "supplement" };
    const dsld = await lookupDSLD(q);
    if (dsld) return { product: dsld, raw: null, source: "supplement" };
    const fdaResult = await lookupFDA(q);
    if (fdaResult)
      return { product: fdaResult.product, raw: fdaResult.raw, source: "drug" };
    return null;
  } else {
    const fdaResult = await lookupFDA(q);
    if (fdaResult)
      return { product: fdaResult.product, raw: fdaResult.raw, source: "drug" };
    const local = lookupSupplement(q);
    if (local) return { product: local, raw: null, source: "supplement" };
    const dsld = await lookupDSLD(q);
    if (dsld) return { product: dsld, raw: null, source: "supplement" };
    return null;
  }
}
