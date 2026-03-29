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

type Ingredient = {
  name: string;
  concentration: string;
  purpose: string;
};

type Product = {
  brandName: string;
  manufacturer: string;
  form: string;
  ingredients: Ingredient[];
  servingSizeAlert: string | null;
  isBTC: boolean;
};

function cleanIngredientName(raw: string): {
  name: string;
  concentration: string;
} {
  // Remove common prefixes like "Active ingredient (in each caplet)", "Each tablet contains", etc.
  let s = raw
    .replace(/active\s+ingredient[s]?\s*(\(in\s+each\s+[\w\s]+\))?\s*/gi, "")
    .replace(/each\s+[\w\s]+\s+contains\s*/gi, "")
    .replace(/^\s*[:;-]\s*/g, "")
    .trim();

  // Extract concentration: number + unit at end, e.g. "500 mg" or "10mg/5mL"
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

export default function LookupScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const searchProduct = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setProduct(null);

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

    if (!result) {
      Alert.alert(
        "Not found",
        "Try the generic name instead.\n\nExamples:\n• Tylenol → acetaminophen\n• Advil → ibuprofen\n• Claritin → loratadine\n• Zyrtec → cetirizine\n• Nexium → omeprazole",
      );
      setLoading(false);
      return;
    }

    const r = result;
    const ingredients = parseIngredients(r);
    const form = (r.dosage_form?.[0] || "").toLowerCase();
    const brandName =
      r.openfda?.brand_name?.[0] ||
      r.brand_name?.[0] ||
      r.openfda?.generic_name?.[0] ||
      query;
    const manufacturer =
      r.openfda?.manufacturer_name?.[0] || r.manufacturer_name?.[0] || "";

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

    setProduct({
      brandName,
      manufacturer,
      form,
      ingredients,
      servingSizeAlert,
      isBTC,
    });
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search drug or supplement..."
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
          Try: acetaminophen, ibuprofen, loratadine, cetirizine, omeprazole
        </Text>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#185FA5" />
            <Text style={styles.loadingText}>Searching FDA database...</Text>
          </View>
        )}

        {product && (
          <View>
            <Text style={styles.productName}>{product.brandName}</Text>
            {product.form ? (
              <Text style={styles.productForm}>{product.form}</Text>
            ) : null}
            {product.manufacturer ? (
              <Text style={styles.manufacturer}>{product.manufacturer}</Text>
            ) : null}

            {product.isBTC && (
              <View style={styles.alertBTC}>
                <Text style={styles.alertBTCTitle}>
                  Behind-the-counter product
                </Text>
                <Text style={styles.alertBTCText}>
                  Valid photo ID required at pharmacy. Federal purchase limit
                  applies (max 3.6g/day, 9g/30 days).
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
                  <Text style={styles.cardHeaderLeft}>Active ingredients</Text>
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
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>See prices</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  inner: { padding: 16 },
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
