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

export async function lookupFDA(
  query: string,
): Promise<{ product: MedProduct; raw: any } | null> {
  const q = encodeURIComponent(query.trim());
  const urls = [
    `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${q}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${q}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=openfda.substance_name:${q}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=${q}&limit=1`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results?.length > 0) {
        const r = data.results[0];
        const ingredients = parseIngredients(r);
        if (ingredients.length === 0) continue;
        const brandName =
          r.openfda?.brand_name?.[0] ||
          r.brand_name?.[0] ||
          r.openfda?.generic_name?.[0] ||
          query;
        const manufacturer =
          r.openfda?.manufacturer_name?.[0] || r.manufacturer_name?.[0] || "";
        const form = (r.dosage_form?.[0] || "").toLowerCase();
        const servingSizeRaw = (
          r.dosage_and_administration?.[0] || ""
        ).toLowerCase();
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
          product: {
            brandName,
            manufacturer,
            form,
            ingredients,
            servingSizeAlert,
            isBTC,
            genericKey,
          },
          raw: r,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function lookupDSLD(query: string): Promise<MedProduct | null> {
  try {
    const q = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://api.ods.od.nih.gov/dsld/v9/browse-products?name=${q}&limit=1`,
    );
    const data = await res.json();
    if (!data.data?.length) return null;
    const product = data.data[0];
    const detailRes = await fetch(
      `https://api.ods.od.nih.gov/dsld/v9/product/${product.id}/label-info`,
    );
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
  } catch {
    return null;
  }
}

export async function lookupByUPC(upc: string): Promise<MedProduct | null> {
  const fdaUrls = [
    `https://api.fda.gov/drug/label.json?search=openfda.upc:${upc}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:${upc}&limit=1`,
  ];
  for (const url of fdaUrls) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results?.length > 0) {
        const r = await lookupFDA(upc);
        return r?.product || null;
      }
    } catch {
      continue;
    }
  }
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${upc}.json`,
    );
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const name = data.product.product_name || data.product.generic_name || "";
      if (name) {
        const fdaResult = await lookupFDA(name);
        if (fdaResult) return fdaResult.product;
        return await lookupDSLD(name);
      }
    }
  } catch {}
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`,
    );
    const data = await res.json();
    if (data.items?.length > 0) {
      const name = data.items[0].title || "";
      if (name) {
        const fdaResult = await lookupFDA(name);
        if (fdaResult) return fdaResult.product;
        return await lookupDSLD(name);
      }
    }
  } catch {}
  return null;
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

export async function lookupProduct(query: string): Promise<{
  product: MedProduct;
  raw: any;
  source: "drug" | "supplement";
} | null> {
  const q = query.trim();
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
