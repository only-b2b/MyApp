// screens/home/DashboardScreen.js
// ✅ CORRECT imports for DashboardScreen.js
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { getDirections } from "../../lib/directions";
import ScreenWrapper from "../../components/ScreenWrapper";
import { getAuth } from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";

const { width, height } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const C = {
  violet: "#3D2B8C",
  violetDark: "#2A1E6B",
  violetMid: "#4D3CA0",
  blue: "#1E40AF",
  blueDark: "#1E3A8A",
  blueDeep: "#172554",
  primarySoft: "#EEEAFB",
  primarySoftDeep: "#DCD4F5",
  primaryFade: "rgba(61,43,140,0.08)",
  primaryFade2: "rgba(61,43,140,0.15)",
  primaryGlow: "rgba(61,43,140,0.30)",
  gold: "#D4A017",
  goldLight: "#F0C040",
  goldDark: "#A8800F",
  goldDeep: "#7A5C00",
  goldSoft: "#FEF7E0",
  goldGlow: "rgba(212,160,23,0.30)",
  bg: "#F7F7FA",
  card: "#FFFFFF",
  surface: "#F9FAFB",
  lavenderBg: "#F1EEFB",
  textDark: "#0F0F1F",
  textMid: "#4A4A66",
  textLight: "#7B7B95",
  textFaint: "#A8A8BC",
  border: "#EDEDF2",
  borderMid: "#DDDDE5",
  divider: "#E8E8EE",
  pastelBlue: "#E3F0FF",
  blueAccent: "#3B82F6",
  pastelGreen: "#E8F5E9",
  green: "#34A853",
  greenDark: "#16A34A",
  pastelOrange: "#FFE8D6",
  orange: "#F59E0B",
  pastelYellow: "#FFF6D6",
  pastelRed: "#FEE2E2",
  red: "#EF4444",
  success: "#22C55E",
  successBg: "#E8F8EF",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  white: "#FFFFFF",
  shadow: "#0F0F1F",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R  = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary:    [C.violet, C.blue],
  primaryDeep:[C.violetDark, C.blueDeep],
  primarySoft:[C.violetMid, C.blue],
  gold:       [C.goldLight, C.gold, C.goldDark],
  goldShine:  [C.goldLight, C.gold],
};

// ==================== PRICING ====================
const PRICING = {
  perKmRate:          8,
  peakHourMultiplier: 1.2,
  taxRate:            0.18,
  convenienceFee:     29,
  minDistance:        2,
};

// ==================== DATA ====================
const HUBS = [
  { id: 1, name: "SparkleWash Central", lat: 18.5204, lng: 73.8567, rating: 4.8, address: "MG Road, Pune" },
  { id: 2, name: "CleanRide Hub",       lat: 18.5312, lng: 73.845,  rating: 4.6, address: "FC Road, Pune" },
  { id: 3, name: "AutoShine Express",   lat: 18.5055, lng: 73.8652, rating: 4.9, address: "Koregaon Park, Pune" },
  { id: 4, name: "PremiumWash Pro",     lat: 18.5511, lng: 73.9416, rating: 4.7, address: "Viman Nagar, Pune" },
];

const VEHICLES = [
  { id: "hatch", name: "Hatchback", subtitle: "Swift, i10, Polo",       icon: require("../../assets/icons/hatchback.png"), multiplier: 1.0  },
  { id: "sedan", name: "Sedan",     subtitle: "City, Verna, Ciaz",      icon: require("../../assets/icons/sedan.png"),    multiplier: 1.15, popular: true },
  { id: "suv",   name: "SUV / MUV", subtitle: "Creta, Seltos, Innova",  icon: require("../../assets/icons/suv.png"),      multiplier: 1.35 },
];

const PACKAGES = [
  { id: "basic",   name: "Basic Wash",   desc: "Exterior rinse & wipe",         basePrice: 299,  etaMin: 45,  icon: "water-outline",    iconBg: C.pastelBlue,  iconColor: C.blueAccent },
  { id: "deluxe",  name: "Deluxe Wash",  desc: "Full body + interior vacuum",    basePrice: 549,  etaMin: 75,  icon: "sparkles-outline", iconBg: C.primarySoft, iconColor: C.violet,     popular: true },
  { id: "foam",    name: "Foam Wash",    desc: "Snow foam + ceramic coating",    basePrice: 799,  etaMin: 90,  icon: "cloudy-outline",   iconBg: C.pastelGreen, iconColor: C.green },
  { id: "premium", name: "Premium Care", desc: "Complete detailing + polish",    basePrice: 1299, etaMin: 120, icon: "diamond-outline",  iconBg: C.goldSoft,    iconColor: C.gold,       premium: true },
];

// ==================== MAP STYLE ====================
const MAP_STYLE = [
  { elementType: "geometry",           stylers: [{ color: "#F5F5F8" }] },
  { elementType: "labels.icon",        stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#7B7B95" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi",                stylers: [{ visibility: "off" }] },
  { featureType: "road",              elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.highway",      elementType: "geometry", stylers: [{ color: "#E8E2F8" }] },
  { featureType: "transit",           stylers: [{ visibility: "off" }] },
  { featureType: "water",             elementType: "geometry", stylers: [{ color: "#D0DCF0" }] },
];

// ==================== SKELETON ====================
const SkeletonLoader = () => (
  <View style={{ padding: SP.lg }}>
    <View style={styles.skel} />
    <View style={[styles.skel, { height: 70, marginTop: SP.sm }]} />
    <View style={[styles.skel, { height: 70, marginTop: SP.sm }]} />
  </View>
);

// ==================== MAIN COMPONENT ====================
export default function DashboardScreen({ navigation }) {

  const firebase_uid = getAuth().currentUser?.uid;

  // ── States ──
  const [region,        setRegion]       = useState(null);
  const [nearestHub,    setNearestHub]   = useState(null);
  const [routeCoords,   setRouteCoords]  = useState([]);
  const [distance,      setDistance]     = useState(null);
  const [duration,      setDuration]     = useState(null);
  const [distanceValue, setDistanceValue]= useState(0);
  const [durationValue, setDurationValue]= useState(0);
  const [loading,       setLoading]      = useState(true);
  const [loadingRoute,  setLoadingRoute] = useState(false);
  const [mapReady,      setMapReady]     = useState(false);
  const [step,          setStep]         = useState("vehicle");
  const [selectedVehicle,  setSelectedVehicle]  = useState(null);
  const [selectedPackage,  setSelectedPackage]  = useState(null);

  // ── Refs ──
  const hasNavigatedRef       = useRef(false);
  const isNavigatingRef       = useRef(false);
  const activeRideIntervalRef = useRef(null);
  const startTimeoutRef       = useRef(null);
  const bottomSheetRef        = useRef(null);
  const mapRef                = useRef(null);
  const snapPoints            = useMemo(() => ["32%", "60%", "92%"], []);

  // ── Animations ──
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const goldPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
        Animated.timing(goldPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ==================== ACTIVE RIDE CHECK ====================
  useEffect(() => {
    if (!firebase_uid) return;

    hasNavigatedRef.current   = false;
    isNavigatingRef.current   = false;

    if (activeRideIntervalRef.current) {
      clearInterval(activeRideIntervalRef.current);
      activeRideIntervalRef.current = null;
    }
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }

    const checkActiveRide = async () => {
      if (hasNavigatedRef.current || isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      try {
        const res = await fetch(
          `${API_BASE_URL}/orders/active/by-user?firebase_uid=${firebase_uid}`
        );

        if (!res.ok) {
          isNavigatingRef.current = false;
          return;
        }

        const rawData = await res.json();
        console.log("📱 Active ride check:", rawData);

        if (!rawData || rawData.error || !rawData.id || !rawData.status) {
          isNavigatingRef.current = false;
          return;
        }

        // ✅ Stop polling immediately
        hasNavigatedRef.current = true;
        if (activeRideIntervalRef.current) {
          clearInterval(activeRideIntervalRef.current);
          activeRideIntervalRef.current = null;
        }

        // ✅ Only primitives — no objects from DB
        const orderId         = Number(rawData.id);
        const serviceType     = String(rawData.service_type   || "car_wash");
        const orderStatus     = String(rawData.status);
        const advancePaid     = Number(rawData.advance_amount  || 0);
        const totalAmount     = Number(rawData.price           || 0);
        const remainingAmount = Number(rawData.remaining_amount|| 0) ||
                                Math.max(0, totalAmount - advancePaid);
        const otp             = rawData.otp ? String(rawData.otp) : "";

        console.log(`📱 Resuming: Order ${orderId}, Status: ${orderStatus}, Service: ${serviceType}`);

        // ✅ THE FIX: Simple setTimeout with 500ms delay
        // This gives React Navigation time to finish mounting
        // before we call replace(), preventing _tracking error
        const doNavigate = () => {
          switch (orderStatus) {
            case "requested":
              navigation.replace("FindingTechnicianScreen", {
                orderId, serviceType, advancePaid, totalAmount, remainingAmount,
              });
              break;

            case "accepted":
              navigation.replace("TechnicianEnRouteScreen", {
                orderId, technician: null, advancePaid, totalAmount, remainingAmount,
              });
              break;

            case "arrived":
              navigation.replace("TechnicianArrivedScreen", {
                orderId, technician: null, otp, advancePaid, totalAmount, remainingAmount,
              });
              break;

            case "in_progress":
              navigation.replace("WashInProgressScreen", {
                orderId, technician: null, advancePaid, totalAmount, remainingAmount,
              });
              break;

            case "completed":
              navigation.replace("WashCompletedScreen", {
                orderId, advancePaid, totalAmount, remainingAmount,
              });
              break;

            default:
              // Unknown status — reset guards
              hasNavigatedRef.current = false;
              isNavigatingRef.current = false;
              break;
          }
        };

        // ✅ 500ms delay so navigation stack fully mounts before replace()
        setTimeout(doNavigate, 500);

      } catch (err) {
        console.log("Active ride check error:", err.message);
        isNavigatingRef.current = false;
      }
    };

    // ✅ 1 second initial delay after mount
    startTimeoutRef.current = setTimeout(() => {
      checkActiveRide();
      activeRideIntervalRef.current = setInterval(checkActiveRide, 8000);
    }, 1000);

    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      if (activeRideIntervalRef.current) {
        clearInterval(activeRideIntervalRef.current);
        activeRideIntervalRef.current = null;
      }
    };

  }, [firebase_uid]);

  // ==================== LOCATION ====================
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setLoading(false); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setLoading(false);
      } catch {
        setRegion({ lat: 18.5204, lng: 73.8567 });
        setLoading(false);
      }
    };
    getLocation();
  }, []);

  // ==================== HELPERS ====================
  const parseDistance = (s) => { if (!s) return 0; const m = s.match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; };
  const parseDuration = (s) => { if (!s) return 0; const h = s.match(/(\d+)\s*h/), m = s.match(/(\d+)\s*min/); let t = 0; if (h) t += parseInt(h[1]) * 60; if (m) t += parseInt(m[1]); return t || parseInt(s) || 0; };
  const isPeakHour  = () => { const h = new Date().getHours(); return (h >= 9 && h <= 11) || (h >= 17 && h <= 20); };
  const formatDuration = (min) => { if (!min) return ""; const h = Math.floor(min / 60), m = min % 60; return h > 0 ? `${h}h ${m}m` : `${m} min`; };

  // ==================== PRICING ====================
  const calculatePricing = useCallback(() => {
    if (!selectedPackage || !selectedVehicle) return null;
    const pkg     = PACKAGES.find(p => p.id === selectedPackage);
    const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
    if (!pkg || !vehicle) return null;
    const km           = Math.max(distanceValue, PRICING.minDistance);
    const packagePrice = Math.round(pkg.basePrice * vehicle.multiplier);
    const distanceCharge = Math.round(km * PRICING.perKmRate);
    let subtotal       = packagePrice + distanceCharge;
    const peakSurge    = isPeakHour() ? Math.round(subtotal * (PRICING.peakHourMultiplier - 1)) : 0;
    subtotal          += peakSurge + PRICING.convenienceFee;
    const tax          = Math.round(subtotal * PRICING.taxRate);
    const total        = subtotal + tax;
    return { packagePrice, distanceCharge, peakSurge, convenienceFee: PRICING.convenienceFee, subtotal, tax, total, isPeakHour: isPeakHour(), distanceKm: km, estimatedTime: pkg.etaMin + durationValue };
  }, [selectedPackage, selectedVehicle, distanceValue, durationValue]);

  // ==================== NEAREST HUB ====================
  const findNearestHub = useCallback(async () => {
    if (!region) return;
    const nearest = HUBS.reduce((p, c) => {
      const d = Math.sqrt(Math.pow(region.lat - c.lat, 2) + Math.pow(region.lng - c.lng, 2));
      return d < p.dist ? { hub: c, dist: d } : p;
    }, { hub: null, dist: Infinity }).hub;
    if (!nearest) return;
    setNearestHub(nearest);
    bottomSheetRef.current?.snapToIndex(1);
    try {
      setLoadingRoute(true);
      const data = await getDirections({ lat: region.lat, lng: region.lng }, { lat: nearest.lat, lng: nearest.lng });
      if (data) {
        setRouteCoords(data.coords || []);
        setDistance(data.distance || null);
        setDuration(data.duration || null);
        setDistanceValue(parseDistance(data.distance));
        setDurationValue(parseDuration(data.duration));
        setTimeout(() => {
          if (mapRef.current && data.coords?.length > 0) {
            mapRef.current.fitToCoordinates(data.coords, {
              edgePadding: { top: height * 0.18, bottom: height * 0.42, left: 60, right: 60 },
              animated: true,
            });
          }
        }, 100);
      }
    } catch (e) { console.log("Route error:", e); }
    finally { setLoadingRoute(false); }
  }, [region]);

  useEffect(() => { if (region) findNearestHub(); }, [region]);

  // ==================== BUILD ORDER ====================
  const buildOrder = () => {
    const pkg     = PACKAGES.find(p => p.id === selectedPackage);
    const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
    const pricing = calculatePricing();
    return {
      service_type: "car_wash",
      location: region,
      hub:      nearestHub,
      vehicle,
      package:  { ...pkg, calculatedPrice: pricing?.packagePrice },
      route:    { distance, duration, distanceValue, durationValue },
      pricing,
      created_at: new Date().toISOString(),
    };
  };

  // ==================== UI COMPONENTS ====================

  const HubCard = () => (
    <View style={styles.hubCard}>
      <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hubAvatar}>
        <Ionicons name="storefront" size={22} color={C.white} />
      </LinearGradient>
      <View style={styles.hubInfo}>
        <View style={styles.hubTitleRow}>
          <Text style={styles.hubName}>{nearestHub?.name || "Finding hub..."}</Text>
          {nearestHub?.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color={C.gold} />
              <Text style={styles.ratingText}>{nearestHub.rating}</Text>
            </View>
          )}
        </View>
        {nearestHub?.address && <Text style={styles.hubAddress}>{nearestHub.address}</Text>}
      </View>
      <View style={styles.hubActions}>
        <TouchableOpacity style={styles.hubActionBtn}><Ionicons name="call" size={16} color={C.violet} /></TouchableOpacity>
        <TouchableOpacity style={styles.hubActionBtn}><Ionicons name="chatbubble-ellipses" size={16} color={C.violet} /></TouchableOpacity>
      </View>
    </View>
  );

  const RouteStrip = () => {
    if (!distance || !duration) return null;
    return (
      <View style={styles.routeStrip}>
        <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={styles.routeStripLeft}>
          <LinearGradient colors={GRAD.primary} style={styles.routeStripDot} />
          <View>
            <Text style={styles.routeStripLabel}>Distance to hub</Text>
            <Text style={styles.routeStripValue}>{distance} • {duration}</Text>
          </View>
        </View>
        <View style={styles.routeStripRight}>
          <Text style={styles.routeStripETA}>ETA</Text>
          <Text style={styles.routeStripETAValue}>{duration}</Text>
        </View>
      </View>
    );
  };

  const VehicleItem = ({ item, selected, onPress }) => (
    <TouchableOpacity style={[styles.vehicleItem, selected && styles.vehicleItemActive]} onPress={onPress} activeOpacity={0.85}>
      {item.popular && (
        <LinearGradient colors={GRAD.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.popularBadge}>
          <Ionicons name="star" size={9} color={C.white} />
          <Text style={styles.popularText}>POPULAR</Text>
        </LinearGradient>
      )}
      <View style={[styles.vehicleIconWrap, selected && styles.vehicleIconWrapActive]}>
        <Image source={item.icon} style={styles.vehicleIcon} />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={[styles.vehicleName, selected && styles.vehicleNameActive]}>{item.name}</Text>
        <Text style={styles.vehicleSubtitle}>{item.subtitle}</Text>
        {item.multiplier > 1 && (
          <View style={styles.vehicleTag}>
            <Text style={styles.vehicleTagText}>+{Math.round((item.multiplier - 1) * 100)}% pricing</Text>
          </View>
        )}
      </View>
      {selected ? (
        <LinearGradient colors={GRAD.primary} style={styles.radioActive}>
          <Ionicons name="checkmark" size={14} color={C.white} />
        </LinearGradient>
      ) : (
        <View style={styles.radio} />
      )}
    </TouchableOpacity>
  );

  const PackageItem = ({ item, selected, onPress }) => {
    const isSelected      = selected === item.id;
    const vehicle         = VEHICLES.find(v => v.id === selectedVehicle);
    const calculatedPrice = vehicle ? Math.round(item.basePrice * vehicle.multiplier) : item.basePrice;
    return (
      <TouchableOpacity style={[styles.packageItem, isSelected && styles.packageItemActive]} onPress={onPress} activeOpacity={0.85}>
        {item.popular  && <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.packageTag}><Text style={styles.packageTagText}>BEST VALUE</Text></LinearGradient>}
        {item.premium  && <LinearGradient colors={GRAD.gold}    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.packageTag}><Ionicons name="diamond" size={9} color={C.white} /><Text style={[styles.packageTagText, { marginLeft: 3 }]}>PREMIUM</Text></LinearGradient>}
        <View style={styles.packageRow}>
          <View style={[styles.packageIcon, { backgroundColor: item.iconBg }]}>
            <Ionicons name={item.icon} size={22} color={item.iconColor} />
          </View>
          <View style={styles.packageInfo}>
            <Text style={[styles.packageName, isSelected && styles.packageNameActive]}>{item.name}</Text>
            <Text style={styles.packageDesc}>{item.desc}</Text>
            <View style={styles.packageMeta}>
              <Ionicons name="time-outline" size={11} color={C.textLight} />
              <Text style={styles.packageMetaText}>{formatDuration(item.etaMin + durationValue)}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.packagePrice, isSelected && styles.packagePriceActive]}>₹{calculatedPrice}</Text>
            {vehicle?.multiplier > 1 && <Text style={styles.originalPrice}>₹{item.basePrice}</Text>}
            {isSelected && <LinearGradient colors={GRAD.primary} style={styles.selectedTick}><Ionicons name="checkmark" size={11} color={C.white} /></LinearGradient>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FareDetailsCard = () => {
    const pricing = calculatePricing();
    if (!pricing) return null;
    const pkg = PACKAGES.find(p => p.id === selectedPackage);
    return (
      <View style={styles.fareCard}>
        <View style={styles.fareHeader}>
          <Text style={styles.fareTitle}>Fare Details</Text>
          <Ionicons name="information-circle-outline" size={14} color={C.textLight} />
        </View>
        <View style={styles.fareBody}>
          <View style={styles.fareRow}><Text style={styles.fareLabel}>{pkg?.name}</Text><Text style={styles.fareValue}>₹{pricing.packagePrice}.00</Text></View>
          <View style={styles.fareRow}><Text style={styles.fareLabel}>Distance ({pricing.distanceKm.toFixed(1)} km)</Text><Text style={styles.fareValue}>₹{pricing.distanceCharge}.00</Text></View>
          {pricing.peakSurge > 0 && (
            <View style={styles.fareRow}>
              <View style={styles.fareLabelRow}>
                <Text style={[styles.fareLabel, { color: C.orange }]}>Peak Hour Surge</Text>
                <View style={styles.peakBadge}><Ionicons name="flash" size={9} color={C.orange} /><Text style={styles.peakBadgeText}>+20%</Text></View>
              </View>
              <Text style={[styles.fareValue, { color: C.orange }]}>+₹{pricing.peakSurge}.00</Text>
            </View>
          )}
          <View style={styles.fareRow}><Text style={styles.fareLabel}>Convenience Fee</Text><Text style={styles.fareValue}>₹{pricing.convenienceFee}.00</Text></View>
          <View style={styles.fareRow}><Text style={styles.fareLabel}>GST (18%)</Text><Text style={styles.fareValue}>₹{pricing.tax}.00</Text></View>
        </View>
        <View style={styles.fareDivider} />
        <View style={styles.fareTotalRow}>
          <View><Text style={styles.fareTotalLabel}>Total Fare</Text><Text style={styles.fareTotalSub}>Inclusive of all taxes</Text></View>
          <View style={styles.fareTotalRight}><Text style={styles.fareTotalValue}>₹{pricing.total}</Text><Text style={styles.fareTotalDecimal}>.00</Text></View>
        </View>
        <TouchableOpacity style={styles.fareViewBreak}>
          <Text style={styles.fareViewBreakText}>View Breakup</Text>
          <Ionicons name="chevron-down" size={14} color={C.violet} />
        </TouchableOpacity>
      </View>
    );
  };

  const SafetyBanner = () => (
    <View style={styles.safetyBanner}>
      <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={GRAD.primary} style={styles.safetyIconWrap}><Ionicons name="shield-checkmark" size={18} color={C.white} /></LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.safetyTitle}>Your Safety Matters</Text>
        <Text style={styles.safetySub}>We monitor every wash to ensure quality and care.</Text>
      </View>
    </View>
  );

  const PrimaryButton = ({ label, onPress, disabled, icon, loading: btnLoading }) => (
    <Animated.View style={{ transform: [{ scale: goldPulse }] }}>
      <TouchableOpacity style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]} onPress={onPress} disabled={disabled || btnLoading} activeOpacity={0.85}>
        {btnLoading ? <ActivityIndicator size="small" color={C.textDark} /> : (
          <>
            <Text style={styles.primaryBtnText}>{label}</Text>
            {icon && <View style={styles.primaryBtnIcon}><Ionicons name={icon} size={16} color={C.textDark} /></View>}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const StepProgress = () => (
    <View style={styles.stepWrap}>
      <LinearGradient colors={GRAD.primary} style={styles.stepPillActive}>
        {step === "vehicle" ? (
          <View style={styles.stepNumActive}><Text style={styles.stepNumTextActive}>1</Text></View>
        ) : (
          <View style={styles.stepNumDone}><Ionicons name="checkmark" size={11} color={C.violet} /></View>
        )}
        <Text style={styles.stepLabelActive}>Vehicle</Text>
      </LinearGradient>

      <LinearGradient colors={step === "package" ? GRAD.primary : [C.borderMid, C.borderMid]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stepLine} />

      {step === "package" ? (
        <LinearGradient colors={GRAD.primary} style={styles.stepPillActive}>
          <View style={styles.stepNumActive}><Text style={styles.stepNumTextActive}>2</Text></View>
          <Text style={styles.stepLabelActive}>Package</Text>
        </LinearGradient>
      ) : (
        <View style={styles.stepPill}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
          <Text style={styles.stepLabel}>Package</Text>
        </View>
      )}
    </View>
  );

  // ==================== SHEET CONTENT ====================
  const renderContent = () => {
    if (!nearestHub) return <SkeletonLoader />;
    if (loadingRoute) return (
      <View>
        <HubCard />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={C.violet} />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      </View>
    );

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <StepProgress />
        <HubCard />
        <RouteStrip />

        {step === "vehicle" ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Select Vehicle</Text>
              <Text style={styles.sectionSub}>Pick your car type for accurate pricing</Text>
            </View>
            {VEHICLES.map(v => (
              <VehicleItem key={v.id} item={v} selected={selectedVehicle === v.id} onPress={() => setSelectedVehicle(v.id)} />
            ))}
            <View style={{ marginTop: SP.lg }}>
              <PrimaryButton label="Continue" icon="arrow-forward" onPress={() => { setStep("package"); bottomSheetRef.current?.snapToIndex(2); }} disabled={!selectedVehicle} />
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep("vehicle")}>
              <Ionicons name="chevron-back" size={14} color={C.violet} />
              <Text style={styles.backBtnText}>Change Vehicle</Text>
            </TouchableOpacity>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Select Package</Text>
              <Text style={styles.sectionSub}>Choose the perfect wash for your {VEHICLES.find(v => v.id === selectedVehicle)?.name}</Text>
            </View>
            {PACKAGES.map(p => (
              <PackageItem key={p.id} item={p} selected={selectedPackage} onPress={() => setSelectedPackage(p.id)} />
            ))}
            {selectedPackage && <><FareDetailsCard /><SafetyBanner /></>}
            <View style={{ marginTop: SP.lg }}>
              <PrimaryButton label="View Quotation" icon="arrow-forward" onPress={() => navigation.navigate("QuotationPage", { order: buildOrder() })} disabled={!selectedPackage} />
            </View>
          </>
        )}
      </Animated.View>
    );
  };

  // ==================== MAIN RENDER ====================
  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.fullLoader}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={C.violet} />
            <Text style={styles.fullLoaderText}>Getting your location...</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>

        {/* MAP */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={MAP_STYLE}
          showsCompass={false}
          showsMyLocationButton={false}
          onMapReady={() => setMapReady(true)}
          initialRegion={
            region
              ? { latitude: region.lat, longitude: region.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
              : { latitude: 18.5204, longitude: 73.8567, latitudeDelta: 0.05, longitudeDelta: 0.05 }
          }
        >
          {region && (
            <Marker coordinate={{ latitude: region.lat, longitude: region.lng }}>
              <View style={styles.userMarker}>
                <View style={styles.userMarkerOuter}>
                  <LinearGradient colors={GRAD.primary} style={styles.userMarkerDot}>
                    <View style={styles.userMarkerInner} />
                  </LinearGradient>
                </View>
              </View>
            </Marker>
          )}
          {nearestHub && (
            <Marker coordinate={{ latitude: nearestHub.lat, longitude: nearestHub.lng }}>
              <View style={styles.hubMarkerWrap}>
                <LinearGradient colors={GRAD.primary} style={styles.hubMarker}>
                  <Ionicons name="storefront" size={14} color={C.white} />
                </LinearGradient>
                <View style={styles.hubMarkerTail} />
              </View>
            </Marker>
          )}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeColor={C.violet} strokeWidth={5} lineCap="round" lineJoin="round" />
          )}
        </MapView>

        {/* TOP HEADER */}
        <View style={styles.mapHeader}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={C.textDark} />
          </TouchableOpacity>
          <View style={styles.mapTitleWrap}>
            <Text style={styles.mapTitle}>Car Wash</Text>
            <Text style={styles.mapSubtitle}>Order ID: #CW{Date.now().toString().slice(-6)}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtnHelp}>
            <Ionicons name="headset" size={16} color={C.violet} />
            <Text style={styles.headerHelpText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* LIVE BADGE */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>

        {/* PEAK HOUR BADGE */}
        {isPeakHour() && (
          <View style={styles.peakBadgeFloat}>
            <Ionicons name="flash" size={12} color={C.orange} />
            <Text style={styles.peakBadgeFloatText}>Peak Hours Active</Text>
          </View>
        )}

        {/* ARRIVING IN CARD */}
        {distance && duration && (
          <View style={styles.arrivingCard}>
            <View style={styles.arrivingDot} />
            <View>
              <Text style={styles.arrivingLabel}>Arriving in</Text>
              <Text style={styles.arrivingValue}>{duration} ({distance})</Text>
            </View>
          </View>
        )}

        {/* MAP FAB */}
        <View style={styles.fabStack}>
          <TouchableOpacity style={styles.fab} onPress={findNearestHub} activeOpacity={0.85}>
            <Ionicons name="locate" size={20} color={C.textDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabSecondary} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={18} color={C.violet} />
          </TouchableOpacity>
        </View>

        {/* BOTTOM SHEET */}
        <BottomSheet ref={bottomSheetRef} index={1} snapPoints={snapPoints} backgroundStyle={styles.sheetBg} handleIndicatorStyle={styles.sheetHandle} enableContentPanningGesture enableHandlePanningGesture>
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {renderContent()}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  fullLoader:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  loaderCard:     { backgroundColor: C.card, paddingVertical: SP.xxl, paddingHorizontal: SP.xxxl, borderRadius: R.xl, alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  fullLoaderText: { marginTop: SP.md, fontSize: 14, fontWeight: "600", color: C.textMid },
  map:            { ...StyleSheet.absoluteFillObject },

  mapHeader: { position: "absolute", top: Platform.OS === "ios" ? 54 : 24, left: SP.lg, right: SP.lg, flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.xl, paddingVertical: SP.sm, paddingHorizontal: SP.sm, shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  headerBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: "center", alignItems: "center" },
  mapTitleWrap: { flex: 1, marginHorizontal: SP.md, alignItems: "center" },
  mapTitle:   { fontSize: 16, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  mapSubtitle:{ fontSize: 11, color: C.textLight, marginTop: 1, fontWeight: "500" },
  headerBtnHelp: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: SP.md, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.primarySoft },
  headerHelpText: { fontSize: 13, fontWeight: "700", color: C.violet },

  liveBadge: { position: "absolute", top: Platform.OS === "ios" ? 116 : 86, right: SP.lg, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.textDark, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveText:  { fontSize: 11, fontWeight: "700", color: C.white },

  peakBadgeFloat:    { position: "absolute", top: Platform.OS === "ios" ? 150 : 120, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.warningBg, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full, borderWidth: 1, borderColor: C.warning + "30" },
  peakBadgeFloatText:{ fontSize: 11, fontWeight: "700", color: C.warning },

  arrivingCard: { position: "absolute", bottom: height * 0.42, left: SP.lg, flexDirection: "row", alignItems: "center", gap: SP.sm, backgroundColor: C.white, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  arrivingDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.violet },
  arrivingLabel:{ fontSize: 11, fontWeight: "600", color: C.textLight },
  arrivingValue:{ fontSize: 14, fontWeight: "800", color: C.textDark, marginTop: 2 },

  userMarker:      { alignItems: "center", justifyContent: "center" },
  userMarkerOuter: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.violet + "15", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: C.violet + "30" },
  userMarkerDot:   { width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: C.white },
  userMarkerInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  hubMarkerWrap:   { alignItems: "center" },
  hubMarker:       { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: C.white, shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 7 },
  hubMarkerTail:   { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: C.violet, marginTop: -2 },

  fabStack:    { position: "absolute", right: SP.lg, bottom: height * 0.45, gap: SP.sm },
  fab:         { width: 46, height: 46, borderRadius: 23, backgroundColor: C.white, justifyContent: "center", alignItems: "center", shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
  fabSecondary:{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.white, justifyContent: "center", alignItems: "center", shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },

  sheetBg:     { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl },
  sheetHandle: { backgroundColor: C.borderMid, width: 44, height: 4 },
  sheetContent:{ paddingHorizontal: SP.lg, paddingTop: SP.sm, paddingBottom: SP.xxxl + 10 },

  loadingBox:  { alignItems: "center", paddingVertical: SP.xxxl },
  loadingText: { marginTop: SP.md, fontSize: 13, color: C.textLight, fontWeight: "500" },

  stepWrap:     { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: SP.lg },
  stepPill:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: SP.md, paddingVertical: 7, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  stepPillActive:{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: SP.md, paddingVertical: 7, borderRadius: R.full },
  stepNum:      { width: 18, height: 18, borderRadius: 9, backgroundColor: C.borderMid, justifyContent: "center", alignItems: "center" },
  stepNumActive:{ width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center" },
  stepNumDone:  { width: 18, height: 18, borderRadius: 9, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  stepNumText:  { fontSize: 10, fontWeight: "800", color: C.textLight },
  stepNumTextActive:{ fontSize: 10, fontWeight: "800", color: C.white },
  stepLabel:    { fontSize: 12, fontWeight: "600", color: C.textLight },
  stepLabelActive:{ fontSize: 12, fontWeight: "700", color: C.white },
  stepLine:     { width: 28, height: 2, marginHorizontal: SP.sm, borderRadius: 1 },

  hubCard:    { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: R.lg, padding: SP.md, marginBottom: SP.sm, borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  hubAvatar:  { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: SP.md, shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  hubInfo:    { flex: 1 },
  hubTitleRow:{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  hubName:    { fontSize: 14, fontWeight: "800", color: C.textDark },
  ratingBadge:{ flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: C.goldSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: R.sm },
  ratingText: { fontSize: 10, fontWeight: "800", color: C.goldDark },
  hubAddress: { fontSize: 12, color: C.textLight, fontWeight: "500" },
  hubActions: { flexDirection: "row", gap: SP.sm },
  hubActionBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center" },

  routeStrip:     { flexDirection: "row", alignItems: "center", borderRadius: R.md, padding: SP.md, marginBottom: SP.lg, overflow: "hidden" },
  routeStripLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  routeStripDot:  { width: 10, height: 10, borderRadius: 5, marginRight: SP.sm },
  routeStripLabel:{ fontSize: 11, color: C.textLight, fontWeight: "600" },
  routeStripValue:{ fontSize: 13, fontWeight: "700", color: C.textDark, marginTop: 1 },
  routeStripRight:{ alignItems: "flex-end" },
  routeStripETA:  { fontSize: 10, color: C.textLight, fontWeight: "600" },
  routeStripETAValue:{ fontSize: 13, fontWeight: "800", color: C.violet, marginTop: 1 },

  sectionHead: { marginBottom: SP.md },
  sectionTitle:{ fontSize: 18, fontWeight: "800", color: C.textDark, letterSpacing: -0.3, marginBottom: 2 },
  sectionSub:  { fontSize: 12, color: C.textLight, fontWeight: "500" },

  backBtn:    { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: C.primarySoft, paddingHorizontal: SP.md, paddingVertical: 8, borderRadius: R.full, marginBottom: SP.md },
  backBtnText:{ fontSize: 12, fontWeight: "700", color: C.violet },

  vehicleItem:      { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: R.lg, padding: SP.md, marginBottom: SP.sm, borderWidth: 1.5, borderColor: C.border, position: "relative" },
  vehicleItemActive:{ borderColor: C.violet, backgroundColor: C.primarySoft, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  popularBadge:     { position: "absolute", top: -8, right: SP.md, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.sm, shadowColor: C.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  popularText:      { fontSize: 9, fontWeight: "800", color: C.white, letterSpacing: 0.5 },
  vehicleIconWrap:  { width: 64, height: 48, borderRadius: R.md, backgroundColor: C.surface, justifyContent: "center", alignItems: "center", marginRight: SP.md },
  vehicleIconWrapActive:{ backgroundColor: C.white },
  vehicleIcon:      { width: 50, height: 36, resizeMode: "contain" },
  vehicleInfo:      { flex: 1 },
  vehicleName:      { fontSize: 14, fontWeight: "700", color: C.textDark, marginBottom: 2 },
  vehicleNameActive:{ color: C.violet },
  vehicleSubtitle:  { fontSize: 11, color: C.textLight, fontWeight: "500" },
  vehicleTag:       { alignSelf: "flex-start", backgroundColor: C.warningBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: R.sm, marginTop: 4 },
  vehicleTagText:   { fontSize: 9, fontWeight: "700", color: C.warning },
  radio:            { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.borderMid },
  radioActive:      { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },

  packageItem:      { backgroundColor: C.card, borderRadius: R.lg, padding: SP.md, marginBottom: SP.sm, borderWidth: 1.5, borderColor: C.border, position: "relative" },
  packageItemActive:{ borderColor: C.violet, backgroundColor: C.primarySoft, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  packageTag:       { position: "absolute", top: -8, right: SP.md, flexDirection: "row", alignItems: "center", paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.sm, zIndex: 1, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  packageTagText:   { fontSize: 9, fontWeight: "800", color: C.white, letterSpacing: 0.5 },
  packageRow:       { flexDirection: "row", alignItems: "center" },
  packageIcon:      { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: SP.md },
  packageInfo:      { flex: 1 },
  packageName:      { fontSize: 14, fontWeight: "700", color: C.textDark, marginBottom: 2 },
  packageNameActive:{ color: C.violet },
  packageDesc:      { fontSize: 11, color: C.textLight, marginBottom: 4, fontWeight: "500" },
  packageMeta:      { flexDirection: "row", alignItems: "center", gap: 3 },
  packageMetaText:  { fontSize: 10, color: C.textLight, fontWeight: "500" },
  priceContainer:   { alignItems: "flex-end", position: "relative", paddingRight: 4 },
  packagePrice:     { fontSize: 16, fontWeight: "800", color: C.textDark },
  packagePriceActive:{ color: C.violet },
  originalPrice:    { fontSize: 11, color: C.textLight, textDecorationLine: "line-through", marginTop: 2 },
  selectedTick:     { position: "absolute", top: -2, right: -22, width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },

  fareCard:      { backgroundColor: C.card, borderRadius: R.lg, padding: SP.lg, marginTop: SP.md, marginBottom: SP.sm, borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  fareHeader:    { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: SP.md },
  fareTitle:     { fontSize: 14, fontWeight: "800", color: C.textDark },
  fareBody:      { gap: SP.sm },
  fareRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fareLabelRow:  { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  fareLabel:     { fontSize: 13, color: C.textMid, fontWeight: "500" },
  fareValue:     { fontSize: 13, fontWeight: "700", color: C.textDark },
  peakBadge:     { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: C.warningBg, paddingHorizontal: 5, paddingVertical: 2, borderRadius: R.sm },
  peakBadgeText: { fontSize: 9, fontWeight: "700", color: C.warning },
  fareDivider:   { height: 1, backgroundColor: C.border, marginVertical: SP.md },
  fareTotalRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SP.sm },
  fareTotalLabel:{ fontSize: 15, fontWeight: "800", color: C.textDark },
  fareTotalSub:  { fontSize: 10, color: C.textLight, fontWeight: "500", marginTop: 1 },
  fareTotalRight:{ flexDirection: "row", alignItems: "baseline" },
  fareTotalValue:{ fontSize: 22, fontWeight: "900", color: C.violet, letterSpacing: -0.5 },
  fareTotalDecimal:{ fontSize: 14, fontWeight: "700", color: C.violet, marginLeft: 1 },
  fareViewBreak: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start" },
  fareViewBreakText:{ fontSize: 12, fontWeight: "700", color: C.violet },

  safetyBanner:  { flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.md, marginTop: SP.sm, overflow: "hidden" },
  safetyIconWrap:{ width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: SP.md, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  safetyTitle:   { fontSize: 13, fontWeight: "800", color: C.violet, marginBottom: 2 },
  safetySub:     { fontSize: 11, color: C.textMid, fontWeight: "500", lineHeight: 15 },

  primaryBtnWrap:   { borderRadius: R.full, shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  primaryBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F5C518", paddingVertical: SP.md + 4, paddingHorizontal: SP.xl, borderRadius: R.full, shadowColor: "#F5C518", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  primaryBtnDisabled:{ backgroundColor: C.borderMid, shadowOpacity: 0, opacity: 0.6 },
  primaryBtnText:   { fontSize: 16, fontWeight: "800", color: "#000000", letterSpacing: 0.3 },
  primaryBtnIcon:   { marginLeft: SP.sm, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.1)", justifyContent: "center", alignItems: "center" },

  skel: { height: 80, backgroundColor: C.border, borderRadius: R.lg, marginBottom: SP.sm },
});