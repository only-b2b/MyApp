import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { API_BASE_URL } from "../config";

export default function FindingDriverScreen({ route, navigation }) {
  const { orderId } = route.params;

useEffect(() => {
  let interval;

  interval = setInterval(async () => {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    const data = await res.json();

    if (data.status === "accepted") {
      clearInterval(interval); // ✅ STOP polling

      navigation.replace("DriverAssignedScreen", {
        driver: data.driver,
        driverLocation: data.driverLocation,
      });
    }
  }, 3000);

  return () => clearInterval(interval);
}, []);


  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#FF6B00" />
      <Text style={{ marginTop: 16, fontSize: 16 }}>
        Finding nearby driver…
      </Text>
    </View>
  );
}
