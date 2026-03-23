import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../config";

const ORANGE = "#FF6B00";

export default function RideInProgressScreen({ route }) {
  const { order, driver } = route.params || {};

  useEffect(() => {
    if (!order?.id) return;

    fetch(`${API_BASE_URL}/orders/${order.id}/start`, {
      method: "POST",
    });
  }, []);

  if (!driver) {
    return (
      <View style={styles.center}>
        <Text>Loading ride...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Ionicons name="navigate-circle" size={80} color={ORANGE} />
      <Text style={styles.title}>Ride in Progress</Text>

      <View style={styles.card}>
        <Text style={styles.route}>
          {order?.address?.pickup}
        </Text>
        <Text style={styles.route}>
          → {order?.address?.drop}
        </Text>

        <Text style={styles.driver}>
          Driver: {driver.full_name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 10,
  },
  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFF4E8",
  },
  route: { color: "#333" },
  driver: { marginTop: 10, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
