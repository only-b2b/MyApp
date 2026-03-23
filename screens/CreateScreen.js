// screens/CreateScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, { FadeInRight, FadeOutLeft, FadeInLeft } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useLeads } from "../store/LeadsContext";

const VEHICLES = ["Sedan", "Hatchback", "SUV", "Luxury"];
const PACKAGES = [
  { id: "basic", name: "Basic Wash", price: 499, etaMin: 120 },
  { id: "premium", name: "Premium Wash", price: 999, etaMin: 180 },
  { id: "deluxe", name: "Deluxe Care", price: 1499, etaMin: 240 },
];

// Your five hubs (addresses). We’ll geocode these on demand and cache.
const HUBS = [
  {
    id: "hub1",
    label: "Law College Rd (near FTII), Shanti Sheela Society, Erandwane",
    address:
      "Law College Rd, near FTII Institute, Shanti Sheela Society, Erandwane, Pune, Maharashtra 411004, India",
  },
  {
    id: "hub2",
    label: "City Woods, opp. Gool Poonawalla Garden, Salisbury Park",
    address:
      "City woods, Shop 18, Opp Gool Poonawalla Garden, Salisbury Park, Pune, Maharashtra 411037, India",
  },
  {
    id: "hub3",
    label: "Fortaleza Complex, above NM Medical, Kalyani Nagar",
    address:
      "Fortaleza Complex, 2nd Floor, above NM Medical, Kalyani Nagar, Pune, Maharashtra 411006, India",
  },
  {
    id: "hub4",
    label: "Manhar House, next to Saibaba Mandir, Satara Rd",
    address:
      "Survey No.8/10, 3rd Floor, Manhar House, Next to Saibaba Mandir, Satara Rd, Pune, Maharashtra 411037, India",
  },
  {
    id: "hub5",
    label: "ICC Towers, B Wing, Senapati Bapat Rd",
    address:
      "9th Floor, ICC Towers, B Wing, Senapati Bapat Rd, Pune, Maharashtra 411016, India",
  },
];

// helpers
const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
};

const minutesToHuman = (min) => {
  if (!min && min !== 0) return "";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export default function CreateScreen({ navigation }) {
  const { addLead } = useLeads(); // will POST to your API
  const [step, setStep] = useState(1);

  // form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const [vehicle, setVehicle] = useState("");
  const [pkg, setPkg] = useState("");

  // location state
  const [addressInput, setAddressInput] = useState("");
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [resolvedAddress, setResolvedAddress] = useState("");

  // hubs geocoded cache
  const hubsRef = useRef({}); // id -> { ...hub, coords }
  const [hubsReady, setHubsReady] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);

  // computed quote bits
  const selectedPkg = useMemo(() => PACKAGES.find((p) => p.id === pkg), [pkg]);
  const [nearest, setNearest] = useState(null); // {hub, distanceKm, travelMin}
  const [totalEtaMin, setTotalEtaMin] = useState(null);

  const next = () => setStep((prev) => Math.min(prev + 1, 4));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  // ask for permissions once (when using "Use current location")
  const askLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need location permission to get your current location.");
      return false;
    }
    return true;
  };

  const useCurrentLocation = async () => {
    const ok = await askLocationPermissions();
    if (!ok) return;
    try {
      setGeoBusy(true);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ latitude, longitude });
      // reverse geocode nice address
      const r = await Location.reverseGeocodeAsync({ latitude, longitude });
      const nice =
        r?.[0]
          ? `${r[0].name || r[0].street || ""} ${r[0].district || ""}, ${r[0].city || r[0].subregion || ""} ${r[0].postalCode || ""}`.trim()
          : "";
      setResolvedAddress(nice);
      setAddressInput(nice);
    } catch (e) {
      Alert.alert("Location error", "Could not get current location.");
    } finally {
      setGeoBusy(false);
    }
  };

  const geocodeAddressInput = async () => {
    if (!addressInput?.trim()) {
      Alert.alert("Address needed", "Type an address first.");
      return;
    }
    try {
      setGeoBusy(true);
      const results = await Location.geocodeAsync(addressInput.trim());
      if (!results?.length) {
        Alert.alert("Not found", "Could not locate that address. Try being more specific.");
        return;
      }
      const { latitude, longitude } = results[0];
      setCoords({ latitude, longitude });
      setResolvedAddress(addressInput.trim());
    } catch (e) {
      Alert.alert("Geocode failed", "Could not resolve this address.");
    } finally {
      setGeoBusy(false);
    }
  };

  // geocode hubs lazily (only when we need them)
  const ensureHubsGeocoded = async () => {
    if (hubsReady) return;
    setGeoBusy(true);
    try {
      for (const hub of HUBS) {
        if (hubsRef.current[hub.id]?.coords) continue;
        const r = await Location.geocodeAsync(hub.address);
        if (r?.length) {
          hubsRef.current[hub.id] = { ...hub, coords: { latitude: r[0].latitude, longitude: r[0].longitude } };
        }
      }
      setHubsReady(true);
    } catch (e) {
      // even if geocoding fails for some hubs, we proceed with what we have
    } finally {
      setGeoBusy(false);
    }
  };

  // recompute nearest/ETA when we land on Step 4 or when coords/package change
  useEffect(() => {
    const run = async () => {
      if (step !== 4) return;
      // we need user coords and hubs
      await ensureHubsGeocoded();
      if (!coords) {
        setNearest(null);
        setTotalEtaMin(selectedPkg ? selectedPkg.etaMin : null);
        return;
      }

      // find nearest hub that has coordinates
      const hubsWithCoords = Object.values(hubsRef.current).filter((h) => h.coords);
      if (!hubsWithCoords.length) {
        setNearest(null);
        setTotalEtaMin(selectedPkg ? selectedPkg.etaMin : null);
        return;
      }

      let best = null;
      for (const h of hubsWithCoords) {
        const d = haversineKm(coords, h.coords);
        if (d == null) continue;
        if (!best || d < best.distanceKm) best = { hub: h, distanceKm: d };
      }

      if (best) {
        // assume average urban travel ~ 20km/h
        const travelMin = Math.max(5, Math.round((best.distanceKm / 20) * 60));
        setNearest({ ...best, travelMin });

        const serviceMin = selectedPkg?.etaMin ?? 0;
        setTotalEtaMin(travelMin + serviceMin);
      } else {
        setNearest(null);
        setTotalEtaMin(selectedPkg?.etaMin ?? null);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, JSON.stringify(coords), pkg]);

  const validateStep1 = () => {
    if (!name.trim()) return Alert.alert("Missing", "Please enter customer name.");
    if (!phone.trim()) return Alert.alert("Missing", "Please enter phone.");
    if (!city.trim()) return Alert.alert("Missing", "Please enter city.");
    return true;
  };

  const onConfirm = async () => {
    if (!selectedPkg) return Alert.alert("Package needed", "Please select a package.");
    // You can decide to *require* a location; for now we allow without.
    try {
      // Send to backend via LeadsContext
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        vehicle: vehicle,             // ✅ match API
        pkg: selectedPkg.id, 
        price: selectedPkg.price,
        // optional – your backend may or may not persist these now
        address: resolvedAddress || addressInput || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        nearestHubId: nearest?.hub?.id ?? null,
        nearestHubLabel: nearest?.hub?.label ?? null,
        distanceKm: nearest?.distanceKm ? Number(nearest.distanceKm.toFixed(2)) : null,
        travelMinutes: nearest?.travelMin ?? null,
        totalEtaMinutes: totalEtaMin ?? null,
        status: "New",
      };

      await addLead(payload);
      Alert.alert("Success", "Lead created successfully ✅", [
       { text: "OK", onPress: () => navigation.navigate("Home") }, // <- switch to Dashboard tab
     ]);
    } catch (e) {
      Alert.alert("Create failed", e?.message || "Could not create lead.");
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* stepper */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20 }}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={{
                width: 18,
                height: 6,
                borderRadius: 3,
                marginHorizontal: 4,
                backgroundColor: step >= s ? "#ff7a00" : "#e5e7eb",
              }}
            />
          ))}
        </View>

        {/* STEP 1 — Customer + Location */}
        {step === 1 && (
          <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 18,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16, color: "#111827" }}>Customer & Location</Text>

            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor: "#f9fafb",
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            />
            <TextInput
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={{
                backgroundColor: "#f9fafb",
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            />
            <TextInput
              placeholder="City"
              value={city}
              onChangeText={setCity}
              style={{
                backgroundColor: "#f9fafb",
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginBottom: 16,
              }}
            />

            {/* Location block */}
            <View
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 14,
                padding: 12,
                backgroundColor: "#fafafa",
              }}
            >
              <Text style={{ fontWeight: "700", marginBottom: 8, color: "#111827" }}>Service Location</Text>

              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={useCurrentLocation}
                  style={{
                    backgroundColor: "#eef2ff",
                    borderColor: "#c7d2fe",
                    borderWidth: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="locate-outline" size={18} color="#4f46e5" />
                  <Text style={{ marginLeft: 6, color: "#4338ca", fontWeight: "700" }}>
                    Use current location
                  </Text>
                </TouchableOpacity>

                {geoBusy && <ActivityIndicator />}
              </View>

              <Text style={{ marginTop: 10, color: "#64748b" }}>
                {coords
                  ? `Lat: ${coords.latitude.toFixed(5)}  Lng: ${coords.longitude.toFixed(5)}`
                  : "No location selected yet."}
              </Text>

              <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderColor: "#e5e7eb",
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 44,
                  }}
                  placeholder="Or type address & Locate (e.g. society, street, pincode)"
                  value={addressInput}
                  onChangeText={setAddressInput}
                />
                <TouchableOpacity
                  onPress={geocodeAddressInput}
                  style={{
                    backgroundColor: "#ffedd5",
                    borderColor: "#fdba74",
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#c2410c", fontWeight: "700" }}>Locate</Text>
                </TouchableOpacity>
              </View>

              {resolvedAddress ? (
                <Text style={{ marginTop: 8, color: "#0f766e" }}>📍 {resolvedAddress}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => (validateStep1() ? next() : null)}
              style={{
                marginTop: 20,
                backgroundColor: "#ff7a00",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Next: Vehicle</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* STEP 2 — Vehicle */}
        {step === 2 && (
          <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            style={{ backgroundColor: "#fff", padding: 20, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16, color: "#111827" }}>Vehicle Type</Text>

            {VEHICLES.map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setVehicle(v)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.4,
                  borderColor: vehicle === v ? "#ff7a00" : "#e5e7eb",
                  marginBottom: 10,
                  backgroundColor: vehicle === v ? "#fff5eb" : "#fff",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#111827" }}>{v}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginRight: 8,
                }}
                onPress={back}
              >
                <Text style={{ color: "#111827", fontWeight: "600" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#ff7a00",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={() => {
                  if (!vehicle) return Alert.alert("Missing", "Please select a vehicle type.");
                  next();
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Next: Package</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* STEP 3 — Package */}
        {step === 3 && (
          <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            style={{ backgroundColor: "#fff", padding: 20, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16, color: "#111827" }}>Select Package</Text>

            {PACKAGES.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPkg(p.id)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.4,
                  borderColor: pkg === p.id ? "#ff7a00" : "#e5e7eb",
                  marginBottom: 10,
                  backgroundColor: pkg === p.id ? "#fff5eb" : "#fff",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#111827" }}>
                  {p.name} — ₹{p.price}
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Base Service Time: {minutesToHuman(p.etaMin)}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginRight: 8,
                }}
                onPress={back}
              >
                <Text style={{ color: "#111827", fontWeight: "600" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#ff7a00",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={next}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Next: Quotation</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* STEP 4 — Quotation */}
        {step === 4 && (
          <Animated.View
            entering={FadeInLeft}
            exiting={FadeOutLeft}
            style={{ backgroundColor: "#fff", padding: 20, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16, color: "#111827" }}>
              Quotation & ETA
            </Text>

            <Text style={{ marginBottom: 6 }}>👤 {name}</Text>
            <Text style={{ marginBottom: 6 }}>📞 {phone}</Text>
            <Text style={{ marginBottom: 6 }}>🏙️ {city}</Text>
            <Text style={{ marginBottom: 6 }}>🚘 {vehicle || "—"}</Text>
            <Text style={{ marginBottom: 6 }}>📍 {resolvedAddress || addressInput || (coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "No location set")}</Text>

            {selectedPkg && (
              <View style={{ marginTop: 10 }}>
                <Text>📦 Package: {selectedPkg.name}</Text>
                <Text>💰 Price: ₹{selectedPkg.price}</Text>
                <Text>🧽 Service Time: {minutesToHuman(selectedPkg.etaMin)}</Text>
              </View>
            )}

            {geoBusy ? (
              <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={{ marginLeft: 8, color: "#64748b" }}>Calculating nearest hub & ETA…</Text>
              </View>
            ) : nearest ? (
              <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#ecfeff", borderWidth: 1, borderColor: "#a5f3fc" }}>
                <Text style={{ fontWeight: "700", color: "#0e7490" }}>Nearest Hub</Text>
                <Text style={{ color: "#0e7490" }}>🏠 {nearest.hub.label}</Text>
                <Text style={{ color: "#0e7490" }}>📏 Distance: {nearest.distanceKm.toFixed(2)} km</Text>
                <Text style={{ color: "#0e7490" }}>🚗 Travel: {minutesToHuman(nearest.travelMin)}</Text>
                <Text style={{ marginTop: 8, fontWeight: "700", color: "#0f766e" }}>
                  ⏱ Total ETA: {minutesToHuman(totalEtaMin ?? 0)}
                </Text>
              </View>
            ) : (
              <Text style={{ marginTop: 10, color: "#64748b" }}>
                Set a service location to estimate travel time from the nearest hub.
              </Text>
            )}

            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginRight: 8,
                }}
                onPress={back}
              >
                <Text style={{ color: "#111827", fontWeight: "600" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#16a34a",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={onConfirm}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
