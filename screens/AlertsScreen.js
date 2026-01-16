import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const initial = [
  { id: "A1", title: "Payment reminder", body: "Invoice #INV-238 due today", read: false },
  { id: "A2", title: "New lead assigned", body: "Priya → You", read: false },
  { id: "A3", title: "Follow-up due", body: "Rahul at 5 PM", read: true },
];

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState(initial);
  const nav = useNavigation();

  const unread = useMemo(() => alerts.filter(a => !a.read).length, [alerts]);

  useEffect(() => {
    // set tab badge for this screen
    nav.setOptions({ tabBarBadge: unread || undefined });
  }, [unread, nav]);

  const toggle = (id) => {
    setAlerts((old) => old.map(a => (a.id === id ? { ...a, read: !a.read } : a)));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Alerts</Text>
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggle(item.id)}
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              backgroundColor: item.read ? "#f8fafc" : "#eff6ff",
              padding: 14,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Ionicons
              name={item.read ? "notifications-outline" : "notifications"}
              size={22}
              color={item.read ? "#64748b" : "#0ea5e9"}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700" }}>{item.title}</Text>
              <Text style={{ color: "#64748b", marginTop: 2 }}>{item.body}</Text>
            </View>
            <Text style={{ color: item.read ? "#94a3b8" : "#0ea5e9", fontWeight: "700" }}>
              {item.read ? "Read" : "New"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
