// screens/home/DriverBookingScreen.js

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
  Keyboard,
  Animated,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import AddressSearch from "../../components/AddressSearch";
import { getDirections } from "../../lib/directions";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";

const { width, height } = Dimensions.get("window");

// ==================== PREMIUM DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.08)",
  primaryMedium: "rgba(0, 168, 107, 0.15)",
  primaryDark: "#008F5B",

  textDark: "#0F172A",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textLight: "#CBD5E1",

  background: "#F8FAFC",
  white: "#FFFFFF",
  cardBg: "#FFFFFF",
  inputBg: "#F1F5F9",

  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  success: "#10B981",
  successBg: "#ECFDF5",
  successBorder: "#A7F3D0",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  warningLight: "rgba(245, 158, 11, 0.1)",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  blue: "#3B82F6",
  blueLight: "rgba(59, 130, 246, 0.1)",
  orange: "#F59E0B",
  orangeLight: "rgba(245, 158, 11, 0.1)",

  ctaBlack: "#0F172A",
  overlay: "rgba(15, 23, 42, 0.6)",
  mapOverlay: "rgba(248, 250, 252, 0.9)",
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
  xxl: 28,
  full: 100,
};

const SHADOWS = {
  soft: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  strong: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
};

// ==================== PRICING WITH PLATFORM COMMISSION ====================
const PRICING = {
  baseFare: 35,
  perKm: 14,
  perMin: 1.5,
  driverServiceCharge: 150,
  minimumFare: 199,
  nightMultiplier: 1.15,
  peakMultiplier: 1.10,

  // ====== PLATFORM COMMISSION ======
  platformCommissionPercent: 15,
  platformFixedFee: 10,
  gstOnCommissionPercent: 18,
};

// ==================== MAP STYLE ====================
const mapStyle = [
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E2E8F0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#FEF3C7" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#DBEAFE" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F8FAFC" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
];

// ==================== UTILITY FUNCTIONS ====================
const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
};

const isPeakHour = () => {
  const hour = new Date().getHours();
  return (hour >= 8 && hour < 10) || (hour >= 17 && hour < 20);
};

// ==================== MAIN COMPONENT ====================
export default function DriverBookingScreen({ navigation }) {
  // ===== STATE =====
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [mapRegion, setMapRegion] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceText, setDistanceText] = useState(null);
  const [durationText, setDurationText] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [booking, setBooking] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const [showCarModal, setShowCarModal] = useState(false);
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [seats, setSeats] = useState("");
  const [carColor, setCarColor] = useState("");

  const [pickupEditing, setPickupEditing] = useState(false);

  // ====== PAYMENT METHOD STATE ======
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showCashInfo, setShowCashInfo] = useState(false);

  const mapRef = useRef(null);
  const scrollRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ===== ANIMATIONS =====
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ===== COMPUTED =====
  const carFilled = useMemo(() => {
    return carBrand && carModel && carNumber && fuelType && transmission && seats;
  }, [carBrand, carModel, carNumber, fuelType, transmission, seats]);

  const distanceKm = useMemo(() => {
    if (!distanceText) return null;
    const match = distanceText.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  }, [distanceText]);

  const durationMinutes = useMemo(() => {
    if (!durationText) return null;
    let minutes = 0;
    const hourMatch = durationText.match(/(\d+)\s*hr/);
    const minMatch = durationText.match(/(\d+)\s*min/);
    if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) minutes += parseInt(minMatch[1]);
    return minutes || 20;
  }, [durationText]);

  const fareBreakdown = useMemo(() => {
    if (!distanceKm || !durationMinutes) return null;

    const baseFare = PRICING.baseFare;
    const distanceFare = distanceKm * PRICING.perKm;
    const timeFare = durationMinutes * PRICING.perMin;
    const driverCharge = PRICING.driverServiceCharge;

    let subtotal = baseFare + distanceFare + timeFare + driverCharge;

    const isNight = isNightTime();
    const isPeak = isPeakHour();

    let surgeAmount = 0;
    if (isNight) {
      surgeAmount = subtotal * (PRICING.nightMultiplier - 1);
    } else if (isPeak) {
      surgeAmount = subtotal * (PRICING.peakMultiplier - 1);
    }

    const adjustedFare = Math.max(Math.round(subtotal + surgeAmount), PRICING.minimumFare);

    // ====== PLATFORM COMMISSION ======
    const platformCommission = Math.round(
      (adjustedFare * PRICING.platformCommissionPercent) / 100
    );
    const platformFixedFee = PRICING.platformFixedFee;
    const totalPlatformEarning = platformCommission + platformFixedFee;
    const gstOnCommission = Math.round(
      (totalPlatformEarning * PRICING.gstOnCommissionPercent) / 100
    );

    // ====== DRIVER EARNING ======
    const driverEarning = adjustedFare - totalPlatformEarning;

    // ====== CUSTOMER TOTAL ======
    const customerTotal = Math.round(adjustedFare + platformFixedFee + gstOnCommission);

    return {
      baseFare: Math.round(baseFare),
      distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare),
      driverCharge: Math.round(driverCharge),
      surgeAmount: Math.round(surgeAmount),
      subtotal: Math.round(subtotal),
      adjustedFare,

      // Platform
      platformCommission,
      platformFixedFee,
      totalPlatformEarning,
      gstOnCommission,

      // Driver
      driverEarning: Math.round(driverEarning),

      // Customer
      customerTotal,

      isNight,
      isPeak,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes: Math.round(durationMinutes),
    };
  }, [distanceKm, durationMinutes]);

  const canBook = pickup && drop && fareBreakdown && carFilled && !booking && !loadingRoute;

  // ===== GET LOCATION =====
  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location access is needed to continue");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coord = { lat: loc.coords.latitude, lng: loc.coords.longitude };

      const [addr] = await Location.reverseGeocodeAsync({
        latitude: coord.lat,
        longitude: coord.lng,
      });

      const address = addr
        ? [addr.name, addr.street, addr.district, addr.city].filter(Boolean).join(", ")
        : "Current Location";

      setCurrentLocation(coord);
      setCurrentAddress(address);
      setPickup({ description: address, location: coord });

      setMapRegion({
        latitude: coord.lat + 0.006,
        longitude: coord.lng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      });
    } catch (e) {
      console.log("Location error:", e);
      Alert.alert("Error", "Could not get your location");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // ===== ROUTE CALCULATION =====
  useEffect(() => {
    if (!pickup || !drop) {
      setRouteCoords([]);
      setDistanceText(null);
      setDurationText(null);
      return;
    }

    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        const result = await getDirections(pickup.location, drop.location);
        if (result) {
          setRouteCoords(result.coords);
          setDistanceText(result.distance);
          setDurationText(result.duration);

          setTimeout(() => {
            mapRef.current?.fitToCoordinates(result.coords, {
              edgePadding: { top: 120, right: 60, bottom: height * 0.5, left: 60 },
              animated: true,
            });
          }, 400);
        }
      } catch (e) {
        console.log("Route error:", e);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [pickup, drop]);

  // ===== HANDLERS =====
  const handleClearPickup = () => {
    setPickupEditing(true);
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation && currentAddress) {
      setPickup({ description: currentAddress, location: currentLocation });
      setPickupEditing(false);
    }
  };

  const handlePickupSelect = (location) => {
    setPickup(location);
    setPickupEditing(false);
  };

  const handleRecenter = () => {
    if (currentLocation) {
      mapRef.current?.animateToRegion({
        latitude: currentLocation.lat + 0.006,
        longitude: currentLocation.lng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      });
    }
  };

  // ===== BOOK DRIVER (WITH COMMISSION) =====
  const handleBook = async () => {
    if (!canBook) {
      if (!carFilled) {
        setShowCarModal(true);
      }
      return;
    }

    Keyboard.dismiss();
    setBooking(true);

    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert("Login Required", "Please login to continue");
        setBooking(false);
        return;
      }

      const finalPaymentMethod = paymentMethod === "upi" ? "online" : paymentMethod;

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.uid,
          service_type: "driver",
          vehicle: `${carBrand} ${carModel}`,
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
          car_details: {
            brand: carBrand,
            model: carModel,
            number: carNumber,
            fuel_type: fuelType,
            transmission,
            seats,
            color: carColor,
          },
          scheduled_date: isScheduled ? selectedDate.toISOString() : null,

          // ====== FULL PRICING BREAKDOWN ======
          pricing: {
            base_fare: fareBreakdown.baseFare,
            distance_fare: fareBreakdown.distanceFare,
            time_fare: fareBreakdown.timeFare,
            driver_service_charge: fareBreakdown.driverCharge,
            surge_amount: fareBreakdown.surgeAmount,
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
        distance: distanceText,
        distanceKm: fareBreakdown.distanceKm,
        duration: durationText,
        durationMinutes: fareBreakdown.durationMinutes,
        customerTotal: fareBreakdown.customerTotal,
        totalFare: fareBreakdown.customerTotal,
        driverEarning: fareBreakdown.driverEarning,
        platformEarning: fareBreakdown.totalPlatformEarning,
        vehicleId: "driver",
        vehicleName: "Professional Driver",
        paymentMethod: finalPaymentMethod,
      });
    } catch (e) {
      Alert.alert("Error", "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  // ===== CAR MODAL =====
  const renderCarModal = () => (
    <Modal
      visible={showCarModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowCarModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="car-sport" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Vehicle Details</Text>
                <Text style={styles.modalSubtitle}>Help driver identify your car</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowCarModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScroll}
          >
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.formLabel}>Brand <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Honda"
                  placeholderTextColor={COLORS.textMuted}
                  value={carBrand}
                  onChangeText={setCarBrand}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.formLabel}>Model <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. City"
                  placeholderTextColor={COLORS.textMuted}
                  value={carModel}
                  onChangeText={setCarModel}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Registration Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.formInput}
              placeholder="MH 12 AB 1234"
              placeholderTextColor={COLORS.textMuted}
              value={carNumber}
              onChangeText={setCarNumber}
              autoCapitalize="characters"
            />

            <Text style={styles.formLabel}>Fuel Type <Text style={styles.required}>*</Text></Text>
            <View style={styles.chipGrid}>
              {["Petrol", "Diesel", "CNG", "Electric", "Hybrid"].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, fuelType === f && styles.chipActive]}
                  onPress={() => setFuelType(f)}
                >
                  <Text style={[styles.chipText, fuelType === f && styles.chipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Transmission <Text style={styles.required}>*</Text></Text>
            <View style={styles.chipGrid}>
              {["Manual", "Automatic"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chipWide, transmission === t && styles.chipActive]}
                  onPress={() => setTransmission(t)}
                >
                  <Ionicons
                    name={t === "Manual" ? "cog-outline" : "flash-outline"}
                    size={16}
                    color={transmission === t ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text style={[styles.chipText, transmission === t && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Seating Capacity <Text style={styles.required}>*</Text></Text>
            <View style={styles.chipGrid}>
              {["4", "5", "6", "7", "8+"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chipSmall, seats === s && styles.chipActive]}
                  onPress={() => setSeats(s)}
                >
                  <Text style={[styles.chipText, seats === s && styles.chipTextActive]}>
                    {s} Seats
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Color <Text style={styles.optional}>(Optional)</Text></Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Pearl White"
              placeholderTextColor={COLORS.textMuted}
              value={carColor}
              onChangeText={setCarColor}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalSaveBtn, !carFilled && styles.modalSaveBtnDisabled]}
              onPress={() => carFilled && setShowCarModal(false)}
              disabled={!carFilled}
            >
              {carFilled ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.modalSaveBtnText}>Save Vehicle Details</Text>
                </>
              ) : (
                <Text style={styles.modalSaveBtnText}>Please Fill All Required Fields</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ===== MAIN RENDER =====
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ===== MAP ===== */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Finding your location...</Text>
            </View>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            region={mapRegion}
            provider={PROVIDER_GOOGLE}
            customMapStyle={mapStyle}
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {pickup && (
              <Marker coordinate={{ latitude: pickup.location.lat, longitude: pickup.location.lng }}>
                <View style={styles.markerContainer}>
                  <Animated.View
                    style={[
                      styles.markerPulse,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.3],
                          outputRange: [0.4, 0],
                        }),
                      },
                    ]}
                  />
                  <View style={styles.pickupMarker}>
                    <View style={styles.pickupMarkerInner} />
                  </View>
                </View>
              </Marker>
            )}
            {drop && (
              <Marker coordinate={{ latitude: drop.location.lat, longitude: drop.location.lng }}>
                <View style={styles.dropMarker}>
                  <Ionicons name="location" size={18} color={COLORS.white} />
                </View>
              </Marker>
            )}
            {routeCoords.length > 0 && (
              <>
                <Polyline coordinates={routeCoords} strokeColor="rgba(0, 168, 107, 0.2)" strokeWidth={8} />
                <Polyline coordinates={routeCoords} strokeColor={COLORS.primary} strokeWidth={4} />
              </>
            )}
          </MapView>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Ionicons name="car-sport" size={20} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Hire Driver</Text>
          </View>

          <TouchableOpacity style={styles.headerBtn} onPress={handleRecenter}>
            <Ionicons name="locate" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Route Info Badge */}
        {fareBreakdown && !loadingRoute && (
          <View style={styles.routeBadge}>
            <View style={styles.routeBadgeItem}>
              <Ionicons name="speedometer-outline" size={16} color={COLORS.primary} />
              <Text style={styles.routeBadgeText}>{distanceText}</Text>
            </View>
            <View style={styles.routeBadgeDivider} />
            <View style={styles.routeBadgeItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.routeBadgeText}>{durationText}</Text>
            </View>
            {(fareBreakdown.isNight || fareBreakdown.isPeak) && (
              <>
                <View style={styles.routeBadgeDivider} />
                <View style={[styles.surgeBadge, fareBreakdown.isNight ? styles.surgeBadgeNight : styles.surgeBadgePeak]}>
                  <Ionicons
                    name={fareBreakdown.isNight ? "moon" : "flash"}
                    size={12}
                    color={COLORS.white}
                  />
                  <Text style={styles.surgeBadgeText}>
                    {fareBreakdown.isNight ? "Night" : "Peak"}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {loadingRoute && (
          <View style={styles.routeBadge}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.routeBadgeText}>Calculating best route...</Text>
          </View>
        )}
      </View>

      {/* ===== BOTTOM PANEL ===== */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={styles.locationIconCol}>
                <View style={styles.dotGreen} />
                <View style={styles.dashedLine}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.dash} />
                  ))}
                </View>
              </View>

              <View style={styles.locationInputCol}>
                <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                {!pickupEditing && pickup ? (
                  <View style={styles.locationValueRow}>
                    <Text style={styles.locationValue} numberOfLines={1}>
                      {pickup.description}
                    </Text>
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClearPickup}>
                      <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <AddressSearch
                      placeholder="Enter pickup location"
                      nearby={currentLocation}
                      onSelect={handlePickupSelect}
                      inputStyle={styles.locationInput}
                    />
                    {currentLocation && (
                      <TouchableOpacity
                        style={styles.useCurrentBtn}
                        onPress={handleUseCurrentLocation}
                      >
                        <Ionicons name="locate" size={16} color={COLORS.primary} />
                        <Text style={styles.useCurrentText}>Use current location</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.locationDivider} />

            <View style={styles.locationRow}>
              <View style={styles.locationIconCol}>
                <View style={styles.dotRed} />
              </View>

              <View style={styles.locationInputCol}>
                <Text style={styles.locationLabel}>DROP LOCATION</Text>
                <AddressSearch
                  placeholder="Where are you going?"
                  nearby={pickup?.location || currentLocation}
                  onSelect={setDrop}
                  inputStyle={styles.locationInput}
                  defaultText={drop?.description}
                />
              </View>
            </View>
          </View>

          {/* Schedule Card */}
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <TouchableOpacity
                style={[styles.scheduleToggle, !isScheduled && styles.scheduleToggleActive]}
                onPress={() => setIsScheduled(false)}
              >
                <Ionicons name="flash" size={16} color={!isScheduled ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.scheduleToggleText, !isScheduled && styles.scheduleToggleTextActive]}>
                  Ride Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scheduleToggle, isScheduled && styles.scheduleToggleActive]}
                onPress={() => {
                  setIsScheduled(true);
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={isScheduled ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.scheduleToggleText, isScheduled && styles.scheduleToggleTextActive]}>
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>

            {isScheduled && (
              <TouchableOpacity
                style={styles.scheduledTimeRow}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.scheduledTimeInfo}>
                  <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.scheduledTimeText}>
                    {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
                    {selectedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Card */}
          <TouchableOpacity style={styles.vehicleCard} onPress={() => setShowCarModal(true)}>
            <View style={[styles.vehicleIcon, carFilled && styles.vehicleIconFilled]}>
              <Ionicons name="car-sport" size={24} color={carFilled ? COLORS.white : COLORS.primary} />
            </View>

            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleTitle}>
                {carFilled ? `${carBrand} ${carModel}` : "Add Your Vehicle"}
              </Text>
              <Text style={styles.vehicleSubtitle}>
                {carFilled
                  ? `${carNumber} • ${fuelType} • ${transmission}`
                  : "Required for driver to identify your car"}
              </Text>
            </View>

            {carFilled ? (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              </View>
            ) : (
              <View style={styles.addBadge}>
                <Ionicons name="add" size={18} color={COLORS.primary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Fare Card (WITH COMMISSION) */}
          {fareBreakdown ? (
            <View style={styles.fareCard}>
              <View style={styles.fareHeader}>
                <Text style={styles.fareTitle}>Estimated Fare</Text>
                {(fareBreakdown.isNight || fareBreakdown.isPeak) && (
                  <View style={styles.surgeTag}>
                    <Ionicons
                      name={fareBreakdown.isNight ? "moon" : "flash"}
                      size={12}
                      color={COLORS.orange}
                    />
                    <Text style={styles.surgeTagText}>
                      {fareBreakdown.isNight ? "Night fare" : "Peak hour"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.fareAmountRow}>
                <Text style={styles.fareCurrency}>₹</Text>
                <Text style={styles.fareAmount}>{fareBreakdown.customerTotal}</Text>
              </View>

              <View style={styles.fareBreakdown}>
                <View style={styles.fareBreakdownRow}>
                  <Text style={styles.fareBreakdownLabel}>Base fare</Text>
                  <Text style={styles.fareBreakdownValue}>₹{fareBreakdown.baseFare}</Text>
                </View>
                <View style={styles.fareBreakdownRow}>
                  <Text style={styles.fareBreakdownLabel}>
                    Distance ({fareBreakdown.distanceKm} km × ₹{PRICING.perKm})
                  </Text>
                  <Text style={styles.fareBreakdownValue}>₹{fareBreakdown.distanceFare}</Text>
                </View>
                <View style={styles.fareBreakdownRow}>
                  <Text style={styles.fareBreakdownLabel}>Time ({fareBreakdown.durationMinutes} min)</Text>
                  <Text style={styles.fareBreakdownValue}>₹{fareBreakdown.timeFare}</Text>
                </View>
                <View style={styles.fareBreakdownRow}>
                  <Text style={styles.fareBreakdownLabel}>Driver service charge</Text>
                  <Text style={styles.fareBreakdownValue}>₹{fareBreakdown.driverCharge}</Text>
                </View>
                {fareBreakdown.surgeAmount > 0 && (
                  <View style={styles.fareBreakdownRow}>
                    <Text style={[styles.fareBreakdownLabel, { color: COLORS.orange }]}>
                      {fareBreakdown.isNight ? "Night charge" : "Peak hour charge"}
                    </Text>
                    <Text style={[styles.fareBreakdownValue, { color: COLORS.orange }]}>
                      +₹{fareBreakdown.surgeAmount}
                    </Text>
                  </View>
                )}

                {/* Platform fees */}
                <View style={styles.fareBreakdownDivider} />
                <View style={styles.fareBreakdownRow}>
                  <Text style={styles.fareBreakdownLabel}>Platform fee</Text>
                  <Text style={styles.fareBreakdownValue}>₹{fareBreakdown.platformFixedFee}</Text>
                </View>
                <View style={styles.fareBreakdownRow}>
                  <Text style={styles.fareBreakdownLabel}>GST</Text>
                  <Text style={styles.fareBreakdownValue}>₹{fareBreakdown.gstOnCommission}</Text>
                </View>
              </View>

              {/* Earnings transparency */}
              <View style={styles.fareEarningsBar}>
                <Text style={styles.fareEarningsTitle}>Fare distribution</Text>
                <View style={styles.fareEarningsBarTrack}>
                  <View
                    style={[
                      styles.fareEarningsBarSegment,
                      {
                        flex: fareBreakdown.driverEarning,
                        backgroundColor: COLORS.primary,
                        borderTopLeftRadius: 4,
                        borderBottomLeftRadius: 4,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.fareEarningsBarSegment,
                      {
                        flex: fareBreakdown.totalPlatformEarning,
                        backgroundColor: COLORS.blue,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.fareEarningsBarSegment,
                      {
                        flex: fareBreakdown.gstOnCommission || 1,
                        backgroundColor: COLORS.orange,
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4,
                      },
                    ]}
                  />
                </View>
                <View style={styles.fareEarningsLegend}>
                  <View style={styles.fareEarningsLegendItem}>
                    <View style={[styles.fareEarningsLegendDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={styles.fareEarningsLegendText}>Driver ₹{fareBreakdown.driverEarning}</Text>
                  </View>
                  <View style={styles.fareEarningsLegendItem}>
                    <View style={[styles.fareEarningsLegendDot, { backgroundColor: COLORS.blue }]} />
                    <Text style={styles.fareEarningsLegendText}>Platform ₹{fareBreakdown.totalPlatformEarning}</Text>
                  </View>
                  <View style={styles.fareEarningsLegendItem}>
                    <View style={[styles.fareEarningsLegendDot, { backgroundColor: COLORS.orange }]} />
                    <Text style={styles.fareEarningsLegendText}>GST ₹{fareBreakdown.gstOnCommission}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fareNote}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.fareNoteText}>
                  Toll, parking & waiting charges extra if applicable
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.fareEmptyCard}>
              <Ionicons name="calculator-outline" size={32} color={COLORS.textLight} />
              <Text style={styles.fareEmptyText}>Select pickup & drop to see fare</Text>
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: COLORS.successBg }]}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.featureText}>Verified Drivers</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: COLORS.warningBg }]}>
                <Ionicons name="star" size={18} color={COLORS.warning} />
              </View>
              <Text style={styles.featureText}>4.8+ Rated</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: COLORS.infoBg }]}>
                <Ionicons name="time-outline" size={18} color={COLORS.info} />
              </View>
              <Text style={styles.featureText}>On Time</Text>
            </View>
          </View>

          {/* ====== PAYMENT METHOD SELECTION ====== */}
          <View style={styles.paymentSection}>
            <Text style={styles.paymentSectionTitle}>Payment Method</Text>

            <View style={styles.paymentOptionsRow}>
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  paymentMethod === "cash" && styles.paymentOptionCardCash,
                ]}
                onPress={() => {
                  setPaymentMethod("cash");
                  setShowCashInfo(true);
                  setTimeout(() => setShowCashInfo(false), 4000);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cash-outline"
                  size={22}
                  color={paymentMethod === "cash" ? COLORS.orange : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentOptionLabel,
                    paymentMethod === "cash" && styles.paymentOptionLabelCash,
                  ]}
                >
                  Cash
                </Text>
                {paymentMethod === "cash" && (
                  <View style={[styles.paymentCheckDot, { backgroundColor: COLORS.orange }]}>
                    <Ionicons name="checkmark" size={10} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  paymentMethod === "upi" && styles.paymentOptionCardOnline,
                ]}
                onPress={() => {
                  setPaymentMethod("upi");
                  setShowCashInfo(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={22}
                  color={paymentMethod === "upi" ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentOptionLabel,
                    paymentMethod === "upi" && styles.paymentOptionLabelOnline,
                  ]}
                >
                  UPI / Online
                </Text>
                <View style={styles.recommendedTag}>
                  <Text style={styles.recommendedTagText}>RECOMMENDED</Text>
                </View>
                {paymentMethod === "upi" && (
                  <View style={[styles.paymentCheckDot, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="checkmark" size={10} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Cash Info Banner */}
            {paymentMethod === "cash" && showCashInfo && fareBreakdown && (
              <View style={styles.cashInfoBanner}>
                <Ionicons name="information-circle" size={18} color={COLORS.orange} />
                <Text style={styles.cashInfoText}>
                  Pay ₹{fareBreakdown.customerTotal} cash to driver. Platform fee of ₹
                  {fareBreakdown.totalPlatformEarning} will be adjusted from driver's account.
                </Text>
                <TouchableOpacity onPress={() => setShowCashInfo(false)}>
                  <Ionicons name="close" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Online Benefit Banner */}
            {paymentMethod === "upi" && (
              <View style={styles.onlineBenefitBanner}>
                <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.onlineBenefitText}>
                  Secure payment • No change hassle • Instant receipt
                </Text>
              </View>
            )}
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={[styles.bookBtn, (!canBook || booking) && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={!canBook || booking}
            activeOpacity={0.8}
          >
            {booking ? (
              <View style={styles.bookBtnLoading}>
                <ActivityIndicator color={COLORS.white} />
                <Text style={styles.bookBtnText}>Finding Driver...</Text>
              </View>
            ) : (
              <View style={styles.bookBtnContent}>
                <Text style={styles.bookBtnText}>
                  {fareBreakdown ? `Book Driver • ₹${fareBreakdown.customerTotal}` : "Book Driver"}
                </Text>
                <View style={styles.bookBtnPaymentBadge}>
                  <Ionicons
                    name={paymentMethod === "cash" ? "cash-outline" : "phone-portrait-outline"}
                    size={12}
                    color={COLORS.white}
                  />
                  <Text style={styles.bookBtnPaymentText}>
                    {paymentMethod === "cash" ? "Pay Cash" : "Pay Online"}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Warning */}
          {!carFilled && (
            <TouchableOpacity style={styles.warningCard} onPress={() => setShowCarModal(true)}>
              <View style={styles.warningIcon}>
                <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Vehicle details required</Text>
                <Text style={styles.warningSubtitle}>Tap here to add your car information</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.warning} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          minimumDate={new Date()}
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) {
              setSelectedDate(d);
              setTimeout(() => setShowTimePicker(true), 400);
            }
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          onChange={(e, d) => {
            setShowTimePicker(false);
            if (d) setSelectedDate(d);
          }}
        />
      )}

      {/* Car Modal */}
      {renderCarModal()}

      {/* Booking Overlay */}
      {booking && (
        <View style={styles.bookingOverlay}>
          <View style={styles.bookingCard}>
            <View style={styles.bookingSpinner}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.bookingTitle}>Finding Your Driver</Text>
            <Text style={styles.bookingSubtitle}>
              Connecting you with verified professionals nearby...
            </Text>
            <View style={styles.bookingProgress}>
              <View style={styles.bookingProgressBar} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ===== MAP =====
  mapContainer: {
    height: height * 0.4,
    backgroundColor: COLORS.inputBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    ...SHADOWS.card,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },

  // ===== HEADER =====
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 42,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.card,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  // ===== ROUTE BADGE =====
  routeBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 115 : 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  routeBadgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  routeBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  routeBadgeDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  surgeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  surgeBadgeNight: {
    backgroundColor: "#6366F1",
  },
  surgeBadgePeak: {
    backgroundColor: COLORS.warning,
  },
  surgeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },

  // ===== MARKERS =====
  markerContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  markerPulse: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
  },
  pickupMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.card,
  },
  pickupMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  dropMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.card,
  },

  // ===== BOTTOM PANEL =====
  bottomPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    marginTop: -SPACING.xl,
    ...SHADOWS.strong,
  },
  panelHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  panelContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : SPACING.xxl,
  },

  // ===== LOCATION CARD =====
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationRow: {
    flexDirection: "row",
  },
  locationIconCol: {
    width: 28,
    alignItems: "center",
    paddingTop: 6,
  },
  dotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primaryMedium,
  },
  dotRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.errorBg,
  },
  dashedLine: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.xs,
  },
  dash: {
    width: 2,
    height: 6,
    backgroundColor: COLORS.border,
    marginVertical: 2,
    borderRadius: 1,
  },
  locationInputCol: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  locationValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    paddingVertical: SPACING.sm,
  },
  clearBtn: {
    padding: SPACING.xs,
  },
  locationInput: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textDark,
    paddingVertical: SPACING.sm,
  },
  useCurrentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  useCurrentText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  locationDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
    marginLeft: 28 + SPACING.md,
  },

  // ===== SCHEDULE CARD =====
  scheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scheduleHeader: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  scheduleToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBg,
  },
  scheduleToggleActive: {
    backgroundColor: COLORS.primaryLight,
  },
  scheduleToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  scheduleToggleTextActive: {
    color: COLORS.primary,
  },
  scheduledTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  scheduledTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  scheduledTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },

  // ===== VEHICLE CARD =====
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vehicleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleIconFilled: {
    backgroundColor: COLORS.primary,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  vehicleSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
  },
  addBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  // ===== FARE CARD =====
  fareCard: {
    backgroundColor: COLORS.successBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  fareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  fareTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  surgeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  surgeTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.warning,
  },
  fareAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: SPACING.md,
  },
  fareCurrency: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.success,
  },
  fareAmount: {
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.success,
    marginLeft: 2,
  },
  fareBreakdown: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.successBorder,
  },
  fareBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  fareBreakdownLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  fareBreakdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  fareBreakdownDivider: {
    height: 1,
    backgroundColor: COLORS.successBorder,
    marginVertical: SPACING.sm,
  },

  // ===== FARE EARNINGS BAR =====
  fareEarningsBar: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.successBorder,
  },
  fareEarningsTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  fareEarningsBarTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  fareEarningsBarSegment: {
    height: "100%",
    marginRight: 1,
  },
  fareEarningsLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fareEarningsLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  fareEarningsLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  fareEarningsLegendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  fareNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.successBorder,
  },
  fareNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  fareEmptyCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  fareEmptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },

  // ===== FEATURES =====
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  // ===== PAYMENT SECTION =====
  paymentSection: {
    marginBottom: SPACING.lg,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  paymentOptionsRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  paymentOptionCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    position: "relative",
  },
  paymentOptionCardCash: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeLight,
  },
  paymentOptionCardOnline: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentOptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  paymentOptionLabelCash: {
    color: COLORS.orange,
  },
  paymentOptionLabelOnline: {
    color: COLORS.primary,
  },
  paymentCheckDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendedTag: {
    backgroundColor: COLORS.primaryMedium,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: SPACING.xs,
  },
  recommendedTagText: {
    fontSize: 8,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cashInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.orangeLight,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  cashInfoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.orange,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    lineHeight: 16,
  },
  onlineBenefitBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  onlineBenefitText: {
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: "500",
  },

  // ===== BOOK BUTTON =====
  bookBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.ctaBlack,
    paddingVertical: SPACING.lg + 2,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  bookBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  bookBtnContent: {
    alignItems: "center",
  },
  bookBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
  },
  bookBtnLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  bookBtnPaymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    opacity: 0.7,
  },
  bookBtnPaymentText: {
    fontSize: 10,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: "500",
  },

  // ===== WARNING CARD =====
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  warningContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  warningSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  modalIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  modalFooter: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === "ios" ? 40 : SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  modalSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.ctaBlack,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  modalSaveBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },

  // ===== FORM =====
  formRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  formHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  optional: {
    color: COLORS.textMuted,
    fontWeight: "400",
  },
  formInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  // ===== CHIPS =====
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipWide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSmall: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },

  // ===== BOOKING OVERLAY =====
  bookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
  },
  bookingCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    ...SHADOWS.strong,
  },
  bookingSpinner: {
    marginBottom: SPACING.xl,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  bookingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  bookingProgress: {
    width: "100%",
    height: 4,
    backgroundColor: COLORS.inputBg,
    borderRadius: 2,
    overflow: "hidden",
  },
  bookingProgressBar: {
    width: "60%",
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});