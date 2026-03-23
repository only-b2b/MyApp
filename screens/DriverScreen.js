// screens/DriverBookingScreen.js

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import DateTimePicker from "@react-native-community/datetimepicker";
import AddressSearch from "../components/AddressSearch";
import RadarPulse from "../components/RadarPulse";
import { getDirections } from "../lib/directions";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../config";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const BG = "#F9F9FA";
const CARD = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";

// Simple pricing model: only distance-based
const BASE_RATE_PER_KM = 12;   // ₹ per KM
const DRIVER_CHARGE = 100;     // fixed service/driver charge



export default function DriverBookingScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);

  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceText, setDistanceText] = useState(null);
  const [durationText, setDurationText] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [searchingDriver, setSearchingDriver] = useState(false);

  // -------- CAR DETAILS (Bottom Sheet) --------
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [carColor, setCarColor] = useState("");
  const [seats, setSeats] = useState("");
  const [year, setYear] = useState("");

  const carDetailsFilled =
    carBrand.trim() &&
    carModel.trim() &&
    carNumber.trim() &&
    fuelType.trim() &&
    transmission.trim() &&
    seats.trim();

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["40%", "75%"], []);

  const openCarSheet = () => bottomSheetRef.current?.snapToIndex(1);
  const closeCarSheet = () => bottomSheetRef.current?.close();

  // ─────────────────────────────
  // INITIAL LOCATION (LIKE PICKDROP)
  // ─────────────────────────────
  const fetchMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoadingLocation(false);
        alert("Location permission denied");
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
      alert("Unable to detect location");
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchMyLocation();
  }, []);

  // ─────────────────────────────
  // FETCH GOOGLE ROUTE (ROAD PATH)
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
        console.log("Route error", e);
      } finally {
        setLoadingRoute(false);
      }
    })();
  }, [pickup, drop]);

  // NUMERIC KM from "10.2 km"
  const distanceKm = useMemo(() => {
    if (!distanceText) return null;
    const m = distanceText.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  }, [distanceText]);

  // ESTIMATED FARE BASED ONLY ON DISTANCE
  const estimatedFare = useMemo(() => {
    if (!distanceKm) return null;
    return Math.round(distanceKm * BASE_RATE_PER_KM + DRIVER_CHARGE);
  }, [distanceKm]);

  const canProceed =
    pickup &&
    drop &&
    distanceKm &&
    carDetailsFilled &&
    estimatedFare &&
    !searchingDriver &&
    !loadingRoute;

  // RESET PICKUP = CURRENT LOCATION (also updates input)
  const useCurrentLocationForPickup = () => {
    if (!currentLocation) return;
    setPickup({
      description: "Your current location",
      location: currentLocation,
    });
    setMapRegion((prev) => ({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      latitudeDelta: prev?.latitudeDelta || 0.05,
      longitudeDelta: prev?.longitudeDelta || 0.05,
    }));
  };

  // ─────────────────────────────
  // DRIVER SEARCH FLOW (1 KM)
  // ─────────────────────────────
// In DriverBookingScreen.js - Replace the findDriver function

const findDriver = async () => {
  if (!canProceed) return;

  if (!pickup || !drop || routeCoords.length === 0) {
    alert("Route not ready yet");
    return;
  }

  try {
    setSearchingDriver(true);

    const user = auth().currentUser;
    if (!user) {
      alert("Please login again");
      return;
    }

    // 1️⃣ CREATE ORDER WITH ALL REQUIRED FIELDS
    const orderPayload = {
      firebase_uid: user.uid,
      service_type: "driver",
      
      // Vehicle info
      vehicle: `${carBrand} ${carModel}`,
      
      // Route info
      distance: distanceText,
      duration: durationText,
      price: estimatedFare,
      
      // Location coordinates
      pickup_lat: pickup.location.lat,
      pickup_lng: pickup.location.lng,
      drop_lat: drop.location.lat,
      drop_lng: drop.location.lng,
      
      // ✅ ADD THESE - ADDRESSES (MISSING BEFORE)
      pickup: pickup.description,
      drop: drop.description,
      
      // Payment (default to cash for driver service)
      payment: "cash",
      
      // ✅ ADD CAR DETAILS
      car_details: {
        brand: carBrand,
        model: carModel,
        number: carNumber,
        fuel_type: fuelType,
        transmission: transmission,
        color: carColor,
        seats: seats,
        year: year,
      },
      
      // Schedule
      scheduled_date: selectedDate.toISOString(),
    };

    console.log("Creating order:", orderPayload); // Debug log

    const createRes = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    if (!createRes.ok) {
      const errorData = await createRes.text();
      console.error("Create order failed:", errorData);
      throw new Error("Failed to create order");
    }

    const { id: orderId } = await createRes.json();
    console.log("Order created:", orderId);

    // 2️⃣ SEND REQUEST TO TECHNICIANS
    const requestRes = await fetch(`${API_BASE_URL}/orders/${orderId}/request`, {
      method: "POST",
    });

    if (!requestRes.ok) {
      throw new Error("Failed to send request");
    }

    console.log("Request sent to technicians");

    // 3️⃣ NAVIGATE WITH ROUTE DATA
    navigation.navigate("FindingDriverScreen", {
      orderId,
      pickup: pickup.location,
      pickupAddress: pickup.description,
      drop: drop.location,
      dropAddress: drop.description,
      routeCoords: routeCoords,
      
      // Vehicle Details
      vehicleId: "driver",
      vehicleName: "Professional Driver",
      vehicleCapacity: seats || 4,
      
      // Trip Details
      distance: distanceText,
      distanceKm: distanceKm,
      duration: durationText,
      durationMinutes: Math.ceil((distanceKm / 30) * 60), // Estimate
      
      // Fare Details
      totalFare: estimatedFare,
      baseFare: DRIVER_CHARGE,
      
      // Payment
      paymentMethod: "cash",
    });

  } catch (e) {
    console.error("Driver booking error:", e);
    alert(`Unable to find driver: ${e.message}`);
  } finally {
    setSearchingDriver(false);
  }
};

  // Summary for car card
  const carSummary = carDetailsFilled
    ? `${carBrand} ${carModel} • ${carNumber}`
    : "Add car brand, model & number";
// const buildOrderObject = () => ({
//   service_type: "driver",

//   location: {
//     pickup: pickup.description,
//     drop: drop.description,
//   },

//   route: {
//     distance: distanceText,
//     duration: durationText,
//   },

//   vehicle: `${carBrand} ${carModel}`,

//   pricing: {
//     total: estimatedFare,
//   },

//   schedule: {
//     date: selectedDate.toDateString(),
//     time: selectedDate.toLocaleTimeString(),
//   },
// });

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.header}>
        <Text style={styles.headerTitle}>Business Driver Service</Text>
        <Text style={styles.headerSub}>
          Schedule a professional driver for your meetings
        </Text>
      </LinearGradient>

      {/* MAP */}
      <View style={styles.mapBox}>
        {loadingLocation || !mapRegion ? (
          <View style={styles.mapLoader}>
            <ActivityIndicator color={ORANGE} />
            <Text style={styles.loadingSmall}>Detecting your location…</Text>
          </View>
        ) : (
          <>
            <MapView
              style={styles.map}
              region={mapRegion}
              initialRegion={mapRegion}
              provider="google"
              mapType="standard"
            >
              {/* PICKUP MARKER WITH RADAR */}
              {pickup && (
                <Marker
                  coordinate={{
                    latitude: pickup.location.lat,
                    longitude: pickup.location.lng,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <RadarPulse size={110} />
                    <Ionicons
                      name="navigate-circle"
                      size={34}
                      color={ORANGE}
                      style={{ position: "absolute" }}
                    />
                  </View>
                </Marker>
              )}

              {/* DROP MARKER */}
              {drop && (
                <Marker
                  coordinate={{
                    latitude: drop.location.lat,
                    longitude: drop.location.lng,
                  }}
                >
                  <Ionicons name="flag" size={30} color="#EF4444" />
                </Marker>
              )}

              {/* ROAD PATH */}
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={ORANGE}
                  strokeWidth={5}
                />
              )}
            </MapView>

            {/* SCANNING OVERLAY */}
            {searchingDriver && (
              <View style={styles.scanOverlay}>
                <Text style={styles.scanTitle}>Scanning nearby drivers…</Text>
                <Text style={styles.scanSub}>Checking within 1 km radius</Text>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginTop: 8 }}
                />
              </View>
            )}

            {/* ROUTE INFO OVER MAP TOP */}
            {(distanceText || durationText) && (
              <View style={styles.routeInfoPill}>
                <Ionicons name="navigate" size={16} color={ORANGE} />
                <Text style={styles.routeInfoText}>
                  {distanceText || "--"} • {durationText || "--"}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* BODY CONTENT (NO SCROLL) */}
      <View style={styles.body}>
        {/* PICKUP + DROP */}
        <View style={styles.cardRow}>
          <View style={styles.sideLine}>
            <View style={styles.dotPickup} />
            <View style={styles.dash} />
            <View style={styles.dotDrop} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Pickup</Text>
            <AddressSearch
              placeholder="Pick-up location"
              defaultText={pickup?.description}
              nearby={currentLocation}
              onSelect={(obj) => setPickup(obj)}
            />

            <TouchableOpacity
              style={styles.locRow}
              onPress={useCurrentLocationForPickup}
            >
              <Ionicons name="locate" size={14} color={ORANGE} />
              <Text style={styles.locText}>Use my current location</Text>
            </TouchableOpacity>

            <View style={{ height: 10 }} />

            <Text style={styles.label}>Drop</Text>
            <AddressSearch
              placeholder="Drop location"
              nearby={pickup?.location || currentLocation}
              onSelect={(obj) => setDrop(obj)}
            />
          </View>
        </View>

        {/* DATE & TIME */}
        <View style={styles.rowBetween}>
          <TouchableOpacity
            style={styles.metaCard}
            onPress={() => setShowDate(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={ORANGE} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.metaLabel}>Journey date</Text>
              <Text style={styles.metaValue}>
                {selectedDate.toDateString()}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metaCard}
            onPress={() => setShowTime(true)}
          >
            <Ionicons name="time-outline" size={18} color={ORANGE} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.metaLabel}>Pickup time</Text>
              <Text style={styles.metaValue}>
                {selectedDate.toLocaleTimeString()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {showDate && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            onChange={(e, d) => {
              setShowDate(false);
              if (d) setSelectedDate(d);
            }}
          />
        )}

        {showTime && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            onChange={(e, d) => {
              setShowTime(false);
              if (d) setSelectedDate(d);
            }}
          />
        )}

        {/* CAR DETAILS CARD (OPENS SHEET) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.carCard}
          onPress={openCarSheet}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.carIconWrap}>
              <Ionicons name="car-sport-outline" size={20} color={ORANGE} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.carTitle}>Your Car Details</Text>
              <Text
                style={[
                  styles.carSubtitle,
                  carDetailsFilled && { color: "#16A34A" },
                ]}
                numberOfLines={1}
              >
                {carSummary}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-up" size={18} color={MUTED} />
        </TouchableOpacity>
      </View>

      {/* BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomTitle}>
            {estimatedFare
              ? `Est. ₹${estimatedFare.toLocaleString("en-IN")}`
              : "Corporate driver booking"}
          </Text>
          <Text style={styles.bottomSub}>
            Professional, verified drivers for your business travel
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={findDriver}
          disabled={!canProceed}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={[ORANGE, ORANGE_LIGHT]}
            style={[
              styles.btn,
              (!canProceed || searchingDriver) && { opacity: 0.6 },
            ]}
          >
            {searchingDriver ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Find Driver</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ───────── CAR DETAILS BOTTOM SHEET ───────── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // start fully closed
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      >
        <BottomSheetView style={styles.sheetContent}>
          {/* Sheet header with close button */}
          <View style={styles.sheetHeaderRow}>
            <View>
              <Text style={styles.sheetTitle}>Your Car Details</Text>
              <Text style={styles.sheetSub}>
                Help the driver understand what car they’ll be driving.
              </Text>
            </View>
            <TouchableOpacity onPress={closeCarSheet}>
              <Ionicons name="close" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View style={styles.sheetRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.fieldLabel}>Brand *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Honda"
                  value={carBrand}
                  onChangeText={setCarBrand}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.fieldLabel}>Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. City"
                  value={carModel}
                  onChangeText={setCarModel}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Number Plate *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MH 12 AB 1234"
              value={carNumber}
              onChangeText={setCarNumber}
              autoCapitalize="characters"
            />

            <View style={styles.sheetRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.fieldLabel}>Fuel Type *</Text>
                <View style={styles.chipRow}>
                  {["Petrol", "Diesel", "CNG", "EV"].map((f) => {
                    const active = fuelType === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setFuelType(f)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {f}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.fieldLabel}>Transmission *</Text>
                <View style={styles.chipRow}>
                  {["Automatic", "Manual"].map((t) => {
                    const active = transmission === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setTransmission(t)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.sheetRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.fieldLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. White"
                  value={carColor}
                  onChangeText={setCarColor}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.fieldLabel}>Seats *</Text>
                <View style={styles.chipRow}>
                  {["4", "5", "6", "7"].map((n) => {
                    const active = seats === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[styles.chipSmall, active && styles.chipActive]}
                        onPress={() => setSeats(n)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Year (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2021"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
            />

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.sheetBtn, !carDetailsFilled && { opacity: 0.6 }]}
              onPress={() => {
                if (!carDetailsFilled) {
                  alert("Please fill all required car details (*)");
                  return;
                }
                closeCarSheet();
              }}
            >
              <LinearGradient
                colors={[ORANGE_LIGHT, ORANGE]}
                style={styles.sheetBtnInner}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.sheetBtnText}>Save car details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
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
  headerSub: { fontSize: 12, color: "#fff", marginTop: 4, opacity: 0.9 },

  mapBox: {
    height: 150,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  map: { flex: 1 },
  mapLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingSmall: { color: MUTED, marginTop: 6 },

  scanOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(15,23,42,0.8)",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  scanTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  scanSub: {
    color: "#e5e7eb",
    fontSize: 11,
    marginTop: 2,
  },

  routeInfoPill: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  routeInfoText: {
    marginLeft: 6,
    fontSize: 12,
    color: TEXT,
    fontWeight: "600",
  },

  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  cardRow: {
    flexDirection: "row",
    backgroundColor: CARD,
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 3,
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
    marginTop: 4,
    marginLeft: 4,
  },
  locText: {
    marginLeft: 4,
    color: ORANGE,
    fontSize: 12,
    fontWeight: "600",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  metaCard: {
    width: "48%",
    backgroundColor: "#FFF4E8",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 11,
    color: MUTED,
  },
  metaValue: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "600",
  },

  // Car details card
  carCard: {
    marginTop: 14,
    backgroundColor: CARD,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  carIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#FFF4E8",
    justifyContent: "center",
    alignItems: "center",
  },
  carTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },
  carSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
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
  btn: {
    paddingVertical: 10,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  // Bottom sheet styles
  sheetBg: {
    backgroundColor: "#FFFDF9",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },
  sheetSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
    marginBottom: 6,
  },
  sheetRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: "#fff",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 6,
    marginBottom: 6,
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: "#FFF0E0",
    borderWidth: 1,
    borderColor: ORANGE,
  },
  chipText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "500",
  },
  chipTextActive: {
    color: ORANGE,
    fontWeight: "700",
  },

  sheetBtn: {
    marginTop: 6,
  },
  sheetBtnInner: {
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  sheetBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 6,
  },
});
