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

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  dark: "#1C1C1E",
  muted: "#6B7280",
  white: "#FFFFFF",
  bg: "#F5F6F8",
  success: "#10B981",
  successBg: "#ECFDF5",
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

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
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

  // ✅ Single button to go home
  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "HomeTabs" }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <Animated.View 
          style={[
            styles.successHeader,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={60} color={COLORS.white} />
          </View>
          <Text style={styles.successTitle}>Order Complete! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Thank you for choosing Motors
          </Text>
        </Animated.View>

        {/* Order ID */}
        <Animated.View 
          style={[
            styles.orderIdCard,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderIdValue}>#{orderId}</Text>
        </Animated.View>

        {/* Payment Receipt - Without Download Button */}
        <Animated.View 
          style={[
            styles.receiptCard,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.receiptHeader}>
            <Ionicons name="receipt" size={20} color={COLORS.primary} />
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
          </View>

          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Service</Text>
              <Text style={styles.receiptValue}>
                {order?.package_name || "Car Wash"}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Vehicle</Text>
              <Text style={styles.receiptValue}>
                {order?.vehicle || "—"}
              </Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <View style={styles.receiptRowLeft}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.receiptLabel}>Advance Payment</Text>
              </View>
              <Text style={[styles.receiptValue, { color: COLORS.success }]}>
                {formatCurrency(advancePaid)}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <View style={styles.receiptRowLeft}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.receiptLabel}>Final Payment</Text>
              </View>
              <Text style={[styles.receiptValue, { color: COLORS.success }]}>
                {formatCurrency(remainingAmount)}
              </Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          </View>

          {/* ✅ Removed Download Button - Just show confirmation text */}
          <View style={styles.receiptFooter}>
            <Ionicons name="mail-outline" size={16} color={COLORS.muted} />
            <Text style={styles.receiptFooterText}>
              Receipt sent to your email
            </Text>
          </View>
        </Animated.View>

        {/* Referral Card */}
        <Animated.View 
          style={[
            styles.referralCard,
            { opacity: fadeAnim }
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.referralGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.referralContent}>
              <Text style={styles.referralIcon}>🎁</Text>
              <View style={styles.referralText}>
                <Text style={styles.referralTitle}>Share & Earn</Text>
                <Text style={styles.referralSubtitle}>
                  Get ₹50 for every friend who books
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.shareBtn}
              onPress={handleShare}
            >
              <Ionicons name="share-social" size={18} color={COLORS.primary} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Rating Summary */}
        {rating > 0 && (
          <Animated.View 
            style={[
              styles.ratingCard,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.ratingCardTitle}>Your Feedback</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= rating ? "star" : "star-outline"}
                  size={28}
                  color="#F59E0B"
                />
              ))}
            </View>
            <Text style={styles.ratingMessage}>
              {rating === 5 ? "Thank you for the amazing review! 🌟" : 
               rating >= 4 ? "Thanks for your positive feedback! 👍" :
               "We'll work hard to improve! 🙏"}
            </Text>
          </Animated.View>
        )}

        {/* Thank You Message */}
        <Animated.View 
          style={[
            styles.thankYouCard,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.thankYouIcon}>🚗✨</Text>
          <Text style={styles.thankYouText}>
            Your car is sparkling clean! We hope to see you again soon.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ✅ Single Bottom Button - Go to Home */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.homeBtn}
          onPress={handleGoHome}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.homeBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="home" size={22} color={COLORS.white} />
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  successHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 10,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.dark,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  orderIdCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  orderIdLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "500",
  },
  orderIdValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },
  receiptCard: {
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
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  receiptTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  receiptBody: {
    padding: 16,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  receiptRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  receiptLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  // ✅ New: Receipt Footer (replaces download button)
  receiptFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 8,
    backgroundColor: "#F9FAFB",
  },
  receiptFooterText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  referralCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  referralGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  referralContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referralIcon: {
    fontSize: 32,
  },
  referralText: {},
  referralTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  referralSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  ratingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  ratingCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 4,
  },
  ratingMessage: {
    fontSize: 13,
    color: COLORS.dark,
    marginTop: 12,
    fontWeight: "500",
  },
  // ✅ New: Thank You Card
  thankYouCard: {
    backgroundColor: COLORS.successBg,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderStyle: "dashed",
  },
  thankYouIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  thankYouText: {
    fontSize: 14,
    color: COLORS.success,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 20,
  },
  // ✅ Updated: Single Bottom Button
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  homeBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  homeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  homeBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
  },
});