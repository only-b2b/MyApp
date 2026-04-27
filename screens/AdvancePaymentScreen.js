// screens/AdvancePaymentScreen.js

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../config";
import RazorpayCheckout from "react-native-razorpay";

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  primaryDark: "#008F5B",
  primaryBg: "rgba(0, 168, 107, 0.08)",
  white: "#FFFFFF",
  background: "#F5F6F8",
  surface: "#F9FAFB",
  divider: "#E5E7EB",
  border: "#E0E0E0",
  textDark: "#111111",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  ctaBlack: "#111111",
  shadow: "#000000",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 100,
};

// Helper function
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
};

// UPI Apps Configuration
const UPI_APPS = [
  { id: "phonepe", name: "PhonePe", icon: "💜", color: "#5F259F" },
  { id: "gpay", name: "GPay", icon: "🔵", color: "#4285F4" },
  { id: "paytm", name: "Paytm", icon: "🔷", color: "#00BAF2" },
  { id: "bhim", name: "BHIM", icon: "🟢", color: "#00796B" },
];

export default function AdvancePaymentScreen({ route, navigation }) {
  const { order, splitAmounts, selectedAddress } = route.params;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [selectedUPIApp, setSelectedUPIApp] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation for processing state
  useEffect(() => {
    if (paymentStatus === "processing") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [paymentStatus]);

  // Success animation
  useEffect(() => {
    if (paymentStatus === "success") {
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [paymentStatus]);

  const extractNumber = (str) => {
    if (!str) return null;
    if (typeof str === 'number') return str;
    const match = str.toString().match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

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
          firebase_uid: order.firebase_uid,
          address_id: order.address_id,
          service_type: order.service_type,
          vehicle: order.vehicle?.name || null,
          package_name: order.package?.name || null,
          hub: order.hub?.name || null,
          distance: extractNumber(order.route?.distance),
          duration: extractNumber(order.route?.duration),
          price: splitAmounts.totalAmount,
          advance_amount: splitAmounts.advanceAmount,
          remaining_amount: splitAmounts.remainingAmount,
          pickup_lat: order.location?.lat || null,
          pickup_lng: order.location?.lng || null,
          pickup: selectedAddress?.address || null,
          payment_mode: "split",
          advance_payment_status: "pending",
        }),
      });

      const createdOrder = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createdOrder.error || "Failed to create order");
      }

      console.log("✅ Order created:", createdOrder.id);
      console.log("💳 Creating Razorpay order for advance payment...");

      // Step 2: Create Razorpay order for advance payment
      const paymentRes = await fetch(
        `${API_BASE_URL}/orders/${createdOrder.id}/create-advance-payment`,
        { method: "POST" }
      );

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        throw new Error(paymentData.error || "Failed to create payment");
      }

      console.log("✅ Razorpay order created:", paymentData.orderId);

      // Step 3: Open Razorpay
      const options = {
        description: `Advance Payment - Order #${createdOrder.id}`,
        image: "https://your-logo-url.com/logo.png", // ⚠️ Change this
        currency: paymentData.currency,
        key: paymentData.key,
        amount: paymentData.amount,
        name: "Motors Car Wash",
        order_id: paymentData.orderId,
        prefill: {
          email: "customer@example.com", // ⚠️ Use actual user email
          contact: "9999999999",          // ⚠️ Use actual user phone
          name: "Customer",               // ⚠️ Use actual user name
        },
        theme: { color: COLORS.primary },
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
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          }),
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        throw new Error("Payment verification failed");
      }

      console.log("✅ Payment verified");

      // Step 5: Send request to technicians
      console.log("📤 Sending request to technicians...");
      await fetch(`${API_BASE_URL}/orders/${createdOrder.id}/request`, {
        method: "POST",
      });

      setPaymentStatus("success");

      console.log("✅ All steps completed!");

      // Navigate after animation
      setTimeout(() => {
        navigation.replace("FindingTechnicianScreen", {
          orderId: createdOrder.id,
          serviceType: order.service_type,
          advancePaid: splitAmounts.advanceAmount,
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
          {
            text: "Try Again",
            onPress: () => setPaymentStatus("pending"),
          },
          {
            text: "Cancel",
            onPress: () => navigation.goBack(),
            style: "cancel",
          },
        ]
      );
    }
  };

  const handleUPIPayment = (app) => {
    console.log(`Selected UPI app: ${app.name}`);
    setSelectedUPIApp(app);
    setSelectedPaymentMethod("upi");
    handlePayment(); // This will now open Razorpay with UPI
  };

  // Success View
  if (paymentStatus === "success") {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.successBg} />

        <Animated.View
          style={[
            styles.successContent,
            {
              transform: [{ scale: successAnim }],
              opacity: successAnim,
            },
          ]}
        >
          <View style={styles.successIconWrapper}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>

          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successAmount}>
            {formatCurrency(splitAmounts.advanceAmount)}
          </Text>
          <Text style={styles.successSubtext}>Advance payment received</Text>

          <View style={styles.successDivider} />

          <View style={styles.successInfo}>
            <View style={styles.successInfoRow}>
              <Text style={styles.successInfoLabel}>Remaining</Text>
              <Text style={styles.successInfoValue}>
                {formatCurrency(splitAmounts.remainingAmount)}
              </Text>
            </View>
            <Text style={styles.successInfoNote}>
              To be paid after service completion
            </Text>
          </View>

          <View style={styles.findingDriver}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.findingDriverText}>
              Finding technician for you...
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Processing View
  if (paymentStatus === "processing") {
    return (
      <View style={styles.processingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        <Animated.View
          style={[
            styles.processingIconWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Ionicons name="card" size={48} color={COLORS.primary} />
        </Animated.View>

        <Text style={styles.processingTitle}>Processing Payment</Text>
        <Text style={styles.processingSubtext}>
          Please wait while we process your payment...
        </Text>

        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 24 }}
        />

        <Text style={styles.processingNote}>
          Do not close or go back from this screen
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Advance Payment</Text>
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
            <Text style={styles.securityBadgeText}>100% Secure</Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Summary Card */}
        <View style={styles.amountCard}>
          <View style={styles.amountCardHeader}>
            <Text style={styles.amountCardLabel}>Pay Now</Text>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageBadgeText}>33.33%</Text>
            </View>
          </View>

          <Text style={styles.amountValue}>
            {formatCurrency(splitAmounts.advanceAmount)}
          </Text>

          <View style={styles.amountBreakdown}>
            <View style={styles.amountBreakdownRow}>
              <Text style={styles.amountBreakdownLabel}>Total Service Cost</Text>
              <Text style={styles.amountBreakdownValue}>
                {formatCurrency(splitAmounts.totalAmount)}
              </Text>
            </View>
            <View style={styles.amountBreakdownRow}>
              <Text style={styles.amountBreakdownLabel}>After Service</Text>
              <Text style={styles.amountBreakdownValue}>
                {formatCurrency(splitAmounts.remainingAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Why Pay Advance */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoCardTitle}>Why Advance Payment?</Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.successBg }]}>
                <Ionicons name="checkmark" size={14} color={COLORS.success} />
              </View>
              <Text style={styles.infoText}>Confirms your booking instantly</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.primaryBg }]}>
                <Ionicons name="person" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.infoText}>Same driver for pick-up & drop</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.warningBg }]}>
                <Ionicons name="shield" size={14} color={COLORS.warning} />
              </View>
              <Text style={styles.infoText}>
                Fully refundable if cancelled within 15 mins
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>

          {/* UPI Apps */}
          <View style={styles.paymentSection}>
            <View style={styles.paymentSectionHeader}>
              <Text style={styles.paymentSectionTitle}>UPI Apps</Text>
              <Text style={styles.paymentSectionSubtitle}>
                Pay directly from your bank account
              </Text>
            </View>

            <View style={styles.upiAppsGrid}>
              {UPI_APPS.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[
                    styles.upiAppItem,
                    selectedUPIApp?.id === app.id && styles.upiAppItemSelected,
                  ]}
                  onPress={() => handleUPIPayment(app)}
                  disabled={isProcessing}
                >
                  <Text style={styles.upiAppIcon}>{app.icon}</Text>
                  <Text style={styles.upiAppName}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Other Methods */}
          <View style={styles.paymentSection}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === "card" && styles.paymentOptionSelected,
              ]}
              onPress={() => {
                setSelectedPaymentMethod("card");
                handlePayment();
              }}
              disabled={isProcessing}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentOptionIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="card" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.paymentOptionTitle}>Credit/Debit Card</Text>
                  <Text style={styles.paymentOptionSubtitle}>
                    Visa, Mastercard, RuPay
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === "netbanking" && styles.paymentOptionSelected,
              ]}
              onPress={() => {
                setSelectedPaymentMethod("netbanking");
                handlePayment();
              }}
              disabled={isProcessing}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentOptionIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="business" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.paymentOptionTitle}>Net Banking</Text>
                  <Text style={styles.paymentOptionSubtitle}>
                    All major banks supported
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === "wallet" && styles.paymentOptionSelected,
              ]}
              onPress={() => {
                setSelectedPaymentMethod("wallet");
                handlePayment();
              }}
              disabled={isProcessing}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentOptionIcon, { backgroundColor: "#E0E7FF" }]}>
                  <Ionicons name="wallet" size={20} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.paymentOptionTitle}>Wallets</Text>
                  <Text style={styles.paymentOptionSubtitle}>
                    PhonePe, Paytm, Amazon Pay
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} />
          <Text style={styles.securityText}>
            Secured by 256-bit encryption. Your payment info is safe.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 4,
    gap: 4,
  },
  securityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.success,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },

  // Amount Card
  amountCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  amountCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  amountCardLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  percentageBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  percentageBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  amountBreakdown: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  amountBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  amountBreakdownLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  amountBreakdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  infoList: {
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Payment Methods Card
  paymentMethodsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.lg,
  },
  paymentSection: {
    marginBottom: SPACING.lg,
  },
  paymentSectionHeader: {
    marginBottom: SPACING.md,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  paymentSectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // UPI Apps Grid
  upiAppsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  upiAppItem: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  upiAppItemSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primaryBg,
  },
  upiAppIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  upiAppName: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  // Payment Options
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  paymentOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  paymentOptionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Security Info
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Processing View
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.xxl,
  },
  processingIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  processingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  processingNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xxl,
  },

  // Success View
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    padding: SPACING.xxl,
  },
  successContent: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    width: "100%",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconWrapper: {
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  successAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  successSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  successDivider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xl,
  },
  successInfo: {
    width: "100%",
  },
  successInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successInfoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  successInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  successInfoNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  findingDriver: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  findingDriverText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
});