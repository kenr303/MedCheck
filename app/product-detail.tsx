import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useMedStore } from "../store/useMedStore";

type FullDetail = {
  brandName: string;
  genericName: string;
  manufacturer: string;
  form: string;
  ingredients: { name: string; concentration: string; purpose: string }[];
  dosage: string;
  warnings: string;
  sideEffects: string;
  storage: string;
  pregnancy: string;
  interactions: string;
  isBTC: boolean;
};

function clean(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").replace(/•/g, "\n• ").trim();
}

function truncate(text: string, max = 600): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { currentProduct } = useMedStore();
  const [detail, setDetail] = useState<FullDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProduct) {
      setLoading(false);
      return;
    }
    fetchFull(currentProduct.brandName);
  }, []);

  const fetchFull = async (name: string) => {
    setLoading(true);
    const q = encodeURIComponent(name.trim());
    const urls = [
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${q}&limit=1`,
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${q}&limit=1`,
      `https://api.fda.gov/drug/label.json?search=${q}&limit=1`,
    ];
    let r: any = null;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.results?.length > 0) {
          r = data.results[0];
          break;
        }
      } catch {
        continue;
      }
    }

    if (!r) {
      setLoading(false);
      return;
    }

    const rawIngredients: string[] =
      r.active_ingredient || r.active_ingredients || [];
    const purposeList: string[] = (r.purpose || []).map((p: string) =>
      p.replace(/^purpose\s*/i, "").trim(),
    );
    const ingredients = rawIngredients.map((ing: string, i: number) => {
      const match = ing
        .replace(
          /active\s+ingredient[s]?\s*(\(in\s+each\s+[\w\s]+\))?\s*/gi,
          "",
        )
        .replace(/each\s+[\w\s]+\s+contains\s*/gi, "")
        .trim()
        .match(
          /([\d.]+\s*(?:mg|mcg|mL|g|%|IU|units?)(?:\s*\/\s*[\w.]+)?)\s*$/i,
        );
      const raw = ing
        .replace(
          /active\s+ingredient[s]?\s*(\(in\s+each\s+[\w\s]+\))?\s*/gi,
          "",
        )
        .trim();
      return {
        name: match ? raw.slice(0, raw.lastIndexOf(match[0])).trim() : raw,
        concentration: match ? match[0].trim() : "",
        purpose: purposeList[i] || purposeList[0] || "",
      };
    });

    setDetail({
      brandName: r.openfda?.brand_name?.[0] || r.brand_name?.[0] || name,
      genericName: r.openfda?.generic_name?.[0] || "",
      manufacturer:
        r.openfda?.manufacturer_name?.[0] || r.manufacturer_name?.[0] || "",
      form: r.dosage_form?.[0] || "",
      ingredients,
      dosage: truncate(clean(r.dosage_and_administration?.[0])),
      warnings: truncate(clean(r.warnings?.[0] || r.boxed_warning?.[0])),
      sideEffects: truncate(clean(r.adverse_reactions?.[0])),
      storage: truncate(clean(r.storage_and_handling?.[0]), 300),
      pregnancy: truncate(
        clean(r.pregnancy?.[0] || r.teratogenic_effects?.[0]),
        300,
      ),
      interactions: truncate(clean(r.drug_interactions?.[0]), 400),
      isBTC: JSON.stringify(r).toLowerCase().includes("pseudoephedrine"),
    });
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentProduct?.brandName || "Product details"}
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#185FA5" />
          <Text style={styles.loadingText}>Loading full details...</Text>
        </View>
      )}

      {!loading && !detail && (
        <View style={styles.loadingWrap}>
          <Text style={styles.noData}>
            Full details not available for this product.
          </Text>
        </View>
      )}

      {!loading && detail && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.productName}>{detail.brandName}</Text>
          {detail.genericName ? (
            <Text style={styles.genericName}>{detail.genericName}</Text>
          ) : null}
          {detail.manufacturer ? (
            <Text style={styles.manufacturer}>{detail.manufacturer}</Text>
          ) : null}
          {detail.form ? <Text style={styles.form}>{detail.form}</Text> : null}

          {detail.isBTC && (
            <View style={styles.alertBTC}>
              <Text style={styles.alertBTCTitle}>
                Behind-the-counter product
              </Text>
              <Text style={styles.alertBTCText}>
                Valid photo ID required. Federal purchase limit applies (max
                3.6g/day, 9g/30 days).
              </Text>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active ingredients</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderLeft}>Ingredient</Text>
                <Text style={styles.cardHeaderRight}>Purpose</Text>
              </View>
              {detail.ingredients.map((ing, i) => (
                <View
                  key={i}
                  style={[
                    styles.ingrRow,
                    i === detail.ingredients.length - 1 && styles.ingrRowLast,
                  ]}
                >
                  <View style={styles.ingrLeft}>
                    <Text style={styles.ingrNum}>{i + 1}.</Text>
                    <View style={styles.ingrNameWrap}>
                      <Text style={styles.ingrName}>{ing.name}</Text>
                      {ing.concentration ? (
                        <Text style={styles.ingrConc}>{ing.concentration}</Text>
                      ) : null}
                    </View>
                  </View>
                  {ing.purpose ? (
                    <Text style={styles.ingrPurpose}>{ing.purpose}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          {/* Dosage */}
          {detail.dosage ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dosage & directions</Text>
              <View style={styles.textCard}>
                <Text style={styles.textBody}>{detail.dosage}</Text>
              </View>
            </View>
          ) : null}

          {/* Warnings */}
          {detail.warnings ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Warnings</Text>
              <View style={[styles.textCard, styles.textCardWarn]}>
                <Text style={styles.textBodyWarn}>{detail.warnings}</Text>
              </View>
            </View>
          ) : null}

          {/* Side effects */}
          {detail.sideEffects ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Possible side effects</Text>
              <View style={styles.textCard}>
                <Text style={styles.textBody}>{detail.sideEffects}</Text>
              </View>
            </View>
          ) : null}

          {/* Drug interactions */}
          {detail.interactions ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Drug interactions</Text>
              <View style={[styles.textCard, styles.textCardWarn]}>
                <Text style={styles.textBodyWarn}>{detail.interactions}</Text>
              </View>
            </View>
          ) : null}

          {/* Pregnancy */}
          {detail.pregnancy ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pregnancy & breastfeeding</Text>
              <View style={styles.textCard}>
                <Text style={styles.textBody}>{detail.pregnancy}</Text>
              </View>
            </View>
          ) : null}

          {/* Storage */}
          {detail.storage ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Storage</Text>
              <View style={styles.textCard}>
                <Text style={styles.textBody}>{detail.storage}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Information sourced from FDA drug labels. Always consult your
              pharmacist or doctor before taking any medication.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#0C447C",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtnText: { color: "#E6F1FB", fontSize: 14, fontWeight: "500" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "500", color: "#E6F1FB" },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 15, color: "#666" },
  noData: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  productName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111",
    lineHeight: 30,
    textTransform: "capitalize",
  },
  genericName: {
    fontSize: 15,
    color: "#555",
    marginTop: 3,
    textTransform: "capitalize",
  },
  manufacturer: { fontSize: 14, color: "#888", marginTop: 2 },
  form: {
    fontSize: 13,
    color: "#888",
    marginTop: 1,
    marginBottom: 14,
    textTransform: "capitalize",
  },
  alertBTC: {
    backgroundColor: "#FCEBEB",
    borderLeftWidth: 3,
    borderLeftColor: "#E24B4A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertBTCTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#501313",
    marginBottom: 4,
  },
  alertBTCText: { fontSize: 14, color: "#501313", lineHeight: 20 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ddd",
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
    letterSpacing: 0.4,
  },
  cardHeaderRight: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
    fontSize: 15,
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
  textCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ddd",
    padding: 14,
  },
  textCardWarn: { backgroundColor: "#FFFBF0", borderColor: "#fcd34d" },
  textBody: { fontSize: 15, color: "#333", lineHeight: 24 },
  textBodyWarn: { fontSize: 15, color: "#444", lineHeight: 24 },
  disclaimer: {
    marginTop: 8,
    padding: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
    textAlign: "center",
  },
});
