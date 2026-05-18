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
  InteractionManager,
} from "react-native";
import { API_BASE_URL } from "../../config";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import ScreenWrapper from "../../components/ScreenWrapper";

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
  success: "#22C55E", successBg: "#E8F8EF", successDark: "#16A34A",
  warning: "#F59E0B", warningBg: "#FFFBEB",
  error: "#EF4444", errorBg: "#FEF2F2", errorDark: "#DC2626",
  white: "#FFFFFF", shadow: "#0F0F1F",
};
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R  = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };
const GRAD = {
  primary:     [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  gold:        [C.goldLight, C.gold, C.goldDark],
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function FindingTechnicianScreen({ route, navigation }) {
  const { orderId, serviceType, advancePaid, totalAmount, remainingAmount } = route.params;

  const isCarWash = serviceType === "car_wash";

  const [searchTime,   setSearchTime]   = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const goldPulse  = useRef(new Animated.Value(1)).current;
  const ring1Anim  = useRef(new Animated.Value(0.4)).current;
  const ring2Anim  = useRef(new Animated.Value(0.6)).current;

  // ── Entrance ──
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Pulse ──
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  // ── Rotate ──
  useEffect(() => {
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })).start();
  }, []);

  // ── Ripple rings ──
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(ring1Anim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      Animated.timing(ring1Anim, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(700),
      Animated.timing(ring2Anim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      Animated.timing(ring2Anim, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
    ])).start();
  }, []);

  // ── Gold pulse ──
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(goldPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
      Animated.timing(goldPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
    ])).start();
  }, []);

  // ── Timer ──
  useEffect(() => {
    const timer = setInterval(() => setSearchTime(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Poll for accepted status ──
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        if (data.status === "accepted") {
          clearInterval(pollInterval);

          // ✅ Build safe technician from fresh data
          const safeTechnician = data.driver ? {
            id:        Number(data.driver.id)          || null,
            full_name: String(data.driver.full_name    || ""),
            phone:     String(data.driver.phone        || ""),
            vehicle:   String(data.driver.vehicle      || ""),
            rating:    Number(data.driver.rating)      || 0,
          } : null;

          const paymentInfo = {
            advancePaid:     Number(advancePaid     || data.advance_amount || 0),
            totalAmount:     Number(totalAmount     || data.price          || 0),
            remainingAmount: Number(remainingAmount || (data.price - (data.advance_amount || 0)) || 0),
          };

          // ✅ InteractionManager prevents _tracking error
          InteractionManager.runAfterInteractions(() => {
            if (serviceType === "car_wash") {
              navigation.replace("TechnicianEnRouteScreen", {
                orderId,
                technician: safeTechnician,
                serviceType,
                ...paymentInfo,
              });
            } else {
              navigation.replace("DriverAcceptedScreen", {
                orderId,
                serviceType,
                ...paymentInfo,
              });
            }
          });
        }
      } catch (err) {
        console.log("Polling error:", err.message);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId, serviceType]);

  const handleCancelPress = () => {
    Alert.alert(
      "Cancel Booking?",
      "You will receive a full refund as no technician has been assigned yet.",
      [
        { text: "No, Wait", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: handleQuickCancel },
      ]
    );
  };

  const handleQuickCancel = async () => {
    setIsCancelling(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/refunds/cancel/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User cancelled while searching for technician", cancelled_by: "user" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigation.replace("RefundStatusScreen", {
          orderId,
          refund: data.refund,
          orderDetails: { packageName: "Car Wash Service", advancePaid, totalAmount },
        });
      } else {
        throw new Error(data.error || "Failed to cancel");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <ScreenWrapper backgroundColor={C.white} statusBarStyle="dark-content" statusBarBg={C.white}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleCancelPress} disabled={isCancelling}>
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isCarWash ? "Finding Technician" : "Finding Driver"}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtnHelp}>
          <Ionicons name="headset" size={15} color={C.violet} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Payment Badge */}
        {!!advancePaid && (
          <View style={styles.paymentBadge}>
            <View style={styles.paymentBadgeIcon}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
            </View>
            <Text style={styles.paymentBadgeText}>{formatCurrency(advancePaid)} Advance Paid</Text>
          </View>
        )}

        {/* Radar */}
        <View style={styles.radarWrapper}>
          <Animated.View style={[styles.ring, styles.ringOuter,    { opacity: ring1Anim }]} />
          <Animated.View style={[styles.ring, styles.ringMiddle,   { opacity: ring2Anim }]} />
          <Animated.View style={[styles.ring, styles.ringRotating, { transform: [{ rotate: rotation }] }]} />
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
              <View style={styles.iconDecor} />
              <Ionicons name={isCarWash ? "water" : "car-sport"} size={38} color={C.white} />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>{isCarWash ? "Finding Technician..." : "Finding Driver..."}</Text>
          <Text style={styles.statusSubtitle}>Searching for nearby {isCarWash ? "car wash experts" : "verified professionals"}</Text>

          {/* Timer chip */}
          <View style={styles.timerChip}>
            <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.timerDot} />
            <Ionicons name="time-outline" size={14} color={C.violet} />
            <Text style={styles.timerText}>Searching for {formatTime(searchTime)}</Text>
          </View>

          <ActivityIndicator size="small" color={C.violet} style={{ marginTop: SP.md }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.infoCardHeader}>
            <LinearGradient colors={GRAD.primary} style={styles.infoCardIconWrap}>
              <Ionicons name="bulb" size={14} color={C.white} />
            </LinearGradient>
            <Text style={styles.infoCardTitle}>Did you know?</Text>
          </View>
          <Text style={styles.infoCardText}>
            {isCarWash
              ? "The same driver picks up your car, waits during the wash, and delivers it back — fully tracked!"
              : "All our drivers are verified, background-checked, and rated by other customers."}
          </Text>
          <View style={styles.infoCardDivider} />
          <View style={styles.refundRow}>
            <View style={styles.refundIconWrap}><Ionicons name="shield-checkmark" size={14} color={C.success} /></View>
            <Text style={styles.refundText}>Full refund available if you cancel now</Text>
          </View>
        </View>

        {/* Payment Strip */}
        {!!totalAmount && (
          <View style={styles.paymentStrip}>
            <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.paymentStripItem}>
              <Text style={styles.paymentStripLabel}>Advance Paid</Text>
              <Text style={styles.paymentStripValue}>{formatCurrency(advancePaid)}</Text>
            </View>
            <View style={styles.paymentStripDivider} />
            <View style={styles.paymentStripItem}>
              <Text style={styles.paymentStripLabel}>Remaining</Text>
              <Text style={[styles.paymentStripValue, { color: C.textLight }]}>{formatCurrency(remainingAmount)}</Text>
            </View>
            <View style={styles.paymentStripDivider} />
            <View style={styles.paymentStripItem}>
              <Text style={styles.paymentStripLabel}>Total</Text>
              <Text style={[styles.paymentStripValue, { color: C.violet }]}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: goldPulse }] }}>
          <TouchableOpacity
            style={[styles.cancelBtn, isCancelling && styles.cancelBtnDisabled]}
            onPress={handleCancelPress}
            disabled={isCancelling}
            activeOpacity={0.85}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color={C.textDark} />
            ) : (
              <>
                <View style={styles.cancelBtnIconLeft}><Ionicons name="close" size={16} color={C.textDark} /></View>
                <Text style={styles.cancelBtnText}>Cancel & Get Full Refund</Text>
                <View style={styles.cancelBtnIconRight}><Ionicons name="arrow-forward" size={14} color={C.textDark} /></View>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.cancelNote}>No cancellation charge at this stage</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SP.md, paddingBottom: SP.md, paddingHorizontal: SP.lg, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  headerBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: "center", alignItems: "center" },
  headerCenter:  { alignItems: "center", flex: 1 },
  headerTitle:   { fontSize: 16, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  liveBadge:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.textDark, paddingHorizontal: SP.sm + 2, paddingVertical: 3, borderRadius: R.full, marginTop: 4 },
  liveDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: C.success },
  liveText:      { fontSize: 9, fontWeight: "800", color: C.white, letterSpacing: 0.8 },
  headerBtnHelp: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: SP.md, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.primarySoft },
  helpText:      { fontSize: 12, fontWeight: "700", color: C.violet },

  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SP.lg, paddingBottom: SP.xxl },

  paymentBadge:     { flexDirection: "row", alignItems: "center", gap: SP.sm, backgroundColor: C.successBg, paddingHorizontal: SP.lg, paddingVertical: SP.sm, borderRadius: R.full, marginBottom: SP.sm, borderWidth: 1, borderColor: C.success + "30", shadowColor: C.success, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  paymentBadgeIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  paymentBadgeText: { fontSize: 13, fontWeight: "700", color: C.successDark },

  radarWrapper: { width: 220, height: 220, alignItems: "center", justifyContent: "center", marginBottom: SP.xl },
  ring:         { position: "absolute", borderRadius: R.full },
  ringOuter:    { width: 220, height: 220, borderWidth: 1.5, borderColor: C.violet },
  ringMiddle:   { width: 165, height: 165, borderWidth: 2,   borderColor: C.violet },
  ringRotating: { width: 130, height: 130, borderWidth: 2,   borderColor: C.violet, borderStyle: "dashed", opacity: 0.4 },
  iconWrapper:  { shadowColor: C.violet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  iconGradient: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 3, borderColor: "rgba(255,255,255,0.2)" },
  iconDecor:    { position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)" },

  statusSection:  { alignItems: "center", marginBottom: SP.xl },
  statusTitle:    { fontSize: 24, fontWeight: "900", color: C.textDark, letterSpacing: -0.5 },
  statusSubtitle: { fontSize: 14, color: C.textLight, marginTop: SP.xs, fontWeight: "500", textAlign: "center" },
  timerChip:      { flexDirection: "row", alignItems: "center", gap: SP.xs, borderRadius: R.full, paddingHorizontal: SP.lg, paddingVertical: SP.sm, marginTop: SP.md, overflow: "hidden" },
  timerDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.violet },
  timerText:      { fontSize: 13, fontWeight: "700", color: C.violet },

  infoCard:       { width: "100%", borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.violet + "20", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: SP.sm, marginBottom: SP.sm },
  infoCardIconWrap:{ width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  infoCardTitle:  { fontSize: 14, fontWeight: "800", color: C.violet },
  infoCardText:   { fontSize: 13, color: C.textMid, lineHeight: 19, fontWeight: "500" },
  infoCardDivider:{ height: 1, backgroundColor: C.violet + "20", marginVertical: SP.md },
  refundRow:      { flexDirection: "row", alignItems: "center", gap: SP.sm },
  refundIconWrap: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  refundText:     { fontSize: 12, fontWeight: "700", color: C.successDark },

  paymentStrip:        { width: "100%", flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  paymentStripItem:    { flex: 1, alignItems: "center" },
  paymentStripLabel:   { fontSize: 10, fontWeight: "600", color: C.textLight, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  paymentStripValue:   { fontSize: 14, fontWeight: "800", color: C.textDark },
  paymentStripDivider: { width: 1, height: 32, backgroundColor: C.borderMid },

  bottomBar:          { paddingTop: SP.md, paddingBottom: Platform.OS === "ios" ? SP.lg : SP.lg, paddingHorizontal: SP.lg, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, alignItems: "center", shadowColor: C.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20 },
  cancelBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.gold, paddingVertical: SP.md + 2, paddingHorizontal: SP.xl, borderRadius: R.full, gap: SP.sm, shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, minWidth: "85%" },
  cancelBtnDisabled:  { backgroundColor: C.borderMid, shadowOpacity: 0, opacity: 0.6 },
  cancelBtnIconLeft:  { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  cancelBtnText:      { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: 0.3 },
  cancelBtnIconRight: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  cancelNote:         { fontSize: 11, fontWeight: "600", color: C.textLight, marginTop: SP.sm, textAlign: "center" },
});