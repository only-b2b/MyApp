import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import Animated, {
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

/* ===== COLORS ===== */
const BRAND = "#FF6B00";
const BRAND_LIGHT = "#FFB347";
const BG = "#F6F7FB";
const WHITE = "#ffffff";
const TEXT = "#111827";
const MUTED = "#6B7280";

const { width } = Dimensions.get("window");

export default function ServiceSelectScreen({ navigation }) {
  const [addressTitle, setAddressTitle] = useState("Fetching location...");
  const [addressSub, setAddressSub] = useState("Please wait");
  const [locLoading, setLocLoading] = useState(false);

  /* ===== SLIDER STATE ===== */
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef(null);

  const sliderData = useMemo(
    () => [
      { id: "1", image: require("../assets/images/vehicle1.png") },
      { id: "2", image: require("../assets/images/vehicle2.png") },
      { id: "3", image: require("../assets/images/vehicle3.png") },
    ],
    []
  );

  /* ===== FLOATING IMAGE ===== */
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(withTiming(-8, { duration: 2000 }), -1, true);
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  /* ===== LOCATION FUNCTION (MOVED OUT – FIX) ===== */
  const loadLocation = async () => {
    try {
      setLocLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setAddressTitle("Permission denied");
        setAddressSub("Enable location services");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geo = await Location.reverseGeocodeAsync(pos.coords);
      const g = geo?.[0];

      const primary =
        [g?.name, g?.street].filter(Boolean).join(", ") ||
        "Current location";

      const secondary = [
        g?.district || g?.subregion,
        g?.city,
        g?.postalCode,
      ]
        .filter(Boolean)
        .join(" • ");

      setAddressTitle(primary);
      setAddressSub(secondary || "Detecting address...");
    } catch (e) {
      setAddressTitle("Unable to fetch location");
      setAddressSub("Tap to retry");
    } finally {
      setLocLoading(false);
    }
  };

  /* ===== LOAD LOCATION ON MOUNT ===== */
  useEffect(() => {
    loadLocation();
  }, []);

  /* ===== SERVICES ===== */
  const services = useMemo(
    () => [
      {
        key: "wash",
        title: "Car Wash",
        desc: "Doorstep cleaning",
        icon: "water-outline",
        onPress: () => navigation.navigate("CarWash"),
      },
      {
        key: "pickdrop",
        title: "Pick & Drop",
        desc: "Pickup & return",
        icon: "car-outline",
        onPress: () => navigation.navigate("PickDrop"),
      },
      {
        key: "driver",
        title: "Driver",
        desc: "On demand",
        icon: "person-outline",
        onPress: () => navigation.navigate("Driver"),
      },
    ],
    [navigation]
  );

  /* ===== SERVICE TILE ===== */
  const ServiceTile = ({ title, desc, icon, onPress }) => {
    const scale = useSharedValue(1);

    const style = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={[styles.tileWrap, style]}>
        <TouchableOpacity
          style={styles.tile}
          activeOpacity={0.9}
          onPressIn={() => (scale.value = withSpring(0.97))}
          onPressOut={() => (scale.value = withSpring(1))}
          onPress={onPress}
        >
          <View style={styles.iconPill}>
            <Ionicons name={icon} size={22} color={BRAND} />
          </View>
          <Text style={styles.tileTitle}>{title}</Text>
          <Text style={styles.tileSub}>{desc}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      {/* ===== HEADER ===== */}
      <LinearGradient colors={[BRAND_LIGHT, BRAND]} style={styles.topBar}>
        {/* LOCATION */}
        <View style={styles.locationCard}>
          <View style={styles.locationIconWrap}>
            <Ionicons name="navigate" size={16} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Your location</Text>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            <Text style={styles.locationTitle} numberOfLines={1}>
              {addressTitle}
            </Text>

            <Text style={styles.locationSub} numberOfLines={1}>
              📍 {addressSub}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadLocation}
            disabled={locLoading}
          >
            <Ionicons
              name={locLoading ? "time-outline" : "refresh"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={MUTED} />
          <TextInput
            placeholder="Search for services"
            placeholderTextColor={MUTED}
            style={styles.searchInput}
          />
        </View>

        {/* SLIDER */}
        <ScrollView
          ref={sliderRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / width
            );
            setActiveSlide(index);
          }}
          scrollEventThrottle={16}
          style={styles.sliderWrap}
        >
          {sliderData.map((item) => (
            <View key={item.id} style={{ width }}>
              <View style={styles.slideCard}>
                <Animated.Image
                  source={item.image}
                  style={[styles.slideImage, imageStyle]}
                  resizeMode="contain"
                />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* DOTS */}
        <View style={styles.dotsRow}>
          {sliderData.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeSlide && styles.dotActive]}
            />
          ))}
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Choose a service</Text>

        <View style={styles.grid}>
          {services.map(({ key, ...rest }) => (
            <ServiceTile key={key} {...rest} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  locationCard: { flexDirection: "row", alignItems: "center" },

  locationIconWrap: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  locationRow: { flexDirection: "row", alignItems: "center" },

  locationLabel: { fontSize: 11, color: "#fff", opacity: 0.9 },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginLeft: 6,
  },

  liveText: {
    fontSize: 10,
    color: "#22C55E",
    fontWeight: "700",
    marginLeft: 4,
  },

  locationTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },

  locationSub: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.85,
  },

  refreshBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  searchBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },

  searchInput: { marginLeft: 8, flex: 1, fontSize: 14, color: TEXT },

  sliderWrap: { marginTop: 12, marginLeft: -18, marginRight: -18 },

  slideCard: {
    marginHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    height: 140,
    justifyContent: "center",
  },

  slideImage: { width: "100%", height: 140 },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
    marginHorizontal: 3,
  },

  dotActive: { width: 16, backgroundColor: "#fff" },

  content: { padding: 18 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
    color: TEXT,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  tileWrap: { width: "48%", marginBottom: 14 },

  tile: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },

  iconPill: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: "#FFF1E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  tileTitle: { fontSize: 14, fontWeight: "700", color: TEXT },

  tileSub: { fontSize: 12, color: MUTED, marginTop: 4 },
});
