import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../config";
import { getAuth } from "@react-native-firebase/auth";

export default function PaymentPage({ route, navigation }) {
  const { order } = route.params;
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const methods = [
    { id: "upi", label: "UPI", icon: "logo-google" },
    { id: "card", label: "Credit / Debit Card", icon: "card" },
    { id: "cash", label: "Cash on Delivery", icon: "cash" },
    { id: "demo", label: "Demo Payment (No Setup)", icon: "flash" },
  ];

  const payNow = async () => {
    setLoading(true);

    try {
      // DEMO PAYMENT → instant success
      if (selected === "demo") {
        navigation.replace("SuccessPage", {
          orderId: "DEMO-" + Date.now(),
        });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: auth.currentUser.uid,
          address_id: order.address_id,
          service_type: order.service_type,
          vehicle: order.vehicle?.name,
          package_name: order.package?.name,
          hub: order.hub?.name,
          distance: order.route?.distance,
          duration: order.route?.duration,
          price: order.pricing.total,
          payment_mode: selected === "cash" ? "cod" : "online",
          payment_status: selected === "cash" ? "unpaid" : "paid",
        }),
      });

      const savedOrder = await res.json();

      navigation.replace("SuccessPage", {
        orderId: savedOrder.id,
      });
    } catch (e) {
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Amount */}
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Amount Payable</Text>
        <Text style={styles.amount}>₹{order.pricing.total}</Text>
      </View>

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Choose Payment Method</Text>

      {methods.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={[
            styles.methodCard,
            selected === m.id && styles.methodSelected,
          ]}
          onPress={() => setSelected(m.id)}
        >
          <Ionicons
            name={m.icon}
            size={22}
            color={selected === m.id ? "#fff" : "#555"}
          />
          <Text
            style={[
              styles.methodText,
              selected === m.id && { color: "#fff" },
            ]}
          >
            {m.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Pay Button */}
      <TouchableOpacity
        disabled={!selected || loading}
        onPress={payNow}
        style={{ marginTop: 30 }}
      >
        <LinearGradient
          colors={!selected ? ["#ccc", "#aaa"] : ["#4facfe", "#00f2fe"]}
          style={styles.payButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payText}>
              {selected === "cash" ? "Place Order" : "Pay Now"}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fb",
  },
  amountBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
  },
  amountLabel: {
    fontSize: 14,
    color: "#777",
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },
  methodSelected: {
    backgroundColor: "#4facfe",
  },
  methodText: {
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
  },
  payButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  payText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
