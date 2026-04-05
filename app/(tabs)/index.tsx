import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BarcodeScanner from "../../components/BarcodeScanner";
import {
  loadRecentSearches,
  saveLastProduct,
  saveRecentSearches,
} from "../../store/cache";
import {
  lookupByUPC,
  lookupProductsMulti,
  MultiSearchResult,
} from "../../store/lookup";
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

// Levenshtein edit distance — used for fuzzy "did you mean?" suggestions.
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

// Returns smart "did you mean?" suggestions using prefix/contains first,
// then Levenshtein distance for typo/phonetic fallbacks.
function getFuzzySuggestions(q: string): string[] {
  if (q.length < 2) return [];
  const lower = q.toLowerCase();

  // Exact prefix / substring matches first
  const exact = getSuggestions(lower);
  if (exact.length >= 4) return exact.slice(0, 5);

  // Score each known name: prefer short edit distance, penalise length mismatch
  const seen = new Set(exact);
  const fuzzy = KNOWN_NAMES.filter((n) => !seen.has(n))
    .map((name) => {
      // Compare against the first word of multi-word names for short queries
      const firstWord = name.split(" ")[0];
      const dist = Math.min(levenshtein(lower, name), levenshtein(lower, firstWord));
      return { name, dist };
    })
    .filter(({ dist }) => dist <= Math.max(2, Math.floor(lower.length / 3)))
    .sort((a, b) => a.dist - b.dist)
    .map(({ name }) => name)
    .slice(0, 5 - exact.length);

  return [...exact, ...fuzzy];
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
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedStrengthIdx, setSelectedStrengthIdx] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [notFoundQuery, setNotFoundQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MultiSearchResult[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [compareBanner, setCompareBanner] = useState("");
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => getSuggestions(query), [query]);
  const showSuggestions =
    inputFocused && suggestions.length > 0 && !loading && query.length >= 2 && searchResults.length === 0;
  const notFoundSuggestions = useMemo(
    () => getFuzzySuggestions(notFoundQuery),
    [notFoundQuery],
  );

  useEffect(() => {
    loadRecentSearches().then((searches) => {
      searches.forEach((s) => addRecentSearch(s));
    });
  }, []);

  const finishLookup = (
    p: MedProduct | null,
    src: "drug" | "supplement",
    raw: any = null,
    searchedQuery: string = "",
  ) => {
    if (!p) {
      setNotFound(true);
      setNotFoundQuery(searchedQuery);
      setLoading(false);
      return;
    }
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

  const handleInputFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setInputFocused(false), 150);
  };

  const searchProduct = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    Keyboard.dismiss();
    setInputFocused(false);
    setLoading(true);
    setProduct(null);
    setSource(null);
    setNotFound(false);
    setSearchResults([]);

    if (looksLikeUPC(q)) {
      const result = await lookupByUPC(q);
      finishLookup(result, "drug", null, q);
      return;
    }

    const results = await lookupProductsMulti(q);

    if (results.length === 0) {
      finishLookup(null, "drug", null, q);
      return;
    }

    if (results.length === 1) {
      finishLookup(results[0].product, results[0].source, results[0].raw, q);
      return;
    }

    // Multiple matches — show picker
    setSearchResults(results);
    setLoading(false);
  };

  const handleSelectResult = (r: MultiSearchResult) => {
    setSearchResults([]);
    finishLookup(r.product, r.source, r.raw, query);
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
    setNotFound(false);
    setSearchResults([]);
  };

  // Reset variant + strength selectors when a new product loads
  useEffect(() => {
    if (product?.otcFamily) {
      setSelectedVariantIdx(product.otcFamily.defaultVariantIndex);
    } else {
      setSelectedVariantIdx(0);
    }
    setSelectedStrengthIdx(0);
  }, [product?.genericKey]);

  // Reset strength when variant changes
  useEffect(() => {
    setSelectedStrengthIdx(0);
  }, [selectedVariantIdx]);

  const currentVariant = product?.otcFamily?.variants[selectedVariantIdx] ?? null;
  const selectedStrength = currentVariant?.strengths[selectedStrengthIdx] ?? null;
  const displayedIngredients = selectedStrength?.ingredients ?? product?.ingredients ?? [];
  const displayIsBTC = currentVariant?.isBTC ?? product?.isBTC ?? false;
  const displayNote = currentVariant?.note ?? product?.otcNote;

const showCompareBanner = (msg: string) => {
    setCompareBanner(msg);
    setTimeout(() => setCompareBanner(""), 4000);
  };

  const handleAddToCompare = () => {
    if (!product) return;
    if (!compareA) {
      setCompareA(product);
      showCompareBanner(`Added as Product A`);
    } else if (!compareB) {
      setCompareB(product);
      showCompareBanner(`Added as Product B — go to Compare tab`);
    } else {
      setCompareA(product);
      showCompareBanner(`Product A replaced`);
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
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
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

          {/* Autocomplete suggestions — shown as dropdown right below search bar */}
          {showSuggestions ? (
            <View style={S.suggestionsBox}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    S.suggestionRow,
                    i === suggestions.length - 1 && S.suggestionRowLast,
                  ]}
                  onPress={() => {
                    setInputFocused(false);
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
          ) : (
            <Text style={S.hint}>
              Drug name, brand name, or scan/enter UPC barcode number
            </Text>
          )}

          {/* Multiple results picker */}
          {searchResults.length > 1 && !loading && (
            <View style={S.resultsListWrap}>
              <View style={S.resultsListHeader}>
                <Text style={S.resultsListTitle}>
                  {searchResults.length} products found — select one:
                </Text>
              </View>
              {searchResults.map((r, i) => {
                const topIngredients = r.product.ingredients.slice(0, 2);
                const ingStr = topIngredients
                  .map((ing) =>
                    [ing.name, ing.concentration].filter(Boolean).join(" "),
                  )
                  .filter(Boolean)
                  .join(" + ");
                const subtitle = [ingStr, r.product.form]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      S.resultItem,
                      i === searchResults.length - 1 && S.resultItemLast,
                    ]}
                    onPress={() => handleSelectResult(r)}
                    activeOpacity={0.7}
                  >
                    <View style={S.resultItemLeft}>
                      <Text style={S.resultItemName}>{r.product.brandName}</Text>
                      {subtitle ? (
                        <Text style={S.resultItemSub}>{subtitle}</Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        S.sourceBadge,
                        r.source === "supplement"
                          ? S.sourceBadgeSupp
                          : S.sourceBadgeDrug,
                      ]}
                    >
                      <Text
                        style={[
                          S.sourceBadgeText,
                          r.source === "supplement"
                            ? S.sourceBadgeSuppText
                            : S.sourceBadgeDrugText,
                        ]}
                      >
                        {r.source === "supplement" ? "Supplement" : "OTC Drug"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && !product && !loading && !showSuggestions && !notFound && searchResults.length === 0 && (
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

          {/* Loading */}
          {loading && (
            <View style={S.loadingWrap}>
              <ActivityIndicator size="large" color={COLOR.primaryMid} />
              <Text style={S.loadingText}>Looking up...</Text>
            </View>
          )}

          {/* Not found */}
          {notFound && !loading && (
            <View style={S.notFoundCard}>
              <Text style={S.notFoundTitle}>
                "{notFoundQuery}" not found
              </Text>
              <Text style={S.notFoundText}>
                This product does not match anything in our database. It may be a prescription drug, a store brand under a different name, or a spelling variation.
              </Text>
              {notFoundSuggestions.length > 0 ? (
                <>
                  <Text style={S.notFoundSugLabel}>Did you mean one of these?</Text>
                  {notFoundSuggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={S.notFoundSugRow}
                      onPress={() => {
                        setNotFound(false);
                        setQuery(s);
                        searchProduct(s);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={S.notFoundSugArrow}>→</Text>
                      <Text style={S.notFoundSugName}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <Text style={S.notFoundTip}>
                  Tip: try the generic name (e.g. "Tylenol" → "acetaminophen", "Advil" → "ibuprofen") or scan the barcode.
                </Text>
              )}
            </View>
          )}

          {/* Result */}
          {product && (
            <View style={S.resultWrap}>
              {/* Product name — big and clear */}
              <Text style={S.productName}>{product.brandName}</Text>
              {source && (
                <View style={S.sourceRow}>
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
                  {product.form ? (
                    <Text style={S.productForm}>{product.form}</Text>
                  ) : null}
                </View>
              )}

              {/* Variant picker */}
              {product.otcFamily && product.otcFamily.variants.length > 1 && (
                <View style={S.strengthSection}>
                  <Text style={S.strengthLabel}>Type:</Text>
                  <View style={S.strengthList}>
                    {product.otcFamily.variants.map((v, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          S.strengthChip,
                          i === selectedVariantIdx && S.strengthChipActive,
                        ]}
                        onPress={() => setSelectedVariantIdx(i)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            S.strengthChipText,
                            i === selectedVariantIdx && S.strengthChipTextActive,
                          ]}
                        >
                          {v.chipLabel}
                        </Text>
                        {v.isBTC && (
                          <Text style={S.strengthChipBTC}> BTC</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Strength picker */}
              {currentVariant && currentVariant.strengths.length > 1 && (
                <View style={S.strengthSection}>
                  <Text style={S.strengthLabel}>Strength:</Text>
                  <View style={S.strengthList}>
                    {currentVariant.strengths.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          S.strengthChip,
                          i === selectedStrengthIdx && S.strengthChipActive,
                        ]}
                        onPress={() => setSelectedStrengthIdx(i)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            S.strengthChipText,
                            i === selectedStrengthIdx && S.strengthChipTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Alerts — BTC, warnings, serving size */}
              {displayIsBTC && (
                <View style={S.alertBTC}>
                  <Text style={S.alertBTCTitle}>ID Required</Text>
                  <Text style={S.alertBTCText}>
                    Behind-the-counter — bring photo ID.
                  </Text>
                </View>
              )}

              {displayNote && (
                <View style={S.alertWarn}>
                  <Text style={S.alertWarnText}>{displayNote}</Text>
                </View>
              )}

              {product.servingSizeAlert && (
                <View style={S.alertWarn}>
                  <Text style={S.alertWarnText}>{product.servingSizeAlert}</Text>
                </View>
              )}

              {/* Ingredients — simplified, one clear list */}
              {displayedIngredients.length > 0 ? (
                <View style={S.card}>
                  {displayedIngredients.map((ing, i) => (
                    <View
                      key={i}
                      style={[
                        S.ingrRow,
                        i === displayedIngredients.length - 1 && S.ingrRowLast,
                      ]}
                    >
                      <View style={S.ingrNameWrap}>
                        <Text style={S.ingrName}>{ing.name}</Text>
                        {ing.concentration ? (
                          <Text style={S.ingrConc}>{ing.concentration}</Text>
                        ) : null}
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
                    Ingredient details not available.
                  </Text>
                </View>
              )}

              {compareBanner ? (
                <View style={S.compareBanner}>
                  <Text style={S.compareBannerText}>{compareBanner}</Text>
                </View>
              ) : null}

<View style={S.actionRowSecondary}>
                <TouchableOpacity
                  style={S.actionBtn}
                  onPress={handleAddToCompare}
                >
                  <Text style={S.actionBtnText}>Add to compare</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.actionBtn}
                  onPress={() => router.push("/product-detail")}
                >
                  <Text style={S.actionBtnText}>Full details</Text>
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
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    zIndex: 100,
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
  notFoundSugRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#eee",
    gap: 10,
  },
  notFoundSugArrow: {
    fontSize: FONT.md,
    color: COLOR.primaryMid,
    fontWeight: "600",
  },
  notFoundSugName: {
    fontSize: FONT.md,
    color: COLOR.primaryMid,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  notFoundTip: {
    fontSize: FONT.sm,
    color: COLOR.textMuted,
    lineHeight: 22,
    fontStyle: "italic",
    marginTop: 4,
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

  loadingWrap: { alignItems: "center", marginTop: 48, gap: 14 },
  loadingText: { fontSize: FONT.md, color: COLOR.textSub },

  resultWrap: { marginTop: SPACE.sm },
  productName: {
    fontSize: FONT.xxl,
    fontWeight: "700",
    color: COLOR.text,
    lineHeight: 34,
    textTransform: "capitalize",
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: SPACE.md,
  },
  productForm: {
    fontSize: FONT.sm,
    color: COLOR.textSub,
    textTransform: "capitalize",
  },

  sourceBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sourceBadgeDrug: { backgroundColor: COLOR.primaryLight },
  sourceBadgeSupp: { backgroundColor: COLOR.successLight },
  sourceBadgeText: { fontSize: FONT.sm, fontWeight: "600" },
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

  ingrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  ingrRowLast: { borderBottomWidth: 0 },
  ingrNameWrap: { flex: 1, marginRight: 12 },
  ingrName: {
    fontSize: FONT.xl,
    fontWeight: "700",
    color: COLOR.text,
    textTransform: "capitalize",
  },
  ingrConc: { fontSize: FONT.md, color: COLOR.primaryMid, fontWeight: "600", marginTop: 4 },
  ingrPurpose: {
    fontSize: FONT.sm,
    color: COLOR.textSub,
    textAlign: "right",
    maxWidth: 130,
    marginTop: 2,
  },

  strengthSection: {
    marginBottom: 14,
  },
  strengthLabel: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: COLOR.textMuted,
    marginBottom: 8,
  },
  strengthList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  strengthChip: {
    borderWidth: 1.5,
    borderColor: COLOR.border,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: COLOR.white,
  },
  strengthChipActive: {
    borderColor: COLOR.primaryMid,
    backgroundColor: COLOR.primaryLight,
  },
  strengthChipText: {
    fontSize: FONT.md,
    color: COLOR.textSub,
    fontWeight: "500",
  },
  strengthChipTextActive: {
    color: COLOR.primary,
    fontWeight: "700",
  },
  strengthChipBTC: {
    fontSize: FONT.xs,
    color: COLOR.danger,
    fontWeight: "700",
  },

  compareBanner: {
    backgroundColor: COLOR.successLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.success,
  },
  compareBannerText: {
    fontSize: FONT.md,
    color: COLOR.success,
    fontWeight: "500",
  },

  actionBtnPrimary: {
    backgroundColor: COLOR.primaryMid,
    borderRadius: RADIUS.sm,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: SPACE.sm,
    marginBottom: 10,
  },
  actionBtnPrimaryText: {
    fontSize: FONT.lg,
    fontWeight: "700",
    color: COLOR.white,
  },
  actionRowSecondary: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLOR.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: FONT.md,
    fontWeight: "500",
    color: COLOR.textSub,
  },

  // Multi-result picker list
  resultsListWrap: {
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    marginBottom: SPACE.md,
    overflow: "hidden",
  },
  resultsListHeader: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
  },
  resultsListTitle: {
    fontSize: FONT.xs,
    fontWeight: "600",
    color: COLOR.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  resultItemLast: { borderBottomWidth: 0 },
  resultItemLeft: { flex: 1, marginRight: 10 },
  resultItemName: {
    fontSize: FONT.md,
    fontWeight: "600",
    color: COLOR.text,
    textTransform: "capitalize",
    marginBottom: 3,
  },
  resultItemSub: {
    fontSize: FONT.sm,
    color: COLOR.textSub,
    textTransform: "capitalize",
    lineHeight: 18,
  },

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
