// screens/carwash/TechnicianEnRouteScreen.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../../config";
import ScreenWrapper from "../../components/ScreenWrapper";

const { width, height } = Dimensions.get("window");

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

const MAP_STYLE = [
  { elementType: "geometry",           stylers: [{ color: "#F5F5F8" }] },
  { elementType: "labels.icon",        stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#7B7B95" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi",               stylers: [{ visibility: "off" }] },
  { featureType: "road",              elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.highway",      elementType: "geometry", stylers: [{ color: "#E8E2F8" }] },
  { featureType: "transit",           stylers: [{ visibility: "off" }] },
  { featureType: "water",             elementType: "geometry", stylers: [{ color: "#D0DCF0" }] },
];

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export default function TechnicianEnRouteScreen({ route, navigation }) {
  const { orderId, technician: routeTechnician, advancePaid, totalAmount, remainingAmount } = route.params;

  const [order,        setOrder]        = useState(null);
  const [technician,   setTechnician]   = useState(routeTechnician || null);
  const [techLocation, setTechLocation] = useState(null);
  const [loading,      setLoading]      = useState(true);

  const mapRef    = useRef(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const goldPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(goldPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
      Animated.timing(goldPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
    ])).start();
  }, []);

  // ── Poll order status and driver location ──
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        setOrder({ ...data });
        setLoading(false);

        // ✅ Update technician from fresh data
        if (data.driver && !technician) {
          setTechnician({
            id:        Number(data.driver.id)       || null,
            full_name: String(data.driver.full_name || ""),
            phone:     String(data.driver.phone     || ""),
            vehicle:   String(data.driver.vehicle   || ""),
            rating:    Number(data.driver.rating)   || 0,
          });
        }

        if (data.driverLocation) {
          setTechLocation({
            latitude:  Number(data.driverLocation.lat),
            longitude: Number(data.driverLocation.lng),
          });
        }

        if (data.status === "arrived") {
          // ✅ Build safe technician — only primitives
          const freshTech = data.driver ? {
            id:        Number(data.driver.id)       || null,
            full_name: String(data.driver.full_name || ""),
            phone:     String(data.driver.phone     || ""),
            vehicle:   String(data.driver.vehicle   || ""),
            rating:    Number(data.driver.rating)   || 0,
          } : technician;

          // ✅ setTimeout — fixes _tracking error
          setTimeout(() => {
            navigation.replace("TechnicianArrivedScreen", {
              orderId,
              technician:     freshTech,
              otp:            String(data.otp || ""),
              advancePaid,
              totalAmount,
              remainingAmount,
            });
          }, 300);
        }
      } catch (err) {
        console.log("Fetch error:", err.message);
        setLoading(false);
      }
    };

    fetchOrderData();
    const interval = setInterval(fetchOrderData, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  // ── Fit map ──
  useEffect(() => {
    if (mapRef.current && techLocation && order?.pickupLocation) {
      mapRef.current.fitToCoordinates(
        [techLocation, { latitude: order.pickupLocation.lat, longitude: order.pickupLocation.lng }],
        { edgePadding: { top: height * 0.15, bottom: height * 0.45, left: 60, right: 60 }, animated: true }
      );
    }
  }, [techLocation, order]);

  const handleCall = () => {
    if (technician?.phone) Linking.openURL(`tel:${technician.phone}`);
  };

  const handleCancelPress = () => {
    const cancellationCharge = Math.round((advancePaid || 0) * 0.05);
    const refundAmount       = (advancePaid || 0) - cancellationCharge;
    Alert.alert(
      "Cancel Booking?",
      `A 5% cancellation charge will apply.\n\nCharge: ${formatCurrency(cancellationCharge)}\nRefund: ${formatCurrency(refundAmount)}`,
      [
        { text: "No, Keep Booking", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => navigation.navigate("CancelBookingScreen", { orderId, advancePaid, totalAmount, remainingAmount }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenWrapper backgroundColor={C.white} statusBarStyle="dark-content" statusBarBg={C.white}>
        <View style={styles.loadingContainer}>
          <LinearGradient colors={GRAD.primary} style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={C.white} />
          </LinearGradient>
          <Text style={styles.loadingTitle}>Connecting...</Text>
          <Text style={styles.loadingSubtitle}>Fetching technician details</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg="transparent" edges={[]}>
      <View style={styles.container}>

        {/* MAP */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={MAP_STYLE}
          showsCompass={false}
          showsMyLocationButton={false}
          initialRegion={techLocation ? { ...techLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 } : undefined}
        >
          {order?.pickupLocation && (
            <Marker coordinate={{ latitude: order.pickupLocation.lat, longitude: order.pickupLocation.lng }}>
              <View style={styles.clientMarkerWrap}>
                <LinearGradient colors={GRAD.primary} style={styles.clientMarker}>
                  <Ionicons name="home" size={16} color={C.white} />
                </LinearGradient>
                <View style={styles.markerTail} />
              </View>
            </Marker>
          )}
          {techLocation && (
            <Marker coordinate={techLocation}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.techMarkerWrap}>
                  <LinearGradient colors={GRAD.primary} style={styles.techMarker}>
                    <Ionicons name="car" size={16} color={C.white} />
                  </LinearGradient>
                </View>
              </Animated.View>
            </Marker>
          )}
          {techLocation && order?.pickupLocation && (
            <Polyline
              coordinates={[techLocation, { latitude: order.pickupLocation.lat, longitude: order.pickupLocation.lng }]}
              strokeColor={C.violet} strokeWidth={5} lineDashPattern={[8, 6]} lineCap="round"
            />
          )}
        </MapView>

        {/* MAP HEADER */}
        <View style={styles.mapHeader}>
          <TouchableOpacity style={styles.mapHeaderBtn} onPress={handleCancelPress}>
            <Ionicons name="chevron-back" size={20} color={C.textDark} />
          </TouchableOpacity>
          <View style={styles.mapTitleWrap}>
            <Text style={styles.mapTitle}>Technician En Route</Text>
            <Text style={styles.mapSubtitle}>{order?.duration_text || order?.duration || "Calculating ETA..."}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* PAID FLOAT BADGE */}
        {!!advancePaid && (
          <View style={styles.paidFloatBadge}>
            <Ionicons name="checkmark-circle" size={13} color={C.success} />
            <Text style={styles.paidFloatText}>{formatCurrency(advancePaid)} Paid</Text>
          </View>
        )}

        {/* BOTTOM CARD */}
        <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>

          {/* Status Banner */}
          <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusBanner}>
            <View style={styles.statusBannerDecor} />
            <View style={styles.statusBannerLeft}>
              <LinearGradient colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]} style={styles.statusIconWrap}>
                <Ionicons name="car" size={18} color={C.white} />
              </LinearGradient>
              <View>
                <Text style={styles.statusBannerTitle}>Technician On The Way</Text>
                <Text style={styles.statusBannerSub}>{order?.duration_text || "Calculating arrival time..."}</Text>
              </View>
            </View>
            <View style={styles.etaBadge}><Text style={styles.etaBadgeText}>ETA</Text></View>
          </LinearGradient>

          {/* Technician Info */}
          <View style={styles.techInfoRow}>
            <LinearGradient colors={GRAD.primary} style={styles.techAvatar}>
              <Text style={styles.techAvatarText}>{technician?.full_name?.charAt(0)?.toUpperCase() || "T"}</Text>
            </LinearGradient>
            <View style={styles.techDetails}>
              <Text style={styles.techName}>{technician?.full_name || "Technician"}</Text>
              <Text style={styles.techVehicle}>{technician?.vehicle || "Service Van"}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={C.gold} />
                <Text style={styles.ratingText}>4.9</Text>
                <View style={styles.ratingDivider} />
                <Text style={styles.tripCount}>150+ washes</Text>
              </View>
            </View>
            <View style={styles.techActions}>
              <TouchableOpacity style={styles.techActionCall} onPress={handleCall}>
                <Ionicons name="call" size={18} color={C.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.techActionMsg}>
                <Ionicons name="chatbubble-ellipses" size={16} color={C.violet} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Info */}
          <View style={styles.serviceRow}>
            <View style={styles.serviceItem}>
              <LinearGradient colors={[C.primarySoft, C.lavenderBg]} style={styles.serviceIconWrap}>
                <Ionicons name="location" size={14} color={C.violet} />
              </LinearGradient>
              <Text style={styles.serviceText} numberOfLines={1}>{order?.pickup_address || "Your location"}</Text>
            </View>
            <View style={styles.serviceItemDivider} />
            <View style={styles.serviceItem}>
              <LinearGradient colors={[C.primarySoft, C.lavenderBg]} style={styles.serviceIconWrap}>
                <Ionicons name="water" size={14} color={C.violet} />
              </LinearGradient>
              <Text style={styles.serviceText} numberOfLines={1}>{order?.package_name || "Car Wash Service"}</Text>
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.paymentSummary}>
            <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.paymentSummaryItem}>
              <View style={styles.paymentSummaryLabel}><Ionicons name="checkmark-circle" size={14} color={C.success} /><Text style={styles.paymentSummaryLabelText}>Paid</Text></View>
              <Text style={[styles.paymentSummaryValue, { color: C.successDark }]}>{formatCurrency(advancePaid)}</Text>
            </View>
            <View style={styles.paymentSummaryDivider} />
            <View style={styles.paymentSummaryItem}>
              <View style={styles.paymentSummaryLabel}><Ionicons name="time-outline" size={14} color={C.warning} /><Text style={styles.paymentSummaryLabelText}>After Service</Text></View>
              <Text style={[styles.paymentSummaryValue, { color: C.textDark }]}>{formatCurrency(remainingAmount)}</Text>
            </View>
            <View style={styles.paymentSummaryDivider} />
            <View style={styles.paymentSummaryItem}>
              <View style={styles.paymentSummaryLabel}><Ionicons name="receipt-outline" size={14} color={C.violet} /><Text style={styles.paymentSummaryLabelText}>Total</Text></View>
              <Text style={[styles.paymentSummaryValue, { color: C.violet }]}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>

          {/* Cancel Warning */}
          <View style={styles.cancelWarning}>
            <Ionicons name="warning-outline" size={14} color={C.warningDark} />
            <Text style={styles.cancelWarningText}>5% cancellation charge applies • Technician already assigned</Text>
          </View>

          {/* Cancel CTA */}
          <View style={styles.cancelBarWrap}>
            <Animated.View style={{ transform: [{ scale: goldPulse }], flex: 1 }}>
              <TouchableOpacity style={styles.cancelGoldBtn} onPress={handleCancelPress} activeOpacity={0.85}>
                <View style={styles.cancelGoldBtnIconLeft}><Ionicons name="close" size={16} color={C.textDark} /></View>
                <Text style={styles.cancelGoldBtnText}>Cancel Booking</Text>
                <View style={styles.cancelGoldBtnIconRight}><Ionicons name="arrow-forward" size={14} color={C.textDark} /></View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  loadingContainer:{ flex: 1, justifyContent: "center", alignItems: "center", padding: SP.xxl },
  loadingIcon:     { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: SP.lg, shadowColor: C.violet, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  loadingTitle:    { fontSize: 20, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  loadingSubtitle: { fontSize: 14, color: C.textLight, marginTop: SP.xs, fontWeight: "500" },
  map:             { ...StyleSheet.absoluteFillObject },

  mapHeader:    { position: "absolute", top: Platform.OS === "ios" ? 54 : 24, left: SP.lg, right: SP.lg, flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.xl, paddingVertical: SP.sm, paddingHorizontal: SP.sm, shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  mapHeaderBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: "center", alignItems: "center" },
  mapTitleWrap: { flex: 1, alignItems: "center", marginHorizontal: SP.sm },
  mapTitle:     { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  mapSubtitle:  { fontSize: 11, color: C.violet, fontWeight: "700", marginTop: 1 },
  liveBadge:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.textDark, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  liveText:     { fontSize: 11, fontWeight: "700", color: C.white },

  paidFloatBadge: { position: "absolute", top: Platform.OS === "ios" ? 116 : 86, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.successBg, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full, borderWidth: 1, borderColor: C.success + "30", shadowColor: C.success, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  paidFloatText:  { fontSize: 12, fontWeight: "700", color: C.successDark },

  clientMarkerWrap: { alignItems: "center" },
  clientMarker:     { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: C.white, shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 7 },
  markerTail:       { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: C.violet, marginTop: -2 },
  techMarkerWrap:   { alignItems: "center" },
  techMarker:       { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: C.white, shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },

  bottomCard:       { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, paddingBottom: Platform.OS === "ios" ? 34 : 20, shadowColor: C.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20, overflow: "hidden" },
  statusBanner:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SP.lg, paddingVertical: SP.md, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, overflow: "hidden" },
  statusBannerDecor:{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)" },
  statusBannerLeft: { flexDirection: "row", alignItems: "center", gap: SP.md },
  statusIconWrap:   { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  statusBannerTitle:{ fontSize: 14, fontWeight: "800", color: C.white },
  statusBannerSub:  { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: "500" },
  etaBadge:         { backgroundColor: C.gold, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full },
  etaBadgeText:     { fontSize: 11, fontWeight: "800", color: C.textDark },

  techInfoRow:    { flexDirection: "row", alignItems: "center", padding: SP.lg, borderBottomWidth: 1, borderBottomColor: C.border },
  techAvatar:     { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginRight: SP.md, shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  techAvatarText: { fontSize: 20, fontWeight: "800", color: C.white },
  techDetails:    { flex: 1 },
  techName:       { fontSize: 15, fontWeight: "800", color: C.textDark },
  techVehicle:    { fontSize: 12, color: C.textLight, marginTop: 2, fontWeight: "500" },
  ratingRow:      { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText:     { fontSize: 12, fontWeight: "700", color: C.textDark },
  ratingDivider:  { width: 1, height: 10, backgroundColor: C.borderMid },
  tripCount:      { fontSize: 11, color: C.textLight, fontWeight: "500" },
  techActions:    { gap: SP.sm },
  techActionCall: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.violet, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  techActionMsg:  { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center" },

  serviceRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  serviceItem:        { flex: 1, flexDirection: "row", alignItems: "center", gap: SP.sm },
  serviceItemDivider: { width: 1, height: 28, backgroundColor: C.borderMid, marginHorizontal: SP.sm },
  serviceIconWrap:    { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  serviceText:        { fontSize: 12, fontWeight: "600", color: C.textMid, flex: 1 },

  paymentSummary:         { flexDirection: "row", alignItems: "center", paddingHorizontal: SP.lg, paddingVertical: SP.md, overflow: "hidden", borderBottomWidth: 1, borderBottomColor: C.border },
  paymentSummaryItem:     { flex: 1, alignItems: "center" },
  paymentSummaryLabel:    { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  paymentSummaryLabelText:{ fontSize: 11, fontWeight: "600", color: C.textLight },
  paymentSummaryValue:    { fontSize: 14, fontWeight: "800" },
  paymentSummaryDivider:  { width: 1, height: 32, backgroundColor: C.borderMid },

  cancelWarning:    { flexDirection: "row", alignItems: "center", gap: SP.sm, backgroundColor: C.warningBg, marginHorizontal: SP.lg, marginTop: SP.md, paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.warning + "30" },
  cancelWarningText:{ fontSize: 11, color: C.warningDark, fontWeight: "600", flex: 1 },
  cancelBarWrap:    { paddingHorizontal: SP.lg, paddingTop: SP.md },
  cancelGoldBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.gold, paddingVertical: SP.md + 2, borderRadius: R.full, gap: SP.sm, shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  cancelGoldBtnIconLeft: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
  cancelGoldBtnText:     { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: 0.3 },
  cancelGoldBtnIconRight:{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "center", alignItems: "center" },
});