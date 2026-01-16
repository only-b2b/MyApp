// components/QuickTiles.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const TILES = [
  { id: "bike", title: "Bike", sub: "For single riders", icon: "bicycle-outline" },
  { id: "loans", title: "Loans", sub: "Instant transfer", icon: "cash-outline" },
  // { id: "out", title: "Outstation", sub: "Best drivers", icon: "car-outline" },
  // { id: "ai", title: "Kruti", sub: "Your AI Assistant", icon: "leaf-outline" },
  // { id: "rent", title: "Rentals", sub: "Multiple stops", icon: "repeat-outline" },
];

export default function QuickTiles() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {TILES.map((t) => (
          <View key={t.id} style={styles.tile}>
            <View style={styles.tileIcon}>
              <Ionicons name={t.icon} size={22} color="#6cc24a" />
            </View>
            <Text style={styles.tileTitle}>{t.title}</Text>
            <Text style={styles.tileSub}>{t.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  tileIcon: {
    backgroundColor: "#eef8e9",
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tileTitle: { fontWeight: "800", color: "#111827" },
  tileSub: { color: "#6b7280", fontSize: 12 },
});
