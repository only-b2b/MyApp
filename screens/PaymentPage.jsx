import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const CHARCOAL = "#1C1C1E";
const MUTED = "#6B7280";
const CARD_BG = "#FFFDFC";
const CANVAS = "#FFF9F5";

export default function PaymentPage({ route, navigation }) {
  const { price } = route.params;
  const [selected, setSelected] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;

  const paymentOptions = [
    {
      id: "upi",
      name: "UPI (Google Pay / PhonePe / Paytm)",
      icon: require("../assets/icons/upi.png"),
    },
    {
      id: "card",
      name: "Credit / Debit Card",
      icon: require("../assets/icons/upi.png"),
    },
    {
      id: "netbank",
      name: "Net Banking",
      icon: require("../assets/icons/upi.png"),
    },
    {
      id: "wallet",
      name: "Wallet (Paytm / AmazonPay)",
      icon: require("../assets/icons/upi.png"),
    },
    {
      id: "cash",
      name: "Cash on Service",
      icon: require("../assets/icons/upi.png"),
    },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Options</Text>
      </LinearGradient>

      <Animated.ScrollView
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Total Payable Amount</Text>
          <Text style={styles.summaryPrice}>₹{price}</Text>
        </View>

        <Text style={styles.sectionTitle}>Choose Payment Method</Text>
        {paymentOptions.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.9}
            style={[styles.optionCard, selected === opt.id && styles.optionActive]}
            onPress={() => setSelected(opt.id)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={opt.icon} style={styles.optionIcon} />
              <Text style={styles.optionText}>{opt.name}</Text>
            </View>
            {selected === opt.id && (
              <Ionicons name="checkmark-circle" size={22} color={ORANGE} />
            )}
          </TouchableOpacity>
        ))}

        {selected && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              // Add your payment integration or success animation
              navigation.navigate("SuccessPage", { payment: selected, amount: price });
            }}
          >
            <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.payBtn}>
              <Ionicons name="wallet-outline" size={18} color="#fff" />
              <Text style={styles.payText}>Pay Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CANVAS,
  },
  header: {
    height: 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  summaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryText: {
    color: MUTED,
    fontWeight: "600",
    fontSize: 14,
  },
  summaryPrice: {
    fontSize: 26,
    fontWeight: "800",
    color: ORANGE,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: CHARCOAL,
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFDFC",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  optionActive: {
    backgroundColor: "#FFEDE0",
    borderColor: ORANGE,
  },
  optionIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "700",
    color: CHARCOAL,
    flexShrink: 1,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  payText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 6,
  },
});
