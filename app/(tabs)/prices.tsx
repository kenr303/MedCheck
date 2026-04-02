import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLOR, FONT, RADIUS, SPACE } from "../../store/theme";
import { useMedStore } from "../../store/useMedStore";

type PriceItem = {
  name: string;
  store: string;
  count: string;
  price: number;
  pricePerPill: number;
  isGeneric: boolean;
  url: string;
};

type SearchedProduct = {
  genericName: string;
  strength: string;
  items: PriceItem[];
};

// ── Strength picker options ─────────────────────────────────────────────────
// Maps a base drug name to its available strength-specific keys.
// Used to show a strength picker when user searches by generic name.
type StrengthOption = { label: string; key: string };
const DRUG_STRENGTHS: Record<string, { default: string; options: StrengthOption[] }> = {
  acetaminophen: {
    default: "acetaminophen_500",
    options: [
      { label: "325 mg", key: "acetaminophen_325" },
      { label: "500 mg", key: "acetaminophen_500" },
      { label: "650 mg ER", key: "acetaminophen_650" },
    ],
  },
  aspirin: {
    default: "aspirin_81",
    options: [
      { label: "81 mg", key: "aspirin_81" },
      { label: "325 mg", key: "aspirin_325" },
      { label: "500 mg", key: "aspirin_500" },
    ],
  },
  cetirizine: {
    default: "cetirizine_10",
    options: [
      { label: "5 mg", key: "cetirizine_5" },
      { label: "10 mg", key: "cetirizine_10" },
    ],
  },
  fexofenadine: {
    default: "fexofenadine_180",
    options: [
      { label: "60 mg", key: "fexofenadine_60" },
      { label: "180 mg", key: "fexofenadine_180" },
    ],
  },
  diphenhydramine: {
    default: "diphenhydramine_25",
    options: [
      { label: "25 mg", key: "diphenhydramine_25" },
      { label: "50 mg", key: "diphenhydramine_50" },
    ],
  },
  famotidine: {
    default: "famotidine_20",
    options: [
      { label: "10 mg", key: "famotidine_10" },
      { label: "20 mg", key: "famotidine_20" },
    ],
  },
  simethicone: {
    default: "simethicone_125",
    options: [
      { label: "80 mg", key: "simethicone_80" },
      { label: "125 mg", key: "simethicone_125" },
      { label: "180 mg", key: "simethicone_180" },
    ],
  },
  guaifenesin: {
    default: "guaifenesin_400",
    options: [
      { label: "200 mg", key: "guaifenesin_200" },
      { label: "400 mg", key: "guaifenesin_400" },
      { label: "600 mg ER", key: "guaifenesin_600" },
      { label: "1200 mg ER", key: "guaifenesin_1200" },
    ],
  },
  docusate: {
    default: "docusate_100",
    options: [
      { label: "100 mg", key: "docusate_100" },
      { label: "250 mg", key: "docusate_250" },
    ],
  },
};

// Find which drug family a strength-specific key belongs to (e.g. "acetaminophen_500" → "acetaminophen")
function findDrugFamily(key: string): string | null {
  for (const [familyKey, family] of Object.entries(DRUG_STRENGTHS)) {
    if (family.options.some((opt) => opt.key === key)) return familyKey;
  }
  return null;
}

// ── Live pricing via Cloudflare Worker ────────────────────────────────────
const PRICE_WORKER_URL = "https://medcheck-price-worker.donvenecio.workers.dev";

type WorkerResponse = {
  updatedAt: string;
  isEstimate: boolean;
  disclaimer: string;
  data: SearchedProduct | null;
};

async function fetchLivePrices(
  drugKey: string,
): Promise<{ data: SearchedProduct; updatedAt: string; isEstimate: boolean; disclaimer: string } | null> {
  try {
    const res = await fetch(`${PRICE_WORKER_URL}/prices?drug=${encodeURIComponent(drugKey)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body: WorkerResponse = await res.json();
    if (body.data) {
      return { data: body.data, updatedAt: body.updatedAt, isEstimate: body.isEstimate, disclaimer: body.disclaimer };
    }
    // If strength-specific key returned no data, try the base name
    // (worker cache may still use old non-suffixed keys)
    if (drugKey.includes("_")) {
      const baseKey = drugKey.replace(/_[^_]+$/, "");
      const fallbackRes = await fetch(`${PRICE_WORKER_URL}/prices?drug=${encodeURIComponent(baseKey)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!fallbackRes.ok) return null;
      const fallbackBody: WorkerResponse = await fallbackRes.json();
      if (!fallbackBody.data) return null;
      const family = findDrugFamily(drugKey);
      const strengthOpt = family
        ? DRUG_STRENGTHS[family]?.options.find((o) => o.key === drugKey)
        : null;
      const data = { ...fallbackBody.data };
      if (strengthOpt) data.strength = strengthOpt.label;
      return { data, updatedAt: fallbackBody.updatedAt, isEstimate: fallbackBody.isEstimate, disclaimer: fallbackBody.disclaimer };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Brand → generic alias map ─────────────────────────────────────────────
const ALIASES: Record<string, string> = {
  tylenol: "acetaminophen",
  advil: "ibuprofen",
  motrin: "ibuprofen",
  claritin: "loratadine",
  zyrtec: "cetirizine",
  prilosec: "omeprazole",
  nexium: "omeprazole",
  aleve: "naproxen",
  benadryl: "diphenhydramine",
  pepcid: "famotidine",
  imodium: "loperamide",
  "gas-x": "simethicone",
  mucinex: "guaifenesin",
  robitussin: "dextromethorphan",
  bayer: "aspirin",
  "vitamin d3": "vitamin d",
  omega3: "fish oil",
  omega: "fish oil",
  allegra: "fexofenadine",
  "pepto bismol": "bismuth",
  "pepto-bismol": "bismuth",
  pepto: "bismuth",
  colace: "docusate",
  miralax: "polyethylene glycol",
  peg: "polyethylene glycol",
  laxative: "polyethylene glycol",
  cortaid: "hydrocortisone",
  "vitamin c": "vitamin c",
  "ascorbic acid": "vitamin c",
  b12: "vitamin b12",
  cyanocobalamin: "vitamin b12",
  curcumin: "turmeric",
  sambucus: "elderberry",
  "coenzyme q10": "coq10",
  "coq-10": "coq10",
  probiotic: "probiotics",
  culturelle: "probiotics",
};

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PricesScreen() {
  const { currentProduct } = useMedStore();
  const params = useLocalSearchParams<{ drug?: string }>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchedProduct | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isEstimate, setIsEstimate] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  // Strength picker state
  const [strengthOptions, setStrengthOptions] = useState<StrengthOption[] | null>(null);
  const [activeStrengthKey, setActiveStrengthKey] = useState<string>("");
  // Track last searched key so we don't re-run on unrelated re-renders
  const lastSearchedKey = useRef<string>("");

  const applyResult = (found: SearchedProduct, meta?: { updatedAt: string; isEstimate: boolean; disclaimer: string }) => {
    setResult({ ...found, items: [...found.items].sort((a, b) => a.price - b.price) });
    if (meta) {
      setUpdatedAt(formatUpdatedAt(meta.updatedAt));
      setIsEstimate(meta.isEstimate);
      setDisclaimer(meta.disclaimer);
    } else {
      setUpdatedAt(null);
      setIsEstimate(false);
      setDisclaimer(null);
    }
  };

  const fetchAndApply = useCallback(async (drugKey: string) => {
    setLoading(true);
    setResult(null);
    const live = await fetchLivePrices(drugKey);
    if (live) {
      applyResult(live.data, live);
    }
    setLoading(false);
  }, []);

  const runSearch = useCallback((rawKey: string, displayName: string) => {
    // Resolve brand aliases first (e.g. "tylenol" → "acetaminophen")
    const aliasResolved = ALIASES[rawKey] || rawKey;
    // Check if this is a base name with multiple strengths
    const family = DRUG_STRENGTHS[aliasResolved];
    // If it's already a strength-specific key, find its family
    const parentFamily = findDrugFamily(aliasResolved);

    let finalKey: string;
    if (family) {
      // Base name → resolve to default strength, show picker
      finalKey = family.default;
      setStrengthOptions(family.options);
      setActiveStrengthKey(finalKey);
    } else if (parentFamily) {
      // Already strength-specific → show picker with this one pre-selected
      setStrengthOptions(DRUG_STRENGTHS[parentFamily].options);
      setActiveStrengthKey(aliasResolved);
      finalKey = aliasResolved;
    } else {
      // Single-strength drug or no family
      setStrengthOptions(null);
      setActiveStrengthKey("");
      finalKey = aliasResolved;
    }

    if (lastSearchedKey.current === finalKey) return;
    lastSearchedKey.current = finalKey;
    setQuery(displayName);
    fetchAndApply(finalKey);
  }, [fetchAndApply]);

  const handleStrengthChange = useCallback((key: string) => {
    setActiveStrengthKey(key);
    lastSearchedKey.current = key;
    fetchAndApply(key);
  }, [fetchAndApply]);

  // ?drug= param takes priority (navigated from lookup with a specific strength key)
  useEffect(() => {
    const drugParam = params.drug;
    if (drugParam) {
      runSearch(drugParam, drugParam);
      return;
    }
    // Fall back to currentProduct from store (e.g. navigated via tab)
    if (currentProduct?.priceKey) {
      runSearch(currentProduct.priceKey, currentProduct.brandName);
    } else if (currentProduct?.genericKey) {
      runSearch(currentProduct.genericKey, currentProduct.brandName);
    }
  }, [params.drug, currentProduct, runSearch]);

  const searchPrices = async () => {
    if (!query.trim()) return;
    const key = query.trim().toLowerCase();
    const aliasResolved = ALIASES[key] || key;
    const family = DRUG_STRENGTHS[aliasResolved];
    const parentFamily = findDrugFamily(aliasResolved);

    let finalKey: string;
    if (family) {
      finalKey = family.default;
      setStrengthOptions(family.options);
      setActiveStrengthKey(finalKey);
    } else if (parentFamily) {
      setStrengthOptions(DRUG_STRENGTHS[parentFamily].options);
      setActiveStrengthKey(aliasResolved);
      finalKey = aliasResolved;
    } else {
      setStrengthOptions(null);
      setActiveStrengthKey("");
      finalKey = aliasResolved;
    }

    lastSearchedKey.current = finalKey;
    setLoading(true);
    setResult(null);
    const live = await fetchLivePrices(finalKey);
    if (live) {
      applyResult(live.data, live);
      setLoading(false);
      return;
    }
    Alert.alert(
      "Not found",
      "Prices not available for this product. Check your connection and try again.",
    );
    setLoading(false);
  };

  const openLink = (url: string) => {
    if (!url) {
      Alert.alert(
        "Local pharmacy",
        "Call your local pharmacy for current pricing.",
      );
      return;
    }
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open link."),
    );
  };

  const savings = result
    ? result.items[result.items.length - 1].price - result.items[0].price
    : 0;

  return (
    <ScrollView style={S.container} keyboardShouldPersistTaps="handled">
      <View style={S.inner}>
        <View style={S.searchRow}>
          <View style={S.inputWrap}>
            <TextInput
              style={S.input}
              placeholder="Drug or supplement name..."
              placeholderTextColor={COLOR.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchPrices}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={S.clearBtn}
                onPress={() => {
                  setQuery("");
                  setResult(null);
                  setUpdatedAt(null);
                  setIsEstimate(false);
                  setDisclaimer(null);
                  setStrengthOptions(null);
                  setActiveStrengthKey("");
                  lastSearchedKey.current = "";
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={S.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={S.searchBtn} onPress={searchPrices}>
            <Text style={S.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.hint}>
          Try: Tylenol, ibuprofen, Claritin, Allegra, Pepto-Bismol, MiraLax,
          melatonin, vitamin C, magnesium, zinc, turmeric, CoQ10...
        </Text>

        {loading && (
          <View style={S.loadingWrap}>
            <ActivityIndicator size="large" color={COLOR.primaryMid} />
            <Text style={S.loadingText}>Finding best prices...</Text>
          </View>
        )}

        {result && (
          <View>
            <Text style={S.productName}>{result.genericName}</Text>
            <Text style={S.productStrength}>
              {result.strength} · sorted by lowest price
              {updatedAt ? ` · updated ${updatedAt}` : ""}
            </Text>

            {/* Strength picker — shown when multiple strengths are available */}
            {strengthOptions && strengthOptions.length > 1 && (
              <View style={S.strengthRow}>
                {strengthOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      S.strengthChip,
                      activeStrengthKey === opt.key && S.strengthChipActive,
                    ]}
                    onPress={() => handleStrengthChange(opt.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        S.strengthChipText,
                        activeStrengthKey === opt.key && S.strengthChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {isEstimate && disclaimer && (
              <Text style={S.estimateNote}>⚠ {disclaimer}</Text>
            )}

            {/* Local pharmacy slot */}
            <TouchableOpacity
              style={S.localCard}
              onPress={() => openLink("")}
              activeOpacity={0.8}
            >
              <View style={S.localLeft}>
                <View style={S.localBadgeRow}>
                  <View style={S.localBadge}>
                    <Text style={S.localBadgeText}>Local pharmacy</Text>
                  </View>
                </View>
                <Text style={S.localName}>Your Local Pharmacy</Text>
                <Text style={S.localNote}>
                  Support your local independent pharmacy. Personal service,
                  same ingredients.
                </Text>
              </View>
              <View style={S.localRight}>
                <Text style={S.localCTA}>Call for{"\n"}price</Text>
              </View>
            </TouchableOpacity>

            <Text style={S.bestLabel}>Best deal online</Text>

            {result.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[S.priceCard, i === 0 && S.priceCardBest]}
                onPress={() => openLink(item.url)}
                activeOpacity={0.7}
              >
                <View style={S.pcLeft}>
                  <Text style={S.pcName}>{item.name}</Text>
                  <Text style={S.pcMeta}>
                    {item.count} · {item.store}
                  </Text>
                  <View
                    style={[S.tag, item.isGeneric ? S.tagGeneric : S.tagBrand]}
                  >
                    <Text
                      style={[
                        S.tagText,
                        item.isGeneric ? S.tagGenericText : S.tagBrandText,
                      ]}
                    >
                      {item.isGeneric ? "Generic" : "Brand name"}
                    </Text>
                  </View>
                </View>
                <View style={S.pcRight}>
                  <Text style={[S.pcPrice, i === 0 && S.pcPriceBest]}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text style={S.pcPerPill}>
                    ${item.pricePerPill.toFixed(2)} / pill
                  </Text>
                  <Text style={S.pcArrow}>↗</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={S.savingsBox}>
              <View>
                <Text style={S.savingsLabel}>Max savings</Text>
                <Text style={S.savingsSub}>cheapest vs. most expensive</Text>
              </View>
              <Text style={S.savingsAmt}>${savings.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={S.partnerCTA}
              onPress={() =>
                Alert.alert(
                  "List your pharmacy",
                  "Contact us at: partners@medcheckapp.com",
                )
              }
            >
              <Text style={S.partnerCTAText}>
                Are you a local pharmacy? Get listed here →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.bg },
  inner: { padding: SPACE.md },
  searchRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.sm },
  inputWrap: { flex: 1, position: "relative", justifyContent: "center" },
  clearBtn: {
    position: "absolute",
    right: 10,
    padding: 4,
  },
  clearBtnText: { fontSize: 14, color: COLOR.textMuted },
  input: {
    flex: 1,
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingLeft: 16,
    paddingRight: 36,
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
  loadingWrap: { alignItems: "center", marginTop: 48, gap: 14 },
  loadingText: { fontSize: FONT.md, color: COLOR.textSub },
  productName: { fontSize: FONT.xl, fontWeight: "600", color: COLOR.text },
  productStrength: {
    fontSize: FONT.sm,
    color: COLOR.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  strengthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  strengthChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ccc",
    backgroundColor: COLOR.white,
  },
  strengthChipActive: {
    borderColor: COLOR.primaryMid,
    backgroundColor: COLOR.primaryMid,
  },
  strengthChipText: {
    fontSize: FONT.sm,
    color: COLOR.textSub,
    fontWeight: "500",
  },
  strengthChipTextActive: {
    color: COLOR.white,
  },
  localCard: {
    flexDirection: "row",
    backgroundColor: "#FFF8E7",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  localLeft: { flex: 1 },
  localBadgeRow: { flexDirection: "row", marginBottom: 6 },
  localBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  localBadgeText: { fontSize: FONT.xs, fontWeight: "700", color: "#78350F" },
  localName: {
    fontSize: FONT.md,
    fontWeight: "600",
    color: COLOR.text,
    marginBottom: 3,
  },
  localNote: { fontSize: FONT.sm, color: COLOR.textSub, lineHeight: 20 },
  localRight: { justifyContent: "center", alignItems: "center" },
  localCTA: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: "#B45309",
    textAlign: "center",
    lineHeight: 20,
  },
  bestLabel: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: COLOR.success,
    marginBottom: 8,
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  priceCardBest: { borderColor: "#1D9E75", borderWidth: 1.5 },
  pcLeft: { flex: 1, minWidth: 0 },
  pcName: { fontSize: FONT.md, fontWeight: "600", color: COLOR.text },
  pcMeta: { fontSize: FONT.sm, color: COLOR.textSub, marginTop: 4 },
  tag: {
    marginTop: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagGeneric: { backgroundColor: COLOR.successLight },
  tagBrand: { backgroundColor: COLOR.primaryLight },
  tagText: { fontSize: FONT.xs, fontWeight: "600" },
  tagGenericText: { color: "#27500A" },
  tagBrandText: { color: COLOR.primary },
  pcRight: { alignItems: "flex-end" },
  pcPrice: { fontSize: FONT.xxl, fontWeight: "600", color: COLOR.primary },
  pcPriceBest: { color: COLOR.success },
  pcPerPill: { fontSize: FONT.sm, color: COLOR.textSub, marginTop: 3 },
  pcArrow: { fontSize: FONT.sm, color: COLOR.primaryMid, marginTop: 5 },
  savingsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    padding: 16,
    marginTop: 4,
  },
  savingsLabel: { fontSize: FONT.md, fontWeight: "600", color: COLOR.text },
  savingsSub: { fontSize: FONT.sm, color: COLOR.textMuted, marginTop: 3 },
  savingsAmt: {
    fontSize: FONT.xxl + 4,
    fontWeight: "600",
    color: COLOR.primary,
  },
  estimateNote: {
    fontSize: FONT.xs,
    color: COLOR.warning,
    lineHeight: 18,
    marginBottom: 12,
  },
  partnerCTA: { marginTop: 14, padding: 14, alignItems: "center" },
  partnerCTAText: {
    fontSize: FONT.sm,
    color: COLOR.primaryMid,
    fontWeight: "500",
  },
});
