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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
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
  blue: "#3B82F6",
};

export default function RideDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { rideId } = route.params;

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);

  const fetchRideDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${rideId}`);
      const data = await res.json();
      setRide(data);
    } catch (err) {
      console.log("Fetch error:", err);
      Alert.alert("Error", "Failed to load ride details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
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
      case "completed": return COLORS.success;
      case "cancelled": return COLORS.error;
      case "in_progress": return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const handleCallDriver = () => {
    if (ride?.driver_phone) {
      Linking.openURL(`tel:${ride.driver_phone}`);
    }
  };

  const handleReportIssue = () => {
    Alert.alert(
      "Report Issue",
      "What would you like to report?",
      [
        { text: "Lost Item", onPress: () => navigation.navigate("HelpSupport") },
        { text: "Fare Issue", onPress: () => navigation.navigate("HelpSupport") },
        { text: "Driver Behaviour", onPress: () => navigation.navigate("HelpSupport") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleDownloadInvoice = () => {
    Alert.alert("Invoice", "Invoice will be sent to your email.");
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Ride not found</Text>
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
        <Text style={styles.headerTitle}>Ride Details</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map */}
        {ride.pickup_lat && ride.pickup_lng && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: ride.pickup_lat,
                longitude: ride.pickup_lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: ride.pickup_lat, longitude: ride.pickup_lng }}
                title="Pickup"
              >
                <View style={[styles.mapMarker, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="location" size={16} color="#fff" />
                </View>
              </Marker>
              {ride.drop_lat && ride.drop_lng && (
                <Marker
                  coordinate={{ latitude: ride.drop_lat, longitude: ride.drop_lng }}
                  title="Drop"
                >
                  <View style={[styles.mapMarker, { backgroundColor: COLORS.error }]}>
                    <Ionicons name="flag" size={16} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>
        )}

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(ride.status) + "15" }]}>
          <Ionicons
            name={ride.status === "completed" ? "checkmark-circle" : "close-circle"}
            size={24}
            color={getStatusColor(ride.status)}
          />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
              {ride.status?.replace("_", " ").toUpperCase()}
            </Text>
            <Text style={styles.statusDate}>{formatDate(ride.created_at)}</Text>
          </View>
        </View>

        {/* Service Type */}
        <View style={styles.section}>
          <View style={styles.serviceRow}>
            <View style={[styles.serviceIcon, { backgroundColor: COLORS.primary + "15" }]}>
              <Ionicons
                name={ride.service_type === "car_wash" ? "water" : "car-sport"}
                size={24}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceType}>
                {ride.service_type?.replace("_", " ").toUpperCase()}
              </Text>
              <Text style={styles.servicePackage}>{ride.package_name || "Standard"}</Text>
            </View>
            <Text style={styles.servicePrice}>{formatCurrency(ride.price)}</Text>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <View style={styles.routeDot} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeAddress}>{ride.pickup_address || "Not available"}</Text>
              </View>
            </View>
            {ride.drop_address && (
              <>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: COLORS.error }]} />
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Drop</Text>
                    <Text style={styles.routeAddress}>{ride.drop_address}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Trip Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{ride.distance || "—"}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.blue} />
            <Text style={styles.statValue}>{ride.duration || "—"}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="card-outline" size={20} color={COLORS.warning} />
            <Text style={styles.statValue}>{ride.payment_mode || "Cash"}</Text>
            <Text style={styles.statLabel}>Payment</Text>
          </View>
        </View>

        {/* Driver/Technician Details */}
        {ride.driver_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {ride.service_type === "car_wash" ? "Technician" : "Driver"}
            </Text>
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{ride.driver_name}</Text>
                <Text style={styles.driverVehicle}>{ride.vehicle_number || "—"}</Text>
                {ride.rating && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={COLORS.warning} />
                    <Text style={styles.ratingText}>{ride.rating}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.callDriverBtn} onPress={handleCallDriver}>
                <Ionicons name="call" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Ride Fare</Text>
              <Text style={styles.paymentValue}>{formatCurrency(ride.price)}</Text>
            </View>
            {ride.discount && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Discount</Text>
                <Text style={[styles.paymentValue, { color: COLORS.success }]}>
                  -{formatCurrency(ride.discount)}
                </Text>
              </View>
            )}
            <View style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotalLabel}>Total Paid</Text>
              <Text style={styles.paymentTotalValue}>{formatCurrency(ride.price)}</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Ionicons
                name={ride.payment_mode === "cash" ? "cash" : "card"}
                size={18}
                color={COLORS.textSecondary}
              />
              <Text style={styles.paymentMethodText}>
                Paid via {ride.payment_mode || "Cash"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadInvoice}>
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Download Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleReportIssue}>
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} />
            <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Rebook */}
        <TouchableOpacity style={styles.rebookBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.rebookBtnText}>Book Again</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#6B7280", marginTop: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  content: { flex: 1 },
  mapContainer: { height: 180, margin: 16, borderRadius: 16, overflow: "hidden" },
  map: { ...StyleSheet.absoluteFillObject },
  mapMarker: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusInfo: { marginLeft: 12 },
  statusText: { fontSize: 14, fontWeight: "700" },
  statusDate: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  section: { backgroundColor: "#FFFFFF", marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 12, textTransform: "uppercase" },
  serviceRow: { flexDirection: "row", alignItems: "center" },
  serviceIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  serviceInfo: { flex: 1, marginLeft: 12 },
  serviceType: { fontSize: 16, fontWeight: "700", color: "#111111" },
  servicePackage: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  servicePrice: { fontSize: 18, fontWeight: "800", color: "#111111" },
  routeContainer: { marginTop: 4 },
  routeRow: { flexDirection: "row", alignItems: "flex-start" },
  routeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#00A86B", marginTop: 4 },
  routeLine: { width: 2, height: 24, backgroundColor: "#E5E7EB", marginLeft: 5, marginVertical: 4 },
  routeTextContainer: { flex: 1, marginLeft: 12 },
  routeLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  routeAddress: { fontSize: 14, color: "#111111", marginTop: 2 },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: "#111111", marginTop: 8 },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#E5E7EB" },
  driverCard: { flexDirection: "row", alignItems: "center" },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#00A86B15", justifyContent: "center", alignItems: "center" },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: "700", color: "#111111" },
  driverVehicle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { fontSize: 13, fontWeight: "600", color: "#111111", marginLeft: 4 },
  callDriverBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#00A86B", justifyContent: "center", alignItems: "center" },
  paymentCard: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  paymentLabel: { fontSize: 14, color: "#6B7280" },
  paymentValue: { fontSize: 14, fontWeight: "600", color: "#111111" },
  paymentDivider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  paymentTotalLabel: { fontSize: 15, fontWeight: "700", color: "#111111" },
  paymentTotalValue: { fontSize: 18, fontWeight: "800", color: "#00A86B" },
  paymentMethod: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  paymentMethodText: { fontSize: 13, color: "#6B7280", marginLeft: 8 },
  actionsContainer: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionBtnText: { fontSize: 14, fontWeight: "600", color: "#00A86B", marginLeft: 8 },
  rebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  rebookBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginLeft: 8 },
});