// screens/driver/FindingDriverScreen.js

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
  Easing,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config";
import ScreenWrapper from "../../components/ScreenWrapper";

const { width, height } = Dimensions.get("window");

const C = {
  violet: "#3D2B8C", violetDark: "#2A1E6B", violetMid: "#4D3CA0",
  blue: "#1E40AF", blueDark: "#1E3A8A", blueDeep: "#172554",
  primarySoft: "#EEEAFB", primarySoftDeep: "#DCD4F5", lavenderBg: "#F1EEFB",
  primaryFade: "rgba(61,43,140,0.08)", primaryGlow: "rgba(61,43,140,0.30)",
  gold: "#F5C518", goldLight: "#FFD740", goldDark: "#C9A015",
  goldDeep: "#7A5C00", goldSoft: "#FEF7E0",
  bg: "#F7F7FA", card: "#FFFFFF", surface: "#F9FAFB",
  textDark: "#0F0F1F", textPrimary: "#1F1F33", textMid: "#4A4A66",
  textLight: "#7B7B95", textFaint: "#A8A8BC",
  border: "#EDEDF2", borderMid: "#DDDDE5", divider: "#E8E8EE",
  pastelBlue: "#E3F0FF", blueAccent: "#3B82F6",
  pastelGreen: "#E8F5E9", green: "#34A853", greenDark: "#16A34A",
  pastelOrange: "#FFE8D6", orange: "#F59E0B",
  pastelRed: "#FEE2E2", red: "#EF4444",
  success: "#22C55E", successBg: "#E8F8EF", successDark: "#16A34A",
  warning: "#F59E0B", warningBg: "#FFFBEB",
  white: "#FFFFFF", shadow: "#0F0F1F",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R  = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary:     [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  gold:        [C.goldLight, C.gold, C.goldDark],
  goldShine:   [C.goldLight, C.gold],
  lavender:    [C.primarySoft, C.lavenderBg],
};

const MAP_STYLE = [
  { elementType: "geometry",           stylers: [{ color: "#F5F5F8" }] },
  { elementType: "labels.icon",        stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#7B7B95" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi",                stylers: [{ visibility: "off" }] },
  { featureType: "road",      elementType: "geometry",  stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#E8E2F8" }] },
  { featureType: "transit",    stylers: [{ visibility: "off" }] },
  { featureType: "water",      elementType: "geometry",  stylers: [{ color: "#D0DCF0" }] },
];

const formatSearchTime = (s) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
};

const getTrafficColor = (level) =>
  ({ low: C.success, moderate: C.orange, heavy: C.red, severe: "#B91C1C" }[level] || C.textLight);

const getPaymentIcon = (method) =>
  ({ cash: "cash-outline", upi: "phone-portrait-outline", card: "card-outline" }[method] || "wallet-outline");

// ✅ Centralized service type checker — single source of truth
const isCarWashService = (serviceType) => {
  if (!serviceType) return false;
  const s = String(serviceType).toLowerCase().trim();
  return s === "car_wash" || s === "carwash" || s === "car-wash";
};

// ✅ Centralized navigation handler — prevents any misrouting
const navigateAfterAccept = (navigation, orderId, data, routeServiceType) => {
  const effectiveServiceType = routeServiceType || data.service_type || "";

  console.log(`🎯 navigateAfterAccept | orderId: ${orderId}`);
  console.log(`   routeServiceType (from params): "${routeServiceType}"`);
  console.log(`   server service_type: "${data.service_type}"`);
  console.log(`   effectiveServiceType: "${effectiveServiceType}"`);

  if (isCarWashService(effectiveServiceType)) {
    console.log("   → Navigating to TechnicianEnRouteScreen");
    navigation.replace("TechnicianEnRouteScreen", {
      orderId,
      technician:      data.driver   || null,
      advancePaid:     data.advance_amount                                    || 0,
      totalAmount:     data.customer_total || data.price                      || 0,
      remainingAmount: data.remaining_amount
        || ((data.price || 0) - (data.advance_amount || 0))                  || 0,
    });
  } else {
    console.log("   → Navigating to DriverAssignedScreen");
    navigation.replace("DriverAssignedScreen", { orderId });
  }
};

// ==================== RIPPLE COMPONENT ====================
const RippleRing = ({ anim, size, color }) => (
  <Animated.View
    style={{
      position:     "absolute",
      width:        size,
      height:       size,
      borderRadius: size / 2,
      borderWidth:  2,
      borderColor:  color,
      transform: [{
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }),
      }],
      opacity: anim.interpolate({
        inputRange: [0, 0.4, 1], outputRange: [0.8, 0.4, 0],
      }),
    }}
  />
);

// ==================== MAIN COMPONENT ====================
export default function FindingDriverScreen({ route, navigation }) {
  const {
    orderId,
    serviceType:     routeServiceType,
    pickup:          pickupParam,
    drop:            dropParam,
    pickupAddress:   pickupAddressParam,
    dropAddress:     dropAddressParam,
    routeCoords:     routeParam,
    vehicleName,
    vehicleImage,
    vehicleCapacity,
    distance,
    distanceKm,
    duration,
    durationMinutes,
    totalFare,
    isNight,
    isPeak,
    trafficLevel,
    paymentMethod,
  } = route.params || {};

  const mapRef   = useRef(null);
  const insets   = useSafeAreaInsets();

  // ✅ CHANGE 1: Both navigation lock refs
  const hasNavigated    = useRef(false);
  const isNavigatingRef = useRef(false); // ✅ Extra atomic lock

  const [pickup,        setPickup]        = useState(null);
  const [drop,          setDrop]          = useState(null);
  const [routeCoords,   setRouteCoords]   = useState([]);
  const [showCancel,    setShowCancel]    = useState(true);
  const [searchTime,    setSearchTime]    = useState(0);
  const [nearbyDrivers, setNearbyDrivers] = useState(0);
  const [searchStatus,  setSearchStatus]  = useState("searching");
  const [pickupAddress, setPickupAddress] = useState(pickupAddressParam || "Pickup Location");
  const [dropAddress,   setDropAddress]   = useState(dropAddressParam   || "Drop Location");
  const [fareAmount,    setFareAmount]    = useState(totalFare           || 0);
  const [payMethod,     setPayMethod]     = useState(paymentMethod       || "cash");
  const [fetchedKm,     setFetchedKm]     = useState(distanceKm || (typeof distance === "number" ? distance : 0));
  const [fetchedMinutes,setFetchedMinutes]= useState(durationMinutes || (typeof duration === "number" ? duration : 0));

  // ── Animations ──
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const ripple1    = useRef(new Animated.Value(0)).current;
  const ripple2    = useRef(new Animated.Value(0)).current;
  const ripple3    = useRef(new Animated.Value(0)).current;
  const carMoveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(80)).current;
  const dotAnim1   = useRef(new Animated.Value(0.3)).current;
  const dotAnim2   = useRef(new Animated.Value(0.3)).current;
  const dotAnim3   = useRef(new Animated.Value(0.3)).current;
  const goldPulse  = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // ✅ CHANGE 2: Safe navigation wrapper — atomic lock prevents race conditions
  const safeNavigateAfterAccept = useCallback((data) => {
    // ✅ Atomic check — prevents race between fetchOrderForCoords + polling
    if (hasNavigated.current || isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    hasNavigated.current    = true;
    setSearchStatus("found");
    setShowCancel(false);
    navigateAfterAccept(navigation, orderId, data, routeServiceType);
  }, [orderId, routeServiceType, navigation]);

  // ==================== SAFETY GUARD ====================
  useEffect(() => {
    if (isCarWashService(routeServiceType)) {
      console.warn("⚠️ FindingDriverScreen received carwash serviceType — redirecting to FindingTechnicianScreen");
      navigation.replace("FindingTechnicianScreen", {
        orderId,
        serviceType:     routeServiceType,
        totalAmount:     totalFare || 0,
        advancePaid:     0,
        remainingAmount: totalFare || 0,
      });
    }
  }, [routeServiceType]);

  // ==================== LOAD MAP DATA ====================
  useEffect(() => {
    if (pickupParam && dropParam) {
      setPickup({ latitude: pickupParam.lat, longitude: pickupParam.lng });
      setDrop({ latitude: dropParam.lat, longitude: dropParam.lng });
    }

    if (routeParam?.length > 0) {
      setRouteCoords(routeParam);
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeParam, {
          edgePadding: { top: 100, right: 50, bottom: height * 0.52, left: 50 },
          animated: true,
        });
      }, 500);
    }

    if (!pickupParam || !dropParam) {
      fetchOrderForCoords();
    }

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // ==================== FETCH ORDER COORDS ====================
  // ✅ CHANGE 3: Uses safeNavigateAfterAccept instead of direct navigation
  const fetchOrderForCoords = async () => {
    if (!orderId) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      const data = await res.json();

      if (data.pickup_lat && data.pickup_lng) {
        setPickup({ latitude: parseFloat(data.pickup_lat), longitude: parseFloat(data.pickup_lng) });
      }
      if (data.drop_lat && data.drop_lng) {
        setDrop({ latitude: parseFloat(data.drop_lat), longitude: parseFloat(data.drop_lng) });
      }
      if (data.pickup_address) setPickupAddress(data.pickup_address);
      if (data.drop_address)   setDropAddress(data.drop_address);
      if (data.customer_total || data.price) setFareAmount(parseFloat(data.customer_total || data.price));
      if (data.payment_method) setPayMethod(data.payment_method);
      if (data.distance)       setFetchedKm(parseFloat(data.distance));
      if (data.duration)       setFetchedMinutes(parseFloat(data.duration));

      // ✅ CHANGE 3: Use safeNavigateAfterAccept — atomic lock handles the guard
      if (data.status === "accepted") {
        setTimeout(() => safeNavigateAfterAccept(data), 800);
      }

    } catch (err) {
      console.log("fetchOrderForCoords error:", err);
    }
  };

  // ==================== BACK HANDLER ====================
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert(
        "Finding Driver",
        "Are you sure you want to cancel this booking?",
        [
          { text: "Keep Searching", style: "cancel" },
          { text: "Cancel Booking", style: "destructive", onPress: cancelRequest },
        ]
      );
      return true;
    });
    navigation.setOptions({ gestureEnabled: false, headerShown: false });
    return () => sub.remove();
  }, []);

  // ==================== POLLING ====================
  // ✅ CHANGE 4 + CHANGE 5: Uses safeNavigateAfterAccept, deps array only has orderId
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        if (data.nearby_drivers !== undefined) {
          setNearbyDrivers(data.nearby_drivers);
        }

        // ✅ CHANGE 4: Use safeNavigateAfterAccept — no manual hasNavigated check needed
        if (data.status === "accepted") {
          clearInterval(interval);
          setTimeout(() => safeNavigateAfterAccept(data), 1500);
        }

        if (data.status === "cancelled") {
          clearInterval(interval);
          Alert.alert(
            "Booking Cancelled",
            "Your booking was cancelled.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }

      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]); // ✅ CHANGE 5: Removed routeServiceType — captured via safeNavigateAfterAccept closure

  // ==================== TIMER ====================
  useEffect(() => {
    const t = setInterval(() => setSearchTime((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ==================== ANIMATIONS ====================
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();

    const makeRipple = (anim, delay) => {
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])).start();
    };
    makeRipple(ripple1, 0);
    makeRipple(ripple2, 700);
    makeRipple(ripple3, 1400);

    Animated.loop(Animated.sequence([
      Animated.timing(carMoveAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(carMoveAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.stagger(220, [
      Animated.sequence([
        Animated.timing(dotAnim1, { toValue: 1,    duration: 350, useNativeDriver: true }),
        Animated.timing(dotAnim1, { toValue: 0.25, duration: 350, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(dotAnim2, { toValue: 1,    duration: 350, useNativeDriver: true }),
        Animated.timing(dotAnim2, { toValue: 0.25, duration: 350, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(dotAnim3, { toValue: 1,    duration: 350, useNativeDriver: true }),
        Animated.timing(dotAnim3, { toValue: 0.25, duration: 350, useNativeDriver: true }),
      ]),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(goldPulse,   { toValue: 1.02, duration: 1500, useNativeDriver: true }),
      Animated.timing(goldPulse,   { toValue: 1,    duration: 1500, useNativeDriver: true }),
    ])).start();

    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true })
    ).start();
  }, []);

  // ==================== CANCEL ====================
  const cancelRequest = useCallback(async () => {
    if (hasNavigated.current) return;
    setShowCancel(false);
    setSearchStatus("cancelled");
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, { method: "POST" });
    } catch {}
    navigation.goBack();
  }, [orderId, navigation]);

  const getSearchMessage = () => {
    if (searchStatus === "found") return "Driver is on the way!";
    if (searchTime < 30)  return "Notifying nearby drivers...";
    if (searchTime < 60)  return "Expanding search area...";
    if (searchTime < 90)  return "Finding the best match...";
    return "Still searching, please wait...";
  };

  const shimmerX = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-120, 320],
  });

  // ==================== LOADING STATE ====================
  if (!pickup || !drop) {
    return (
      <ScreenWrapper backgroundColor={C.bg}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <LinearGradient colors={GRAD.primary} style={styles.loaderIconWrap}>
              <Ionicons name="car-sport" size={32} color={C.white} />
            </LinearGradient>
            <ActivityIndicator size="large" color={C.violet} style={{ marginTop: SP.xl }} />
            <Text style={styles.loaderTitle}>Setting up your ride...</Text>
            <Text style={styles.loaderSub}>Preparing map view</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── MAP ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {routeCoords.length > 0 && (
          <>
            <Polyline coordinates={routeCoords} strokeColor={C.violet + "30"} strokeWidth={9} lineCap="round" />
            <Polyline coordinates={routeCoords} strokeColor={C.violet}       strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        )}

        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerWrapper}>
            <RippleRing anim={ripple1} size={36} color={C.violet} />
            <RippleRing anim={ripple2} size={36} color={C.violet} />
            <RippleRing anim={ripple3} size={36} color={C.violet} />
            <Animated.View style={[styles.pickupMarkerOuter, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient colors={GRAD.primary} style={styles.pickupMarkerInner}>
                <View style={styles.pickupMarkerDot} />
              </LinearGradient>
            </Animated.View>
          </View>
        </Marker>

        <Marker coordinate={drop} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.dropMarkerWrap}>
            <LinearGradient colors={[C.red, "#C0392B"]} style={styles.dropMarkerCircle}>
              <Ionicons name="location" size={18} color={C.white} />
            </LinearGradient>
            <View style={styles.dropMarkerTail} />
          </View>
        </Marker>
      </MapView>

      {/* ── TOP BAR ── */}
      <Animated.View style={[styles.topBar, { paddingTop: insets.top > 0 ? insets.top + SP.sm : SP.xxxl, opacity: fadeAnim }]}>
        <View style={styles.topBarCard}>
          <View style={styles.topBarLeft}>
            <View style={[styles.topBarStatusDot, { backgroundColor: searchStatus === "found" ? C.success : C.violet }]} />
            <Text style={styles.topBarStatusText}>{searchStatus === "found" ? "Driver Found!" : "Searching"}</Text>
          </View>
          <View style={styles.timerPill}>
            <Ionicons name="time-outline" size={13} color={C.violet} />
            <Text style={styles.timerText}>{formatSearchTime(searchTime)}</Text>
          </View>
          <TouchableOpacity style={styles.helpPill}>
            <Ionicons name="headset" size={13} color={C.violet} />
            <Text style={styles.helpText}>Help</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── ROUTE SUMMARY CARD ── */}
      <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
        <View style={styles.summaryTimeline}>
          <LinearGradient colors={GRAD.primary} style={styles.summaryDotTop} />
          <View style={styles.summaryLine} />
          <View style={styles.summaryDotBottom} />
        </View>
        <View style={styles.summaryLocations}>
          <Text style={styles.summaryPickup} numberOfLines={1}>{pickupAddress}</Text>
          <Text style={styles.summaryDrop}   numberOfLines={1}>{dropAddress}</Text>
        </View>
        {fareAmount > 0 && (
          <View style={styles.summaryFarePill}>
            <Text style={styles.summaryFareText}>₹{fareAmount}</Text>
          </View>
        )}
      </Animated.View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View style={[styles.bottomSheet, { paddingBottom: insets.bottom > 0 ? insets.bottom + SP.sm : SP.xxl, transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
        <View style={styles.sheetHandle} />

        {/* Search Animation */}
        <View style={styles.searchAnimSection}>
          <View style={styles.carTrack}>
            <View style={styles.carTrackBg} />
            <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.carTrackFill, { overflow: "hidden" }]}>
              <Animated.View style={[styles.carTrackShimmer, { transform: [{ translateX: shimmerX }] }]} />
            </LinearGradient>
            <Animated.View style={[styles.carIconWrap, { transform: [{ translateX: carMoveAnim.interpolate({ inputRange: [0, 1], outputRange: [-(width * 0.28), width * 0.28] }) }] }]}>
              <LinearGradient colors={GRAD.primary} style={styles.carIconCircle}>
                <Ionicons name="car-sport" size={22} color={C.white} />
              </LinearGradient>
              <View style={styles.speedLines}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.speedLine, { width: 10 + i * 6, opacity: 0.4 - i * 0.1 }]} />
                ))}
              </View>
            </Animated.View>
          </View>

          <View style={styles.searchTitleRow}>
            <Text style={styles.searchTitle}>
              {searchStatus === "found" ? "Driver Found! 🎉" : "Finding your driver"}
            </Text>
            {searchStatus !== "found" && (
              <View style={styles.dotsRow}>
                {[dotAnim1, dotAnim2, dotAnim3].map((d, i) => (
                  <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
                ))}
              </View>
            )}
          </View>

          <Text style={styles.searchMessage}>{getSearchMessage()}</Text>

          {nearbyDrivers > 0 && (
            <View style={styles.nearbyBadge}>
              <LinearGradient colors={GRAD.lavender} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <View style={styles.nearbyIconWrap}>
                <Ionicons name="people" size={13} color={C.violet} />
              </View>
              <Text style={styles.nearbyText}>{nearbyDrivers} driver{nearbyDrivers > 1 ? "s" : ""} nearby</Text>
              <View style={styles.nearbyDot} />
            </View>
          )}
        </View>

        {/* Trip Details Card */}
        <View style={styles.tripCard}>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIconBox}>
              {vehicleImage ? (
                <Image source={vehicleImage} style={styles.vehicleImg} />
              ) : (
                <Ionicons name="car-sport" size={26} color={C.violet} />
              )}
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicleName || "Your Ride"}</Text>
              <View style={styles.vehicleCapRow}>
                <Ionicons name="people-outline" size={12} color={C.textFaint} />
                <Text style={styles.vehicleCapText}>{vehicleCapacity || 4} seats</Text>
              </View>
            </View>
            <View style={styles.fareBox}>
              <Text style={styles.fareBoxLabel}>Total Fare</Text>
              <Text style={styles.fareBoxAmount}>₹{fareAmount}</Text>
            </View>
          </View>

          <View style={styles.tripCardDivider} />

          <View style={styles.statsRow}>
            {[
              { icon: "navigate", value: `${fetchedKm || 0} km`,     color: C.violet },
              { icon: "time",     value: `${fetchedMinutes || 0} min`, color: C.violet },
              { icon: "car",      value: trafficLevel ? trafficLevel.charAt(0).toUpperCase() + trafficLevel.slice(1) : "Normal", color: getTrafficColor(trafficLevel) },
            ].map((stat, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statsDivider} />}
                <View style={styles.statItem}>
                  <Ionicons name={stat.icon} size={14} color={stat.color} />
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {(isNight || isPeak) && (
            <View style={styles.surgeRow}>
              {isNight && (
                <View style={[styles.surgeBadge, { backgroundColor: C.primarySoft }]}>
                  <Ionicons name="moon" size={11} color={C.violet} />
                  <Text style={[styles.surgeBadgeText, { color: C.violet }]}>Night Fare</Text>
                </View>
              )}
              {isPeak && (
                <View style={[styles.surgeBadge, { backgroundColor: C.warningBg }]}>
                  <Ionicons name="trending-up" size={11} color={C.warning} />
                  <Text style={[styles.surgeBadgeText, { color: C.warning }]}>Peak Hour</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Payment Card */}
        <View style={styles.paymentCard}>
          <LinearGradient colors={GRAD.lavender} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={styles.paymentLeft}>
            <View style={styles.paymentIconWrap}>
              <Ionicons name={getPaymentIcon(payMethod)} size={16} color={C.violet} />
            </View>
            <View>
              <Text style={styles.paymentLabel}>Payment</Text>
              <Text style={styles.paymentMethod}>
                {payMethod === "upi" ? "UPI" : payMethod ? payMethod.charAt(0).toUpperCase() + payMethod.slice(1) : "Cash"}
              </Text>
            </View>
          </View>
          <View style={styles.paymentRight}>
            <Text style={styles.paymentAmountLabel}>You Pay</Text>
            <Text style={styles.paymentAmount}>₹{fareAmount}</Text>
          </View>
        </View>

        {/* Cancel Button */}
        {showCancel && (
          <Animated.View style={{ transform: [{ scale: goldPulse }], paddingHorizontal: SP.lg }}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() =>
                Alert.alert(
                  "Cancel Ride?",
                  "Are you sure you want to cancel this booking?",
                  [
                    { text: "Keep Searching", style: "cancel" },
                    { text: "Yes, Cancel", style: "destructive", onPress: cancelRequest },
                  ]
                )
              }
              activeOpacity={0.85}
            >
              <View style={styles.cancelBtnIconLeft}>
                <Ionicons name="close" size={15} color={C.textDark} />
              </View>
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              <View style={styles.cancelBtnIconRight}>
                <Ionicons name="arrow-forward" size={13} color={C.textDark} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <LinearGradient colors={GRAD.lavender} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={GRAD.primary} style={styles.safetyIconWrap}>
            <Ionicons name="shield-checkmark" size={14} color={C.white} />
          </LinearGradient>
          <Text style={styles.safetyText}>Share your ride details with family for safety</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  map:       { flex: 1 },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  loaderCard: {
    backgroundColor: C.white, borderRadius: R.xl, padding: SP.xxxl, alignItems: "center",
    shadowColor: C.violet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8, width: "75%",
  },
  loaderIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  loaderTitle: { fontSize: 16, fontWeight: "800", color: C.textDark, marginTop: SP.lg, letterSpacing: -0.3 },
  loaderSub:   { fontSize: 13, color: C.textLight, fontWeight: "500", marginTop: SP.xs },

  markerWrapper: { width: 110, height: 110, justifyContent: "center", alignItems: "center" },
  pickupMarkerOuter: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.white, justifyContent: "center", alignItems: "center",
    shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  pickupMarkerInner: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: C.white },
  pickupMarkerDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  dropMarkerWrap:    { alignItems: "center" },
  dropMarkerCircle: {
    width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: C.white,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
  },
  dropMarkerTail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#C0392B", marginTop: -1 },

  topBar:           { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: SP.lg, paddingBottom: SP.md, zIndex: 10 },
  topBarCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.white,
    paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.xl,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
    borderWidth: 1, borderColor: C.border,
  },
  topBarLeft:       { flexDirection: "row", alignItems: "center", gap: SP.sm, flex: 1 },
  topBarStatusDot:  { width: 8, height: 8, borderRadius: 4 },
  topBarStatusText: { fontSize: 14, fontWeight: "800", color: C.textDark, letterSpacing: -0.2 },
  timerPill:  { flexDirection: "row", alignItems: "center", gap: SP.xs, backgroundColor: C.primarySoft, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full, marginHorizontal: SP.sm },
  timerText:  { fontSize: 12, fontWeight: "700", color: C.violet },
  helpPill:   { flexDirection: "row", alignItems: "center", gap: SP.xs, backgroundColor: C.primarySoft, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full },
  helpText:   { fontSize: 12, fontWeight: "700", color: C.violet },

  summaryCard: {
    position: "absolute", top: "28%", left: SP.lg, right: SP.lg,
    flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.lg, padding: SP.lg,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
    zIndex: 10, borderWidth: 1, borderColor: C.border,
  },
  summaryTimeline:   { alignItems: "center", marginRight: SP.md },
  summaryDotTop:     { width: 10, height: 10, borderRadius: 5 },
  summaryLine:       { width: 2, height: 20, backgroundColor: C.border, marginVertical: 3 },
  summaryDotBottom:  { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  summaryLocations:  { flex: 1 },
  summaryPickup:     { fontSize: 13, fontWeight: "600", color: C.textDark, marginBottom: SP.sm },
  summaryDrop:       { fontSize: 13, fontWeight: "600", color: C.textDark },
  summaryFarePill:   { backgroundColor: C.primarySoft, paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: R.full, marginLeft: SP.sm, borderWidth: 1, borderColor: C.violet + "20" },
  summaryFareText:   { fontSize: 13, fontWeight: "800", color: C.violet },

  bottomSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.white,
    borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, paddingTop: SP.md,
    shadowColor: C.violet, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderMid, alignSelf: "center", marginBottom: SP.md },

  searchAnimSection: { paddingHorizontal: SP.lg, marginBottom: SP.md },
  carTrack:    { height: 56, justifyContent: "center", alignItems: "center", marginBottom: SP.md, position: "relative" },
  carTrackBg:  { position: "absolute", left: SP.xxxl, right: SP.xxxl, height: 4, backgroundColor: C.primarySoft, borderRadius: 2 },
  carTrackFill:{ position: "absolute", left: SP.xxxl, right: SP.xxxl, height: 4, borderRadius: 2 },
  carTrackShimmer: { position: "absolute", top: 0, bottom: 0, width: 80, backgroundColor: "rgba(255,255,255,0.5)", transform: [{ skewX: "-20deg" }] },
  carIconWrap: { position: "absolute", zIndex: 10 },
  carIconCircle: {
    width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center",
    shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  speedLines: { position: "absolute", left: -14, top: "50%", marginTop: -6, gap: 3 },
  speedLine:  { height: 2, backgroundColor: C.violet, borderRadius: 1, marginBottom: 2 },
  searchTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: SP.xs },
  searchTitle:    { fontSize: 18, fontWeight: "900", color: C.textDark, letterSpacing: -0.4 },
  dotsRow:    { flexDirection: "row", alignItems: "center", marginLeft: SP.sm, gap: 3 },
  dot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: C.violet },
  searchMessage: { fontSize: 13, color: C.textLight, textAlign: "center", fontWeight: "500", marginBottom: SP.md },
  nearbyBadge: {
    flexDirection: "row", alignItems: "center", alignSelf: "center", paddingHorizontal: SP.lg, paddingVertical: SP.sm,
    borderRadius: R.full, overflow: "hidden", gap: SP.sm, borderWidth: 1, borderColor: C.violet + "20", marginBottom: SP.xs,
  },
  nearbyIconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  nearbyText:     { fontSize: 12, fontWeight: "700", color: C.violet },
  nearbyDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },

  tripCard: { backgroundColor: C.surface, marginHorizontal: SP.lg, borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border },
  vehicleRow:    { flexDirection: "row", alignItems: "center" },
  vehicleIconBox:{ width: 56, height: 44, borderRadius: R.md, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center", marginRight: SP.md },
  vehicleImg:    { width: 48, height: 32, resizeMode: "contain" },
  vehicleInfo:   { flex: 1 },
  vehicleName:   { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: -0.2 },
  vehicleCapRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  vehicleCapText:{ fontSize: 11, color: C.textFaint, fontWeight: "500" },
  fareBox:       { alignItems: "flex-end" },
  fareBoxLabel:  { fontSize: 10, color: C.textLight, fontWeight: "600", marginBottom: 2 },
  fareBoxAmount: { fontSize: 20, fontWeight: "900", color: C.violet, letterSpacing: -0.5 },
  tripCardDivider:{ height: 1, backgroundColor: C.border, marginVertical: SP.md },
  statsRow:   { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  statItem:   { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SP.xs },
  statValue:  { fontSize: 13, fontWeight: "700", color: C.textDark },
  statsDivider: { width: 1, height: 18, backgroundColor: C.borderMid },
  surgeRow:   { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: SP.sm, marginTop: SP.md },
  surgeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full, gap: SP.xs },
  surgeBadgeText: { fontSize: 11, fontWeight: "700" },

  paymentCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: SP.lg,
    borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.violet + "20",
  },
  paymentLeft:        { flexDirection: "row", alignItems: "center", gap: SP.md },
  paymentIconWrap:    { width: 38, height: 38, borderRadius: 19, backgroundColor: C.white, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  paymentLabel:       { fontSize: 11, color: C.textLight, fontWeight: "600", marginBottom: 2 },
  paymentMethod:      { fontSize: 14, fontWeight: "800", color: C.violet, letterSpacing: -0.2 },
  paymentRight:       { alignItems: "flex-end" },
  paymentAmountLabel: { fontSize: 10, color: C.textLight, fontWeight: "600", marginBottom: 2 },
  paymentAmount:      { fontSize: 18, fontWeight: "900", color: C.textDark, letterSpacing: -0.5 },

  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.gold,
    paddingVertical: SP.md + 2, borderRadius: R.full, marginBottom: SP.md,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, gap: SP.sm,
  },
  cancelBtnIconLeft:  { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.1)", justifyContent: "center", alignItems: "center" },
  cancelBtnText:      { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: 0.2 },
  cancelBtnIconRight: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.1)", justifyContent: "center", alignItems: "center" },

  safetyBanner: {
    flexDirection: "row", alignItems: "center", marginHorizontal: SP.lg, borderRadius: R.lg, padding: SP.md,
    overflow: "hidden", gap: SP.md, borderWidth: 1, borderColor: C.violet + "20",
  },
  safetyIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  safetyText:     { flex: 1, fontSize: 12, color: C.violet, fontWeight: "600", lineHeight: 17 },
});