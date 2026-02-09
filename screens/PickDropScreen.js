// screens/PickDropScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config";
import auth from "@react-native-firebase/auth";

import AddressSearch from "../components/AddressSearch";
import { getDirections } from "../lib/directions";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const BG = "#F9F9FA";
const CARD = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";

const VEHICLES = [
  {
    id: "mini",
    name: "Mini",
    desc: "Affordable ride",
    baseFare: 40,
    perKm: 12,
  },
  {
    id: "sedan",
    name: "Sedan",
    desc: "Comfort & space",
    baseFare: 60,
    perKm: 14,
  },
  {
    id: "suv",
    name: "SUV",
    desc: "Big family / luggage",
    baseFare: 80,
    perKm: 18,
  },
];

export default function PickDropScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);

  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceText, setDistanceText] = useState(null);
  const [durationText, setDurationText] = useState(null);

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);


  const user = auth().currentUser;


  // ─────────────────────────────
  // GET DEVICE LOCATION
  // ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLoadingLocation(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const coord = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };

        setCurrentLocation(coord);
        setPickup({
          description: "Your current location",
          location: coord,
        });

        setMapRegion({
          latitude: coord.lat,
          longitude: coord.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (e) {
        console.log(e);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // RESET pickup = current location
  const resetPickup = () => {
    if (!currentLocation) return;
    setPickup({
      description: "Your current location",
      location: currentLocation,
    });
    setMapRegion((prev) =>
      prev
        ? {
            ...prev,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          }
        : {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }
    );
  };

  // ─────────────────────────────
  // FETCH GOOGLE ROUTE
  // ─────────────────────────────
  useEffect(() => {
    (async () => {
      if (!pickup || !drop) {
        setRouteCoords([]);
        setDistanceText(null);
        setDurationText(null);
        return;
      }

      try {
        setLoadingRoute(true);
        const r = await getDirections(pickup.location, drop.location);
        if (r) {
          setRouteCoords(r.coords);
          setDistanceText(r.distance);
          setDurationText(r.duration);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoadingRoute(false);
      }
    })();
  }, [pickup, drop]);

  // "10 km" → 10
  const distanceKm = useMemo(() => {
    if (!distanceText) return null;
    const m = distanceText.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  }, [distanceText]);

  const estimatedFare = useMemo(() => {
    if (!selectedVehicle || !distanceKm) return null;
    const v = VEHICLES.find((x) => x.id === selectedVehicle);
    return Math.round(v.baseFare + v.perKm * distanceKm);
  }, [selectedVehicle, distanceKm]);

  const canContinue = pickup && drop && selectedVehicle && estimatedFare;

  if (!user) {
  alert("Please login again");
  return;
}

const continueToQuotation = async () => {
  const order = buildOrderObject();

  // 1️⃣ Create order
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        firebase_uid: user.uid,
        service_type: "pickdrop",
        vehicle: order.vehicle.name,
        distance: order.route.distance,
        duration: order.route.duration,
        price: order.pricing.total,
        pickup: order.location.pickup.description,
        drop: order.location.drop.description,
      }),

  });

  const { id } = await res.json();

  // 2️⃣ Send request to drivers (push happens here)
  await fetch(`${API_BASE_URL}/orders/${id}/request`, {
    method: "POST",
  });

  // 3️⃣ Go to finding screen
  navigation.navigate("FindingDriverScreen", { orderId: id });
};



  const buildOrderObject = () => {
  const v = VEHICLES.find((x) => x.id === selectedVehicle);

  return {
    service_type: "pickdrop",

    location: {
      pickup: {
        description: pickup?.description,
        lat: pickup?.location?.lat,
        lng: pickup?.location?.lng,
      },
      drop: {
        description: drop?.description,
        lat: drop?.location?.lat,
        lng: drop?.location?.lng,
      },
    },

    route: {
      distance: distanceText,
      duration: durationText,
      distance_km: distanceKm,
    },

    vehicle: {
      id: v?.id,
      name: v?.name,
      base_fare: v?.baseFare,
      per_km: v?.perKm,
    },

    pricing: {
      total: estimatedFare,
      currency: "INR",
    },

    address: {
      pickup: pickup?.description,
      drop: drop?.description,
    },

    created_at: new Date().toISOString(),
  };
};


  return (
    <View style={styles.root}>
      {/* HEADER */}
      <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pick & Drop Service</Text>
          <Text style={styles.headerSub}>
            Schedule a safe, reliable pickup and drop for your clients or team.
          </Text>
        </View>
      </LinearGradient>

      {/* MAP CARD */}
      <View style={styles.mapCard}>
        {loadingLocation ? (
          <View style={styles.mapLoader}>
            <ActivityIndicator color={ORANGE} />
            <Text style={styles.loadingSmall}>Detecting your location…</Text>
          </View>
        ) : mapRegion ? (
          <MapView
            style={styles.map}
            region={mapRegion}
            initialRegion={mapRegion}
            provider="google"
            mapType="standard"
          >
            {/* PICKUP MARKER */}
            {pickup && (
              <Marker
                coordinate={{
                  latitude: pickup.location.lat,
                  longitude: pickup.location.lng,
                }}
                title="Pickup"
              >
                <Ionicons name="navigate-circle" size={32} color={ORANGE} />
              </Marker>
            )}

            {/* DROP MARKER */}
            {drop && (
              <Marker
                coordinate={{
                  latitude: drop.location.lat,
                  longitude: drop.location.lng,
                }}
                title="Drop"
              >
                <Ionicons name="flag" size={28} color="#EF4444" />
              </Marker>
            )}

            {/* ROUTE POLYLINE */}
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={ORANGE}
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapLoader}>
            <Text style={styles.loadingSmall}>
              Map is not available. Please enable location.
            </Text>
          </View>
        )}

        {/* Small loading badge for route */}
        {loadingRoute && (
          <View style={styles.routeBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.routeBadgeText}>Optimising route…</Text>
          </View>
        )}
      </View>

      {/* CONTENT AREA (compact, business-style) */}
      <View style={styles.contentArea}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ADDRESS CARD */}
          <View style={styles.card}>
            {/* Vertical line indicator */}
            <View style={styles.sideLine}>
              <View style={styles.dotPickup} />
              <View style={styles.dash} />
              <View style={styles.dotDrop} />
            </View>

            <View style={{ flex: 1 }}>
              {/* PICKUP ROW */}
              <Text style={styles.label}>Pickup</Text>
              <AddressSearch
                placeholder="Pickup location"
                defaultText={pickup?.description}
                nearby={currentLocation}
                onSelect={(obj) => setPickup(obj)}
              />

              <TouchableOpacity style={styles.locRow} onPress={resetPickup}>
                <Ionicons name="locate" size={14} color={ORANGE} />
                <Text style={styles.locText}>Use current location</Text>
              </TouchableOpacity>

              {/* DROP ROW */}
              <View style={{ height: 14 }} />
              <Text style={styles.label}>Drop</Text>
              <AddressSearch
                placeholder="Drop location"
                onSelect={(obj) => setDrop(obj)}
                nearby={pickup?.location || currentLocation}
              />
            </View>
          </View>

          {/* DISTANCE SUMMARY */}
          {!!distanceText && (
            <View style={styles.distanceBox}>
              <View style={styles.summaryItem}>
                <Ionicons name="navigate" size={18} color={ORANGE} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.summaryLabel}>Distance</Text>
                  <Text style={styles.summaryValue}>{distanceText}</Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={18} color={ORANGE} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.summaryLabel}>ETA</Text>
                  <Text style={styles.summaryValue}>{durationText}</Text>
                </View>
              </View>
            </View>
          )}

          {/* VEHICLE SELECTION */}
          {pickup && drop && (
            <>
              <Text style={styles.secTitle}>Choose your vehicle</Text>
              <View style={styles.vehiclesRow}>
                {VEHICLES.map((v) => {
                  const active = v.id === selectedVehicle;
                  const fare =
                    distanceKm != null
                      ? Math.round(v.baseFare + v.perKm * distanceKm)
                      : null;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      activeOpacity={0.9}
                      style={[styles.vehicleCard, active && styles.vehicleActive]}
                      onPress={() => setSelectedVehicle(v.id)}
                    >
                      <Text style={styles.vehicleName}>{v.name}</Text>
                      {fare && (
                        <Text style={styles.vehiclePrice}>₹{fare}</Text>
                      )}
                      <Text style={styles.vehicleDesc}>{v.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* FIXED BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomTitle}>Trip Estimate</Text>
          <Text style={styles.bottomSub}>
            Select vehicle to view a precise quotation.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={continueToQuotation}
          disabled={!canContinue}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={[ORANGE, ORANGE_LIGHT]}
            style={[
              styles.bottomBtn,
              !canContinue && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.bottomBtnText}>View Quotation</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#fff"
              style={{ marginLeft: 6 }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 20, color: "#fff", fontWeight: "800" },
  headerSub: {
    fontSize: 12,
    color: "#fff",
    marginTop: 4,
    opacity: 0.95,
  },

  mapCard: {
    height: 200,
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  map: { flex: 1 },
  mapLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingSmall: { color: MUTED, marginTop: 6, fontSize: 12 },

  routeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(15,23,42,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  routeBadgeText: {
    color: "#fff",
    fontSize: 11,
    marginLeft: 6,
  },

  contentArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  card: {
    flexDirection: "row",
    backgroundColor: CARD,
    padding: 14,
    borderRadius: 16,
    elevation: 3,
    shadowOpacity: 0.05,
  },

  sideLine: { width: 20, alignItems: "center", marginTop: 6 },
  dotPickup: {
    width: 10,
    height: 10,
    backgroundColor: ORANGE,
    borderRadius: 6,
  },
  dash: {
    width: 2,
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  dotDrop: {
    width: 10,
    height: 10,
    backgroundColor: "#4B5563",
    borderRadius: 6,
  },

  label: { color: MUTED, fontSize: 12, marginLeft: 4, marginBottom: 4 },

  locRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locText: {
    marginLeft: 4,
    color: ORANGE,
    fontSize: 12,
    fontWeight: "600",
  },

  distanceBox: {
    marginTop: 14,
    backgroundColor: CARD,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
  },
  summaryItem: { flexDirection: "row", alignItems: "center" },
  summaryLabel: { fontSize: 11, color: MUTED },
  summaryValue: { fontSize: 13, fontWeight: "700", color: TEXT },

  secTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },

  vehiclesRow: { flexDirection: "row", justifyContent: "space-between" },

  vehicleCard: {
    width: "32%",
    backgroundColor: CARD,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  vehicleActive: {
    borderColor: ORANGE,
    backgroundColor: "#FFF4E8",
  },
  vehicleName: { fontSize: 13, fontWeight: "700", color: TEXT },
  vehiclePrice: { marginTop: 4, fontWeight: "800", color: ORANGE },
  vehicleDesc: {
    fontSize: 11,
    color: MUTED,
    marginTop: 4,
    textAlign: "center",
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  bottomTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },
  bottomSub: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  bottomBtn: {
    borderRadius: 18,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  bottomBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
