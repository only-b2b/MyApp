// screens/TechnicianArrivedScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  dark: "#1C1C1E",
  muted: "#6B7280",
  white: "#FFFFFF",
  bg: "#F5F6F8",
  success: "#10B981",
};

export default function TechnicianArrivedScreen({ route, navigation }) {
  const { orderId, technician, otp } = route.params;
  
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
            technician: data.driver,
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

  // Format OTP for display
  const otpDigits = otp?.toString().split("") || ["0", "0", "0", "0"];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
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
            <Ionicons name="person" size={28} color={COLORS.primary} />
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
    marginBottom: 20,
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
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  techAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  techInfo: {
    flex: 1,
    marginLeft: 14,
  },
  techName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },
  techVehicle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  instructions: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 20,
  },
  step: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
    lineHeight: 18,
  },
});