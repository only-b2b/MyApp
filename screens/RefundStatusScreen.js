// screens/RefundStatusScreen.js

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config";
import { formatCurrency } from "../utils/paymentUtils";
import ScreenWrapper from "../components/ScreenWrapper";

// ==================== DESIGN SYSTEM ====================
const C = {
  // ─── PRIMARY: Deep Violet → Royal Blue ───
  violet: "#3D2B8C",
  violetDark: "#2A1E6B",
  violetMid: "#4D3CA0",
  blue: "#1E40AF",
  blueDark: "#1E3A8A",
  blueDeep: "#172554",

  // Soft tints
  primarySoft: "#EEEAFB",
  primarySoftDeep: "#DCD4F5",
  lavenderBg: "#F1EEFB",

  // ─── ACCENT: GOLD ───
  gold: "#F5C518",
  goldLight: "#FFD740",
  goldDark: "#C9A015",
  goldDeep: "#7A5C00",
  goldSoft: "#FEF7E0",

  // ─── BACKGROUNDS ───
  bg: "#F7F7FA",
  card: "#FFFFFF",
  surface: "#F9FAFB",

  // ─── TEXT ───
  textDark: "#0F0F1F",
  textPrimary: "#1F1F33",
  textMid: "#4A4A66",
  textLight: "#7B7B95",
  textFaint: "#A8A8BC",

  // ─── BORDERS ───
  border: "#EDEDF2",
  borderMid: "#DDDDE5",
  divider: "#E8E8EE",

  // ─── SEMANTIC ───
  success: "#22C55E",
  successBg: "#E8F8EF",
  successDark: "#16A34A",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  warningDark: "#D97706",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  errorDark: "#DC2626",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  infoDark: "#2563EB",
  white: "#FFFFFF",
  shadow: "#0F0F1F",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary: [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
};

const REFUND_STATUS_CONFIG = {
  initiated: {
    icon: "time",
    color: C.warning,
    bgColor: C.warningBg,
    darkColor: C.warningDark,
    title: "Refund Initiated",
    description: "Your refund request has been submitted",
  },
  processing: {
    icon: "sync",
    color: C.info,
    bgColor: C.infoBg,
    darkColor: C.infoDark,
    title: "Processing Refund",
    description: "Your refund is being processed by the bank",
  },
  completed: {
    icon: "checkmark-circle",
    color: C.success,
    bgColor: C.successBg,
    darkColor: C.successDark,
    title: "Refund Completed",
    description: "Amount has been credited to your account",
  },
  failed: {
    icon: "close-circle",
    color: C.error,
    bgColor: C.errorBg,
    darkColor: C.errorDark,
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
  const goldPulse = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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

    // Gold CTA pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(goldPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Rotation for processing icon
  useEffect(() => {
    if (refundData?.status === "processing" || refundData?.status === "initiated") {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [refundData?.status]);

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

          if (data.status === "completed" || data.status === "failed") {
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
  const isProcessing = refundData?.status === "processing" || refundData?.status === "initiated";

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.white}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Refund Status</Text>
          <Text style={styles.headerSub}>Order #{orderId}</Text>
        </View>

        <TouchableOpacity style={styles.headerBtnHelp} onPress={handleContactSupport}>
          <Ionicons name="headset" size={15} color={C.violet} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── STATUS HERO ICON ─── */}
        <Animated.View
          style={[
            styles.statusHeroOuter,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: statusConfig.bgColor,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.statusHeroInner,
              {
                backgroundColor: statusConfig.color,
                transform: isProcessing ? [{ rotate: spin }] : [],
              },
            ]}
          >
            <Ionicons name={statusConfig.icon} size={50} color={C.white} />
          </Animated.View>

          {/* Live polling indicator */}
          {polling && isProcessing && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </Animated.View>

        {/* Status title & description */}
        <Animated.View style={[styles.statusInfo, { opacity: fadeAnim }]}>
          <Text style={[styles.statusTitle, { color: statusConfig.darkColor }]}>
            {statusConfig.title}
          </Text>
          <Text style={styles.statusDescription}>{statusConfig.description}</Text>
        </Animated.View>

        {/* ─── REFUND AMOUNT CARD (with gradient) ─── */}
        <Animated.View style={[styles.amountCardWrapper, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={GRAD.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.amountCard}
          >
            {/* Decorative shapes */}
            <View style={styles.amountDecor1} />
            <View style={styles.amountDecor2} />

            <View style={styles.amountHeader}>
              <Text style={styles.amountLabel}>REFUND AMOUNT</Text>
              <View style={styles.amountBadge}>
                <Ionicons name="cash" size={11} color={C.goldDeep} />
                <Text style={styles.amountBadgeText}>Refunding</Text>
              </View>
            </View>

            <Text style={styles.amountValue}>
              {formatCurrency(refundData?.refundAmount)}
            </Text>
            <Text style={styles.amountValueLabel}>
              To original payment method
            </Text>

            {refundData?.cancellationCharge > 0 && (
              <View style={styles.chargeInfo}>
                <View style={styles.chargeInfoRow}>
                  <View>
                    <Text style={styles.chargeText}>Cancellation Charge</Text>
                    <Text style={styles.chargePercent}>
                      {refundData.chargePercentage}% of advance
                    </Text>
                  </View>
                  <Text style={styles.chargeAmount}>
                    -{formatCurrency(refundData.cancellationCharge)}
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ─── BOOKING DETAILS ─── */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="receipt" size={14} color={C.violet} />
            </View>
            <Text style={styles.cardTitle}>Booking Details</Text>
          </View>

          <View style={styles.detailsBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <View style={styles.detailValueWrap}>
                <Text style={styles.detailValue}>#{orderId}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>
                {orderDetails?.packageName || "Car Wash"}
              </Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Advance Paid</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(refundData?.advanceAmount)}
              </Text>
            </View>

            {refundData?.razorpayRefundId && (
              <>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Refund ID</Text>
                  <View style={styles.refundIdBox}>
                    <Text style={styles.refundIdText} numberOfLines={1}>
                      {refundData.razorpayRefundId}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* ─── TIMELINE ─── */}
        <Animated.View style={[styles.timelineCard, { opacity: fadeAnim }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="git-branch" size={14} color={C.violet} />
            </View>
            <Text style={styles.cardTitle}>Refund Timeline</Text>
          </View>

          <View style={styles.timelineBody}>
            {/* Step 1: Cancellation Requested */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <LinearGradient colors={GRAD.primary} style={styles.timelineDotComplete}>
                  <Ionicons name="checkmark" size={10} color={C.white} />
                </LinearGradient>
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineLabel}>Cancellation Requested</Text>
                  <View style={styles.timelineStatusDone}>
                    <Text style={styles.timelineStatusDoneText}>DONE</Text>
                  </View>
                </View>
                <Text style={styles.timelineTime}>Just now</Text>
              </View>
            </View>

            <View style={styles.timelineConnector}>
              <LinearGradient
                colors={
                  refundData?.status === "processing" || refundData?.status === "completed"
                    ? GRAD.primary
                    : [C.borderMid, C.borderMid]
                }
                style={styles.timelineConnectorLine}
              />
            </View>

            {/* Step 2: Processing */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                {refundData?.status === "processing" || refundData?.status === "completed" ? (
                  <LinearGradient colors={GRAD.primary} style={styles.timelineDotComplete}>
                    <Ionicons
                      name={refundData?.status === "completed" ? "checkmark" : "sync"}
                      size={10}
                      color={C.white}
                    />
                  </LinearGradient>
                ) : (
                  <View style={styles.timelineDotPending} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      !(refundData?.status === "processing" || refundData?.status === "completed") &&
                        styles.timelineLabelInactive,
                    ]}
                  >
                    Refund Processing
                  </Text>
                  {refundData?.status === "processing" && (
                    <View style={styles.timelineStatusActive}>
                      <View style={styles.timelineStatusDot} />
                      <Text style={styles.timelineStatusActiveText}>ACTIVE</Text>
                    </View>
                  )}
                  {refundData?.status === "completed" && (
                    <View style={styles.timelineStatusDone}>
                      <Text style={styles.timelineStatusDoneText}>DONE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timelineTime}>1-2 business days</Text>
              </View>
            </View>

            <View style={styles.timelineConnector}>
              <LinearGradient
                colors={
                  refundData?.status === "completed"
                    ? GRAD.primary
                    : [C.borderMid, C.borderMid]
                }
                style={styles.timelineConnectorLine}
              />
            </View>

            {/* Step 3: Completed */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                {refundData?.status === "completed" ? (
                  <LinearGradient colors={GRAD.primary} style={styles.timelineDotComplete}>
                    <Ionicons name="checkmark" size={10} color={C.white} />
                  </LinearGradient>
                ) : (
                  <View style={styles.timelineDotPending} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      refundData?.status !== "completed" && styles.timelineLabelInactive,
                    ]}
                  >
                    Amount Credited
                  </Text>
                  {refundData?.status === "completed" && (
                    <View style={styles.timelineStatusDone}>
                      <Text style={styles.timelineStatusDoneText}>DONE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timelineTime}>3-5 business days</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ─── HELP CARD ─── */}
        <Animated.View style={[styles.helpCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[C.primarySoft, C.lavenderBg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.helpIconWrap}>
            <Ionicons name="information-circle" size={18} color={C.violet} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.helpTitle}>Refund Information</Text>
            <Text style={styles.helpText}>
              The refund will be credited to your original payment method.
              If you don't receive it within 5 business days, please contact support.
            </Text>
          </View>
        </Animated.View>

        {/* ─── FAILED STATE — Support Button ─── */}
        {refundData?.status === "failed" && (
          <Animated.View style={[{ width: "100%" }, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={handleContactSupport}
              activeOpacity={0.85}
            >
              <View style={styles.supportBtnIcon}>
                <Ionicons name="headset" size={18} color={C.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportBtnText}>Contact Support</Text>
                <Text style={styles.supportBtnSub}>We'll help resolve this issue</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.error} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Failure reason */}
        {refundData?.status === "failed" && refundData?.failureReason && (
          <Animated.View style={[styles.failureReasonCard, { opacity: fadeAnim }]}>
            <Text style={styles.failureReasonLabel}>Reason</Text>
            <Text style={styles.failureReasonText}>{refundData.failureReason}</Text>
          </Animated.View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ─── BOTTOM BAR with GOLD CTA ─── */}
      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: goldPulse }] }}>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={handleGoHome}
            activeOpacity={0.88}
          >
            <View style={styles.homeBtnIconLeft}>
              <Ionicons name="home" size={16} color={C.textDark} />
            </View>
            <Text style={styles.homeBtnText}>Go to Home</Text>
            <View style={styles.homeBtnIconRight}>
              <Ionicons name="arrow-forward" size={14} color={C.textDark} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
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
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.surface,
    justifyContent: "center", alignItems: "center",
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontSize: 16, fontWeight: "800",
    color: C.textDark, letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11, fontWeight: "600",
    color: C.textLight, marginTop: 2,
  },
  headerBtnHelp: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: SP.md, paddingVertical: 8,
    borderRadius: R.full, backgroundColor: C.primarySoft,
  },
  helpText: { fontSize: 12, fontWeight: "700", color: C.violet },

  // ─── Scroll ───
  scrollContent: {
    paddingHorizontal: SP.lg,
    paddingTop: SP.xxl,
    paddingBottom: 120,
    alignItems: "center",
  },

  // ─── Status Hero Icon ───
  statusHeroOuter: {
    width: 130, height: 130, borderRadius: 65,
    justifyContent: "center", alignItems: "center",
    marginBottom: SP.lg,
    position: "relative",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  statusHeroInner: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  liveIndicator: {
    position: "absolute",
    top: 6, right: -10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.textDark,
    paddingHorizontal: SP.sm, paddingVertical: 3,
    borderRadius: R.full,
    borderWidth: 2, borderColor: C.white,
  },
  liveDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.success,
  },
  liveText: {
    fontSize: 8, fontWeight: "800",
    color: C.white, letterSpacing: 0.8,
  },

  // ─── Status Info ───
  statusInfo: {
    alignItems: "center",
    marginBottom: SP.xl,
  },
  statusTitle: {
    fontSize: 22, fontWeight: "900",
    letterSpacing: -0.5,
  },
  statusDescription: {
    fontSize: 13, color: C.textMid,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 18,
  },

  // ─── Amount Card (Gradient) ───
  amountCardWrapper: {
    width: "100%",
    borderRadius: R.lg,
    marginBottom: SP.md,
    overflow: "hidden",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  amountCard: {
    padding: SP.xl,
    overflow: "hidden",
    position: "relative",
  },
  amountDecor1: {
    position: "absolute",
    top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  amountDecor2: {
    position: "absolute",
    bottom: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  amountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SP.sm,
  },
  amountLabel: {
    fontSize: 11, fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1,
  },
  amountBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.gold,
    paddingHorizontal: SP.sm + 2, paddingVertical: 4,
    borderRadius: R.sm,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  amountBadgeText: {
    fontSize: 10, fontWeight: "800",
    color: C.textDark, letterSpacing: 0.3,
  },
  amountValue: {
    fontSize: 38, fontWeight: "900",
    color: C.white, letterSpacing: -1,
    marginTop: 2,
  },
  amountValueLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginTop: 2,
  },
  chargeInfo: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: R.md,
    padding: SP.md,
    marginTop: SP.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chargeInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chargeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  chargePercent: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    fontWeight: "500",
  },
  chargeAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: C.gold,
  },

  // ─── Card Base ───
  detailsCard: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: R.lg,
    marginBottom: SP.md,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    padding: SP.lg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cardIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primarySoft,
    justifyContent: "center", alignItems: "center",
  },
  cardTitle: {
    fontSize: 14, fontWeight: "800",
    color: C.textDark, letterSpacing: -0.2,
  },

  // ─── Details Body ───
  detailsBody: { padding: SP.lg, gap: 0 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SP.sm,
  },
  detailLabel: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: "500",
  },
  detailValueWrap: {
    backgroundColor: C.primarySoft,
    paddingHorizontal: SP.sm + 2,
    paddingVertical: 4,
    borderRadius: R.sm,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textDark,
  },
  detailDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  refundIdBox: {
    backgroundColor: C.surface,
    paddingHorizontal: SP.sm + 2,
    paddingVertical: 4,
    borderRadius: R.sm,
    maxWidth: 180,
    borderWidth: 1, borderColor: C.border,
  },
  refundIdText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textLight,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // ─── Timeline ───
  timelineCard: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: R.lg,
    marginBottom: SP.md,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  timelineBody: { padding: SP.lg },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineLeft: {
    width: 24,
    alignItems: "center",
  },
  timelineDotComplete: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  timelineDotPending: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.white,
    borderWidth: 2.5, borderColor: C.borderMid,
  },
  timelineContent: {
    flex: 1,
    marginLeft: SP.md,
    paddingTop: 2,
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textDark,
    flex: 1,
  },
  timelineLabelInactive: {
    color: C.textLight,
    fontWeight: "600",
  },
  timelineTime: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 3,
    fontWeight: "500",
  },
  timelineStatusDone: {
    backgroundColor: C.successBg,
    paddingHorizontal: SP.sm, paddingVertical: 2,
    borderRadius: R.sm,
  },
  timelineStatusDoneText: {
    fontSize: 9, fontWeight: "800",
    color: C.successDark, letterSpacing: 0.5,
  },
  timelineStatusActive: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.infoBg,
    paddingHorizontal: SP.sm, paddingVertical: 2,
    borderRadius: R.sm,
  },
  timelineStatusDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.info,
  },
  timelineStatusActiveText: {
    fontSize: 9, fontWeight: "800",
    color: C.infoDark, letterSpacing: 0.5,
  },
  timelineConnector: {
    paddingLeft: 11,
    paddingVertical: 2,
  },
  timelineConnectorLine: {
    width: 2, height: 22,
    borderRadius: 1,
  },

  // ─── Help Card ───
  helpCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: R.lg,
    padding: SP.lg,
    marginBottom: SP.md,
    overflow: "hidden",
    borderWidth: 1, borderColor: C.violet + "20",
  },
  helpIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.white,
    justifyContent: "center", alignItems: "center",
    marginRight: SP.md,
  },
  helpTitle: {
    fontSize: 13, fontWeight: "800",
    color: C.violet,
    marginBottom: 3,
  },
  helpText: {
    fontSize: 12,
    color: C.textMid,
    lineHeight: 17,
    fontWeight: "500",
  },

  // ─── Support Button (Failed state) ───
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.errorBg,
    borderRadius: R.lg,
    padding: SP.md,
    gap: SP.md,
    borderWidth: 1, borderColor: C.error + "30",
    marginBottom: SP.sm,
  },
  supportBtnIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.white,
    justifyContent: "center", alignItems: "center",
  },
  supportBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: C.errorDark,
  },
  supportBtnSub: {
    fontSize: 11,
    color: C.error,
    marginTop: 2,
    fontWeight: "500",
  },

  // ─── Failure Reason ───
  failureReasonCard: {
    width: "100%",
    backgroundColor: C.errorBg,
    borderRadius: R.md,
    padding: SP.md,
    borderWidth: 1, borderColor: C.error + "20",
  },
  failureReasonLabel: {
    fontSize: 10, fontWeight: "800",
    color: C.errorDark,
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  failureReasonText: {
    fontSize: 12,
    color: C.errorDark,
    fontWeight: "500",
    lineHeight: 17,
  },

  // ─── Bottom Bar with GOLD CTA ───
  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: C.white,
    paddingTop: SP.md,
    paddingBottom: Platform.OS === "ios" ? SP.lg : SP.lg,
    paddingHorizontal: SP.lg,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 20,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gold,
    paddingVertical: SP.md + 2,
    paddingHorizontal: SP.lg,
    borderRadius: R.full,
    gap: SP.sm,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  homeBtnIconLeft: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  homeBtnText: {
    fontSize: 15, fontWeight: "800",
    color: C.textDark, letterSpacing: 0.3,
  },
  homeBtnIconRight: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center", alignItems: "center",
  },
});