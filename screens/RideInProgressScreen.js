// screens/RideInProgressScreen.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const ORANGE = "#FF6B00";

export default function RideInProgressScreen({ route }) {
  const { order, driver } = route.params;
useEffect(() => {
  fetch(`${API_BASE_URL}/orders/${order.id}/start`, {
    method: "POST",
  });
}, []);

  return (
    <View style={styles.root}>
      <Ionicons name="navigate-circle" size={64} color={ORANGE} />
      <Text style={styles.title}>Ride in progress</Text>

      <Text style={styles.info}>{order.address.pickup}</Text>
      <Text style={styles.info}>→ {order.address.drop}</Text>

      <Text style={styles.driver}>
        Driver: {driver.full_name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  info: { color: "#555", marginTop: 6 },
  driver: { marginTop: 20, fontWeight: "700" },
});
