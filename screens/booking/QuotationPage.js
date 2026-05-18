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
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../../config";
import { getAuth } from "@react-native-firebase/auth";
import { calculateSplitAmounts, formatCurrency } from "../../utils/paymentUtils";
import ScreenWrapper from "../../components/ScreenWrapper";

const { width } = Dimensions.get("window");

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
  primaryFade: "rgba(61,43,140,0.08)",
  primaryGlow: "rgba(61,43,140,0.30)",

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

  // ─── PASTELS ───
  pastelBlue: "#E3F0FF",
  blueAccent: "#3B82F6",
  pastelGreen: "#E8F5E9",
  pastelOrange: "#FFE8D6",
  orange: "#F59E0B",
  pastelPurple: "#EFEAFF",
  pastelRed: "#FEE2E2",

  // ─── SEMANTIC ───
  success: "#22C55E",
  successBg: "#E8F8EF",
  successDark: "#16A34A",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  white: "#FFFFFF",
  shadow: "#0F0F1F",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary: [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
};

export default function QuotationPage({ route, navigation }) {
  const { order } = route.params || {};
  const firebase_uid = getAuth().currentUser?.uid;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const goldPulse = useRef(new Animated.Value(1)).current;

  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const pricing = order?.pricing;
  const splitAmounts = pricing?.total ? calculateSplitAmounts(pricing.total) : null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1, duration: 400, delay: 150 + index * 100, useNativeDriver: true,
      }).start();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(goldPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
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
          setSelectedAddress(defaultAddr || recentAddr || data[0] || null);
        });
    });
    return unsubscribe;
  }, [navigation, firebase_uid]);

  useEffect(() => {
    if (route.params?.selectedAddress) setSelectedAddress(route.params.selectedAddress);
  }, [route.params?.selectedAddress]);

  if (!order) {
    return (
      <ScreenWrapper style={{ backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color={C.error} />
          </View>
          <Text style={styles.errorTitle}>Invalid Quotation</Text>
          <Text style={styles.errorText}>Unable to load quotation data</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <LinearGradient colors={GRAD.primary} style={styles.errorButtonGrad}>
              <Text style={styles.errorButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const isCarWash = order.service_type === "car_wash";
  const isDriver = order.service_type === "driver";
  const canProceed = isDriver || !!selectedAddress;

  const formatDuration = (min) => {
    if (!min) return "—";
    const h = Math.floor(min / 60), m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const extractNumber = (str) => {
    if (!str) return null;
    if (typeof str === 'number') return str;
    const match = str.toString().match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  const handleProceedToPayment = () => {
    if (!canProceed) {
      alert("Please select a service address");
      return;
    }
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
    <ScreenWrapper style={{ backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} translucent={false} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Booking Summary</Text>
          <View style={styles.serviceBadge}>
            <MaterialCommunityIcons
              name={isCarWash ? "car-wash" : "steering"}
              size={11}
              color={C.violet}
            />
            <Text style={styles.serviceBadgeText}>
              {order.service_type?.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerBtnHelp}>
          <Ionicons name="headset" size={15} color={C.violet} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <Animated.ScrollView
        style={[
          styles.scrollView,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HUB CARD ─── */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[0],
              transform: [{
                translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
              }],
            },
          ]}
        >
          <View style={styles.hubCard}>
            <LinearGradient colors={GRAD.primary} style={styles.hubIconWrapper}>
              <Ionicons name="storefront" size={22} color={C.white} />
            </LinearGradient>
            <View style={styles.hubInfo}>
              <Text style={styles.hubLabel}>SERVICE HUB</Text>
              <Text style={styles.hubName}>{order.hub?.name || "—"}</Text>
              {order.hub?.address && (
                <Text style={styles.hubAddress}>{order.hub.address}</Text>
              )}
            </View>
            {order.hub?.rating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color={C.gold} />
                <Text style={styles.ratingText}>{order.hub.rating}</Text>
              </View>
            )}
          </View>

          <View style={styles.routeStrip}>
            <LinearGradient
              colors={[C.primarySoft, C.lavenderBg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.routeItem}>
              <View style={styles.routeIconWrap}>
                <Ionicons name="navigate" size={14} color={C.violet} />
              </View>
              <Text style={styles.routeValue}>{order.route?.distance || "—"}</Text>
              <Text style={styles.routeLabel}>Distance</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeItem}>
              <View style={styles.routeIconWrap}>
                <Ionicons name="time" size={14} color={C.violet} />
              </View>
              <Text style={styles.routeValue}>{order.route?.duration || "—"}</Text>
              <Text style={styles.routeLabel}>Travel</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeItem}>
              <View style={styles.routeIconWrap}>
                <Ionicons name="timer" size={14} color={C.violet} />
              </View>
              <Text style={styles.routeValue}>{formatDuration(pricing?.estimatedTime)}</Text>
              <Text style={styles.routeLabel}>Total Est.</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── BOOKING DETAILS ─── */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[1],
              transform: [{
                translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
              }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="car-sport" size={16} color={C.violet} />
            </View>
            <Text style={styles.cardTitle}>Booking Details</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBg, { backgroundColor: C.pastelBlue }]}>
                <Ionicons name="car" size={16} color={C.blueAccent} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Vehicle Type</Text>
                <Text style={styles.detailValue}>{order.vehicle?.name || "—"}</Text>
                {order.vehicle?.subtitle && (
                  <Text style={styles.detailDesc}>{order.vehicle.subtitle}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIconBg, { backgroundColor: C.pastelPurple }]}>
                <Ionicons name="sparkles" size={16} color={C.violet} />
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
                <View style={styles.featuresHeader}>
                  <Ionicons name="checkmark-circle" size={14} color={C.violet} />
                  <Text style={styles.featuresTitle}>Included Services</Text>
                </View>
                <View style={styles.featuresList}>
                  {order.package.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View style={styles.featureBullet} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ─── ADDRESS CARD (Car Wash) ─── */}
        {isCarWash && (
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnims[2],
                transform: [{
                  translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: C.successBg }]}>
                <Ionicons name="home" size={16} color={C.success} />
              </View>
              <Text style={styles.cardTitle}>Service Address</Text>
            </View>

            {selectedAddress ? (
              <View style={styles.addressContent}>
                <View style={styles.addressInfo}>
                  <View style={styles.addressTypeTag}>
                    <Ionicons
                      name={
                        selectedAddress.label === "home" ? "home"
                          : selectedAddress.label === "office" ? "business"
                          : "location"
                      }
                      size={11}
                      color={C.violet}
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
                  onPress={() => navigation.navigate("SelectAddressPage", {
                    firebase_uid, selectedId: selectedAddress?.id,
                  })}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.violet} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => navigation.navigate("ClientInfoPage", {
                  order, fromQuotation: true,
                })}
              >
                <LinearGradient colors={[C.primarySoft, C.lavenderBg]} style={styles.addAddressIcon}>
                  <Ionicons name="add" size={20} color={C.violet} />
                </LinearGradient>
                <View style={styles.addAddressInfo}>
                  <Text style={styles.addAddressTitle}>Add Service Address</Text>
                  <Text style={styles.addAddressSubtitle}>Required for service delivery</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textLight} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* ─── PAYMENT SPLIT CARD ─── */}
        {splitAmounts && (
          <Animated.View
            style={[
              styles.card,
              styles.paymentSplitCard,
              {
                opacity: cardAnims[3],
                transform: [{
                  translateY: cardAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={[C.primarySoft, C.lavenderBg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentSplitHeader}
            >
              <View style={styles.paymentSplitHeaderLeft}>
                <View style={styles.paymentSplitHeaderIcon}>
                  <Ionicons name="card" size={14} color={C.violet} />
                </View>
                <Text style={styles.paymentSplitTitle}>Payment Structure</Text>
              </View>
              <View style={styles.splitBadge}>
                <Ionicons name="shield-checkmark" size={11} color={C.success} />
                <Text style={styles.splitBadgeText}>Secure</Text>
              </View>
            </LinearGradient>

            <View style={styles.paymentSplitBody}>
              <View style={styles.splitItem}>
                <View style={styles.splitItemLeft}>
                  <LinearGradient colors={GRAD.primary} style={styles.splitDot} />
                  <View>
                    <Text style={styles.splitItemLabel}>Pay Now</Text>
                    <Text style={styles.splitItemNote}>33.33% • To confirm booking</Text>
                  </View>
                </View>
                <Text style={styles.splitItemAmount}>
                  {formatCurrency(splitAmounts.advanceAmount)}
                </Text>
              </View>

              <View style={styles.splitConnector}>
                <View style={styles.splitConnectorLine} />
                <View style={styles.splitConnectorIcon}>
                  <Ionicons name="arrow-down" size={11} color={C.textLight} />
                </View>
                <View style={styles.splitConnectorLine} />
              </View>

              <View style={styles.splitItem}>
                <View style={styles.splitItemLeft}>
                  <View style={styles.splitDotMuted} />
                  <View>
                    <Text style={styles.splitItemLabel}>After Service</Text>
                    <Text style={styles.splitItemNote}>66.67% • Pay on completion</Text>
                  </View>
                </View>
                <Text style={[styles.splitItemAmount, { color: C.textLight }]}>
                  {formatCurrency(splitAmounts.remainingAmount)}
                </Text>
              </View>
            </View>

            <View style={styles.splitInfoBanner}>
              <Ionicons name="information-circle" size={14} color={C.violet} />
              <Text style={styles.splitInfoText}>
                Same driver handles pickup, service & dropoff
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ─── PRICE BREAKDOWN ─── */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[4],
              transform: [{
                translateY: cardAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
              }],
            },
          ]}
        >
          <LinearGradient
            colors={[C.primarySoft, C.lavenderBg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priceHeader}
          >
            <View style={styles.priceHeaderLeft}>
              <View style={styles.paymentSplitHeaderIcon}>
                <Ionicons name="receipt" size={14} color={C.violet} />
              </View>
              <Text style={styles.priceTitle}>Price Breakdown</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={11} color={C.success} />
              <Text style={styles.verifiedText}>Best Price</Text>
            </View>
          </LinearGradient>

          <View style={styles.priceBody}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {order.package?.name} ({order.vehicle?.name})
              </Text>
              <Text style={styles.priceValue}>₹{pricing?.packagePrice || "—"}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Distance ({pricing?.distanceKm?.toFixed(1)} km)
              </Text>
              <Text style={styles.priceValue}>₹{pricing?.distanceCharge || "—"}</Text>
            </View>

            {pricing?.peakSurge > 0 && (
              <View style={styles.priceRow}>
                <View style={styles.priceLabelRow}>
                  <Text style={[styles.priceLabel, { color: C.orange }]}>Peak Hour Surge</Text>
                  <View style={styles.peakTag}>
                    <Ionicons name="flash" size={9} color={C.orange} />
                    <Text style={styles.peakTagText}>+20%</Text>
                  </View>
                </View>
                <Text style={[styles.priceValue, { color: C.orange }]}>
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
              <View style={styles.totalRight}>
                <Text style={styles.totalValue}>
                  ₹{pricing?.total?.toLocaleString("en-IN") || "—"}
                </Text>
              </View>
            </View>
          </View>

          <LinearGradient
            colors={[C.successBg, "#D1FAE5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.savingsBanner}
          >
            <Ionicons name="pricetag" size={14} color={C.successDark} />
            <Text style={styles.savingsText}>
              You're saving ₹{Math.round((pricing?.total || 0) * 0.15)} with this package!
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ height: 130 }} />
      </Animated.ScrollView>

      {/* ─── BOTTOM BAR ─── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.pricePreview}>
            <Text style={styles.payLabel}>PAY NOW</Text>
            <Text style={styles.payAmount}>
              {formatCurrency(splitAmounts?.advanceAmount || 0)}
            </Text>
            <Text style={styles.paySubtext}>
              of {formatCurrency(pricing?.total || 0)}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.modifyButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={C.violet} />
            </TouchableOpacity>

            <Animated.View style={[{ flex: 1, transform: [{ scale: goldPulse }] }]}>
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
                  <ActivityIndicator size="small" color={C.textDark} />
                ) : (
                  <>
                    <View style={styles.confirmIconLeft}>
                      <Ionicons name="card" size={15} color={C.textDark} />
                    </View>
                    <Text style={styles.confirmButtonText}>Pay & Book</Text>
                    <View style={styles.confirmIconRight}>
                      <Ionicons name="arrow-forward" size={14} color={C.textDark} />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  // ─── Error State ───
  errorContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: SP.xxl,
  },
  errorIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.errorBg,
    justifyContent: "center", alignItems: "center",
    marginBottom: SP.lg,
  },
  errorTitle: { fontSize: 18, fontWeight: "800", color: C.textDark, marginBottom: SP.xs },
  errorText: { fontSize: 14, color: C.textLight, marginBottom: SP.xl },
  errorButton: { borderRadius: R.full, overflow: "hidden" },
  errorButtonGrad: { paddingHorizontal: SP.xxl, paddingVertical: SP.md },
  errorButtonText: { fontSize: 15, fontWeight: "700", color: C.white },

  // ─── Header (NO hardcoded paddingTop) ───
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: SP.md,
    paddingBottom: SP.md, paddingHorizontal: SP.lg,
    backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.surface,
    justifyContent: "center", alignItems: "center",
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  serviceBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primarySoft,
    paddingHorizontal: SP.sm, paddingVertical: 3,
    borderRadius: R.full, marginTop: 4,
  },
  serviceBadgeText: { fontSize: 10, fontWeight: "700", color: C.violet, letterSpacing: 0.4 },
  headerBtnHelp: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: SP.md, paddingVertical: 8,
    borderRadius: R.full, backgroundColor: C.primarySoft,
  },
  helpText: { fontSize: 12, fontWeight: "700", color: C.violet },

  // ─── Scroll ───
  scrollView: { flex: 1 },
  scrollContent: { padding: SP.lg },

  // ─── Card Base ───
  card: {
    backgroundColor: C.card, borderRadius: R.lg,
    marginBottom: SP.md,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", gap: SP.sm,
    padding: SP.lg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cardIconWrapper: {
    width: 32, height: 32, borderRadius: R.sm,
    backgroundColor: C.primarySoft,
    justifyContent: "center", alignItems: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: C.textDark, letterSpacing: -0.2 },

  // ─── Hub Card ───
  hubCard: {
    flexDirection: "row", alignItems: "center",
    padding: SP.lg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  hubIconWrapper: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: "center", alignItems: "center",
    marginRight: SP.md,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  hubInfo: { flex: 1 },
  hubLabel: {
    fontSize: 9, fontWeight: "700", color: C.textLight,
    letterSpacing: 1, marginBottom: 2,
  },
  hubName: { fontSize: 15, fontWeight: "800", color: C.textDark },
  hubAddress: { fontSize: 12, color: C.textLight, marginTop: 2, fontWeight: "500" },
  ratingBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.goldSoft,
    paddingHorizontal: SP.sm, paddingVertical: 4,
    borderRadius: R.full,
  },
  ratingText: { fontSize: 11, fontWeight: "800", color: C.goldDeep },

  // ─── Route Strip ───
  routeStrip: {
    flexDirection: "row", alignItems: "center",
    padding: SP.md,
    overflow: "hidden",
  },
  routeItem: { flex: 1, alignItems: "center" },
  routeIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.white,
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  routeValue: { fontSize: 13, fontWeight: "800", color: C.textDark },
  routeLabel: { fontSize: 10, color: C.textLight, marginTop: 2, fontWeight: "600" },
  routeDivider: {
    width: 1, height: 36, backgroundColor: C.borderMid, opacity: 0.6,
  },

  // ─── Details ───
  detailsContainer: { padding: SP.lg, gap: SP.md },
  detailRow: {
    flexDirection: "row", alignItems: "flex-start", gap: SP.md,
  },
  detailIconBg: {
    width: 38, height: 38, borderRadius: R.sm,
    justifyContent: "center", alignItems: "center",
  },
  detailInfo: { flex: 1 },
  detailLabel: {
    fontSize: 10, fontWeight: "700", color: C.textLight,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14, fontWeight: "800", color: C.textDark, marginTop: 2,
  },
  detailDesc: { fontSize: 12, color: C.textLight, marginTop: 2, fontWeight: "500" },

  // ─── Features ───
  featuresContainer: {
    backgroundColor: C.lavenderBg,
    padding: SP.md,
    borderRadius: R.md,
    marginTop: SP.sm,
  },
  featuresHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: SP.sm,
  },
  featuresTitle: {
    fontSize: 12, fontWeight: "800", color: C.violet,
    letterSpacing: -0.1,
  },
  featuresList: { gap: 6 },
  featureItem: {
    flexDirection: "row", alignItems: "center", gap: SP.sm,
  },
  featureBullet: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: C.violet,
  },
  featureText: { fontSize: 12, color: C.textPrimary, fontWeight: "500" },

  // ─── Address ───
  addressContent: {
    flexDirection: "row", alignItems: "center",
    padding: SP.lg, gap: SP.md,
  },
  addressInfo: { flex: 1 },
  addressTypeTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primarySoft,
    paddingHorizontal: SP.sm, paddingVertical: 3,
    borderRadius: R.sm, alignSelf: "flex-start",
    marginBottom: SP.xs,
  },
  addressTypeText: {
    fontSize: 10, fontWeight: "700", color: C.violet,
    textTransform: "capitalize",
  },
  addressText: { fontSize: 13, fontWeight: "700", color: C.textDark, lineHeight: 18 },
  addressCity: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: "500" },
  changeButton: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.primarySoft,
    paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderRadius: R.full,
  },
  changeButtonText: { fontSize: 12, fontWeight: "700", color: C.violet },
  addAddressButton: {
    flexDirection: "row", alignItems: "center",
    padding: SP.lg, gap: SP.md,
  },
  addAddressIcon: {
    width: 42, height: 42, borderRadius: R.md,
    justifyContent: "center", alignItems: "center",
  },
  addAddressInfo: { flex: 1 },
  addAddressTitle: { fontSize: 13, fontWeight: "800", color: C.textDark },
  addAddressSubtitle: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: "500" },

  // ─── Payment Split Card ───
  paymentSplitCard: {
    borderWidth: 1.5, borderColor: C.violet + "40",
  },
  paymentSplitHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SP.lg, paddingVertical: SP.md,
  },
  paymentSplitHeaderLeft: {
    flexDirection: "row", alignItems: "center", gap: SP.sm,
  },
  paymentSplitHeaderIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.white,
    justifyContent: "center", alignItems: "center",
  },
  paymentSplitTitle: { fontSize: 13, fontWeight: "800", color: C.violet },
  splitBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.successBg,
    paddingHorizontal: SP.sm, paddingVertical: 4,
    borderRadius: R.full,
  },
  splitBadgeText: { fontSize: 10, fontWeight: "700", color: C.successDark },
  paymentSplitBody: { padding: SP.lg },
  splitItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  splitItemLeft: {
    flexDirection: "row", alignItems: "center", gap: SP.md,
  },
  splitDot: {
    width: 14, height: 14, borderRadius: 7,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3, elevation: 3,
  },
  splitDotMuted: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.white,
    borderWidth: 2.5, borderColor: C.borderMid,
  },
  splitItemLabel: { fontSize: 13, fontWeight: "800", color: C.textDark },
  splitItemNote: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: "500" },
  splitItemAmount: { fontSize: 16, fontWeight: "900", color: C.violet, letterSpacing: -0.3 },
  splitConnector: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: SP.sm, paddingLeft: 6,
  },
  splitConnectorLine: {
    height: 12, width: 2, backgroundColor: C.borderMid, marginLeft: 5,
  },
  splitConnectorIcon: { marginLeft: -4 },
  splitInfoBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SP.sm,
    backgroundColor: C.primarySoft,
    paddingVertical: SP.sm + 2,
  },
  splitInfoText: { fontSize: 12, color: C.violet, fontWeight: "600" },

  // ─── Price ───
  priceHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SP.lg, paddingVertical: SP.md,
  },
  priceHeaderLeft: {
    flexDirection: "row", alignItems: "center", gap: SP.sm,
  },
  priceTitle: { fontSize: 13, fontWeight: "800", color: C.violet },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.successBg,
    paddingHorizontal: SP.sm, paddingVertical: 4,
    borderRadius: R.full,
  },
  verifiedText: { fontSize: 10, fontWeight: "700", color: C.successDark },
  priceBody: { padding: SP.lg },
  priceRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: SP.sm + 2,
  },
  priceLabelRow: { flexDirection: "row", alignItems: "center", gap: SP.sm },
  priceLabel: { fontSize: 13, color: C.textMid, fontWeight: "500" },
  priceValue: { fontSize: 13, fontWeight: "700", color: C.textDark },
  peakTag: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: C.warningBg,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: R.sm,
  },
  peakTagText: { fontSize: 9, fontWeight: "700", color: C.warning },
  priceDivider: {
    height: 1, backgroundColor: C.border, marginVertical: SP.md,
  },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  totalLabel: { fontSize: 14, fontWeight: "800", color: C.textDark },
  totalNote: { fontSize: 10, color: C.textLight, marginTop: 2, fontWeight: "500" },
  totalRight: { alignItems: "flex-end" },
  totalValue: { fontSize: 24, fontWeight: "900", color: C.violet, letterSpacing: -0.5 },
  savingsBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: SP.sm + 2, gap: SP.sm,
  },
  savingsText: { fontSize: 12, fontWeight: "700", color: C.successDark },

  // ─── Bottom Bar ───
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.white,
    paddingTop: SP.md,
    paddingBottom: Platform.OS === "ios" ? SP.lg : SP.lg,
    paddingHorizontal: SP.lg,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 20,
  },
  bottomBarContent: {
    flexDirection: "row", alignItems: "center", gap: SP.md,
  },
  pricePreview: { minWidth: 95 },
  payLabel: {
    fontSize: 9, fontWeight: "700", color: C.textLight,
    letterSpacing: 0.8, marginBottom: 2,
  },
  payAmount: { fontSize: 22, fontWeight: "900", color: C.violet, letterSpacing: -0.5 },
  paySubtext: { fontSize: 10, color: C.textLight, fontWeight: "600", marginTop: 1 },

  actionButtons: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: SP.sm,
  },
  modifyButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.primarySoft,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.violet + "20",
  },

  // ─── GOLD CTA ───
  confirmButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: C.gold,
    paddingVertical: SP.md + 2,
    paddingHorizontal: SP.lg,
    borderRadius: R.full,
    gap: SP.sm,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: C.borderMid,
    shadowOpacity: 0,
    opacity: 0.5,
  },
  confirmIconLeft: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: 0.3,
  },
  confirmIconRight: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center", alignItems: "center",
  },
});