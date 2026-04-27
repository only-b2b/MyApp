// screens/CancelBookingScreen.js

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
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config";
import { formatCurrency } from "../utils/paymentUtils";

const COLORS = {
  primary: "#00A86B",
  primaryBg: "rgba(0, 168, 107, 0.08)",
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
};

const CANCELLATION_REASONS = [
  { id: "changed_mind", label: "Changed my mind" },
  { id: "found_alternative", label: "Found an alternative service" },
  { id: "schedule_conflict", label: "Schedule conflict" },
  { id: "price_concern", label: "Price is too high" },
  { id: "technician_delay", label: "Technician taking too long" },
  { id: "other", label: "Other reason" },
];

export default function CancelBookingScreen({ route, navigation }) {
  const { orderId } = route.params;

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [refundPreview, setRefundPreview] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [otherReason, setOtherReason] = useState("");
  const [error, setError] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchRefundPreview();
  }, [orderId]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const fetchRefundPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/refunds/preview/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load refund details");
      }

      setRefundPreview(data);
    } catch (err) {
      console.error("Fetch refund preview error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedReason) {
      Alert.alert("Select Reason", "Please select a reason for cancellation");
      return;
    }

    const reason = selectedReason === "other" 
      ? otherReason || "Other reason"
      : CANCELLATION_REASONS.find(r => r.id === selectedReason)?.label;

    Alert.alert(
      "Confirm Cancellation",
      refundPreview?.chargePercentage > 0
        ? `Are you sure you want to cancel? A ${refundPreview.chargePercentage}% cancellation charge will apply.`
        : "Are you sure you want to cancel this booking?",
      [
        { text: "No, Keep Booking", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => processCancellation(reason),
        },
      ]
    );
  };

  const processCancellation = async (reason) => {
    try {
      setCancelling(true);

      const res = await fetch(`${API_BASE_URL}/refunds/cancel/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          cancelled_by: "user",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      // Navigate to refund status screen
      navigation.replace("RefundStatusScreen", {
        orderId,
        refund: data.refund,
        orderDetails: refundPreview,
      });

    } catch (err) {
      console.error("Cancel booking error:", err);
      Alert.alert("Error", err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading refund details...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color={COLORS.error} />
        <Text style={styles.errorTitle}>Unable to Cancel</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Not refundable
  if (!refundPreview?.isRefundable) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="close-circle" size={60} color={COLORS.error} />
        <Text style={styles.errorTitle}>Cannot Cancel</Text>
        <Text style={styles.errorText}>{refundPreview?.message}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
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
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Booking</Text>
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
        {/* Warning Banner */}
        <View style={[
          styles.warningBanner,
          refundPreview.chargePercentage === 0 && styles.successBanner
        ]}>
          <Ionicons 
            name={refundPreview.chargePercentage === 0 ? "checkmark-circle" : "warning"} 
            size={24} 
            color={refundPreview.chargePercentage === 0 ? COLORS.success : COLORS.warning} 
          />
          <View style={styles.warningContent}>
            <Text style={[
              styles.warningTitle,
              refundPreview.chargePercentage === 0 && { color: COLORS.success }
            ]}>
              {refundPreview.chargePercentage === 0 
                ? "Full Refund Available" 
                : `${refundPreview.chargePercentage}% Cancellation Charge`}
            </Text>
            <Text style={styles.warningText}>
              {refundPreview.message}
            </Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.orderInfoCard}>
          <View style={styles.orderInfoHeader}>
            <Ionicons name="car-sport" size={20} color={COLORS.primary} />
            <Text style={styles.orderInfoTitle}>Booking Details</Text>
          </View>
          <View style={styles.orderInfoBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>#{refundPreview.orderId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{refundPreview.packageName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>{refundPreview.vehicle}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {refundPreview.orderStatus.replace(/_/g, " ").toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Refund Breakdown */}
        <View style={styles.refundCard}>
          <View style={styles.refundHeader}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            <Text style={styles.refundTitle}>Refund Breakdown</Text>
          </View>

          <View style={styles.refundBody}>
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Advance Paid</Text>
              <Text style={styles.refundValue}>
                {formatCurrency(refundPreview.advanceAmount)}
              </Text>
            </View>

            {refundPreview.cancellationCharge > 0 && (
              <View style={styles.refundRow}>
                <View style={styles.refundLabelRow}>
                  <Text style={styles.refundLabelCharge}>
                    Cancellation Charge ({refundPreview.chargePercentage}%)
                  </Text>
                </View>
                <Text style={styles.refundValueCharge}>
                  -{formatCurrency(refundPreview.cancellationCharge)}
                </Text>
              </View>
            )}

            <View style={styles.refundDivider} />

            <View style={styles.refundTotalRow}>
              <Text style={styles.refundTotalLabel}>You'll Receive</Text>
              <Text style={styles.refundTotalValue}>
                {formatCurrency(refundPreview.refundAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.refundNote}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.refundNoteText}>
              Refund will be credited within 3-5 business days
            </Text>
          </View>
        </View>

        {/* Cancellation Reason */}
        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>Why are you cancelling?</Text>
          <Text style={styles.reasonSubtitle}>
            Your feedback helps us improve our service
          </Text>

          <View style={styles.reasonOptions}>
            {CANCELLATION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={[
                  styles.reasonRadio,
                  selectedReason === reason.id && styles.reasonRadioSelected,
                ]}>
                  {selectedReason === reason.id && (
                    <View style={styles.reasonRadioInner} />
                  )}
                </View>
                <Text style={[
                  styles.reasonText,
                  selectedReason === reason.id && styles.reasonTextSelected,
                ]}>
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === "other" && (
            <TextInput
              style={styles.otherInput}
              placeholder="Please specify your reason..."
              placeholderTextColor={COLORS.textMuted}
              value={otherReason}
              onChangeText={setOtherReason}
              multiline
              numberOfLines={3}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.keepBookingBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.keepBookingText}>Keep Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cancelBtn,
            (!selectedReason || cancelling) && styles.cancelBtnDisabled,
          ]}
          onPress={handleCancelBooking}
          disabled={!selectedReason || cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="close-circle" size={18} color={COLORS.white} />
              <Text style={styles.cancelBtnText}>
                Cancel & Get {formatCurrency(refundPreview.refundAmount)}
              </Text>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  errorButton: {
    marginTop: 24,
    backgroundColor: COLORS.textDark,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Warning Banner
  warningBanner: {
    flexDirection: "row",
    backgroundColor: COLORS.warningBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  successBanner: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.warning,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Order Info Card
  orderInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  orderInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 8,
  },
  orderInfoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  orderInfoBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  statusBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Refund Card
  refundCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  refundHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 8,
    backgroundColor: COLORS.primaryBg,
  },
  refundTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  refundBody: {
    padding: 16,
  },
  refundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refundLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  refundLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  refundLabelCharge: {
    fontSize: 14,
    color: COLORS.error,
  },
  refundValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  refundValueCharge: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.error,
  },
  refundDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
  },
  refundTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refundTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  refundTotalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.success,
  },
  refundNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    gap: 8,
  },
  refundNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Reason Card
  reasonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  reasonSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  reasonOptions: {
    gap: 10,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  reasonOptionSelected: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  reasonRadioSelected: {
    borderColor: COLORS.primary,
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  reasonTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  otherInput: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.divider,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Bottom Container
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 12,
  },
  keepBookingBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  keepBookingText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  cancelBtn: {
    flex: 1.5,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelBtnDisabled: {
    opacity: 0.5,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
});