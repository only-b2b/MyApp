// screens/driver/DriverArrivedScreen.js

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config";

const COLORS = {
  primary:      "#111827",
  primaryLight: "#374151",
  accent:       "#10B981",
  dark:         "#1C1C1E",
  muted:        "#6B7280",
  white:        "#FFFFFF",
  bg:           "#F5F6F8",
  success:      "#10B981",
  successBg:    "#ECFDF5",
  error:        "#EF4444",
  warning:      "#F59E0B",
  warningBg:    "#FEF3C7",
  blue:         "#3B82F6",
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export default function DriverArrivedScreen({ route, navigation }) {
  const {
    orderId,
    otp:       otpParam,
    driver:    driverParam,
    orderData: initialOrderData,
  } = route.params || {};

  const insets = useSafeAreaInsets();

  const [order,   setOrder]   = useState(initialOrderData || null);
  const [loading, setLoading] = useState(!initialOrderData);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const otpAnim   = useRef(new Animated.Value(0)).current;

  const runAnimations = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue:  1,
        tension:  50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(otpAnim, {
        toValue:  1,
        tension:  50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (initialOrderData) {
      runAnimations();
      return;
    }
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      const data = await res.json();
      setOrder(data);
      setLoading(false);
      runAnimations();
    } catch (err) {
      console.log("Fetch order error:", err);
      setLoading(false);
    }
  };

  // Poll for ride to start (in_progress)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);

        if (data.status === "in_progress") {
          clearInterval(interval);
          navigation.replace("LiveRideScreen", { orderId });
        }

        if (data.status === "cancelled") {
          clearInterval(interval);
          Alert.alert(
            "Booking Cancelled",
            "This booking was cancelled.",
            [{ text: "OK", onPress: () => navigation.navigate("HomeTabs") }]
          );
        }
      } catch (err) {
        console.log("Poll error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleCall = () => {
    const phone =
      driverParam?.phone ||
      order?.driver?.phone ||
      order?.driver_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Not Available", "Driver phone not available.");
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking?",
      "Your driver has arrived. Are you sure you want to cancel?",
      [
        { text: "No, Continue", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                  reason: "User cancelled after driver arrived",
                }),
              });
              navigation.navigate("HomeTabs");
            } catch {
              Alert.alert("Error", "Failed to cancel. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const otp       = otpParam || order?.otp;
  const otpDigits = otp
    ? String(otp).padStart(4, "0").split("")
    : ["—", "—", "—", "—"];

  const driverName =
    driverParam?.full_name ||
    order?.driver?.full_name ||
    order?.driver_name ||
    "Your Driver";

  const vehicle =
    order?.vehicle_model ||
    order?.vehicle ||
    driverParam?.vehicle ||
    "Vehicle";

  const price     = parseFloat(order?.customer_total || order?.price || 0);
  const payMethod = order?.payment_method || "cash";

  return (
    <View style={styles.container}>

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "ios" ? 10 : 20) },
        ]}
      >
        <TouchableOpacity style={styles.cancelHeaderBtn} onPress={handleCancel}>
          <Ionicons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>

        <Animated.View
          style={[styles.arrivedBadge, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.checkCircle}>
            <Ionicons name="location" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.arrivedTitle}>Driver Arrived!</Text>
          <Text style={styles.arrivedSubtitle}>
            Share the OTP to start your ride
          </Text>
        </Animated.View>

        <View style={styles.fareBadge}>
          <Ionicons
            name={payMethod === "cash" ? "cash-outline" : "card-outline"}
            size={14}
            color={COLORS.white}
          />
          <Text style={styles.fareBadgeText}>
            {formatCurrency(price)} •{" "}
            {payMethod === "cash" ? "Cash" : "Online"}
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* OTP */}
        <Animated.View
          style={[
            styles.otpContainer,
            {
              opacity: otpAnim,
              transform: [{
                translateY: otpAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.otpLabel}>YOUR OTP</Text>
          <View style={styles.otpRow}>
            {otpDigits.map((digit, index) => (
              <View key={index} style={styles.otpBox}>
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.otpHint}>
            Share this code with your driver to start the ride
          </Text>
        </Animated.View>

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {driverName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.driverVehicle}>{vehicle}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLabelRow}>
              <Ionicons name="car-sport-outline" size={16} color={COLORS.muted} />
              <Text style={styles.paymentLabel}>Total Fare</Text>
            </View>
            <Text style={styles.paymentValue}>{formatCurrency(price)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLabelRow}>
              <Ionicons
                name={payMethod === "cash" ? "cash-outline" : "card-outline"}
                size={16}
                color={COLORS.muted}
              />
              <Text style={styles.paymentLabel}>Payment</Text>
            </View>
            <Text style={styles.paymentValue}>
              {payMethod === "cash" ? "Pay by Cash" : "Pay Online"}
            </Text>
          </View>
        </View>

        {/* What's Next */}
        <View style={styles.instructions}>
          <Text style={styles.cardTitle}>What's Next?</Text>

          <View style={styles.step}>
            <View style={[styles.stepNumber, styles.stepActive]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share OTP</Text>
              <Text style={styles.stepDesc}>
                Give the 4-digit OTP to your driver for verification
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={[styles.stepNumberText, { color: COLORS.muted }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: COLORS.muted }]}>
                Ride Begins
              </Text>
              <Text style={styles.stepDesc}>
                Your ride starts after OTP verification
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={[styles.stepNumberText, { color: COLORS.muted }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: COLORS.muted }]}>
                Track Live
              </Text>
              <Text style={styles.stepDesc}>
                Track your ride in real-time on the map
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Note */}
        <View style={styles.cancelNote}>
          <Ionicons name="information-circle" size={16} color={COLORS.warning} />
          <Text style={styles.cancelNoteText}>
            Cancellation charges may apply after driver has arrived
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex:            1,
    justifyContent:  "center",
    alignItems:      "center",
    backgroundColor: COLORS.bg,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.muted },

  header: {
    paddingBottom:           40,
    alignItems:              "center",
    borderBottomLeftRadius:  30,
    borderBottomRightRadius: 30,
    paddingHorizontal:       20,
  },
  cancelHeaderBtn: {
    position:        "absolute",
    top:             Platform.OS === "ios" ? 50 : 30,
    right:           20,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  arrivedBadge:  { alignItems: "center" },
  checkCircle: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: COLORS.white,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    16,
    elevation:       8,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.2,
    shadowRadius:    8,
  },
  arrivedTitle:    { fontSize: 24, fontWeight: "800", color: COLORS.white },
  arrivedSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginTop: 4 },
  fareBadge: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderRadius:      20,
    marginTop:         16,
    gap:               6,
  },
  fareBadgeText: { fontSize: 13, fontWeight: "600", color: COLORS.white },

  content:          { flex: 1, marginTop: -20 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  otpContainer: {
    backgroundColor: COLORS.white,
    borderRadius:    20,
    padding:         24,
    alignItems:      "center",
    elevation:       4,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.1,
    shadowRadius:    8,
    marginBottom:    16,
  },
  otpLabel: {
    fontSize:      12,
    fontWeight:    "600",
    color:         COLORS.muted,
    letterSpacing: 2,
    marginBottom:  16,
  },
  otpRow:  { flexDirection: "row", gap: 12 },
  otpBox: {
    width:           56,
    height:          64,
    borderRadius:    12,
    backgroundColor: COLORS.bg,
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     2,
    borderColor:     COLORS.primary,
  },
  otpDigit: { fontSize: 28, fontWeight: "800", color: COLORS.primary },
  otpHint:  { marginTop: 16, fontSize: 13, color: COLORS.muted, textAlign: "center" },

  driverCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         14,
    marginBottom:    16,
    elevation:       2,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
  },
  driverAvatar: {
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: COLORS.primary,
    alignItems:      "center",
    justifyContent:  "center",
  },
  driverAvatarText: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  driverInfo:       { flex: 1, marginLeft: 12 },
  driverName:       { fontSize: 15, fontWeight: "700", color: COLORS.dark },
  driverVehicle:    { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  callBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: COLORS.accent,
    alignItems:      "center",
    justifyContent:  "center",
  },

  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         16,
    marginBottom:    16,
  },
  cardTitle:       { fontSize: 14, fontWeight: "700", color: COLORS.dark, marginBottom: 12 },
  paymentRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   10,
  },
  paymentLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  paymentLabel:    { fontSize: 13, color: COLORS.dark },
  paymentValue:    { fontSize: 14, fontWeight: "700", color: COLORS.dark },

  instructions: {
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         16,
    marginBottom:    16,
  },
  step: { flexDirection: "row", marginBottom: 14 },
  stepNumber: {
    width:          28,
    height:         28,
    borderRadius:   14,
    borderWidth:    2,
    borderColor:    COLORS.muted,
    alignItems:     "center",
    justifyContent: "center",
    marginRight:    12,
  },
  stepActive: {
    borderColor:     COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepNumberText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  stepContent:    { flex: 1 },
  stepTitle:      { fontSize: 14, fontWeight: "600", color: COLORS.dark, marginBottom: 2 },
  stepDesc:       { fontSize: 12, color: COLORS.muted, lineHeight: 16 },

  cancelNote: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.warningBg,
    padding:         12,
    borderRadius:    10,
    gap:             8,
  },
  cancelNoteText: { flex: 1, fontSize: 12, color: "#92400E" },
});