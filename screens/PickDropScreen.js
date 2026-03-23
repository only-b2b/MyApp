import Ionicons from "@expo/vector-icons/Ionicons";
import { getApp } from "@react-native-firebase/app"; // ✅ NEW
import { getAuth } from "@react-native-firebase/auth"; // ✅ NEW
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
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
import AddressSearch from "../components/AddressSearch";
import ScreenWrapper from "../components/ScreenWrapper";
import { API_BASE_URL } from "../config";
import { getDirections } from "../lib/directions";
import { safeFetchJSON } from "../utils/safeFetch";

const { width, height } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  primaryDark: "#008F5B",
  textDark: "#111111",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  background: "#F5F6F8",
  ctaBlack: "#111111",
  white: "#FFFFFF",
  lightGray: "#E5E7EB",
  cardBg: "#F9FAFB",
  divider: "#EEEEEE",
  red: "#E53935",
  redLight: "rgba(229, 57, 53, 0.1)",
  orange: "#F59E0B",
  orangeLight: "rgba(245, 158, 11, 0.1)",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  shadow: "#000000",
  success: "#10B981",
  successBg: "#ECFDF5",
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

const FONTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ==================== PRICING CONFIGURATION ====================
const PRICING_CONFIG = {
  // Night hours (10 PM - 6 AM)
  nightStartHour: 22,
  nightEndHour: 6,
  nightMultiplier: 1.25, // 25% extra at night

  // Peak hours
  morningPeakStart: 8,
  morningPeakEnd: 10,
  eveningPeakStart: 17,
  eveningPeakEnd: 20,
  peakMultiplier: 1.15, // 15% extra during peak

  // Traffic multipliers
  trafficMultipliers: {
    low: 1.0,
    moderate: 1.1,
    heavy: 1.25,
    severe: 1.4,
  },

  // Per minute rate (in addition to per km)
  perMinuteRate: 1.5,

  // Minimum fare
  minimumFare: 50,

  // Waiting charge per minute
  waitingChargePerMin: 2,

  // Booking fee
  bookingFee: 10,

  // GST percentage
  gstPercentage: 5,
};

// ==================== VEHICLES DATA WITH PRICING ====================
const VEHICLES = [
  {
    id: "book_any",
    name: "Book Any",
    description: "Fastest available ride",
    time: "3 min",
    image: require("../assets/icons/sedan.png"),
    baseFare: 35,
    perKm: 12,
    perMin: 1.5,
    highlighted: true,
    capacity: 4,
  },
  {
    id: "auto",
    name: "Auto",
    description: "No bargaining, doorstep pickup",
    time: "5 min",
    image: require("../assets/icons/sedan.png"),
    baseFare: 25,
    perKm: 10,
    perMin: 1.0,
    capacity: 3,
  },
  {
    id: "mini_nonac",
    name: "Mini Non AC",
    description: "Affordable comfy rides",
    time: "6 min",
    image: require("../assets/icons/sedan.png"),
    baseFare: 30,
    perKm: 11,
    perMin: 1.2,
    capacity: 4,
  },
  {
    id: "mini",
    name: "Mini",
    description: "Comfy & quick, AC rides",
    time: "4 min",
    image: require("../assets/icons/sedan.png"),
    baseFare: 40,
    perKm: 13,
    perMin: 1.5,
    capacity: 4,
  },
  {
    id: "prime",
    name: "Prime Sedan",
    description: "Top-rated drivers, premium cars",
    time: "7 min",
    image: require("../assets/icons/sedan.png"),
    baseFare: 60,
    perKm: 16,
    perMin: 2.0,
    capacity: 4,
  },
];

// ==================== RECENT LOCATIONS ====================
const RECENT_LOCATIONS = [
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

// ==================== SERVICES ====================
const SERVICES = [
  {
    id: "outstation",
    name: "Outstation",
    subtitle: "Best drivers",
    icon: "car-sport-outline",
    color: COLORS.blue,
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  {
    id: "rentals",
    name: "Rentals",
    subtitle: "Multiple stops",
    icon: "time-outline",
    color: COLORS.purple,
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  {
    id: "bike",
    name: "Bike",
    subtitle: "For single riders",
    icon: "bicycle-outline",
    color: COLORS.orange,
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
];

// ==================== QUICK BOOK VEHICLES ====================
const QUICK_VEHICLES = [
  {
    id: "book_any",
    name: "Book Any",
    price: "₹199–₹231",
    image: require("../assets/icons/sedan.png"),
    highlighted: true,
  },
  {
    id: "auto",
    name: "Auto",
    price: "₹184",
    image: require("../assets/icons/sedan.png"),
  },
  {
    id: "mini_nonac",
    name: "Mini Non AC",
    price: "₹182",
    image: require("../assets/icons/sedan.png"),
  },
];

// ==================== MAP STYLE ====================
const mapStyle = [
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "simplified" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e8e8e8" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e4f4" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#f0f0f0" }] },
];

// ==================== FARE CALCULATION UTILITIES ====================

/**
 * Check if current time is night time (10 PM - 6 AM)
 */
const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= PRICING_CONFIG.nightStartHour || hour < PRICING_CONFIG.nightEndHour;
};

/**
 * Check if current time is peak hour
 */
const isPeakHour = () => {
  const hour = new Date().getHours();
  const isMorningPeak = hour >= PRICING_CONFIG.morningPeakStart && hour < PRICING_CONFIG.morningPeakEnd;
  const isEveningPeak = hour >= PRICING_CONFIG.eveningPeakStart && hour < PRICING_CONFIG.eveningPeakEnd;
  return isMorningPeak || isEveningPeak;
};

/**
 * Estimate traffic level based on time and day
 */
const estimateTrafficLevel = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday

  // Weekend - generally less traffic
  if (day === 0 || day === 6) {
    if (hour >= 10 && hour <= 20) return "moderate";
    return "low";
  }

  // Weekday traffic patterns
  if (hour >= 8 && hour <= 10) return "heavy"; // Morning rush
  if (hour >= 17 && hour <= 20) return "heavy"; // Evening rush
  if (hour >= 12 && hour <= 14) return "moderate"; // Lunch time
  if (hour >= 22 || hour < 6) return "low"; // Night
  return "moderate";
};

/**
 * Get traffic multiplier
 */
const getTrafficMultiplier = (trafficLevel) => {
  return PRICING_CONFIG.trafficMultipliers[trafficLevel] || 1.0;
};

/**
 * Calculate complete fare breakdown
 */
const calculateFareBreakdown = (vehicle, distanceKm, durationMinutes) => {
  if (!vehicle || !distanceKm) return null;

  const isNight = isNightTime();
  const isPeak = isPeakHour();
  const trafficLevel = estimateTrafficLevel();
  const trafficMultiplier = getTrafficMultiplier(trafficLevel);

  // Base calculations
  const baseFare = vehicle.baseFare;
  const distanceFare = distanceKm * vehicle.perKm;
  const timeFare = durationMinutes * (vehicle.perMin || PRICING_CONFIG.perMinuteRate);
  
  // Subtotal before multipliers
  let subtotal = baseFare + distanceFare + timeFare;

  // Apply night charge
  const nightCharge = isNight ? subtotal * (PRICING_CONFIG.nightMultiplier - 1) : 0;

  // Apply peak hour charge
  const peakCharge = isPeak && !isNight ? subtotal * (PRICING_CONFIG.peakMultiplier - 1) : 0;

  // Apply traffic surge
  const trafficSurge = (trafficMultiplier - 1) * subtotal;

  // Calculate total before fees
  const fareBeforeFees = subtotal + nightCharge + peakCharge + trafficSurge;

  // Apply minimum fare
  const adjustedFare = Math.max(fareBeforeFees, PRICING_CONFIG.minimumFare);

  // Add booking fee
  const bookingFee = PRICING_CONFIG.bookingFee;

  // Calculate GST
  const gst = (adjustedFare * PRICING_CONFIG.gstPercentage) / 100;

  // Total fare
  const totalFare = Math.round(adjustedFare + bookingFee + gst);

  // Calculate price range for "Book Any"
  const minFare = Math.round(totalFare * 0.9);
  const maxFare = Math.round(totalFare * 1.1);

  return {
    baseFare: Math.round(baseFare),
    distanceFare: Math.round(distanceFare),
    timeFare: Math.round(timeFare),
    nightCharge: Math.round(nightCharge),
    peakCharge: Math.round(peakCharge),
    trafficSurge: Math.round(trafficSurge),
    bookingFee,
    gst: Math.round(gst),
    subtotal: Math.round(subtotal),
    totalFare,
    minFare,
    maxFare,
    priceRange: `₹${minFare}–₹${maxFare}`,
    isNight,
    isPeak,
    trafficLevel,
    trafficMultiplier,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes: Math.round(durationMinutes),
  };
};

/**
 * Get time period label
 */
const getTimePeriodLabel = () => {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  return "Evening";
};

/**
 * Get traffic level color
 */
const getTrafficColor = (level) => {
  switch (level) {
    case "low": return COLORS.success;
    case "moderate": return COLORS.orange;
    case "heavy": return COLORS.red;
    case "severe": return "#B91C1C";
    default: return COLORS.textSecondary;
  }
};

// ==================== MAIN COMPONENT ====================
export default function PickDropScreen({ navigation }) {
  // ✅ FIXED: Updated Firebase API
  const app = getApp();
  const auth = getAuth(app);
  const user = auth.currentUser;
  
  const mapRef = useRef(null);

  // Screen state: "home" | "search" | "ride_options"
  const [currentScreen, setCurrentScreen] = useState("home");

  // Location states
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [region, setRegion] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceText, setDistanceText] = useState(null);
  const [durationText, setDurationText] = useState(null);

  // Selection states
  const [selectedVehicle, setSelectedVehicle] = useState("book_any");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [savedPlaces, setSavedPlaces] = useState([]);

  // UI states
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ==================== FETCH CURRENT LOCATION ====================
  const fetchCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coord = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };

      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: coord.lat,
        longitude: coord.lng,
      });

      let fullAddress = "Current Location";

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];

        fullAddress = [
          addr.name,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.postalCode,
        ]
          .filter(Boolean)
          .join(", ");
      }

      setPickup({
        description: fullAddress,
        location: coord,
      });

      setRegion({
        latitude: coord.lat,
        longitude: coord.lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: coord.lat,
          longitude: coord.lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        });
      }
    } catch (e) {
      console.log("Location error:", e);
      const defaultCoord = { lat: 18.5204, lng: 73.8567 };
      setPickup({
        description: "Current Location",
        location: defaultCoord,
      });
      setRegion({
        latitude: defaultCoord.lat,
        longitude: defaultCoord.lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
    }
  }, []);

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  // ==================== ROUTE CALCULATION ====================
  useEffect(() => {
    const calculateRoute = async () => {
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
                  top: 20,
                  bottom: height * 0.65,
                  left: 50,
                  right: 50,
                },
                animated: true,
              });
            }
          }, 500);
        }
      } catch (error) {
        console.log("Route calculation error:", error);
      }
      setLoadingRoute(false);
    };

    calculateRoute();
  }, [pickup, drop]);

  // ==================== LOAD SAVED PLACES ====================
  useEffect(() => {
    if (!user) return;

    // In useEffect:
    const loadSavedPlaces = async () => {
      const { success, data } = await safeFetchJSON(
        `${API_BASE_URL}/users/${user.uid}/saved-places`
      );
      
      if (success && Array.isArray(data)) {
        setSavedPlaces(data);
      } else {
        setSavedPlaces([]);
      }
    };

    loadSavedPlaces();
  }, [user]);

  // ==================== BACK HANDLER ====================
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => backHandler.remove();
  }, [currentScreen]);

  // ==================== COMPUTED VALUES ====================
  const distanceKm = useMemo(() => {
    if (!distanceText) return 0;
    const match = distanceText.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }, [distanceText]);

  const durationMinutes = useMemo(() => {
    if (!durationText) return 0;
    // Parse duration like "25 mins" or "1 hr 15 mins"
    let minutes = 0;
    const hourMatch = durationText.match(/(\d+)\s*hr/);
    const minMatch = durationText.match(/(\d+)\s*min/);
    if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) minutes += parseInt(minMatch[1]);
    return minutes || 15; // Default 15 minutes
  }, [durationText]);

  const selectedVehicleData = useMemo(() => {
    return VEHICLES.find((v) => v.id === selectedVehicle);
  }, [selectedVehicle]);

  const fareBreakdown = useMemo(() => {
    if (!selectedVehicleData || !distanceKm) return null;
    return calculateFareBreakdown(selectedVehicleData, distanceKm, durationMinutes);
  }, [selectedVehicleData, distanceKm, durationMinutes]);

  const allVehicleFares = useMemo(() => {
    if (!distanceKm) return {};
    const fares = {};
    VEHICLES.forEach((vehicle) => {
      fares[vehicle.id] = calculateFareBreakdown(vehicle, distanceKm, durationMinutes);
    });
    return fares;
  }, [distanceKm, durationMinutes]);

  // ==================== HANDLERS ====================
  const handleBackPress = () => {
    if (showFareDetails) {
      setShowFareDetails(false);
      return true;
    }
    if (currentScreen === "ride_options") {
      setCurrentScreen("search");
      setDrop(null);
      setRouteCoords([]);
      setDistanceText(null);
      setDurationText(null);
      return true;
    }
    if (currentScreen === "search") {
      setCurrentScreen("home");
      return true;
    }
    navigation.goBack();
    return true;
  };

  const handleDestinationSelect = (destination) => {
    setDrop({
      description: destination.description || destination.title,
      location: destination.location,
    });
    setCurrentScreen("ride_options");
  };

  const handleQuickBook = (locationData) => {
    setDrop({
      description: locationData.title,
      location: locationData.location,
    });
    setCurrentScreen("ride_options");
  };

  const handleRecentLocationPress = (location) => {
    handleDestinationSelect({
      description: location.title,
      location: location.location,
    });
  };

  const confirmBooking = async () => {
  if (!drop || !user || !fareBreakdown) {
    alert("Please select destination");
    return;
  }

  setBookingInProgress(true);

  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: user.uid,
        service_type: "pickdrop",
        
        // Vehicle info
        vehicle: selectedVehicle,
        
        // Route info
        distance: distanceText,
        duration: durationText,
        price: fareBreakdown.totalFare,
        
        // Location coordinates
        pickup_lat: pickup.location.lat,
        pickup_lng: pickup.location.lng,
        drop_lat: drop.location.lat,
        drop_lng: drop.location.lng,
        
        // ✅ FIX: Use 'pickup' and 'drop' instead of 'pickup_address' and 'drop_address'
        pickup: pickup.description,
        drop: drop.description,
        
        // Payment
        payment: paymentMethod,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Create order failed:", errorData);
      throw new Error("Failed to create order");
    }

    const { id } = await res.json();

    // Send request to technicians
    await fetch(`${API_BASE_URL}/orders/${id}/request`, {
      method: "POST",
    });

    // Navigate to finding driver screen
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
      totalFare: fareBreakdown.totalFare,
      baseFare: fareBreakdown.baseFare,
      isNight: fareBreakdown.isNight,
      isPeak: fareBreakdown.isPeak,
      trafficLevel: fareBreakdown.trafficLevel,
      paymentMethod: paymentMethod,
    });
    
  } catch (e) {
    console.log("Booking error:", e);
    alert("Failed to place order. Please try again.");
  } finally {
    setBookingInProgress(false);
  }
};

  // ==================== FARE DETAILS MODAL ====================
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
            {/* Header */}
            <View style={styles.fareModalHeader}>
              <Text style={styles.fareModalTitle}>Fare Breakdown</Text>
              <TouchableOpacity
                style={styles.fareModalClose}
                onPress={() => setShowFareDetails(false)}
              >
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Vehicle Info */}
              <View style={styles.fareVehicleInfo}>
                <Image source={selectedVehicleData.image} style={styles.fareVehicleImage} />
                <View style={styles.fareVehicleDetails}>
                  <Text style={styles.fareVehicleName}>{selectedVehicleData.name}</Text>
                  <Text style={styles.fareVehicleDesc}>{selectedVehicleData.description}</Text>
                </View>
              </View>

              {/* Trip Info */}
              <View style={styles.fareTripInfo}>
                <View style={styles.fareTripItem}>
                  <Ionicons name="navigate" size={16} color={COLORS.primary} />
                  <Text style={styles.fareTripText}>{fareBreakdown.distanceKm} km</Text>
                </View>
                <View style={styles.fareTripDivider} />
                <View style={styles.fareTripItem}>
                  <Ionicons name="time" size={16} color={COLORS.primary} />
                  <Text style={styles.fareTripText}>{fareBreakdown.durationMinutes} min</Text>
                </View>
                <View style={styles.fareTripDivider} />
                <View style={styles.fareTripItem}>
                  <Ionicons name="car" size={16} color={getTrafficColor(fareBreakdown.trafficLevel)} />
                  <Text style={[styles.fareTripText, { color: getTrafficColor(fareBreakdown.trafficLevel) }]}>
                    {fareBreakdown.trafficLevel.charAt(0).toUpperCase() + fareBreakdown.trafficLevel.slice(1)} Traffic
                  </Text>
                </View>
              </View>

              {/* Time Indicators */}
              <View style={styles.fareTimeIndicators}>
                {fareBreakdown.isNight && (
                  <View style={[styles.fareIndicator, { backgroundColor: COLORS.primaryLight }]}>
                    <Ionicons name="moon" size={14} color={COLORS.primary} />
                    <Text style={styles.fareIndicatorText}>Night Fare Applied</Text>
                  </View>
                )}
                {fareBreakdown.isPeak && (
                  <View style={[styles.fareIndicator, { backgroundColor: COLORS.orangeLight }]}>
                    <Ionicons name="trending-up" size={14} color={COLORS.orange} />
                    <Text style={[styles.fareIndicatorText, { color: COLORS.orange }]}>Peak Hour</Text>
                  </View>
                )}
              </View>

              {/* Breakdown */}
              <View style={styles.fareBreakdownSection}>
                <Text style={styles.fareBreakdownTitle}>Fare Calculation</Text>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Base Fare</Text>
                  <Text style={styles.fareValue}>₹{fareBreakdown.baseFare}</Text>
                </View>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>
                    Distance ({fareBreakdown.distanceKm} km × ₹{selectedVehicleData.perKm})
                  </Text>
                  <Text style={styles.fareValue}>₹{fareBreakdown.distanceFare}</Text>
                </View>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>
                    Time ({fareBreakdown.durationMinutes} min × ₹{selectedVehicleData.perMin || PRICING_CONFIG.perMinuteRate})
                  </Text>
                  <Text style={styles.fareValue}>₹{fareBreakdown.timeFare}</Text>
                </View>

                {fareBreakdown.nightCharge > 0 && (
                  <View style={styles.fareRow}>
                    <View style={styles.fareLabelRow}>
                      <Ionicons name="moon-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.fareLabel}> Night Charge (25%)</Text>
                    </View>
                    <Text style={styles.fareValue}>+₹{fareBreakdown.nightCharge}</Text>
                  </View>
                )}

                {fareBreakdown.peakCharge > 0 && (
                  <View style={styles.fareRow}>
                    <View style={styles.fareLabelRow}>
                      <Ionicons name="trending-up-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.fareLabel}> Peak Hour (15%)</Text>
                    </View>
                    <Text style={styles.fareValue}>+₹{fareBreakdown.peakCharge}</Text>
                  </View>
                )}

                {fareBreakdown.trafficSurge > 0 && (
                  <View style={styles.fareRow}>
                    <View style={styles.fareLabelRow}>
                      <Ionicons name="car-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.fareLabel}> Traffic Surge</Text>
                    </View>
                    <Text style={styles.fareValue}>+₹{fareBreakdown.trafficSurge}</Text>
                  </View>
                )}

                <View style={styles.fareSubtotalRow}>
                  <Text style={styles.fareSubtotalLabel}>Subtotal</Text>
                  <Text style={styles.fareSubtotalValue}>₹{fareBreakdown.subtotal + fareBreakdown.nightCharge + fareBreakdown.peakCharge + fareBreakdown.trafficSurge}</Text>
                </View>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Booking Fee</Text>
                  <Text style={styles.fareValue}>₹{fareBreakdown.bookingFee}</Text>
                </View>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>GST ({PRICING_CONFIG.gstPercentage}%)</Text>
                  <Text style={styles.fareValue}>₹{fareBreakdown.gst}</Text>
                </View>

                <View style={styles.fareTotalRow}>
                  <Text style={styles.fareTotalLabel}>Total Fare</Text>
                  <Text style={styles.fareTotalValue}>₹{fareBreakdown.totalFare}</Text>
                </View>
              </View>

              {/* Note */}
              <View style={styles.fareNote}>
                <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
                <Text style={styles.fareNoteText}>
                  Final fare may vary based on actual route, waiting time, and traffic conditions.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ========================================================
  // SCREEN 1: HOME SCREEN
  // ========================================================
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
          customMapStyle={mapStyle}
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
              <View style={styles.currentLocationMarker}>
                <View style={styles.currentLocationPulse} />
                <View style={styles.currentLocationDot} />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Top Bar */}
      <View style={styles.homeTopBar}>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.8}>
          <Ionicons name="menu" size={22} color={COLORS.textDark} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeSearchBar}
          onPress={() => setCurrentScreen("search")}
          activeOpacity={0.95}
        >
          <View style={styles.searchGreenDot} />
          <Text style={styles.homeSearchText} numberOfLines={1}>
            {pickup?.description || "Set pickup location"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.heartButton} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.homeBottomSheet}>
        <View style={styles.sheetHandle} />

        {/* Services */}
        <View style={styles.sectionContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesRow}
          >
            {SERVICES.map((service) => (
              <TouchableOpacity key={service.id} style={styles.serviceCard} activeOpacity={0.85}>
                <View style={styles.serviceRow}>
                  <View style={[styles.serviceIconBg, { backgroundColor: service.bgColor }]}>
                    <Ionicons name={service.icon} size={20} color={service.color} />
                  </View>
                  <View style={styles.serviceTextWrap}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Destination */}
        <TouchableOpacity
          style={styles.searchDestinationBar}
          onPress={() => setCurrentScreen("search")}
          activeOpacity={0.9}
        >
          <View style={styles.searchIconCircle}>
            <Ionicons name="search" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.searchDestinationText}>Search Destination</Text>
        </TouchableOpacity>

        {/* Quick Ride */}
        <View style={styles.quickRideCard}>
          <TouchableOpacity
            style={styles.quickRideHeader}
            activeOpacity={0.8}
            onPress={() => handleQuickBook(RECENT_LOCATIONS[0])}
          >
            <View style={styles.quickRideInfo}>
              <Text style={styles.quickRideTitle} numberOfLines={1}>
                Samajkalyan Hostel Vishrantwadi
              </Text>
              <Text style={styles.quickRideSubtitle}>Instant one click booking</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRideVehicles}
          >
            {QUICK_VEHICLES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[styles.quickVehicleCard, vehicle.highlighted && styles.quickVehicleHighlighted]}
                onPress={() => {
                  setSelectedVehicle(vehicle.id);
                  handleQuickBook(RECENT_LOCATIONS[0]);
                }}
                activeOpacity={0.85}
              >
                <Image source={vehicle.image} style={styles.quickVehicleImage} />
                <Text style={styles.quickVehicleName}>{vehicle.name}</Text>
                <Text style={styles.quickVehiclePrice}>{vehicle.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Promo Banner */}
        <TouchableOpacity style={styles.promoBanner} activeOpacity={0.95}>
          <View style={styles.promoContent}>
            <Text style={styles.promoSmallText}>OLA DRIVERS EARN</Text>
            <Text style={styles.promoBigText}>100% OF THE FARE</Text>
          </View>
          <View style={styles.promoImageContainer}>
            <Ionicons name="car-sport" size={52} color="rgba(255,255,255,0.95)" />
            <View style={styles.promoMoneyIcon}>
              <Ionicons name="cash-outline" size={22} color="rgba(255,255,255,0.85)" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ========================================================
  // SCREEN 2: DESTINATION SEARCH
  // ========================================================
  const renderSearchScreen = () => (
    <View style={styles.searchContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Top Bar */}
      <View style={styles.searchTopBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentScreen("home")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.searchScreenTitle}>Destination</Text>
        <TouchableOpacity style={styles.profilePill} activeOpacity={0.8}>
          <Ionicons name="person" size={14} color={COLORS.textDark} />
          <Text style={styles.profilePillText}>Myself</Text>
        </TouchableOpacity>
      </View>

      {/* Location Card */}
      <View style={styles.locationCard}>
        <View style={styles.timeline}>
          <View style={styles.timelineGreenDot} />
          <View style={styles.timelineLine} />
          <View style={styles.timelineRedDot}>
            <Ionicons name="caret-down" size={8} color={COLORS.white} />
          </View>
        </View>

        <View style={styles.locationInputs}>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.8}>
            <Text style={styles.pickupText} numberOfLines={1}>
              {pickup?.description || "Set pickup location"}
            </Text>
          </TouchableOpacity>

          <View style={styles.locationDivider} />

          <View style={styles.destinationRow}>
            <View style={styles.destinationInputWrapper}>
              <AddressSearch
                placeholder="Enter destination"
                onSelect={handleDestinationSelect}
                inputStyle={styles.destinationInput}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <TouchableOpacity style={styles.addStopButton} activeOpacity={0.7}>
              <Ionicons name="add" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recent Locations */}
      <ScrollView
        style={styles.recentList}
        contentContainerStyle={styles.recentListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.recentSectionTitle}>RECENT</Text>

        {RECENT_LOCATIONS.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.recentItem}
            activeOpacity={0.7}
            onPress={() => handleRecentLocationPress(location)}
          >
            <View style={styles.recentIcon}>
              <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
            </View>
            <View style={styles.recentTextWrap}>
              <Text style={styles.recentTitle} numberOfLines={1}>{location.title}</Text>
              <Text style={styles.recentSubtitle} numberOfLines={1}>{location.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {savedPlaces.length > 0 && (
          <>
            <Text style={[styles.recentSectionTitle, { marginTop: SPACING.xxl }]}>SAVED PLACES</Text>
            {savedPlaces.map((item) => (
              <TouchableOpacity
                key={item.id || item._id}
                style={styles.recentItem}
                activeOpacity={0.7}
                onPress={() =>
                  handleDestinationSelect({
                    description: item.address,
                    location: item.location,
                  })
                }
              >
                <View style={[styles.savedPlaceIcon, { backgroundColor: (item.color || COLORS.primary) + "20" }]}>
                  <Ionicons name={item.icon || "location"} size={18} color={item.color || COLORS.primary} />
                </View>
                <View style={styles.recentTextWrap}>
                  <Text style={styles.recentTitle}>{item.label}</Text>
                  <Text style={styles.recentSubtitle} numberOfLines={1}>{item.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.locateMapButtonContainer}>
        <TouchableOpacity style={styles.locateMapButton} activeOpacity={0.9}>
          <Ionicons name="location" size={18} color={COLORS.primary} />
          <Text style={styles.locateMapText}>Locate on Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ========================================================
  // SCREEN 3: RIDE OPTIONS
  // ========================================================
  const renderRideOptionsScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      {region && (
        <MapView
          ref={mapRef}
          style={styles.rideMap}
          region={region}
          showsUserLocation={false}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={true}
        >
          {pickup && (
            <Marker
              coordinate={{ latitude: pickup.location.lat, longitude: pickup.location.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.pickupMarker}>
                <View style={styles.pickupMarkerInner} />
              </View>
            </Marker>
          )}

          {drop && (
            <Marker
              coordinate={{ latitude: drop.location.lat, longitude: drop.location.lng }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.dropMarkerContainer}>
                <Ionicons name="location-sharp" size={36} color={COLORS.red} />
              </View>
            </Marker>
          )}

          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeColor={COLORS.primary} strokeWidth={4} />
          )}
        </MapView>
      )}

      {/* Back Button */}
      <TouchableOpacity
        style={styles.mapBackButton}
        onPress={() => setCurrentScreen("search")}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
      </TouchableOpacity>

      {/* Expand Button */}
      <TouchableOpacity style={styles.expandButton} activeOpacity={0.85}>
        <Ionicons name="expand-outline" size={18} color={COLORS.textDark} />
      </TouchableOpacity>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTimeline}>
          <View style={styles.summaryGreenDot} />
          <View style={styles.summaryLine} />
          <View style={styles.summaryRedDot} />
        </View>

        <View style={styles.summaryLocations}>
          <Text style={styles.summaryPickupText} numberOfLines={1}>{pickup?.description || "Pickup"}</Text>
          <Text style={styles.summaryDropText} numberOfLines={1}>{drop?.description || "Drop"}</Text>
        </View>

        <TouchableOpacity style={styles.nowPill} activeOpacity={0.8}>
          <Text style={styles.nowPillText}>Now</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      {/* Ride Panel */}
      <View style={styles.ridePanel}>
        <View style={styles.panelHandle} />

        {/* Trip Info Bar */}
        {fareBreakdown && (
          <View style={styles.tripInfoBar}>
            <View style={styles.tripInfoItem}>
              <Ionicons name="navigate" size={14} color={COLORS.primary} />
              <Text style={styles.tripInfoText}>{fareBreakdown.distanceKm} km</Text>
            </View>
            <View style={styles.tripInfoDivider} />
            <View style={styles.tripInfoItem}>
              <Ionicons name="time" size={14} color={COLORS.primary} />
              <Text style={styles.tripInfoText}>{fareBreakdown.durationMinutes} min</Text>
            </View>
            <View style={styles.tripInfoDivider} />
            <View style={styles.tripInfoItem}>
              <Ionicons name="car" size={14} color={getTrafficColor(fareBreakdown.trafficLevel)} />
              <Text style={[styles.tripInfoText, { color: getTrafficColor(fareBreakdown.trafficLevel) }]}>
                {fareBreakdown.trafficLevel.charAt(0).toUpperCase() + fareBreakdown.trafficLevel.slice(1)}
              </Text>
            </View>
            {(fareBreakdown.isNight || fareBreakdown.isPeak) && (
              <>
                <View style={styles.tripInfoDivider} />
                <View style={styles.tripInfoItem}>
                  <Ionicons
                    name={fareBreakdown.isNight ? "moon" : "trending-up"}
                    size={14}
                    color={fareBreakdown.isNight ? COLORS.primary : COLORS.orange}
                  />
                  <Text style={[styles.tripInfoText, { color: fareBreakdown.isNight ? COLORS.primary : COLORS.orange }]}>
                    {fareBreakdown.isNight ? "Night" : "Peak"}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Ride List */}
        <FlatList
          data={VEHICLES}
          keyExtractor={(item) => item.id}
          style={styles.rideList}
          showsVerticalScrollIndicator={false}
          bounces={false}
          ItemSeparatorComponent={() => <View style={styles.rideSeparator} />}
          renderItem={({ item }) => {
            const isSelected = selectedVehicle === item.id;
            const vehicleFare = allVehicleFares[item.id];

            return (
              <TouchableOpacity
                style={[
                  styles.rideRow,
                  isSelected && styles.rideRowSelected,
                  item.highlighted && !isSelected && styles.rideRowHighlighted,
                ]}
                onPress={() => setSelectedVehicle(item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.rideLeft}>
                  <Image source={item.image} style={styles.rideImage} />
                  <Text style={styles.rideEta}>{item.time}</Text>
                </View>

                <View style={styles.rideCenter}>
                  <Text style={[styles.rideName, isSelected && styles.rideNameSelected]}>{item.name}</Text>
                  <Text style={styles.rideDescription} numberOfLines={1}>{item.description}</Text>
                </View>

                <View style={styles.rideRight}>
                  {vehicleFare ? (
                    <>
                      {item.id === "book_any" ? (
                        <Text style={[styles.ridePrice, isSelected && styles.ridePriceSelected]}>
                          {vehicleFare.priceRange}
                        </Text>
                      ) : (
                        <Text style={[styles.ridePrice, isSelected && styles.ridePriceSelected]}>
                          ₹{vehicleFare.totalFare}
                        </Text>
                      )}
                      {(vehicleFare.nightCharge > 0 || vehicleFare.peakCharge > 0 || vehicleFare.trafficSurge > 0) && (
                        <View style={styles.surgeIndicator}>
                          <Ionicons name="trending-up" size={10} color={COLORS.orange} />
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.ridePrice}>--</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Fare Details Button */}
        {fareBreakdown && (
          <TouchableOpacity
            style={styles.fareDetailsBtn}
            onPress={() => setShowFareDetails(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
            <Text style={styles.fareDetailsBtnText}>View Fare Breakdown</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Payment Bar */}
        <View style={styles.paymentBar}>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "cash" && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod("cash")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={paymentMethod === "cash" ? COLORS.primary : COLORS.textDark}
            />
            <Text style={[styles.paymentOptionText, paymentMethod === "cash" && styles.paymentOptionTextActive]}>
              Cash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "upi" && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod("upi")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={16}
              color={paymentMethod === "upi" ? COLORS.primary : COLORS.textDark}
            />
            <Text style={[styles.paymentOptionText, paymentMethod === "upi" && styles.paymentOptionTextActive]}>
              UPI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} activeOpacity={0.8}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.textDark} />
            <Text style={styles.paymentOptionText}>Coupon</Text>
          </TouchableOpacity>
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, bookingInProgress && styles.bookButtonDisabled]}
          onPress={confirmBooking}
          activeOpacity={0.9}
          disabled={bookingInProgress}
        >
          {bookingInProgress ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.bookButtonText}>
                Book {selectedVehicleData?.name || "Ride"}
                {fareBreakdown && ` • ₹${fareBreakdown.totalFare}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {loadingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Calculating fare...</Text>
          </View>
        </View>
      )}

      {/* Fare Details Modal */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ========== HOME SCREEN ==========
  currentLocationMarker: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  currentLocationPulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
  },
  currentLocationDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  homeTopBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  homeSearchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: RADIUS.xxl,
    ...SHADOWS.medium,
  },
  searchGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  homeSearchText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: FONTS.medium,
  },
  heartButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  homeBottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    ...SHADOWS.large,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  sectionContainer: {
    marginBottom: SPACING.xs,
  },
  servicesRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  serviceCard: {
    width: 160,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: SPACING.md,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
  },
  serviceSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchDestinationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  searchIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
    ...SHADOWS.small,
  },
  searchDestinationText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: FONTS.medium,
  },
  quickRideCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  quickRideHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  quickRideInfo: {
    flex: 1,
  },
  quickRideTitle: {
    fontSize: 14,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
  },
  quickRideSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quickRideVehicles: {
    paddingRight: SPACING.sm,
  },
  quickVehicleCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginRight: 10,
    alignItems: "center",
    width: 92,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
  },
  quickVehicleHighlighted: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  quickVehicleImage: {
    width: 52,
    height: 30,
    resizeMode: "contain",
    marginBottom: 6,
  },
  quickVehicleName: {
    fontSize: 11,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
    textAlign: "center",
  },
  quickVehiclePrice: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    overflow: "hidden",
  },
  promoContent: {
    flex: 1,
  },
  promoSmallText: {
    fontSize: 11,
    fontWeight: FONTS.semibold,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.8,
  },
  promoBigText: {
    fontSize: 20,
    fontWeight: FONTS.extrabold,
    color: COLORS.white,
    marginTop: 4,
  },
  promoImageContainer: {
    position: "relative",
    marginLeft: SPACING.lg,
  },
  promoMoneyIcon: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 4,
  },

  // ========== SEARCH SCREEN ==========
  searchContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 54 : 10,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -SPACING.sm,
  },
  searchScreenTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
    textAlign: "center",
    marginRight: 40,
  },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  profilePillText: {
    fontSize: 12,
    color: COLORS.textDark,
    marginLeft: 6,
    fontWeight: FONTS.medium,
  },
  locationCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  timeline: {
    alignItems: "center",
    marginRight: 14,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  timelineGreenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: SPACING.xs,
    minHeight: 24,
  },
  timelineRedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.red,
    justifyContent: "center",
    alignItems: "center",
  },
  locationInputs: {
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  pickupText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: FONTS.medium,
  },
  locationDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginLeft: -14,
    marginRight: -SPACING.lg,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  destinationInputWrapper: {
    flex: 1,
  },
  destinationInput: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: FONTS.medium,
    paddingVertical: SPACING.xs,
  },
  addStopButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.md,
  },
  recentList: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  recentListContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: 120,
  },
  recentSectionTitle: {
    fontSize: 11,
    fontWeight: FONTS.semibold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  savedPlaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  recentTextWrap: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
    marginBottom: 3,
  },
  recentSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  locateMapButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingBottom: Platform.OS === "ios" ? 34 : 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  locateMapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  locateMapText: {
    fontSize: 15,
    fontWeight: FONTS.semibold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },

  // ========== RIDE OPTIONS SCREEN ==========
  rideMap: {
    ...StyleSheet.absoluteFillObject,
  },
  mapBackButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: SPACING.lg,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  expandButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    right: SPACING.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  pickupMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  dropMarkerContainer: {
    alignItems: "center",
  },
  summaryCard: {
    position: "absolute",
    top: height * 0.33,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.large,
    zIndex: 10,
  },
  summaryTimeline: {
    alignItems: "center",
    marginRight: SPACING.md,
  },
  summaryGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  summaryLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.lightGray,
    marginVertical: 3,
  },
  summaryRedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  summaryLocations: {
    flex: 1,
  },
  summaryPickupText: {
    fontSize: 13,
    fontWeight: FONTS.medium,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  summaryDropText: {
    fontSize: 13,
    fontWeight: FONTS.medium,
    color: COLORS.textDark,
  },
  nowPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginLeft: SPACING.sm,
  },
  nowPillText: {
    fontSize: 12,
    fontWeight: FONTS.medium,
    color: COLORS.textDark,
    marginRight: SPACING.xs,
  },
  ridePanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: height * 0.58,
    ...SHADOWS.large,
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    alignSelf: "center",
    marginBottom: 10,
  },
  tripInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  tripInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripInfoText: {
    fontSize: 12,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
    marginLeft: SPACING.xs,
  },
  tripInfoDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: SPACING.md,
  },
  rideList: {
    maxHeight: 180,
    paddingHorizontal: SPACING.lg,
  },
  rideRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    marginVertical: 2,
  },
  rideRowSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  rideRowHighlighted: {
    backgroundColor: COLORS.cardBg,
  },
  rideSeparator: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.sm,
  },
  rideLeft: {
    alignItems: "center",
    width: 68,
    marginRight: SPACING.md,
  },
  rideImage: {
    width: 56,
    height: 34,
    resizeMode: "contain",
  },
  rideEta: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: FONTS.medium,
  },
  rideCenter: {
    flex: 1,
  },
  rideName: {
    fontSize: 15,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
  },
  rideNameSelected: {
    color: COLORS.primaryDark,
  },
  rideDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rideRight: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  ridePrice: {
    fontSize: 15,
    fontWeight: FONTS.bold,
    color: COLORS.textDark,
  },
  ridePriceSelected: {
    color: COLORS.primaryDark,
  },
  surgeIndicator: {
    marginTop: 2,
  },
  fareDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  fareDetailsBtnText: {
    fontSize: 13,
    fontWeight: FONTS.semibold,
    color: COLORS.primary,
    marginHorizontal: SPACING.xs,
  },
  paymentBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginTop: SPACING.xs,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  paymentOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  paymentOptionText: {
    fontSize: 13,
    fontWeight: FONTS.medium,
    color: COLORS.textDark,
    marginLeft: 6,
  },
  paymentOptionTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.semibold,
  },
  bookButton: {
    backgroundColor: COLORS.ctaBlack,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    ...SHADOWS.large,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: FONTS.medium,
  },

  // ========== FARE MODAL ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  fareModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: height * 0.85,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  fareModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  fareModalTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.textDark,
  },
  fareModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  fareVehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  fareVehicleImage: {
    width: 70,
    height: 45,
    resizeMode: "contain",
  },
  fareVehicleDetails: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  fareVehicleName: {
    fontSize: 16,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
  },
  fareVehicleDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fareTripInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
  },
  fareTripItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  fareTripText: {
    fontSize: 13,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
    marginLeft: SPACING.xs,
  },
  fareTripDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: SPACING.md,
  },
  fareTimeIndicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  fareIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  fareIndicatorText: {
    fontSize: 12,
    fontWeight: FONTS.semibold,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  fareBreakdownSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  fareBreakdownTitle: {
    fontSize: 14,
    fontWeight: FONTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  fareLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fareLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fareValue: {
    fontSize: 14,
    fontWeight: FONTS.medium,
    color: COLORS.textDark,
  },
  fareSubtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  fareSubtotalLabel: {
    fontSize: 14,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
  },
  fareSubtotalValue: {
    fontSize: 14,
    fontWeight: FONTS.semibold,
    color: COLORS.textDark,
  },
  fareTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.successBg,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  fareTotalLabel: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.textDark,
  },
  fareTotalValue: {
    fontSize: 22,
    fontWeight: FONTS.extrabold,
    color: COLORS.success,
  },
  fareNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  fareNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
    lineHeight: 18,
  },
});