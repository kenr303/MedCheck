import { StyleSheet, Text, View } from "react-native";

export default function CompareScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Compare coming next!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  text: { fontSize: 18, color: "#666" },
});
