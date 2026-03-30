import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BarcodeScanner from "../../components/BarcodeScanner";
import { lookupSupplement } from "../../store/supplementData";
import { Ingredient, MedProduct, useMedStore } from "../../store/useMedStore";

function cleanIngredientName(raw: string): {
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

function parseIngredients(r: any): Ingredient[] {
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

// Search OpenFDA drug database
async function lookupFDA(query: string): Promise<MedProduct | null> {
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
          brandName,
          manufacturer,
          form,
          ingredients,
          servingSizeAlert,
          isBTC,
          genericKey,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

// Search NIH DSLD supplement database
async function lookupDSLD(query: string): Promise<MedProduct | null> {
  try {
    const q = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://api.ods.od.nih.gov/dsld/v9/browse-products?name=${q}&limit=1`,
    );
    const data = await res.json();

    if (!data.data?.length) return null;
    const product = data.data[0];

    // Get full product details including ingredients
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

    if (ingredients.length === 0) {
      // Fall back to basic ingredient list from browse result
      (product.ingredients || []).forEach((name: string) => {
        ingredients.push({ name, concentration: "", purpose: "" });
      });
    }

    const servingSizeQty = detail.servingSize?.quantity || "";
    const servingSizeUnit = detail.servingSize?.unit || "";
    const servingSizeAlert =
      (parseInt(servingSizeQty) > 1 &&
        servingSizeUnit.toLowerCase().includes("tablet")) ||
      (parseInt(servingSizeQty) > 1 &&
        servingSizeUnit.toLowerCase().includes("capsule")) ||
      (parseInt(servingSizeQty) > 1 &&
        servingSizeUnit.toLowerCase().includes("softgel"))
        ? `Serving size is ${servingSizeQty} ${servingSizeUnit} — not 1. Check label carefully.`
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

async function lookupByUPC(upc: string): Promise<MedProduct | null> {
  const fdaUrls = [
    `https://api.fda.gov/drug/label.json?search=openfda.upc:${upc}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:${upc}&limit=1`,
  ];
  for (const url of fdaUrls) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results?.length > 0) return await lookupFDA(upc);
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
        if (fdaResult) return fdaResult;
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
        if (fdaResult) return fdaResult;
        return await lookupDSLD(name);
      }
    }
  } catch {}
  return null;
}

// Keywords that suggest supplement vs drug
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

function looksLikeSupplement(query: string): boolean {
  const q = query.toLowerCase();
  return SUPPLEMENT_KEYWORDS.some((k) => q.includes(k));
}

export default function LookupScreen() {
  const router = useRouter();
  const { setCurrentProduct, setCompareA, compareA, compareB, setCompareB } =
    useMedStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<MedProduct | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [source, setSource] = useState<"drug" | "supplement" | null>(null);

  const finishLookup = (p: MedProduct | null, src: "drug" | "supplement") => {
    if (!p) {
      Alert.alert(
        "Not found",
        "Try the generic name.\n\nDrug examples:\n• Tylenol → acetaminophen\n• Advil → ibuprofen\n• Claritin → loratadine\n\nSupplement examples:\n• vitamin c\n• calcium\n• fish oil\n• melatonin",
      );
      setLoading(false);
      return;
    }
    setProduct(p);
    setSource(src);
    setCurrentProduct(p);
    setLoading(false);
  };

  const searchProduct = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setProduct(null);
    setSource(null);

    const q = query.trim();

    if (looksLikeSupplement(q)) {
      // Try local supplement DB first (always works)
      const local = lookupSupplement(q);
      if (local) {
        finishLookup(local, "supplement");
        return;
      }
      // Try NIH DSLD API
      const supp = await lookupDSLD(q);
      if (supp) {
        finishLookup(supp, "supplement");
        return;
      }
      // Fall back to FDA
      const drug = await lookupFDA(q);
      finishLookup(drug, "drug");
    } else {
      // Try FDA first
      const drug = await lookupFDA(q);
      if (drug) {
        finishLookup(drug, "drug");
        return;
      }
      // Try local supplement DB
      const local = lookupSupplement(q);
      if (local) {
        finishLookup(local, "supplement");
        return;
      }
      // Try NIH DSLD API
      const supp = await lookupDSLD(q);
      finishLookup(supp, "supplement");
    }
  };

  const handleScanned = async (upc: string) => {
    setScannerOpen(false);
    setLoading(true);
    setProduct(null);
    setQuery(upc);
    const result = await lookupByUPC(upc);
    finishLookup(result, "drug");
  };

  const handleSeePrices = () => {
    if (!product) return;
    setCurrentProduct(product);
    router.push("/(tabs)/prices");
  };

  const handleAddToCompare = () => {
    if (!product) return;
    if (!compareA) {
      setCompareA(product);
      Alert.alert(
        "Added",
        `${product.brandName} added as Product A.\n\nSearch another product and tap Add to compare for Product B.`,
      );
    } else if (!compareB) {
      setCompareB(product);
      Alert.alert(
        "Added",
        `${product.brandName} added as Product B. Go to the Compare tab.`,
      );
    } else {
      Alert.alert("Compare slots full", "Replace Product A?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace A",
          onPress: () => {
            setCompareA(product);
            Alert.alert("Done", "Product A replaced.");
          },
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerOpen(true)}
        >
          <Text style={styles.scanIcon}>▦</Text>
          <Text style={styles.scanBtnText}>Scan barcode</Text>
        </TouchableOpacity>

        <Text style={styles.divider}>— or search by name —</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Drug or supplement name..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchProduct}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={searchProduct}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Drugs: acetaminophen, ibuprofen, loratadine{"\n"}
          Supplements: vitamin c, calcium, fish oil, melatonin
        </Text>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#185FA5" />
            <Text style={styles.loadingText}>Searching databases...</Text>
          </View>
        )}

        {product && (
          <View>
            <View style={styles.productHeader}>
              <View style={styles.productHeaderLeft}>
                <Text style={styles.productName}>{product.brandName}</Text>
                {product.form ? (
                  <Text style={styles.productForm}>{product.form}</Text>
                ) : null}
                {product.manufacturer ? (
                  <Text style={styles.manufacturer}>
                    {product.manufacturer}
                  </Text>
                ) : null}
              </View>
              {source && (
                <View
                  style={[
                    styles.sourceBadge,
                    source === "supplement"
                      ? styles.sourceBadgeSupp
                      : styles.sourceBadgeDrug,
                  ]}
                >
                  <Text
                    style={[
                      styles.sourceBadgeText,
                      source === "supplement"
                        ? styles.sourceBadgeSuppText
                        : styles.sourceBadgeDrugText,
                    ]}
                  >
                    {source === "supplement" ? "Supplement" : "OTC Drug"}
                  </Text>
                </View>
              )}
            </View>

            {product.isBTC && (
              <View style={styles.alertBTC}>
                <Text style={styles.alertBTCTitle}>
                  Behind-the-counter product
                </Text>
                <Text style={styles.alertBTCText}>
                  Valid photo ID required. Federal purchase limit applies.
                </Text>
              </View>
            )}

            {product.servingSizeAlert && (
              <View style={styles.alertWarn}>
                <Text style={styles.alertWarnText}>
                  ⚠ {product.servingSizeAlert}
                </Text>
              </View>
            )}

            {product.ingredients.length > 0 ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderLeft}>
                    {source === "supplement"
                      ? "Supplement facts"
                      : "Active ingredients"}
                  </Text>
                  <Text style={styles.cardHeaderRight}>Purpose</Text>
                </View>
                {product.ingredients.map((ing, i) => (
                  <View
                    key={i}
                    style={[
                      styles.ingrRow,
                      i === product.ingredients.length - 1 &&
                        styles.ingrRowLast,
                    ]}
                  >
                    <View style={styles.ingrLeft}>
                      <Text style={styles.ingrNum}>{i + 1}.</Text>
                      <View style={styles.ingrNameWrap}>
                        <Text style={styles.ingrName}>{ing.name}</Text>
                        {ing.concentration ? (
                          <Text style={styles.ingrConc}>
                            {ing.concentration}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {ing.purpose ? (
                      <Text style={styles.ingrPurpose}>{ing.purpose}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.alertWarn}>
                <Text style={styles.alertWarnText}>
                  Ingredient details not available for this product.
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleSeePrices}
              >
                <Text style={styles.actionBtnText}>See prices</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleAddToCompare}
              >
                <Text style={styles.actionBtnText}>Add to compare</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGray]}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnGrayText]}>
                  More about this
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <BarcodeScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleScanned}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  inner: { padding: 16 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderStyle: "dashed",
    paddingVertical: 16,
    marginBottom: 12,
  },
  scanIcon: { fontSize: 22, color: "#185FA5" },
  scanBtnText: { fontSize: 16, color: "#185FA5", fontWeight: "500" },
  divider: {
    textAlign: "center",
    fontSize: 13,
    color: "#aaa",
    marginBottom: 12,
  },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: "#111",
  },
  searchBtn: {
    backgroundColor: "#185FA5",
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  hint: { fontSize: 12, color: "#999", marginBottom: 16, lineHeight: 18 },
  loadingWrap: { alignItems: "center", marginTop: 40, gap: 12 },
  loadingText: { fontSize: 15, color: "#666" },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  productHeaderLeft: { flex: 1, marginRight: 8 },
  productName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
    lineHeight: 28,
    textTransform: "capitalize",
  },
  productForm: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
    textTransform: "capitalize",
  },
  manufacturer: { fontSize: 14, color: "#888", marginTop: 2, marginBottom: 14 },
  sourceBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  sourceBadgeDrug: { backgroundColor: "#E6F1FB" },
  sourceBadgeSupp: { backgroundColor: "#EAF3DE" },
  sourceBadgeText: { fontSize: 12, fontWeight: "600" },
  sourceBadgeDrugText: { color: "#0C447C" },
  sourceBadgeSuppText: { color: "#27500A" },
  alertBTC: {
    backgroundColor: "#FCEBEB",
    borderLeftWidth: 3,
    borderLeftColor: "#E24B4A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertBTCTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#501313",
    marginBottom: 4,
  },
  alertBTCText: { fontSize: 14, color: "#501313", lineHeight: 20 },
  alertWarn: {
    backgroundColor: "#FAEEDA",
    borderLeftWidth: 3,
    borderLeftColor: "#EF9F27",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertWarnText: { fontSize: 15, color: "#633806", lineHeight: 22 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ddd",
    marginBottom: 14,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  cardHeaderLeft: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardHeaderRight: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ingrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  ingrRowLast: { borderBottomWidth: 0 },
  ingrLeft: { flexDirection: "row", gap: 8, flex: 1, marginRight: 8 },
  ingrNameWrap: { flex: 1 },
  ingrNum: { fontSize: 14, color: "#999", minWidth: 20, marginTop: 2 },
  ingrName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    textTransform: "capitalize",
  },
  ingrConc: { fontSize: 13, color: "#666", marginTop: 2 },
  ingrPurpose: {
    fontSize: 13,
    color: "#555",
    textAlign: "right",
    maxWidth: 130,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  actionBtn: {
    borderWidth: 1.5,
    borderColor: "#185FA5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtnText: { fontSize: 14, fontWeight: "500", color: "#185FA5" },
  actionBtnGray: { borderColor: "#ccc" },
  actionBtnGrayText: { color: "#666" },
});
