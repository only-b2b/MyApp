// screens/carwash/TechnicianArrivedScreen.js

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../../config";
import ScreenWrapper from "../../components/ScreenWrapper";

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
  success: "#22C55E", successBg: "#E8F8EF", successDark: "#16A34A",
  warning: "#F59E0B", warningBg: "#FFFBEB", warningDark: "#D97706",
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

export default function TechnicianArrivedScreen({ route, navigation }) {
  const {
    orderId,
    technician,
    otp,
    advancePaid,
    totalAmount,
    remainingAmount,
  } = route.params;

  // ── Animations ──
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const otpAnim     = useRef(new Animated.Value(0)).current;
  const goldPulse   = useRef(new Animated.Value(1)).current;
  const successPing = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(otpAnim,   { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(goldPulse,   { toValue: 1.02, duration: 1500, useNativeDriver: true }),
      Animated.timing(goldPulse,   { toValue: 1,    duration: 1500, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(successPing, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
      Animated.timing(successPing, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  // ── Poll for in_progress ──
  // ✅ WHY THIS WORKS: We pass `data.driver || technician` directly.
  // This is a frozen pg object BUT WashInProgressScreen is the
  // FINAL screen that uses technician only for display (name/initial).
  // It never passes technician forward in navigation, so _tracking
  // never fails on it.
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
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
        console.log("Polling error:", err.message);
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [orderId]);

  const handleCall = () => {
    if (technician?.phone) Linking.openURL(`tel:${technician.phone}`);
  };

  const handleCancelPress = () => {
    const cancellationCharge = Math.round((advancePaid || 0) * 0.05);
    const refundAmount       = (advancePaid || 0) - cancellationCharge;
    Alert.alert(
      "Cancel Booking?",
      `The technician has already arrived. A 5% charge applies.\n\nCharge: ${formatCurrency(cancellationCharge)}\nRefund: ${formatCurrency(refundAmount)}`,
      [
        { text: "No, Continue", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => navigation.navigate("CancelBookingScreen", {
            orderId, advancePaid, totalAmount, remainingAmount,
          }),
        },
      ]
    );
  };

  const otpDigits = otp?.toString().split("") || ["–", "–", "–", "–"];

  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.white}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleCancelPress}>
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Technician Arrived</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <Animated.View style={[styles.heroSection, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.heroRingOuter, { transform: [{ scale: successPing }] }]} />
          <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCircle}>
            <View style={styles.heroDecor} />
            <Ionicons name="checkmark" size={44} color={C.white} />
          </LinearGradient>
          <Text style={styles.heroTitle}>Technician Arrived! 🎉</Text>
          <Text style={styles.heroSubtitle}>Share the OTP to start the service</Text>
          {!!advancePaid && (
            <View style={styles.advanceBadge}>
              <Ionicons name="checkmark-circle" size={14} color={C.success} />
              <Text style={styles.advanceBadgeText}>{formatCurrency(advancePaid)} Advance Paid</Text>
            </View>
          )}
        </Animated.View>

        {/* OTP CARD */}
        <Animated.View
          style={[styles.otpCard, {
            opacity: otpAnim,
            transform: [{ translateY: otpAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          }]}
        >
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.otpCardHeader}>
            <View style={styles.otpCardHeaderIcon}><Ionicons name="key" size={14} color={C.violet} /></View>
            <Text style={styles.otpCardHeaderTitle}>Your OTP Code</Text>
            <View style={styles.otpSecureBadge}>
              <Ionicons name="shield-checkmark" size={11} color={C.success} />
              <Text style={styles.otpSecureBadgeText}>Secure</Text>
            </View>
          </LinearGradient>
          <View style={styles.otpBody}>
            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <LinearGradient key={index} colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.otpBox}>
                  <Text style={styles.otpDigit}>{digit}</Text>
                </LinearGradient>
              ))}
            </View>
            <Text style={styles.otpHint}>Share this code with the technician to begin</Text>
          </View>
        </Animated.View>

        {/* TECHNICIAN CARD */}
        <Animated.View style={[styles.techCard, { opacity: fadeAnim }]}>
          <LinearGradient colors={GRAD.primary} style={styles.techAvatar}>
            <Text style={styles.techAvatarText}>{technician?.full_name?.charAt(0)?.toUpperCase() || "T"}</Text>
          </LinearGradient>
          <View style={styles.techInfo}>
            <Text style={styles.techName}>{technician?.full_name || "Technician"}</Text>
            <Text style={styles.techVehicle}>{technician?.vehicle || "Service Van"}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={C.gold} />
              <Text style={styles.ratingText}>4.9</Text>
              <View style={styles.ratingDivider} />
              <Text style={styles.tripCount}>150+ washes</Text>
            </View>
          </View>
          <View style={styles.techActions}>
            <TouchableOpacity style={styles.techCallBtn} onPress={handleCall}>
              <Ionicons name="call" size={18} color={C.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.techMsgBtn}>
              <Ionicons name="chatbubble-ellipses" size={16} color={C.violet} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* PAYMENT SUMMARY */}
        <Animated.View style={[styles.paymentCard, { opacity: fadeAnim }]}>
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.paymentCardHeader}>
            <View style={styles.paymentCardHeaderIcon}><Ionicons name="receipt" size={14} color={C.violet} /></View>
            <Text style={styles.paymentCardTitle}>Payment Summary</Text>
          </LinearGradient>
          <View style={styles.paymentStrip}>
            <View style={styles.paymentStripItem}>
              <View style={styles.paymentStripLabel}><Ionicons name="checkmark-circle" size={13} color={C.success} /><Text style={styles.paymentStripLabelText}>Paid</Text></View>
              <Text style={[styles.paymentStripValue, { color: C.successDark }]}>{formatCurrency(advancePaid)}</Text>
            </View>
            <View style={styles.paymentStripDivider} />
            <View style={styles.paymentStripItem}>
              <View style={styles.paymentStripLabel}><Ionicons name="time-outline" size={13} color={C.warning} /><Text style={styles.paymentStripLabelText}>After</Text></View>
              <Text style={[styles.paymentStripValue, { color: C.textDark }]}>{formatCurrency(remainingAmount)}</Text>
            </View>
            <View style={styles.paymentStripDivider} />
            <View style={styles.paymentStripItem}>
              <View style={styles.paymentStripLabel}><Ionicons name="receipt-outline" size={13} color={C.violet} /><Text style={styles.paymentStripLabelText}>Total</Text></View>
              <Text style={[styles.paymentStripValue, { color: C.violet }]}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* STEPS */}
        <Animated.View style={[styles.stepsCard, { opacity: fadeAnim }]}>
          <View style={styles.stepsCardHeader}>
            <View style={styles.stepsCardIcon}><Ionicons name="list" size={14} color={C.violet} /></View>
            <Text style={styles.stepsCardTitle}>What's Next?</Text>
          </View>
          {[
            { num: "1", label: "Share OTP",       desc: "Give the OTP to technician for verification",  active: true  },
            { num: "2", label: "Pre-wash Photos",  desc: "Technician captures your car's condition",     active: false },
            { num: "3", label: "Car Wash Begins",  desc: "Relax while we take care of your vehicle",    active: false },
          ].map((step, index) => (
            <View key={step.num} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                {step.active ? (
                  <LinearGradient colors={GRAD.primary} style={styles.stepNumActive}>
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
                  <Text style={[styles.stepLabel, !step.active && styles.stepLabelInactive]}>{step.label}</Text>
                  {step.active && (
                    <View style={styles.stepActiveBadge}>
                      <View style={styles.stepActiveDot} />
                      <Text style={styles.stepActiveBadgeText}>NOW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CANCEL WARNING */}
        <Animated.View style={[styles.cancelWarning, { opacity: fadeAnim }]}>
          <LinearGradient colors={[C.warningBg, "#FEFCE8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Ionicons name="warning-outline" size={16} color={C.warningDark} />
          <Text style={styles.cancelWarningText}>5% cancellation charge applies as technician has arrived</Text>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: goldPulse }], flex: 1 }}>
          <TouchableOpacity style={styles.cancelGoldBtn} onPress={handleCancelPress} activeOpacity={0.85}>
            <View style={styles.cancelGoldBtnIconLeft}><Ionicons name="close" size={16} color={C.textDark} /></View>
            <Text style={styles.cancelGoldBtnText}>Cancel Booking</Text>
            <View style={styles.cancelGoldBtnIconRight}><Ionicons name="arrow-forward" size={14} color={C.textDark} /></View>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.cancelNote}>5% charge applies at this stage</Text>
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

  scrollContent: { paddingHorizontal: SP.lg, paddingTop: SP.xl, paddingBottom: SP.xxxl, alignItems: "center" },

  heroSection:    { alignItems: "center", marginBottom: SP.xl, position: "relative" },
  heroRingOuter:  { position: "absolute", top: -16, width: 120, height: 120, borderRadius: 60, backgroundColor: C.primarySoft },
  heroCircle:     { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 3, borderColor: "rgba(255,255,255,0.3)", shadowColor: C.violet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10, marginBottom: SP.lg },
  heroDecor:      { position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)" },
  heroTitle:      { fontSize: 22, fontWeight: "900", color: C.textDark, letterSpacing: -0.5, marginBottom: SP.xs },
  heroSubtitle:   { fontSize: 14, color: C.textLight, fontWeight: "500", textAlign: "center" },
  advanceBadge:   { flexDirection: "row", alignItems: "center", gap: SP.xs, backgroundColor: C.successBg, paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: R.full, marginTop: SP.md, borderWidth: 1, borderColor: C.success + "30" },
  advanceBadgeText:{ fontSize: 12, fontWeight: "700", color: C.successDark },

  otpCard:           { width: "100%", backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  otpCardHeader:     { flexDirection: "row", alignItems: "center", gap: SP.sm, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  otpCardHeaderIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  otpCardHeaderTitle:{ flex: 1, fontSize: 13, fontWeight: "800", color: C.violet },
  otpSecureBadge:    { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.successBg, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  otpSecureBadgeText:{ fontSize: 9, fontWeight: "700", color: C.successDark },
  otpBody:           { padding: SP.xl, alignItems: "center" },
  otpRow:            { flexDirection: "row", gap: SP.sm, marginBottom: SP.md },
  otpBox:            { width: 58, height: 66, borderRadius: R.md, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  otpDigit:          { fontSize: 28, fontWeight: "900", color: C.white, letterSpacing: -1 },
  otpHint:           { fontSize: 12, color: C.textLight, fontWeight: "500", textAlign: "center" },

  techCard:       { width: "100%", flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  techAvatar:     { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginRight: SP.md, shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  techAvatarText: { fontSize: 20, fontWeight: "800", color: C.white },
  techInfo:       { flex: 1 },
  techName:       { fontSize: 15, fontWeight: "800", color: C.textDark },
  techVehicle:    { fontSize: 12, color: C.textLight, marginTop: 2, fontWeight: "500" },
  ratingRow:      { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText:     { fontSize: 12, fontWeight: "700", color: C.textDark },
  ratingDivider:  { width: 1, height: 10, backgroundColor: C.borderMid },
  tripCount:      { fontSize: 11, color: C.textLight, fontWeight: "500" },
  techActions:    { gap: SP.sm },
  techCallBtn:    { width: 42, height: 42, borderRadius: 21, backgroundColor: C.violet, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  techMsgBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center" },

  paymentCard:           { width: "100%", backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  paymentCardHeader:     { flexDirection: "row", alignItems: "center", gap: SP.sm, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  paymentCardHeaderIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  paymentCardTitle:      { fontSize: 13, fontWeight: "800", color: C.violet },
  paymentStrip:          { flexDirection: "row", alignItems: "center", paddingHorizontal: SP.lg, paddingVertical: SP.md },
  paymentStripItem:      { flex: 1, alignItems: "center" },
  paymentStripLabel:     { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  paymentStripLabelText: { fontSize: 10, fontWeight: "600", color: C.textLight },
  paymentStripValue:     { fontSize: 14, fontWeight: "800" },
  paymentStripDivider:   { width: 1, height: 32, backgroundColor: C.borderMid },

  stepsCard:          { width: "100%", backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, padding: SP.lg, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  stepsCardHeader:    { flexDirection: "row", alignItems: "center", gap: SP.sm, marginBottom: SP.lg },
  stepsCardIcon:      { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center" },
  stepsCardTitle:     { fontSize: 14, fontWeight: "800", color: C.textDark },
  stepRow:            { flexDirection: "row", alignItems: "flex-start", marginBottom: SP.sm },
  stepLeft:           { alignItems: "center", marginRight: SP.md, width: 24 },
  stepNumActive:      { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  stepNumActiveText:  { fontSize: 11, fontWeight: "800", color: C.white },
  stepNumInactive:    { width: 24, height: 24, borderRadius: 12, backgroundColor: C.white, borderWidth: 2, borderColor: C.borderMid, justifyContent: "center", alignItems: "center" },
  stepNumInactiveText:{ fontSize: 11, fontWeight: "700", color: C.textLight },
  stepConnector:      { width: 2, height: 22, backgroundColor: C.border, marginTop: 4 },
  stepContent:        { flex: 1, paddingTop: 3, paddingBottom: SP.md },
  stepContentHeader:  { flexDirection: "row", alignItems: "center", gap: SP.sm, marginBottom: 2 },
  stepLabel:          { fontSize: 13, fontWeight: "800", color: C.textDark },
  stepLabelInactive:  { color: C.textLight, fontWeight: "600" },
  stepActiveBadge:    { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.primarySoft, paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: R.full },
  stepActiveDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: C.violet },
  stepActiveBadgeText:{ fontSize: 9, fontWeight: "800", color: C.violet, letterSpacing: 0.5 },
  stepDesc:           { fontSize: 12, color: C.textLight, fontWeight: "500", lineHeight: 16 },

  cancelWarning:    { width: "100%", flexDirection: "row", alignItems: "center", gap: SP.sm, borderRadius: R.md, padding: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.warning + "30", marginBottom: SP.md },
  cancelWarningText:{ fontSize: 12, color: C.warningDark, fontWeight: "600", flex: 1 },

  bottomBar:            { paddingTop: SP.md, paddingBottom: Platform.OS === "ios" ? SP.lg : SP.lg, paddingHorizontal: SP.lg, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, alignItems: "center", shadowColor: C.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20 },
  cancelGoldBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.gold, paddingVertical: SP.md + 2, borderRadius: R.full, gap: SP.sm, shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  cancelGoldBtnIconLeft:{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  cancelGoldBtnText:    { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: 0.3 },
  cancelGoldBtnIconRight:{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  cancelNote:           { fontSize: 11, fontWeight: "600", color: C.textLight, marginTop: SP.sm, textAlign: "center" },
});