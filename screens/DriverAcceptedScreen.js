// screens/DriverAcceptedScreen.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";

export default function DriverAcceptedScreen({ route, navigation }) {
  const { order, driver, otp } = route.params;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[ORANGE, ORANGE_LIGHT]} style={styles.header}>
        <Text style={styles.heading}>Driver Assigned</Text>
        <Text style={styles.sub}>Share OTP to start ride</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.name}>{driver.full_name}</Text>
        <Text style={styles.details}>⭐ {driver.rating}</Text>
        <Text style={styles.details}>{driver.vehicle}</Text>
        <Text style={styles.details}>📞 {driver.phone}</Text>

        <View style={styles.otpBox}>
          <Text style={styles.otpLabel}>Your OTP</Text>
          <Text style={styles.otp}>{otp}</Text>
        </View>
      </View>
<Text>{driver.full_name}</Text>
<Text>{driver.phone}</Text>
      <TouchableOpacity
        onPress={() =>
          navigation.replace("RideInProgressScreen", {
            order,
            driver,
          })
        }
      >
        <LinearGradient colors={[ORANGE, ORANGE_LIGHT]} style={styles.btn}>
          <Ionicons name="car-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Start Ride</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: { paddingTop: 60, paddingBottom: 30, alignItems: "center" },
  heading: { color: "#fff", fontSize: 22, fontWeight: "900" },
  sub: { color: "#fff", opacity: 0.9 },
  card: { margin: 20, padding: 20, borderRadius: 16, elevation: 4 },
  name: { fontSize: 18, fontWeight: "800" },
  details: { color: "#555", marginTop: 4 },
  otpBox: {
    marginTop: 20,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF4E8",
    borderRadius: 12,
  },
  otpLabel: { color: "#555" },
  otp: { fontSize: 32, fontWeight: "900", color: ORANGE },
  btn: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "800", marginLeft: 6 },
});
