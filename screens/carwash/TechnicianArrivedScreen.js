// screens/carwash/TechnicianArrivedScreen.js

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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../../config";

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  dark: "#1C1C1E",
  muted: "#6B7280",
  white: "#FFFFFF",
  bg: "#F5F6F8",
  success: "#10B981",
  successBg: "#ECFDF5",
  error: "#EF4444",
  warning: "#F59E0B",
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export default function TechnicianArrivedScreen({ route, navigation }) {
  const { 
    orderId, 
    technician, 
    otp,
    advancePaid,
    totalAmount,
    remainingAmount,
  } = route.params;
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const otpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(otpAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Poll for status change
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        if (data.status === "in_progress") {
          clearInterval(pollInterval);
          navigation.replace("WashInProgressScreen", { 
            orderId,
            technician: data.driver || technician,
            advancePaid,
            totalAmount,
            remainingAmount,
          });
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  const handleCall = () => {
    if (technician?.phone) {
      Linking.openURL(`tel:${technician.phone}`);
    }
  };

  // Handle Cancel - 5% charge applies
  const handleCancelPress = () => {
    const cancellationCharge = Math.round((advancePaid || 0) * 0.05);
    const refundAmount = (advancePaid || 0) - cancellationCharge;

    Alert.alert(
      "Cancel Booking?",
      `The technician has already arrived. A 5% cancellation charge will apply.\n\nCancellation Charge: ${formatCurrency(cancellationCharge)}\nRefund Amount: ${formatCurrency(refundAmount)}`,
      [
        { text: "No, Continue", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            navigation.navigate("CancelBookingScreen", { 
              orderId,
              advancePaid,
              totalAmount,
              remainingAmount,
            });
          },
        },
      ]
    );
  };

  // Format OTP for display
  const otpDigits = otp?.toString().split("") || ["0", "0", "0", "0"];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        {/* Cancel Button */}
        <TouchableOpacity 
          style={styles.cancelHeaderBtn}
          onPress={handleCancelPress}
        >
          <Ionicons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.arrivedBadge,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.arrivedTitle}>Technician Arrived!</Text>
          <Text style={styles.arrivedSubtitle}>
            Share the OTP to start the service
          </Text>
        </Animated.View>

        {/* Payment Badge */}
        {advancePaid && (
          <View style={styles.paymentBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.paymentBadgeText}>
              {formatCurrency(advancePaid)} Advance Paid
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* OTP Display */}
        <Animated.View 
          style={[
            styles.otpContainer,
            { 
              opacity: otpAnim,
              transform: [{ 
                translateY: otpAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              }]
            }
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
            Share this code with the technician
          </Text>
        </Animated.View>

        {/* Technician Card */}
        <View style={styles.techCard}>
          <View style={styles.techAvatar}>
            <Text style={styles.techAvatarText}>
              {technician?.full_name?.charAt(0) || "T"}
            </Text>
          </View>
          <View style={styles.techInfo}>
            <Text style={styles.techName}>
              {technician?.full_name || "Technician"}
            </Text>
            <Text style={styles.techVehicle}>
              {technician?.vehicle || "Service Van"}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.callBtn}
            onPress={handleCall}
          >
            <Ionicons name="call" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Payment Summary</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLabelRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.paymentLabel}>Advance Paid</Text>
            </View>
            <Text style={[styles.paymentValue, { color: COLORS.success }]}>
              {formatCurrency(advancePaid)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLabelRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.warning} />
              <Text style={styles.paymentLabel}>After Service</Text>
            </View>
            <Text style={styles.paymentValue}>
              {formatCurrency(remainingAmount)}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>What's Next?</Text>
          
          <View style={styles.step}>
            <View style={[styles.stepNumber, styles.stepActive]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share OTP</Text>
              <Text style={styles.stepDesc}>
                Give the OTP to technician for verification
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={[styles.stepNumberText, { color: COLORS.muted }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: COLORS.muted }]}>
                Pre-wash Photos
              </Text>
              <Text style={styles.stepDesc}>
                Technician will capture photos of your car
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={[styles.stepNumberText, { color: COLORS.muted }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: COLORS.muted }]}>
                Car Wash Begins
              </Text>
              <Text style={styles.stepDesc}>
                Relax while we take care of your vehicle
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Note */}
        <View style={styles.cancelNote}>
          <Ionicons name="information-circle" size={16} color={COLORS.warning} />
          <Text style={styles.cancelNoteText}>
            5% cancellation charge applies after technician arrives
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  cancelHeaderBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrivedBadge: {
    alignItems: "center",
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  arrivedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
  },
  arrivedSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  otpContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: "row",
    gap: 12,
  },
  otpBox: {
    width: 56,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  otpDigit: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
  },
  otpHint: {
    marginTop: 16,
    fontSize: 13,
    color: COLORS.muted,
  },
  techCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  techAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  techAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  techInfo: {
    flex: 1,
    marginLeft: 12,
  },
  techName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  techVehicle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentLabel: {
    fontSize: 13,
    color: COLORS.dark,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },
  instructions: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 16,
  },
  step: {
    flexDirection: "row",
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  },
  cancelNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  cancelNoteText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
  },
});