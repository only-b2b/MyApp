// screens/TechnicianEnRouteScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config";

const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  dark: "#1C1C1E",
  muted: "#6B7280",
  white: "#FFFFFF",
  bg: "#F5F6F8",
  card: "#FFFFFF",
};

export default function TechnicianEnRouteScreen({ route, navigation }) {
  const { orderId, technician } = route.params;
  
  const [order, setOrder] = useState(null);
  const [techLocation, setTechLocation] = useState(null);
  const [eta, setEta] = useState(null);
  
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Slide up animation for bottom card
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation for van marker
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Poll for order status and technician location
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();
        
        setOrder(data);
        
        if (data.driverLocation) {
          setTechLocation({
            latitude: data.driverLocation.lat,
            longitude: data.driverLocation.lng,
          });
        }

        // Handle status changes
        if (data.status === "arrived") {
          navigation.replace("TechnicianArrivedScreen", { 
            orderId,
            technician: data.driver,
            otp: data.otp,
          });
        }
      } catch (err) {
        console.log("Fetch error:", err);
      }
    };

    fetchOrderData();
    const interval = setInterval(fetchOrderData, 5000);
    
    return () => clearInterval(interval);
  }, [orderId]);

  // Fit map to show both markers
  useEffect(() => {
    if (mapRef.current && techLocation && order?.pickupLocation) {
      const coordinates = [
        techLocation,
        {
          latitude: order.pickupLocation.lat,
          longitude: order.pickupLocation.lng,
        },
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, bottom: 300, left: 50, right: 50 },
        animated: true,
      });
    }
  }, [techLocation, order]);

  const handleCall = () => {
    if (technician?.phone) {
      Linking.openURL(`tel:${technician.phone}`);
    }
  };

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Client Location Marker */}
        {order?.pickupLocation && (
          <Marker
            coordinate={{
              latitude: order.pickupLocation.lat,
              longitude: order.pickupLocation.lng,
            }}
          >
            <View style={styles.clientMarker}>
              <Ionicons name="home" size={20} color={COLORS.white} />
            </View>
          </Marker>
        )}

        {/* Technician Location Marker */}
        {techLocation && (
          <Marker coordinate={techLocation}>
            <Animated.View 
              style={[
                styles.techMarker,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Ionicons name="car" size={20} color={COLORS.white} />
            </Animated.View>
          </Marker>
        )}

        {/* Route Line */}
        {techLocation && order?.pickupLocation && (
          <Polyline
            coordinates={[
              techLocation,
              {
                latitude: order.pickupLocation.lat,
                longitude: order.pickupLocation.lng,
              },
            ]}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Technician En Route</Text>
          <View style={styles.etaChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.etaText}>
              {order.duration || "Calculating..."}
            </Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Bottom Card */}
      <Animated.View 
        style={[
          styles.bottomCard,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Status Banner */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.statusBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="car" size={20} color={COLORS.white} />
          <Text style={styles.statusText}>
            Van is on the way to your location
          </Text>
        </LinearGradient>

        {/* Technician Info */}
        <View style={styles.techInfo}>
          <View style={styles.techAvatar}>
            <Ionicons name="person" size={28} color={COLORS.primary} />
          </View>
          
          <View style={styles.techDetails}>
            <Text style={styles.techName}>
              {technician?.full_name || "Technician"}
            </Text>
            <Text style={styles.techVehicle}>
              {technician?.vehicle || "Service Van"}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.tripCount}>• 150+ washes</Text>
            </View>
          </View>

          {/* Call Button */}
          <TouchableOpacity 
            style={styles.callBtn}
            onPress={handleCall}
          >
            <Ionicons name="call" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Service Details */}
        <View style={styles.serviceDetails}>
          <View style={styles.serviceItem}>
            <Ionicons name="location" size={18} color={COLORS.muted} />
            <Text style={styles.serviceText} numberOfLines={1}>
              {order.pickup_address || "Your location"}
            </Text>
          </View>
          <View style={styles.serviceItem}>
            <Ionicons name="water" size={18} color={COLORS.primary} />
            <Text style={styles.serviceText}>
              {order.package_name || "Car Wash Service"}
            </Text>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.safetyTip}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
          <Text style={styles.safetyText}>
            Share OTP only with the technician for verification
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  etaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  etaText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  clientMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  techMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 6,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 14,
  },
  techInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  techAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  techDetails: {
    flex: 1,
    marginLeft: 14,
  },
  techName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
  },
  techVehicle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: "600",
    color: COLORS.dark,
    fontSize: 13,
  },
  tripCount: {
    marginLeft: 4,
    color: COLORS.muted,
    fontSize: 12,
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceDetails: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  serviceText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  safetyTip: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    padding: 14,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
  },
  safetyText: {
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
  },
});