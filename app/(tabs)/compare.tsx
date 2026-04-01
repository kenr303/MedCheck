import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
import BarcodeScanner from "../../components/BarcodeScanner";
import { lookupByUPC, lookupProduct } from "../../store/lookup";
import { COLOR, FONT, RADIUS, SPACE } from "../../store/theme";
import { MedProduct, useMedStore } from "../../store/useMedStore";

type SlotProps = {
  label: string;
  product: MedProduct | null;
  loading: boolean;
  onSearch: () => void;
};

function Slot({ label, product, loading, onSearch }: SlotProps) {
  if (loading)
    return (
      <TouchableOpacity style={[S.slot, S.slotFilled]} activeOpacity={1}>
        <ActivityIndicator size="small" color={COLOR.primaryMid} />
      </TouchableOpacity>
    );
  if (!product)
    return (
      <TouchableOpacity style={S.slot} onPress={onSearch} activeOpacity={0.7}>
        <Text style={S.slotLabel}>{label}</Text>
        <Text style={S.slotIcon}>＋</Text>
        <Text style={S.slotHint}>Scan or search</Text>
      </TouchableOpacity>
    );
  return (
    <TouchableOpacity
      style={[S.slot, S.slotFilled]}
      onPress={onSearch}
      activeOpacity={0.8}
    >
      <Text style={S.slotTag}>{label}</Text>
      <Text style={S.slotName} numberOfLines={2}>
        {product.brandName}
      </Text>
      {product.form ? <Text style={S.slotForm}>{product.form}</Text> : null}
      <Text style={S.slotChange}>Tap to change</Text>
    </TouchableOpacity>
  );
}

export default function CompareScreen() {
  const { compareA, compareB, setCompareA, setCompareB, clearCompare } =
    useMedStore();
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const openSearch = (slot: "a" | "b") => {
    setActiveSlot(slot);
    setSearchQuery("");
    setErrorMsg("");
    setModalVisible(true);
  };

  const finishSlotLookup = (product: MedProduct | null) => {
    if (!product) {
      setErrorMsg("Not found — try the generic name (e.g. acetaminophen, ibuprofen).");
    } else {
      setErrorMsg("");
      if (activeSlot === "a") setCompareA(product);
      else setCompareB(product);
    }
    if (activeSlot === "a") setLoadingA(false);
    else setLoadingB(false);
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setModalVisible(false);
    if (activeSlot === "a") setLoadingA(true);
    else setLoadingB(true);
    const result = await lookupProduct(searchQuery.trim());
    finishSlotLookup(result?.product || null);
  };

  const handleScanInCompare = async (upc: string) => {
    setScannerOpen(false);
    setModalVisible(false);
    if (activeSlot === "a") setLoadingA(true);
    else setLoadingB(true);
    const result = await lookupByUPC(upc);
    finishSlotLookup(result);
  };

  const bothLoaded = compareA && compareB;
  const namesA = compareA?.ingredients.map((i) => i.name.toLowerCase()) || [];
  const namesB = compareB?.ingredients.map((i) => i.name.toLowerCase()) || [];
  const uniqueToA = namesA.filter((n) => !namesB.includes(n));
  const uniqueToB = namesB.filter((n) => !namesA.includes(n));
  const shared = namesA.filter((n) => namesB.includes(n));
  const hasDiff = uniqueToA.length > 0 || uniqueToB.length > 0;
  const concA =
    compareA?.ingredients.map((i) => i.concentration).join(",") || "";
  const concB =
    compareB?.ingredients.map((i) => i.concentration).join(",") || "";
  const concDiffers = bothLoaded && concA !== concB;

  return (
    <ScrollView style={S.container} keyboardShouldPersistTaps="handled">
      <View style={S.inner}>
        <View style={S.slotRow}>
          <Slot
            label="Product A"
            product={compareA}
            loading={loadingA}
            onSearch={() => openSearch("a")}
          />
          <Slot
            label="Product B"
            product={compareB}
            loading={loadingB}
            onSearch={() => openSearch("b")}
          />
        </View>

        {!bothLoaded && (
          <View style={S.emptyHint}>
            <Text style={S.emptyHintText}>
              Tap a slot to search, or find a product in the Lookup tab and tap
              &quot;Add to compare&quot;.
            </Text>
          </View>
        )}

        {bothLoaded && (
          <View>
            {(compareA.isBTC || compareB.isBTC) && (
              <View style={S.alertBTC}>
                <Text style={S.alertBTCTitle}>Behind-the-counter product</Text>
                <Text style={S.alertBTCText}>
                  {compareA.isBTC && compareB.isBTC
                    ? `${compareA.brandName} and ${compareB.brandName} both contain`
                    : `${compareA.isBTC ? compareA.brandName : compareB.brandName} contains`}{" "}
                  pseudoephedrine. Valid ID required. Purchase limits apply.
                </Text>
              </View>
            )}

            {concDiffers && (
              <View style={S.alertWarn}>
                <Text style={S.alertWarnText}>
                  ⚠ Different concentrations — do not swap volumes between these
                  products.
                </Text>
              </View>
            )}

            {hasDiff && (
              <View style={S.diffBox}>
                <Text style={S.diffTitle}>Key differences</Text>
                {uniqueToA.length > 0 && (
                  <Text style={S.diffLine}>
                    <Text style={S.diffProd}>{compareA.brandName} only: </Text>
                    {uniqueToA
                      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
                      .join(", ")}
                  </Text>
                )}
                {uniqueToB.length > 0 && (
                  <Text style={S.diffLine}>
                    <Text style={S.diffProd}>{compareB.brandName} only: </Text>
                    {uniqueToB
                      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
                      .join(", ")}
                  </Text>
                )}
                {shared.length > 0 && (
                  <Text style={S.diffLine}>
                    <Text style={S.diffShared}>Both contain: </Text>
                    {shared
                      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
                      .join(", ")}
                  </Text>
                )}
              </View>
            )}

            <View style={S.table}>
              <View style={S.tableHead}>
                <Text style={S.thCell}></Text>
                <Text style={S.thCell} numberOfLines={1}>
                  {compareA.brandName}
                </Text>
                <Text style={S.thCell} numberOfLines={1}>
                  {compareB.brandName}
                </Text>
              </View>

              {Array.from({
                length: Math.max(
                  compareA.ingredients.length,
                  compareB.ingredients.length,
                ),
              }).map((_, i) => {
                const ingA = compareA.ingredients[i];
                const ingB = compareB.ingredients[i];
                const isUniqueA =
                  ingA && !namesB.includes(ingA.name.toLowerCase());
                const isUniqueB =
                  ingB && !namesA.includes(ingB.name.toLowerCase());
                return (
                  <View key={i} style={S.tableRow}>
                    <Text style={S.tdLabel}>Ingredient {i + 1}</Text>
                    <Text
                      style={[S.tdCell, isUniqueA && S.tdUnique]}
                      numberOfLines={3}
                    >
                      {ingA ? `${ingA.name}\n${ingA.concentration}` : "—"}
                    </Text>
                    <Text
                      style={[S.tdCell, isUniqueB && S.tdUnique]}
                      numberOfLines={3}
                    >
                      {ingB ? `${ingB.name}\n${ingB.concentration}` : "—"}
                    </Text>
                  </View>
                );
              })}

              <View style={S.tableRow}>
                <Text style={S.tdLabel}>Purpose</Text>
                <Text style={S.tdCell} numberOfLines={3}>
                  {compareA.ingredients
                    .map((i) => i.purpose)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
                <Text style={S.tdCell} numberOfLines={3}>
                  {compareB.ingredients
                    .map((i) => i.purpose)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
              </View>

              <View style={S.tableRow}>
                <Text style={S.tdLabel}>Concentration</Text>
                <Text
                  style={[S.tdCell, concDiffers && S.tdFlag]}
                  numberOfLines={2}
                >
                  {compareA.ingredients
                    .map((i) => i.concentration)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
                <Text
                  style={[S.tdCell, concDiffers && S.tdFlag]}
                  numberOfLines={2}
                >
                  {compareB.ingredients
                    .map((i) => i.concentration)
                    .filter(Boolean)
                    .join("\n") || "—"}
                </Text>
              </View>

              <View style={S.tableRow}>
                <Text style={S.tdLabel}>ID required</Text>
                <Text style={[S.tdCell, compareA.isBTC && S.tdFlag]}>
                  {compareA.isBTC ? "Yes" : "No"}
                </Text>
                <Text style={[S.tdCell, compareB.isBTC && S.tdFlag]}>
                  {compareB.isBTC ? "Yes" : "No"}
                </Text>
              </View>

              <View style={[S.tableRow, S.tableRowLast]}>
                <Text style={S.tdLabel}>Best price</Text>
                <Text style={S.tdCell}>
                  {compareA.bestPrice || "—"}
                </Text>
                <Text style={S.tdCell}>
                  {compareB.bestPrice || "—"}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={S.clearBtn} onPress={clearCompare}>
              <Text style={S.clearBtnText}>Clear comparison</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {errorMsg ? (
        <View style={S.errorBanner}>
          <Text style={S.errorBannerText}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => setErrorMsg("")}>
            <Text style={S.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={S.modalOverlay}
        >
          <TouchableOpacity
            style={S.modalDismiss}
            onPress={() => setModalVisible(false)}
          />
          <View style={S.modalBox}>
            <Text style={S.modalTitle}>
              Search {activeSlot === "a" ? "Product A" : "Product B"}
            </Text>
            <TextInput
              style={S.modalInput}
              placeholder="e.g. acetaminophen, ibuprofen..."
              placeholderTextColor={COLOR.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
            />
            <View style={S.modalBtns}>
              <TouchableOpacity
                style={[S.modalBtn, S.modalBtnScan]}
                onPress={() => {
                  setModalVisible(false);
                  setScannerOpen(true);
                }}
              >
                <Text style={S.modalBtnScanText}>Scan barcode</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.modalBtn} onPress={doSearch}>
                <Text style={S.modalBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={S.modalCancel}
              onPress={() => setModalVisible(false)}
            >
              <Text style={S.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BarcodeScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleScanInCompare}
      />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.bg },
  inner: { padding: SPACE.md },
  slotRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.md },
  slot: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
    backgroundColor: COLOR.white,
  },
  slotFilled: {
    borderStyle: "solid",
    borderColor: "#bbb",
    alignItems: "flex-start",
  },
  slotLabel: { fontSize: FONT.sm, color: COLOR.textMuted, marginBottom: 8 },
  slotIcon: { fontSize: 32, color: "#ccc", marginBottom: 6 },
  slotHint: { fontSize: FONT.sm, color: COLOR.textMuted },
  slotTag: { fontSize: FONT.xs, color: COLOR.textMuted, marginBottom: 5 },
  slotName: {
    fontSize: FONT.md,
    fontWeight: "600",
    color: COLOR.text,
    lineHeight: 22,
  },
  slotForm: { fontSize: FONT.xs, color: COLOR.textSub, marginTop: 3 },
  slotChange: { fontSize: FONT.xs, color: COLOR.primaryMid, marginTop: 8 },
  emptyHint: {
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    padding: 20,
    borderWidth: 0.5,
    borderColor: COLOR.border,
  },
  emptyHintText: {
    fontSize: FONT.md,
    color: COLOR.textSub,
    lineHeight: 24,
    textAlign: "center",
  },
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
  alertWarnText: { fontSize: FONT.md, color: COLOR.warning, lineHeight: 22 },
  diffBox: {
    backgroundColor: COLOR.primaryLight,
    borderRadius: RADIUS.sm,
    padding: 16,
    marginBottom: 14,
  },
  diffTitle: {
    fontSize: FONT.md,
    fontWeight: "600",
    color: COLOR.primary,
    marginBottom: 10,
  },
  diffLine: { fontSize: FONT.md, color: COLOR.text, lineHeight: 24 },
  diffProd: { fontWeight: "600", color: COLOR.primaryMid },
  diffShared: { fontWeight: "600", color: "#3B6D11" },
  table: {
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
  },
  thCell: {
    flex: 1,
    padding: 12,
    fontSize: FONT.xs,
    fontWeight: "600",
    color: COLOR.textSub,
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
    width: 88,
    padding: 12,
    fontSize: FONT.xs,
    color: COLOR.textMuted,
    borderRightWidth: 0.5,
    borderRightColor: "#eee",
  },
  tdCell: {
    flex: 1,
    padding: 12,
    fontSize: FONT.sm,
    fontWeight: "500",
    color: COLOR.text,
    borderRightWidth: 0.5,
    borderRightColor: "#eee",
  },
  tdUnique: { backgroundColor: COLOR.primaryLight, color: COLOR.primary },
  tdFlag: { backgroundColor: COLOR.warningLight, color: COLOR.warning },
  clearBtn: {
    borderWidth: 0.5,
    borderColor: COLOR.border,
    borderRadius: RADIUS.sm,
    padding: 16,
    alignItems: "center",
    backgroundColor: COLOR.white,
  },
  clearBtnText: { fontSize: FONT.md, color: COLOR.textSub },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: { flex: 1 },
  modalBox: {
    backgroundColor: COLOR.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: FONT.lg,
    fontWeight: "600",
    color: COLOR.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLOR.bg,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FONT.md,
    color: COLOR.text,
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    backgroundColor: COLOR.primaryMid,
    borderRadius: RADIUS.sm,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalBtnText: { color: COLOR.white, fontSize: FONT.md, fontWeight: "500" },
  modalBtnScan: { backgroundColor: "#333" },
  modalBtnScanText: { color: COLOR.white, fontSize: FONT.md, fontWeight: "500" },
  modalCancel: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 6,
  },
  modalCancelText: { color: COLOR.textMuted, fontSize: FONT.md },
  errorBanner: {
    backgroundColor: COLOR.dangerLight,
    borderRadius: RADIUS.sm,
    padding: 14,
    marginHorizontal: SPACE.md,
    marginBottom: SPACE.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorBannerText: {
    fontSize: FONT.sm,
    color: COLOR.danger,
    flex: 1,
    marginRight: 10,
  },
  errorDismiss: {
    fontSize: FONT.sm,
    color: COLOR.danger,
    fontWeight: "600",
  },
});
