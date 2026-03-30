import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="product-detail"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="privacy"
        options={{ headerShown: false, presentation: "card" }}
      />
    </Stack>
  );
}
