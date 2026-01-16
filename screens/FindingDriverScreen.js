// screens/FindingDriverScreen.js

import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";

export default function FindingDriverScreen({ route, navigation }) {
  const { order } = route.params;

  useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`${API_BASE_URL}/orders/${order.id}`);
    const data = await res.json();

    if (data.status === "accepted") {
      clearInterval(interval);
      navigation.replace("DriverAcceptedScreen", {
        order: data,
      });
    }
  }, 3000);

  return () => clearInterval(interval);
}, []);


  return (
    <LinearGradient colors={[ORANGE, ORANGE_LIGHT]} style={styles.root}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.title}>Finding nearby drivers…</Text>
      <Text style={styles.sub}>
        Checking availability around your pickup location
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 20 },
  sub: { color: "#fff", opacity: 0.9, marginTop: 6 },
});
