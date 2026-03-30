import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: March 2026</Text>

        <Text style={styles.intro}>
          MedCheck is designed with your privacy in mind. We do not collect,
          store, or share your personal information.
        </Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>The short version</Text>
          <Text style={styles.highlightText}>
            We do not collect your name, location, health data, or any personal
            information. Everything you search stays on your device.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What we do NOT collect</Text>
        {[
          "Your name or identity",
          "Your location",
          "Your search history",
          "Your health or medication information",
          "Your device information",
          "Any personal data of any kind",
        ].map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>✕</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>How the app works</Text>
        <Text style={styles.body}>
          When you search for a drug or supplement, MedCheck sends your search
          term directly to publicly available government databases (the FDA and
          NIH). Your search is not stored anywhere — not on our servers, not on
          your device history, and not shared with any third party.
        </Text>
        <Text style={styles.body}>
          When you tap a price link, you are taken to a retailer's website (such
          as Walmart, CVS, or Amazon). Those websites have their own privacy
          policies. MedCheck may earn a small affiliate commission if you make a
          purchase, but we do not receive any information about you from those
          retailers.
        </Text>

        <Text style={styles.sectionTitle}>Data sources</Text>
        <Text style={styles.body}>
          Drug and supplement information is sourced from:
        </Text>
        {[
          "U.S. Food & Drug Administration (FDA) — api.fda.gov",
          "National Institutes of Health — Dietary Supplement Label Database (DSLD)",
        ].map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletBlue}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
        <Text style={styles.body}>
          These are free, publicly available government databases. MedCheck does
          not modify this information.
        </Text>

        <Text style={styles.sectionTitle}>Children's privacy</Text>
        <Text style={styles.body}>
          MedCheck is intended for adults. We do not knowingly collect any
          information from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>Changes to this policy</Text>
        <Text style={styles.body}>
          If we ever change this privacy policy, we will update the date at the
          top of this page. We will never introduce data collection without
          clearly notifying you first.
        </Text>

        <Text style={styles.sectionTitle}>Contact us</Text>
        <Text style={styles.body}>
          If you have any questions about this privacy policy, please contact us
          at:
        </Text>
        <Text style={styles.email}>support@medcheckapp.com</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MedCheck is not a substitute for professional medical advice. Always
            consult your doctor or pharmacist before taking any medication.
          </Text>
        </View>
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  updated: { fontSize: 13, color: "#999", marginBottom: 14 },
  intro: {
    fontSize: 17,
    color: "#111",
    lineHeight: 26,
    marginBottom: 20,
    fontWeight: "500",
  },
  highlightBox: {
    backgroundColor: "#E6F1FB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#185FA5",
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0C447C",
    marginBottom: 6,
  },
  highlightText: { fontSize: 15, color: "#0C447C", lineHeight: 22 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginTop: 24,
    marginBottom: 10,
  },
  body: { fontSize: 15, color: "#333", lineHeight: 24, marginBottom: 12 },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bullet: { fontSize: 13, color: "#E24B4A", fontWeight: "700", marginTop: 3 },
  bulletBlue: { fontSize: 16, color: "#185FA5", marginTop: 1 },
  bulletText: { fontSize: 15, color: "#333", lineHeight: 22, flex: 1 },
  email: {
    fontSize: 15,
    color: "#185FA5",
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 24,
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  footerText: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
    textAlign: "center",
  },
});
