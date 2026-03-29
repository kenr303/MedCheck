import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#185FA5",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e0e0e0",
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: "#0C447C",
        },
        headerTintColor: "#E6F1FB",
        headerTitleStyle: {
          fontWeight: "500",
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Lookup",
          headerTitle: "MedCheck",
        }}
      />
      <Tabs.Screen
        name="prices"
        options={{
          title: "Prices",
          headerTitle: "MedCheck",
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: "Compare",
          headerTitle: "MedCheck",
        }}
      />
    </Tabs>
  );
}
