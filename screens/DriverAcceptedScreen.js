import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";

export default function DriverAcceptedScreen({ route, navigation }) {
  const { order } = route.params || {};
  const driver = order?.driver;

  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!driver) {
    return (
      <View style={styles.center}>
        <Text>Loading driver details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[ORANGE, ORANGE_LIGHT]} style={styles.header}>
        <Text style={styles.heading}>Driver Assigned 🚗</Text>
        <Text style={styles.sub}>Arriving shortly</Text>
      </LinearGradient>

      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.row}>
          <Ionicons name="person-circle" size={60} color={ORANGE} />
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.name}>{driver.full_name}</Text>
            <Text style={styles.vehicle}>{driver.vehicle}</Text>
            <Text style={styles.phone}>📞 {driver.phone}</Text>
          </View>
        </View>
      </Animated.View>

      <TouchableOpacity
        onPress={() =>
          navigation.replace("RideInProgressScreen", {
            order,
            driver,
          })
        }
      >
        <LinearGradient colors={[ORANGE, ORANGE_LIGHT]} style={styles.btn}>
          <Text style={styles.btnText}>Start Ride</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9F9FA" },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },
  heading: { color: "#fff", fontSize: 22, fontWeight: "900" },
  sub: { color: "#fff", opacity: 0.9 },
  card: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 18,
    elevation: 5,
  },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "800" },
  vehicle: { color: "#666", marginTop: 4 },
  phone: { marginTop: 4 },
  btn: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
