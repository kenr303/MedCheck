import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import {
  loadLastProduct,
  loadRecentSearches,
  saveLastProduct,
  saveRecentSearches,
} from "../../store/cache";
import { lookupSupplement } from "../../store/supplementData";
import { COLOR, FONT, RADIUS, SPACE } from "../../store/theme";
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

async function lookupFDA(
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

async function lookupDSLD(query: string): Promise<MedProduct | null> {
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

async function lookupByUPC(upc: string): Promise<MedProduct | null> {
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

function looksLikeSupplement(query: string): boolean {
  const q = query.toLowerCase();
  return SUPPLEMENT_KEYWORDS.some((k) => q.includes(k));
}

export default function LookupScreen() {
  const router = useRouter();
  const {
    setCurrentProduct,
    setRawFDAResult,
    setCompareA,
    compareA,
    compareB,
    setCompareB,
    recentSearches,
    addRecentSearch,
  } = useMedStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<MedProduct | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [source, setSource] = useState<"drug" | "supplement" | null>(null);
  const [offlineBanner, setOfflineBanner] = useState(false);

  useEffect(() => {
    // Load cached recent searches and last product on first open
    loadRecentSearches().then((searches) => {
      searches.forEach((s) => addRecentSearch(s));
    });
  }, []);

  const finishLookup = async (
    p: MedProduct | null,
    src: "drug" | "supplement",
    raw: any = null,
  ) => {
    if (!p) {
      // Try loading from cache before showing error
      const cached = await loadLastProduct();
      if (cached?.product) {
        setProduct(cached.product);
        setSource("drug");
        setCurrentProduct(cached.product);
        setRawFDAResult(cached.raw);
        setOfflineBanner(true);
        setLoading(false);
        return;
      }
      Alert.alert(
        "Not found",
        "Try the generic name.\n\nDrug examples:\n• Tylenol → acetaminophen\n• Advil → ibuprofen\n• Claritin → loratadine\n\nSupplement examples:\n• vitamin c\n• calcium\n• fish oil\n• melatonin",
      );
      setLoading(false);
      return;
    }
    setOfflineBanner(false);
    setProduct(p);
    setSource(src);
    setCurrentProduct(p);
    setRawFDAResult(raw);
    addRecentSearch(p.brandName);
    saveLastProduct(p, raw);
    saveRecentSearches([p.brandName, ...recentSearches].slice(0, 8));
    setLoading(false);
  };

  const searchProduct = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setProduct(null);
    setSource(null);
    const q = query.trim();
    if (looksLikeSupplement(q)) {
      const local = lookupSupplement(q);
      if (local) {
        finishLookup(local, "supplement", null);
        return;
      }
      const dsld = await lookupDSLD(q);
      if (dsld) {
        finishLookup(dsld, "supplement", null);
        return;
      }
      const fdaResult = await lookupFDA(q);
      finishLookup(fdaResult?.product || null, "drug", fdaResult?.raw || null);
    } else {
      const fdaResult = await lookupFDA(q);
      if (fdaResult) {
        finishLookup(fdaResult.product, "drug", fdaResult.raw);
        return;
      }
      const local = lookupSupplement(q);
      if (local) {
        finishLookup(local, "supplement", null);
        return;
      }
      const dsld = await lookupDSLD(q);
      finishLookup(dsld, "supplement", null);
    }
  };

  const handleScanned = async (upc: string) => {
    setScannerOpen(false);
    setLoading(true);
    setProduct(null);
    setQuery(upc);
    const result = await lookupByUPC(upc);
    finishLookup(result, "drug", null);
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
    <ScrollView style={S.container} keyboardShouldPersistTaps="handled">
      <View style={S.inner}>
        <TouchableOpacity
          style={S.scanBtn}
          onPress={() => setScannerOpen(true)}
        >
          <Text style={S.scanIcon}>▦</Text>
          <Text style={S.scanBtnText}>Scan barcode</Text>
        </TouchableOpacity>

        <Text style={S.divider}>— or search by name —</Text>

        <View style={S.searchRow}>
          <TextInput
            style={S.input}
            placeholder="Drug or supplement name..."
            placeholderTextColor={COLOR.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchProduct}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity style={S.searchBtn} onPress={searchProduct}>
            <Text style={S.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.hint}>
          Drugs: acetaminophen, ibuprofen, loratadine{"\n"}
          Supplements: vitamin c, calcium, fish oil, melatonin
        </Text>

        {recentSearches.length > 0 && !product && !loading && (
          <View style={S.recentWrap}>
            <Text style={S.recentTitle}>Recent searches</Text>
            <View style={S.recentList}>
              {recentSearches.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={S.recentChip}
                  onPress={() => {
                    setQuery(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={S.recentChipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {offlineBanner && (
          <View style={S.offlineBanner}>
            <Text style={S.offlineBannerText}>
              ⚠ No internet connection — showing last saved result.
            </Text>
          </View>
        )}

        {loading && (
          <View style={S.loadingWrap}>
            <ActivityIndicator size="large" color={COLOR.primaryMid} />
            <Text style={S.loadingText}>Searching databases...</Text>
          </View>
        )}

        {product && (
          <View style={S.resultWrap}>
            <View style={S.productHeader}>
              <View style={S.productHeaderLeft}>
                <Text style={S.productName}>{product.brandName}</Text>
                {product.form ? (
                  <Text style={S.productForm}>{product.form}</Text>
                ) : null}
                {product.manufacturer ? (
                  <Text style={S.manufacturer}>{product.manufacturer}</Text>
                ) : null}
              </View>
              {source && (
                <View
                  style={[
                    S.sourceBadge,
                    source === "supplement"
                      ? S.sourceBadgeSupp
                      : S.sourceBadgeDrug,
                  ]}
                >
                  <Text
                    style={[
                      S.sourceBadgeText,
                      source === "supplement"
                        ? S.sourceBadgeSuppText
                        : S.sourceBadgeDrugText,
                    ]}
                  >
                    {source === "supplement" ? "Supplement" : "OTC Drug"}
                  </Text>
                </View>
              )}
            </View>

            {product.isBTC && (
              <View style={S.alertBTC}>
                <Text style={S.alertBTCTitle}>Behind-the-counter product</Text>
                <Text style={S.alertBTCText}>
                  Valid photo ID required. Federal purchase limit applies.
                </Text>
              </View>
            )}

            {product.servingSizeAlert && (
              <View style={S.alertWarn}>
                <Text style={S.alertWarnText}>
                  ⚠ {product.servingSizeAlert}
                </Text>
              </View>
            )}

            {product.ingredients.length > 0 ? (
              <View style={S.card}>
                <View style={S.cardHeader}>
                  <Text style={S.cardHeaderLeft}>
                    {source === "supplement"
                      ? "Supplement facts"
                      : "Active ingredients"}
                  </Text>
                  <Text style={S.cardHeaderRight}>Purpose</Text>
                </View>
                {product.ingredients.map((ing, i) => (
                  <View
                    key={i}
                    style={[
                      S.ingrRow,
                      i === product.ingredients.length - 1 && S.ingrRowLast,
                    ]}
                  >
                    <View style={S.ingrLeft}>
                      <Text style={S.ingrNum}>{i + 1}.</Text>
                      <View style={S.ingrNameWrap}>
                        <Text style={S.ingrName}>{ing.name}</Text>
                        {ing.concentration ? (
                          <Text style={S.ingrConc}>{ing.concentration}</Text>
                        ) : null}
                      </View>
                    </View>
                    {ing.purpose ? (
                      <Text style={S.ingrPurpose}>{ing.purpose}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={S.alertWarn}>
                <Text style={S.alertWarnText}>
                  Ingredient details not available for this product.
                </Text>
              </View>
            )}

            <View style={S.actionRow}>
              <TouchableOpacity style={S.actionBtn} onPress={handleSeePrices}>
                <Text style={S.actionBtnText}>See prices</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={S.actionBtn}
                onPress={handleAddToCompare}
              >
                <Text style={S.actionBtnText}>Add to compare</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.actionBtn, S.actionBtnGray]}
                onPress={() => router.push("/product-detail")}
              >
                <Text style={[S.actionBtnText, S.actionBtnGrayText]}>
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

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.bg },
  inner: { padding: SPACE.md },

  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderStyle: "dashed",
    paddingVertical: 18,
    marginBottom: 14,
  },
  scanIcon: { fontSize: 24, color: COLOR.primaryMid },
  scanBtnText: {
    fontSize: FONT.md,
    color: COLOR.primaryMid,
    fontWeight: "500",
  },

  divider: {
    textAlign: "center",
    fontSize: FONT.sm,
    color: COLOR.textMuted,
    marginBottom: 14,
  },

  searchRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.sm },
  input: {
    flex: 1,
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FONT.md,
    color: COLOR.text,
  },
  searchBtn: {
    backgroundColor: COLOR.primaryMid,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  searchBtnText: { color: COLOR.white, fontSize: FONT.md, fontWeight: "500" },

  hint: {
    fontSize: FONT.xs,
    color: COLOR.textMuted,
    marginBottom: SPACE.md,
    lineHeight: 20,
  },
  recentWrap: { marginBottom: SPACE.md },
  recentTitle: {
    fontSize: FONT.xs,
    fontWeight: "600",
    color: COLOR.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  recentList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recentChip: {
    backgroundColor: COLOR.white,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recentChipText: {
    fontSize: FONT.sm,
    color: COLOR.primaryMid,
    fontWeight: "500",
  },
  offlineBanner: {
    backgroundColor: "#FFF3CD",
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  offlineBannerText: { fontSize: FONT.sm, color: "#92400E", lineHeight: 20 },

  loadingWrap: { alignItems: "center", marginTop: 48, gap: 14 },
  loadingText: { fontSize: FONT.md, color: COLOR.textSub },

  resultWrap: { marginTop: SPACE.sm },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACE.sm,
  },
  productHeaderLeft: { flex: 1, marginRight: SPACE.sm },
  productName: {
    fontSize: FONT.xl,
    fontWeight: "600",
    color: COLOR.text,
    lineHeight: 30,
    textTransform: "capitalize",
  },
  productForm: {
    fontSize: FONT.sm,
    color: COLOR.textSub,
    marginTop: 3,
    textTransform: "capitalize",
  },
  manufacturer: {
    fontSize: FONT.sm,
    color: COLOR.textMuted,
    marginTop: 2,
    marginBottom: SPACE.md,
  },

  sourceBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  sourceBadgeDrug: { backgroundColor: COLOR.primaryLight },
  sourceBadgeSupp: { backgroundColor: COLOR.successLight },
  sourceBadgeText: { fontSize: FONT.xs, fontWeight: "600" },
  sourceBadgeDrugText: { color: COLOR.primary },
  sourceBadgeSuppText: { color: COLOR.success },

  alertBTC: {
    backgroundColor: COLOR.dangerLight,
    borderLeftWidth: 3,
    borderLeftColor: "#E24B4A",
    borderRadius: RADIUS.sm,
    padding: 14,
    marginBottom: 14,
  },
  alertBTCTitle: {
    fontSize: FONT.md,
    fontWeight: "600",
    color: COLOR.danger,
    marginBottom: 5,
  },
  alertBTCText: { fontSize: FONT.sm, color: COLOR.danger, lineHeight: 22 },

  alertWarn: {
    backgroundColor: COLOR.warningLight,
    borderLeftWidth: 3,
    borderLeftColor: "#EF9F27",
    borderRadius: RADIUS.sm,
    padding: 14,
    marginBottom: 14,
  },
  alertWarnText: { fontSize: FONT.md, color: COLOR.warning, lineHeight: 24 },

  card: {
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
  },
  cardHeaderLeft: {
    fontSize: FONT.xs,
    fontWeight: "600",
    color: COLOR.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardHeaderRight: {
    fontSize: FONT.xs,
    fontWeight: "600",
    color: COLOR.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  ingrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  ingrRowLast: { borderBottomWidth: 0 },
  ingrLeft: { flexDirection: "row", gap: 10, flex: 1, marginRight: 10 },
  ingrNameWrap: { flex: 1 },
  ingrNum: {
    fontSize: FONT.sm,
    color: COLOR.textMuted,
    minWidth: 22,
    marginTop: 2,
  },
  ingrName: {
    fontSize: FONT.lg,
    fontWeight: "600",
    color: COLOR.text,
    textTransform: "capitalize",
  },
  ingrConc: { fontSize: FONT.sm, color: COLOR.textSub, marginTop: 3 },
  ingrPurpose: {
    fontSize: FONT.sm,
    color: COLOR.textSub,
    textAlign: "right",
    maxWidth: 130,
  },

  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: SPACE.sm,
  },
  actionBtn: {
    borderWidth: 1.5,
    borderColor: COLOR.primaryMid,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionBtnText: {
    fontSize: FONT.md,
    fontWeight: "500",
    color: COLOR.primaryMid,
  },
  actionBtnGray: { borderColor: "#ccc" },
  actionBtnGrayText: { color: COLOR.textSub },
});
