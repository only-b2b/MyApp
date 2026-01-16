// screens/LeadsScreen.js
import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, FlatList, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLeads } from "../store/LeadsContext";
import { useNavigation } from "@react-navigation/native";

export default function LeadsScreen() {
  const { leads } = useLeads();
  const navigation = useNavigation();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return leads.filter((l) => {
      const matchQ =
        !ql ||
        l.name?.toLowerCase().includes(ql) ||
        l.city?.toLowerCase().includes(ql) ||
        l.id?.toLowerCase().includes(ql) ||
        l.phone?.toLowerCase().includes(ql);
      const matchStatus = status === "All" || l.status === status;
      return matchQ && matchStatus;
    });
  }, [q, status, leads]);

  const statuses = ["All", "New", "In Progress", "Closed"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Leads</Text>

        {/* Search */}
        <View
          style={{
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            paddingHorizontal: 12,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <TextInput
            style={{ flex: 1, height: 44, marginLeft: 8 }}
            placeholder="Search by name, ID, city, phone"
            value={q}
            onChangeText={setQ}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status chips */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {statuses.map((s) => {
            const active = s === status;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? "#e0f2fe" : "#f1f5f9",
                  borderWidth: 1,
                  borderColor: active ? "#7dd3fc" : "#e2e8f0",
                }}
              >
                <Text style={{ color: active ? "#0ea5e9" : "#475569", fontWeight: "600" }}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
           activeOpacity={0.9}
           onPress={() => navigation.navigate("LeadDetail", { lead: item })}
            
           style={{
              borderRadius: 14,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontWeight: "700" }}>{item.name}</Text>
              <Text style={{ color: "#64748b" }}>{item.id}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#475569" }}>{item.city}</Text>
              <Text
                style={{
                  color:
                    item.status === "Closed"
                      ? "#16a34a"
                      : item.status === "In Progress"
                      ? "#d97706"
                      : "#0ea5e9",
                  fontWeight: "700",
                }}
              >
                {item.status}
              </Text>
            </View>
            <Text style={{ color: "#94a3b8", marginTop: 6 }}>{item.phone}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
