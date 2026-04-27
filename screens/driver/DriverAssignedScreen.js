// screens/driver/DriverAssignedScreen.js

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
  Share,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config";
import { getDistance } from "geolib";
import { Alert } from "react-native";

const { width, height } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  // Primary Colors
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  primaryDark: "#008F5B",

  // Accent
  accent: "#FF6B00",
  accentLight: "rgba(255, 107, 0, 0.1)",

  // Background & Surface
  background: "#F5F6F8",
  white: "#FFFFFF",
  surface: "#F9FAFB",
  card: "#FFFFFF",

  // Text Colors
  textDark: "#111111",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textLight: "#FFFFFF",

  // Status Colors
  success: "#10B981",
  successBg: "#ECFDF5",
  successDark: "#059669",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  warningDark: "#D97706",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",

  // Others
  lightGray: "#E5E7EB",
  divider: "#EEEEEE",
  overlay: "rgba(0, 0, 0, 0.5)",
  dark: "#0F172A",
  darkLight: "#1E293B",

  // Map Colors
  routeMain: "#00A86B",
  routeOutline: "#B8E5D4",
  pickupGreen: "#00A86B",
  dropRed: "#EF4444",
  driverBlue: "#3B82F6",
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 100,
};

const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

// ==================== MAP STYLE ====================
const mapStyle = [
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "simplified" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e8e8e8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e4f4" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
];

// ==================== STATUS CONFIG ====================
const STATUS_CONFIG = {
  accepted: {
    title: "Driver is on the way",
    subtitle: "Your driver is coming to pick you up",
    color: COLORS.primary,
    icon: "car",
    showOTP: true,
  },
  arrived: {
    title: "Driver has arrived",
    subtitle: "Your driver is waiting at the pickup point",
    color: COLORS.success,
    icon: "checkmark-circle",
    showOTP: true,
  },
  in_progress: {
    title: "Ride in progress",
    subtitle: "Enjoy your ride!",
    color: COLORS.info,
    icon: "navigate",
    showOTP: false,
  },
};

// ==================== MAIN COMPONENT ====================
export default function DriverAssignedScreen({ route, navigation }) {
  const { orderId } = route.params;
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  // States
  const [order, setOrder] = useState(null);
  const [driverCoord, setDriverCoord] = useState(null);
  const [pickupCoord, setPickupCoord] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [etaMin, setEtaMin] = useState(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const driverMarkerAnim = useRef(new Animated.Value(0)).current;
  const otpScaleAnim = useRef(new Animated.Value(0.8)).current;

  // ==================== ENTRY ANIMATIONS ====================
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
      Animated.spring(otpScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for driver marker
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Driver marker bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(driverMarkerAnim, {
          toValue: -5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(driverMarkerAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ==================== ORDER POLLING ====================
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);

        if (data.driverLocation) {
          setDriverCoord({
            latitude: Number(data.driverLocation.lat),
            longitude: Number(data.driverLocation.lng),
          });
        }

        if (data.pickupLocation) {
          setPickupCoord({
            latitude: Number(data.pickupLocation.lat),
            longitude: Number(data.pickupLocation.lng),
          });
        }
      } catch (err) {
        console.log("ORDER FETCH ERROR", err);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // ==================== DISTANCE CALCULATION ====================
  useEffect(() => {
    if (!pickupCoord || !driverCoord) return;

    const meters = getDistance(pickupCoord, driverCoord);
    const km = meters / 1000;
    setDistanceKm(km.toFixed(1));

    const avgSpeed = 30;
    const minutes = Math.max(1, Math.ceil((km / avgSpeed) * 60));
    setEtaMin(minutes);

    mapRef.current?.fitToCoordinates([pickupCoord, driverCoord], {
      edgePadding: {
        top: 150,
        right: 80,
        bottom: height * 0.45,
        left: 80,
      },
      animated: true,
    });
  }, [pickupCoord, driverCoord]);

  // ==================== STATUS CHANGE HANDLERS ====================
  useEffect(() => {
    if (order?.status === "in_progress") {
      navigation.replace("LiveRideScreen", { orderId });
    }
  }, [order?.status]);

  useEffect(() => {
    if (order?.status === "arrived") {
      Alert.alert(
        "🚗 Driver Arrived!",
        "Your driver is waiting at the pickup point. Please proceed to meet them.",
        [{ text: "OK", style: "default" }]
      );
    }
  }, [order?.status]);

  // ==================== HANDLERS ====================
  const callDriver = useCallback(() => {
    if (order?.driver?.phone) {
      Linking.openURL(`tel:${order.driver.phone}`);
    }
  }, [order?.driver?.phone]);

  const messageDriver = useCallback(() => {
    if (order?.driver?.phone) {
      Linking.openURL(`sms:${order.driver.phone}`);
    }
  }, [order?.driver?.phone]);

  const shareRide = useCallback(async () => {
    try {
      await Share.share({
        message: `I'm on my way! My driver ${order?.driver?.full_name} is picking me up. Vehicle: ${order?.driver?.vehicle || "Car"} (${order?.driver?.vehicle_number || ""}). Track my ride for safety.`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  }, [order]);

  const cancelRide = useCallback(() => {
    Alert.alert(
      "Cancel Ride?",
      "Are you sure you want to cancel? Cancellation charges may apply.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
                method: "POST",
              });
              navigation.goBack();
            } catch (e) {
              console.log("Cancel error:", e);
            }
          },
        },
      ]
    );
  }, [orderId, navigation]);

  // ==================== GET STATUS CONFIG ====================
  const getStatusConfig = () => {
    return STATUS_CONFIG[order?.status] || STATUS_CONFIG.accepted;
  };

  // ==================== LOADING STATE ====================
  if (!order || !order.driver) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingTitle}>Connecting to driver...</Text>
          <Text style={styles.loadingSubtitle}>Please wait a moment</Text>
        </View>
      </View>
    );
  }

  const { driver, status, otp } = order;
  const statusConfig = getStatusConfig();

  // ==================== MAIN RENDER ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ==================== MAP ==================== */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Pickup Marker */}
        {pickupCoord && (
          <Marker coordinate={pickupCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupMarkerWrapper}>
              <Animated.View
                style={[
                  styles.pickupPulse,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.pickupMarker}>
                <View style={styles.pickupMarkerInner} />
              </View>
            </View>
          </Marker>
        )}

        {/* Driver Marker */}
        {driverCoord && (
          <Marker coordinate={driverCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <Animated.View
              style={[
                styles.driverMarkerWrapper,
                { transform: [{ translateY: driverMarkerAnim }] },
              ]}
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car-sport" size={22} color={COLORS.white} />
              </View>
              <View style={styles.driverMarkerShadow} />
            </Animated.View>
          </Marker>
        )}
      </MapView>

      {/* ==================== TOP BAR ==================== */}
      <Animated.View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + SPACING.sm,
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "15" }]}>
          <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
            {status === "arrived" ? "Arrived" : "On the way"}
          </Text>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareRide}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
      </Animated.View>

      {/* ==================== ETA CARD ==================== */}
      {distanceKm && etaMin && (
        <Animated.View style={[styles.etaCard, { opacity: fadeAnim }]}>
          <View style={styles.etaContent}>
            <Text style={styles.etaTime}>{etaMin}</Text>
            <Text style={styles.etaUnit}>min</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaContent}>
            <Text style={styles.etaDistance}>{distanceKm}</Text>
            <Text style={styles.etaUnit}>km</Text>
          </View>
        </Animated.View>
      )}

      {/* ==================== BOTTOM SHEET ==================== */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.xxl,
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusIconBg, { backgroundColor: statusConfig.color + "15" }]}>
            <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{statusConfig.title}</Text>
            <Text style={styles.statusSubtitle}>{statusConfig.subtitle}</Text>
          </View>
        </View>

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            {/* Avatar */}
            <View style={styles.driverAvatar}>
              {driver.photo ? (
                <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
              ) : (
                <Text style={styles.driverInitial}>
                  {driver.full_name?.charAt(0)?.toUpperCase() || "D"}
                </Text>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color={COLORS.white} />
              </View>
            </View>

            {/* Driver Details */}
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driver.full_name || "Driver"}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.ratingText}>{driver.rating || "4.8"}</Text>
                <Text style={styles.tripCount}>• {driver.trips || "500"}+ trips</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={messageDriver}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={callDriver}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleDetails}>
              <Ionicons name="car" size={18} color={COLORS.textSecondary} />
              <Text style={styles.vehicleText}>
                {driver.vehicle || "Sedan"} • {driver.vehicle_color || "White"}
              </Text>
            </View>
            <View style={styles.vehicleNumberBadge}>
              <Text style={styles.vehicleNumber}>
                {driver.vehicle_number || "MH 12 AB 1234"}
              </Text>
            </View>
          </View>
        </View>

        {/* OTP Section */}
        {statusConfig.showOTP && otp && (
          <Animated.View
            style={[
              styles.otpSection,
              { transform: [{ scale: otpScaleAnim }] },
            ]}
          >
            <View style={styles.otpHeader}>
              <View style={styles.otpIconBg}>
                <Ionicons name="key" size={16} color={COLORS.warning} />
              </View>
              <Text style={styles.otpLabel}>Share this OTP with driver</Text>
            </View>
            <View style={styles.otpContainer}>
              {otp.toString().split("").map((digit, index) => (
                <View key={index} style={styles.otpDigitBox}>
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.otpNote}>
              Driver will ask for this code to start the ride
            </Text>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={shareRide}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.infoBg }]}>
              <Ionicons name="share-social" size={18} color={COLORS.info} />
            </View>
            <Text style={styles.quickActionText}>Share Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => Alert.alert("Safety", "Emergency contacts will be notified")}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.errorBg }]}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.error} />
            </View>
            <Text style={styles.quickActionText}>Safety</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={cancelRide}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.surface }]}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.quickActionText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Arrived Indicator */}
        {status === "arrived" && (
          <View style={styles.arrivedBanner}>
            <View style={styles.arrivedIconBg}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            </View>
            <View style={styles.arrivedTextContainer}>
              <Text style={styles.arrivedTitle}>Driver has arrived!</Text>
              <Text style={styles.arrivedSubtitle}>Please proceed to the pickup point</Text>
            </View>
          </View>
        )}

        {/* In Progress Indicator */}
        {status === "in_progress" && (
          <View style={styles.progressBanner}>
            <View style={styles.progressIconBg}>
              <Ionicons name="navigate" size={20} color={COLORS.info} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTitle}>Ride in progress</Text>
              <Text style={styles.progressSubtitle}>Enjoy your ride!</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingSpinner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Map
  map: {
    flex: 1,
  },

  // Markers
  pickupMarkerWrapper: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  pickupPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },
  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  pickupMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  driverMarkerWrapper: {
    alignItems: "center",
  },
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.driverBlue,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  driverMarkerShadow: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginTop: 4,
  },

  // Top Bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },

  // ETA Card
  etaCard: {
    position: "absolute",
    top: height * 0.15,
    right: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.large,
  },
  etaContent: {
    alignItems: "center",
  },
  etaTime: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
  },
  etaDistance: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  etaUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  etaDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.lg,
  },

  // Bottom Sheet
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.md,
    ...SHADOWS.large,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },

  // Status Header
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  statusIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  statusSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Driver Card
  driverCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  driverPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  driverInitial: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  driverDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  driverName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
    marginLeft: 4,
  },
  tripCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  vehicleDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  vehicleNumberBadge: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  vehicleNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // OTP Section
  otpSection: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.warningBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning + "30",
  },
  otpHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  otpIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.warning + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.warningDark,
    marginLeft: SPACING.sm,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  otpDigitBox: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: SPACING.xs,
    ...SHADOWS.small,
  },
  otpDigit: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  otpNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  quickActionItem: {
    alignItems: "center",
    flex: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },

  // Arrived Banner
  arrivedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
  },
  arrivedIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  arrivedTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  arrivedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.successDark,
  },
  arrivedSubtitle: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },

  // Progress Banner
  progressBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.infoBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.info + "30",
  },
  progressIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.info + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  progressTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.info,
  },
  progressSubtitle: {
    fontSize: 12,
    color: COLORS.info,
    marginTop: 2,
  },
});