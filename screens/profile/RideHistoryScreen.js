// screens/profile/RideHistoryScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config/api";

const COLORS = {
  primary:      "#000000",
  white:        "#FFFFFF",
  background:   "#F8F9FA",
  card:         "#FFFFFF",
  border:       "#F0F0F0",
  textDark:     "#111827",
  textSecondary:"#6B7280",
  textMuted:    "#9CA3AF",
  success:      "#10B981",
  successBg:    "#ECFDF5",
  error:        "#EF4444",
  errorBg:      "#FEF2F2",
  warning:      "#F59E0B",
  warningBg:    "#FFFBEB",
  purple:       "#8B5CF6",
  purpleBg:     "rgba(139,92,246,0.1)",
  blue:         "#3B82F6",
  blueBg:       "#EFF6FF",
  orange:       "#F97316",
  orangeBg:     "rgba(249,115,22,0.1)",
};

const FILTERS = [
  { key: "all",       label: "All",       icon: "list-outline"     },
  { key: "upcoming",  label: "Upcoming",  icon: "calendar-outline" },
  { key: "active",    label: "Active",    icon: "radio-outline"    },
  { key: "completed", label: "Done",      icon: "checkmark-circle-outline" },
  { key: "cancelled", label: "Cancelled", icon: "close-circle-outline" },
];

const getStatusConfig = (status, isScheduled) => {
  if (isScheduled && (status === "pending" || status === "requested")) {
    return { color: COLORS.purple, bg: COLORS.purpleBg, label: "Scheduled", icon: "calendar" };
  }
  const map = {
    pending:     { color: COLORS.warning,  bg: COLORS.warningBg,  label: "Pending",     icon: "time-outline"            },
    requested:   { color: COLORS.blue,     bg: COLORS.blueBg,     label: "Finding",     icon: "search-outline"          },
    accepted:    { color: COLORS.blue,     bg: COLORS.blueBg,     label: "Accepted",    icon: "checkmark-circle-outline" },
    arrived:     { color: COLORS.orange,   bg: COLORS.orangeBg,   label: "Arrived",     icon: "location-outline"        },
    in_progress: { color: COLORS.primary,  bg: "#F3F4F6",         label: "In Progress", icon: "navigate-outline"        },
    completed:   { color: COLORS.success,  bg: COLORS.successBg,  label: "Completed",   icon: "checkmark-circle"        },
    cancelled:   { color: COLORS.error,    bg: COLORS.errorBg,    label: "Cancelled",   icon: "close-circle"            },
  };
  return map[status] || { color: COLORS.textMuted, bg: "#F3F4F6", label: status, icon: "help-outline" };
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatScheduled = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function RideHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rides,      setRides]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [userUid,    setUserUid]    = useState(null);

  // Get current user UID
  useEffect(() => {
    try {
      const auth = getAuth(getApp());
      const user = auth.currentUser;
      if (user) setUserUid(user.uid);
    } catch (e) {
      console.log("Auth error:", e);
    }
  }, []);

  const fetchRides = useCallback(async () => {
    if (!userUid) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/orders/history?firebase_uid=${userUid}`);
      const data = await res.json();
      setRides(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Ride history error:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userUid]);

  useEffect(() => {
    if (userUid) fetchRides();
  }, [userUid, fetchRides]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  // Filter rides
  const filteredRides = rides.filter((r) => {
    if (filter === "all") return true;
    if (filter === "upcoming") {
      return (r.is_scheduled || r.scheduled_date) &&
        (r.status === "pending" || r.status === "requested" || r.status === "accepted");
    }
    if (filter === "active") {
      return ["accepted", "arrived", "in_progress"].includes(r.status) && !r.is_scheduled;
    }
    if (filter === "completed") return r.status === "completed";
    if (filter === "cancelled") return r.status === "cancelled";
    return true;
  });

  const renderRideCard = ({ item }) => {
    const isScheduled = item.is_scheduled || !!item.scheduled_date;
    const cfg         = getStatusConfig(item.status, isScheduled);
    const isActive    = ["accepted", "arrived", "in_progress"].includes(item.status);
    const price       = parseFloat(item.customer_total || item.price || 0);
    const serviceType = item.service_type || "driver";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isActive && styles.cardActive,
          isScheduled && item.status !== "completed" && styles.cardScheduled,
        ]}
        onPress={() => {
        const { status, service_type, id, otp } = item;
        const orderId     = String(id);
        const isCarWash   = service_type === "carwash" || service_type === "car_wash";

        // ── Still searching ──
        if (status === "requested") {
          if (isCarWash) {
            navigation.navigate("FindingTechnicianScreen", {
              orderId,
              serviceType:     service_type,
              totalAmount:     item.customer_total || item.price,
              advancePaid:     item.advance_amount     || 0,
              remainingAmount: item.remaining_amount   || 0,
            });
          } else {
            navigation.navigate("FindingDriverScreen", {
              orderId,
              pickup:          { lat: item.pickup_lat, lng: item.pickup_lng },
              drop:            { lat: item.drop_lat,   lng: item.drop_lng   },
              pickupAddress:   item.pickup,
              dropAddress:     item.drop,
              distanceKm:      item.distance,
              durationMinutes: item.duration,
              totalFare:       item.customer_total || item.price,
              paymentMethod:   item.payment_method || "cash",
            });
          }
          return;
        }

        // ── Driver/Technician accepted — show OTP ──
        if (status === "accepted") {
          if (isCarWash) {
            navigation.navigate("TechnicianEnRouteScreen", {
              orderId,
              advancePaid:     item.advance_amount   || 0,
              totalAmount:     item.customer_total   || item.price,
              remainingAmount: item.remaining_amount || 0,
            });
          } else {
            // ✅ Uses our new DriverAssignedScreen
            navigation.navigate("DriverAssignedScreen", { orderId });
          }
          return;
        }

        // ── Driver/Tech arrived — show OTP + arrived state ──
        if (status === "arrived") {
          if (isCarWash) {
            navigation.navigate("TechnicianArrivedScreen", {
              orderId,
              otp,
              technician:      item.driver || null,
              advancePaid:     item.advance_amount   || 0,
              totalAmount:     item.customer_total   || item.price,
              remainingAmount: item.remaining_amount || 0,
            });
          } else {
            navigation.navigate("DriverAssignedScreen", { orderId });
          }
          return;
        }

        // ── Ride in progress ──
        if (status === "in_progress") {
          if (isCarWash) {
            navigation.navigate("WashInProgressScreen", {
              orderId,
              advancePaid:     item.advance_amount   || 0,
              totalAmount:     item.customer_total   || item.price,
              remainingAmount: item.remaining_amount || 0,
            });
          } else {
            navigation.navigate("ActiveRideScreen", { orderId });
          }
          return;
        }

        // ── Completed / Cancelled / Everything else ──
        navigation.navigate("RideDetails", { rideId: item.id, ride: item });
      }}
        activeOpacity={0.7}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {/* Service type icon */}
            <View style={[styles.serviceIcon, { backgroundColor: cfg.bg }]}>
              <Ionicons
                name={
                  serviceType === "carwash"
                    ? "water-outline"
                    : serviceType === "pickup_drop"
                      ? "navigate-outline"
                      : "car-sport-outline"
                }
                size={18}
                color={cfg.color}
              />
            </View>

            <View>
              <Text style={styles.serviceType}>
                {serviceType === "carwash"
                  ? "Car Wash"
                  : serviceType === "pickup_drop"
                    ? "Pickup & Drop"
                    : "Driver Service"}
              </Text>
              <Text style={styles.rideDate}>
                {isScheduled && item.scheduled_date
                  ? `📅 ${formatScheduled(item.scheduled_date)}`
                  : formatDate(item.created_at)}
              </Text>
            </View>
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Scheduled banner */}
        {isScheduled && item.status !== "completed" && item.status !== "cancelled" && (
          <View style={styles.scheduledBanner}>
            <Ionicons name="calendar" size={14} color={COLORS.purple} />
            <Text style={styles.scheduledBannerText}>
              Scheduled for {formatScheduled(item.scheduled_date)}
            </Text>
          </View>
        )}

        {/* Locations */}
        {(item.pickup || item.drop) && (
          <View style={styles.locationSection}>
            {item.pickup && (
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.pickup}
                </Text>
              </View>
            )}
            {item.pickup && item.drop && (
              <View style={styles.locationConnector} />
            )}
            {item.drop && (
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.drop}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {item.distance && (
              <View style={styles.footerItem}>
                <Ionicons name="navigate-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.footerText}>{item.distance} km</Text>
              </View>
            )}
            {item.payment_method && (
              <View style={styles.footerItem}>
                <Ionicons
                  name={item.payment_method === "cash" ? "cash-outline" : "card-outline"}
                  size={13}
                  color={COLORS.textMuted}
                />
                <Text style={styles.footerText}>
                  {item.payment_method === "cash" ? "Cash" : "Online"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footerRight}>
            <Text style={styles.priceText}>₹{price}</Text>
            {isActive && (
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Car details for driver service */}
        {item.car_details && (
          <View style={styles.carDetails}>
            <Ionicons name="car-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.carText}>
              {item.car_details.brand} {item.car_details.model}
              {item.car_details.number ? ` • ${item.car_details.number}` : ""}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const upcomingCount = rides.filter(
    (r) => (r.is_scheduled || r.scheduled_date) &&
      ["pending", "requested", "accepted"].includes(r.status)
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Trips</Text>
          {upcomingCount > 0 && (
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>{upcomingCount} upcoming</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const count = f.key === "upcoming"
            ? upcomingCount
            : f.key === "all"
              ? rides.length
              : rides.filter((r) => {
                if (f.key === "active") return ["accepted", "arrived", "in_progress"].includes(r.status);
                return r.status === f.key;
              }).length;

          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[
                  styles.filterCount,
                  filter === f.key && styles.filterCountActive,
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    filter === f.key && styles.filterCountTextActive,
                  ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your trips...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRideCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            filteredRides.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={filter === "upcoming" ? "calendar-outline" : "car-outline"}
                size={64}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {filter === "upcoming"
                  ? "No Upcoming Trips"
                  : filter === "active"
                    ? "No Active Trips"
                    : "No Trips Found"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === "upcoming"
                  ? "Scheduled rides will appear here once a driver accepts"
                  : "Your ride history will appear here"}
              </Text>
              {filter !== "all" && (
                <TouchableOpacity
                  style={styles.showAllBtn}
                  onPress={() => setFilter("all")}
                >
                  <Text style={styles.showAllText}>Show All Trips</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  centered:    { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },

  // Header
  header: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    paddingHorizontal: 16,
    paddingBottom:   12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems:     "center",
  },
  headerCenter:  { flex: 1, alignItems: "center" },
  headerTitle:   { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  upcomingBadge: {
    backgroundColor: COLORS.purpleBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius:    10,
    marginTop:       4,
  },
  upcomingBadgeText: {
    fontSize: 11, fontWeight: "700", color: COLORS.purple,
  },

  // Filters
  filterRow: {
    flexDirection:  "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap:            6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBtn: {
    flexDirection:   "row",
    alignItems:      "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius:    20,
    backgroundColor: COLORS.background,
    gap:             4,
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText:      { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  filterTextActive:{ color: COLORS.white },
  filterCount: {
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: COLORS.border,
    justifyContent:  "center",
    alignItems:      "center",
    paddingHorizontal: 4,
  },
  filterCountActive:    { backgroundColor: "rgba(255,255,255,0.25)" },
  filterCountText:      { fontSize: 10, fontWeight: "700", color: COLORS.textSecondary },
  filterCountTextActive:{ color: COLORS.white },

  // List
  listContent: { padding: 12, paddingBottom: 40 },
  listEmpty:   { flex: 1 },

  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius:    16,
    padding:         16,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     COLORS.border,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.04,
    shadowRadius:    8,
    elevation:       2,
  },
  cardActive: {
    borderColor:     COLORS.primary,
    borderWidth:     1.5,
  },
  cardScheduled: {
    borderColor:     COLORS.purple,
    borderWidth:     1.5,
    borderStyle:     "dashed",
  },

  // Card header
  cardHeader: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
    flex:          1,
  },
  serviceIcon: {
    width:          38,
    height:         38,
    borderRadius:   10,
    justifyContent: "center",
    alignItems:     "center",
  },
  serviceType: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  rideDate:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection:   "row",
    alignItems:      "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius:    8,
    gap:             4,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Scheduled banner
  scheduledBanner: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.purpleBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius:    8,
    marginBottom:    10,
    gap:             6,
  },
  scheduledBannerText: {
    fontSize: 12, fontWeight: "600", color: COLORS.purple, flex: 1,
  },

  // Locations
  locationSection: { marginBottom: 12 },
  locationRow:     { flexDirection: "row", alignItems: "flex-start" },
  locationDot: {
    width:       10,
    height:      10,
    borderRadius: 5,
    marginRight: 10,
    marginTop:   4,
  },
  locationConnector: {
    width:           2,
    height:          16,
    backgroundColor: COLORS.border,
    marginLeft:      4,
    marginVertical:  3,
  },
  locationText: {
    flex:       1,
    fontSize:   13,
    color:      COLORS.textDark,
    lineHeight: 18,
  },

  // Footer
  cardFooter: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    paddingTop:     10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  footerItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText:  { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceText:   { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  liveChip: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius:    10,
    gap:             4,
  },
  liveDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: COLORS.error,
  },
  liveText: { fontSize: 10, fontWeight: "800", color: COLORS.error },

  // Car details
  carDetails: {
    flexDirection:   "row",
    alignItems:      "center",
    marginTop:       8,
    paddingTop:      8,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    gap:             6,
  },
  carText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },

  // Empty state
  emptyContainer: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "center",
    paddingTop:      80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize:    20,
    fontWeight:  "700",
    color:       COLORS.textDark,
    marginTop:   16,
    textAlign:   "center",
  },
  emptySubtitle: {
    fontSize:   14,
    color:      COLORS.textSecondary,
    marginTop:  8,
    textAlign:  "center",
    lineHeight: 20,
  },
  showAllBtn: {
    marginTop:       20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius:    24,
  },
  showAllText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
});