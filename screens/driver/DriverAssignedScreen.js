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
import ScreenWrapper from "../../components/ScreenWrapper";
import { API_BASE_URL } from "../../config";

// ==================== DESIGN SYSTEM ====================
const C = {
  violet: "#3D2B8C",
  violetDark: "#2A1E6B",
  violetMid: "#4D3CA0",
  blue: "#1E40AF",
  blueDark: "#1E3A8A",
  blueDeep: "#172554",
  primarySoft: "#EEEAFB",
  primarySoftDeep: "#DCD4F5",
  lavenderBg: "#F1EEFB",
  primaryFade: "rgba(61,43,140,0.08)",
  primaryGlow: "rgba(61,43,140,0.30)",
  gold: "#F5C518",
  goldLight: "#FFD740",
  goldDark: "#C9A015",
  goldDeep: "#7A5C00",
  goldSoft: "#FEF7E0",
  bg: "#F7F7FA",
  card: "#FFFFFF",
  surface: "#F9FAFB",
  textDark: "#0F0F1F",
  textPrimary: "#1F1F33",
  textMid: "#4A4A66",
  textLight: "#7B7B95",
  textFaint: "#A8A8BC",
  border: "#EDEDF2",
  borderMid: "#DDDDE5",
  divider: "#E8E8EE",
  pastelBlue: "#E3F0FF",
  blueAccent: "#3B82F6",
  pastelGreen: "#E8F5E9",
  green: "#34A853",
  greenDark: "#16A34A",
  pastelOrange: "#FFE8D6",
  orange: "#F59E0B",
  pastelRed: "#FEE2E2",
  red: "#EF4444",
  success: "#22C55E",
  successBg: "#E8F8EF",
  successDark: "#16A34A",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  white: "#FFFFFF",
  shadow: "#0F0F1F",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary: [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  gold: [C.goldLight, C.gold, C.goldDark],
  goldShine: [C.goldLight, C.gold],
  lavender: [C.primarySoft, C.lavenderBg],
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

// ==================== MAIN COMPONENT ====================
export default function DriverArrivedScreen({ route, navigation }) {
  const {
    orderId,
    otp: otpParam,
    driver: driverParam,
    orderData: initialOrderData,
  } = route.params || {};

  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState(initialOrderData || null);
  const [loading, setLoading] = useState(!initialOrderData);

  // ── Animations ──
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const otpAnim = useRef(new Animated.Value(0)).current;
  const goldPulse = useRef(new Animated.Value(1)).current;
  const successPing = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const runAnimations = () => {
    Animated.sequence([
      Animated.parallel([
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
      ]),
      Animated.spring(otpAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Gold pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(goldPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Success ping loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(successPing, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(successPing, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // ── Fetch order ──
  useEffect(() => {
    if (initialOrderData) {
      runAnimations();
      return;
    }
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      const data = await res.json();
      setOrder(data);
      setLoading(false);
      runAnimations();
    } catch (err) {
      console.log("Fetch order error:", err);
      setLoading(false);
    }
  };

  // ── Polling ──
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);

        if (data.status === "in_progress") {
          clearInterval(interval);
          navigation.replace("LiveRideScreen", { orderId });
        }
        if (data.status === "cancelled") {
          clearInterval(interval);
          Alert.alert("Booking Cancelled", "Your booking was cancelled.", [
            { text: "OK", onPress: () => navigation.navigate("HomeTabs") },
          ]);
        }
      } catch (err) {
        console.log("Poll error:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  // ── Handlers ──
  const handleCall = () => {
    const phone =
      driverParam?.phone || order?.driver?.phone || order?.driver_phone;
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
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
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

  // ── Loading ──
  if (loading) {
    return (
      <ScreenWrapper backgroundColor={C.bg}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <LinearGradient colors={GRAD.primary} style={styles.loaderIconWrap}>
              <Ionicons name="car-sport" size={32} color={C.white} />
            </LinearGradient>
            <ActivityIndicator
              size="large"
              color={C.violet}
              style={{ marginTop: SP.xl }}
            />
            <Text style={styles.loaderTitle}>Loading ride details...</Text>
            <Text style={styles.loaderSub}>Please wait a moment</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ── Derived data ──
  const otp = otpParam || order?.otp;
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

  const price = parseFloat(order?.customer_total || order?.price || 0);
  const payMethod = order?.payment_method || "cash";

  // ==================== RENDER ====================
  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.white}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        {/* Left: Cancel button */}
        <TouchableOpacity style={styles.headerBackBtn} onPress={handleCancel}>
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>

        {/* Center: title + LIVE badge */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Driver Arrived</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Right: Help */}
        <TouchableOpacity style={styles.helpPill}>
          <Ionicons name="headset" size={15} color={C.violet} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HERO SECTION ── */}
        <Animated.View
          style={[
            styles.heroSection,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          {/* Pulsing background ring */}
          <Animated.View
            style={[
              styles.heroRingOuter,
              { transform: [{ scale: successPing }] },
            ]}
          />

          {/* Gradient circle with checkmark */}
          <LinearGradient
            colors={GRAD.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCircle}
          >
            <View style={styles.heroCircleDecor} />
            <Ionicons name="location" size={40} color={C.white} />
          </LinearGradient>

          <Text style={styles.heroTitle}>Driver Arrived! 🎉</Text>
          <Text style={styles.heroSubtitle}>
            Share the OTP to start your ride
          </Text>

          {/* Fare + payment badge */}
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="checkmark-circle" size={14} color={C.success} />
              <Text style={styles.heroBadgeText}>
                {formatCurrency(price)}{" "}
                {payMethod === "cash" ? "· Pay Cash" : "· Pay Online"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── OTP CARD ── */}
        <Animated.View
          style={[
            styles.otpCard,
            {
              opacity: otpAnim,
              transform: [
                {
                  translateY: otpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Card header */}
          <LinearGradient
            colors={GRAD.lavender}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.otpCardHeader}
          >
            <View style={styles.otpCardHeaderIcon}>
              <Ionicons name="key" size={14} color={C.violet} />
            </View>
            <Text style={styles.otpCardHeaderTitle}>Your OTP Code</Text>
            <View style={styles.otpSecureBadge}>
              <Ionicons name="shield-checkmark" size={11} color={C.success} />
              <Text style={styles.otpSecureText}>Secure</Text>
            </View>
          </LinearGradient>

          {/* OTP digits */}
          <View style={styles.otpBody}>
            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <LinearGradient
                  key={index}
                  colors={GRAD.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.otpBox}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                </LinearGradient>
              ))}
            </View>
            <Text style={styles.otpHint}>
              Share this code with your driver to begin
            </Text>
          </View>
        </Animated.View>

        {/* ── DRIVER CARD ── */}
        <Animated.View
          style={[
            styles.driverCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Gradient avatar */}
          <LinearGradient colors={GRAD.primary} style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {driverName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.driverVehicle}>{vehicle}</Text>
            <View style={styles.driverRatingRow}>
              <Ionicons name="star" size={12} color={C.gold} />
              <Text style={styles.driverRating}>4.9</Text>
              <View style={styles.ratingDivider} />
              <Text style={styles.driverTrips}>150+ rides</Text>
            </View>
          </View>

          <View style={styles.driverActions}>
            {/* Call button */}
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={18} color={C.white} />
            </TouchableOpacity>
            {/* Message button */}
            <TouchableOpacity style={styles.msgBtn}>
              <Ionicons name="chatbubble-ellipses" size={16} color={C.violet} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── PAYMENT SUMMARY CARD ── */}
        <Animated.View
          style={[
            styles.paymentCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Card header */}
          <LinearGradient
            colors={GRAD.lavender}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.paymentCardHeader}
          >
            <View style={styles.paymentCardHeaderIcon}>
              <Ionicons name="receipt" size={14} color={C.violet} />
            </View>
            <Text style={styles.paymentCardTitle}>Payment Summary</Text>
          </LinearGradient>

          {/* Payment strip: 2 columns */}
          <View style={styles.paymentStrip}>
            <View style={styles.paymentStripItem}>
              <View style={styles.paymentStripLabel}>
                <Ionicons
                  name="car-sport-outline"
                  size={13}
                  color={C.textLight}
                />
                <Text style={styles.paymentStripLabelText}>Total Fare</Text>
              </View>
              <Text style={[styles.paymentStripValue, { color: C.violet }]}>
                {formatCurrency(price)}
              </Text>
            </View>

            <View style={styles.paymentStripDivider} />

            <View style={styles.paymentStripItem}>
              <View style={styles.paymentStripLabel}>
                <Ionicons
                  name={
                    payMethod === "cash" ? "cash-outline" : "card-outline"
                  }
                  size={13}
                  color={C.textLight}
                />
                <Text style={styles.paymentStripLabelText}>Payment</Text>
              </View>
              <Text style={[styles.paymentStripValue, { color: C.textDark }]}>
                {payMethod === "cash" ? "Pay Cash" : "Pay Online"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── WHAT'S NEXT STEPS CARD ── */}
        <Animated.View
          style={[
            styles.stepsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.stepsCardHeader}>
            <View style={styles.stepsCardIcon}>
              <Ionicons name="list" size={14} color={C.violet} />
            </View>
            <Text style={styles.stepsCardTitle}>What's Next?</Text>
          </View>

          {[
            {
              num: "1",
              label: "Share OTP",
              desc: "Give the 4-digit OTP to your driver for verification",
              active: true,
            },
            {
              num: "2",
              label: "Ride Begins",
              desc: "Your ride will start after OTP verification",
              active: false,
            },
            {
              num: "3",
              label: "Track Live",
              desc: "Track your ride in real-time on the map",
              active: false,
            },
          ].map((step, index) => (
            <View key={step.num} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                {step.active ? (
                  <LinearGradient
                    colors={GRAD.primary}
                    style={styles.stepNumActive}
                  >
                    <Text style={styles.stepNumActiveText}>{step.num}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.stepNumInactive}>
                    <Text style={styles.stepNumInactiveText}>{step.num}</Text>
                  </View>
                )}
                {index < 2 && <View style={styles.stepConnector} />}
              </View>

              <View style={styles.stepContent}>
                <View style={styles.stepContentHeader}>
                  <Text
                    style={[
                      styles.stepLabel,
                      !step.active && styles.stepLabelInactive,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {step.active && (
                    <View style={styles.stepNowBadge}>
                      <View style={styles.stepNowDot} />
                      <Text style={styles.stepNowText}>NOW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── CANCEL WARNING ── */}
        <Animated.View
          style={[
            styles.cancelWarning,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[C.warningBg, "#FEFCE8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="warning-outline" size={16} color={C.warning} />
          <Text style={styles.cancelWarningText}>
            Cancellation charges may apply as your driver has arrived
          </Text>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({

  // ─── Loader ───
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
  },
  loaderCard: {
    backgroundColor: C.white,
    borderRadius: R.xl,
    padding: SP.xxxl,
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    width: "75%",
  },
  loaderIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
    marginTop: SP.lg,
    letterSpacing: -0.3,
  },
  loaderSub: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: "500",
    marginTop: SP.xs,
  },

  // ─── Header ───
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SP.md,
    paddingBottom: SP.md,
    paddingHorizontal: SP.lg,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.3,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.textDark,
    paddingHorizontal: SP.sm + 2,
    paddingVertical: 3,
    borderRadius: R.full,
    marginTop: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.success,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.8,
  },
  helpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SP.md,
    paddingVertical: 8,
    borderRadius: R.full,
    backgroundColor: C.primarySoft,
  },
  helpText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.violet,
  },

  // ─── Scroll ───
  scrollContent: {
    paddingHorizontal: SP.lg,
    paddingTop: SP.xl,
    paddingBottom: SP.xxxl,
    alignItems: "center",
  },

  // ─── Hero ───
  heroSection: {
    alignItems: "center",
    marginBottom: SP.xl,
    position: "relative",
    width: "100%",
  },
  heroRingOuter: {
    position: "absolute",
    top: -16,
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: C.primarySoft,
  },
  heroCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: SP.lg,
  },
  heroCircleDecor: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.5,
    marginBottom: SP.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: C.textLight,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: SP.md,
  },
  heroBadgeRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
    backgroundColor: C.successBg,
    paddingHorizontal: SP.md,
    paddingVertical: 6,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.success + "30",
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.successDark,
  },

  // ─── OTP Card ───
  otpCard: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: R.lg,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  otpCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  otpCardHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  otpCardHeaderTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: C.violet,
  },
  otpSecureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.successBg,
    paddingHorizontal: SP.sm,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  otpSecureText: {
    fontSize: 9,
    fontWeight: "700",
    color: C.successDark,
  },
  otpBody: {
    padding: SP.xl,
    alignItems: "center",
  },
  otpRow: {
    flexDirection: "row",
    gap: SP.sm,
    marginBottom: SP.md,
  },
  otpBox: {
    width: 58,
    height: 66,
    borderRadius: R.md,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  otpDigit: {
    fontSize: 28,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -1,
  },
  otpHint: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
    textAlign: "center",
  },

  // ─── Driver Card ───
  driverCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: SP.lg,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SP.md,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  driverAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: C.white,
  },
  driverInfo: { flex: 1 },
  driverName: {
    fontSize: 15,
    fontWeight: "800",
    color: C.textDark,
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
    marginBottom: 4,
  },
  driverRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverRating: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textDark,
  },
  ratingDivider: {
    width: 1,
    height: 10,
    backgroundColor: C.borderMid,
  },
  driverTrips: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: "500",
  },
  driverActions: {
    gap: SP.sm,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.violet,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  msgBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Payment Card ───
  paymentCard: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: R.lg,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  paymentCardHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.violet,
  },
  paymentStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
  },
  paymentStripItem: {
    flex: 1,
    alignItems: "center",
  },
  paymentStripLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  paymentStripLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textLight,
  },
  paymentStripValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  paymentStripDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.borderMid,
  },

  // ─── Steps Card ───
  stepsCard: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: SP.lg,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    marginBottom: SP.lg,
  },
  stepsCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  stepsCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.textDark,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SP.sm,
  },
  stepLeft: {
    alignItems: "center",
    marginRight: SP.md,
    width: 24,
  },
  stepNumActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  stepNumActiveText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.white,
  },
  stepNumInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.borderMid,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumInactiveText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textLight,
  },
  stepConnector: {
    width: 2,
    height: 22,
    backgroundColor: C.border,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: SP.md,
  },
  stepContentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textDark,
  },
  stepLabelInactive: {
    color: C.textLight,
    fontWeight: "600",
  },
  stepNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.primarySoft,
    paddingHorizontal: SP.sm,
    paddingVertical: 2,
    borderRadius: R.full,
  },
  stepNowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.violet,
  },
  stepNowText: {
    fontSize: 9,
    fontWeight: "800",
    color: C.violet,
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
    lineHeight: 16,
  },

  // ─── Cancel Warning ───
  cancelWarning: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    borderRadius: R.md,
    padding: SP.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.warning + "30",
    marginBottom: SP.md,
  },
  cancelWarningText: {
    flex: 1,
    fontSize: 12,
    color: C.warning,
    fontWeight: "600",
    lineHeight: 17,
  },

  // ─── Bottom Bar ───
  bottomBar: {
    paddingTop: SP.md,
    paddingBottom: Platform.OS === "ios" ? SP.lg : SP.lg,
    paddingHorizontal: SP.lg,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },
  cancelGoldBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gold,
    paddingVertical: SP.md + 2,
    borderRadius: R.full,
    gap: SP.sm,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelGoldBtnIconLeft: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelGoldBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: 0.3,
  },
  cancelGoldBtnIconRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelNote: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textLight,
    marginTop: SP.sm,
    textAlign: "center",
  },
});