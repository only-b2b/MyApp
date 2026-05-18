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
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  useAnimatedStyle,
  cancelAnimation,
  Easing,
  FadeInDown,
  FadeInUp,
  SlideInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddressSearch from "../../components/AddressSearch";
import { getDirections } from "../../lib/directions";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";

const { width, height } = Dimensions.get("window");

// ==================== DESIGN SYSTEM (matches ServiceSelectScreen) ====================
const C = {
  violet:          "#3D2B8C",
  violetDark:      "#2A1E6B",
  violetMid:       "#4D3CA0",
  blue:            "#1E40AF",
  blueDark:        "#1E3A8A",
  blueDeep:        "#172554",
  primarySoft:     "#EEEAFB",
  primarySoftDeep: "#DCD4F5",
  lavenderBg:      "#F1EEFB",
  gold:            "#C9980A",
  goldLight:       "#E8B923",
  goldBright:      "#F0C93A",
  goldDark:        "#8B6508",
  goldDeep:        "#4A3200",
  goldSoft:        "#FBF0D0",
  bg:              "#F7F7FA",
  card:            "#FFFFFF",
  surface:         "#F9FAFB",
  textDark:        "#0F0F1F",
  textPrimary:     "#1F1F33",
  textMid:         "#4A4A66",
  textLight:       "#7B7B95",
  textFaint:       "#A8A8BC",
  border:          "#EDEDF2",
  borderMid:       "#DDDDE5",
  pastelBlue:      "#E3F0FF",
  blueAccent:      "#3B82F6",
  pastelGreen:     "#E8F5E9",
  green:           "#34A853",
  greenDark:       "#16A34A",
  greenSoft:       "#DCFCE7",
  pastelOrange:    "#FFE8D6",
  orange:          "#F59E0B",
  pastelRed:       "#FEE2E2",
  red:             "#EF4444",
  success:         "#22C55E",
  successBg:       "#E8F8EF",
  white:           "#FFFFFF",
  dark:            "#0F172A",
  overlay:         "rgba(15,23,42,0.65)",
  teal:            "#0D9488",
  cyan:            "#06B6D4",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R  = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999 };

const GRAD = {
  primary:    [C.violet, C.blue],
  primaryDeep:[C.violetDark, C.blueDeep],
  gold:       [C.goldBright, C.goldLight, C.gold],
  green:      [C.green, C.greenDark],
  dark:       ["#0F172A", "#1E293B"],
  surface:    ["#F7F7FA", "#EEEAFB"],
};

// ==================== PRICING ====================
const PRICING = {
  baseFare:                  35,
  perKm:                     14,
  perMin:                    1.5,
  driverServiceCharge:       150,
  minimumFare:               199,
  nightMultiplier:           1.15,
  peakMultiplier:            1.10,
  platformCommissionPercent: 15,
  platformFixedFee:          10,
  gstOnCommissionPercent:    18,
};

const isNightTime = () => { const h = new Date().getHours(); return h >= 22 || h < 6; };
const isPeakHour  = () => { const h = new Date().getHours(); return (h >= 8 && h < 10) || (h >= 17 && h < 20); };

// ==================== MAP STYLE ====================
const mapStyle = [
  { featureType: "poi",        elementType: "all",              stylers: [{ visibility: "off" }] },
  { featureType: "transit",    elementType: "all",              stylers: [{ visibility: "off" }] },
  { featureType: "road",       elementType: "geometry",         stylers: [{ color: "#ffffff"  }] },
  { featureType: "road",       elementType: "geometry.stroke",  stylers: [{ color: "#E2E8F0"  }] },
  { featureType: "road.highway",elementType: "geometry",        stylers: [{ color: "#EDE9FE"  }] },
  { featureType: "water",      elementType: "geometry",         stylers: [{ color: "#DBEAFE"  }] },
  { featureType: "landscape",  elementType: "geometry",         stylers: [{ color: "#F8FAFC"  }] },
  { featureType: "administrative",elementType:"labels.text.fill",stylers: [{ color: "#7B7B95" }] },
];

// ==================== PULSE DOT ====================
const PulseDot = React.memo(({ color = C.violet, size = 14 }) => {
  const sc = useSharedValue(1);
  const op = useSharedValue(0.5);
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(2.2, { duration: 1100 }), withTiming(1, { duration: 1100 })), -1);
    op.value = withRepeat(withSequence(withTiming(0, { duration: 1100 }), withTiming(0.5, { duration: 1100 })), -1);
    return () => { cancelAnimation(sc); cancelAnimation(op); };
  }, []);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: op.value }));
  return (
    <View style={{ width: size * 2.5, height: size * 2.5, justifyContent: "center", alignItems: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size * 2, height: size * 2, borderRadius: size, backgroundColor: color }, ring]} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 2.5, borderColor: C.white }} />
    </View>
  );
});

// ==================== SECTION LABEL ====================
const SLabel = ({ text }) => <Text style={styles.sLabel}>{text}</Text>;

// ==================== MAIN SCREEN ====================
export default function DriverBookingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress,  setCurrentAddress]  = useState("");
  const [mapRegion,       setMapRegion]        = useState(null);
  const [pickup,          setPickup]           = useState(null);
  const [drop,            setDrop]             = useState(null);
  const [routeCoords,     setRouteCoords]      = useState([]);
  const [distanceText,    setDistanceText]     = useState(null);
  const [durationText,    setDurationText]     = useState(null);
  const [loading,         setLoading]          = useState(true);
  const [loadingRoute,    setLoadingRoute]     = useState(false);
  const [booking,         setBooking]          = useState(false);
  const [selectedDate,    setSelectedDate]     = useState(new Date());
  const [showDatePicker,  setShowDatePicker]   = useState(false);
  const [showTimePicker,  setShowTimePicker]   = useState(false);
  const [isScheduled,     setIsScheduled]      = useState(false);
  const [showCarModal,    setShowCarModal]     = useState(false);
  const [carBrand,        setCarBrand]         = useState("");
  const [carModel,        setCarModel]         = useState("");
  const [carNumber,       setCarNumber]        = useState("");
  const [fuelType,        setFuelType]         = useState("");
  const [transmission,    setTransmission]     = useState("");
  const [seats,           setSeats]            = useState("");
  const [carColor,        setCarColor]         = useState("");
  const [pickupEditing,   setPickupEditing]    = useState(false);
  const [paymentMethod,   setPaymentMethod]    = useState("cash");

  const mapRef   = useRef(null);
  const scrollRef = useRef(null);

  // ── Booking spinner animation ──
  const spinVal = useSharedValue(0);
  useEffect(() => {
    spinVal.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.linear }), -1);
    return () => cancelAnimation(spinVal);
  }, []);

  const carFilled = useMemo(() =>
    !!(carBrand && carModel && carNumber && fuelType && transmission && seats),
    [carBrand, carModel, carNumber, fuelType, transmission, seats]
  );

  const distanceKm = useMemo(() => {
    if (!distanceText) return null;
    const m = distanceText.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  }, [distanceText]);

  const durationMinutes = useMemo(() => {
    if (!durationText) return null;
    let mins = 0;
    const hm = durationText.match(/(\d+)\s*hr/);
    const mm = durationText.match(/(\d+)\s*min/);
    if (hm) mins += parseInt(hm[1]) * 60;
    if (mm) mins += parseInt(mm[1]);
    return mins || 20;
  }, [durationText]);

  const fareBreakdown = useMemo(() => {
    if (!distanceKm || !durationMinutes) return null;
    const baseFare     = PRICING.baseFare;
    const distanceFare = distanceKm * PRICING.perKm;
    const timeFare     = durationMinutes * PRICING.perMin;
    const driverCharge = PRICING.driverServiceCharge;
    let subtotal       = baseFare + distanceFare + timeFare + driverCharge;
    const isNight      = isNightTime();
    const isPeak       = isPeakHour();
    let surgeAmount    = 0;
    if (isNight)      surgeAmount = subtotal * (PRICING.nightMultiplier - 1);
    else if (isPeak)  surgeAmount = subtotal * (PRICING.peakMultiplier - 1);
    const adjustedFare        = Math.max(Math.round(subtotal + surgeAmount), PRICING.minimumFare);
    const platformCommission  = Math.round((adjustedFare * PRICING.platformCommissionPercent) / 100);
    const platformFixedFee    = PRICING.platformFixedFee;
    const totalPlatformEarning = platformCommission + platformFixedFee;
    const gstOnCommission     = Math.round((totalPlatformEarning * PRICING.gstOnCommissionPercent) / 100);
    const driverEarning       = adjustedFare - totalPlatformEarning;
    const customerTotal       = Math.round(adjustedFare + platformFixedFee + gstOnCommission);
    return {
      baseFare: Math.round(baseFare), distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare), driverCharge: Math.round(driverCharge),
      surgeAmount: Math.round(surgeAmount), subtotal: Math.round(subtotal),
      adjustedFare, platformCommission, platformFixedFee, totalPlatformEarning,
      gstOnCommission, driverEarning: Math.round(driverEarning), customerTotal,
      isNight, isPeak,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes: Math.round(durationMinutes),
    };
  }, [distanceKm, durationMinutes]);

  const canBook = pickup && drop && fareBreakdown && carFilled && !booking && !loadingRoute;

  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLoading(false); return; }
      const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coord  = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      const [addr] = await Location.reverseGeocodeAsync({ latitude: coord.lat, longitude: coord.lng });
      const address = addr
        ? [addr.name, addr.street, addr.district, addr.city].filter(Boolean).join(", ")
        : "Current Location";
      setCurrentLocation(coord);
      setCurrentAddress(address);
      setPickup({ description: address, location: coord });
      setMapRegion({ latitude: coord.lat + 0.006, longitude: coord.lng, latitudeDelta: 0.025, longitudeDelta: 0.025 });
    } catch { Alert.alert("Error", "Could not get your location"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    if (!pickup || !drop) { setRouteCoords([]); setDistanceText(null); setDurationText(null); return; }
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
              edgePadding: { top: 130, right: 60, bottom: height * 0.52, left: 60 },
              animated: true,
            });
          }, 400);
        }
      } catch (e) { console.log("Route error:", e); }
      finally { setLoadingRoute(false); }
    };
    fetchRoute();
  }, [pickup, drop]);

  const handleBook = async () => {
    if (!pickup || !drop) { Alert.alert("Missing Info", "Please select pickup and drop locations"); return; }
    if (!carFilled) { setShowCarModal(true); return; }
    if (!fareBreakdown) { Alert.alert("Error", "Could not calculate fare. Please try again."); return; }
    Keyboard.dismiss();
    setBooking(true);
    try {
      const user = auth().currentUser;
      if (!user) { Alert.alert("Login Required", "Please login to continue"); return; }
      if (isScheduled) {
        const now     = new Date();
        const minTime = new Date(now.getTime() + 30 * 60 * 1000);
        const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (selectedDate < minTime) { Alert.alert("Invalid Time", "Please schedule at least 30 minutes from now."); return; }
        if (selectedDate > maxTime) { Alert.alert("Invalid Time", "Cannot schedule more than 7 days in advance."); return; }
      }
      const finalPaymentMethod = paymentMethod === "upi" ? "online" : paymentMethod;
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.uid, service_type: "driver",
          vehicle: `${carBrand} ${carModel}`,
          distance: fareBreakdown.distanceKm, duration: fareBreakdown.durationMinutes,
          price: fareBreakdown.adjustedFare, customer_total: fareBreakdown.customerTotal,
          payment_method: finalPaymentMethod,
          pickup_lat: pickup.location.lat, pickup_lng: pickup.location.lng,
          drop_lat: drop.location.lat, drop_lng: drop.location.lng,
          pickup: pickup.description, drop: drop.description,
          car_details: { brand: carBrand, model: carModel, number: carNumber, fuel_type: fuelType, transmission, seats, color: carColor },
          scheduled_date: isScheduled ? selectedDate.toISOString() : null,
          is_scheduled: isScheduled,
          pricing: {
            base_fare: fareBreakdown.baseFare, distance_fare: fareBreakdown.distanceFare,
            time_fare: fareBreakdown.timeFare, driver_service_charge: fareBreakdown.driverCharge,
            surge_amount: fareBreakdown.surgeAmount, subtotal: fareBreakdown.subtotal,
            platform_commission: fareBreakdown.platformCommission, platform_fixed_fee: fareBreakdown.platformFixedFee,
            total_platform_earning: fareBreakdown.totalPlatformEarning, gst_on_commission: fareBreakdown.gstOnCommission,
            driver_earning: fareBreakdown.driverEarning, customer_total: fareBreakdown.customerTotal,
          },
        }),
      });
      const responseData = await res.json();
      if (res.status === 409 && responseData.error === "ACTIVE_RIDE_EXISTS") {
        Alert.alert("Active Booking", "You already have an active booking.", [
          { text: "View Booking", onPress: () => navigation.navigate("FindingDriverScreen", { orderId: String(responseData.activeOrder.id) }) },
          { text: "OK" },
        ]);
        return;
      }
      if (!res.ok) throw new Error(responseData.error || `Server error: ${res.status}`);
      const { id: orderId } = responseData;
      fetch(`${API_BASE_URL}/orders/${orderId}/request`, { method: "POST", headers: { "Content-Type": "application/json" } })
        .then(async (r) => { const d = await r.json().catch(() => ({})); console.log("Driver request:", d.message || r.status); })
        .catch((err) => console.warn("Driver request failed:", err.message));
      if (isScheduled) {
        Alert.alert("Booking Confirmed! ✅",
          `Driver requested for:\n\n📅 ${selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n🕐 ${selectedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
          [{ text: "View History", onPress: () => navigation.navigate("RideHistory") }, { text: "Done", onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.navigate("FindingDriverScreen", {
          orderId: String(orderId), pickup: pickup.location, pickupAddress: pickup.description,
          drop: drop.location, dropAddress: drop.description, routeCoords,
          distance: distanceText, distanceKm: fareBreakdown.distanceKm,
          duration: durationText, durationMinutes: fareBreakdown.durationMinutes,
          customerTotal: fareBreakdown.customerTotal, totalFare: fareBreakdown.customerTotal,
          driverEarning: fareBreakdown.driverEarning, platformEarning: fareBreakdown.totalPlatformEarning,
          vehicleId: "driver", vehicleName: "Professional Driver", paymentMethod: finalPaymentMethod,
        });
      }
    } catch (e) {
      Alert.alert("Booking Failed", e.message || "Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  // ==================== CAR MODAL ====================
  const renderCarModal = () => (
    <Modal visible={showCarModal} animationType="slide" transparent onRequestClose={() => setShowCarModal(false)}>
      <View style={styles.modalOverlay}>
        <Animated.View entering={SlideInUp.springify().damping(18)} style={styles.modalContainer}>

          {/* Modal Header */}
          <LinearGradient colors={GRAD.primary} style={styles.modalHeaderGrad}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="car-sport" size={26} color={C.white} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Vehicle Details</Text>
                  <Text style={styles.modalSubtitle}>Help driver identify your car</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCarModal(false)}>
                <Ionicons name="close" size={20} color={C.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>

            {/* Brand + Model */}
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <SLabel text="Brand *" />
                <TextInput style={styles.formInput} placeholder="e.g. Honda" placeholderTextColor={C.textFaint} value={carBrand} onChangeText={setCarBrand} />
              </View>
              <View style={{ flex: 1 }}>
                <SLabel text="Model *" />
                <TextInput style={styles.formInput} placeholder="e.g. City" placeholderTextColor={C.textFaint} value={carModel} onChangeText={setCarModel} />
              </View>
            </View>

            {/* Reg Number */}
            <SLabel text="Registration Number *" />
            <TextInput style={styles.formInput} placeholder="MH 12 AB 1234" placeholderTextColor={C.textFaint} value={carNumber} onChangeText={setCarNumber} autoCapitalize="characters" />

            {/* Fuel Type */}
            <SLabel text="Fuel Type *" />
            <View style={styles.chipRow}>
              {["Petrol", "Diesel", "CNG", "Electric", "Hybrid"].map((f) => (
                <TouchableOpacity key={f} style={[styles.chip, fuelType === f && styles.chipActive]} onPress={() => setFuelType(f)}>
                  <Text style={[styles.chipText, fuelType === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transmission */}
            <SLabel text="Transmission *" />
            <View style={styles.chipRow}>
              {[{ label: "Manual", icon: "cog-outline" }, { label: "Automatic", icon: "flash-outline" }].map((t) => (
                <TouchableOpacity key={t.label} style={[styles.chipWide, transmission === t.label && styles.chipActive]} onPress={() => setTransmission(t.label)}>
                  <Ionicons name={t.icon} size={16} color={transmission === t.label ? C.white : C.textLight} />
                  <Text style={[styles.chipText, transmission === t.label && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Seats */}
            <SLabel text="Seating Capacity *" />
            <View style={styles.chipRow}>
              {["4", "5", "6", "7", "8+"].map((s) => (
                <TouchableOpacity key={s} style={[styles.chipSm, seats === s && styles.chipActive]} onPress={() => setSeats(s)}>
                  <Text style={[styles.chipText, seats === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <SLabel text="Color (Optional)" />
            <TextInput style={styles.formInput} placeholder="e.g. Pearl White" placeholderTextColor={C.textFaint} value={carColor} onChangeText={setCarColor} />
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalSaveWrap, !carFilled && { opacity: 0.4 }]}
              onPress={() => carFilled && setShowCarModal(false)}
              disabled={!carFilled}
            >
              <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalSaveBtn}>
                <Ionicons name="checkmark-circle" size={20} color={C.white} />
                <Text style={styles.modalSaveBtnText}>
                  {carFilled ? "Save Vehicle Details" : "Fill All Required Fields"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  // ==================== RENDER ====================
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── MAP ── */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.mapLoader}>
            <LinearGradient colors={GRAD.primary} style={styles.mapLoaderCard}>
              <ActivityIndicator size="large" color={C.white} />
              <Text style={styles.mapLoaderText}>Locating you…</Text>
            </LinearGradient>
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
                <PulseDot color={C.violet} size={13} />
              </Marker>
            )}
            {drop && (
              <Marker coordinate={{ latitude: drop.location.lat, longitude: drop.location.lng }}>
                <View style={styles.dropMarker}>
                  <Ionicons name="location" size={16} color={C.white} />
                </View>
              </Marker>
            )}
            {routeCoords.length > 0 && (
              <>
                <Polyline coordinates={routeCoords} strokeColor="rgba(61,43,140,0.15)" strokeWidth={9} />
                <Polyline coordinates={routeCoords} strokeColor={C.violet} strokeWidth={4} lineDashPattern={[0]} />
              </>
            )}
          </MapView>
        )}

        {/* Header */}
        <LinearGradient
          colors={["rgba(61,43,140,0.85)", "transparent"]}
          style={[styles.mapHeaderGrad, { paddingTop: insets.top + SP.sm }]}
        >
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Ionicons name="car-sport" size={18} color={C.goldBright} />
            <Text style={styles.headerTitle}>Hire a Driver</Text>
          </View>

          <TouchableOpacity
            style={styles.headerLocBtn}
            onPress={() => {
              if (currentLocation) {
                mapRef.current?.animateToRegion({
                  latitude: currentLocation.lat + 0.006, longitude: currentLocation.lng,
                  latitudeDelta: 0.025, longitudeDelta: 0.025,
                }, 600);
              }
            }}
          >
            <Ionicons name="locate" size={18} color={C.white} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Route Badge */}
        {(fareBreakdown || loadingRoute) && (
          <View style={styles.routeBadge}>
            {loadingRoute ? (
              <>
                <ActivityIndicator size="small" color={C.violet} />
                <Text style={styles.routeBadgeText}>Calculating route…</Text>
              </>
            ) : fareBreakdown ? (
              <>
                <View style={styles.routeBadgeItem}>
                  <Ionicons name="navigate-outline" size={14} color={C.violet} />
                  <Text style={styles.routeBadgeText}>{distanceText}</Text>
                </View>
                <View style={styles.routeBadgeSep} />
                <View style={styles.routeBadgeItem}>
                  <Ionicons name="time-outline" size={14} color={C.violet} />
                  <Text style={styles.routeBadgeText}>{durationText}</Text>
                </View>
                {(fareBreakdown.isNight || fareBreakdown.isPeak) && (
                  <>
                    <View style={styles.routeBadgeSep} />
                    <LinearGradient
                      colors={fareBreakdown.isNight ? ["#4F46E5", "#6366F1"] : [C.orange, C.goldLight]}
                      style={styles.surgeChip}
                    >
                      <Ionicons name={fareBreakdown.isNight ? "moon" : "flash"} size={11} color={C.white} />
                      <Text style={styles.surgeChipText}>{fareBreakdown.isNight ? "Night" : "Peak"}</Text>
                    </LinearGradient>
                  </>
                )}
              </>
            ) : null}
          </View>
        )}
      </View>

      {/* ── BOTTOM PANEL ── */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle} />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.panelContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── LOCATION CARD ── */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <View style={styles.card}>
              {/* Pickup */}
              <View style={styles.locRow}>
                <View style={styles.locIconCol}>
                  <PulseDot color={C.violet} size={9} />
                  <View style={styles.locConnector} />
                </View>
                <View style={styles.locInputCol}>
                  <Text style={styles.locLabel}>PICKUP</Text>
                  {!pickupEditing && pickup ? (
                    <View style={styles.locValueRow}>
                      <Text style={styles.locValue} numberOfLines={1}>{pickup.description}</Text>
                      <TouchableOpacity onPress={() => setPickupEditing(true)} style={styles.locEditBtn}>
                        <Ionicons name="pencil" size={14} color={C.violet} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <AddressSearch
                        placeholder="Enter pickup location"
                        nearby={currentLocation}
                        onSelect={(loc) => { setPickup(loc); setPickupEditing(false); }}
                        inputStyle={styles.locSearchInput}
                      />
                      {currentLocation && (
                        <TouchableOpacity
                          style={styles.useCurrentBtn}
                          onPress={() => { setPickup({ description: currentAddress, location: currentLocation }); setPickupEditing(false); }}
                        >
                          <Ionicons name="locate" size={15} color={C.violet} />
                          <Text style={styles.useCurrentText}>Use current location</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Divider */}
              <View style={styles.locDivider} />

              {/* Drop */}
              <View style={styles.locRow}>
                <View style={styles.locIconCol}>
                  <View style={styles.dropDot} />
                </View>
                <View style={styles.locInputCol}>
                  <Text style={styles.locLabel}>DROP</Text>
                  <AddressSearch
                    placeholder="Where to?"
                    nearby={pickup?.location || currentLocation}
                    onSelect={setDrop}
                    inputStyle={styles.locSearchInput}
                    defaultText={drop?.description}
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── SCHEDULE CARD ── */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.card}>
              <View style={styles.scheduleRow}>
                <TouchableOpacity
                  style={[styles.scheduleTab, !isScheduled && styles.scheduleTabActive]}
                  onPress={() => setIsScheduled(false)}
                >
                  {!isScheduled && (
                    <LinearGradient colors={GRAD.primary} style={StyleSheet.absoluteFill} borderRadius={R.md} />
                  )}
                  <Ionicons name="flash" size={15} color={!isScheduled ? C.white : C.textLight} />
                  <Text style={[styles.scheduleTabText, !isScheduled && { color: C.white }]}>Ride Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.scheduleTab, isScheduled && styles.scheduleTabActive]}
                  onPress={() => { setIsScheduled(true); setShowDatePicker(true); }}
                >
                  {isScheduled && (
                    <LinearGradient colors={GRAD.primary} style={StyleSheet.absoluteFill} borderRadius={R.md} />
                  )}
                  <Ionicons name="calendar-outline" size={15} color={isScheduled ? C.white : C.textLight} />
                  <Text style={[styles.scheduleTabText, isScheduled && { color: C.white }]}>Schedule</Text>
                </TouchableOpacity>
              </View>

              {isScheduled && (
                <TouchableOpacity style={styles.scheduledTimeRow} onPress={() => setShowDatePicker(true)}>
                  <View style={styles.scheduledTimeLeft}>
                    <LinearGradient colors={GRAD.primary} style={styles.scheduledTimeIcon}>
                      <Ionicons name="calendar" size={14} color={C.white} />
                    </LinearGradient>
                    <View>
                      <Text style={styles.scheduledDateText}>
                        {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </Text>
                      <Text style={styles.scheduledTimeText}>
                        {selectedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.scheduledEditChip}>
                    <Text style={styles.scheduledEditText}>Change</Text>
                    <Ionicons name="chevron-forward" size={13} color={C.violet} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* ── VEHICLE CARD ── */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <TouchableOpacity style={styles.vehicleCard} onPress={() => setShowCarModal(true)} activeOpacity={0.85}>
              <LinearGradient
                colors={carFilled ? GRAD.primary : ["#F1EEFB", "#EEEAFB"]}
                style={styles.vehicleIconWrap}
              >
                <Ionicons name="car-sport" size={22} color={carFilled ? C.white : C.violet} />
              </LinearGradient>

              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleTitle}>
                  {carFilled ? `${carBrand} ${carModel}` : "Add Your Vehicle"}
                </Text>
                <Text style={styles.vehicleSubtitle}>
                  {carFilled ? `${carNumber} • ${fuelType} • ${transmission}` : "Required to book a driver"}
                </Text>
              </View>

              {carFilled ? (
                <View style={styles.vehicleCheckWrap}>
                  <LinearGradient colors={GRAD.green} style={styles.vehicleCheck}>
                    <Ionicons name="checkmark" size={13} color={C.white} />
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.vehicleAddWrap}>
                  <Ionicons name="add-circle" size={28} color={C.violet} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── FARE CARD ── */}
          {fareBreakdown ? (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <View style={styles.fareCard}>
                {/* Fare Header */}
                <LinearGradient colors={GRAD.primary} style={styles.fareHeader}>
                  <View>
                    <Text style={styles.fareHeaderLabel}>Estimated Fare</Text>
                    <View style={styles.fareAmountRow}>
                      <Text style={styles.fareCurrency}>₹</Text>
                      <Text style={styles.fareAmount}>{fareBreakdown.customerTotal}</Text>
                    </View>
                  </View>
                  <View style={styles.fareHeaderRight}>
                    <View style={styles.fareDistBadge}>
                      <Ionicons name="navigate" size={13} color={C.violet} />
                      <Text style={styles.fareDistText}>{fareBreakdown.distanceKm} km</Text>
                    </View>
                    <View style={styles.fareTimeBadge}>
                      <Ionicons name="time" size={13} color={C.violet} />
                      <Text style={styles.fareDistText}>{fareBreakdown.durationMinutes} min</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Breakdown */}
                <View style={styles.fareBody}>
                  {[
                    { label: "Base fare",           value: fareBreakdown.baseFare     },
                    { label: `Distance (${fareBreakdown.distanceKm}km × ₹${PRICING.perKm})`, value: fareBreakdown.distanceFare },
                    { label: `Time (${fareBreakdown.durationMinutes} min)`, value: fareBreakdown.timeFare },
                    { label: "Driver service charge", value: fareBreakdown.driverCharge },
                  ].map((row, i) => (
                    <View key={i} style={styles.fareRow}>
                      <Text style={styles.fareRowLabel}>{row.label}</Text>
                      <Text style={styles.fareRowValue}>₹{row.value}</Text>
                    </View>
                  ))}

                  {fareBreakdown.surgeAmount > 0 && (
                    <View style={styles.fareRow}>
                      <View style={styles.fareRowLabelWrap}>
                        <Ionicons name={fareBreakdown.isNight ? "moon" : "flash"} size={12} color={C.orange} />
                        <Text style={[styles.fareRowLabel, { color: C.orange }]}>
                          {fareBreakdown.isNight ? "Night" : "Peak"} charge
                        </Text>
                      </View>
                      <Text style={[styles.fareRowValue, { color: C.orange }]}>+₹{fareBreakdown.surgeAmount}</Text>
                    </View>
                  )}

                  <View style={styles.fareDivider} />

                  {[
                    { label: "Platform fee", value: fareBreakdown.platformFixedFee },
                    { label: "GST",          value: fareBreakdown.gstOnCommission  },
                  ].map((row, i) => (
                    <View key={i} style={styles.fareRow}>
                      <Text style={styles.fareRowLabel}>{row.label}</Text>
                      <Text style={styles.fareRowValue}>₹{row.value}</Text>
                    </View>
                  ))}

                  {/* Distribution Bar */}
                  <View style={styles.fareDistSection}>
                    <Text style={styles.fareDistTitle}>Fare Distribution</Text>
                    <View style={styles.fareDistBar}>
                      <LinearGradient
                        colors={GRAD.primary}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.fareDistSegment, { flex: fareBreakdown.driverEarning, borderTopLeftRadius: R.sm, borderBottomLeftRadius: R.sm }]}
                      />
                      <View style={[styles.fareDistSegment, { flex: fareBreakdown.totalPlatformEarning, backgroundColor: C.teal }]} />
                      <View style={[styles.fareDistSegment, { flex: fareBreakdown.gstOnCommission || 1, backgroundColor: C.goldLight, borderTopRightRadius: R.sm, borderBottomRightRadius: R.sm }]} />
                    </View>
                    <View style={styles.fareDistLegend}>
                      {[
                        { label: `Driver  ₹${fareBreakdown.driverEarning}`,   color: C.violet },
                        { label: `Platform ₹${fareBreakdown.totalPlatformEarning}`, color: C.teal },
                        { label: `GST ₹${fareBreakdown.gstOnCommission}`,         color: C.goldLight },
                      ].map((leg, i) => (
                        <View key={i} style={styles.fareDistLegendItem}>
                          <View style={[styles.fareDistLegendDot, { backgroundColor: leg.color }]} />
                          <Text style={styles.fareDistLegendText}>{leg.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fareNote}>
                    <Ionicons name="information-circle-outline" size={13} color={C.textFaint} />
                    <Text style={styles.fareNoteText}>Toll, parking & waiting charges extra if applicable</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <View style={styles.fareEmptyCard}>
                <LinearGradient colors={GRAD.primary} style={styles.fareEmptyIcon}>
                  <Ionicons name="calculator" size={22} color={C.white} />
                </LinearGradient>
                <Text style={styles.fareEmptyTitle}>No fare yet</Text>
                <Text style={styles.fareEmptySubtitle}>Select pickup & drop to see fare estimate</Text>
              </View>
            </Animated.View>
          )}

          {/* ── FEATURES ROW ── */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={styles.featuresRow}>
              {[
                { icon: "shield-checkmark", label: "Verified",    bg: C.primarySoft, color: C.violet  },
                { icon: "star",             label: "4.8+ Rated",  bg: C.goldSoft,    color: C.gold    },
                { icon: "time-outline",     label: "On Time",     bg: C.pastelBlue,  color: C.blueAccent },
                { icon: "lock-closed",      label: "Safe Ride",   bg: C.pastelGreen, color: C.green   },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                    <Ionicons name={f.icon} size={17} color={f.color} />
                  </View>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── PAYMENT METHOD ── */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentRow}>
              {/* Cash */}
              <TouchableOpacity
                style={[styles.paymentCard, paymentMethod === "cash" && styles.paymentCardActive]}
                onPress={() => setPaymentMethod("cash")}
                activeOpacity={0.85}
              >
                {paymentMethod === "cash" && (
                  <LinearGradient colors={["#FFF7ED", "#FFEDD5"]} style={StyleSheet.absoluteFill} borderRadius={R.lg} />
                )}
                <Ionicons name="cash-outline" size={22} color={paymentMethod === "cash" ? C.orange : C.textLight} />
                <Text style={[styles.paymentCardLabel, paymentMethod === "cash" && { color: C.orange }]}>Cash</Text>
                {paymentMethod === "cash" && (
                  <View style={[styles.paymentCheck, { backgroundColor: C.orange }]}>
                    <Ionicons name="checkmark" size={10} color={C.white} />
                  </View>
                )}
              </TouchableOpacity>

              {/* UPI */}
              <TouchableOpacity
                style={[styles.paymentCard, paymentMethod === "upi" && styles.paymentCardActiveViolet]}
                onPress={() => setPaymentMethod("upi")}
                activeOpacity={0.85}
              >
                {paymentMethod === "upi" && (
                  <LinearGradient colors={[C.primarySoft, C.lavenderBg]} style={StyleSheet.absoluteFill} borderRadius={R.lg} />
                )}
                <Ionicons name="phone-portrait-outline" size={22} color={paymentMethod === "upi" ? C.violet : C.textLight} />
                <Text style={[styles.paymentCardLabel, paymentMethod === "upi" && { color: C.violet }]}>UPI / Online</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
                {paymentMethod === "upi" && (
                  <View style={[styles.paymentCheck, { backgroundColor: C.violet }]}>
                    <Ionicons name="checkmark" size={10} color={C.white} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {paymentMethod === "upi" && (
              <View style={styles.paymentBenefitRow}>
                <Ionicons name="shield-checkmark" size={14} color={C.violet} />
                <Text style={styles.paymentBenefitText}>Secure payment • No change hassle • Instant receipt</Text>
              </View>
            )}
            {paymentMethod === "cash" && fareBreakdown && (
              <View style={styles.cashInfoRow}>
                <Ionicons name="information-circle" size={14} color={C.orange} />
                <Text style={styles.cashInfoText}>
                  Pay ₹{fareBreakdown.customerTotal} cash to driver at end of trip.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ── BOOK BUTTON ── */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={{ marginTop: SP.lg }}>
            <TouchableOpacity
              style={[styles.bookBtnWrap, (!canBook || booking) && { opacity: 0.5 }]}
              onPress={handleBook}
              disabled={!canBook || booking}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={canBook && !booking ? GRAD.primaryDeep : ["#9CA3AF", "#9CA3AF"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.bookBtn}
              >
                {booking ? (
                  <View style={styles.bookBtnLoading}>
                    <ActivityIndicator color={C.white} size="small" />
                    <Text style={styles.bookBtnText}>Finding Driver…</Text>
                  </View>
                ) : (
                  <View style={styles.bookBtnContent}>
                    <Text style={styles.bookBtnText}>
                      {fareBreakdown ? `Book Driver  •  ₹${fareBreakdown.customerTotal}` : "Book Driver"}
                    </Text>
                    <View style={styles.bookBtnBadge}>
                      <Ionicons name={paymentMethod === "cash" ? "cash-outline" : "phone-portrait-outline"} size={11} color={C.goldBright} />
                      <Text style={styles.bookBtnBadgeText}>{paymentMethod === "cash" ? "Pay Cash" : "Pay Online"}</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Vehicle warning */}
            {!carFilled && (
              <TouchableOpacity style={styles.vehicleWarning} onPress={() => setShowCarModal(true)}>
                <Ionicons name="alert-circle" size={18} color={C.orange} />
                <Text style={styles.vehicleWarningText}>Vehicle details required to book</Text>
                <Ionicons name="chevron-forward" size={15} color={C.orange} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* ── DATE/TIME PICKERS ── */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate} mode="date"
          minimumDate={new Date()}
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) { setSelectedDate(d); setTimeout(() => setShowTimePicker(true), 400); }
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate} mode="time"
          onChange={(e, d) => { setShowTimePicker(false); if (d) setSelectedDate(d); }}
        />
      )}

      {/* ── CAR MODAL ── */}
      {renderCarModal()}

      {/* ── BOOKING OVERLAY ── */}
      {booking && (
        <View style={styles.bookingOverlay}>
          <View style={styles.bookingCard}>
            <LinearGradient colors={GRAD.primary} style={styles.bookingIconWrap}>
              <ActivityIndicator size="large" color={C.white} />
            </LinearGradient>
            <Text style={styles.bookingTitle}>Finding Your Driver</Text>
            <Text style={styles.bookingSubtitle}>Connecting you with verified professionals…</Text>
            <View style={styles.bookingProgressTrack}>
              <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookingProgressBar} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Map
  mapContainer: { height: height * 0.38, backgroundColor: C.primarySoft },
  mapLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapLoaderCard: { padding: SP.xxl, borderRadius: R.xl, alignItems: "center", gap: SP.md },
  mapLoaderText: { fontSize: 14, fontWeight: "600", color: C.white, marginTop: SP.sm },

  // Map header
  mapHeaderGrad: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: SP.lg, paddingBottom: SP.xxl,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row", alignItems: "center", gap: SP.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: SP.lg, paddingVertical: SP.sm,
    borderRadius: R.full,
  },
  headerTitle:  { fontSize: 15, fontWeight: "800", color: C.white, letterSpacing: -0.2 },
  headerLocBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },

  // Markers
  dropMarker: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.red,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2.5, borderColor: C.white,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },

  // Route Badge
  routeBadge: {
    position: "absolute", bottom: 16, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: SP.sm,
    backgroundColor: C.white, paddingHorizontal: SP.lg, paddingVertical: SP.sm + 2,
    borderRadius: R.full,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  routeBadgeItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  routeBadgeText: { fontSize: 13, fontWeight: "700", color: C.textDark },
  routeBadgeSep:  { width: 1, height: 16, backgroundColor: C.border },
  surgeChip: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full,
  },
  surgeChipText: { fontSize: 11, fontWeight: "700", color: C.white },

  // Bottom Panel
  bottomPanel: {
    flex: 1, backgroundColor: C.white,
    borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    marginTop: -R.xxl,
    shadowColor: C.violet, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10,
  },
  panelHandle: {
    width: 42, height: 5, borderRadius: 3, backgroundColor: C.border,
    alignSelf: "center", marginTop: SP.md, marginBottom: SP.sm,
  },
  panelContent: { paddingHorizontal: SP.lg, paddingTop: SP.sm },

  // Card
  card: {
    backgroundColor: C.white, borderRadius: R.xl,
    padding: SP.lg, marginBottom: SP.md,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  // Location
  locRow:      { flexDirection: "row", alignItems: "flex-start" },
  locIconCol:  { width: 28, alignItems: "center", paddingTop: 4 },
  locConnector:{ width: 2, flex: 1, backgroundColor: C.primarySoft, marginVertical: 4, borderRadius: 1, minHeight: 24 },
  dropDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: C.red,
    borderWidth: 2.5, borderColor: "#FEE2E2",
  },
  locInputCol:  { flex: 1, marginLeft: SP.md },
  locLabel:     { fontSize: 9, fontWeight: "800", color: C.textFaint, letterSpacing: 1.2, marginBottom: 4 },
  locValueRow:  { flexDirection: "row", alignItems: "center" },
  locValue:     { flex: 1, fontSize: 15, fontWeight: "700", color: C.textDark, paddingVertical: SP.sm },
  locEditBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center",
  },
  locSearchInput: { fontSize: 15, fontWeight: "600", color: C.textDark, paddingVertical: SP.sm },
  locDivider:   { height: 1, backgroundColor: C.border, marginVertical: SP.sm, marginLeft: 28 + SP.md },
  useCurrentBtn:{ flexDirection: "row", alignItems: "center", gap: SP.sm, paddingVertical: SP.sm, marginTop: 2 },
  useCurrentText:{ fontSize: 13, fontWeight: "600", color: C.violet },

  // Schedule
  scheduleRow: { flexDirection: "row", gap: SP.sm },
  scheduleTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SP.sm, paddingVertical: SP.md, borderRadius: R.md,
    backgroundColor: C.surface, overflow: "hidden",
  },
  scheduleTabActive: {},
  scheduleTabText: { fontSize: 14, fontWeight: "700", color: C.textLight },
  scheduledTimeRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: SP.md, paddingTop: SP.md, borderTopWidth: 1, borderTopColor: C.border,
  },
  scheduledTimeLeft: { flexDirection: "row", alignItems: "center", gap: SP.md },
  scheduledTimeIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
  },
  scheduledDateText: { fontSize: 14, fontWeight: "700", color: C.textDark },
  scheduledTimeText: { fontSize: 12, color: C.textLight, marginTop: 2 },
  scheduledEditChip: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: C.primarySoft, paddingHorizontal: SP.sm, paddingVertical: 4, borderRadius: R.full,
  },
  scheduledEditText: { fontSize: 12, fontWeight: "700", color: C.violet },

  // Vehicle
  vehicleCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, padding: SP.lg, borderRadius: R.xl, marginBottom: SP.md,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  vehicleIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  vehicleInfo:     { flex: 1, marginLeft: SP.md },
  vehicleTitle:    { fontSize: 15, fontWeight: "700", color: C.textDark },
  vehicleSubtitle: { fontSize: 12, color: C.textLight, marginTop: 3 },
  vehicleCheckWrap:{ },
  vehicleCheck:    { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  vehicleAddWrap:  { },

  // Fare
  fareCard: {
    backgroundColor: C.white, borderRadius: R.xl, marginBottom: SP.md,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  fareHeader: { padding: SP.xl, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fareHeaderLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  fareAmountRow:   { flexDirection: "row", alignItems: "baseline" },
  fareCurrency:    { fontSize: 22, fontWeight: "700", color: C.white },
  fareAmount:      { fontSize: 38, fontWeight: "900", color: C.white, marginLeft: 2, letterSpacing: -1 },
  fareHeaderRight: { gap: SP.sm },
  fareDistBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full,
  },
  fareTimeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full,
  },
  fareDistText: { fontSize: 12, fontWeight: "700", color: C.white },
  fareBody:     { padding: SP.lg },
  fareRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  fareRowLabelWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  fareRowLabel: { fontSize: 13, color: C.textMid },
  fareRowValue: { fontSize: 13, fontWeight: "700", color: C.textDark },
  fareDivider:  { height: 1, backgroundColor: C.border, marginVertical: SP.sm },
  fareDistSection: { marginTop: SP.md, paddingTop: SP.md, borderTopWidth: 1, borderTopColor: C.border },
  fareDistTitle:   { fontSize: 11, fontWeight: "700", color: C.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: SP.sm },
  fareDistBar:     { flexDirection: "row", height: 8, borderRadius: R.sm, overflow: "hidden", marginBottom: SP.sm },
  fareDistSegment: { height: "100%" },
  fareDistLegend:  { flexDirection: "row", flexWrap: "wrap", gap: SP.md },
  fareDistLegendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  fareDistLegendDot:  { width: 8, height: 8, borderRadius: 4 },
  fareDistLegendText: { fontSize: 11, color: C.textLight, fontWeight: "500" },
  fareNote: { flexDirection: "row", alignItems: "center", gap: SP.sm, marginTop: SP.md, paddingTop: SP.md, borderTopWidth: 1, borderTopColor: C.border },
  fareNoteText: { fontSize: 11, color: C.textFaint, flex: 1 },
  fareEmptyCard: {
    backgroundColor: C.white, borderRadius: R.xl, padding: SP.xxl, alignItems: "center",
    marginBottom: SP.md, borderWidth: 1, borderColor: C.border,
  },
  fareEmptyIcon:     { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: SP.md },
  fareEmptyTitle:    { fontSize: 15, fontWeight: "700", color: C.textDark, marginBottom: 4 },
  fareEmptySubtitle: { fontSize: 13, color: C.textLight, textAlign: "center" },

  // Features
  featuresRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SP.lg },
  featureItem: { alignItems: "center", flex: 1 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginBottom: SP.sm },
  featureLabel:{ fontSize: 11, fontWeight: "600", color: C.textMid, textAlign: "center" },

  // Section title
  sectionTitle: { fontSize: 15, fontWeight: "800", color: C.textDark, marginBottom: SP.md, letterSpacing: -0.2 },

  // Payment
  paymentRow: { flexDirection: "row", gap: SP.md, marginBottom: SP.sm },
  paymentCard: {
    flex: 1, alignItems: "center", paddingVertical: SP.lg, paddingHorizontal: SP.md,
    borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.white, overflow: "hidden", position: "relative",
  },
  paymentCardActive:       { borderColor: C.orange },
  paymentCardActiveViolet: { borderColor: C.violet },
  paymentCardLabel: { fontSize: 13, fontWeight: "700", color: C.textLight, marginTop: SP.sm },
  paymentCheck: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: "center", alignItems: "center",
  },
  recommendedBadge: {
    backgroundColor: C.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: R.xs, marginTop: SP.xs,
  },
  recommendedText: { fontSize: 7, fontWeight: "800", color: C.violet, letterSpacing: 0.5 },
  paymentBenefitRow: {
    flexDirection: "row", alignItems: "center", gap: SP.sm,
    backgroundColor: C.primarySoft, paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderRadius: R.sm, marginTop: 2,
  },
  paymentBenefitText: { fontSize: 12, color: C.violet, fontWeight: "500", flex: 1 },
  cashInfoRow: {
    flexDirection: "row", alignItems: "center", gap: SP.sm,
    backgroundColor: "#FFF7ED", paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderRadius: R.sm, marginTop: 2,
  },
  cashInfoText: { fontSize: 12, color: C.orange, fontWeight: "500", flex: 1 },

  // Book Button
  bookBtnWrap:   { borderRadius: R.xl, overflow: "hidden", marginBottom: SP.sm },
  bookBtn:       { paddingVertical: SP.lg + 4, alignItems: "center", justifyContent: "center" },
  bookBtnContent:{ alignItems: "center" },
  bookBtnLoading:{ flexDirection: "row", alignItems: "center", gap: SP.md },
  bookBtnText:   { fontSize: 17, fontWeight: "800", color: C.white, letterSpacing: -0.3 },
  bookBtnBadge:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3, opacity: 0.8 },
  bookBtnBadgeText: { fontSize: 11, color: C.goldBright, fontWeight: "600" },
  vehicleWarning: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFF7ED", paddingVertical: SP.sm, paddingHorizontal: SP.md,
    borderRadius: R.lg, gap: SP.sm,
    borderWidth: 1, borderColor: "#FED7AA",
  },
  vehicleWarningText: { flex: 1, fontSize: 13, fontWeight: "600", color: C.orange },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  modalContainer: { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, maxHeight: height * 0.88, overflow: "hidden" },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)", alignSelf: "center", marginTop: SP.md, marginBottom: SP.sm },
  modalHeaderGrad:{ paddingHorizontal: SP.lg, paddingBottom: SP.lg },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalHeaderLeft:{ flexDirection: "row", alignItems: "center", gap: SP.md },
  modalIconWrap:  { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  modalTitle:     { fontSize: 18, fontWeight: "800", color: C.white },
  modalSubtitle:  { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  modalCloseBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  modalScroll:    { paddingHorizontal: SP.lg, paddingTop: SP.lg, paddingBottom: SP.lg },
  modalFooter:    { paddingHorizontal: SP.lg, paddingTop: SP.md, paddingBottom: Platform.OS === "ios" ? 40 : SP.xl, borderTopWidth: 1, borderTopColor: C.border },
  modalSaveWrap:  { borderRadius: R.xl, overflow: "hidden" },
  modalSaveBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SP.sm, paddingVertical: SP.lg },
  modalSaveBtnText:{ fontSize: 16, fontWeight: "700", color: C.white },

  // Form
  sLabel:   { fontSize: 12, fontWeight: "700", color: C.textMid, marginTop: SP.lg, marginBottom: SP.sm, letterSpacing: 0.2 },
  formRow:  { flexDirection: "row", gap: SP.md },
  formInput:{
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md + 2,
    fontSize: 15, fontWeight: "600", color: C.textDark, borderWidth: 1.5, borderColor: C.border, marginBottom: SP.xs,
  },
  chipRow:  { flexDirection: "row", flexWrap: "wrap", gap: SP.sm, marginBottom: SP.xs },
  chip:     { paddingHorizontal: SP.lg, paddingVertical: SP.md, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  chipWide: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SP.sm, paddingVertical: SP.md, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  chipSm:   { paddingHorizontal: SP.md, paddingVertical: SP.sm + 2, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  chipActive:    { backgroundColor: C.violet, borderColor: C.violet },
  chipText:      { fontSize: 13, fontWeight: "600", color: C.textLight },
  chipTextActive:{ color: C.white },

  // Booking overlay
  bookingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: C.overlay, justifyContent: "center", alignItems: "center", paddingHorizontal: SP.xxl },
  bookingCard:    { width: "100%", backgroundColor: C.white, borderRadius: R.xxl, paddingVertical: SP.xxxl, paddingHorizontal: SP.xl, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 15 },
  bookingIconWrap:{ width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: SP.xl },
  bookingTitle:   { fontSize: 20, fontWeight: "800", color: C.textDark, marginBottom: SP.sm, letterSpacing: -0.3 },
  bookingSubtitle:{ fontSize: 14, color: C.textLight, textAlign: "center", marginBottom: SP.xl, lineHeight: 20 },
  bookingProgressTrack: { width: "100%", height: 4, backgroundColor: C.border, borderRadius: 2, overflow: "hidden" },
  bookingProgressBar:   { width: "65%", height: "100%", borderRadius: 2 },
});