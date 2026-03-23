import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  BackHandler,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenWrapper from "../components/ScreenWrapper";
import { API_BASE_URL } from "../config";

const { width, height } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  // Primary Colors
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  primaryDark: "#008F5B",

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
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",

  // Other
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

// ==================== MAIN COMPONENT ====================
export default function FindingDriverScreen({ route, navigation }) {
  // Extract all params from navigation
  const {
    orderId,
    pickup: pickupParam,
    pickupAddress,
    drop: dropParam,
    dropAddress,
    routeCoords: routeParam,
    // Vehicle Details
    vehicleId,
    vehicleName,
    vehicleImage,
    vehicleCapacity,
    // Trip Details
    distance,
    distanceKm,
    duration,
    durationMinutes,
    // Fare Details
    totalFare,
    baseFare,
    isNight,
    isPeak,
    trafficLevel,
    // Payment
    paymentMethod,
  } = route.params || {};

  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  // States
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [showCancel, setShowCancel] = useState(true);
  const [searchTime, setSearchTime] = useState(0);
  const [nearbyDrivers, setNearbyDrivers] = useState(0);
  const [searchStatus, setSearchStatus] = useState("searching"); // searching, found, cancelled
  const [driverInfo, setDriverInfo] = useState(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ripple1Anim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;
  const ripple3Anim = useRef(new Animated.Value(0)).current;
  const carMoveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  // ==================== LOAD MAP DATA ====================
  useEffect(() => {
    if (pickupParam && dropParam) {
      setPickup({
        latitude: pickupParam.lat,
        longitude: pickupParam.lng,
      });

      setDrop({
        latitude: dropParam.lat,
        longitude: dropParam.lng,
      });
    }

    if (routeParam?.length > 0) {
      setRouteCoords(routeParam);

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeParam, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: height * 0.5,
            left: 50,
          },
          animated: true,
        });
      }, 500);
    }

    // Entry animations
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
    ]).start();
  }, []);

  // ==================== BLOCK BACK BUTTON ====================
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "🚗 Finding Driver",
        "Are you sure you want to cancel this booking?",
        [
          { text: "Keep Searching", style: "cancel" },
          {
            text: "Cancel Booking",
            style: "destructive",
            onPress: cancelRequest,
          },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    navigation.setOptions({
      gestureEnabled: false,
      headerShown: false,
    });

    return () => backHandler.remove();
  }, []);

  // ==================== ORDER POLLING ====================
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        // Update nearby drivers count
        if (data.nearby_drivers !== undefined) {
          setNearbyDrivers(data.nearby_drivers);
        }

        if (data.status === "accepted") {
          clearInterval(interval);
          setSearchStatus("found");
          setDriverInfo(data.driver);

          // Navigate after brief delay
          setTimeout(() => {
            navigation.replace("DriverAssignedScreen", { orderId });
          }, 1500);
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // ==================== SEARCH TIMER ====================
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ==================== ANIMATIONS ====================
  useEffect(() => {
    // Pulse animation for pickup marker
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
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

    // Ripple animations
    const createRipple = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createRipple(ripple1Anim, 0);
    createRipple(ripple2Anim, 600);
    createRipple(ripple3Anim, 1200);

    // Car movement animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(carMoveAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(carMoveAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dot loading animation
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dotAnim1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dotAnim2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dotAnim3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    animateDots();
  }, []);

  // ==================== CANCEL REQUEST ====================
  const cancelRequest = useCallback(async () => {
    setShowCancel(false);
    setSearchStatus("cancelled");

    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "POST",
      });
    } catch (e) {
      console.log("Cancel error:", e);
    }

    navigation.goBack();
  }, [orderId, navigation]);

  // ==================== HELPER FUNCTIONS ====================
  const formatSearchTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSearchMessage = () => {
    if (searchTime < 30) return "Notifying nearby drivers...";
    if (searchTime < 60) return "Expanding search area...";
    if (searchTime < 90) return "Finding the best match...";
    return "Still searching, please wait...";
  };

  const getTrafficColor = (level) => {
    switch (level) {
      case "low": return COLORS.success;
      case "moderate": return COLORS.warning;
      case "heavy": return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case "cash": return "cash-outline";
      case "upi": return "phone-portrait-outline";
      case "card": return "card-outline";
      default: return "wallet-outline";
    }
  };

  // Ripple style generator
  const getRippleStyle = (anim) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 3],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  });

  // ==================== LOADING STATE ====================
  if (!pickup || !drop) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.loadingContent}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.loadingTitle}>Setting up your ride...</Text>
            <Text style={styles.loadingSubtitle}>Preparing map view</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

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
        showsTraffic={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeColor={COLORS.routeOutline}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={routeCoords}
              strokeColor={COLORS.routeMain}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {/* Pickup Marker with Ripple Effect */}
        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pickupMarkerWrapper}>
            {/* Ripple effects */}
            <Animated.View style={[styles.ripple, getRippleStyle(ripple1Anim)]} />
            <Animated.View style={[styles.ripple, getRippleStyle(ripple2Anim)]} />
            <Animated.View style={[styles.ripple, getRippleStyle(ripple3Anim)]} />

            {/* Main marker */}
            <Animated.View
              style={[styles.pickupMarker, { transform: [{ scale: pulseAnim }] }]}
            >
              <View style={styles.pickupMarkerInner} />
            </Animated.View>
          </View>
        </Marker>

        {/* Drop Marker */}
        <Marker coordinate={drop} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.dropMarkerWrapper}>
            <View style={styles.dropMarker}>
              <Ionicons name="location-sharp" size={28} color={COLORS.white} />
            </View>
            <View style={styles.dropMarkerShadow} />
          </View>
        </Marker>
      </MapView>

      {/* ==================== TOP STATUS BAR ==================== */}
      <Animated.View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + SPACING.sm,
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.topBarContent}>
          {/* Left - Searching Badge */}
          <View style={styles.searchingBadge}>
            <View style={styles.searchingDot} />
            <Text style={styles.searchingText}>
              {searchStatus === "found" ? "Driver Found!" : "Searching"}
            </Text>
          </View>

          {/* Right - Timer */}
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.timerText}>{formatSearchTime(searchTime)}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ==================== TRIP SUMMARY CARD ==================== */}
      <Animated.View
        style={[
          styles.summaryCard,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryTimeline}>
            <View style={styles.summaryGreenDot} />
            <View style={styles.summaryLine} />
            <View style={styles.summaryRedDot} />
          </View>

          <View style={styles.summaryLocations}>
            <Text style={styles.summaryPickup} numberOfLines={1}>
              {pickupAddress || "Pickup Location"}
            </Text>
            <Text style={styles.summaryDrop} numberOfLines={1}>
              {dropAddress || "Drop Location"}
            </Text>
          </View>
        </View>
      </Animated.View>

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

        {/* Car Animation Section */}
        <View style={styles.carAnimationSection}>
          <View style={styles.carTrack}>
            <View style={styles.carTrackLine} />
            
            {/* Animated Car */}
            <Animated.View
              style={[
                styles.carIconWrapper,
                {
                  transform: [
                    {
                      translateX: carMoveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-width * 0.25, width * 0.25],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.carIconBg}>
                <Ionicons name="car-sport" size={24} color={COLORS.white} />
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Title with Animated Dots */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Finding your driver</Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
            <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
            <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
          </View>
        </View>

        {/* Search Status */}
        <Text style={styles.searchMessage}>{getSearchMessage()}</Text>

        {/* Nearby Drivers */}
        {nearbyDrivers > 0 && (
          <View style={styles.nearbyBadge}>
            <Ionicons name="people" size={14} color={COLORS.primary} />
            <Text style={styles.nearbyText}>
              {nearbyDrivers} driver{nearbyDrivers > 1 ? "s" : ""} nearby
            </Text>
          </View>
        )}

        {/* Trip Details Card */}
        <View style={styles.tripDetailsCard}>
          {/* Vehicle Info */}
          <View style={styles.vehicleRow}>
            {vehicleImage ? (
              <Image source={vehicleImage} style={styles.vehicleImage} />
            ) : (
              <View style={styles.vehicleIconPlaceholder}>
                <Ionicons name="car" size={24} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicleName || "Ride"}</Text>
              <Text style={styles.vehicleCapacity}>
                {vehicleCapacity || 4} seats • {distance || "N/A"}
              </Text>
            </View>
            <View style={styles.fareContainer}>
              <Text style={styles.fareLabel}>Fare</Text>
              <Text style={styles.fareAmount}>₹{totalFare || 0}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.tripDetailsDivider} />

          {/* Trip Stats */}
          <View style={styles.tripStatsRow}>
            <View style={styles.tripStatItem}>
              <Ionicons name="navigate" size={16} color={COLORS.primary} />
              <Text style={styles.tripStatValue}>{distanceKm || 0} km</Text>
            </View>

            <View style={styles.tripStatDivider} />

            <View style={styles.tripStatItem}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.tripStatValue}>{durationMinutes || 0} min</Text>
            </View>

            <View style={styles.tripStatDivider} />

            <View style={styles.tripStatItem}>
              <Ionicons
                name="car"
                size={16}
                color={getTrafficColor(trafficLevel)}
              />
              <Text
                style={[
                  styles.tripStatValue,
                  { color: getTrafficColor(trafficLevel) },
                ]}
              >
                {trafficLevel ? trafficLevel.charAt(0).toUpperCase() + trafficLevel.slice(1) : "Normal"}
              </Text>
            </View>
          </View>

          {/* Time/Peak Indicators */}
          {(isNight || isPeak) && (
            <View style={styles.indicatorsRow}>
              {isNight && (
                <View style={[styles.indicator, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="moon" size={12} color={COLORS.primary} />
                  <Text style={styles.indicatorText}>Night Fare</Text>
                </View>
              )}
              {isPeak && (
                <View style={[styles.indicator, { backgroundColor: COLORS.warningBg }]}>
                  <Ionicons name="trending-up" size={12} color={COLORS.warning} />
                  <Text style={[styles.indicatorText, { color: COLORS.warning }]}>Peak Hour</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <Ionicons name={getPaymentIcon()} size={18} color={COLORS.textDark} />
            <Text style={styles.paymentText}>
              {paymentMethod ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) : "Cash"}
            </Text>
          </View>
          <Text style={styles.paymentAmount}>₹{totalFare || 0}</Text>
        </View>

        {/* Cancel Button */}
        {showCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                "Cancel Ride?",
                "Are you sure you want to cancel this booking?",
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: cancelRequest,
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        {/* Safety Tip */}
        <View style={styles.safetyTip}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
          <Text style={styles.safetyTipText}>
            Share your ride details with family for safety
          </Text>
        </View>
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

  // Pickup Marker
  pickupMarkerWrapper: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  ripple: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  pickupMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  pickupMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },

  // Drop Marker
  dropMarkerWrapper: {
    alignItems: "center",
  },
  dropMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dropRed,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  dropMarkerShadow: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginTop: 4,
  },

  // Top Bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    zIndex: 10,
  },
  topBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
  },
  searchingBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  searchingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontVariant: ["tabular-nums"],
  },

  // Summary Card
  summaryCard: {
    position: "absolute",
    top: height * 0.32,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.large,
    zIndex: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryTimeline: {
    alignItems: "center",
    marginRight: SPACING.md,
  },
  summaryGreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  summaryLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.lightGray,
    marginVertical: SPACING.xs,
  },
  summaryRedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.dropRed,
  },
  summaryLocations: {
    flex: 1,
  },
  summaryPickup: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  summaryDrop: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
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

  // Car Animation
  carAnimationSection: {
    height: 60,
    justifyContent: "center",
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  carTrack: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  carTrackLine: {
    position: "absolute",
    left: SPACING.xxxl,
    right: SPACING.xxxl,
    height: 3,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
  },
  carIconWrapper: {
    zIndex: 10,
  },
  carIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },

  // Title Section
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  dotsRow: {
    flexDirection: "row",
    marginLeft: SPACING.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textDark,
    marginHorizontal: 2,
  },

  // Search Message
  searchMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },

  // Nearby Badge
  nearbyBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  nearbyText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },

  // Trip Details Card
  tripDetailsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleImage: {
    width: 60,
    height: 40,
    resizeMode: "contain",
  },
  vehicleIconPlaceholder: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  vehicleCapacity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fareContainer: {
    alignItems: "flex-end",
  },
  fareLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  tripDetailsDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  tripStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tripStatItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  tripStatValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
    marginLeft: SPACING.xs,
  },
  tripStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
  },
  indicatorsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.md,
    flexWrap: "wrap",
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },

  // Payment Row
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
    marginLeft: SPACING.sm,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  // Cancel Button
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },

  // Safety Tip
  safetyTip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
  },
  safetyTipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
});