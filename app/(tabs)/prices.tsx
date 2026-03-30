import { useEffect, useState } from "react";
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

type LocalPharmacy = {
  name: string;
  address: string;
  phone: string;
  note: string;
  url: string;
  sponsored: boolean;
};

// Demo local pharmacy — replace with real partner data later
const LOCAL_PHARMACY: LocalPharmacy = {
  name: "Your Local Pharmacy",
  address: "Call for current pricing",
  phone: "",
  note: "Support your local independent pharmacy. Same ingredients, personal service.",
  url: "",
  sponsored: false,
};

const PRICE_DB: Record<string, SearchedProduct> = {
  acetaminophen: {
    genericName: "Acetaminophen",
    strength: "500 mg",
    items: [
      {
        name: "Equate Acetaminophen",
        store: "Walmart",
        count: "100 ct",
        price: 4.88,
        pricePerPill: 0.05,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+acetaminophen+500mg+100ct",
      },
      {
        name: "CVS Health Acetaminophen",
        store: "CVS",
        count: "100 ct",
        price: 6.99,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+acetaminophen+500mg",
      },
      {
        name: "Amazon Basic Care Acetaminophen",
        store: "Amazon",
        count: "100 ct",
        price: 7.49,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+acetaminophen+500mg",
      },
      {
        name: "Walgreens Acetaminophen",
        store: "Walgreens",
        count: "100 ct",
        price: 7.99,
        pricePerPill: 0.08,
        isGeneric: true,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=acetaminophen+500mg+100ct",
      },
      {
        name: "Tylenol Extra Strength",
        store: "Amazon",
        count: "100 ct",
        price: 11.47,
        pricePerPill: 0.11,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=tylenol+extra+strength+500mg+100ct",
      },
      {
        name: "Tylenol Extra Strength",
        store: "Walmart",
        count: "100 ct",
        price: 12.98,
        pricePerPill: 0.13,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=tylenol+extra+strength+500mg+100ct",
      },
      {
        name: "Tylenol Extra Strength",
        store: "CVS",
        count: "100 ct",
        price: 14.99,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=tylenol+extra+strength+500mg",
      },
      {
        name: "Tylenol Extra Strength",
        store: "Walgreens",
        count: "100 ct",
        price: 15.99,
        pricePerPill: 0.16,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=tylenol+extra+strength+500mg",
      },
    ],
  },
  ibuprofen: {
    genericName: "Ibuprofen",
    strength: "200 mg",
    items: [
      {
        name: "Equate Ibuprofen",
        store: "Walmart",
        count: "100 ct",
        price: 4.48,
        pricePerPill: 0.04,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+ibuprofen+200mg+100ct",
      },
      {
        name: "CVS Health Ibuprofen",
        store: "CVS",
        count: "100 ct",
        price: 5.99,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+ibuprofen+200mg",
      },
      {
        name: "Amazon Basic Care Ibuprofen",
        store: "Amazon",
        count: "100 ct",
        price: 6.49,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+ibuprofen+200mg",
      },
      {
        name: "Walgreens Ibuprofen",
        store: "Walgreens",
        count: "100 ct",
        price: 6.99,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=ibuprofen+200mg+100ct",
      },
      {
        name: "Advil",
        store: "Amazon",
        count: "100 ct",
        price: 10.97,
        pricePerPill: 0.11,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=advil+200mg+100ct",
      },
      {
        name: "Advil",
        store: "Walmart",
        count: "100 ct",
        price: 11.98,
        pricePerPill: 0.12,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=advil+200mg+100ct",
      },
      {
        name: "Advil",
        store: "CVS",
        count: "100 ct",
        price: 13.99,
        pricePerPill: 0.14,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=advil+200mg",
      },
      {
        name: "Advil",
        store: "Walgreens",
        count: "100 ct",
        price: 14.49,
        pricePerPill: 0.14,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=advil+200mg",
      },
    ],
  },
  loratadine: {
    genericName: "Loratadine",
    strength: "10 mg",
    items: [
      {
        name: "Equate Loratadine",
        store: "Walmart",
        count: "30 ct",
        price: 6.88,
        pricePerPill: 0.23,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+loratadine+10mg+30ct",
      },
      {
        name: "CVS Health Loratadine",
        store: "CVS",
        count: "30 ct",
        price: 7.99,
        pricePerPill: 0.27,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+loratadine+10mg",
      },
      {
        name: "Walgreens Loratadine",
        store: "Walgreens",
        count: "30 ct",
        price: 9.49,
        pricePerPill: 0.32,
        isGeneric: true,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=loratadine+10mg+30ct",
      },
      {
        name: "Amazon Basic Care Loratadine",
        store: "Amazon",
        count: "30 ct",
        price: 10.99,
        pricePerPill: 0.37,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+loratadine+10mg",
      },
      {
        name: "Claritin",
        store: "Amazon",
        count: "30 ct",
        price: 12.47,
        pricePerPill: 0.42,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=claritin+10mg+30ct",
      },
      {
        name: "Claritin",
        store: "Walmart",
        count: "30 ct",
        price: 13.88,
        pricePerPill: 0.46,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=claritin+10mg+30ct",
      },
      {
        name: "Claritin",
        store: "CVS",
        count: "30 ct",
        price: 17.49,
        pricePerPill: 0.58,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=claritin+10mg",
      },
      {
        name: "Claritin",
        store: "Walgreens",
        count: "30 ct",
        price: 18.99,
        pricePerPill: 0.63,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=claritin+10mg+30ct",
      },
    ],
  },
  cetirizine: {
    genericName: "Cetirizine",
    strength: "10 mg",
    items: [
      {
        name: "Equate Cetirizine",
        store: "Walmart",
        count: "45 ct",
        price: 7.88,
        pricePerPill: 0.18,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+cetirizine+10mg",
      },
      {
        name: "CVS Health Cetirizine",
        store: "CVS",
        count: "45 ct",
        price: 9.49,
        pricePerPill: 0.21,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+cetirizine+10mg",
      },
      {
        name: "Amazon Basic Care Cetirizine",
        store: "Amazon",
        count: "45 ct",
        price: 9.99,
        pricePerPill: 0.22,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+cetirizine+10mg",
      },
      {
        name: "Zyrtec",
        store: "Amazon",
        count: "45 ct",
        price: 19.97,
        pricePerPill: 0.44,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=zyrtec+10mg+45ct",
      },
      {
        name: "Zyrtec",
        store: "Walmart",
        count: "45 ct",
        price: 21.98,
        pricePerPill: 0.49,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=zyrtec+10mg",
      },
      {
        name: "Zyrtec",
        store: "CVS",
        count: "45 ct",
        price: 24.99,
        pricePerPill: 0.56,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=zyrtec+10mg",
      },
      {
        name: "Zyrtec",
        store: "Walgreens",
        count: "45 ct",
        price: 25.99,
        pricePerPill: 0.58,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=zyrtec+10mg",
      },
    ],
  },
  omeprazole: {
    genericName: "Omeprazole",
    strength: "20 mg",
    items: [
      {
        name: "Equate Omeprazole",
        store: "Walmart",
        count: "42 ct",
        price: 9.88,
        pricePerPill: 0.24,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+omeprazole+20mg",
      },
      {
        name: "CVS Health Omeprazole",
        store: "CVS",
        count: "42 ct",
        price: 11.99,
        pricePerPill: 0.29,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+omeprazole+20mg",
      },
      {
        name: "Amazon Basic Care Omeprazole",
        store: "Amazon",
        count: "42 ct",
        price: 12.49,
        pricePerPill: 0.3,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+omeprazole+20mg",
      },
      {
        name: "Prilosec OTC",
        store: "Amazon",
        count: "42 ct",
        price: 21.97,
        pricePerPill: 0.52,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=prilosec+otc+20mg+42ct",
      },
      {
        name: "Prilosec OTC",
        store: "Walmart",
        count: "42 ct",
        price: 22.98,
        pricePerPill: 0.55,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=prilosec+otc+20mg",
      },
      {
        name: "Prilosec OTC",
        store: "CVS",
        count: "42 ct",
        price: 25.99,
        pricePerPill: 0.62,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=prilosec+otc",
      },
      {
        name: "Prilosec OTC",
        store: "Walgreens",
        count: "42 ct",
        price: 26.99,
        pricePerPill: 0.64,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=prilosec+otc",
      },
    ],
  },
};

const ALIASES: Record<string, string> = {
  tylenol: "acetaminophen",
  advil: "ibuprofen",
  motrin: "ibuprofen",
  claritin: "loratadine",
  zyrtec: "cetirizine",
  prilosec: "omeprazole",
  nexium: "omeprazole",
};

export default function PricesScreen() {
  const { currentProduct } = useMedStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchedProduct | null>(null);

  useEffect(() => {
    if (currentProduct?.genericKey) {
      const key = currentProduct.genericKey;
      const found = PRICE_DB[key] || PRICE_DB[ALIASES[key]];
      if (found) {
        setQuery(currentProduct.brandName);
        setResult({
          ...found,
          items: [...found.items].sort((a, b) => a.price - b.price),
        });
      }
    }
  }, [currentProduct]);

  const searchPrices = () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const key = query.trim().toLowerCase();
      const resolvedKey = ALIASES[key] || key;
      const found = PRICE_DB[resolvedKey];
      if (!found) {
        Alert.alert(
          "Not found",
          "Prices not available yet.\n\nCurrently available:\n• Acetaminophen (Tylenol)\n• Ibuprofen (Advil)\n• Loratadine (Claritin)\n• Cetirizine (Zyrtec)\n• Omeprazole (Prilosec)",
        );
        setLoading(false);
        return;
      }
      setResult({
        ...found,
        items: [...found.items].sort((a, b) => a.price - b.price),
      });
      setLoading(false);
    }, 600);
  };

  const openLink = (url: string) => {
    if (!url) {
      Alert.alert(
        "Contact your local pharmacy",
        "Call your local pharmacy to ask about current pricing for this medication.",
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search drug or supplement..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchPrices}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={searchPrices}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Try brand or generic: Tylenol, acetaminophen, Claritin, ibuprofen...
        </Text>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#185FA5" />
            <Text style={styles.loadingText}>Finding best prices...</Text>
          </View>
        )}

        {result && (
          <View>
            <Text style={styles.productName}>{result.genericName}</Text>
            <Text style={styles.productStrength}>
              {result.strength} · sorted by lowest price
            </Text>

            {/* Local pharmacy slot */}
            <TouchableOpacity
              style={styles.localCard}
              onPress={() => openLink(LOCAL_PHARMACY.url)}
              activeOpacity={0.8}
            >
              <View style={styles.localLeft}>
                <View style={styles.localBadgeRow}>
                  <View style={styles.localBadge}>
                    <Text style={styles.localBadgeText}>Local pharmacy</Text>
                  </View>
                </View>
                <Text style={styles.localName}>{LOCAL_PHARMACY.name}</Text>
                <Text style={styles.localNote}>{LOCAL_PHARMACY.note}</Text>
              </View>
              <View style={styles.localRight}>
                <Text style={styles.localCTA}>Call for{"\n"}price</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.bestLabel}>Best deal online</Text>

            {result.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.priceCard, i === 0 && styles.priceCardBest]}
                onPress={() => openLink(item.url)}
                activeOpacity={0.7}
              >
                <View style={styles.pcLeft}>
                  <Text style={styles.pcName}>{item.name}</Text>
                  <Text style={styles.pcMeta}>
                    {item.count} · {item.store}
                  </Text>
                  <View
                    style={[
                      styles.tag,
                      item.isGeneric ? styles.tagGeneric : styles.tagBrand,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        item.isGeneric
                          ? styles.tagGenericText
                          : styles.tagBrandText,
                      ]}
                    >
                      {item.isGeneric ? "Generic" : "Brand name"}
                    </Text>
                  </View>
                </View>
                <View style={styles.pcRight}>
                  <Text style={[styles.pcPrice, i === 0 && styles.pcPriceBest]}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text style={styles.pcPerPill}>
                    ${item.pricePerPill.toFixed(2)} / pill
                  </Text>
                  <Text style={styles.pcArrow}>↗</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.savingsBox}>
              <View>
                <Text style={styles.savingsLabel}>Max savings</Text>
                <Text style={styles.savingsSub}>
                  cheapest vs. most expensive
                </Text>
              </View>
              <Text style={styles.savingsAmt}>${savings.toFixed(2)}</Text>
            </View>

            {/* Partner pharmacy CTA */}
            <TouchableOpacity
              style={styles.partnerCTA}
              onPress={() =>
                Alert.alert(
                  "List your pharmacy",
                  "Are you an independent pharmacy? Get listed in MedCheck and reach seniors in your area.\n\nContact us at: partners@medcheckapp.com",
                )
              }
            >
              <Text style={styles.partnerCTAText}>
                Are you a local pharmacy? Get listed here →
              </Text>
            </TouchableOpacity>
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
  productName: { fontSize: 22, fontWeight: "600", color: "#111" },
  productStrength: {
    fontSize: 13,
    color: "#888",
    marginTop: 3,
    marginBottom: 14,
  },

  localCard: {
    flexDirection: "row",
    backgroundColor: "#FFF8E7",
    borderRadius: 12,
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
    paddingVertical: 2,
  },
  localBadgeText: { fontSize: 11, fontWeight: "700", color: "#78350F" },
  localName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 3,
  },
  localNote: { fontSize: 13, color: "#666", lineHeight: 18 },
  localRight: { justifyContent: "center", alignItems: "center" },
  localCTA: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B45309",
    textAlign: "center",
    lineHeight: 18,
  },

  bestLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F6E56",
    marginBottom: 6,
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ddd",
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  priceCardBest: { borderColor: "#1D9E75", borderWidth: 1.5 },
  pcLeft: { flex: 1, minWidth: 0 },
  pcName: { fontSize: 16, fontWeight: "600", color: "#111" },
  pcMeta: { fontSize: 13, color: "#666", marginTop: 3 },
  tag: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagGeneric: { backgroundColor: "#EAF3DE" },
  tagBrand: { backgroundColor: "#E6F1FB" },
  tagText: { fontSize: 11, fontWeight: "600" },
  tagGenericText: { color: "#27500A" },
  tagBrandText: { color: "#0C447C" },
  pcRight: { alignItems: "flex-end" },
  pcPrice: { fontSize: 22, fontWeight: "600", color: "#0C447C" },
  pcPriceBest: { color: "#0F6E56" },
  pcPerPill: { fontSize: 13, color: "#666", marginTop: 2 },
  pcArrow: { fontSize: 13, color: "#185FA5", marginTop: 4 },
  savingsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ddd",
    padding: 14,
    marginTop: 4,
  },
  savingsLabel: { fontSize: 14, fontWeight: "600", color: "#111" },
  savingsSub: { fontSize: 12, color: "#888", marginTop: 2 },
  savingsAmt: { fontSize: 26, fontWeight: "600", color: "#0C447C" },

  partnerCTA: { marginTop: 14, padding: 14, alignItems: "center" },
  partnerCTAText: { fontSize: 13, color: "#185FA5", fontWeight: "500" },
});
