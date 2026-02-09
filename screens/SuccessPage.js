// screens/SuccessPage.js
import { View, Text, StyleSheet } from "react-native";

export default function SuccessPage({ route }) {
  const { orderId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Successful 🎉</Text>
      <Text>Order ID:</Text>
      <Text style={styles.orderId}>{orderId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  orderId: { marginTop: 5, fontWeight: "600" },
});
