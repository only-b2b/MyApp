// screens/carwash/FindingTechnicianScreen.js

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { API_BASE_URL } from "../../config";
import Ionicons from "@expo/vector-icons/Ionicons";

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  orange: "#FF6B00",
  orangeLight: "#FFB347",
  dark: "#1C1C1E",
  muted: "#6B7280",
  bg: "#F5F6F8",
  white: "#FFFFFF",
  success: "#10B981",
  successBg: "#ECFDF5",
  error: "#EF4444",
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export default function FindingTechnicianScreen({ route, navigation }) {
  const { 
    orderId, 
    serviceType, 
    advancePaid,
    totalAmount,
    remainingAmount,
  } = route.params;
  
  const [searchTime, setSearchTime] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isCarWash = serviceType === "car_wash";
  const primaryColor = isCarWash ? COLORS.primary : COLORS.orange;

  // Pulse Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Rotate Animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Search Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling for order status
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        if (data.status === "accepted") {
          clearInterval(pollInterval);
          
          // Pass all payment info to next screen
          const paymentInfo = {
            advancePaid: advancePaid || data.advance_amount,
            totalAmount: totalAmount || data.price,
            remainingAmount: remainingAmount || (data.price - (data.advance_amount || 0)),
          };
          
          if (isCarWash) {
            navigation.replace("TechnicianEnRouteScreen", { 
              orderId,
              technician: data.driver,
              ...paymentInfo,
            });
          } else {
            navigation.replace("DriverAcceptedScreen", { 
              order: data,
              ...paymentInfo,
            });
          }
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Cancel - Navigate to CancelBookingScreen
  const handleCancelPress = () => {
    // At this stage (before technician accepts), full refund is available
    Alert.alert(
      "Cancel Booking?",
      "You will receive a full refund as no technician has been assigned yet.",
      [
        { text: "No, Wait", style: "cancel" },
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

  // Quick Cancel (for "requested" status - full refund)
  const handleQuickCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/refunds/cancel/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason: "User cancelled while searching for technician",
          cancelled_by: "user",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Navigate to refund status screen
        navigation.replace("RefundStatusScreen", {
          orderId,
          refund: data.refund,
          orderDetails: {
            packageName: "Car Wash Service",
            advancePaid,
            totalAmount,
          },
        });
      } else {
        throw new Error(data.error || "Failed to cancel");
      }
    } catch (err) {
      console.log("Cancel error:", err);
      Alert.alert("Error", err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Payment Confirmed Badge */}
      {advancePaid && (
        <View style={styles.paymentBadge}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.paymentBadgeText}>
            {formatCurrency(advancePaid)} Advance Paid
          </Text>
        </View>
      )}

      {/* Animated Circles */}
      <View style={styles.circlesContainer}>
        <Animated.View 
          style={[
            styles.circle, 
            styles.circleOuter,
            { 
              transform: [{ scale: pulseAnim }],
              borderColor: primaryColor,
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.circle, 
            styles.circleMiddle,
            { borderColor: primaryColor }
          ]} 
        />
        <Animated.View 
          style={[
            styles.circle, 
            styles.circleInner,
            { backgroundColor: `${primaryColor}15` }
          ]} 
        />
        
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <View style={[styles.iconContainer, { backgroundColor: primaryColor }]}>
            <Ionicons 
              name={isCarWash ? "water" : "car-sport"} 
              size={40} 
              color={COLORS.white} 
            />
          </View>
        </Animated.View>
      </View>

      {/* Status Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isCarWash ? "Finding Technician..." : "Finding Driver..."}
        </Text>
        <Text style={styles.subtitle}>
          Searching for nearby {isCarWash ? "car wash experts" : "professionals"}
        </Text>
        
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.muted} />
          <Text style={styles.timerText}>Searching for {formatTime(searchTime)}</Text>
        </View>
      </View>

      <ActivityIndicator size="small" color={primaryColor} style={{ marginTop: 20 }} />

      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Did you know?</Text>
        <Text style={styles.tipsText}>
          {isCarWash 
            ? "Same driver will pick up your car, wait during wash, and deliver it back!"
            : "All our drivers are verified and background checked."
          }
        </Text>
        
        {/* Refund Info */}
        <View style={styles.refundInfo}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
          <Text style={styles.refundInfoText}>
            Full refund available if cancelled now
          </Text>
        </View>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity 
        style={styles.cancelBtn}
        onPress={handleQuickCancel}
        activeOpacity={0.7}
        disabled={isCancelling}
      >
        {isCancelling ? (
          <ActivityIndicator size="small" color={COLORS.error} />
        ) : (
          <Text style={styles.cancelText}>Cancel & Get Full Refund</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  paymentBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.success,
  },
  circlesContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
  },
  circleOuter: {
    width: 200,
    height: 200,
    borderWidth: 1,
    opacity: 0.3,
  },
  circleMiddle: {
    width: 150,
    height: 150,
    borderWidth: 2,
    opacity: 0.5,
  },
  circleInner: {
    width: 100,
    height: 100,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
  },
  timerText: {
    marginLeft: 6,
    color: COLORS.muted,
    fontSize: 13,
  },
  tipsContainer: {
    position: "absolute",
    bottom: 130,
    backgroundColor: COLORS.bg,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
  tipsTitle: {
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  tipsText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  refundInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 6,
  },
  refundInfoText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "500",
  },
  cancelBtn: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.error,
    fontWeight: "700",
    fontSize: 15,
  },
});