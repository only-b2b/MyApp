// screens/booking/QuotationPage.js

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../config";
import { getAuth } from "@react-native-firebase/auth";
import { calculateSplitAmounts, formatCurrency } from "../../utils/paymentUtils";

const { width } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  primaryDark: "#008F5B",
  primaryBg: "rgba(0, 168, 107, 0.08)",
  primaryBgStrong: "rgba(0, 168, 107, 0.15)",
  secondary: "#3B82F6",
  accent: "#F59E0B",
  white: "#FFFFFF",
  background: "#F5F6F8",
  cardBg: "#FFFFFF",
  surface: "#F9FAFB",
  divider: "#E5E7EB",
  border: "#E0E0E0",
  textDark: "#111111",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  ctaBlack: "#111111",
  shadow: "#000000",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 100,
};

export default function QuotationPage({ route, navigation }) {
  const { order } = route.params || {};
  const firebase_uid = getAuth().currentUser?.uid;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Calculate split amounts
  const pricing = order?.pricing;
  const splitAmounts = pricing?.total ? calculateSplitAmounts(pricing.total) : null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 150 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!firebase_uid) return;

      fetch(`${API_BASE_URL}/addresses/${firebase_uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          setAddresses(data);
          const defaultAddr = data.find((a) => a.is_default);
          const recentAddr = data.find((a) => a.last_used_at);
          const fallback = data[0];
          setSelectedAddress(defaultAddr || recentAddr || fallback || null);
        });
    });

    return unsubscribe;
  }, [navigation, firebase_uid]);

  useEffect(() => {
    if (route.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
    }
  }, [route.params?.selectedAddress]);

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        </View>
        <Text style={styles.errorTitle}>Invalid Quotation</Text>
        <Text style={styles.errorText}>Unable to load quotation data</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCarWash = order.service_type === "car_wash";
  const isDriver = order.service_type === "driver";
  const canProceed = isDriver || !!selectedAddress;

  const formatDuration = (min) => {
    if (!min) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const extractNumber = (str) => {
    if (!str) return null;
    if (typeof str === 'number') return str;
    const match = str.toString().match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  // ✅ NEW: Navigate to Payment Screen instead of direct booking
  const handleProceedToPayment = () => {
    if (!canProceed) {
      alert("Please select a service address");
      return;
    }

    // Navigate to Advance Payment Screen
    navigation.navigate("AdvancePaymentScreen", {
      order: {
        ...order,
        firebase_uid,
        address_id: selectedAddress?.id || null,
        pickup: selectedAddress?.address || null,
        distance: extractNumber(order.route?.distance),
        duration: extractNumber(order.route?.duration),
      },
      splitAmounts,
      selectedAddress,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Booking Summary</Text>
          <View style={styles.serviceBadge}>
            <MaterialCommunityIcons
              name={isCarWash ? "car-wash" : "steering"}
              size={12}
              color={COLORS.primary}
            />
            <Text style={styles.serviceBadgeText}>
              {order.service_type?.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Hub Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[0],
              transform: [
                {
                  translateY: cardAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.hubCard}>
            <View style={styles.hubIconWrapper}>
              <Ionicons name="location" size={24} color={COLORS.white} />
            </View>
            <View style={styles.hubInfo}>
              <Text style={styles.hubLabel}>SERVICE HUB</Text>
              <Text style={styles.hubName}>{order.hub?.name || "—"}</Text>
              {order.hub?.address && (
                <Text style={styles.hubAddress}>{order.hub.address}</Text>
              )}
            </View>
            {order.hub?.rating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color={COLORS.warning} />
                <Text style={styles.ratingText}>{order.hub.rating}</Text>
              </View>
            )}
          </View>

          {/* Route Info */}
          <View style={styles.routeStrip}>
            <View style={styles.routeItem}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
              <Text style={styles.routeValue}>{order.route?.distance || "—"}</Text>
              <Text style={styles.routeLabel}>Distance</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.routeValue}>{order.route?.duration || "—"}</Text>
              <Text style={styles.routeLabel}>Travel Time</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeItem}>
              <Ionicons name="timer-outline" size={16} color={COLORS.primary} />
              <Text style={styles.routeValue}>
                {formatDuration(pricing?.estimatedTime)}
              </Text>
              <Text style={styles.routeLabel}>Total Est.</Text>
            </View>
          </View>
        </Animated.View>

        {/* Booking Details Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[1],
              transform: [
                {
                  translateY: cardAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="car-sport" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Booking Details</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconBg}>
                <Ionicons name="car" size={16} color={COLORS.secondary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Vehicle Type</Text>
                <Text style={styles.detailValue}>{order.vehicle?.name || "—"}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIconBg, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Package</Text>
                <Text style={styles.detailValue}>{order.package?.name || "—"}</Text>
                {order.package?.desc && (
                  <Text style={styles.detailDesc}>{order.package.desc}</Text>
                )}
              </View>
            </View>

            {order.package?.features && (
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Included Services</Text>
                <View style={styles.featuresList}>
                  {order.package.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Address Card (Car Wash Only) */}
        {isCarWash && (
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnims[2],
                transform: [
                  {
                    translateY: cardAnims[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: COLORS.successBg }]}>
                <Ionicons name="home" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.cardTitle}>Service Address</Text>
            </View>

            {selectedAddress ? (
              <View style={styles.addressContent}>
                <View style={styles.addressInfo}>
                  <View style={styles.addressTypeTag}>
                    <Ionicons
                      name={
                        selectedAddress.label === "home"
                          ? "home"
                          : selectedAddress.label === "office"
                          ? "business"
                          : "location"
                      }
                      size={12}
                      color={COLORS.primary}
                    />
                    <Text style={styles.addressTypeText}>
                      {selectedAddress.label || "Address"}
                    </Text>
                  </View>
                  <Text style={styles.addressText}>{selectedAddress.address}</Text>
                  {selectedAddress.city && (
                    <Text style={styles.addressCity}>{selectedAddress.city}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() =>
                    navigation.navigate("SelectAddressPage", {
                      firebase_uid,
                      selectedId: selectedAddress?.id,
                    })
                  }
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() =>
                  navigation.navigate("ClientInfoPage", {
                    order,
                    fromQuotation: true,
                  })
                }
              >
                <View style={styles.addAddressIcon}>
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.addAddressInfo}>
                  <Text style={styles.addAddressTitle}>Add Service Address</Text>
                  <Text style={styles.addAddressSubtitle}>
                    Required for service delivery
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* ✅ NEW: Payment Split Card */}
        {splitAmounts && (
          <Animated.View
            style={[
              styles.card,
              styles.paymentSplitCard,
              {
                opacity: cardAnims[3],
                transform: [
                  {
                    translateY: cardAnims[3].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.paymentSplitHeader}>
              <View style={styles.paymentSplitHeaderLeft}>
                <Ionicons name="card-outline" size={18} color={COLORS.primary} />
                <Text style={styles.paymentSplitTitle}>Payment Structure</Text>
              </View>
              <View style={styles.splitBadge}>
                <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
                <Text style={styles.splitBadgeText}>Secure Split</Text>
              </View>
            </View>

            <View style={styles.paymentSplitBody}>
              {/* Advance Payment */}
              <View style={styles.splitItem}>
                <View style={styles.splitItemLeft}>
                  <View style={[styles.splitDot, styles.splitDotAdvance]} />
                  <View>
                    <Text style={styles.splitItemLabel}>Pay Now (33.33%)</Text>
                    <Text style={styles.splitItemNote}>To confirm booking</Text>
                  </View>
                </View>
                <Text style={styles.splitItemAmount}>
                  {formatCurrency(splitAmounts.advanceAmount)}
                </Text>
              </View>

              {/* Connector */}
              <View style={styles.splitConnector}>
                <View style={styles.splitConnectorLine} />
                <View style={styles.splitConnectorIcon}>
                  <Ionicons name="arrow-down" size={12} color={COLORS.textMuted} />
                </View>
                <View style={styles.splitConnectorLine} />
              </View>

              {/* Remaining Payment */}
              <View style={styles.splitItem}>
                <View style={styles.splitItemLeft}>
                  <View style={[styles.splitDot, styles.splitDotRemaining]} />
                  <View>
                    <Text style={styles.splitItemLabel}>After Service (66.67%)</Text>
                    <Text style={styles.splitItemNote}>Pay on completion</Text>
                  </View>
                </View>
                <Text style={[styles.splitItemAmount, styles.splitItemAmountMuted]}>
                  {formatCurrency(splitAmounts.remainingAmount)}
                </Text>
              </View>
            </View>

            {/* Info Banner */}
            <View style={styles.splitInfoBanner}>
              <Ionicons name="information-circle" size={16} color={COLORS.secondary} />
              <Text style={styles.splitInfoText}>
                Same driver will handle pick-up, service & drop-off
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Price Breakdown Card */}
        <Animated.View
          style={[
            styles.card,
            styles.priceCard,
            {
              opacity: cardAnims[4],
              transform: [
                {
                  translateY: cardAnims[4].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.priceHeader}>
            <View style={styles.priceHeaderLeft}>
              <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
              <Text style={styles.priceTitle}>Price Breakdown</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
              <Text style={styles.verifiedText}>Best Price</Text>
            </View>
          </View>

          <View style={styles.priceBody}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {order.package?.name} ({order.vehicle?.name})
              </Text>
              <Text style={styles.priceValue}>₹{pricing?.packagePrice || "—"}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Distance Charge ({pricing?.distanceKm?.toFixed(1)} km)
              </Text>
              <Text style={styles.priceValue}>₹{pricing?.distanceCharge || "—"}</Text>
            </View>

            {pricing?.peakSurge > 0 && (
              <View style={styles.priceRow}>
                <View style={styles.priceLabelRow}>
                  <Text style={[styles.priceLabel, { color: COLORS.warning }]}>
                    Peak Hour Surge
                  </Text>
                  <View style={styles.peakTag}>
                    <Ionicons name="flash" size={10} color={COLORS.warning} />
                    <Text style={styles.peakTagText}>+20%</Text>
                  </View>
                </View>
                <Text style={[styles.priceValue, { color: COLORS.warning }]}>
                  +₹{pricing.peakSurge}
                </Text>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Convenience Fee</Text>
              <Text style={styles.priceValue}>₹{pricing?.convenienceFee || "—"}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>₹{pricing?.tax || "—"}</Text>
            </View>

            <View style={styles.priceDivider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalNote}>Inclusive of all taxes</Text>
              </View>
              <Text style={styles.totalValue}>
                ₹{pricing?.total?.toLocaleString("en-IN") || "—"}
              </Text>
            </View>
          </View>

          <View style={styles.savingsBanner}>
            <Ionicons name="pricetag" size={14} color={COLORS.success} />
            <Text style={styles.savingsText}>
              You're saving ₹{Math.round((pricing?.total || 0) * 0.15)} with this package!
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* ✅ UPDATED: Bottom Action Bar with Split Payment */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.pricePreview}>
            <Text style={styles.payLabel}>Pay Now</Text>
            <Text style={styles.payAmount}>
              {formatCurrency(splitAmounts?.advanceAmount || 0)}
            </Text>
            <Text style={styles.paySubtext}>of {formatCurrency(pricing?.total || 0)}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.modifyButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !canProceed && styles.confirmButtonDisabled,
              ]}
              onPress={handleProceedToPayment}
              disabled={!canProceed || isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="card" size={18} color={COLORS.white} />
                  <Text style={styles.confirmButtonText}>Pay & Book</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.xxl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.errorBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  errorButton: {
    backgroundColor: COLORS.ctaBlack,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 4,
    gap: 4,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },

  // Card Base
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.sm,
  },
  cardIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  // Hub Card
  hubCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  hubIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  hubInfo: {
    flex: 1,
  },
  hubLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hubName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  hubAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.warning,
  },

  // Route Strip
  routeStrip: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  routeItem: {
    flex: 1,
    alignItems: "center",
  },
  routeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 4,
  },
  routeLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  routeDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.divider,
  },

  // Details
  detailsContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  detailIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 2,
  },
  detailDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Features
  featuresContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  featuresList: {
    gap: SPACING.xs,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },

  // Address
  addressContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
    marginBottom: SPACING.xs,
    gap: 4,
  },
  addressTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    lineHeight: 20,
  },
  addressCity: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  addAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
  },
  addAddressInfo: {
    flex: 1,
  },
  addAddressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  addAddressSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // ✅ NEW: Payment Split Card Styles
  paymentSplitCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
  },
  paymentSplitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  paymentSplitHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  paymentSplitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  splitBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  splitBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.success,
  },
  paymentSplitBody: {
    padding: SPACING.lg,
  },
  splitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  splitItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  splitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  splitDotAdvance: {
    backgroundColor: COLORS.primary,
  },
  splitDotRemaining: {
    backgroundColor: COLORS.textMuted,
    borderWidth: 2,
    borderColor: COLORS.divider,
  },
  splitItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  splitItemNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  splitItemAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  splitItemAmountMuted: {
    color: COLORS.textMuted,
  },
  splitConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingLeft: 5,
  },
  splitConnectorLine: {
    height: 12,
    width: 2,
    backgroundColor: COLORS.divider,
    marginLeft: 5,
  },
  splitConnectorIcon: {
    marginLeft: -4,
  },
  splitInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  splitInfoText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "500",
  },

  // Price Card
  priceCard: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  priceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  priceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  priceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.success,
  },
  priceBody: {
    padding: SPACING.lg,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  priceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  peakTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 2,
  },
  peakTagText: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.warning,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  totalNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.successBg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === "ios" ? 34 : SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
  },
  pricePreview: {
    minWidth: 90,
  },
  payLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  payAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  paySubtext: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  actionButtons: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  modifyButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.ctaBlack,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
});