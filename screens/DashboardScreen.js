// screens/DashboardScreen.js
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
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { getDirections } from "../lib/directions";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const CHARCOAL = "#1C1C1E";
const CANVAS = "#F7F7F8";
const MUTED = "#6B7280";
const CARD_BG = "#FFFFFF";

const HUBS = [
  { id: 1, name: "Hub A", lat: 18.5204, lng: 73.8567 },
  { id: 2, name: "Hub B", lat: 18.5312, lng: 73.845 },
  { id: 3, name: "Hub C", lat: 18.5055, lng: 73.8652 },
  { id: 4, name: "Hub D", lat: 18.5511, lng: 73.9416 },
];

const VEHICLES = [
  { id: "sedan", name: "Sedan", icon: require("../assets/icons/sedan.png") },
  {
    id: "hatch",
    name: "Hatchback",
    icon: require("../assets/icons/hatchback.png"),
  },
  { id: "suv", name: "SUV", icon: require("../assets/icons/suv.png") },
];

const PACKAGES = [
  {
    id: "basic",
    name: "Basic Wash",
    desc: "Exterior rinse & wipe",
    price: 399,
    etaMin: 60,
  },
  {
    id: "deluxe",
    name: "Deluxe Wash",
    desc: "Body wash, wheels & interior vacuum",
    price: 699,
    etaMin: 90,
  },
  {
    id: "foam",
    name: "Foam Wash",
    desc: "Snow foam + detailed cleaning",
    price: 899,
    etaMin: 120,
  },
  {
    id: "superDeluxe",
    name: "Super Deluxe Wash",
    desc: "Full body care + polish",
    price: 1200,
    etaMin: 120,
  },
];

// Calm, neutral map style
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9e3ff" }],
  },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const StepContainer = ({ stepKey, children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [stepKey]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>
      {children}
    </Animated.View>
  );
};

export default function DashboardScreen({ navigation }) {
  const [region, setRegion] = useState(null); // { lat, lng }
  const [nearestHub, setNearestHub] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null); // "10.2 km"
  const [duration, setDuration] = useState(null); // "25 mins"
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [step, setStep] = useState("vehicle"); // "vehicle" | "package"
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["22%", "45%", "78%"], []);
  const { height } = Dimensions.get("window");

  // Pulsing FAB animation
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const usePressScale = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () =>
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        friction: 7,
        tension: 90,
      }).start();
    const onPressOut = () =>
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 90,
      }).start();
    return { scale, onPressIn, onPressOut };
  };

  // Get user location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        setLoadingLocation(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const baseRegion = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setRegion(baseRegion);
        setLoadingLocation(false);
      } catch (e) {
        console.log(e);
        setLoadingLocation(false);
      }
    })();
  }, []);

  // Find nearest hub whenever region changes
  const computeNearestHub = useCallback(async () => {
    if (!region) return;

    // Select nearest hub using simple distance
    const nearest = HUBS.reduce(
      (prev, curr) => {
        const dist = Math.sqrt(
          Math.pow(region.lat - curr.lat, 2) + Math.pow(region.lng - curr.lng, 2)
        );
        return dist < prev.dist ? { hub: curr, dist } : prev;
      },
      { hub: null, dist: Infinity }
    ).hub;

    if (!nearest) return;

    setNearestHub(nearest);
    bottomSheetRef.current?.snapToIndex(1); // mid-open sheet

    // Fetch route for distance/duration and road path
    try {
      setLoadingRoute(true);
      const data = await getDirections(
        { lat: region.lat, lng: region.lng },
        { lat: nearest.lat, lng: nearest.lng }
      );
      if (data) {
        setRouteCoords(data.coords || []);
        setDistance(data.distance || null);
        setDuration(data.duration || null);
      }
    } catch (e) {
      console.log("Route error", e);
    } finally {
      setLoadingRoute(false);
    }
  }, [region]);

  // Run nearest hub logic when region ready
  useEffect(() => {
    if (!region) return;
    computeNearestHub();
  }, [region, computeNearestHub]);

  const PrimaryGradientButton = ({ label, onPress, icon }) => {
    const { scale, onPressIn, onPressOut } = usePressScale();
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
        >
          <LinearGradient
            colors={[ORANGE_LIGHT, ORANGE]}
            style={styles.gradientBtn}
          >
            {icon && (
              <Ionicons
                name={icon}
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.gradientText}>{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const VehicleCard = ({ v, active, onPress }) => {
    const { scale, onPressIn, onPressOut } = usePressScale();
    return (
      <AnimatedTouchable
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[
          styles.vehicleListCard,
          active && styles.activeVehicleList,
          { transform: [{ scale }] },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={v.icon} style={styles.vehicleListImg} />
          <Text style={styles.vehicleListName}>{v.name}</Text>
        </View>
        {active && (
          <Ionicons name="checkmark-circle" size={22} color={ORANGE} />
        )}
      </AnimatedTouchable>
    );
  };

  const minutesToHuman = (min) => {
    if (!min && min !== 0) return "";
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  const PackageCard = ({ pkg, active, onPress }) => {
    const { scale, onPressIn, onPressOut } = usePressScale();
    return (
      <AnimatedTouchable
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[
          styles.packageCard,
          active && styles.packageActive,
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.packageInner}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.pkgTitle}>{pkg.name}</Text>
            <Text style={styles.pkgDesc}>{pkg.desc}</Text>
            <Text style={styles.pkgTime}>
              Duration: {minutesToHuman(pkg.etaMin)}
            </Text>
          </View>
          <LinearGradient
            colors={[ORANGE_LIGHT, ORANGE]}
            style={styles.pricePill}
          >
            <Text style={styles.priceText}>₹{pkg.price}</Text>
          </LinearGradient>
        </View>
      </AnimatedTouchable>
    );
  };

  // FINAL SHEET CONTENT
  const renderSheetContent = () => {
    // Show small loader text if nearest hub still not resolved
    if (!nearestHub || loadingRoute) {
      return (
        <StepContainer stepKey="loading">
          <Text style={styles.sheetTitle}>Setting up your wash</Text>
          <Text style={styles.stepSub}>
            Finding the closest wash hub and estimating travel time…
          </Text>
          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ActivityIndicator color={ORANGE} />
            <Text style={{ marginLeft: 8, color: MUTED }}>
              Please wait a moment
            </Text>
          </View>
        </StepContainer>
      );
    }

    if (step === "vehicle") {
      return (
        <StepContainer stepKey="vehicle">
          <Text style={styles.sheetTitle}>Select your vehicle</Text>
          <Text style={styles.stepSub}>
            We’ll customise the wash based on car size.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: height * 0.35, marginTop: 8 }}
          >
            {VEHICLES.map((v) => (
              <VehicleCard
                key={v.id}
                v={v}
                active={selectedVehicle === v.id}
                onPress={() => setSelectedVehicle(v.id)}
              />
            ))}
          </ScrollView>

          {selectedVehicle && (
            <PrimaryGradientButton
              label="Continue to Packages"
              icon="arrow-forward"
              onPress={() => setStep("package")}
            />
          )}
        </StepContainer>
      );
    }

    if (step === "package") {
      const activePkg = PACKAGES.find((p) => p.id === selectedPackage);
      const kmValue =
        distance && distance.includes("km") ? parseFloat(distance) : 0;
      const dynamicPrice = activePkg
        ? activePkg.price + kmValue * 5 // small distance component
        : null;

      return (
        <StepContainer stepKey="package">
          <View style={styles.sheetHeaderRow}>
            <TouchableOpacity
              style={styles.backPill}
              onPress={() => setStep("vehicle")}
            >
              <Ionicons name="chevron-back" size={16} color={ORANGE} />
              <Text style={styles.backPillText}>Change vehicle</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetTitle}>Choose a wash package</Text>
          <Text style={styles.stepSub}>
            Car Wash • Nearest hub selected automatically.
          </Text>

          <View style={{ height: 8 }} />
          {PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              active={selectedPackage === pkg.id}
              onPress={() => setSelectedPackage(pkg.id)}
            />
          ))}

          {activePkg && (
            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>Estimated Total</Text>
              <Text style={styles.estimateValue}>
                ₹{dynamicPrice.toLocaleString("en-IN")}
              </Text>
              {distance && (
                <Text style={styles.estimateMeta}>
                  Includes hub distance ({distance}) + wash time (
                  {minutesToHuman(activePkg.etaMin)})
                </Text>
              )}
            </View>
          )}

          {selectedPackage && (
            <PrimaryGradientButton
              label="View full quotation"
              icon="cash-outline"
              onPress={() => {
                const pkg = activePkg;
                const finalPrice = dynamicPrice ?? pkg.price;

                navigation.navigate("QuotationPage", {
                  order: buildOrderObject(),
                });
              }}
            />
          )}
        </StepContainer>
      );
    }

    // fallback (should not reach)
    return null;
  };
const buildOrderObject = () => {
  const activePkg = PACKAGES.find((p) => p.id === selectedPackage);
  const kmValue =
    distance && distance.includes("km") ? parseFloat(distance) : 0;

  const finalPrice = activePkg
    ? activePkg.price + kmValue * 5
    : 0;

  return {
    service_type: "car_wash",

    location: {
      lat: region?.lat,
      lng: region?.lng,
    },

    hub: {
      id: nearestHub?.id,
      name: nearestHub?.name,
      lat: nearestHub?.lat,
      lng: nearestHub?.lng,
    },

    vehicle: {
      id: selectedVehicle,
      name:
        VEHICLES.find((v) => v.id === selectedVehicle)?.name || "",
    },

    package: {
      id: activePkg?.id,
      name: activePkg?.name,
      description: activePkg?.desc,
      base_price: activePkg?.price,
      eta_min: activePkg?.etaMin,
    },

    route: {
      distance,   // "10.2 km"
      duration,   // "25 mins"
    },

    pricing: {
      distance_charge: kmValue * 5,
      total: finalPrice,
      currency: "INR",
    },

    address: null, // 🔴 will be added in QuotationPage

    created_at: new Date().toISOString(),
  };
};

  return (
    <View style={{ flex: 1, backgroundColor: CANVAS }}>
      {loadingLocation || !region ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={{ marginTop: 8, color: MUTED }}>Locating you…</Text>
        </View>
      ) : (
        <>
          {/* MAP AREA */}
          <View style={{ flex: 1 }}>
            <MapView
              style={{ flex: 1 }}
              customMapStyle={MAP_STYLE}
              initialRegion={{
                latitude: region.lat,
                longitude: region.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* USER MARKER ONLY */}
              <Marker
                coordinate={{
                  latitude: region.lat,
                  longitude: region.lng,
                }}
                title="Your car location"
              >
                <Ionicons name="car-sport" size={32} color={ORANGE} />
              </Marker>

              {/* ROAD PATH to nearest hub (hub marker hidden) */}
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={ORANGE}
                  strokeWidth={4}
                />
              )}
            </MapView>

            {/* MAP OVERLAY HEADER */}
            <View style={styles.mapOverlay}>
              <View>
                <Text style={styles.mapTitle}>Car Wash Booking</Text>
                <Text style={styles.mapSub}>
                  Nearest wash hub auto-selected based on your location.
                </Text>
                {nearestHub && distance && duration && (
                  <Text style={styles.mapMeta}>
                    {nearestHub.name} • {distance} • {duration}
                  </Text>
                )}
              </View>
            </View>

            {/* Floating FAB to recalc nearest hub */}
            <Animated.View
              style={[
                styles.fabWrap,
                { transform: [{ scale: pulse }] },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={computeNearestHub}
              >
                <LinearGradient
                  colors={[ORANGE_LIGHT, ORANGE]}
                  style={styles.fab}
                >
                  <Ionicons name="locate" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* BOTTOM SHEET FLOW */}
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={{ backgroundColor: "rgba(0,0,0,0.16)" }}
          >
            <BottomSheetView style={styles.sheetContent}>
              {renderSheetContent()}
            </BottomSheetView>
          </BottomSheet>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CANVAS,
  },

  // Map overlay
  mapOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: CHARCOAL,
  },
  mapSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  mapMeta: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },

  // Bottom sheet
  sheetBackground: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 5,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: CHARCOAL,
  },
  stepSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
  },

  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 6,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "#FFF4E8",
    alignSelf: "flex-start",
  },
  backPillText: {
    fontSize: 11,
    color: ORANGE,
    marginLeft: 4,
    fontWeight: "600",
  },

  // Vehicle list
  vehicleListCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  activeVehicleList: {
    borderColor: ORANGE,
    backgroundColor: "#FFF4E8",
  },
  vehicleListImg: {
    width: 56,
    height: 42,
    resizeMode: "contain",
    marginRight: 10,
  },
  vehicleListName: {
    fontSize: 14,
    fontWeight: "700",
    color: CHARCOAL,
  },

  // Package cards
  packageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  packageActive: {
    borderColor: ORANGE,
    backgroundColor: "#FFF4E8",
  },
  packageInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pkgTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: CHARCOAL,
  },
  pkgDesc: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  pkgTime: {
    fontSize: 11,
    color: "#059669",
    marginTop: 2,
  },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    minWidth: 70,
    alignItems: "center",
  },
  priceText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  // Estimate section
  estimateBox: {
    marginTop: 12,
    backgroundColor: "#ecfeff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#a5f3fc",
  },
  estimateLabel: {
    fontSize: 12,
    color: "#0e7490",
  },
  estimateValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f766e",
    marginTop: 4,
  },
  estimateMeta: {
    fontSize: 11,
    color: "#0e7490",
    marginTop: 4,
  },

  // Primary button
  gradientBtn: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  gradientText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // FAB
  fabWrap: {
    position: "absolute",
    right: 16,
    bottom: 140,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
