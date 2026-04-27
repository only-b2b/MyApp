// screens/RefundStatusScreen.js

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
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config";
import { formatCurrency } from "../utils/paymentUtils";

const COLORS = {
  primary: "#00A86B",
  white: "#FFFFFF",
  background: "#F5F6F8",
  surface: "#F9FAFB",
  divider: "#E5E7EB",
  textDark: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
};

const REFUND_STATUS_CONFIG = {
  initiated: {
    icon: "time-outline",
    color: COLORS.warning,
    bgColor: COLORS.warningBg,
    title: "Refund Initiated",
    description: "Your refund request has been submitted",
  },
  processing: {
    icon: "sync-outline",
    color: COLORS.info,
    bgColor: COLORS.infoBg,
    title: "Processing Refund",
    description: "Your refund is being processed by the bank",
  },
  completed: {
    icon: "checkmark-circle",
    color: COLORS.success,
    bgColor: COLORS.successBg,
    title: "Refund Completed",
    description: "Amount has been credited to your account",
  },
  failed: {
    icon: "close-circle",
    color: COLORS.error,
    bgColor: COLORS.errorBg,
    title: "Refund Failed",
    description: "Please contact support for assistance",
  },
};

export default function RefundStatusScreen({ route, navigation }) {
  const { orderId, refund: initialRefund, orderDetails } = route.params;

  const [refundData, setRefundData] = useState(initialRefund);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(true);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Poll for refund status updates
  useEffect(() => {
    if (!polling) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/refunds/status/${orderId}`);
        const data = await res.json();

        if (res.ok) {
          setRefundData({
            ...refundData,
            status: data.status,
            completedAt: data.completedAt,
            failedAt: data.failedAt,
            failureReason: data.failureReason,
          });

          // Stop polling if completed or failed
          if (data.status === 'completed' || data.status === 'failed') {
            setPolling(false);
          }
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [orderId, polling]);

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "HomeTabs" }],
    });
  };

  const handleContactSupport = () => {
    navigation.navigate("HelpSupport", {
      issue: `Refund Issue - Order #${orderId}`,
    });
  };

  const statusConfig = REFUND_STATUS_CONFIG[refundData?.status] || REFUND_STATUS_CONFIG.initiated;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Icon */}
        <Animated.View
          style={[
            styles.statusIconWrapper,
            { 
              transform: [{ scale: scaleAnim }],
              backgroundColor: statusConfig.bgColor,
            },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={60}
            color={statusConfig.color}
          />
        </Animated.View>

        {/* Status Title */}
        <Animated.View style={[styles.statusInfo, { opacity: fadeAnim }]}>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
            {statusConfig.title}
          </Text>
          <Text style={styles.statusDescription}>
            {statusConfig.description}
          </Text>
        </Animated.View>

        {/* Refund Amount Card */}
        <Animated.View style={[styles.amountCard, { opacity: fadeAnim }]}>
          <Text style={styles.amountLabel}>Refund Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(refundData?.refundAmount)}
          </Text>
          
          {refundData?.cancellationCharge > 0 && (
            <View style={styles.chargeInfo}>
              <Text style={styles.chargeText}>
                {refundData.chargePercentage}% cancellation charge applied
              </Text>
              <Text style={styles.chargeAmount}>
                -{formatCurrency(refundData.cancellationCharge)}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Order Details */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <Text style={styles.detailsTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{orderId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>
              {orderDetails?.packageName || "Car Wash"}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Advance Paid</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(refundData?.advanceAmount)}
            </Text>
          </View>

          {refundData?.razorpayRefundId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Refund ID</Text>
              <Text style={styles.detailValueSmall}>
                {refundData.razorpayRefundId}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Timeline */}
        <Animated.View style={[styles.timelineCard, { opacity: fadeAnim }]}>
          <Text style={styles.timelineTitle}>Refund Timeline</Text>

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotComplete]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Cancellation Requested</Text>
              <Text style={styles.timelineTime}>Just now</Text>
            </View>
            <Ionicons name="checkmark" size={16} color={COLORS.success} />
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={[
              styles.timelineDot,
              refundData?.status === 'processing' || refundData?.status === 'completed'
                ? styles.timelineDotComplete
                : styles.timelineDotPending
            ]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Refund Processing</Text>
              <Text style={styles.timelineTime}>1-2 business days</Text>
            </View>
            {(refundData?.status === 'processing' || refundData?.status === 'completed') && (
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
            )}
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={[
              styles.timelineDot,
              refundData?.status === 'completed'
                ? styles.timelineDotComplete
                : styles.timelineDotPending
            ]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Amount Credited</Text>
              <Text style={styles.timelineTime}>3-5 business days</Text>
            </View>
            {refundData?.status === 'completed' && (
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
            )}
          </View>
        </Animated.View>

        {/* Help Text */}
        <Animated.View style={[styles.helpCard, { opacity: fadeAnim }]}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.helpText}>
            The refund will be credited to your original payment method. 
            If you don't receive it within 5 business days, please contact support.
          </Text>
        </Animated.View>

        {/* Failed State Actions */}
        {refundData?.status === 'failed' && (
          <TouchableOpacity
            style={styles.supportBtn}
            onPress={handleContactSupport}
          >
            <Ionicons name="headset" size={18} color={COLORS.error} />
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={handleGoHome}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, "#00C77B"]}
            style={styles.homeBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="home" size={22} color={COLORS.white} />
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
    alignItems: "center",
  },
  statusIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statusInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  amountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.success,
    marginTop: 4,
  },
  chargeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  chargeText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  chargeAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.error,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  detailValueSmall: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  timelineDotComplete: {
    backgroundColor: COLORS.success,
  },
  timelineDotPending: {
    backgroundColor: COLORS.divider,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  timelineTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.divider,
    marginLeft: 5,
    marginVertical: 4,
  },
  helpCard: {
    flexDirection: "row",
    backgroundColor: COLORS.infoBg,
    borderRadius: 12,
    padding: 14,
    width: "100%",
  },
  helpText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.info,
    lineHeight: 18,
  },
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.errorBg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    width: "100%",
  },
  supportBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.error,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  homeBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  homeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  homeBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
  },
});