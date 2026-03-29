import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Ingredient = {
  name: string;
  concentration: string;
  purpose: string;
};

type CompareProduct = {
  brandName: string;
  form: string;
  ingredients: Ingredient[];
  isBTC: boolean;
  bestPrice: string;
};

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

const BEST_PRICES: Record<string, string> = {
  acetaminophen: "$4.88 (Walmart)",
  ibuprofen: "$4.48 (Walmart)",
  loratadine: "$6.88 (Walmart)",
  cetirizine: "$7.88 (Walmart)",
  omeprazole: "$9.88 (Walmart)",
};

async function fetchProduct(query: string): Promise<CompareProduct | null> {
  const q = encodeURIComponent(query.trim());
  const urls = [
    `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${q}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${q}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=openfda.substance_name:${q}&limit=1`,
    `https://api.fda.gov/drug/label.json?search=${q}&limit=1`,
  ];
  let result = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        result = data.results[0];
        break;
      }
    } catch {
      continue;
    }
  }
  if (!result) return null;
  const r = result;
  const ingredients = parseIngredients(r);
  const brandName =
    r.openfda?.brand_name?.[0] ||
    r.brand_name?.[0] ||
    r.openfda?.generic_name?.[0] ||
    query;
  const form = (r.dosage_form?.[0] || "").toLowerCase();
  const allText = JSON.stringify(r).toLowerCase();
  const isBTC =
    allText.includes("pseudoephedrine") || allText.includes("ephedrine");
  const genericKey = (r.openfda?.generic_name?.[0] || "")
    .toLowerCase()
    .split(" ")[0];
  const bestPrice = BEST_PRICES[genericKey] || "See prices tab";
  return { brandName, form, ingredients, isBTC, bestPrice };
}

type SlotProps = {
  label: string;
  product: CompareProduct | null;
  loading: boolean;
  onSearch: () => void;
};

function Slot({ label, product, loading, onSearch }: SlotProps) {
  if (loading) {
    return (
      <View style={[styles.slot, styles.slotFilled]}>
        <ActivityIndicator size="small" color="#185FA5" />
      </View>
    );
  }
  if (!product) {
    return (
      <TouchableOpacity
        style={styles.slot}
        onPress={onSearch}
        activeOpacity={0.7}
      >
        <Text style={styles.slotLabel}>{label}</Text>
        <Text style={styles.slotIcon}>⊕</Text>
        <Text style={styles.slotHint}>Scan or search</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={[styles.slot, styles.slotFilled]}
      onPress={onSearch}
      activeOpacity={0.8}
    >
      <Text style={styles.slotTag}>{label}</Text>
      <Text style={styles.slotName} numberOfLines={2}>
        {product.brandName}
      </Text>
      {product.form ? (
        <Text style={styles.slotForm}>{product.form}</Text>
      ) : null}
      <Text style={styles.slotChange}>Tap to change</Text>
    </TouchableOpacity>
  );
}

export default function CompareScreen() {
  const [productA, setProductA] = useState<CompareProduct | null>(null);
  const [productB, setProductB] = useState<CompareProduct | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");
  const [searchQuery, setSearchQuery] = useState("");

  const openSearch = (slot: "a" | "b") => {
    setActiveSlot(slot);
    setSearchQuery("");
    setModalVisible(true);
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setModalVisible(false);
    if (activeSlot === "a") setLoadingA(true);
    else setLoadingB(true);

    const result = await fetchProduct(searchQuery.trim());

    if (!result) {
      Alert.alert(
        "Not found",
        "Try the generic name (e.g. acetaminophen, ibuprofen, loratadine).",
      );
    } else {
      if (activeSlot === "a") setProductA(result);
      else setProductB(result);
    }
    if (activeSlot === "a") setLoadingA(false);
    else setLoadingB(false);
  };

  const reset = () => {
    setProductA(null);
    setProductB(null);
  };

  // Build comparison rows
  const bothLoaded = productA && productB;

  // Find ingredient names unique to A, unique to B, and shared
  const namesA = productA?.ingredients.map((i) => i.name.toLowerCase()) || [];
  const namesB = productB?.ingredients.map((i) => i.name.toLowerCase()) || [];
  const uniqueToA = namesA.filter((n) => !namesB.includes(n));
  const uniqueToB = namesB.filter((n) => !namesA.includes(n));
  const shared = namesA.filter((n) => namesB.includes(n));
  const hasDiff = uniqueToA.length > 0 || uniqueToB.length > 0;

  // Concentration difference check
  const concA =
    productA?.ingredients.map((i) => i.concentration).join(",") || "";
  const concB =
    productB?.ingredients.map((i) => i.concentration).join(",") || "";
  const concDiffers = bothLoaded && concA !== concB;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>
        {/* Two slots */}
        <View style={styles.slotRow}>
          <Slot
            label="Product A"
            product={productA}
            loading={loadingA}
            onSearch={() => openSearch("a")}
          />
          <Slot
            label="Product B"
            product={productB}
            loading={loadingB}
            onSearch={() => openSearch("b")}
          />
        </View>

        {/* Comparison table */}
        {bothLoaded && (
          <View>
            {/* BTC warning */}
            {(productA.isBTC || productB.isBTC) && (
              <View style={styles.alertBTC}>
                <Text style={styles.alertBTCTitle}>
                  Behind-the-counter product
                </Text>
                <Text style={styles.alertBTCText}>
                  {productA.isBTC ? productA.brandName : productB.brandName}{" "}
                  contains pseudoephedrine. Valid ID required. Purchase limits
                  apply.
                </Text>
              </View>
            )}

            {/* Concentration warning */}
            {concDiffers && (
              <View style={styles.alertWarn}>
                <Text style={styles.alertWarnText}>
                  ⚠ Different concentrations — do not swap volumes between these
                  products.
                </Text>
              </View>
            )}

            {/* Difference highlight */}
            {hasDiff && (
              <View style={styles.diffBox}>
                <Text style={styles.diffTitle}>Key differences</Text>
                {uniqueToA.length > 0 && (
                  <Text style={styles.diffLine}>
                    <Text style={styles.diffProd}>
                      {productA.brandName} only:{" "}
                    </Text>
                    {uniqueToA
                      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
                      .join(", ")}
                  </Text>
                )}
                {uniqueToB.length > 0 && (
                  <Text style={styles.diffLine}>
                    <Text style={styles.diffProd}>
                      {productB.brandName} only:{" "}
                    </Text>
                    {uniqueToB
                      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
                      .join(", ")}
                  </Text>
                )}
                {shared.length > 0 && (
                  <Text style={styles.diffLine}>
                    <Text style={styles.diffShared}>Both contain: </Text>
                    {shared
                      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
                      .join(", ")}
                  </Text>
                )}
              </View>
            )}

            {/* Side by side table */}
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHead}>
                <Text style={styles.thCell}></Text>
                <Text style={styles.thCell} numberOfLines={1}>
                  {productA.brandName}
                </Text>
                <Text style={styles.thCell} numberOfLines={1}>
                  {productB.brandName}
                </Text>
              </View>

              {/* Ingredients rows */}
              {Array.from({
                length: Math.max(
                  productA.ingredients.length,
                  productB.ingredients.length,
                ),
              }).map((_, i) => {
                const ingA = productA.ingredients[i];
                const ingB = productB.ingredients[i];
                const nameA = ingA?.name.toLowerCase() || "";
                const nameB = ingB?.name.toLowerCase() || "";
                const isUniqueA = ingA && !namesB.includes(nameA);
                const isUniqueB = ingB && !namesA.includes(nameB);
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tdLabel}>Ingredient {i + 1}</Text>
                    <Text
                      style={[styles.tdCell, isUniqueA && styles.tdUnique]}
                      numberOfLines={3}
                    >
                      {ingA ? `${ingA.name}\n${ingA.concentration}` : "—"}
                    </Text>
                    <Text
                      style={[styles.tdCell, isUniqueB && styles.tdUnique]}
                      numberOfLines={3}
                    >
                      {ingB ? `${ingB.name}\n${ingB.concentration}` : "—"}
                    </Text>
                  </View>
                );
              })}

              {/* Purpose */}
              <View style={styles.tableRow}>
                <Text style={styles.tdLabel}>Purpose</Text>
                <Text style={styles.tdCell} numberOfLines={3}>
                  {productA.ingredients
                    .map((i) => i.purpose)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
                <Text style={styles.tdCell} numberOfLines={3}>
                  {productB.ingredients
                    .map((i) => i.purpose)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
              </View>

              {/* Concentration */}
              <View style={styles.tableRow}>
                <Text style={styles.tdLabel}>Concentration</Text>
                <Text
                  style={[styles.tdCell, concDiffers && styles.tdFlag]}
                  numberOfLines={2}
                >
                  {productA.ingredients
                    .map((i) => i.concentration)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
                <Text
                  style={[styles.tdCell, concDiffers && styles.tdFlag]}
                  numberOfLines={2}
                >
                  {productB.ingredients
                    .map((i) => i.concentration)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
              </View>

              {/* BTC */}
              <View style={styles.tableRow}>
                <Text style={styles.tdLabel}>ID required</Text>
                <Text style={[styles.tdCell, productA.isBTC && styles.tdFlag]}>
                  {productA.isBTC ? "Yes" : "No"}
                </Text>
                <Text style={[styles.tdCell, productB.isBTC && styles.tdFlag]}>
                  {productB.isBTC ? "Yes" : "No"}
                </Text>
              </View>

              {/* Best price */}
              <View style={[styles.tableRow, styles.tableRowLast]}>
                <Text style={styles.tdLabel}>Best price</Text>
                <Text style={styles.tdCell}>{productA.bestPrice}</Text>
                <Text style={styles.tdCell}>{productB.bestPrice}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={reset}>
              <Text style={styles.clearBtnText}>Clear comparison</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalDismiss}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Search {activeSlot === "a" ? "Product A" : "Product B"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. acetaminophen, ibuprofen..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGray]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnGrayText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={doSearch}>
                <Text style={styles.modalBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  inner: { padding: 16 },

  slotRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  slot: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    minHeight: 110,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  slotFilled: {
    borderStyle: "solid",
    borderColor: "#bbb",
    alignItems: "flex-start",
  },
  slotLabel: { fontSize: 12, color: "#999", marginBottom: 6 },
  slotIcon: { fontSize: 28, color: "#ccc", marginBottom: 4 },
  slotHint: { fontSize: 13, color: "#999" },
  slotTag: { fontSize: 11, color: "#888", marginBottom: 4 },
  slotName: { fontSize: 14, fontWeight: "600", color: "#111", lineHeight: 20 },
  slotForm: { fontSize: 12, color: "#666", marginTop: 2 },
  slotChange: { fontSize: 11, color: "#185FA5", marginTop: 6 },

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
  alertWarnText: { fontSize: 14, color: "#633806", lineHeight: 20 },

  diffBox: {
    backgroundColor: "#E6F1FB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  diffTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0C447C",
    marginBottom: 8,
  },
  diffLine: { fontSize: 14, color: "#111", lineHeight: 22 },
  diffProd: { fontWeight: "600", color: "#185FA5" },
  diffShared: { fontWeight: "600", color: "#3B6D11" },

  table: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ddd",
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  thCell: {
    flex: 1,
    padding: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  tableRowLast: { borderBottomWidth: 0 },
  tdLabel: {
    width: 80,
    padding: 10,
    fontSize: 12,
    color: "#888",
    borderRightWidth: 0.5,
    borderRightColor: "#eee",
  },
  tdCell: {
    flex: 1,
    padding: 10,
    fontSize: 13,
    fontWeight: "500",
    color: "#111",
    borderRightWidth: 0.5,
    borderRightColor: "#eee",
  },
  tdUnique: { backgroundColor: "#E6F1FB", color: "#0C447C" },
  tdFlag: { backgroundColor: "#FAEEDA", color: "#633806" },

  clearBtn: {
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  clearBtnText: { fontSize: 14, color: "#666" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 17,
    color: "#111",
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    backgroundColor: "#185FA5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  modalBtnGray: { backgroundColor: "#f0f0f0" },
  modalBtnGrayText: { color: "#444", fontSize: 16, fontWeight: "500" },
});
