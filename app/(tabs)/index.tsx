import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { lookupByUPC, lookupProduct } from "../../store/lookup";
import { COLOR, FONT, RADIUS, SPACE } from "../../store/theme";
import { MedProduct, useMedStore } from "../../store/useMedStore";

// Comprehensive list for autocomplete + not-found suggestions
const KNOWN_NAMES = [
  // Generic drug names
  "acetaminophen", "ibuprofen", "naproxen", "aspirin", "loratadine",
  "cetirizine", "fexofenadine", "diphenhydramine", "omeprazole", "famotidine",
  "ranitidine", "esomeprazole", "lansoprazole", "loperamide", "simethicone",
  "guaifenesin", "dextromethorphan", "pseudoephedrine", "phenylephrine",
  "meclizine", "bismuth subsalicylate", "hydrocortisone", "miconazole",
  "clotrimazole", "terbinafine", "minoxidil", "benzoyl peroxide",
  "salicylic acid", "docusate sodium", "polyethylene glycol", "senna",
  // Brand names
  "tylenol", "advil", "motrin", "aleve", "claritin", "zyrtec", "allegra",
  "benadryl", "prilosec", "nexium", "pepcid", "imodium", "gas-x", "mucinex",
  "robitussin", "sudafed", "nyquil", "dayquil", "theraflu", "excedrin",
  "midol", "dramamine", "pepto-bismol", "metamucil", "miralax", "dulcolax",
  "preparation h", "cortaid",
  // Supplements
  "vitamin c", "vitamin d", "vitamin d3", "vitamin b12", "vitamin e",
  "vitamin k", "vitamin a", "vitamin b6", "folic acid", "folate",
  "calcium", "magnesium", "zinc", "iron", "selenium", "potassium",
  "fish oil", "omega-3", "melatonin", "biotin", "collagen",
  "turmeric", "elderberry", "echinacea", "glucosamine", "coq10",
  "multivitamin", "probiotics", "ashwagandha", "valerian root",
  "ginkgo biloba",
];

function looksLikeUPC(q: string): boolean {
  return /^\d{8,14}$/.test(q.trim());
}

function getSuggestions(q: string): string[] {
  if (q.length < 2) return [];
  const lower = q.toLowerCase();
  const startsWith = KNOWN_NAMES.filter((n) => n.startsWith(lower));
  const contains = KNOWN_NAMES.filter(
    (n) => n.includes(lower) && !n.startsWith(lower),
  );
  return [...startsWith, ...contains].slice(0, 6);
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
    clearRecentSearches,
  } = useMedStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<MedProduct | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [source, setSource] = useState<"drug" | "supplement" | null>(null);
  const [offlineBanner, setOfflineBanner] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [notFoundQuery, setNotFoundQuery] = useState("");

  const suggestions = useMemo(() => getSuggestions(query), [query]);
  const showSuggestions =
    suggestions.length > 0 && !product && !loading && !notFound;
  const notFoundSuggestions = useMemo(
    () => getSuggestions(notFoundQuery).slice(0, 4),
    [notFoundQuery],
  );

  useEffect(() => {
    loadRecentSearches().then((searches) => {
      searches.forEach((s) => addRecentSearch(s));
    });
  }, []);

  const finishLookup = async (
    p: MedProduct | null,
    src: "drug" | "supplement",
    raw: any = null,
    searchedQuery: string = "",
  ) => {
    if (!p) {
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
      setNotFound(true);
      setNotFoundQuery(searchedQuery);
      setLoading(false);
      return;
    }
    setOfflineBanner(false);
    setNotFound(false);
    setProduct(p);
    setSource(src);
    setCurrentProduct(p);
    setRawFDAResult(raw);
    addRecentSearch(p.brandName);
    saveLastProduct(p, raw);
    saveRecentSearches([p.brandName, ...recentSearches].slice(0, 8));
    setLoading(false);
  };

  const searchProduct = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setLoading(true);
    setProduct(null);
    setSource(null);
    setNotFound(false);
    if (looksLikeUPC(q)) {
      const result = await lookupByUPC(q);
      finishLookup(result, "drug", null, q);
      return;
    }
    const result = await lookupProduct(q);
    finishLookup(
      result?.product || null,
      result?.source || "drug",
      result?.raw || null,
      q,
    );
  };

  const handleScanned = async (upc: string) => {
    setScannerOpen(false);
    setLoading(true);
    setProduct(null);
    setNotFound(false);
    setQuery(upc);
    const result = await lookupByUPC(upc);
    finishLookup(result, "drug", null, upc);
  };

  const handleClear = () => {
    setQuery("");
    setProduct(null);
    setSource(null);
    setOfflineBanner(false);
    setNotFound(false);
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
      alert(
        `${product.brandName} added as Product A.\n\nSearch another product and tap Add to compare for Product B.`,
      );
    } else if (!compareB) {
      setCompareB(product);
      alert(`${product.brandName} added as Product B. Go to the Compare tab.`);
    } else {
      setCompareA(product);
      alert("Compare slots full — Product A replaced.");
    }
  };

  return (
    <View style={S.root}>
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={S.inner}>
          {/* Search bar */}
          <View style={S.searchRow}>
            <View style={S.inputWrap}>
              <TextInput
                style={S.input}
                placeholder="Drug name, brand, or UPC number..."
                placeholderTextColor={COLOR.textMuted}
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  if (notFound) setNotFound(false);
                }}
                onSubmitEditing={() => searchProduct()}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="default"
              />
              {(query.length > 0 || !!product) && (
                <TouchableOpacity style={S.clearBtn} onPress={handleClear}>
                  <Text style={S.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={S.searchBtn}
              onPress={() => searchProduct()}
            >
              <Text style={S.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          <Text style={S.hint}>
            Drug name, brand name, or scan/enter UPC barcode number
          </Text>

          {/* Autocomplete suggestions */}
          {showSuggestions && (
            <View style={S.suggestionsBox}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    S.suggestionRow,
                    i === suggestions.length - 1 && S.suggestionRowLast,
                  ]}
                  onPress={() => {
                    setQuery(s);
                    searchProduct(s);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={S.suggestionIcon}>⌕</Text>
                  <Text style={S.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && !product && !loading && !showSuggestions && !notFound && (
            <View style={S.recentWrap}>
              <View style={S.recentHeader}>
                <Text style={S.recentTitle}>Recent searches</Text>
                <TouchableOpacity
                  onPress={() => {
                    clearRecentSearches();
                    saveRecentSearches([]);
                  }}
                >
                  <Text style={S.recentClear}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={S.recentList}>
                {recentSearches.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={S.recentChip}
                    onPress={() => {
                      setQuery(item);
                      searchProduct(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={S.recentChipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Offline banner */}
          {offlineBanner && (
            <View style={S.offlineBanner}>
              <Text style={S.offlineBannerText}>
                ⚠ No internet — showing last saved result.
              </Text>
            </View>
          )}

          {/* Loading */}
          {loading && (
            <View style={S.loadingWrap}>
              <ActivityIndicator size="large" color={COLOR.primaryMid} />
              <Text style={S.loadingText}>Searching databases...</Text>
            </View>
          )}

          {/* Not found */}
          {notFound && !loading && (
            <View style={S.notFoundCard}>
              <Text style={S.notFoundTitle}>
                No results for &ldquo;{notFoundQuery}&rdquo;
              </Text>
              <Text style={S.notFoundText}>
                Check the spelling or try the generic name (e.g. Tylenol →
                acetaminophen, Advil → ibuprofen).
              </Text>
              {notFoundSuggestions.length > 0 && (
                <>
                  <Text style={S.notFoundSugLabel}>Did you mean:</Text>
                  <View style={S.recentList}>
                    {notFoundSuggestions.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={S.recentChip}
                        onPress={() => {
                          setNotFound(false);
                          setQuery(s);
                          searchProduct(s);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={S.recentChipText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Result */}
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
                  <Text style={S.alertBTCTitle}>
                    Behind-the-counter product
                  </Text>
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
                <TouchableOpacity
                  style={S.actionBtn}
                  onPress={handleSeePrices}
                >
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
      </ScrollView>

      {/* Floating scan button — thumb-friendly bottom placement */}
      <View style={S.floatingWrap}>
        <TouchableOpacity
          style={S.floatingScanBtn}
          onPress={() => setScannerOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={S.scanIcon}>▦</Text>
          <Text style={S.scanBtnText}>Scan barcode</Text>
        </TouchableOpacity>
      </View>

      <BarcodeScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleScanned}
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  inner: { padding: SPACE.md },

  searchRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.sm },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FONT.md,
    color: COLOR.text,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  clearBtnText: { fontSize: FONT.md, color: COLOR.textMuted },
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

  // Autocomplete suggestions
  suggestionsBox: {
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLOR.border,
    marginBottom: SPACE.md,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    gap: 10,
  },
  suggestionRowLast: { borderBottomWidth: 0 },
  suggestionIcon: { fontSize: FONT.md, color: COLOR.textMuted },
  suggestionText: {
    fontSize: FONT.md,
    color: COLOR.text,
    textTransform: "capitalize",
  },

  // Not found
  notFoundCard: {
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    padding: 18,
    marginBottom: SPACE.md,
  },
  notFoundTitle: {
    fontSize: FONT.lg,
    fontWeight: "600",
    color: COLOR.text,
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: FONT.sm,
    color: COLOR.textSub,
    lineHeight: 22,
    marginBottom: 14,
  },
  notFoundSugLabel: {
    fontSize: FONT.xs,
    fontWeight: "600",
    color: COLOR.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // Recent searches
  recentWrap: { marginBottom: SPACE.md },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: FONT.xs,
    fontWeight: "600",
    color: COLOR.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recentClear: {
    fontSize: FONT.xs,
    color: COLOR.textMuted,
    fontWeight: "500",
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

  // Floating scan button
  floatingWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACE.md,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "rgba(245,245,245,0.95)",
    borderTopWidth: 0.5,
    borderTopColor: COLOR.border,
  },
  floatingScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    backgroundColor: COLOR.primaryMid,
    borderRadius: RADIUS.md,
    paddingVertical: 18,
  },
  scanIcon: { fontSize: 22, color: COLOR.white },
  scanBtnText: {
    fontSize: FONT.md,
    color: COLOR.white,
    fontWeight: "600",
  },
});
