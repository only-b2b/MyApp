// screens/profile/RideDetailsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../../config/api"; // ✅ Fixed import

const COLORS = {
  primary:       "#000000",
  background:    "#F5F6F8",
  white:         "#FFFFFF",
  textDark:      "#111111",
  textSecondary: "#6B7280",
  textMuted:     "#9CA3AF",
  border:        "#E5E7EB",
  success:       "#10B981",
  successBg:     "#ECFDF5",
  warning:       "#F59E0B",
  warningBg:     "#FFFBEB",
  error:         "#EF4444",
  errorBg:       "#FEF2F2",
  blue:          "#3B82F6",
  blueBg:        "#EFF6FF",
  purple:        "#8B5CF6",
  purpleBg:      "rgba(139,92,246,0.1)",
};

const getStatusConfig = (status) => {
  const map = {
    pending:     { color: COLORS.warning, bg: COLORS.warningBg, label: "Pending",     icon: "time-outline" },
    requested:   { color: COLORS.blue,    bg: COLORS.blueBg,    label: "Finding",     icon: "search-outline" },
    accepted:    { color: COLORS.blue,    bg: COLORS.blueBg,    label: "Accepted",    icon: "checkmark-circle-outline" },
    arrived:     { color: COLORS.warning, bg: COLORS.warningBg, label: "Arrived",     icon: "location-outline" },
    in_progress: { color: COLORS.primary, bg: "#F3F4F6",        label: "In Progress", icon: "navigate-outline" },
    completed:   { color: COLORS.success, bg: COLORS.successBg, label: "Completed",   icon: "checkmark-circle" },
    cancelled:   { color: COLORS.error,   bg: COLORS.errorBg,   label: "Cancelled",   icon: "close-circle" },
  };
  return map[status] || {
    color: COLORS.textMuted,
    bg:    "#F3F4F6",
    label: status || "Unknown",
    icon:  "help-outline",
  };
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  });
};

const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return "₹" + num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatDuration = (min) => {
  if (!min) return null;
  const n = parseFloat(min);
  if (isNaN(n)) return String(min);
  if (n < 60) return `${Math.round(n)} mins`;
  const h = Math.floor(n / 60), m = Math.round(n % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function RideDetailsScreen({ route, navigation }) {
  const insets      = useSafeAreaInsets();
  // ✅ Accept both rideId and ride (pre-loaded data from history)
  const { rideId, ride: initialRide } = route.params || {};

  const [ride,    setRide]    = useState(initialRide || null);
  const [loading, setLoading] = useState(!initialRide);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    // If we already have ride data passed from history screen, use it
    // But still fetch fresh data for complete details
    const idToFetch = rideId || initialRide?.id;
    if (idToFetch) {
      fetchRideDetails(idToFetch);
    } else {
      setError("No ride ID provided");
      setLoading(false);
    }
  }, [rideId]);

  const fetchRideDetails = async (id) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/orders/${id}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();

      if (!data || !data.id) {
        throw new Error("Invalid response from server");
      }

      setRide(data);
    } catch (err) {
      console.log("Fetch ride details error:", err.message);
      setError(err.message);
      // Keep showing initialRide data if we have it
      if (!initialRide) {
        Alert.alert(
          "Error",
          `Failed to load ride details: ${err.message}`,
          [{ text: "Go Back", onPress: () => navigation.goBack() }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCallDriver = () => {
    const phone = ride?.driver_phone || ride?.driver?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() =>
        Alert.alert("Error", "Could not open phone app")
      );
    } else {
      Alert.alert("Info", "Driver phone number not available");
    }
  };

  const handleReportIssue = () => {
    Alert.alert(
      "Report Issue",
      "What would you like to report?",
      [
        { text: "Lost Item",         onPress: () => navigation.navigate("HelpSupport") },
        { text: "Fare Issue",        onPress: () => navigation.navigate("HelpSupport") },
        { text: "Driver Behaviour",  onPress: () => navigation.navigate("HelpSupport") },
        { text: "Cancel",            style: "cancel" },
      ]
    );
  };

  const handleDownloadInvoice = () => {
    Alert.alert("Invoice", "Invoice will be sent to your registered email.");
  };

  // ── Loading State ─────────────────────────────────────────
  if (loading && !ride) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  // ── Error State ───────────────────────────────────────────
  if (error && !ride) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            fetchRideDetails(rideId || initialRide?.id);
          }}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLinkBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── No Data ───────────────────────────────────────────────
  if (!ride) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="car-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.errorTitle}>Ride Not Found</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived Values ────────────────────────────────────────
  const cfg            = getStatusConfig(ride.status);
  const serviceType    = ride.service_type || "driver";
  const isCarWash      = serviceType === "carwash" || serviceType === "car_wash";
  const pickupAddress  = ride.pickup_address || ride.pickup || "N/A";
  const dropAddress    = ride.drop_address   || ride.drop   || null;
  const driverName     = ride.driver_name    || ride.driver?.full_name || null;
  const driverPhone    = ride.driver_phone   || ride.driver?.phone     || null;
  const vehicleNumber  = ride.vehicle_number || ride.driver?.vehicle   || ride.vehicle || null;
  const price          = parseFloat(ride.customer_total || ride.price  || 0);
  const paymentMethod  = ride.payment_method || ride.payment_mode      || "cash";

  const carDetails = ride.car_details
    ? typeof ride.car_details === "string"
      ? JSON.parse(ride.car_details)
      : ride.car_details
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        {/* ── Status Banner ─────────────────────────────── */}
        <View style={[styles.statusBanner, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: cfg.color + "20" }]}>
            <Ionicons name={cfg.icon} size={28} color={cfg.color} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
            <Text style={styles.statusDate}>
              {formatDate(ride.completed_at || ride.cancelled_at || ride.created_at)}
            </Text>
          </View>
          <View style={[styles.rideIdBadge]}>
            <Text style={styles.rideIdText}>#{ride.id}</Text>
          </View>
        </View>

        {/* ── Service Type ──────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.serviceRow}>
            <View style={[styles.serviceIconWrap, { backgroundColor: cfg.color + "15" }]}>
              <Ionicons
                name={
                  isCarWash
                    ? "water-outline"
                    : serviceType === "pickup_drop" || serviceType === "pickdrop"
                      ? "navigate-outline"
                      : "car-sport-outline"
                }
                size={26}
                color={cfg.color}
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceType}>
                {isCarWash
                  ? "Car Wash"
                  : serviceType === "pickup_drop" || serviceType === "pickdrop"
                    ? "Pickup & Drop"
                    : "Driver Service"}
              </Text>
              {ride.package_name && (
                <Text style={styles.servicePackage}>{ride.package_name}</Text>
              )}
            </View>
            <Text style={styles.servicePrice}>{formatCurrency(price)}</Text>
          </View>
        </View>

        {/* ── Route Details ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeAddress}>{pickupAddress}</Text>
              </View>
            </View>

            {dropAddress && (
              <>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: COLORS.error }]} />
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Drop</Text>
                    <Text style={styles.routeAddress}>{dropAddress}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Scheduled Banner ──────────────────────────── */}
        {(ride.is_scheduled || ride.scheduled_date) && (
          <View style={styles.scheduledSection}>
            <Ionicons name="calendar" size={18} color={COLORS.purple} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.scheduledLabel}>Scheduled Ride</Text>
              {ride.scheduled_date && (
                <Text style={styles.scheduledDate}>
                  {formatDate(ride.scheduled_date)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── Trip Stats ────────────────────────────────── */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>
              {ride.distance ? `${ride.distance} km` : "—"}
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.blue} />
            <Text style={styles.statValue}>
              {ride.duration ? formatDuration(ride.duration) : "—"}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name={paymentMethod === "cash" ? "cash-outline" : "card-outline"}
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.statValue}>
              {paymentMethod === "cash" ? "Cash" : "Online"}
            </Text>
            <Text style={styles.statLabel}>Payment</Text>
          </View>
        </View>

        {/* ── Car Details ───────────────────────────────── */}
        {carDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <View style={styles.carRow}>
              <View style={styles.carIconWrap}>
                <Ionicons name="car-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.carName}>
                  {[carDetails.brand, carDetails.model].filter(Boolean).join(" ") || "Vehicle"}
                </Text>
                {carDetails.number && (
                  <Text style={styles.carNumber}>{carDetails.number}</Text>
                )}
                {carDetails.color && (
                  <Text style={styles.carColor}>{carDetails.color}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── Driver / Technician ───────────────────────── */}
        {driverName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isCarWash ? "Technician" : "Driver"}
            </Text>
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={26} color={COLORS.primary} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driverName}</Text>
                {vehicleNumber && (
                  <Text style={styles.driverVehicle}>{vehicleNumber}</Text>
                )}
                {ride.driver_rating && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={COLORS.warning} />
                    <Text style={styles.ratingText}>{ride.driver_rating}</Text>
                  </View>
                )}
              </View>
              {driverPhone && (
                <TouchableOpacity
                  style={styles.callDriverBtn}
                  onPress={handleCallDriver}
                >
                  <Ionicons name="call" size={20} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Payment Details ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Ride Fare</Text>
              <Text style={styles.paymentValue}>{formatCurrency(price)}</Text>
            </View>

            {ride.driver_earning != null && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Driver Earning</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(ride.driver_earning)}
                </Text>
              </View>
            )}

            {ride.platform_commission != null && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Platform Fee</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(ride.platform_commission)}
                </Text>
              </View>
            )}

            <View style={styles.paymentDivider} />

            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotalLabel}>Total Paid</Text>
              <Text style={styles.paymentTotalValue}>{formatCurrency(price)}</Text>
            </View>

            <View style={styles.paymentMethodRow}>
              <Ionicons
                name={paymentMethod === "cash" ? "cash" : "card"}
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.paymentMethodText}>
                Paid via {paymentMethod === "cash" ? "Cash" : "Online"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Cancellation Reason ───────────────────────── */}
        {ride.status === "cancelled" && ride.cancellation_reason && (
          <View style={[styles.section, { borderLeftWidth: 3, borderLeftColor: COLORS.error }]}>
            <Text style={styles.sectionTitle}>Cancellation Reason</Text>
            <Text style={styles.cancelReason}>{ride.cancellation_reason}</Text>
          </View>
        )}

        {/* ── Actions ───────────────────────────────────── */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadInvoice}>
            <Ionicons name="download-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnDanger} onPress={handleReportIssue}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
            <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* ── Rebook ────────────────────────────────────── */}
        {(ride.status === "completed" || ride.status === "cancelled") && (
          <TouchableOpacity
            style={styles.rebookBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.rebookBtnText}>Book Again</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#F5F6F8" },
  loaderContainer:{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText:    { marginTop: 12, fontSize: 14, color: "#6B7280" },
  errorTitle:     { fontSize: 18, fontWeight: "700", color: "#111111", marginTop: 16 },
  errorText:      { fontSize: 14, color: "#6B7280", marginTop: 8, textAlign: "center" },
  retryBtn: {
    marginTop:         20,
    backgroundColor:   "#000000",
    paddingHorizontal: 32,
    paddingVertical:   12,
    borderRadius:      24,
  },
  retryBtnText:   { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  backLinkBtn:    { marginTop: 12 },
  backLinkText:   { color: "#6B7280", fontSize: 14 },

  // Header
  header: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 16,
    paddingVertical:   12,
    backgroundColor:   "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: "#F9FAFB",
    justifyContent:  "center",
    alignItems:      "center",
  },
  headerTitle:    { fontSize: 18, fontWeight: "700", color: "#111111" },

  content:        { flex: 1 },

  // Status Banner
  statusBanner: {
    flexDirection:     "row",
    alignItems:        "center",
    margin:            16,
    padding:           16,
    borderRadius:      16,
  },
  statusIconWrap: {
    width:          52,
    height:         52,
    borderRadius:   26,
    justifyContent: "center",
    alignItems:     "center",
  },
  statusInfo:     { flex: 1, marginLeft: 12 },
  statusText:     { fontSize: 16, fontWeight: "800" },
  statusDate:     { fontSize: 12, color: "#6B7280", marginTop: 3 },
  rideIdBadge:    {
    backgroundColor:   "#00000015",
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      10,
  },
  rideIdText:     { fontSize: 12, fontWeight: "700", color: "#374151" },

  // Section
  section: {
    backgroundColor:   "#FFFFFF",
    marginHorizontal:  16,
    marginBottom:      12,
    borderRadius:      16,
    padding:           16,
  },
  sectionTitle: {
    fontSize:        12,
    fontWeight:      "700",
    color:           "#9CA3AF",
    marginBottom:    12,
    textTransform:   "uppercase",
    letterSpacing:   0.5,
  },

  // Service
  serviceRow:     { flexDirection: "row", alignItems: "center" },
  serviceIconWrap:{
    width:          52,
    height:         52,
    borderRadius:   14,
    justifyContent: "center",
    alignItems:     "center",
  },
  serviceInfo:    { flex: 1, marginLeft: 12 },
  serviceType:    { fontSize: 16, fontWeight: "700", color: "#111111" },
  servicePackage: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  servicePrice:   { fontSize: 20, fontWeight: "800", color: "#111111" },

  // Route
  routeContainer: { marginTop: 4 },
  routeRow:       { flexDirection: "row", alignItems: "flex-start" },
  routeDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginTop:    5,
  },
  routeLine: {
    width:           2,
    height:          24,
    backgroundColor: "#E5E7EB",
    marginLeft:      4,
    marginVertical:  4,
  },
  routeTextContainer: { flex: 1, marginLeft: 12 },
  routeLabel:     { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  routeAddress:   { fontSize: 14, color: "#111111", marginTop: 2, lineHeight: 20 },

  // Scheduled
  scheduledSection: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   "rgba(139,92,246,0.08)",
    marginHorizontal:  16,
    marginBottom:      12,
    padding:           14,
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       "rgba(139,92,246,0.2)",
  },
  scheduledLabel: { fontSize: 13, fontWeight: "700", color: "#8B5CF6" },
  scheduledDate:  { fontSize: 12, color: "#8B5CF6", marginTop: 2 },

  // Stats
  statsContainer: {
    flexDirection:     "row",
    backgroundColor:   "#FFFFFF",
    marginHorizontal:  16,
    marginBottom:      12,
    borderRadius:      16,
    padding:           16,
  },
  statItem:  { flex: 1, alignItems: "center" },
  statValue: { fontSize: 14, fontWeight: "700", color: "#111111", marginTop: 8 },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  statDivider:{ width: 1, backgroundColor: "#E5E7EB" },

  // Car
  carRow:     { flexDirection: "row", alignItems: "center" },
  carIconWrap:{
    width:          44,
    height:         44,
    borderRadius:   12,
    backgroundColor:"#F3F4F6",
    justifyContent: "center",
    alignItems:     "center",
  },
  carName:    { fontSize: 15, fontWeight: "700", color: "#111111" },
  carNumber:  { fontSize: 13, color: "#6B7280", marginTop: 2 },
  carColor:   { fontSize: 12, color: "#9CA3AF", marginTop: 1 },

  // Driver
  driverCard: { flexDirection: "row", alignItems: "center" },
  driverAvatar:{
    width:          56,
    height:         56,
    borderRadius:   28,
    backgroundColor:"#F3F4F6",
    justifyContent: "center",
    alignItems:     "center",
  },
  driverInfo:   { flex: 1, marginLeft: 12 },
  driverName:   { fontSize: 16, fontWeight: "700", color: "#111111" },
  driverVehicle:{ fontSize: 13, color: "#6B7280", marginTop: 2 },
  ratingRow:    { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText:   { fontSize: 13, fontWeight: "600", color: "#111111", marginLeft: 4 },
  callDriverBtn:{
    width:          44,
    height:         44,
    borderRadius:   22,
    backgroundColor:"#000000",
    justifyContent: "center",
    alignItems:     "center",
  },

  // Payment
  paymentCard:       { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 14 },
  paymentRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  paymentLabel:      { fontSize: 14, color: "#6B7280" },
  paymentValue:      { fontSize: 14, fontWeight: "600", color: "#111111" },
  paymentDivider:    { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  paymentTotalLabel: { fontSize: 15, fontWeight: "700", color: "#111111" },
  paymentTotalValue: { fontSize: 18, fontWeight: "800", color: "#111111" },
  paymentMethodRow:  { flexDirection: "row", alignItems: "center", marginTop: 10 },
  paymentMethodText: { fontSize: 13, color: "#6B7280", marginLeft: 8 },

  // Cancellation
  cancelReason:   { fontSize: 14, color: "#EF4444", lineHeight: 20 },

  // Actions
  actionsContainer: {
    flexDirection:     "row",
    marginHorizontal:  16,
    marginBottom:      12,
    gap:               10,
  },
  actionBtn: {
    flex:              1,
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "center",
    backgroundColor:   "#FFFFFF",
    paddingVertical:   14,
    borderRadius:      14,
    gap:               6,
    borderWidth:       1,
    borderColor:       "#E5E7EB",
  },
  actionBtnDanger: {
    flex:              1,
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "center",
    backgroundColor:   "#FEF2F2",
    paddingVertical:   14,
    borderRadius:      14,
    gap:               6,
    borderWidth:       1,
    borderColor:       "#FECACA",
  },
  actionBtnText:  { fontSize: 14, fontWeight: "600", color: "#000000" },

  // Rebook
  rebookBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "center",
    backgroundColor:   "#000000",
    marginHorizontal:  16,
    paddingVertical:   16,
    borderRadius:      16,
    gap:               8,
  },
  rebookBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});