// screens/OrderCompleteScreen.js

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatCurrency } from "../utils/paymentUtils";
import ScreenWrapper from "../components/ScreenWrapper";

// ==================== DESIGN SYSTEM ====================
const C = {
  violet: "#3D2B8C", violetDark: "#2A1E6B", violetMid: "#4D3CA0",
  blue: "#1E40AF",   blueDark: "#1E3A8A",   blueDeep: "#172554",
  primarySoft: "#EEEAFB", primarySoftDeep: "#DCD4F5", lavenderBg: "#F1EEFB",
  gold: "#F5C518", goldLight: "#FFD740", goldDark: "#C9A015",
  goldDeep: "#7A5C00", goldSoft: "#FEF7E0",
  bg: "#F7F7FA", card: "#FFFFFF", surface: "#F9FAFB",
  textDark: "#0F0F1F", textPrimary: "#1F1F33", textMid: "#4A4A66",
  textLight: "#7B7B95", textFaint: "#A8A8BC",
  border: "#EDEDF2", borderMid: "#DDDDE5", divider: "#E8E8EE",
  success: "#22C55E", successBg: "#E8F8EF", successDark: "#16A34A",
  warning: "#F59E0B", warningBg: "#FFFBEB", warningDark: "#D97706",
  error: "#EF4444", errorBg: "#FEF2F2", white: "#FFFFFF", shadow: "#0F0F1F",
};
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R  = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };
const GRAD = {
  primary:     [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  gold:        [C.goldLight, C.gold, C.goldDark],
  success:     [C.success, C.successDark],
};

export default function OrderCompleteScreen({ route, navigation }) {
  const {
    orderId,
    order,
    totalAmount,
    advancePaid,
    remainingAmount,
    rating,
  } = route.params;

  // ── Animations ──
  const scaleAnim    = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const goldPulse    = useRef(new Animated.Value(1)).current;
  const successPing  = useRef(new Animated.Value(1)).current;
  const confettiUp1  = useRef(new Animated.Value(0)).current;
  const confettiUp2  = useRef(new Animated.Value(0)).current;
  const confettiUp3  = useRef(new Animated.Value(0)).current;
  const shimmerAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Gold pulse CTA
    Animated.loop(Animated.sequence([
      Animated.timing(goldPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
      Animated.timing(goldPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
    ])).start();

    // Success ping ring
    Animated.loop(Animated.sequence([
      Animated.timing(successPing, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
      Animated.timing(successPing, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();

    // Confetti particles
    const launchConfetti = (anim, delay) => {
      setTimeout(() => {
        Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
        ])).start();
      }, delay);
    };
    launchConfetti(confettiUp1, 0);
    launchConfetti(confettiUp2, 400);
    launchConfetti(confettiUp3, 800);

    // Shimmer on total
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just got my car washed with Motors! Great service and my car looks brand new. Use my referral code to get 10% off your first wash!`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "HomeTabs" }],
    });
  };

  const getRatingLabel = (r) => {
    if (r === 5) return "Excellent! 🌟";
    if (r >= 4)  return "Great! 👍";
    if (r >= 3)  return "Good 🙂";
    if (r >= 2)  return "Fair 😐";
    return "Poor 😞";
  };

  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 200] });

  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.bg}>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── SUCCESS HERO ── */}
        <Animated.View style={[styles.heroSection, { transform: [{ scale: scaleAnim }] }]}>

          {/* Confetti particles */}
          <Animated.View style={[styles.confetti, styles.confetti1, {
            opacity: confettiUp1,
            transform: [{ translateY: confettiUp1.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) }],
          }]} />
          <Animated.View style={[styles.confetti, styles.confetti2, {
            opacity: confettiUp2,
            transform: [{ translateY: confettiUp2.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }],
          }]} />
          <Animated.View style={[styles.confetti, styles.confetti3, {
            opacity: confettiUp3,
            transform: [{ translateY: confettiUp3.interpolate({ inputRange: [0, 1], outputRange: [0, -70] }) }],
          }]} />

          {/* Icon */}
          <View style={styles.heroIconArea}>
            <Animated.View style={[styles.heroRing, { transform: [{ scale: successPing }] }]} />
            <LinearGradient colors={GRAD.success} style={styles.heroIconBg}>
              <Ionicons name="checkmark" size={52} color={C.white} />
            </LinearGradient>
          </View>

          <Text style={styles.heroTitle}>Order Complete! 🎉</Text>
          <Text style={styles.heroSubtitle}>Thank you for choosing Motors</Text>

          {/* Order ID badge */}
          <View style={styles.orderIdBadge}>
            <Ionicons name="receipt-outline" size={13} color={C.violet} />
            <Text style={styles.orderIdText}>Order #{orderId}</Text>
          </View>
        </Animated.View>

        {/* ── TOTAL PAID CARD ── */}
        <Animated.View style={[styles.totalCard, { opacity: fadeAnim }]}>
          <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.totalGradient}>
            <View style={styles.totalDecor1} />
            <View style={styles.totalDecor2} />

            <View style={styles.totalHeader}>
              <Text style={styles.totalHeaderLabel}>TOTAL PAID</Text>
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={12} color={C.successDark} />
                <Text style={styles.paidBadgeText}>PAID</Text>
              </View>
            </View>

            <View style={styles.totalAmountRow}>
              <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
              {/* Shimmer */}
              <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} />
            </View>

            <View style={styles.totalBreakdown}>
              <View style={styles.totalBreakdownRow}>
                <View style={styles.totalBreakdownLeft}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.totalBreakdownLabel}>Advance</Text>
                </View>
                <Text style={styles.totalBreakdownValue}>{formatCurrency(advancePaid)}</Text>
              </View>
              <View style={styles.totalBreakdownDivider} />
              <View style={styles.totalBreakdownRow}>
                <View style={styles.totalBreakdownLeft}>
                  <Ionicons name="card-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.totalBreakdownLabel}>Final</Text>
                </View>
                <Text style={styles.totalBreakdownValue}>{formatCurrency(remainingAmount)}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── RECEIPT CARD ── */}
        <Animated.View style={[styles.receiptCard, { opacity: fadeAnim }]}>
          {/* Header */}
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.receiptHeader}>
            <View style={styles.receiptHeaderIcon}>
              <Ionicons name="receipt" size={14} color={C.violet} />
            </View>
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
            <View style={styles.receiptVerifiedBadge}>
              <Ionicons name="shield-checkmark" size={11} color={C.success} />
              <Text style={styles.receiptVerifiedText}>Verified</Text>
            </View>
          </LinearGradient>

          {/* Body */}
          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Service</Text>
              <Text style={styles.receiptValue}>{order?.package_name || "Car Wash"}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Vehicle</Text>
              <Text style={styles.receiptValue}>{order?.vehicle || "—"}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Location</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>{order?.pickup_address || "—"}</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <View style={styles.receiptRowLeft}>
                <Ionicons name="checkmark-circle" size={15} color={C.success} />
                <Text style={styles.receiptLabel}>Advance Payment</Text>
              </View>
              <Text style={[styles.receiptValue, { color: C.successDark }]}>{formatCurrency(advancePaid)}</Text>
            </View>
            <View style={styles.receiptRow}>
              <View style={styles.receiptRowLeft}>
                <Ionicons name="checkmark-circle" size={15} color={C.success} />
                <Text style={styles.receiptLabel}>Final Payment</Text>
              </View>
              <Text style={[styles.receiptValue, { color: C.successDark }]}>{formatCurrency(remainingAmount)}</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptTotalRow}>
              <View>
                <Text style={styles.receiptTotalLabel}>Total Paid</Text>
                <Text style={styles.receiptTotalSub}>Inclusive of all taxes</Text>
              </View>
              <Text style={styles.receiptTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.receiptFooter}>
            <Ionicons name="mail-outline" size={14} color={C.textLight} />
            <Text style={styles.receiptFooterText}>Receipt sent to your email</Text>
          </View>
        </Animated.View>

        {/* ── RATING CARD ── */}
        {rating > 0 && (
          <Animated.View style={[styles.ratingCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={[C.goldSoft, "#FFFBEB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.ratingCardHeader}>
              <View style={styles.ratingCardIconWrap}>
                <Ionicons name="star" size={14} color={C.gold} />
              </View>
              <Text style={styles.ratingCardTitle}>Your Feedback</Text>
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name={star <= rating ? "star" : "star-outline"} size={30} color={C.gold} />
              ))}
            </View>
            <View style={styles.ratingFeedback}>
              <Text style={styles.ratingFeedbackText}>{getRatingLabel(rating)}</Text>
            </View>
            <Text style={styles.ratingThanks}>
              {rating >= 4
                ? "Your feedback helps us serve you better!"
                : "We'll work hard to improve your experience!"}
            </Text>
          </Animated.View>
        )}

        {/* ── REFERRAL CARD ── */}
        <Animated.View style={[styles.referralCard, { opacity: fadeAnim }]}>
          <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.referralGradient}>
            <View style={styles.referralDecor} />
            <View style={styles.referralContent}>
              <View style={styles.referralLeft}>
                <View style={styles.referralIconWrap}>
                  <Text style={styles.referralEmoji}>🎁</Text>
                </View>
                <View>
                  <Text style={styles.referralTitle}>Share & Earn</Text>
                  <Text style={styles.referralSubtitle}>Get ₹50 for every friend who books</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                <Ionicons name="share-social" size={16} color={C.violet} />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── THANK YOU CARD ── */}
        <Animated.View style={[styles.thankYouCard, { opacity: fadeAnim }]}>
          <LinearGradient colors={[C.successBg, "#D1FAE5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.thankYouEmoji}>🚗✨</Text>
          <View style={styles.thankYouContent}>
            <Text style={styles.thankYouTitle}>Your car is sparkling!</Text>
            <Text style={styles.thankYouText}>We hope to see you again soon.</Text>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        <Animated.View style={[{ transform: [{ scale: goldPulse }] }]}>
          <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome} activeOpacity={0.88}>
            <View style={styles.homeBtnIconLeft}><Ionicons name="home" size={18} color={C.textDark} /></View>
            <Text style={styles.homeBtnText}>Home Page</Text>
            <View style={styles.homeBtnIconRight}><Ionicons name="arrow-forward" size={14} color={C.textDark} /></View>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.homeNote}>Your order history is saved in your profile</Text>
      </View>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({

  scrollContent: { paddingHorizontal: SP.lg, paddingTop: SP.xl, paddingBottom: SP.xxxl, alignItems: "center" },

  // ─── Hero ───
  heroSection:  { alignItems: "center", marginBottom: SP.xl, width: "100%", position: "relative" },
  heroIconArea: { alignItems: "center", justifyContent: "center", marginBottom: SP.lg, position: "relative" },
  heroRing:     { position: "absolute", width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: C.success + "40" },
  heroIconBg:   { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", shadowColor: C.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  heroTitle:    { fontSize: 26, fontWeight: "900", color: C.textDark, letterSpacing: -0.5, marginBottom: SP.xs },
  heroSubtitle: { fontSize: 14, color: C.textLight, fontWeight: "500", marginBottom: SP.md },

  orderIdBadge: { flexDirection: "row", alignItems: "center", gap: SP.xs, backgroundColor: C.primarySoft, paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: R.full, borderWidth: 1, borderColor: C.violet + "20" },
  orderIdText:  { fontSize: 13, fontWeight: "700", color: C.violet },

  // Confetti
  confetti:  { position: "absolute", width: 8, height: 8, borderRadius: 4 },
  confetti1: { backgroundColor: C.gold,    top: 10, left: "20%" },
  confetti2: { backgroundColor: C.success, top: 20, left: "60%" },
  confetti3: { backgroundColor: C.violet,  top: 5,  left: "80%" },

  // ─── Total Card ───
  totalCard:     { width: "100%", borderRadius: R.lg, marginBottom: SP.md, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  totalGradient: { padding: SP.xl, position: "relative", overflow: "hidden" },
  totalDecor1:   { position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)" },
  totalDecor2:   { position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.04)" },

  totalHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SP.sm },
  totalHeaderLabel:{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.8)", letterSpacing: 1 },
  paidBadge:       { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.successBg, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  paidBadgeText:   { fontSize: 9, fontWeight: "800", color: C.successDark, letterSpacing: 0.5 },

  totalAmountRow: { position: "relative", marginBottom: SP.lg, overflow: "hidden" },
  totalAmount:    { fontSize: 42, fontWeight: "900", color: C.white, letterSpacing: -1 },
  shimmer:        { position: "absolute", top: 0, bottom: 0, width: 80, backgroundColor: "rgba(255,255,255,0.15)", transform: [{ skewX: "-20deg" }] },

  totalBreakdown:        { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: R.md, padding: SP.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  totalBreakdownRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
  totalBreakdownLeft:    { flexDirection: "row", alignItems: "center", gap: SP.sm },
  totalBreakdownLabel:   { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  totalBreakdownValue:   { fontSize: 13, fontWeight: "700", color: C.white },
  totalBreakdownDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: SP.sm },

  // ─── Receipt Card ───
  receiptCard:          { width: "100%", backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  receiptHeader:        { flexDirection: "row", alignItems: "center", gap: SP.sm, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  receiptHeaderIcon:    { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  receiptTitle:         { flex: 1, fontSize: 13, fontWeight: "800", color: C.violet },
  receiptVerifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.successBg, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  receiptVerifiedText:  { fontSize: 9, fontWeight: "700", color: C.successDark },

  receiptBody:       { padding: SP.lg },
  receiptRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SP.sm },
  receiptRowLeft:    { flexDirection: "row", alignItems: "center", gap: SP.sm },
  receiptLabel:      { fontSize: 13, color: C.textMid, fontWeight: "500" },
  receiptValue:      { fontSize: 13, fontWeight: "700", color: C.textDark, maxWidth: "55%", textAlign: "right" },
  receiptDivider:    { height: 1, backgroundColor: C.border, marginVertical: SP.md },
  receiptTotalRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  receiptTotalLabel: { fontSize: 15, fontWeight: "800", color: C.textDark },
  receiptTotalSub:   { fontSize: 10, color: C.textLight, fontWeight: "500", marginTop: 2 },
  receiptTotalValue: { fontSize: 24, fontWeight: "900", color: C.violet, letterSpacing: -0.5 },

  receiptFooter:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SP.sm, paddingVertical: SP.md, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  receiptFooterText: { fontSize: 12, color: C.textLight, fontWeight: "500" },

  // ─── Rating Card ───
  ratingCard:       { width: "100%", borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, alignItems: "center", borderWidth: 1, borderColor: C.gold + "30", overflow: "hidden" },
  ratingCardHeader: { flexDirection: "row", alignItems: "center", gap: SP.sm, alignSelf: "flex-start", marginBottom: SP.md },
  ratingCardIconWrap:{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.goldSoft, justifyContent: "center", alignItems: "center" },
  ratingCardTitle:  { fontSize: 13, fontWeight: "800", color: C.textDark },
  starsRow:         { flexDirection: "row", gap: SP.xs, marginBottom: SP.md },
  ratingFeedback:   { backgroundColor: C.goldSoft, paddingHorizontal: SP.lg, paddingVertical: SP.sm, borderRadius: R.full, marginBottom: SP.sm },
  ratingFeedbackText:{ fontSize: 14, fontWeight: "700", color: C.goldDeep },
  ratingThanks:     { fontSize: 12, color: C.textMid, fontWeight: "500", textAlign: "center" },

  // ─── Referral Card ───
  referralCard:     { width: "100%", borderRadius: R.lg, marginBottom: SP.md, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  referralGradient: { padding: SP.lg, overflow: "hidden" },
  referralDecor:    { position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)" },
  referralContent:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  referralLeft:     { flexDirection: "row", alignItems: "center", gap: SP.md },
  referralIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  referralEmoji:    { fontSize: 24 },
  referralTitle:    { fontSize: 15, fontWeight: "800", color: C.white },
  referralSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: "500" },
  shareBtn:         { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.white, paddingHorizontal: SP.md, paddingVertical: SP.sm + 2, borderRadius: R.full },
  shareBtnText:     { fontSize: 13, fontWeight: "700", color: C.violet },

  // ─── Thank You Card ───
  thankYouCard:    { width: "100%", flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.lg, overflow: "hidden", borderWidth: 1, borderColor: C.success + "30", gap: SP.md },
  thankYouEmoji:   { fontSize: 36 },
  thankYouContent: {},
  thankYouTitle:   { fontSize: 14, fontWeight: "800", color: C.successDark },
  thankYouText:    { fontSize: 12, color: C.successDark, marginTop: 2, fontWeight: "500" },

  // ─── Bottom Bar ───
  bottomBar:  { paddingTop: SP.md, paddingBottom: Platform.OS === "ios" ? SP.lg : SP.lg, paddingHorizontal: SP.lg, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, alignItems: "center", shadowColor: C.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20 },
  homeBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.gold, paddingVertical: SP.md + 2, paddingHorizontal: SP.xl, borderRadius: R.full, gap: SP.sm, shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, minWidth: "85%" },
  homeBtnIconLeft:  { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  homeBtnText:      { fontSize: 16, fontWeight: "800", color: C.textDark, letterSpacing: 0.3 },
  homeBtnIconRight: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  homeNote:   { fontSize: 11, fontWeight: "500", color: C.textLight, marginTop: SP.sm },
});