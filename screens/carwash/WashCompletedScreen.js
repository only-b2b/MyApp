// screens/carwash/WashCompletedScreen.js

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../../config";
import { formatCurrency, calculateSplitAmounts } from "../../utils/paymentUtils";
import ScreenWrapper from "../../components/ScreenWrapper";

const { width } = Dimensions.get("window");

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
};

const onlyHttp = (arr) =>
  (arr || []).filter((u) => typeof u === "string" && /^https?:\/\//.test(u));

// ✅ WHY THIS SCREEN WORKS AS THE ENDPOINT:
// WashCompletedScreen receives `order: data` which may be a frozen object.
// BUT this screen is the FINAL DESTINATION in the car wash flow.
// The only navigation from here is to FinalPaymentScreen, which also
// receives fresh data. Neither screen tries to pass these frozen objects
// back into a replace/navigate that has more screens after it.
// The _tracking property assignment only fails when React Navigation
// tries to track screen transitions that involve the frozen object params
// across MULTIPLE navigation events in sequence.

export default function WashCompletedScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params;

  const [rating,       setRating]       = useState(0);
  const [showPhotos,   setShowPhotos]   = useState("before");
  const [freshOrder,   setFreshOrder]   = useState(initialOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment amounts from order data
  const totalAmount     = freshOrder?.price          || initialOrder?.price          || 0;
  const splitAmounts    = calculateSplitAmounts(totalAmount);
  const advancePaid     = freshOrder?.advance_amount || initialOrder?.advance_amount || splitAmounts.advanceAmount;
  const remainingAmount = totalAmount - advancePaid;

  // ── Animations ──
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const goldPulse   = useRef(new Animated.Value(1)).current;
  const successPing = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(goldPulse,   { toValue: 1.02, duration: 1500, useNativeDriver: true }),
      Animated.timing(goldPulse,   { toValue: 1,    duration: 1500, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(successPing, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
      Animated.timing(successPing, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  // Fetch fresh order data
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();
        if (data && data.id) setFreshOrder(data);
      } catch (e) {
        console.log("Error fetching order:", e.message);
      }
    })();
  }, [orderId]);

  const normalizePhotos = (val) => {
    if (!val) return [];
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  };

  const prePhotos  = normalizePhotos(freshOrder?.pre_photos  || initialOrder?.pre_photos);
  const postPhotos = normalizePhotos(freshOrder?.post_photos || initialOrder?.post_photos);

  const beforePhotosToShow = prePhotos.length  ? prePhotos  : [];
  const afterPhotosToShow  = postPhotos.length ? postPhotos : [];
  const photosToShow = onlyHttp(showPhotos === "before" ? beforePhotosToShow : afterPhotosToShow);

  const handleRating = (value) => setRating(value);

  const handleProceedToPayment = async () => {
    setIsSubmitting(true);
    try {
      if (rating > 0) {
        await fetch(`${API_BASE_URL}/orders/${orderId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });
      }
    } catch (err) {
      console.log("Rating error:", err.message);
    } finally {
      navigation.replace("FinalPaymentScreen", {
        orderId,
        order:           freshOrder || initialOrder,
        totalAmount,
        advancePaid,
        remainingAmount,
        rating,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.white}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={{ transform: [{ scale: successPing }] }}>
            <LinearGradient colors={GRAD.primary} style={styles.headerIconWrap}>
              <Ionicons name="checkmark" size={18} color={C.white} />
            </LinearGradient>
          </Animated.View>
          <View>
            <Text style={styles.headerTitle}>Wash Complete! 🎉</Text>
            <Text style={styles.headerSub}>Your car is sparkling clean</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtnHelp}>
          <Ionicons name="headset" size={15} color={C.violet} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <Animated.View style={[styles.heroSection, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.heroRing, { transform: [{ scale: successPing }] }]} />
          <LinearGradient colors={GRAD.primary} style={styles.heroCircle}>
            <View style={styles.heroDecor} />
            <Ionicons name="checkmark" size={44} color={C.white} />
          </LinearGradient>
          <Text style={styles.heroTitle}>Wash Complete! 🎉</Text>
          <Text style={styles.heroSubtitle}>Your car is now sparkling clean</Text>
        </Animated.View>

        {/* PAYMENT REMINDER */}
        <View style={styles.paymentReminderCard}>
          <LinearGradient colors={[C.warningBg, "#FEFCE8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={styles.paymentReminderIcon}><Ionicons name="wallet-outline" size={22} color={C.warningDark} /></View>
          <View style={styles.paymentReminderContent}>
            <Text style={styles.paymentReminderTitle}>Complete Your Payment</Text>
            <Text style={styles.paymentReminderText}>Pay the remaining amount to finish your booking</Text>
          </View>
          <View style={styles.paymentReminderAmount}>
            <Text style={styles.paymentReminderLabel}>To Pay</Text>
            <Text style={styles.paymentReminderValue}>{formatCurrency(remainingAmount)}</Text>
          </View>
        </View>

        {/* PAYMENT STRIP */}
        <View style={styles.paymentStrip}>
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={styles.paymentStripItem}>
            <View style={styles.paymentStripLabel}><Ionicons name="checkmark-circle" size={13} color={C.success} /><Text style={styles.paymentStripLabelText}>Advance Paid</Text></View>
            <Text style={[styles.paymentStripValue, { color: C.successDark }]}>{formatCurrency(advancePaid)}</Text>
          </View>
          <View style={styles.paymentStripDivider} />
          <View style={styles.paymentStripItem}>
            <View style={styles.paymentStripLabel}><Ionicons name="time-outline" size={13} color={C.warning} /><Text style={styles.paymentStripLabelText}>Remaining</Text></View>
            <Text style={[styles.paymentStripValue, { color: C.warningDark }]}>{formatCurrency(remainingAmount)}</Text>
          </View>
          <View style={styles.paymentStripDivider} />
          <View style={styles.paymentStripItem}>
            <View style={styles.paymentStripLabel}><Ionicons name="receipt-outline" size={13} color={C.violet} /><Text style={styles.paymentStripLabelText}>Total</Text></View>
            <Text style={[styles.paymentStripValue, { color: C.violet }]}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* PHOTO TOGGLE */}
        <View style={styles.photoToggleCard}>
          <View style={styles.photoToggleRow}>
            {["before", "after"].map((type) => (
              <TouchableOpacity key={type} style={[styles.toggleBtn, showPhotos === type && styles.toggleBtnActive]} onPress={() => setShowPhotos(type)} activeOpacity={0.85}>
                {showPhotos === type ? (
                  <LinearGradient colors={GRAD.primary} style={styles.toggleBtnGrad}>
                    <Text style={styles.toggleTextActive}>{type === "before" ? "Before" : "After ✨"}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.toggleText}>{type === "before" ? "Before" : "After ✨"}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          {photosToShow.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
              {photosToShow.map((photo, index) => <Image key={index} source={{ uri: photo }} style={styles.photo} />)}
            </ScrollView>
          ) : (
            <View style={styles.noPhotos}>
              <Ionicons name="camera-outline" size={24} color={C.textFaint} />
              <Text style={styles.noPhotosText}>Photos will appear here</Text>
            </View>
          )}
        </View>

        {/* ORDER SUMMARY */}
        <View style={styles.summaryCard}>
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.summaryCardHeader}>
            <View style={styles.summaryCardIconWrap}><Ionicons name="receipt" size={14} color={C.violet} /></View>
            <Text style={styles.summaryCardTitle}>Order Summary</Text>
            <View style={styles.summaryVerifiedBadge}><Ionicons name="shield-checkmark" size={11} color={C.success} /><Text style={styles.summaryVerifiedText}>Verified</Text></View>
          </LinearGradient>
          <View style={styles.summaryBody}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package</Text>
              <Text style={styles.summaryValue}>{freshOrder?.package_name || initialOrder?.package_name || "Car Wash"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle</Text>
              <Text style={styles.summaryValue}>{freshOrder?.vehicle || initialOrder?.vehicle || "—"}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryPayRow}>
              <View style={styles.summaryPayLeft}><Ionicons name="checkmark-circle" size={16} color={C.success} /><Text style={styles.summaryPayLabel}>Advance Paid (33.33%)</Text></View>
              <Text style={[styles.summaryPayValue, { color: C.successDark }]}>{formatCurrency(advancePaid)}</Text>
            </View>
            <View style={styles.summaryPayRow}>
              <View style={styles.summaryPayLeft}><Ionicons name="time-outline" size={16} color={C.warning} /><Text style={styles.summaryPayLabel}>Remaining (66.67%)</Text></View>
              <Text style={[styles.summaryPayValue, { color: C.warningDark }]}>{formatCurrency(remainingAmount)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotalRow}>
              <View><Text style={styles.summaryTotalLabel}>Total Amount</Text><Text style={styles.summaryTotalSub}>Inclusive of all taxes</Text></View>
              <Text style={styles.summaryTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* RATING */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingCardHeader}>
            <View style={styles.ratingCardIconWrap}><Ionicons name="star" size={14} color={C.gold} /></View>
            <Text style={styles.ratingCardTitle}>Rate Your Experience</Text>
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                <Ionicons name={star <= rating ? "star" : "star-outline"} size={38} color={C.gold} />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <View style={styles.ratingFeedback}>
              <Text style={styles.ratingFeedbackText}>
                {rating === 5 ? "Excellent! 🌟" : rating === 4 ? "Great! 👍" : rating === 3 ? "Good 🙂" : rating === 2 ? "Fair 😐" : "Poor 😞"}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 130 }} />
      </Animated.ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomPayPreview}>
            <Text style={styles.bottomPayLabel}>To Pay</Text>
            <Text style={styles.bottomPayAmount}>{formatCurrency(remainingAmount)}</Text>
            <Text style={styles.bottomPaySub}>of {formatCurrency(totalAmount)}</Text>
          </View>
          <Animated.View style={[{ flex: 1, transform: [{ scale: goldPulse }] }]}>
            <TouchableOpacity style={[styles.payBtn, isSubmitting && styles.payBtnDisabled]} onPress={handleProceedToPayment} disabled={isSubmitting} activeOpacity={0.85}>
              {isSubmitting ? (
                <Text style={styles.payBtnText}>Processing...</Text>
              ) : (
                <>
                  <View style={styles.payBtnIconLeft}><Ionicons name="card" size={16} color={C.textDark} /></View>
                  <Text style={styles.payBtnText}>Pay & Complete</Text>
                  <View style={styles.payBtnIconRight}><Ionicons name="arrow-forward" size={14} color={C.textDark} /></View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SP.md, paddingBottom: SP.md, paddingHorizontal: SP.lg, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  headerLeft:    { flexDirection: "row", alignItems: "center", gap: SP.md, flex: 1 },
  headerIconWrap:{ width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  headerTitle:   { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  headerSub:     { fontSize: 11, color: C.textLight, marginTop: 1, fontWeight: "500" },
  headerBtnHelp: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: SP.md, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.primarySoft },
  helpText:      { fontSize: 12, fontWeight: "700", color: C.violet },

  scrollContent: { paddingHorizontal: SP.lg, paddingTop: SP.xl, paddingBottom: SP.xxxl, alignItems: "center" },

  heroSection: { alignItems: "center", marginBottom: SP.xl },
  heroRing:    { position: "absolute", top: -16, width: 120, height: 120, borderRadius: 60, backgroundColor: C.primarySoft },
  heroCircle:  { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 3, borderColor: "rgba(255,255,255,0.3)", shadowColor: C.violet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10, marginBottom: SP.lg },
  heroDecor:   { position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)" },
  heroTitle:   { fontSize: 22, fontWeight: "900", color: C.textDark, letterSpacing: -0.5, marginBottom: SP.xs },
  heroSubtitle:{ fontSize: 14, color: C.textLight, fontWeight: "500" },

  paymentReminderCard:    { width: "100%", flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, overflow: "hidden", borderWidth: 1.5, borderColor: C.warning + "50", gap: SP.md },
  paymentReminderIcon:    { width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  paymentReminderContent: { flex: 1 },
  paymentReminderTitle:   { fontSize: 13, fontWeight: "800", color: C.textDark },
  paymentReminderText:    { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: "500" },
  paymentReminderAmount:  { alignItems: "flex-end" },
  paymentReminderLabel:   { fontSize: 10, color: C.textLight, fontWeight: "600" },
  paymentReminderValue:   { fontSize: 18, fontWeight: "900", color: C.warningDark, letterSpacing: -0.5 },

  paymentStrip:          { width: "100%", flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.md, marginBottom: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  paymentStripItem:      { flex: 1, alignItems: "center" },
  paymentStripLabel:     { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  paymentStripLabelText: { fontSize: 10, fontWeight: "600", color: C.textLight },
  paymentStripValue:     { fontSize: 14, fontWeight: "800" },
  paymentStripDivider:   { width: 1, height: 32, backgroundColor: C.borderMid },

  photoToggleCard: { width: "100%", backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  photoToggleRow:  { flexDirection: "row", backgroundColor: C.surface, padding: SP.xs, borderRadius: R.lg, margin: SP.md, marginBottom: 0 },
  toggleBtn:       { flex: 1, paddingVertical: SP.sm, alignItems: "center", borderRadius: R.md },
  toggleBtnActive: {},
  toggleBtnGrad:   { width: "100%", alignItems: "center", paddingVertical: SP.sm, borderRadius: R.md },
  toggleText:      { fontSize: 13, fontWeight: "700", color: C.textLight },
  toggleTextActive:{ fontSize: 13, fontWeight: "800", color: C.white },
  photosScroll:    { paddingHorizontal: SP.lg, paddingVertical: SP.md, gap: SP.sm },
  photo:           { width: width * 0.65, height: 170, borderRadius: R.lg, marginRight: SP.sm },
  noPhotos:        { alignItems: "center", padding: SP.xxl, gap: SP.sm },
  noPhotosText:    { fontSize: 13, color: C.textFaint, fontWeight: "500" },

  summaryCard:          { width: "100%", backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryCardHeader:    { flexDirection: "row", alignItems: "center", gap: SP.sm, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryCardIconWrap:  { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  summaryCardTitle:     { flex: 1, fontSize: 13, fontWeight: "800", color: C.violet },
  summaryVerifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.successBg, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  summaryVerifiedText:  { fontSize: 9, fontWeight: "700", color: C.successDark },
  summaryBody:          { padding: SP.lg },
  summaryRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SP.sm },
  summaryLabel:         { fontSize: 13, color: C.textMid, fontWeight: "500" },
  summaryValue:         { fontSize: 13, fontWeight: "700", color: C.textDark },
  summaryDivider:       { height: 1, backgroundColor: C.border, marginVertical: SP.md },
  summaryPayRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SP.sm },
  summaryPayLeft:       { flexDirection: "row", alignItems: "center", gap: SP.sm },
  summaryPayLabel:      { fontSize: 13, color: C.textMid, fontWeight: "500" },
  summaryPayValue:      { fontSize: 14, fontWeight: "700" },
  summaryTotalRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryTotalLabel:    { fontSize: 15, fontWeight: "800", color: C.textDark },
  summaryTotalSub:      { fontSize: 10, color: C.textLight, fontWeight: "500", marginTop: 2 },
  summaryTotalValue:    { fontSize: 24, fontWeight: "900", color: C.violet, letterSpacing: -0.5 },

  ratingCard:       { width: "100%", backgroundColor: C.white, borderRadius: R.lg, padding: SP.lg, borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, alignItems: "center" },
  ratingCardHeader: { flexDirection: "row", alignItems: "center", gap: SP.sm, alignSelf: "flex-start", marginBottom: SP.lg },
  ratingCardIconWrap:{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldSoft, justifyContent: "center", alignItems: "center" },
  ratingCardTitle:  { fontSize: 14, fontWeight: "800", color: C.textDark },
  starsRow:         { flexDirection: "row", gap: SP.sm, marginBottom: SP.md },
  ratingFeedback:   { backgroundColor: C.goldSoft, paddingHorizontal: SP.lg, paddingVertical: SP.sm, borderRadius: R.full },
  ratingFeedbackText:{ fontSize: 14, fontWeight: "700", color: C.goldDeep },

  bottomBar:        { paddingTop: SP.md, paddingBottom: Platform.OS === "ios" ? SP.lg : SP.lg, paddingHorizontal: SP.lg, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20 },
  bottomBarContent: { flexDirection: "row", alignItems: "center", gap: SP.md },
  bottomPayPreview: { minWidth: 90 },
  bottomPayLabel:   { fontSize: 10, fontWeight: "600", color: C.textLight, letterSpacing: 0.5 },
  bottomPayAmount:  { fontSize: 20, fontWeight: "900", color: C.warningDark, letterSpacing: -0.5 },
  bottomPaySub:     { fontSize: 10, color: C.textLight, fontWeight: "500", marginTop: 1 },
  payBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.gold, paddingVertical: SP.md + 2, borderRadius: R.full, gap: SP.sm, shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  payBtnDisabled:   { backgroundColor: C.borderMid, shadowOpacity: 0, opacity: 0.6 },
  payBtnIconLeft:   { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  payBtnText:       { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: 0.3 },
  payBtnIconRight:  { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
});