import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { API_BASE_URL } from "../config";

export default function FindingTechnicianScreen({ route, navigation }) {
  const { order_id } = route.params;

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`${API_BASE_URL}/orders/${order_id}`);
      const data = await res.json();

      if (data.status === "accepted") {
        clearInterval(timer);
        navigation.replace("DriverAcceptedScreen", { order: data });
      }
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B00" />
      <Text style={styles.text}>Finding nearby technician…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { marginTop: 20, fontSize: 16, fontWeight: "600" },
});
