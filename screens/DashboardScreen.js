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
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getDirections } from "../lib/directions";
import ScreenWrapper from "../components/ScreenWrapper";

const { width, height } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  primaryDark: "#008F5B",
  primaryBg: "rgba(0, 168, 107, 0.08)",
  primaryBgStrong: "rgba(0, 168, 107, 0.15)",

  secondary: "#3B82F6",
  accent: "#F59E0B",

  white: "#FFFFFF",
  background: "#F5F6F8",
  cardBg: "#FFFFFF",
  surface: "#F9FAFB",
  divider: "#E5E7EB",
  border: "#E0E0E0",

  textDark: "#111111",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",

  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",

  ctaBlack: "#111111",
  shadow: "#000000",
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 100,
};

// ==================== PRICING CONFIG ====================
const PRICING = {
  perKmRate: 8, // ₹8 per km
  peakHourMultiplier: 1.2, // 20% extra during peak hours
  taxRate: 0.18, // 18% GST
  convenienceFee: 29,
  minDistance: 2, // Minimum 2 km charge
};

// ==================== DATA ====================
const HUBS = [
  { id: 1, name: "SparkleWash Central", lat: 18.5204, lng: 73.8567, rating: 4.8, address: "MG Road, Pune" },
  { id: 2, name: "CleanRide Hub", lat: 18.5312, lng: 73.845, rating: 4.6, address: "FC Road, Pune" },
  { id: 3, name: "AutoShine Express", lat: 18.5055, lng: 73.8652, rating: 4.9, address: "Koregaon Park, Pune" },
  { id: 4, name: "PremiumWash Pro", lat: 18.5511, lng: 73.9416, rating: 4.7, address: "Viman Nagar, Pune" },
];

const VEHICLES = [
  {
    id: "hatch",
    name: "Hatchback",
    subtitle: "Swift, i10, Polo, etc.",
    icon: require("../assets/icons/hatchback.png"),
    multiplier: 1.0,
  },
  {
    id: "sedan",
    name: "Sedan",
    subtitle: "City, Verna, Ciaz, etc.",
    icon: require("../assets/icons/sedan.png"),
    popular: true,
    multiplier: 1.15,
  },
  {
    id: "suv",
    name: "SUV / MUV",
    subtitle: "Creta, Seltos, Innova, etc.",
    icon: require("../assets/icons/suv.png"),
    multiplier: 1.35,
  },
];

const PACKAGES = [
  {
    id: "basic",
    name: "Basic Wash",
    desc: "Exterior rinse & wipe",
    basePrice: 299,
    etaMin: 45,
    icon: "water-outline",
    features: ["Exterior wash", "Tyre cleaning", "Window wipe"],
  },
  {
    id: "deluxe",
    name: "Deluxe Wash",
    desc: "Full body + interior vacuum",
    basePrice: 549,
    etaMin: 75,
    icon: "sparkles-outline",
    popular: true,
    features: ["Everything in Basic", "Interior vacuum", "Dashboard polish", "Air freshener"],
  },
  {
    id: "foam",
    name: "Foam Wash",
    desc: "Snow foam + ceramic coating",
    basePrice: 799,
    etaMin: 90,
    icon: "cloudy-outline",
    features: ["Everything in Deluxe", "Snow foam treatment", "Ceramic spray coating", "Alloy cleaning"],
  },
  {
    id: "premium",
    name: "Premium Care",
    desc: "Complete detailing + polish",
    basePrice: 1299,
    etaMin: 120,
    icon: "diamond-outline",
    premium: true,
    features: ["Everything in Foam", "Full body polish", "Engine bay cleaning", "Leather conditioning", "Scratch removal"],
  },
];

// ==================== MAP STYLE ====================
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e4f4" }] },
];

// ==================== MAIN COMPONENT ====================
export default function DashboardScreen({ navigation }) {
  // States
  const [region, setRegion] = useState(null);
  const [nearestHub, setNearestHub] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [distanceValue, setDistanceValue] = useState(0); // numeric km value
  const [durationValue, setDurationValue] = useState(0); // numeric minutes value
  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [step, setStep] = useState("vehicle");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Refs
  const bottomSheetRef = useRef(null);
  const mapRef = useRef(null);
  const snapPoints = useMemo(() => ["28%", "55%", "90%"], []);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  // Get Location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setRegion({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
        setLoading(false);
      } catch (e) {
        console.log("Location error:", e);
        setRegion({ lat: 18.5204, lng: 73.8567 });
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  // Parse distance string to number
  const parseDistance = (distStr) => {
    if (!distStr) return 0;
    const match = distStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Parse duration string to minutes
  const parseDuration = (durStr) => {
    if (!durStr) return 0;
    const hours = durStr.match(/(\d+)\s*h/);
    const mins = durStr.match(/(\d+)\s*min/);
    let total = 0;
    if (hours) total += parseInt(hours[1]) * 60;
    if (mins) total += parseInt(mins[1]);
    return total || parseInt(durStr) || 0;
  };

  // Check if peak hours (9-11 AM, 5-8 PM)
  const isPeakHour = () => {
    const hour = new Date().getHours();
    return (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20);
  };

  // Calculate pricing
  const calculatePricing = useCallback(() => {
    if (!selectedPackage || !selectedVehicle) return null;

    const pkg = PACKAGES.find((p) => p.id === selectedPackage);
    const vehicle = VEHICLES.find((v) => v.id === selectedVehicle);
    if (!pkg || !vehicle) return null;

    const km = Math.max(distanceValue, PRICING.minDistance);
    
    // Base calculations
    const packagePrice = Math.round(pkg.basePrice * vehicle.multiplier);
    const distanceCharge = Math.round(km * PRICING.perKmRate);
    
    // Subtotal
    let subtotal = packagePrice + distanceCharge;
    
    // Peak hour surge
    const peakSurge = isPeakHour() ? Math.round(subtotal * (PRICING.peakHourMultiplier - 1)) : 0;
    subtotal += peakSurge;
    
    // Convenience fee
    subtotal += PRICING.convenienceFee;
    
    // Tax
    const tax = Math.round(subtotal * PRICING.taxRate);
    
    // Total
    const total = subtotal + tax;

    return {
      packagePrice,
      distanceCharge,
      peakSurge,
      convenienceFee: PRICING.convenienceFee,
      subtotal,
      tax,
      total,
      isPeakHour: isPeakHour(),
      distanceKm: km,
      estimatedTime: pkg.etaMin + durationValue,
    };
  }, [selectedPackage, selectedVehicle, distanceValue, durationValue]);

  // Find Nearest Hub
  const findNearestHub = useCallback(async () => {
    if (!region) return;

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
    bottomSheetRef.current?.snapToIndex(1);

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
        setDistanceValue(parseDistance(data.distance));
        setDurationValue(parseDuration(data.duration));

        setTimeout(() => {
          if (mapRef.current && data.coords?.length > 0) {
            mapRef.current.fitToCoordinates(data.coords, {
              edgePadding: {
                top: height * 0.15,
                bottom: height * 0.45,
                left: 50,
                right: 50,
              },
              animated: true,
            });
          }
        }, 100);
      }
    } catch (e) {
      console.log("Route error:", e);
    } finally {
      setLoadingRoute(false);
    }
  }, [region]);

  useEffect(() => {
    if (region) findNearestHub();
  }, [region]);

  // Helpers
  const formatDuration = (min) => {
    if (!min) return "";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  // Build order object
  const buildOrder = () => {
    const pkg = PACKAGES.find((p) => p.id === selectedPackage);
    const vehicle = VEHICLES.find((v) => v.id === selectedVehicle);
    const pricing = calculatePricing();

    return {
      service_type: "car_wash",
      location: region,
      hub: nearestHub,
      vehicle: vehicle,
      package: {
        ...pkg,
        calculatedPrice: pricing?.packagePrice,
      },
      route: {
        distance,
        duration,
        distanceValue,
        durationValue,
      },
      pricing: pricing,
      created_at: new Date().toISOString(),
    };
  };

  // ==================== COMPONENTS ====================

  // Header Card with Route Info
  const HeaderCard = () => (
    <View style={styles.headerCard}>
      <View style={styles.headerIcon}>
        <Ionicons name="car-sport" size={20} color={COLORS.white} />
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>
          {nearestHub?.name || "Finding hub..."}
        </Text>
        {nearestHub?.address && (
          <Text style={styles.headerAddress}>{nearestHub.address}</Text>
        )}
        <View style={styles.headerMeta}>
          {distance && (
            <View style={styles.metaChip}>
              <Ionicons name="navigate" size={12} color={COLORS.primary} />
              <Text style={styles.metaChipText}>{distance}</Text>
            </View>
          )}
          {duration && (
            <View style={styles.metaChip}>
              <Ionicons name="time" size={12} color={COLORS.primary} />
              <Text style={styles.metaChipText}>{duration}</Text>
            </View>
          )}
          {nearestHub?.rating && (
            <View style={[styles.metaChip, styles.ratingChip]}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={[styles.metaChipText, { color: COLORS.warning }]}>
                {nearestHub.rating}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Vehicle Item
  const VehicleItem = ({ item, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.vehicleItem, selected && styles.vehicleItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {item.popular && (
        <View style={styles.popularTag}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}
      <Image source={item.icon} style={styles.vehicleIcon} />
      <View style={styles.vehicleInfo}>
        <Text style={[styles.vehicleName, selected && styles.vehicleNameActive]}>
          {item.name}
        </Text>
        <Text style={styles.vehicleSubtitle}>{item.subtitle}</Text>
        {item.multiplier > 1 && (
          <Text style={styles.vehicleMultiplier}>
            +{Math.round((item.multiplier - 1) * 100)}% from base
          </Text>
        )}
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  // Package Item
  const PackageItem = ({ item, selected, onPress }) => {
    const isSelected = selected === item.id;
    const vehicle = VEHICLES.find((v) => v.id === selectedVehicle);
    const calculatedPrice = vehicle
      ? Math.round(item.basePrice * vehicle.multiplier)
      : item.basePrice;

    return (
      <TouchableOpacity
        style={[styles.packageItem, isSelected && styles.packageItemActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {item.popular && (
          <View style={[styles.packageTag, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.packageTagText}>BEST VALUE</Text>
          </View>
        )}
        {item.premium && (
          <View style={[styles.packageTag, { backgroundColor: "#8B5CF6" }]}>
            <Text style={styles.packageTagText}>PREMIUM</Text>
          </View>
        )}

        <View style={styles.packageRow}>
          <View style={[styles.packageIcon, isSelected && styles.packageIconActive]}>
            <Ionicons
              name={item.icon}
              size={22}
              color={isSelected ? COLORS.white : COLORS.primary}
            />
          </View>

          <View style={styles.packageInfo}>
            <Text style={[styles.packageName, isSelected && styles.packageNameActive]}>
              {item.name}
            </Text>
            <Text style={styles.packageDesc}>{item.desc}</Text>
            <View style={styles.packageEta}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.packageEtaText}>
                {formatDuration(item.etaMin + durationValue)} total
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={[styles.packagePrice, isSelected && styles.packagePriceActive]}>
              ₹{calculatedPrice}
            </Text>
            {vehicle?.multiplier > 1 && (
              <Text style={styles.originalPrice}>₹{item.basePrice}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Enhanced Estimate Card with Full Breakdown
  const EstimateCard = () => {
    const pricing = calculatePricing();
    if (!pricing) return null;

    const pkg = PACKAGES.find((p) => p.id === selectedPackage);

    return (
      <View style={styles.estimateCard}>
        <View style={styles.estimateHeader}>
          <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
          <Text style={styles.estimateTitle}>Price Breakdown</Text>
        </View>

        <View style={styles.estimateBody}>
          {/* Package Price */}
          <View style={styles.estimateRow}>
            <View style={styles.estimateLabelRow}>
              <Text style={styles.estimateLabel}>{pkg?.name}</Text>
              <Text style={styles.estimateSub}>
                (for {VEHICLES.find((v) => v.id === selectedVehicle)?.name})
              </Text>
            </View>
            <Text style={styles.estimateValue}>₹{pricing.packagePrice}</Text>
          </View>

          {/* Distance Charge */}
          <View style={styles.estimateRow}>
            <View style={styles.estimateLabelRow}>
              <Text style={styles.estimateLabel}>Distance Charge</Text>
              <Text style={styles.estimateSub}>
                ({pricing.distanceKm.toFixed(1)} km × ₹{PRICING.perKmRate})
              </Text>
            </View>
            <Text style={styles.estimateValue}>₹{pricing.distanceCharge}</Text>
          </View>

          {/* Peak Hour Surge */}
          {pricing.peakSurge > 0 && (
            <View style={styles.estimateRow}>
              <View style={styles.estimateLabelRow}>
                <Text style={[styles.estimateLabel, { color: COLORS.warning }]}>
                  Peak Hour Surge
                </Text>
                <View style={styles.peakBadge}>
                  <Ionicons name="flash" size={10} color={COLORS.warning} />
                  <Text style={styles.peakBadgeText}>+20%</Text>
                </View>
              </View>
              <Text style={[styles.estimateValue, { color: COLORS.warning }]}>
                +₹{pricing.peakSurge}
              </Text>
            </View>
          )}

          {/* Convenience Fee */}
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Convenience Fee</Text>
            <Text style={styles.estimateValue}>₹{pricing.convenienceFee}</Text>
          </View>

          {/* Tax */}
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>GST (18%)</Text>
            <Text style={styles.estimateValue}>₹{pricing.tax}</Text>
          </View>

          <View style={styles.estimateDivider} />

          {/* Total */}
          <View style={styles.estimateRow}>
            <View>
              <Text style={styles.estimateTotal}>Total Amount</Text>
              <Text style={styles.estimateTime}>
                Est. time: {formatDuration(pricing.estimatedTime)}
              </Text>
            </View>
            <Text style={styles.estimateTotalValue}>₹{pricing.total}</Text>
          </View>
        </View>

        {/* Savings Banner */}
        <View style={styles.savingsBanner}>
          <Ionicons name="pricetag" size={14} color={COLORS.success} />
          <Text style={styles.savingsText}>
            You're saving ₹{Math.round(pricing.total * 0.15)} with this package!
          </Text>
        </View>
      </View>
    );
  };

  // Primary Button
  const PrimaryButton = ({ label, onPress, disabled, icon, loading }) => (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <>
          <Text style={styles.primaryBtnText}>{label}</Text>
          {icon && (
            <Ionicons name={icon} size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
          )}
        </>
      )}
    </TouchableOpacity>
  );

  // ==================== SHEET CONTENT ====================
  const renderContent = () => {
    if (loadingRoute || !nearestHub) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding nearest hub...</Text>
        </View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Progress Steps */}
        <View style={styles.progressBar}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              {step === "package" && (
                <Ionicons name="checkmark" size={10} color={COLORS.white} />
              )}
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>
              Vehicle
            </Text>
          </View>
          <View style={[styles.progressLine, step === "package" && styles.progressLineActive]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, step === "package" && styles.progressDotActive]} />
            <Text style={[styles.progressLabel, step === "package" && styles.progressLabelActive]}>
              Package
            </Text>
          </View>
        </View>

        <HeaderCard />

        {step === "vehicle" ? (
          <>
            <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your car type for accurate pricing
            </Text>

            {VEHICLES.map((v) => (
              <VehicleItem
                key={v.id}
                item={v}
                selected={selectedVehicle === v.id}
                onPress={() => setSelectedVehicle(v.id)}
              />
            ))}

            <View style={styles.buttonContainer}>
              <PrimaryButton
                label="Continue"
                icon="arrow-forward"
                onPress={() => {
                  setStep("package");
                  bottomSheetRef.current?.snapToIndex(2);
                }}
                disabled={!selectedVehicle}
              />
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep("vehicle")}
            >
              <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
              <Text style={styles.backBtnText}>Change Vehicle</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Select Package</Text>
            <Text style={styles.sectionSubtitle}>
              Choose the perfect wash for your{" "}
              {VEHICLES.find((v) => v.id === selectedVehicle)?.name}
            </Text>

            {PACKAGES.map((p) => (
              <PackageItem
                key={p.id}
                item={p}
                selected={selectedPackage}
                onPress={() => setSelectedPackage(p.id)}
              />
            ))}

            {selectedPackage && <EstimateCard />}

            <View style={styles.buttonContainer}>
              <PrimaryButton
                label="View Quotation"
                icon="document-text-outline"
                onPress={() => {
                  navigation.navigate("QuotationPage", { order: buildOrder() });
                }}
                disabled={!selectedPackage}
              />
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
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.fullLoaderText}>Getting your location...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={MAP_STYLE}
          showsCompass={false}
          showsMyLocationButton={false}
        >
          {region && (
            <Marker coordinate={{ latitude: region.lat, longitude: region.lng }}>
              <View style={styles.userMarker}>
                <View style={styles.userMarkerDot} />
              </View>
            </Marker>
          )}

          {nearestHub && (
            <Marker coordinate={{ latitude: nearestHub.lat, longitude: nearestHub.lng }}>
              <View style={styles.hubMarker}>
                <Ionicons name="car-sport" size={16} color={COLORS.white} />
              </View>
            </Marker>
          )}

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Map Header */}
        <View style={styles.mapHeader}>
          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="menu" size={22} color={COLORS.textDark} />
          </TouchableOpacity>

          <View style={styles.mapTitleWrap}>
            <Text style={styles.mapTitle}>Car Wash</Text>
            {nearestHub && distance && (
              <Text style={styles.mapSubtitle}>{nearestHub.name} • {distance}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        {/* Peak Hour Badge */}
        {isPeakHour() && (
          <View style={styles.peakHourBadge}>
            <Ionicons name="flash" size={14} color={COLORS.warning} />
            <Text style={styles.peakHourText}>Peak Hours Active</Text>
          </View>
        )}

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={findNearestHub} activeOpacity={0.85}>
          <Ionicons name="locate" size={22} color={COLORS.white} />
        </TouchableOpacity>

        {/* Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          snapPoints={snapPoints}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
          enableContentPanningGesture={true}
          enableHandlePanningGesture={true}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loader
  fullLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  fullLoaderText: {
    marginTop: SPACING.lg,
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  // Map
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  mapHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  mapTitleWrap: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  mapSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Peak Hour Badge
  peakHourBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  peakHourText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.warning,
  },

  // Markers
  userMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
  },
  userMarkerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  hubMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // FAB
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: height * 0.58,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  // Sheet
  sheetBg: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
  },
  sheetHandle: {
    backgroundColor: COLORS.divider,
    width: 40,
    height: 4,
  },
  sheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl + 20,
  },

  // Loading
  loadingContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  // Progress
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  progressStep: {
    alignItems: "center",
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  progressLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },

  // Header Card
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  headerAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  headerMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  ratingChip: {
    backgroundColor: COLORS.warningBg,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },

  // Back Button
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },

  // Vehicle Item
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  vehicleItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  popularTag: {
    position: "absolute",
    top: -8,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  popularText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  vehicleIcon: {
    width: 60,
    height: 40,
    resizeMode: "contain",
    marginRight: SPACING.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  vehicleNameActive: {
    color: COLORS.primaryDark,
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  vehicleMultiplier: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: "500",
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  // Package Item
  packageItem: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  packageItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  packageTag: {
    position: "absolute",
    top: -8,
    right: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 1,
  },
  packageTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  packageIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  packageIconActive: {
    backgroundColor: COLORS.primary,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  packageNameActive: {
    color: COLORS.primaryDark,
  },
  packageDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  packageEta: {
    flexDirection: "row",
    alignItems: "center",
  },
  packageEtaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  packagePrice: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  packagePriceActive: {
    color: COLORS.primaryDark,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },

  // Estimate Card
  estimateCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    overflow: "hidden",
  },
  estimateHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 8,
  },
  estimateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  estimateBody: {
    padding: SPACING.lg,
  },
  estimateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  estimateLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  estimateLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  estimateSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  estimateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  peakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 2,
  },
  peakBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.warning,
  },
  estimateDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  estimateTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  estimateTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  estimateTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.successBg,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success,
  },

  // Button
  buttonContainer: {
    marginTop: SPACING.lg,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.ctaBlack,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
});