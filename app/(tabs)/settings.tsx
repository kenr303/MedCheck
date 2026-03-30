import { useRouter } from "expo-router";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type RowProps = {
  label: string;
  sub?: string;
  onPress: () => void;
  arrow?: boolean;
};

function Row({ label, sub, onPress, arrow = true }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {arrow && <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>MedCheck</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDesc}>
            OTC drug & supplement checker for smarter, more affordable
            healthcare decisions.
          </Text>
        </View>

        <Text style={styles.groupLabel}>About</Text>
        <View style={styles.group}>
          <Row
            label="Privacy Policy"
            sub="How we protect your data"
            onPress={() => router.push("/privacy")}
          />
          <Row
            label="Data sources"
            sub="FDA, NIH DSLD"
            onPress={() =>
              Alert.alert(
                "Data sources",
                "Drug information is sourced from the U.S. Food & Drug Administration (OpenFDA).\n\nSupplement information is sourced from the NIH Dietary Supplement Label Database (DSLD).\n\nPrices are updated regularly from major retailers.",
              )
            }
          />
          <Row
            label="Disclaimer"
            sub="Medical information notice"
            onPress={() =>
              Alert.alert(
                "Medical disclaimer",
                "MedCheck provides general drug and supplement information for educational purposes only. This app is not a substitute for professional medical advice, diagnosis, or treatment.\n\nAlways consult your doctor or pharmacist before taking any medication or supplement.",
              )
            }
          />
        </View>

        <Text style={styles.groupLabel}>Support</Text>
        <View style={styles.group}>
          <Row
            label="Contact us"
            sub="support@medcheckapp.com"
            onPress={() => Linking.openURL("mailto:support@medcheckapp.com")}
          />
          <Row
            label="Rate MedCheck"
            sub="Help others find this app"
            onPress={() =>
              Alert.alert(
                "Thank you!",
                "App Store rating coming soon once we launch.",
              )
            }
          />
        </View>

        <Text style={styles.groupLabel}>Data</Text>
        <View style={styles.group}>
          <Row
            label="No data collected"
            sub="Your searches stay on your device"
            onPress={() => {}}
            arrow={false}
          />
        </View>

        <Text style={styles.legal}>
          MedCheck is not affiliated with any pharmacy, drug manufacturer, or
          government agency. Drug and supplement information may not be complete
          or up to date. Always read the full product label.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  inner: { padding: 16, paddingBottom: 48 },
  appInfo: {
    alignItems: "center",
    paddingVertical: 28,
  },
  appName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0C447C",
    letterSpacing: 0.5,
  },
  appVersion: { fontSize: 13, color: "#999", marginTop: 4, marginBottom: 10 },
  appDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 16, color: "#111", fontWeight: "500" },
  rowSub: { fontSize: 13, color: "#888", marginTop: 2 },
  rowArrow: { fontSize: 20, color: "#ccc", marginLeft: 8 },
  legal: {
    fontSize: 12,
    color: "#aaa",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 28,
    paddingHorizontal: 8,
  },
});
