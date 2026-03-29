import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (upc: string) => void;
};

export default function BarcodeScanner({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasScanned = useRef(false);

  useEffect(() => {
    if (visible) hasScanned.current = false;
  }, [visible]);

  const handleBarcode = ({ data }: { data: string }) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    onScanned(data);
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permBox}>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permText}>
            MedCheck needs camera access to scan barcodes on product boxes.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow camera access</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["upc_a", "upc_e", "ean13", "ean8"],
          }}
          onBarcodeScanned={handleBarcode}
        />
        <View style={styles.overlay}>
          <View style={styles.topDark} />
          <View style={styles.middleRow}>
            <View style={styles.sideDark} />
            <View style={styles.scanWindow}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.sideDark} />
          </View>
          <View style={styles.bottomDark}>
            <Text style={styles.scanHint}>
              Point camera at the barcode on the product box
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const WINDOW = 260;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f5f5f5",
  },
  permTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
    textAlign: "center",
  },
  permText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  permBtn: {
    backgroundColor: "#185FA5",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  permBtnText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  cancelBtn: { paddingVertical: 12 },
  cancelBtnText: { color: "#666", fontSize: 15 },
  overlay: { flex: 1 },
  topDark: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  middleRow: { flexDirection: "row", height: WINDOW },
  sideDark: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  scanWindow: { width: WINDOW, height: WINDOW },
  bottomDark: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  scanHint: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  closeBtnText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#fff",
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
});
