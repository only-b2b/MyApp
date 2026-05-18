// screens/AdvancePaymentScreen.js

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config";
import RazorpayCheckout from "react-native-razorpay";
import ScreenWrapper from "../components/ScreenWrapper";

// ==================== DESIGN SYSTEM ====================
const C = {
  violet: "#3D2B8C", violetDark: "#2A1E6B", violetMid: "#4D3CA0",
  blue: "#1E40AF",   blueDark: "#1E3A8A",   blueDeep: "#172554",
  primarySoft: "#EEEAFB", primarySoftDeep: "#DCD4F5", lavenderBg: "#F1EEFB",
  primaryFade: "rgba(61,43,140,0.08)", primaryGlow: "rgba(61,43,140,0.30)",
  gold: "#F5C518", goldLight: "#FFD740", goldDark: "#C9A015",
  goldDeep: "#7A5C00", goldSoft: "#FEF7E0",
  bg: "#F7F7FA", card: "#FFFFFF", surface: "#F9FAFB",
  textDark: "#0F0F1F", textPrimary: "#1F1F33", textMid: "#4A4A66",
  textLight: "#7B7B95", textFaint: "#A8A8BC",
  border: "#EDEDF2", borderMid: "#DDDDE5", divider: "#E8E8EE",
  pastelBlue: "#E3F0FF", blueAccent: "#3B82F6",
  pastelOrange: "#FFE8D6", orange: "#F59E0B",
  pastelIndigo: "#E0E7FF", indigo: "#6366F1",
  success: "#22C55E", successBg: "#E8F8EF", successDark: "#16A34A",
  warning: "#F59E0B", warningBg: "#FFFBEB",
  error: "#EF4444", errorBg: "#FEF2F2",
  white: "#FFFFFF", shadow: "#0F0F1F",
};
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R  = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };
const GRAD = {
  primary:     [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  gold:        [C.goldLight, C.gold, C.goldDark],
};

const formatCurrency = (amount) =>
  `₹${(amount || 0).toLocaleString("en-IN")}`;

const UPI_APPS = [
  { id: "phonepe", name: "PhonePe",    bgColor: "#5F259F", textColor: "#FFFFFF", monogram: "Pe" },
  { id: "gpay",    name: "Google Pay", bgColor: "#FFFFFF", textColor: "#4285F4", monogram: "G",  border: "#DADCE0" },
  { id: "paytm",   name: "Paytm",      bgColor: "#00BAF2", textColor: "#FFFFFF", monogram: "P" },
  { id: "bhim",    name: "BHIM UPI",   bgColor: "#F47A1F", textColor: "#FFFFFF", monogram: "B" },
];

export default function AdvancePaymentScreen({ route, navigation }) {
  const { order, splitAmounts, selectedAddress } = route.params;

  const [selectedUPIApp,   setSelectedUPIApp]   = useState(null);
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [paymentStatus,    setPaymentStatus]    = useState("pending");

  // ── Animations ──
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const goldPulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(goldPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
      Animated.timing(goldPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (paymentStatus === "processing") {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])).start();
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (paymentStatus === "success") {
      Animated.spring(successAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }).start();
    }
  }, [paymentStatus]);

  const extractNumber = (str) => {
    if (!str) return null;
    if (typeof str === "number") return str;
    const match = str.toString().match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  // ✅ PAYMENT HANDLER — same logic as old working code + new amounts
  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      console.log("📝 Creating order...");

      // Step 1: Create order on backend
      const createRes = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid:              order.firebase_uid,
          address_id:                order.address_id,
          service_type:              order.service_type,
          vehicle:                   order.vehicle?.name     || null,
          package_name:              order.package?.name     || null,
          hub:                       order.hub?.name         || null,
          distance:                  extractNumber(order.route?.distance),
          duration:                  extractNumber(order.route?.duration),
          price:                     splitAmounts.totalAmount,
          advance_amount:            splitAmounts.advanceAmount,
          remaining_amount:          splitAmounts.remainingAmount,
          pickup_lat:                order.location?.lat     || null,
          pickup_lng:                order.location?.lng     || null,
          pickup:                    selectedAddress?.address || null,
          payment_mode:              "split",
          advance_payment_status:    "pending",
        }),
      });

      const createdOrder = await createRes.json();
      if (!createRes.ok) throw new Error(createdOrder.error || "Failed to create order");
      console.log("✅ Order created:", createdOrder.id);

      // Step 2: Create Razorpay order for advance payment
      console.log("💳 Creating Razorpay order...");
      const paymentRes = await fetch(
        `${API_BASE_URL}/orders/${createdOrder.id}/create-advance-payment`,
        { method: "POST" }
      );
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error || "Failed to create payment");
      console.log("✅ Razorpay order created:", paymentData.orderId);

      // Step 3: Open Razorpay
      const options = {
        description: `Advance Payment - Order #${createdOrder.id}`,
        image:       "https://your-logo-url.com/logo.png",
        currency:    paymentData.currency,
        key:         paymentData.key,
        amount:      paymentData.amount,
        name:        "Motors Car Wash",
        order_id:    paymentData.orderId,
        prefill: {
          email:   "customer@example.com",
          contact: "9999999999",
          name:    "Customer",
        },
        theme: { color: C.violet },
      };

      console.log("🔓 Opening Razorpay...");
      const paymentResponse = await RazorpayCheckout.open(options);
      console.log("✅ Payment successful:", paymentResponse.razorpay_payment_id);

      // Step 4: Verify payment
      const verifyRes = await fetch(
        `${API_BASE_URL}/orders/${createdOrder.id}/verify-advance-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id:   paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature:  paymentResponse.razorpay_signature,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error("Payment verification failed");
      console.log("✅ Payment verified");

      // Step 5: Send request to technicians
      console.log("📤 Sending request to technicians...");
      await fetch(`${API_BASE_URL}/orders/${createdOrder.id}/request`, {
        method: "POST",
      });

      setPaymentStatus("success");
      console.log("✅ All steps completed!");

      // ✅ Navigate with all 3 amounts (totalAmount + remainingAmount added)
      setTimeout(() => {
        navigation.replace("FindingTechnicianScreen", {
          orderId:         createdOrder.id,
          serviceType:     order.service_type,
          advancePaid:     splitAmounts.advanceAmount,
          totalAmount:     splitAmounts.totalAmount,      // ✅ Added
          remainingAmount: splitAmounts.remainingAmount,  // ✅ Added
        });
      }, 2000);

    } catch (error) {
      console.error("❌ Payment error:", error);
      setPaymentStatus("failed");
      setIsProcessing(false);
      Alert.alert(
        "Payment Failed",
        error.message || "Something went wrong. Please try again.",
        [
          { text: "Try Again", onPress: () => setPaymentStatus("pending") },
          { text: "Cancel",    onPress: () => navigation.goBack(), style: "cancel" },
        ]
      );
    }
  };

  const handleUPIPayment = (app) => {
    console.log(`Selected UPI app: ${app.name}`);
    setSelectedUPIApp(app);
    handlePayment();
  };

  // ── SUCCESS VIEW ──
  if (paymentStatus === "success") {
    return (
      <ScreenWrapper backgroundColor={C.successBg} statusBarStyle="dark-content" statusBarBg={C.successBg}>
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successContent, { transform: [{ scale: successAnim }], opacity: successAnim }]}>

            <View style={styles.successIconOuter}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark" size={50} color={C.white} />
              </View>
            </View>

            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successAmount}>{formatCurrency(splitAmounts.advanceAmount)}</Text>
            <Text style={styles.successSubtext}>Advance payment received</Text>

            <View style={styles.successDivider} />

            <View style={styles.successInfo}>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Remaining</Text>
                <Text style={styles.successInfoValue}>{formatCurrency(splitAmounts.remainingAmount)}</Text>
              </View>
              <Text style={styles.successInfoNote}>To be paid after service completion</Text>
            </View>

            <View style={styles.findingDriver}>
              <ActivityIndicator size="small" color={C.violet} />
              <Text style={styles.findingDriverText}>Finding technician for you...</Text>
            </View>
          </Animated.View>
        </View>
      </ScreenWrapper>
    );
  }

  // ── PROCESSING VIEW ──
  if (paymentStatus === "processing") {
    return (
      <ScreenWrapper backgroundColor={C.white} statusBarStyle="dark-content" statusBarBg={C.white}>
        <View style={styles.processingContainer}>
          <Animated.View style={[styles.processingIconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={GRAD.primary} style={styles.processingIconInner}>
              <Ionicons name="card" size={42} color={C.white} />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.processingTitle}>Processing Payment</Text>
          <Text style={styles.processingSubtext}>Please wait while we process your payment...</Text>
          <ActivityIndicator size="large" color={C.violet} style={{ marginTop: 24 }} />
          <View style={styles.processingNote}>
            <Ionicons name="lock-closed" size={12} color={C.textLight} />
            <Text style={styles.processingNoteText}>Do not close or go back from this screen</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ── MAIN VIEW ──
  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.white}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} disabled={isProcessing}>
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Advance Payment</Text>
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={11} color={C.success} />
            <Text style={styles.securityBadgeText}>100% Secure</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AMOUNT CARD */}
        <View style={styles.amountCardWrapper}>
          <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.amountCard}>
            <View style={styles.amountDecor1} />
            <View style={styles.amountDecor2} />

            <View style={styles.amountCardHeader}>
              <Text style={styles.amountCardLabel}>Pay Now</Text>
              <View style={styles.percentageBadge}>
                <Text style={styles.percentageBadgeText}>33.33%</Text>
              </View>
            </View>

            <Text style={styles.amountValue}>{formatCurrency(splitAmounts.advanceAmount)}</Text>
            <Text style={styles.amountValueLabel}>Advance Booking Fee</Text>

            <View style={styles.amountBreakdown}>
              <View style={styles.amountBreakdownRow}>
                <Text style={styles.amountBreakdownLabel}>Total Service Cost</Text>
                <Text style={styles.amountBreakdownValue}>{formatCurrency(splitAmounts.totalAmount)}</Text>
              </View>
              <View style={styles.amountBreakdownDivider} />
              <View style={styles.amountBreakdownRow}>
                <Text style={styles.amountBreakdownLabel}>After Service</Text>
                <Text style={styles.amountBreakdownValue}>{formatCurrency(splitAmounts.remainingAmount)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* WHY ADVANCE */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoCardIconWrap}><Ionicons name="information-circle" size={16} color={C.violet} /></View>
            <Text style={styles.infoCardTitle}>Why Advance Payment?</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: C.successBg }]}><Ionicons name="checkmark" size={14} color={C.success} /></View>
              <View style={{ flex: 1 }}><Text style={styles.infoText}>Confirms your booking instantly</Text></View>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: C.primarySoft }]}><Ionicons name="person" size={14} color={C.violet} /></View>
              <View style={{ flex: 1 }}><Text style={styles.infoText}>Same driver for pick-up & drop</Text></View>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: C.warningBg }]}><Ionicons name="shield" size={14} color={C.warning} /></View>
              <View style={{ flex: 1 }}><Text style={styles.infoText}>Fully refundable if cancelled within 15 mins</Text></View>
            </View>
          </View>
        </View>

        {/* PAYMENT METHODS */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>

          {/* UPI Apps */}
          <View style={styles.paymentSection}>
            <View style={styles.upiHeaderRow}>
              <Text style={styles.paymentSectionTitle}>UPI Apps</Text>
              <View style={styles.upiBadge}><Text style={styles.upiBadgeText}>Recommended</Text></View>
            </View>
            <Text style={styles.paymentSectionSubtitle}>Pay directly from your bank account</Text>

            <View style={styles.upiAppsGrid}>
              {UPI_APPS.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.upiAppItem, selectedUPIApp?.id === app.id && styles.upiAppItemSelected]}
                  onPress={() => handleUPIPayment(app)}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <View style={[styles.upiLogoBox, { backgroundColor: app.bgColor, borderWidth: app.border ? 1 : 0, borderColor: app.border || "transparent" }]}>
                    <Text style={[styles.upiMonogram, { color: app.textColor }]}>{app.monogram}</Text>
                  </View>
                  <Text style={styles.upiAppName} numberOfLines={1}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.upiIdHint} activeOpacity={0.7} onPress={handlePayment}>
              <View style={styles.upiIdHintIcon}><Ionicons name="at" size={14} color={C.violet} /></View>
              <Text style={styles.upiIdHintText}>Pay using UPI ID</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textLight} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* Other Methods */}
          <View style={styles.paymentSection}>
            <Text style={[styles.paymentSectionTitle, { marginBottom: SP.sm }]}>Other Methods</Text>

            <TouchableOpacity style={styles.paymentOption} onPress={() => { handlePayment(); }} disabled={isProcessing} activeOpacity={0.85}>
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentOptionIcon, { backgroundColor: C.pastelBlue }]}>
                  <Ionicons name="card" size={20} color={C.blueAccent} />
                </View>
                <View>
                  <Text style={styles.paymentOptionTitle}>Credit / Debit Card</Text>
                  <Text style={styles.paymentOptionSubtitle}>Visa, Mastercard, RuPay</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentOption} onPress={() => { handlePayment(); }} disabled={isProcessing} activeOpacity={0.85}>
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentOptionIcon, { backgroundColor: C.pastelOrange }]}>
                  <Ionicons name="business" size={20} color={C.orange} />
                </View>
                <View>
                  <Text style={styles.paymentOptionTitle}>Net Banking</Text>
                  <Text style={styles.paymentOptionSubtitle}>All major banks supported</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentOption} onPress={() => { handlePayment(); }} disabled={isProcessing} activeOpacity={0.85}>
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentOptionIcon, { backgroundColor: C.pastelIndigo }]}>
                  <Ionicons name="wallet" size={20} color={C.indigo} />
                </View>
                <View>
                  <Text style={styles.paymentOptionTitle}>Wallets</Text>
                  <Text style={styles.paymentOptionSubtitle}>PhonePe, Paytm, Amazon Pay</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECURITY */}
        <View style={styles.securityInfo}>
          <View style={styles.securityIconWrap}><Ionicons name="lock-closed" size={12} color={C.violet} /></View>
          <Text style={styles.securityText}>Secured by 256-bit encryption · Your payment info is safe</Text>
        </View>

        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Text style={styles.poweredByBrand}>Razorpay</Text>
        </View>

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({

  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SP.md, paddingBottom: SP.md, paddingHorizontal: SP.lg, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  headerBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: "center", alignItems: "center" },
  headerCenter:  { alignItems: "center", flex: 1 },
  headerTitle:   { fontSize: 16, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  securityBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.successBg, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full, marginTop: 4 },
  securityBadgeText: { fontSize: 10, fontWeight: "700", color: C.successDark, letterSpacing: 0.3 },

  scrollView:    { flex: 1 },
  scrollContent: { padding: SP.lg },

  // Amount Card
  amountCardWrapper: { borderRadius: R.lg, marginBottom: SP.lg, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  amountCard:        { padding: SP.xl, overflow: "hidden", position: "relative" },
  amountDecor1:      { position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)" },
  amountDecor2:      { position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)" },
  amountCardHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SP.sm },
  amountCardLabel:   { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  percentageBadge:   { backgroundColor: C.gold, paddingHorizontal: SP.sm + 2, paddingVertical: 4, borderRadius: R.sm },
  percentageBadgeText:{ fontSize: 11, fontWeight: "800", color: C.textDark, letterSpacing: 0.3 },
  amountValue:       { fontSize: 38, fontWeight: "900", color: C.white, letterSpacing: -1, marginTop: 4 },
  amountValueLabel:  { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500", marginTop: 2, marginBottom: SP.lg },
  amountBreakdown:   { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: R.md, padding: SP.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  amountBreakdownRow:{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  amountBreakdownLabel:{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  amountBreakdownValue:{ fontSize: 13, fontWeight: "700", color: C.white },
  amountBreakdownDivider:{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: SP.sm },

  // Info Card
  infoCard:        { backgroundColor: C.white, borderRadius: R.lg, padding: SP.lg, marginBottom: SP.lg, borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoCardHeader:  { flexDirection: "row", alignItems: "center", marginBottom: SP.md, gap: SP.sm },
  infoCardIconWrap:{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center" },
  infoCardTitle:   { fontSize: 14, fontWeight: "800", color: C.textDark, letterSpacing: -0.2 },
  infoList:        { gap: SP.md },
  infoItem:        { flexDirection: "row", alignItems: "center", gap: SP.md },
  infoIcon:        { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  infoText:        { fontSize: 13, color: C.textPrimary, fontWeight: "500", lineHeight: 18 },

  // Payment Methods
  paymentMethodsCard: { backgroundColor: C.white, borderRadius: R.lg, padding: SP.lg, marginBottom: SP.lg, borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle:       { fontSize: 16, fontWeight: "800", color: C.textDark, marginBottom: SP.lg, letterSpacing: -0.3 },
  paymentSection:     { marginBottom: SP.md },
  upiHeaderRow:       { flexDirection: "row", alignItems: "center", gap: SP.sm, marginBottom: 4 },
  paymentSectionTitle:{ fontSize: 14, fontWeight: "700", color: C.textDark },
  upiBadge:           { backgroundColor: C.goldSoft, paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: R.sm },
  upiBadgeText:       { fontSize: 9, fontWeight: "800", color: C.goldDeep, letterSpacing: 0.5 },
  paymentSectionSubtitle:{ fontSize: 12, color: C.textLight, fontWeight: "500", marginBottom: SP.md },

  upiAppsGrid:        { flexDirection: "row", flexWrap: "wrap", gap: SP.sm },
  upiAppItem:         { width: "23%", backgroundColor: C.white, borderRadius: R.md, padding: SP.sm, alignItems: "center", borderWidth: 1.5, borderColor: C.border },
  upiAppItemSelected: { borderColor: C.violet, backgroundColor: C.primarySoft, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  upiLogoBox:         { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  upiMonogram:        { fontSize: 20, fontWeight: "900", letterSpacing: -1 },
  upiAppName:         { fontSize: 10, fontWeight: "700", color: C.textDark, textAlign: "center" },

  upiIdHint:          { flexDirection: "row", alignItems: "center", backgroundColor: C.lavenderBg, borderRadius: R.md, padding: SP.md, marginTop: SP.md, gap: SP.sm },
  upiIdHintIcon:      { width: 28, height: 28, borderRadius: 14, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  upiIdHintText:      { flex: 1, fontSize: 13, fontWeight: "700", color: C.violet },

  orDivider:          { flexDirection: "row", alignItems: "center", marginVertical: SP.md, gap: SP.sm },
  orLine:             { flex: 1, height: 1, backgroundColor: C.border },
  orText:             { fontSize: 11, fontWeight: "700", color: C.textLight, letterSpacing: 1 },

  paymentOption:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.white, borderRadius: R.md, padding: SP.md, marginBottom: SP.sm, borderWidth: 1.5, borderColor: C.border },
  paymentOptionLeft:  { flexDirection: "row", alignItems: "center", gap: SP.md, flex: 1 },
  paymentOptionIcon:  { width: 42, height: 42, borderRadius: R.sm, justifyContent: "center", alignItems: "center" },
  paymentOptionTitle: { fontSize: 13, fontWeight: "700", color: C.textDark },
  paymentOptionSubtitle:{ fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: "500" },

  securityInfo:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SP.sm, paddingVertical: SP.md, backgroundColor: C.primarySoft, borderRadius: R.md, marginBottom: SP.md },
  securityIconWrap:   { width: 22, height: 22, borderRadius: 11, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  securityText:       { fontSize: 11, color: C.violet, fontWeight: "600" },
  poweredBy:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: SP.sm },
  poweredByText:      { fontSize: 11, color: C.textLight, fontWeight: "500" },
  poweredByBrand:     { fontSize: 12, color: "#0C2451", fontWeight: "800", letterSpacing: -0.2 },

  // Processing View
  processingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SP.xxl },
  processingIconWrap:  { marginBottom: SP.xl, shadowColor: C.violet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  processingIconInner: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  processingTitle:     { fontSize: 22, fontWeight: "900", color: C.textDark, letterSpacing: -0.5, marginBottom: SP.sm },
  processingSubtext:   { fontSize: 14, color: C.textMid, textAlign: "center", fontWeight: "500", lineHeight: 20 },
  processingNote:      { flexDirection: "row", alignItems: "center", gap: 6, marginTop: SP.xxl, backgroundColor: C.surface, paddingHorizontal: SP.lg, paddingVertical: SP.sm, borderRadius: R.full },
  processingNoteText:  { fontSize: 12, color: C.textLight, fontWeight: "600" },

  // Success View
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SP.xxl },
  successContent:   { alignItems: "center", backgroundColor: C.white, borderRadius: R.xl, padding: SP.xxl, width: "100%", shadowColor: C.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10 },
  successIconOuter: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.successBg, justifyContent: "center", alignItems: "center", marginBottom: SP.lg },
  successIconWrapper:{ width: 76, height: 76, borderRadius: 38, backgroundColor: C.success, justifyContent: "center", alignItems: "center", shadowColor: C.success, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  successTitle:     { fontSize: 22, fontWeight: "900", color: C.success, letterSpacing: -0.5, marginBottom: SP.xs },
  successAmount:    { fontSize: 36, fontWeight: "900", color: C.textDark, letterSpacing: -1, marginTop: 4 },
  successSubtext:   { fontSize: 13, color: C.textLight, marginTop: 4, fontWeight: "500" },
  successDivider:   { width: "100%", height: 1, backgroundColor: C.border, marginVertical: SP.xl },
  successInfo:      { width: "100%" },
  successInfoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  successInfoLabel: { fontSize: 13, color: C.textMid, fontWeight: "500" },
  successInfoValue: { fontSize: 17, fontWeight: "800", color: C.textDark },
  successInfoNote:  { fontSize: 11, color: C.textLight, marginTop: 4, fontWeight: "500" },
  findingDriver:    { flexDirection: "row", alignItems: "center", gap: SP.sm, marginTop: SP.xl, backgroundColor: C.primarySoft, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderRadius: R.full },
  findingDriverText:{ fontSize: 13, fontWeight: "700", color: C.violet },
});