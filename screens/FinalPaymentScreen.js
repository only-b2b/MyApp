// screens/FinalPaymentScreen.js

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
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config";
import RazorpayCheckout from "react-native-razorpay";
import { formatCurrency } from "../utils/paymentUtils";

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
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  shadow: "#000000",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 100,
};

// UPI Apps Configuration
const UPI_APPS = [
  { id: "phonepe", name: "PhonePe", icon: "💜", color: "#5F259F" },
  { id: "gpay", name: "GPay", icon: "🔵", color: "#4285F4" },
  { id: "paytm", name: "Paytm", icon: "🔷", color: "#00BAF2" },
  { id: "bhim", name: "BHIM", icon: "🟢", color: "#00796B" },
];

export default function FinalPaymentScreen({ route, navigation }) {
  const {
    orderId,
    order,
    totalAmount,
    advancePaid,
    remainingAmount,
    rating,
  } = route.params;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
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

  // Pulse animation for processing
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

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Step 1: Create final payment order
      const paymentRes = await fetch(
        `${API_BASE_URL}/orders/${orderId}/create-final-payment`,
        { method: "POST" }
      );

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        throw new Error(paymentData.error || "Failed to create payment");
      }

      // Step 2: Open Razorpay
      const options = {
        description: `Final Payment - Order #${orderId}`,
        image: "https://your-logo-url.com/logo.png",
        currency: paymentData.currency,
        key: paymentData.key,
        amount: paymentData.amount,
        name: "Motors Car Wash",
        order_id: paymentData.orderId,
        prefill: {
          email: "customer@example.com",
          contact: "9999999999",
          name: "Customer",
        },
        theme: { color: COLORS.primary },
      };

      const paymentResponse = await RazorpayCheckout.open(options);

      // Step 3: Verify payment
      const verifyRes = await fetch(
        `${API_BASE_URL}/orders/${orderId}/verify-final-payment`,
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

      if (verifyData.success) {
        setPaymentStatus("success");

        // Navigate to success screen after animation
        setTimeout(() => {
          navigation.replace("OrderCompleteScreen", {
            orderId,
            order,
            totalAmount,
            advancePaid,
            remainingAmount,
            rating,
          });
        }, 2500);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
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
            style: "cancel",
          },
        ]
      );
    }
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
            <Ionicons name="checkmark-circle" size={100} color={COLORS.success} />
          </View>

          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successAmount}>
            {formatCurrency(remainingAmount)}
          </Text>
          <Text style={styles.successSubtext}>Final payment completed</Text>

          <View style={styles.successDivider} />

          <View style={styles.successSummary}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Advance Paid</Text>
              <Text style={styles.successValue}>
                {formatCurrency(advancePaid)}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Final Payment</Text>
              <Text style={styles.successValue}>
                {formatCurrency(remainingAmount)}
              </Text>
            </View>
            <View style={styles.successRowTotal}>
              <Text style={styles.successLabelTotal}>Total Paid</Text>
              <Text style={styles.successValueTotal}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Generating receipt...</Text>
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
          <Text style={styles.headerTitle}>Final Payment</Text>
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
        {/* Amount Card */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.amountCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.amountCardHeader}>
            <Text style={styles.amountCardLabel}>Remaining Amount</Text>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageBadgeText}>66.67%</Text>
            </View>
          </View>

          <Text style={styles.amountValue}>
            {formatCurrency(remainingAmount)}
          </Text>

          <View style={styles.amountBreakdown}>
            <View style={styles.amountBreakdownRow}>
              <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.amountBreakdownLabel}>Advance Paid</Text>
              <Text style={styles.amountBreakdownValue}>
                {formatCurrency(advancePaid)}
              </Text>
            </View>
            <View style={styles.amountBreakdownRow}>
              <Ionicons name="receipt-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.amountBreakdownLabel}>Total Bill</Text>
              <Text style={styles.amountBreakdownValue}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Service Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="car-sport" size={20} color={COLORS.primary} />
            <Text style={styles.summaryTitle}>Service Summary</Text>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package</Text>
              <Text style={styles.summaryValue}>
                {order?.package_name || "Car Wash"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle</Text>
              <Text style={styles.summaryValue}>
                {order?.vehicle || "—"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Location</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {order?.pickup_address || "—"}
              </Text>
            </View>
            {rating > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Your Rating</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= rating ? "star" : "star-outline"}
                      size={16}
                      color="#F59E0B"
                    />
                  ))}
                </View>
              </View>
            )}
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
                Instant payment from your bank
              </Text>
            </View>

            <View style={styles.upiAppsGrid}>
              {UPI_APPS.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.upiAppItem}
                  onPress={handleRazorpayPayment}
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
              style={styles.paymentOption}
              onPress={handleRazorpayPayment}
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
              style={styles.paymentOption}
              onPress={handleRazorpayPayment}
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
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} />
          <Text style={styles.securityText}>
            Secured by Razorpay. Your payment info is encrypted.
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
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  amountBreakdown: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  amountBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  amountBreakdownLabel: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  amountBreakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  summaryContent: {
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
    maxWidth: "60%",
    textAlign: "right",
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
  },

  // Payment Methods Card
  paymentMethodsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  successAmount: {
    fontSize: 36,
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
  successSummary: {
    width: "100%",
    gap: SPACING.sm,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  successValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  successRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  successLabelTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  successValueTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.success,
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
});