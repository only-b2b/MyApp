import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { API_BASE_URL } from "../config";

export default function WaitingForTechnicianPage({ route, navigation }) {
  const { orderId } = route.params;

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      const data = await res.json();

      if (data.status === "accepted") {
        clearInterval(timer);
        navigation.replace("TechnicianAssignedPage", {
          technician: data.driver,
          orderId,
        });
      }
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B00" />
      <Text style={styles.title}>Finding Technician...</Text>
      <Text style={styles.sub}>
        Please wait while a technician accepts your request
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginTop: 20 },
  sub: { color: "#6B7280", marginTop: 8 },
});
