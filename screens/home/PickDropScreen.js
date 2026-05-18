// screens/home/PickDropScreen.js

import Ionicons from "@expo/vector-icons/Ionicons";
import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import AddressSearch from "../../components/AddressSearch";
import ScreenWrapper from "../../components/ScreenWrapper";
import { API_BASE_URL } from "../../config";
import { getDirections } from "../../lib/directions";
import { safeFetchJSON } from "../../utils/safeFetch";

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
  lavenderBg: "#F1EEFB",
  primaryFade: "rgba(61,43,140,0.08)",
  primaryFade2: "rgba(61,43,140,0.15)",
  primaryGlow: "rgba(61,43,140,0.30)",
  gold: "#F5C518",
  goldLight: "#FFD740",
  goldDark: "#C9A015",
  goldDeep: "#7A5C00",
  goldSoft: "#FEF7E0",
  goldGlow: "rgba(245,197,24,0.35)",
  bg: "#F7F7FA",
  card: "#FFFFFF",
  surface: "#F9FAFB",
  textDark: "#0F0F1F",
  textPrimary: "#1F1F33",
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
  pastelRed: "#FEE2E2",
  red: "#EF4444",
  success: "#22C55E",
  successBg: "#E8F8EF",
  successDark: "#16A34A",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  pastelIndigo: "#E0E7FF",
  indigo: "#6366F1",
  white: "#FFFFFF",
  shadow: "#0F0F1F",
  overlay: "rgba(0,0,0,0.45)",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary: [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  primarySoft: [C.violetMid, C.blue],
  gold: [C.goldLight, C.gold, C.goldDark],
  goldShine: [C.goldLight, C.gold],
  lavender: [C.primarySoft, C.lavenderBg],
};

// ==================== PRICING CONFIG ====================
const PRICING_CONFIG = {
  nightStartHour: 23,
  nightEndHour: 5,
  nightMultiplier: 1.1,
  morningPeakStart: 8,
  morningPeakEnd: 10,
  eveningPeakStart: 17,
  eveningPeakEnd: 20,
  peakMultiplier: 1.1,
  trafficMultipliers: { low: 1.0, moderate: 1.0, heavy: 1.05, severe: 1.1 },
  perMinuteRate: 1.0,
  minimumFare: 30,
  platformCommissionPercent: 20,
  platformFixedFee: 5,
  gstOnCommissionPercent: 18,
};

// ==================== VEHICLES DATA ====================
const VEHICLES = [
  {
    id: "book_any",
    name: "Any",
    description: "Fastest available ride",
    time: "3 min",
    image: require("../../assets/icons/sedan.png"),
    baseFare: 25,
    perKm: 9,
    perMin: 1.0,
    highlighted: true,
    capacity: 4,
    iconBg: C.primarySoft,
    iconColor: C.violet,
  },
  {
    id: "auto",
    name: "Auto",
    description: "No bargaining, doorstep pickup",
    time: "5 min",
    image: require("../../assets/icons/sedan.png"),
    baseFare: 20,
    perKm: 8,
    perMin: 0.75,
    capacity: 3,
    iconBg: C.pastelOrange,
    iconColor: C.orange,
  },
  {
    id: "mini_nonac",
    name: "Mini Non AC",
    description: "Affordable comfy rides",
    time: "6 min",
    image: require("../../assets/icons/sedan.png"),
    baseFare: 25,
    perKm: 9,
    perMin: 1.0,
    capacity: 4,
    iconBg: C.pastelBlue,
    iconColor: C.blueAccent,
  },
  {
    id: "mini",
    name: "Mini",
    description: "Comfy & quick, AC rides",
    time: "4 min",
    image: require("../../assets/icons/sedan.png"),
    baseFare: 30,
    perKm: 11,
    perMin: 1.25,
    capacity: 4,
    iconBg: C.pastelGreen,
    iconColor: C.green,
    popular: true,
  },
  {
    id: "prime",
    name: "Prime Sedan",
    description: "Top-rated drivers, premium cars",
    time: "7 min",
    image: require("../../assets/icons/sedan.png"),
    baseFare: 40,
    perKm: 14,
    perMin: 1.5,
    capacity: 4,
    iconBg: C.goldSoft,
    iconColor: C.goldDark,
    premium: true,
  },
];

// ==================== RECENT LOCATIONS ====================
const DEFAULT_RECENT_LOCATIONS = [
  {
    id: "1",
    title: "Samajkalyan Hostel Vishrantwadi",
    subtitle: "New Airport Rd, Vishrantwadi, Pune",
    location: { lat: 18.5793, lng: 73.8903 },
  },
  {
    id: "2",
    title: "Phoenix Marketcity",
    subtitle: "Viman Nagar, Pune, Maharashtra",
    location: { lat: 18.5621, lng: 73.9166 },
  },
  {
    id: "3",
    title: "Pune Railway Station",
    subtitle: "Station Rd, Sadashiv Peth, Pune",
    location: { lat: 18.5285, lng: 73.8743 },
  },
  {
    id: "4",
    title: "Koregaon Park",
    subtitle: "Lane 6, Koregaon Park, Pune",
    location: { lat: 18.5362, lng: 73.8939 },
  },
];

// ==================== SIDEBAR MENU ====================
const SIDEBAR_MENU_ITEMS = [
  {
    id: "my_rides",
    icon: "car-outline",
    label: "My Rides",
    route: "MyRides",
    iconBg: C.primarySoft,
    iconColor: C.violet,
  },
  {
    id: "wallet",
    icon: "wallet-outline",
    label: "Wallet",
    route: "Wallet",
    iconBg: C.pastelGreen,
    iconColor: C.green,
  },
  {
    id: "offers",
    icon: "pricetag-outline",
    label: "Offers & Promos",
    route: "Offers",
    iconBg: C.goldSoft,
    iconColor: C.goldDark,
  },
  {
    id: "refer",
    icon: "gift-outline",
    label: "Refer & Earn",
    route: "Refer",
    iconBg: C.pastelIndigo,
    iconColor: C.indigo,
  },
  {
    id: "settings",
    icon: "settings-outline",
    label: "Settings",
    route: "Settings",
    iconBg: C.surface,
    iconColor: C.textMid,
  },
  {
    id: "help",
    icon: "help-circle-outline",
    label: "Help & Support",
    route: "Help",
    iconBg: C.pastelBlue,
    iconColor: C.blueAccent,
  },
  {
    id: "about",
    icon: "information-circle-outline",
    label: "About",
    route: "About",
    iconBg: C.surface,
    iconColor: C.textLight,
  },
];

// ==================== MAP STYLE ====================
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F5F5F8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7B7B95" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#E8E2F8" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#D0DCF0" }],
  },
];

// ==================== FARE UTILITIES ====================
const isNightTime = () => {
  const h = new Date().getHours();
  return h >= PRICING_CONFIG.nightStartHour || h < PRICING_CONFIG.nightEndHour;
};
const isPeakHour = () => {
  const h = new Date().getHours();
  return (
    (h >= PRICING_CONFIG.morningPeakStart && h < PRICING_CONFIG.morningPeakEnd) ||
    (h >= PRICING_CONFIG.eveningPeakStart && h < PRICING_CONFIG.eveningPeakEnd)
  );
};
const estimateTrafficLevel = () => {
  const h = new Date().getHours();
  const d = new Date().getDay();
  if (d === 0 || d === 6) return h >= 10 && h <= 20 ? "moderate" : "low";
  if ((h >= 8 && h <= 10) || (h >= 17 && h <= 20)) return "heavy";
  if (h >= 12 && h <= 14) return "moderate";
  if (h >= 22 || h < 6) return "low";
  return "moderate";
};
const getTrafficColor = (level) => {
  const map = {
    low: C.success,
    moderate: C.orange,
    heavy: C.red,
    severe: "#B91C1C",
  };
  return map[level] || C.textLight;
};

const calculateFareBreakdown = (vehicle, distanceKm, durationMinutes) => {
  if (!vehicle || !distanceKm) return null;
  const isNight = isNightTime();
  const isPeak = isPeakHour();
  const trafficLevel = estimateTrafficLevel();
  const trafficMultiplier =
    PRICING_CONFIG.trafficMultipliers[trafficLevel] || 1.0;

  const baseFare = vehicle.baseFare;
  const distanceFare = distanceKm * vehicle.perKm;
  const timeFare = durationMinutes * (vehicle.perMin || PRICING_CONFIG.perMinuteRate);
  let subtotal = baseFare + distanceFare + timeFare;

  const nightCharge = isNight
    ? Math.round(subtotal * (PRICING_CONFIG.nightMultiplier - 1))
    : 0;
  const peakCharge =
    isPeak && !isNight
      ? Math.round(subtotal * (PRICING_CONFIG.peakMultiplier - 1))
      : 0;
  const trafficSurge = Math.round((trafficMultiplier - 1) * subtotal);
  const fareAfterSurge = subtotal + nightCharge + peakCharge + trafficSurge;
  const adjustedFare = Math.max(fareAfterSurge, PRICING_CONFIG.minimumFare);

  const platformCommission = Math.round(
    (adjustedFare * PRICING_CONFIG.platformCommissionPercent) / 100
  );
  const platformFixedFee = PRICING_CONFIG.platformFixedFee;
  const totalPlatformEarning = platformCommission + platformFixedFee;
  const gstOnCommission = Math.round(
    (totalPlatformEarning * PRICING_CONFIG.gstOnCommissionPercent) / 100
  );
  const driverEarning = adjustedFare - totalPlatformEarning;
  const customerTotal = Math.round(
    adjustedFare + platformFixedFee + gstOnCommission
  );

  return {
    baseFare: Math.round(baseFare),
    distanceFare: Math.round(distanceFare),
    timeFare: Math.round(timeFare),
    nightCharge,
    peakCharge,
    trafficSurge,
    subtotal: Math.round(subtotal),
    platformCommission,
    platformFixedFee,
    totalPlatformEarning,
    gstOnCommission,
    driverEarning: Math.round(driverEarning),
    customerTotal,
    minFare: Math.round(customerTotal * 0.93),
    maxFare: Math.round(customerTotal * 1.08),
    priceRange: `₹${Math.round(customerTotal * 0.93)}–₹${Math.round(customerTotal * 1.08)}`,
    isNight,
    isPeak,
    trafficLevel,
    trafficMultiplier,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes: Math.round(durationMinutes),
  };
};

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// ==================== MAIN COMPONENT ====================
export default function PickDropScreen({ navigation, route }) {
  const app = getApp();
  const auth = getAuth(app);
  const user = auth.currentUser;
  const mapRef = useRef(null);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const goldPulse = useRef(new Animated.Value(1)).current;

  const [currentScreen, setCurrentScreen] = useState("home");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [region, setRegion] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceText, setDistanceText] = useState(null);
  const [durationText, setDurationText] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState("book_any");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [recentSearches, setRecentSearches] = useState(DEFAULT_RECENT_LOCATIONS);
  const [homeLocation, setHomeLocation] = useState(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [showCashInfo, setShowCashInfo] = useState(false);

  // ── Entrance animations ──
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
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(goldPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── Sidebar ──
  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    Animated.timing(sidebarAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [sidebarAnim]);

  const closeSidebar = useCallback(() => {
    Animated.timing(sidebarAnim, {
      toValue: -width * 0.8,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSidebarVisible(false));
  }, [sidebarAnim]);

  // ── Location ──
  const fetchCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coord = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      const rev = await Location.reverseGeocodeAsync({
        latitude: coord.lat,
        longitude: coord.lng,
      });
      let fullAddress = "Current Location";
      if (rev.length > 0) {
        const a = rev[0];
        fullAddress = [a.name, a.street, a.district, a.city, a.region, a.postalCode]
          .filter(Boolean)
          .join(", ");
      }
      setPickup({ description: fullAddress, location: coord });
      const r = {
        latitude: coord.lat + 0.004,
        longitude: coord.lng,
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      };
      setRegion(r);
      mapRef.current?.animateToRegion(r);
    } catch {
      const def = { lat: 18.5204, lng: 73.8567 };
      setPickup({ description: "Current Location", location: def });
      setRegion({
        latitude: def.lat + 0.004,
        longitude: def.lng,
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      });
    }
  }, []);

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  useEffect(() => {
    try {
      const p = route?.params?.prefilledDrop;
      if (p?.location) {
        setDrop({ description: p.description, location: p.location });
        setCurrentScreen("ride_options");
      }
    } catch {}
  }, [route?.params?.prefilledDrop]);

  // ── Route ──
  useEffect(() => {
    const calc = async () => {
      if (!pickup || !drop) return;
      setLoadingRoute(true);
      try {
        const r = await getDirections(pickup.location, drop.location);
        if (r) {
          setRouteCoords(r.coords);
          setDistanceText(r.distance);
          setDurationText(r.duration);
          setTimeout(() => {
            if (mapRef.current && r.coords.length > 0) {
              mapRef.current.fitToCoordinates(r.coords, {
                edgePadding: {
                  top: 80,
                  bottom: height * 0.57,
                  left: 50,
                  right: 50,
                },
                animated: true,
              });
            }
          }, 500);
        }
      } catch (e) {
        console.log("Route error:", e);
      }
      setLoadingRoute(false);
    };
    calc();
  }, [pickup, drop]);

  // ── Saved places ──
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { success, data } = await safeFetchJSON(
        `${API_BASE_URL}/users/${user.uid}/saved-places`
      );
      if (success && Array.isArray(data)) {
        setSavedPlaces(data);
        const home = data.find((p) => p.label?.toLowerCase() === "home");
        const office = data.find(
          (p) =>
            p.label?.toLowerCase() === "office" ||
            p.label?.toLowerCase() === "work"
        );
        if (home) setHomeLocation(home);
        if (office) setOfficeLocation(office);
      }
    };
    load();
  }, [user]);

  // ── Back handler ──
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => sub.remove();
  }, [currentScreen, sidebarVisible, showFareDetails]);

  // ── Computed ──
  const distanceKm = useMemo(() => {
    if (!distanceText) return 0;
    const m = distanceText.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  }, [distanceText]);

  const durationMinutes = useMemo(() => {
    if (!durationText) return 0;
    let mins = 0;
    const h = durationText.match(/(\d+)\s*hr/);
    const m = durationText.match(/(\d+)\s*min/);
    if (h) mins += parseInt(h[1]) * 60;
    if (m) mins += parseInt(m[1]);
    return mins || 15;
  }, [durationText]);

  const selectedVehicleData = useMemo(
    () => VEHICLES.find((v) => v.id === selectedVehicle),
    [selectedVehicle]
  );

  const fareBreakdown = useMemo(() => {
    if (!selectedVehicleData || !distanceKm) return null;
    return calculateFareBreakdown(selectedVehicleData, distanceKm, durationMinutes);
  }, [selectedVehicleData, distanceKm, durationMinutes]);

  const allVehicleFares = useMemo(() => {
    if (!distanceKm) return {};
    const f = {};
    VEHICLES.forEach((v) => {
      f[v.id] = calculateFareBreakdown(v, distanceKm, durationMinutes);
    });
    return f;
  }, [distanceKm, durationMinutes]);

  // ==================== HANDLERS ====================
  const handleBackPress = () => {
    if (sidebarVisible) { closeSidebar(); return true; }
    if (showFareDetails) { setShowFareDetails(false); return true; }
    if (currentScreen === "ride_options") {
      setCurrentScreen("search");
      setDrop(null);
      setRouteCoords([]);
      setDistanceText(null);
      setDurationText(null);
      return true;
    }
    if (currentScreen === "search") { setCurrentScreen("home"); return true; }
    navigation.goBack();
    return true;
  };

  const handleDestinationSelect = (destination) => {
    const newRecent = {
      id: Date.now().toString(),
      title: destination.description || destination.title,
      subtitle: destination.subtitle || "",
      location: destination.location,
    };
    setRecentSearches((prev) =>
      [newRecent, ...prev.filter((r) => r.title !== newRecent.title)].slice(0, 10)
    );
    setDrop({
      description: destination.description || destination.title,
      location: destination.location,
    });
    setCurrentScreen("ride_options");
  };

  const handleSidebarNavigation = (navRoute) => {
    closeSidebar();
    if (navRoute)
      setTimeout(() => {
        try { navigation.navigate(navRoute); } catch {}
      }, 280);
  };

  const handleSavedPlaceFromSidebar = (place) => {
    closeSidebar();
    setTimeout(() => {
      handleDestinationSelect({
        description: place.address || place.label,
        location: place.location,
      });
    }, 280);
  };

  // ==================== BOOKING ====================
  const confirmBooking = async () => {
    if (!drop || !user || !fareBreakdown) {
      Alert.alert("Missing Info", "Please select a destination");
      return;
    }
    setBookingInProgress(true);
    try {
      const finalPaymentMethod = paymentMethod === "upi" ? "online" : paymentMethod;
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.uid,
          service_type: "pickdrop",
          vehicle: selectedVehicle,
          distance: fareBreakdown.distanceKm,
          duration: fareBreakdown.durationMinutes,
          price: fareBreakdown.customerTotal,
          payment_method: finalPaymentMethod,
          pickup_lat: pickup.location.lat,
          pickup_lng: pickup.location.lng,
          drop_lat: drop.location.lat,
          drop_lng: drop.location.lng,
          pickup: pickup.description,
          drop: drop.description,
          pricing: {
            base_fare: fareBreakdown.baseFare,
            distance_fare: fareBreakdown.distanceFare,
            time_fare: fareBreakdown.timeFare,
            night_charge: fareBreakdown.nightCharge,
            peak_charge: fareBreakdown.peakCharge,
            traffic_surge: fareBreakdown.trafficSurge,
            subtotal: fareBreakdown.subtotal,
            platform_commission: fareBreakdown.platformCommission,
            platform_fixed_fee: fareBreakdown.platformFixedFee,
            total_platform_earning: fareBreakdown.totalPlatformEarning,
            gst_on_commission: fareBreakdown.gstOnCommission,
            driver_earning: fareBreakdown.driverEarning,
            customer_total: fareBreakdown.customerTotal,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to create order");
      const { id } = await res.json();
      await fetch(`${API_BASE_URL}/orders/${id}/request`, { method: "POST" });
      navigation.navigate("FindingDriverScreen", {
        orderId: id,
        pickup: pickup.location,
        pickupAddress: pickup.description,
        drop: drop.location,
        dropAddress: drop.description,
        routeCoords,
        vehicleId: selectedVehicle,
        vehicleName: selectedVehicleData.name,
        vehicleImage: selectedVehicleData.image,
        vehicleCapacity: selectedVehicleData.capacity,
        distance: distanceText,
        distanceKm: fareBreakdown.distanceKm,
        duration: durationText,
        durationMinutes: fareBreakdown.durationMinutes,
        customerTotal: fareBreakdown.customerTotal,
        totalFare: fareBreakdown.customerTotal,
        driverEarning: fareBreakdown.driverEarning,
        platformEarning: fareBreakdown.totalPlatformEarning,
        baseFare: fareBreakdown.baseFare,
        isNight: fareBreakdown.isNight,
        isPeak: fareBreakdown.isPeak,
        trafficLevel: fareBreakdown.trafficLevel,
        paymentMethod: finalPaymentMethod,
      });
    } catch (e) {
      console.log("Booking error:", e);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setBookingInProgress(false);
    }
  };

  // ==================== SIDEBAR ====================
  const renderSidebar = () => {
    if (!sidebarVisible) return null;
    return (
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeSidebar}
          >
            <View style={styles.sidebarBackdrop} />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.sidebarContainer,
              { transform: [{ translateX: sidebarAnim }] },
            ]}
          >
            {/* Profile Header */}
            <LinearGradient
              colors={GRAD.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sidebarProfile}
            >
              <View style={styles.sidebarDecor} />
              <View style={styles.sidebarAvatar}>
                {user?.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.sidebarAvatarImg}
                  />
                ) : (
                  <Ionicons name="person" size={28} color={C.white} />
                )}
              </View>
              <View style={styles.sidebarProfileInfo}>
                <Text style={styles.sidebarProfileName} numberOfLines={1}>
                  {user?.displayName || "User"}
                </Text>
                <Text style={styles.sidebarProfilePhone} numberOfLines={1}>
                  {user?.phoneNumber || user?.email || "Welcome!"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sidebarEditBtn}
                onPress={() => handleSidebarNavigation("Profile")}
              >
                <Ionicons name="chevron-forward" size={16} color={C.white} />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              style={styles.sidebarScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Saved Places */}
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>SAVED PLACES</Text>
                {[
                  {
                    label: "Home",
                    icon: "home",
                    loc: homeLocation,
                    iconBg: C.primarySoft,
                    iconColor: C.violet,
                  },
                  {
                    label: "Office",
                    icon: "briefcase",
                    loc: officeLocation,
                    iconBg: C.pastelOrange,
                    iconColor: C.orange,
                  },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.sidebarSavedRow}
                    onPress={() =>
                      item.loc
                        ? handleSavedPlaceFromSidebar(item.loc)
                        : handleSidebarNavigation("AddPlace")
                    }
                  >
                    <View
                      style={[
                        styles.sidebarSavedIcon,
                        { backgroundColor: item.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={17}
                        color={item.iconColor}
                      />
                    </View>
                    <View style={styles.sidebarSavedInfo}>
                      <Text style={styles.sidebarSavedLabel}>{item.label}</Text>
                      <Text
                        style={styles.sidebarSavedAddr}
                        numberOfLines={1}
                      >
                        {item.loc?.address || `Add ${item.label.toLowerCase()} address`}
                      </Text>
                    </View>
                    <Ionicons
                      name={item.loc ? "chevron-forward" : "add-circle-outline"}
                      size={16}
                      color={C.textLight}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sidebarSectionTitle}>RECENT</Text>
                  {recentSearches.slice(0, 4).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.sidebarRecentRow}
                      onPress={() => {
                        closeSidebar();
                        setTimeout(
                          () =>
                            handleDestinationSelect({
                              description: item.title,
                              subtitle: item.subtitle,
                              location: item.location,
                            }),
                          280
                        );
                      }}
                    >
                      <View style={styles.sidebarRecentIcon}>
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color={C.textLight}
                        />
                      </View>
                      <Text
                        style={styles.sidebarRecentText}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Menu */}
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>MENU</Text>
                {SIDEBAR_MENU_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.sidebarMenuItem}
                    onPress={() => handleSidebarNavigation(item.route)}
                  >
                    <View
                      style={[
                        styles.sidebarMenuIcon,
                        { backgroundColor: item.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={item.iconColor}
                      />
                    </View>
                    <Text style={styles.sidebarMenuLabel}>{item.label}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={C.textFaint}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Logout */}
              <TouchableOpacity
                style={styles.sidebarLogout}
                onPress={() => {
                  closeSidebar();
                  setTimeout(() => auth.signOut(), 300);
                }}
              >
                <View style={styles.sidebarLogoutIcon}>
                  <Ionicons name="log-out-outline" size={18} color={C.red} />
                </View>
                <Text style={styles.sidebarLogoutText}>Logout</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // ==================== FARE MODAL ====================
  const renderFareDetailsModal = () => {
    if (!fareBreakdown) return null;

    return (
      <Modal
        visible={showFareDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFareDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fareModalContainer}>
            {/* Handle */}
            <View style={styles.fareModalHandle} />

            {/* Header */}
            <View style={styles.fareModalHeader}>
              <View>
                <Text style={styles.fareModalTitle}>Fare Breakdown</Text>
                <Text style={styles.fareModalSub}>
                  {selectedVehicleData?.name} •{" "}
                  {fareBreakdown.distanceKm} km
                </Text>
              </View>
              <TouchableOpacity
                style={styles.fareModalCloseBtn}
                onPress={() => setShowFareDetails(false)}
              >
                <Ionicons name="close" size={18} color={C.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Trip Info Strip */}
              <LinearGradient
                colors={GRAD.lavender}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fareTripStrip}
              >
                {[
                  {
                    icon: "navigate",
                    label: `${fareBreakdown.distanceKm} km`,
                    color: C.violet,
                  },
                  {
                    icon: "time",
                    label: `${fareBreakdown.durationMinutes} min`,
                    color: C.violet,
                  },
                  {
                    icon: "car",
                    label:
                      fareBreakdown.trafficLevel.charAt(0).toUpperCase() +
                      fareBreakdown.trafficLevel.slice(1),
                    color: getTrafficColor(fareBreakdown.trafficLevel),
                  },
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.fareTripStripDivider} />}
                    <View style={styles.fareTripStripItem}>
                      <Ionicons name={item.icon} size={14} color={item.color} />
                      <Text
                        style={[
                          styles.fareTripStripText,
                          { color: item.color },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </LinearGradient>

              {/* Surge Badges */}
              {(fareBreakdown.isNight || fareBreakdown.isPeak) && (
                <View style={styles.fareSurgeBadges}>
                  {fareBreakdown.isNight && (
                    <View
                      style={[
                        styles.surgeBadge,
                        { backgroundColor: C.primarySoft },
                      ]}
                    >
                      <Ionicons name="moon" size={12} color={C.violet} />
                      <Text style={[styles.surgeBadgeText, { color: C.violet }]}>
                        Night Fare
                      </Text>
                    </View>
                  )}
                  {fareBreakdown.isPeak && (
                    <View
                      style={[
                        styles.surgeBadge,
                        { backgroundColor: C.warningBg },
                      ]}
                    >
                      <Ionicons
                        name="trending-up"
                        size={12}
                        color={C.warning}
                      />
                      <Text
                        style={[styles.surgeBadgeText, { color: C.warning }]}
                      >
                        Peak Hour
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Ride Fare Section */}
              <View style={styles.fareSection}>
                <Text style={styles.fareSectionTitle}>Ride Fare</Text>
                {[
                  { label: "Base Fare", value: fareBreakdown.baseFare },
                  {
                    label: `Distance (${fareBreakdown.distanceKm} km × ₹${selectedVehicleData?.perKm}/km)`,
                    value: fareBreakdown.distanceFare,
                  },
                  {
                    label: `Time (${fareBreakdown.durationMinutes} min × ₹${selectedVehicleData?.perMin || 1}/min)`,
                    value: fareBreakdown.timeFare,
                  },
                  fareBreakdown.nightCharge > 0 && {
                    label: "Night Surcharge",
                    value: fareBreakdown.nightCharge,
                    icon: "moon-outline",
                    accent: true,
                    accentColor: C.violet,
                  },
                  fareBreakdown.peakCharge > 0 && {
                    label: "Peak Hour Charge",
                    value: fareBreakdown.peakCharge,
                    icon: "trending-up-outline",
                    accent: true,
                    accentColor: C.warning,
                  },
                  fareBreakdown.trafficSurge > 0 && {
                    label: "Traffic Surge",
                    value: fareBreakdown.trafficSurge,
                    icon: "car-outline",
                    accent: true,
                    accentColor: C.orange,
                  },
                ]
                  .filter(Boolean)
                  .map((row, i) => (
                    <View key={i} style={styles.fareRow}>
                      <View style={styles.fareRowLeft}>
                        {row.icon && (
                          <Ionicons
                            name={row.icon}
                            size={13}
                            color={row.accentColor || C.textLight}
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.fareRowLabel,
                            row.accent && { color: row.accentColor },
                          ]}
                        >
                          {row.label}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.fareRowValue,
                          row.accent && { color: row.accentColor },
                        ]}
                      >
                        ₹{row.value}
                      </Text>
                    </View>
                  ))}
              </View>

              {/* Fees Section */}
              <View style={styles.fareSection}>
                <Text style={styles.fareSectionTitle}>Fees & Taxes</Text>
                <View style={styles.fareRow}>
                  <View style={styles.fareRowLeft}>
                    <Ionicons
                      name="business-outline"
                      size={13}
                      color={C.textLight}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.fareRowLabel}>Platform Fee</Text>
                  </View>
                  <Text style={styles.fareRowValue}>
                    ₹{fareBreakdown.platformFixedFee}
                  </Text>
                </View>
                <View style={styles.fareRow}>
                  <View style={styles.fareRowLeft}>
                    <Ionicons
                      name="receipt-outline"
                      size={13}
                      color={C.textLight}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.fareRowLabel}>GST (18%)</Text>
                  </View>
                  <Text style={styles.fareRowValue}>
                    ₹{fareBreakdown.gstOnCommission}
                  </Text>
                </View>
              </View>

              {/* Total */}
              <View style={styles.fareTotalCard}>
                <LinearGradient
                  colors={GRAD.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.fareTotalDecor} />
                <View>
                  <Text style={styles.fareTotalLabel}>You Pay</Text>
                  <Text style={styles.fareTotalSub}>Inclusive of all taxes</Text>
                </View>
                <View style={styles.fareTotalRight}>
                  <Text style={styles.fareTotalValue}>
                    ₹{fareBreakdown.customerTotal}
                  </Text>
                  <Text style={styles.fareTotalDecimal}>.00</Text>
                </View>
              </View>

              {/* Earnings Transparency */}
              <View style={styles.earningsCard}>
                <View style={styles.earningsHeader}>
                  <View style={styles.earningsIconWrap}>
                    <Ionicons
                      name="pie-chart-outline"
                      size={13}
                      color={C.violet}
                    />
                  </View>
                  <Text style={styles.earningsTitle}>
                    How your fare is split
                  </Text>
                </View>
                <View style={styles.earningsBar}>
                  {[
                    {
                      flex: fareBreakdown.driverEarning,
                      color: C.violet,
                      rL: 4,
                      rR: 0,
                    },
                    {
                      flex: fareBreakdown.totalPlatformEarning,
                      color: C.blueAccent,
                      rL: 0,
                      rR: 0,
                    },
                    {
                      flex: fareBreakdown.gstOnCommission || 1,
                      color: C.orange,
                      rL: 0,
                      rR: 4,
                    },
                  ].map((s, i) => (
                    <View
                      key={i}
                      style={{
                        flex: s.flex,
                        height: 10,
                        backgroundColor: s.color,
                        borderTopLeftRadius: s.rL,
                        borderBottomLeftRadius: s.rL,
                        borderTopRightRadius: s.rR,
                        borderBottomRightRadius: s.rR,
                        marginRight: i < 2 ? 2 : 0,
                      }}
                    />
                  ))}
                </View>
                <View style={styles.earningsLegend}>
                  {[
                    {
                      color: C.violet,
                      label: "Driver",
                      value: fareBreakdown.driverEarning,
                    },
                    {
                      color: C.blueAccent,
                      label: "Platform",
                      value: fareBreakdown.totalPlatformEarning,
                    },
                    {
                      color: C.orange,
                      label: "GST",
                      value: fareBreakdown.gstOnCommission,
                    },
                  ].map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <Text style={styles.legendText}>
                        {item.label}: ₹{item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Payment note */}
              {paymentMethod === "cash" && (
                <View style={styles.cashNoteBox}>
                  <LinearGradient
                    colors={[C.warningBg, "#FEFCE8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={C.warning}
                  />
                  <Text style={styles.cashNoteText}>
                    Pay ₹{fareBreakdown.customerTotal} in cash to driver.
                    Platform fee of ₹{fareBreakdown.totalPlatformEarning} will
                    be adjusted from driver's earnings.
                  </Text>
                </View>
              )}

              {/* Disclaimer */}
              <View style={styles.fareDisclaimer}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={C.textFaint}
                />
                <Text style={styles.fareDisclaimerText}>
                  Final fare may vary based on actual route, waiting time &
                  traffic. Toll charges are extra.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ==================== SCREEN 1: HOME ====================
  const renderHomeScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          region={region}
          showsUserLocation={false}
          provider={PROVIDER_GOOGLE}
          customMapStyle={MAP_STYLE}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {pickup && (
            <Marker
              coordinate={{
                latitude: pickup.location.lat,
                longitude: pickup.location.lng,
              }}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerOuter}>
                  <LinearGradient
                    colors={GRAD.primary}
                    style={styles.userMarkerDot}
                  >
                    <View style={styles.userMarkerInner} />
                  </LinearGradient>
                </View>
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Top Bar */}
      <View style={styles.homeTopBar}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={openSidebar}
          activeOpacity={0.85}
        >
          <Ionicons name="menu" size={22} color={C.textDark} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeSearchBar}
          onPress={() => setCurrentScreen("search")}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={GRAD.primary}
            style={styles.searchBarDot}
          />
          <Text style={styles.homeSearchText} numberOfLines={1}>
            {pickup?.description || "Set pickup location"}
          </Text>
          <View style={styles.searchBarArrow}>
            <Ionicons name="chevron-forward" size={14} color={C.violet} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Recenter FAB */}
      <TouchableOpacity
        style={styles.recenterFab}
        onPress={fetchCurrentLocation}
        activeOpacity={0.85}
      >
        <Ionicons name="locate" size={20} color={C.violet} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.homeBottomSheet,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.sheetHandle} />

        {/* Search Destination */}
        <TouchableOpacity
          style={styles.searchDestBar}
          onPress={() => setCurrentScreen("search")}
          activeOpacity={0.9}
        >
          <View style={styles.searchDestIconWrap}>
            <Ionicons name="search" size={17} color={C.violet} />
          </View>
          <Text style={styles.searchDestText}>Where to?</Text>
          <LinearGradient
            colors={GRAD.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchDestBadge}
          >
            <Text style={styles.searchDestBadgeText}>GO</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Access */}
        <View style={styles.quickAccessRow}>
          {[
            {
              label: "Home",
              icon: "home",
              iconBg: C.primarySoft,
              iconColor: C.violet,
              loc: homeLocation,
              route: "SavedPlaces",
            },
            {
              label: "Office",
              icon: "briefcase",
              iconBg: C.pastelOrange,
              iconColor: C.orange,
              loc: officeLocation,
              route: "SavedPlaces",
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickAccessItem}
              activeOpacity={0.8}
              onPress={() => {
                if (item.loc) {
                  handleDestinationSelect({
                    description:
                      item.loc.address || item.label,
                    location: {
                      lat:
                        item.loc.lat || item.loc.location?.lat,
                      lng:
                        item.loc.lng || item.loc.location?.lng,
                    },
                  });
                } else {
                  Alert.alert(
                    `No ${item.label} Address`,
                    `Save your ${item.label.toLowerCase()} address for quick booking`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Add Now",
                        onPress: () =>
                          navigation.navigate(item.route),
                      },
                    ]
                  );
                }
              }}
            >
              <View
                style={[
                  styles.quickAccessIcon,
                  { backgroundColor: item.iconBg },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={17}
                  color={item.iconColor}
                />
              </View>
              <Text style={styles.quickAccessLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Destinations */}
        <View style={styles.recentCardHome}>
          <LinearGradient
            colors={GRAD.lavender}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.recentCardHeader}
          >
            <View style={styles.recentCardHeaderIcon}>
              <Ionicons name="time-outline" size={13} color={C.violet} />
            </View>
            <Text style={styles.recentCardHeaderTitle}>Recent</Text>
          </LinearGradient>

          {recentSearches.slice(0, 2).map((loc, i) => (
            <TouchableOpacity
              key={loc.id}
              style={[
                styles.recentCardItem,
                i < 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
              ]}
              onPress={() => handleDestinationSelect(loc)}
              activeOpacity={0.8}
            >
              <View style={styles.recentCardItemIcon}>
                <Ionicons name="time-outline" size={15} color={C.textLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentCardItemTitle} numberOfLines={1}>
                  {loc.title}
                </Text>
                <Text
                  style={styles.recentCardItemSubtitle}
                  numberOfLines={1}
                >
                  {loc.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={C.textFaint}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo Banner */}
        <TouchableOpacity activeOpacity={0.92}>
          <LinearGradient
            colors={GRAD.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoBanner}
          >
            <View style={styles.promoDecor} />
            <View style={styles.promoContent}>
              <Text style={styles.promoSmall}>RIDE WITH CONFIDENCE</Text>
              <Text style={styles.promoBig}>100% Fare Transparency</Text>
              <View style={styles.promoPill}>
                <Ionicons name="shield-checkmark" size={11} color={C.violet} />
                <Text style={styles.promoPillText}>No hidden charges</Text>
              </View>
            </View>
            <View style={styles.promoIconWrap}>
              <LinearGradient
                colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.08)"]}
                style={styles.promoIconCircle}
              >
                <Ionicons name="car-sport" size={40} color={C.white} />
              </LinearGradient>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {renderSidebar()}
    </View>
  );

  // ==================== SCREEN 2: SEARCH ====================
  const renderSearchScreen = () => (
    <View style={styles.searchContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrentScreen("home")}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <Text style={styles.searchHeaderTitle}>Set Destination</Text>
        <View style={styles.myselfPill}>
          <Ionicons name="person" size={12} color={C.violet} />
          <Text style={styles.myselfText}>Myself</Text>
        </View>
      </View>

      {/* Location Input Card */}
      <View style={styles.locationCard}>
        {/* Timeline */}
        <View style={styles.timeline}>
          <LinearGradient colors={GRAD.primary} style={styles.timelineTopDot} />
          <View style={styles.timelineLine} />
          <View style={styles.timelineBottomDot}>
            <Ionicons name="caret-down" size={8} color={C.white} />
          </View>
        </View>

        <View style={styles.locationInputs}>
          {/* Pickup row */}
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.8}>
            <Text style={styles.pickupText} numberOfLines={1}>
              {pickup?.description || "Set pickup location"}
            </Text>
          </TouchableOpacity>

          <View style={styles.locationDivider} />

          {/* Destination row */}
          <View style={styles.destinationRow}>
            <View style={{ flex: 1 }}>
              <AddressSearch
                placeholder="Where to?"
                onSelect={handleDestinationSelect}
                inputStyle={styles.destinationInput}
                placeholderTextColor={C.textLight}
              />
            </View>
            <TouchableOpacity style={styles.addStopBtn} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color={C.violet} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.recentList}
        contentContainerStyle={styles.recentListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Saved Places */}
        {(homeLocation || officeLocation) && (
          <>
            <Text style={styles.sectionLabel}>SAVED PLACES</Text>
            {[
              homeLocation && {
                label: "Home",
                icon: "home",
                iconBg: C.primarySoft,
                iconColor: C.violet,
                addr: homeLocation.address,
                loc: homeLocation.location,
              },
              officeLocation && {
                label: "Office",
                icon: "briefcase",
                iconBg: C.pastelOrange,
                iconColor: C.orange,
                addr: officeLocation.address,
                loc: officeLocation.location,
              },
            ]
              .filter(Boolean)
              .map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.recentItem}
                  activeOpacity={0.75}
                  onPress={() =>
                    handleDestinationSelect({
                      description: item.addr || item.label,
                      location: item.loc,
                    })
                  }
                >
                  <View
                    style={[
                      styles.recentItemIcon,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <Ionicons name={item.icon} size={17} color={item.iconColor} />
                  </View>
                  <View style={styles.recentItemText}>
                    <Text style={styles.recentItemTitle}>{item.label}</Text>
                    <Text style={styles.recentItemSubtitle} numberOfLines={1}>
                      {item.addr}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={C.textFaint}
                  />
                </TouchableOpacity>
              ))}
          </>
        )}

        {/* Recent */}
        <Text
          style={[
            styles.sectionLabel,
            (homeLocation || officeLocation) && { marginTop: SP.xxl },
          ]}
        >
          RECENT
        </Text>
        {recentSearches.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={styles.recentItem}
            activeOpacity={0.75}
            onPress={() =>
              handleDestinationSelect({
                description: loc.title,
                subtitle: loc.subtitle,
                location: loc.location,
              })
            }
          >
            <View style={styles.recentItemIconGray}>
              <Ionicons name="time-outline" size={17} color={C.textLight} />
            </View>
            <View style={styles.recentItemText}>
              <Text style={styles.recentItemTitle} numberOfLines={1}>
                {loc.title}
              </Text>
              <Text style={styles.recentItemSubtitle} numberOfLines={1}>
                {loc.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={C.textFaint} />
          </TouchableOpacity>
        ))}

        {/* Other saved places */}
        {savedPlaces
          .filter(
            (p) =>
              !["home", "office", "work"].includes(p.label?.toLowerCase())
          )
          .length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: SP.xxl }]}>
              MORE PLACES
            </Text>
            {savedPlaces
              .filter(
                (p) =>
                  !["home", "office", "work"].includes(p.label?.toLowerCase())
              )
              .map((item) => (
                <TouchableOpacity
                  key={item.id || item._id}
                  style={styles.recentItem}
                  activeOpacity={0.75}
                  onPress={() =>
                    handleDestinationSelect({
                      description: item.address,
                      location: item.location,
                    })
                  }
                >
                  <View
                    style={[
                      styles.recentItemIcon,
                      {
                        backgroundColor:
                          (item.color || C.violet) + "18",
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon || "location"}
                      size={17}
                      color={item.color || C.violet}
                    />
                  </View>
                  <View style={styles.recentItemText}>
                    <Text style={styles.recentItemTitle}>{item.label}</Text>
                    <Text
                      style={styles.recentItemSubtitle}
                      numberOfLines={1}
                    >
                      {item.address}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={C.textFaint}
                  />
                </TouchableOpacity>
              ))}
          </>
        )}
      </ScrollView>

      {/* Locate on Map */}
      <View style={styles.locateMapBar}>
        <TouchableOpacity style={styles.locateMapBtn} activeOpacity={0.9}>
          <LinearGradient
            colors={GRAD.primary}
            style={styles.locateMapIconWrap}
          >
            <Ionicons name="location" size={16} color={C.white} />
          </LinearGradient>
          <Text style={styles.locateMapText}>Locate on Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==================== SCREEN 3: RIDE OPTIONS ====================
  const renderRideOptionsScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          region={region}
          showsUserLocation={false}
          provider={PROVIDER_GOOGLE}
          customMapStyle={MAP_STYLE}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={true}
        >
          {pickup && (
            <Marker
              coordinate={{
                latitude: pickup.location.lat,
                longitude: pickup.location.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerOuter}>
                  <LinearGradient
                    colors={GRAD.primary}
                    style={styles.userMarkerDot}
                  >
                    <View style={styles.userMarkerInner} />
                  </LinearGradient>
                </View>
              </View>
            </Marker>
          )}
          {drop && (
            <Marker
              coordinate={{
                latitude: drop.location.lat,
                longitude: drop.location.lng,
              }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.dropMarker}>
                <LinearGradient
                  colors={[C.red, "#C0392B"]}
                  style={styles.dropMarkerInner}
                >
                  <Ionicons name="location" size={16} color={C.white} />
                </LinearGradient>
                <View style={styles.dropMarkerTail} />
              </View>
            </Marker>
          )}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={C.violet}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
      )}

      {/* Back + Expand */}
      <TouchableOpacity
        style={styles.mapBackBtn}
        onPress={() => setCurrentScreen("search")}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back" size={20} color={C.textDark} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.expandBtn} activeOpacity={0.85}>
        <Ionicons name="expand-outline" size={17} color={C.textDark} />
      </TouchableOpacity>

      {/* Route Summary Card */}
      <View style={styles.routeSummaryCard}>
        <View style={styles.routeTimeline}>
          <LinearGradient
            colors={GRAD.primary}
            style={styles.routeTimelineTop}
          />
          <View style={styles.routeTimelineLine} />
          <View style={styles.routeTimelineBottom} />
        </View>
        <View style={styles.routeLocations}>
          <Text style={styles.routePickupText} numberOfLines={1}>
            {pickup?.description || "Pickup"}
          </Text>
          <Text style={styles.routeDropText} numberOfLines={1}>
            {drop?.description || "Drop"}
          </Text>
        </View>
        <TouchableOpacity style={styles.nowPill} activeOpacity={0.8}>
          <Text style={styles.nowPillText}>Now</Text>
          <Ionicons name="chevron-down" size={12} color={C.textDark} />
        </TouchableOpacity>
      </View>

      {/* Distance / Duration badge */}
      {distanceText && durationText && (
        <View style={styles.distanceBadge}>
          <LinearGradient
            colors={[C.primarySoft, C.lavenderBg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="navigate" size={11} color={C.violet} />
          <Text style={styles.distanceBadgeText}>
            {distanceText} • {durationText}
          </Text>
        </View>
      )}

      {/* Ride Panel */}
      <View style={styles.ridePanel}>
        <View style={styles.panelHandle} />

        {/* Peak/Night indicator */}
        {fareBreakdown && (fareBreakdown.isNight || fareBreakdown.isPeak) && (
          <View style={styles.surgeStripPanel}>
            <Ionicons
              name={fareBreakdown.isNight ? "moon" : "trending-up"}
              size={12}
              color={fareBreakdown.isNight ? C.violet : C.warning}
            />
            <Text
              style={[
                styles.surgeStripText,
                { color: fareBreakdown.isNight ? C.violet : C.warning },
              ]}
            >
              {fareBreakdown.isNight ? "Night fare active" : "Peak hour pricing"}
            </Text>
          </View>
        )}

        {/* Vehicle List */}
        <FlatList
          data={VEHICLES}
          keyExtractor={(item) => item.id}
          style={styles.vehicleList}
          showsVerticalScrollIndicator={false}
          bounces={false}
          renderItem={({ item }) => {
            const isSelected = selectedVehicle === item.id;
            const vFare = allVehicleFares[item.id];

            return (
              <TouchableOpacity
                style={[
                  styles.vehicleRow,
                  isSelected && styles.vehicleRowSelected,
                ]}
                onPress={() => setSelectedVehicle(item.id)}
                activeOpacity={0.85}
              >
                {/* Popular / Premium tag */}
                {item.popular && (
                  <LinearGradient
                    colors={GRAD.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.vehicleTag}
                  >
                    <Text style={styles.vehicleTagText}>POPULAR</Text>
                  </LinearGradient>
                )}
                {item.premium && (
                  <LinearGradient
                    colors={GRAD.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.vehicleTag}
                  >
                    <Ionicons name="diamond" size={8} color={C.white} />
                    <Text style={[styles.vehicleTagText, { marginLeft: 2 }]}>
                      PREMIUM
                    </Text>
                  </LinearGradient>
                )}

                {/* Icon */}
                <View
                  style={[
                    styles.vehicleIconWrap,
                    {
                      backgroundColor: isSelected
                        ? C.white
                        : item.iconBg,
                    },
                  ]}
                >
                  <Image source={item.image} style={styles.vehicleImage} />
                  <Text style={styles.vehicleEta}>{item.time}</Text>
                </View>

                {/* Info */}
                <View style={styles.vehicleInfo}>
                  <Text
                    style={[
                      styles.vehicleName,
                      isSelected && { color: C.violet },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.vehicleDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <View style={styles.vehicleCapRow}>
                    <Ionicons
                      name="people-outline"
                      size={11}
                      color={C.textFaint}
                    />
                    <Text style={styles.vehicleCapText}>
                      {item.capacity} seats
                    </Text>
                  </View>
                </View>

                {/* Price + Radio */}
                <View style={styles.vehicleRight}>
                  {vFare ? (
                    <>
                      <Text
                        style={[
                          styles.vehiclePrice,
                          isSelected && { color: C.violet },
                        ]}
                      >
                        {item.id === "book_any"
                          ? vFare.priceRange
                          : `₹${vFare.customerTotal}`}
                      </Text>
                      {(vFare.nightCharge > 0 ||
                        vFare.peakCharge > 0 ||
                        vFare.trafficSurge > 0) && (
                        <View style={styles.surgeChip}>
                          <Ionicons
                            name="trending-up"
                            size={9}
                            color={C.warning}
                          />
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.vehiclePrice}>--</Text>
                  )}
                  {isSelected ? (
                    <LinearGradient
                      colors={GRAD.primary}
                      style={styles.radioSelected}
                    >
                      <Ionicons
                        name="checkmark"
                        size={11}
                        color={C.white}
                      />
                    </LinearGradient>
                  ) : (
                    <View style={styles.radio} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={styles.vehicleSeparator} />
          )}
        />

        {/* Fare Details link */}
        {fareBreakdown && (
          <TouchableOpacity
            style={styles.fareDetailsRow}
            onPress={() => setShowFareDetails(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={GRAD.lavender}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.fareDetailsIconWrap}>
              <Ionicons name="receipt-outline" size={13} color={C.violet} />
            </View>
            <Text style={styles.fareDetailsText}>View Fare Breakdown</Text>
            <Ionicons name="chevron-forward" size={14} color={C.violet} />
          </TouchableOpacity>
        )}

        {/* Payment Bar */}
        <View style={styles.paymentBar}>
          {[
            {
              id: "cash",
              icon: "cash-outline",
              label: "Cash",
              activeColor: C.warning,
              activeBg: C.warningBg,
            },
            {
              id: "upi",
              icon: "phone-portrait-outline",
              label: "UPI",
              activeColor: C.violet,
              activeBg: C.primarySoft,
              badge: "Preferred",
            },
            {
              id: "coupon",
              icon: "pricetag-outline",
              label: "Coupon",
              activeColor: C.violet,
              activeBg: C.primarySoft,
            },
          ].map((pm) => {
            const isActive = paymentMethod === pm.id;
            return (
              <TouchableOpacity
                key={pm.id}
                style={[
                  styles.paymentOption,
                  isActive && {
                    backgroundColor: pm.activeBg,
                    borderColor: pm.activeColor + "40",
                  },
                ]}
                onPress={() => {
                  if (pm.id !== "coupon") {
                    setPaymentMethod(pm.id);
                    if (pm.id === "cash") {
                      setShowCashInfo(true);
                      setTimeout(() => setShowCashInfo(false), 4000);
                    } else {
                      setShowCashInfo(false);
                    }
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={pm.icon}
                  size={15}
                  color={isActive ? pm.activeColor : C.textLight}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    isActive && { color: pm.activeColor, fontWeight: "700" },
                  ]}
                >
                  {pm.label}
                </Text>
                {pm.badge && (
                  <LinearGradient
                    colors={GRAD.primary}
                    style={styles.recBadge}
                  >
                    <Text style={styles.recBadgeText}>{pm.badge}</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Banners */}
        {paymentMethod === "cash" && showCashInfo && fareBreakdown && (
          <View style={styles.infoBanner}>
            <LinearGradient
              colors={[C.warningBg, "#FEFCE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="information-circle" size={16} color={C.warning} />
            <Text style={styles.infoBannerText}>
              Pay ₹{fareBreakdown.customerTotal} in cash to driver. Platform
              fee of ₹{fareBreakdown.totalPlatformEarning} will be adjusted.
            </Text>
            <TouchableOpacity onPress={() => setShowCashInfo(false)}>
              <Ionicons name="close" size={14} color={C.textLight} />
            </TouchableOpacity>
          </View>
        )}

        {paymentMethod === "upi" && (
          <View style={styles.infoBanner}>
            <LinearGradient
              colors={GRAD.lavender}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={C.violet}
            />
            <Text style={[styles.infoBannerText, { color: C.violet }]}>
              Secure payment • No change hassle • Instant receipt
            </Text>
          </View>
        )}

        {/* Book Button */}
        <Animated.View
          style={{ transform: [{ scale: goldPulse }], paddingHorizontal: SP.lg, marginTop: SP.sm }}
        >
          <TouchableOpacity
            style={[
              styles.bookButton,
              bookingInProgress && styles.bookButtonDisabled,
            ]}
            onPress={confirmBooking}
            activeOpacity={0.9}
            disabled={bookingInProgress}
          >
            {bookingInProgress ? (
              <ActivityIndicator color={C.textDark} />
            ) : (
              <>
                <View style={styles.bookButtonLeft}>
                  <Text style={styles.bookButtonText}>
                    Book {selectedVehicleData?.name}
                  </Text>
                  {fareBreakdown && (
                    <Text style={styles.bookButtonPrice}>
                      ₹{fareBreakdown.customerTotal}
                    </Text>
                  )}
                </View>
                <View style={styles.bookButtonIconWrap}>
                  <Ionicons name="arrow-forward" size={16} color={C.textDark} />
                </View>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Loading Overlay */}
      {loadingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={C.violet} />
            <Text style={styles.loadingText}>Calculating fare...</Text>
          </View>
        </View>
      )}

      {renderFareDetailsModal()}
    </View>
  );

  // ==================== MAIN RENDER ====================
  return (
    <ScreenWrapper>
      {currentScreen === "home" && renderHomeScreen()}
      {currentScreen === "search" && renderSearchScreen()}
      {currentScreen === "ride_options" && renderRideOptionsScreen()}
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ─── User Marker ───
  userMarker: { alignItems: "center", justifyContent: "center" },
  userMarkerOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.violet + "15",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.violet + "30",
  },
  userMarkerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: C.white,
  },
  userMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.white,
  },

  // ─── Drop Marker ───
  dropMarker: { alignItems: "center" },
  dropMarkerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.white,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  dropMarkerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#C0392B",
    marginTop: -2,
  },

  // ─── HOME SCREEN ───
  homeTopBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 22,
    left: SP.lg,
    right: SP.lg,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  headerIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  homeSearchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    marginLeft: SP.md,
    paddingHorizontal: SP.lg,
    paddingVertical: 13,
    borderRadius: R.full,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchBarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SP.md,
  },
  homeSearchText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: C.textDark,
    letterSpacing: -0.2,
  },
  searchBarArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  recenterFab: {
    position: "absolute",
    bottom: "44%",
    right: SP.lg,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  homeBottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    paddingTop: SP.md,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    paddingHorizontal: SP.lg,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: "center",
    marginBottom: SP.lg,
  },
  searchDestBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderRadius: R.lg,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchDestIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SP.md,
  },
  searchDestText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textLight,
    letterSpacing: -0.2,
  },
  searchDestBadge: {
    paddingHorizontal: SP.md,
    paddingVertical: 6,
    borderRadius: R.full,
  },
  searchDestBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.5,
  },
  quickAccessRow: {
    flexDirection: "row",
    marginBottom: SP.md,
    gap: SP.sm,
  },
  quickAccessItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickAccessIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  quickAccessLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textDark,
    marginLeft: SP.sm,
    marginRight: SP.xs,
  },
  recentCardHome: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: SP.lg,
    overflow: "hidden",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
    gap: SP.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  recentCardHeaderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  recentCardHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.violet,
  },
  recentCardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
  },
  recentCardItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SP.md,
  },
  recentCardItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 2,
  },
  recentCardItemSubtitle: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: "500",
  },
  promoBanner: {
    borderRadius: R.lg,
    paddingVertical: SP.xl,
    paddingHorizontal: SP.xl,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  promoDecor: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  promoContent: { flex: 1 },
  promoSmall: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  promoBig: {
    fontSize: 17,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -0.3,
    marginBottom: SP.sm,
  },
  promoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.gold,
    alignSelf: "flex-start",
    paddingHorizontal: SP.sm,
    paddingVertical: 4,
    borderRadius: R.full,
    gap: 4,
  },
  promoPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textDark,
  },
  promoIconWrap: { marginLeft: SP.lg },
  promoIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── SIDEBAR ───
  sidebarOverlay: { flex: 1 },
  sidebarBackdrop: { flex: 1, backgroundColor: C.overlay },
  sidebarContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: C.white,
    shadowColor: C.shadow,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarProfile: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 58 : 38,
    paddingBottom: SP.xl,
    paddingHorizontal: SP.lg,
    position: "relative",
    overflow: "hidden",
  },
  sidebarDecor: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sidebarAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  sidebarAvatarImg: { width: 50, height: 50, borderRadius: 25 },
  sidebarProfileInfo: { flex: 1, marginLeft: SP.md },
  sidebarProfileName: {
    fontSize: 16,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.2,
  },
  sidebarProfilePhone: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
    fontWeight: "500",
  },
  sidebarEditBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarScroll: { flex: 1 },
  sidebarSection: {
    paddingHorizontal: SP.lg,
    paddingTop: SP.lg,
    paddingBottom: SP.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sidebarSectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textFaint,
    letterSpacing: 1.2,
    marginBottom: SP.md,
  },
  sidebarSavedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SP.md,
  },
  sidebarSavedIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarSavedInfo: { flex: 1, marginHorizontal: SP.md },
  sidebarSavedLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
  },
  sidebarSavedAddr: {
    fontSize: 12,
    color: C.textLight,
    marginTop: 2,
    fontWeight: "500",
  },
  sidebarRecentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SP.sm,
  },
  sidebarRecentIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarRecentText: {
    flex: 1,
    fontSize: 13,
    color: C.textDark,
    marginLeft: SP.md,
    fontWeight: "500",
  },
  sidebarMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SP.md,
  },
  sidebarMenuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarMenuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: C.textDark,
    marginLeft: SP.md,
  },
  sidebarLogout: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SP.lg,
    paddingHorizontal: SP.lg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: SP.md,
  },
  sidebarLogoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.pastelRed,
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarLogoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.red,
    marginLeft: SP.md,
  },

  // ─── SEARCH SCREEN ───
  searchContainer: { flex: 1, backgroundColor: C.white },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 54 : 14,
    paddingBottom: SP.md,
    paddingHorizontal: SP.lg,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  searchHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  myselfPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.primarySoft,
    paddingHorizontal: SP.md,
    paddingVertical: 6,
    borderRadius: R.full,
    gap: 4,
  },
  myselfText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.violet,
  },
  locationCard: {
    flexDirection: "row",
    backgroundColor: C.white,
    marginHorizontal: SP.lg,
    marginTop: SP.lg,
    marginBottom: SP.sm,
    borderRadius: R.lg,
    padding: SP.md,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeline: {
    alignItems: "center",
    marginRight: SP.md,
    paddingTop: SP.sm,
    paddingBottom: SP.sm,
  },
  timelineTopDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: C.border,
    marginVertical: SP.xs,
    minHeight: 22,
  },
  timelineBottomDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.red,
    justifyContent: "center",
    alignItems: "center",
  },
  locationInputs: { flex: 1 },
  locationRow: {
    paddingVertical: 13,
  },
  pickupText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textDark,
  },
  locationDivider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: -SP.md,
    marginRight: -SP.lg,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  destinationInput: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textDark,
    paddingVertical: SP.xs,
  },
  addStopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SP.md,
  },
  recentList: { flex: 1, backgroundColor: C.white },
  recentListContent: {
    paddingHorizontal: SP.lg,
    paddingTop: SP.xl,
    paddingBottom: 120,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textFaint,
    letterSpacing: 1.2,
    marginBottom: SP.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SP.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  recentItemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SP.md,
  },
  recentItemIconGray: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SP.md,
  },
  recentItemText: { flex: 1 },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 3,
  },
  recentItemSubtitle: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
  },
  locateMapBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === "ios" ? 34 : 8,
  },
  locateMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SP.md,
    gap: SP.md,
  },
  locateMapIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  locateMapText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.violet,
  },

  // ─── RIDE OPTIONS SCREEN ───
  mapBackBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: SP.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  expandBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    right: SP.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  routeSummaryCard: {
    position: "absolute",
    top: "28%",
    left: SP.lg,
    right: SP.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: R.lg,
    paddingVertical: SP.md,
    paddingHorizontal: SP.lg,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  routeTimeline: {
    alignItems: "center",
    marginRight: SP.md,
  },
  routeTimelineTop: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeTimelineLine: {
    width: 2,
    height: 18,
    backgroundColor: C.border,
    marginVertical: 3,
  },
  routeTimelineBottom: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.red,
  },
  routeLocations: { flex: 1 },
  routePickupText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textDark,
    marginBottom: SP.sm,
  },
  routeDropText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textDark,
  },
  nowPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    paddingHorizontal: SP.sm,
    paddingVertical: 5,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border,
    marginLeft: SP.sm,
    gap: 3,
  },
  nowPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textDark,
  },
  distanceBadge: {
    position: "absolute",
    bottom: "43%",
    left: SP.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
    borderRadius: R.full,
    paddingHorizontal: SP.md,
    paddingVertical: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.violet + "20",
    zIndex: 10,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.violet,
  },
  ridePanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    paddingTop: SP.md,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    maxHeight: height * 0.58,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: "center",
    marginBottom: SP.sm,
  },
  surgeStripPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SP.xs,
    paddingVertical: 5,
    marginHorizontal: SP.lg,
    borderRadius: R.full,
    backgroundColor: C.warningBg,
    marginBottom: SP.sm,
    borderWidth: 1,
    borderColor: C.warning + "30",
  },
  surgeStripText: {
    fontSize: 11,
    fontWeight: "700",
  },
  vehicleList: {
    maxHeight: 185,
    paddingHorizontal: SP.lg,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SP.sm,
    paddingHorizontal: SP.sm,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    position: "relative",
  },
  vehicleRowSelected: {
    borderColor: C.violet,
    backgroundColor: C.primarySoft,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  vehicleTag: {
    position: "absolute",
    top: -8,
    left: SP.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SP.sm,
    paddingVertical: 2,
    borderRadius: R.sm,
    zIndex: 1,
  },
  vehicleTagText: {
    fontSize: 8,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.5,
  },
  vehicleIconWrap: {
    width: 66,
    height: 48,
    borderRadius: R.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SP.md,
    backgroundColor: C.surface,
  },
  vehicleImage: {
    width: 52,
    height: 30,
    resizeMode: "contain",
  },
  vehicleEta: {
    fontSize: 9,
    fontWeight: "700",
    color: C.success,
    marginTop: 2,
  },
  vehicleInfo: { flex: 1 },
  vehicleName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 1,
  },
  vehicleDesc: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: "500",
  },
  vehicleCapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 3,
  },
  vehicleCapText: {
    fontSize: 10,
    color: C.textFaint,
    fontWeight: "500",
  },
  vehicleRight: { alignItems: "flex-end", gap: SP.xs },
  vehiclePrice: {
    fontSize: 14,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.3,
  },
  surgeChip: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.warningBg,
    justifyContent: "center",
    alignItems: "center",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.borderMid,
  },
  radioSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleSeparator: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: SP.sm,
  },
  fareDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SP.lg,
    marginTop: SP.xs,
    paddingVertical: SP.sm,
    paddingHorizontal: SP.md,
    borderRadius: R.md,
    overflow: "hidden",
    gap: SP.sm,
    borderWidth: 1,
    borderColor: C.violet + "20",
  },
  fareDetailsIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  fareDetailsText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: C.violet,
  },
  paymentBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SP.lg,
    marginTop: SP.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: SP.sm,
    gap: SP.xs,
  },
  paymentOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SP.sm,
    paddingHorizontal: SP.sm,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: "transparent",
    gap: SP.xs,
  },
  paymentOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textMid,
  },
  recBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: R.sm,
  },
  recBadgeText: {
    fontSize: 7,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.3,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SP.lg,
    marginTop: SP.xs,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderRadius: R.md,
    overflow: "hidden",
    gap: SP.sm,
    borderWidth: 1,
    borderColor: C.warning + "25",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "500",
    color: C.warning,
    lineHeight: 16,
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.gold,
    paddingVertical: SP.md + 2,
    paddingHorizontal: SP.xl,
    borderRadius: R.full,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  bookButtonDisabled: { backgroundColor: C.borderMid, shadowOpacity: 0, opacity: 0.6 },
  bookButtonLeft: {},
  bookButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: 0.2,
  },
  bookButtonPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textDark,
    opacity: 0.7,
    marginTop: 1,
  },
  bookButtonIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: C.white,
    paddingVertical: SP.xxl,
    paddingHorizontal: SP.xxxl,
    borderRadius: R.xl,
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingText: {
    marginTop: SP.md,
    fontSize: 14,
    fontWeight: "600",
    color: C.textMid,
  },

  // ─── FARE MODAL ───
  modalOverlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: "flex-end",
  },
  fareModalContainer: {
    backgroundColor: C.white,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    maxHeight: height * 0.87,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  fareModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: "center",
    marginTop: SP.md,
    marginBottom: SP.sm,
  },
  fareModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  fareModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.3,
  },
  fareModalSub: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
    marginTop: 2,
  },
  fareModalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  fareTripStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SP.lg,
    marginTop: SP.lg,
    paddingVertical: SP.md,
    borderRadius: R.md,
  },
  fareTripStripItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
  },
  fareTripStripText: {
    fontSize: 13,
    fontWeight: "700",
  },
  fareTripStripDivider: {
    width: 1,
    height: 16,
    backgroundColor: C.borderMid,
    marginHorizontal: SP.lg,
  },
  fareSurgeBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SP.lg,
    marginTop: SP.md,
    gap: SP.sm,
  },
  surgeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SP.md,
    paddingVertical: 5,
    borderRadius: R.full,
    gap: SP.xs,
  },
  surgeBadgeText: { fontSize: 12, fontWeight: "700" },
  fareSection: {
    paddingHorizontal: SP.lg,
    paddingTop: SP.lg,
  },
  fareSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textFaint,
    letterSpacing: 1,
    marginBottom: SP.md,
    textTransform: "uppercase",
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SP.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  fareRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SP.sm,
  },
  fareRowLabel: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: "500",
    flexShrink: 1,
  },
  fareRowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textDark,
  },
  fareTotalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: SP.lg,
    marginTop: SP.lg,
    padding: SP.lg,
    borderRadius: R.lg,
    overflow: "hidden",
    position: "relative",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  fareTotalDecor: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  fareTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: C.white,
  },
  fareTotalSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginTop: 2,
  },
  fareTotalRight: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  fareTotalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -0.5,
  },
  fareTotalDecimal: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginLeft: 1,
  },
  earningsCard: {
    marginHorizontal: SP.lg,
    marginTop: SP.lg,
    padding: SP.lg,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    marginBottom: SP.md,
  },
  earningsIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  earningsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.2,
  },
  earningsBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: SP.md,
  },
  earningsLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SP.md,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: SP.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: C.textMid, fontWeight: "500" },
  cashNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: SP.lg,
    marginTop: SP.lg,
    padding: SP.md,
    borderRadius: R.md,
    overflow: "hidden",
    gap: SP.sm,
    borderWidth: 1,
    borderColor: C.warning + "30",
  },
  cashNoteText: {
    flex: 1,
    fontSize: 12,
    color: C.warning,
    fontWeight: "500",
    lineHeight: 17,
  },
  fareDisclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: SP.lg,
    marginTop: SP.lg,
    padding: SP.md,
    backgroundColor: C.surface,
    borderRadius: R.md,
    gap: SP.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  fareDisclaimerText: {
    flex: 1,
    fontSize: 11,
    color: C.textFaint,
    fontWeight: "500",
    lineHeight: 17,
  },
});