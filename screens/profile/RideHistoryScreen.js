// screens/profile/RideHistoryScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";

const COLORS = {
  primary: "#00A86B",
  background: "#F5F6F8",
  white: "#FFFFFF",
  textDark: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

export default function RideHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = auth().currentUser;

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, completed, cancelled

  const fetchRides = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/completed?firebase_uid=${user?.uid}`);
      const data = await res.json();
      setRides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Fetch rides error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return "₹" + num.toLocaleString("en-IN");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return COLORS.success;
      case "cancelled":
        return COLORS.error;
      case "in_progress":
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case "driver":
        return "car-sport";
      case "car_wash":
        return "water";
      case "pickdrop":
        return "swap-horizontal";
      default:
        return "car";
    }
  };

  const RideCard = ({ item }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => navigation.navigate("RideDetails", { rideId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.rideHeader}>
        <View style={[styles.serviceIcon, { backgroundColor: COLORS.primary + "15" }]}>
          <Ionicons name={getServiceIcon(item.service_type)} size={22} color={COLORS.primary} />
        </View>
        <View style={styles.rideInfo}>
          <Text style={styles.serviceType}>
            {item.service_type?.replace("_", " ").toUpperCase() || "RIDE"}
          </Text>
          <Text style={styles.rideDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.rideAmount}>
          <Text style={styles.amountText}>{formatCurrency(item.price)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status || "Completed"}
            </Text>
          </View>
        </View>
      </View>

      {item.pickup_address && (
        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
          {item.drop_address && (
            <>
              <View style={styles.locationLine} />
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.drop_address}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      <View style={styles.rideFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="navigate-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerText}>{item.distance || "—"}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerText}>{item.duration || "—"}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="card-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerText}>{item.payment_mode || "Cash"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterTabs = () => (
    <View style={styles.filterContainer}>
      {["all", "completed", "cancelled"].map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.filterTab, filter === f && styles.filterTabActive]}
          onPress={() => setFilter(f)}
        >
          <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const filteredRides = rides.filter((ride) => {
    if (filter === "all") return true;
    return ride.status === filter;
  });

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FilterTabs />

      <FlatList
        data={filteredRides}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => <RideCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No rides found</Text>
            <Text style={styles.emptySubtext}>Your ride history will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  filterContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, marginHorizontal: 4 },
  filterTabActive: { backgroundColor: "#00A86B" },
  filterText: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  filterTextActive: { color: "#FFFFFF" },
  listContent: { padding: 16 },
  rideCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  rideHeader: { flexDirection: "row", alignItems: "center" },
  serviceIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  rideInfo: { flex: 1, marginLeft: 12 },
  serviceType: { fontSize: 14, fontWeight: "700", color: "#111111" },
  rideDate: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  rideAmount: { alignItems: "flex-end" },
  amountText: { fontSize: 16, fontWeight: "700", color: "#111111" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  locationSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00A86B" },
  locationLine: { width: 1, height: 16, backgroundColor: "#E5E7EB", marginLeft: 3.5, marginVertical: 4 },
  locationText: { flex: 1, marginLeft: 12, fontSize: 13, color: "#6B7280" },
  rideFooter: { flexDirection: "row", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  footerItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  footerText: { fontSize: 12, color: "#9CA3AF", marginLeft: 4 },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 16 },
  emptySubtext: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
});