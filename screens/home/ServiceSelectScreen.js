// screens/home/ServiceSelectScreen.js

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
  interpolate,
  Extrapolate,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAuth } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import { API_BASE_URL } from "../../config";
import { searchNearbyPlaces, getPlaceType } from "../../lib/nearbyPlaces";
import NearbyPlacesSheet from "../../components/NearbyPlacesSheet";

const { width } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const C = {
  violet:          "#3D2B8C",
  violetDark:      "#2A1E6B",
  violetMid:       "#4D3CA0",
  blue:            "#1E40AF",
  blueDark:        "#1E3A8A",
  blueDeep:        "#172554",
  primarySoft:     "#EEEAFB",
  primarySoftDeep: "#DCD4F5",
  lavenderBg:      "#F1EEFB",
  primaryFade:     "rgba(61,43,140,0.08)",
  primaryGlow:     "rgba(61,43,140,0.30)",
  gold:            "#C9980A",
  goldLight:       "#E8B923",
  goldBright:      "#F0C93A",
  goldDark:        "#8B6508",
  goldDeep:        "#4A3200",
  goldSoft:        "#FBF0D0",
  goldGlow:        "rgba(201,152,10,0.35)",
  bg:              "#F7F7FA",
  card:            "#FFFFFF",
  surface:         "#F9FAFB",
  textDark:        "#0F0F1F",
  textPrimary:     "#1F1F33",
  textMid:         "#4A4A66",
  textLight:       "#7B7B95",
  textFaint:       "#A8A8BC",
  border:          "#EDEDF2",
  borderMid:       "#DDDDE5",
  divider:         "#E8E8EE",
  pastelBlue:      "#E3F0FF",
  blueAccent:      "#3B82F6",
  pastelGreen:     "#E8F5E9",
  green:           "#34A853",
  greenDark:       "#16A34A",
  pastelOrange:    "#FFE8D6",
  orange:          "#F59E0B",
  pastelRed:       "#FEE2E2",
  red:             "#EF4444",
  success:         "#22C55E",
  successBg:       "#E8F8EF",
  successDark:     "#16A34A",
  warning:         "#F59E0B",
  warningBg:       "#FFFBEB",
  pastelIndigo:    "#E0E7FF",
  indigo:          "#6366F1",
  pastelYellow:    "#FFF6D6",
  yellow:          "#F59E0B",
  white:           "#FFFFFF",
  shadow:          "#0F0F1F",
  teal:            "#0D9488",
  tealDark:        "#0F766E",
  tealSoft:        "#CCFBF1",
  cyan:            "#06B6D4",
  cyanDark:        "#0891B2",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, big: 48 };
const R  = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary:     [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  goldShine:   [C.goldBright, C.goldLight, C.gold],
  lavender:    [C.primarySoft, C.lavenderBg],
  teal:        [C.teal, C.tealDark],
  sunset:      ["#F97316", "#EF4444"],
  ocean:       ["#0EA5E9", "#3B82F6", "#6366F1"],
};

// ==================== DATA ====================
const TOP_OFFERS = [
  {
    id: "ride", icon: "car-sport", iconBg: GRAD.primary,
    title: "Book a Ride", desc: "Cab in 3 min, fast pickup",
    badge: "BOOK NOW", badgeBg: C.primarySoft, badgeColor: C.violet, route: "PickDrop",
  },
  {
    id: "wash", icon: "water", iconBg: ["#1E40AF", "#3B82F6"],
    title: "Car Wash", desc: "Doorstep cleaning service",
    badge: "WASH NOW", badgeBg: C.pastelBlue, badgeColor: C.blueAccent, route: "CarWash",
  },
  {
    id: "driver", icon: "person", iconBg: [C.green, C.greenDark],
    title: "Hire a Driver", desc: "Trained pros for your car",
    badge: "HIRE NOW", badgeBg: C.pastelGreen, badgeColor: C.green, route: "Driver",
  },
];

const SERVICES = [
  {
    id: "ride", title: "Book a Ride", desc: "Get a cab in 3 minutes",
    icon: "car-sport", route: "PickDrop", badge: "POPULAR", eta: "3 min", rating: "4.9",
    iconBg: C.primarySoft, iconColor: C.violet,
  },
  {
    id: "wash", title: "Car Wash", desc: "Doorstep cleaning service",
    icon: "water", route: "CarWash", badge: "NEW", eta: "10 min", rating: "4.8",
    iconBg: C.pastelBlue, iconColor: C.blueAccent,
  },
  {
    id: "driver", title: "Hire a Driver", desc: "Trained professionals for your car",
    icon: "person", route: "Driver", badge: null, eta: "5 min", rating: "4.9",
    iconBg: C.pastelGreen, iconColor: C.green,
  },
];

const CATEGORIES = [
  { id: "1", icon: "airplane", label: "Airport", iconBg: C.primarySoft, color: C.violet },
  { id: "2", icon: "medkit",   label: "Hospital", iconBg: C.pastelRed, color: C.red },
  { id: "3", icon: "cart",     label: "Mall",     iconBg: C.pastelOrange, color: C.orange },
  { id: "4", icon: "school",   label: "College",  iconBg: C.pastelBlue, color: C.blueAccent },
  { id: "5", icon: "ellipsis-horizontal", label: "More", iconBg: C.goldSoft, color: C.gold },
];

// ==================== PRIMITIVES ====================
const Press = ({ children, onPress, style, scale = 0.97 }) => {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      style={style}
      onPressIn={() => { s.value = withSpring(scale, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
    >
      <Animated.View style={a}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const Pulse = React.memo(({ size = 5, color = C.violet }) => {
  const sc = useSharedValue(1);
  const op = useSharedValue(0.6);
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(2.4, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1);
    op.value = withRepeat(withSequence(withTiming(0, { duration: 1200 }), withTiming(0.6, { duration: 1200 })), -1);
    return () => { cancelAnimation(sc); cancelAnimation(op); };
  }, []);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: op.value }));
  return (
    <View style={{ width: size * 3, height: size * 3, justifyContent: "center", alignItems: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size * 2, height: size * 2, borderRadius: size, backgroundColor: color }, ring]} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
});

const SHead = ({ title }) => (
  <View style={styles.sHead}>
    <Text style={styles.sTitle}>{title}</Text>
  </View>
);

// ==================== HERO BANNER — "Where are you going?" ====================
const HeroBanner = React.memo(({ onPress, greeting, name }) => {
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,  { duration: 2800, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    float2.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }), -1
    );
    return () => { cancelAnimation(float1); cancelAnimation(float2); cancelAnimation(shimmer); };
  }, []);

  const float1A = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }] }));
  const float2A = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }] }));
  const shimmerA = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.8, 0.4]),
  }));

  return (
    <Animated.View entering={FadeInDown.duration(600).springify().damping(18)}>
      <LinearGradient
        colors={GRAD.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        {/* Background art */}
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={styles.heroDecor3} />

        <View style={styles.heroContent}>
          {/* Greeting */}
          <View style={styles.heroGreetRow}>
            <Text style={styles.heroGreeting}>{greeting},</Text>
            <Text style={styles.heroName}> {name}! 👋</Text>
          </View>

          {/* Main headline */}
          <Text style={styles.heroTitle}>Where are you{"\n"}going today?</Text>

          {/* Stats row */}
          <View style={styles.heroStatsRow}>
            {[
              { icon: "car-sport", label: "Rides", value: "3 min", color: C.goldBright },
              { icon: "water",     label: "Wash",  value: "At door", color: C.cyan },
              { icon: "person",    label: "Driver", value: "5 min", color: C.success },
            ].map((stat, i) => (
              <View key={i} style={styles.heroStatItem}>
                <Ionicons name={stat.icon} size={14} color={stat.color} />
                <Text style={styles.heroStatValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* Search bar CTA */}
          <TouchableOpacity
            style={styles.heroSearchBar}
            onPress={onPress}
            activeOpacity={0.9}
          >
            <View style={styles.heroSearchDot} />
            <Text style={styles.heroSearchText}>Enter your destination</Text>
            <View style={styles.heroSearchArrow}>
              <Ionicons name="arrow-forward" size={16} color={C.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Floating illustrations */}
        <View style={styles.heroIllustrationWrap}>
          {/* Car */}
          <Animated.View style={[styles.heroCarWrap, float1A]}>
            <LinearGradient colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.08)"]} style={styles.heroCar}>
              <Ionicons name="car-sport" size={34} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
          </Animated.View>

          {/* Location pin */}
          <Animated.View style={[styles.heroPinWrap, float2A]}>
            <View style={styles.heroPin}>
              <Ionicons name="location" size={18} color={C.goldBright} />
            </View>
            <View style={styles.heroPinShadow} />
          </Animated.View>

          {/* Route dots */}
          <Animated.View style={[styles.heroRouteDotsWrap, shimmerA]}>
            {[0, 1, 2, 3].map((_, i) => (
              <View key={i} style={[styles.heroRouteDot, { opacity: 1 - i * 0.2 }]} />
            ))}
          </Animated.View>

          {/* Sparkles */}
          {[
            { top: 5, right: 10, size: 5, color: C.goldBright },
            { top: 30, right: -2, size: 4, color: "rgba(255,255,255,0.5)" },
            { bottom: 20, right: 25, size: 6, color: C.goldLight },
            { top: 50, right: 40, size: 3, color: "rgba(255,255,255,0.4)" },
          ].map((s, i) => (
            <View key={i} style={{
              position: "absolute", top: s.top, right: s.right, bottom: s.bottom,
              width: s.size, height: s.size, borderRadius: s.size / 2, backgroundColor: s.color,
            }} />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// ==================== TOP OFFER CARD ====================
const TopOfferCard = React.memo(({ item, index, onPress }) => (
  <Animated.View entering={SlideInRight.delay(index * 80).duration(420).springify()}>
    <Press onPress={onPress} scale={0.97}>
      <View style={styles.topOfferCard}>
        <LinearGradient colors={item.iconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topOfferIconCircle}>
          <Ionicons name={item.icon} size={22} color={C.white} />
        </LinearGradient>
        <Text style={styles.topOfferTitle}>{item.title}</Text>
        <Text style={styles.topOfferDesc} numberOfLines={2}>{item.desc}</Text>
        <View style={[styles.topOfferBadge, { backgroundColor: item.badgeBg }]}>
          <Text style={[styles.topOfferBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
        </View>
      </View>
    </Press>
  </Animated.View>
));

// ==================== CATEGORY ITEM ====================
const CategoryItem = React.memo(({ item, index, onPress }) => (
  <Animated.View entering={ZoomIn.delay(index * 55 + 100).duration(400).springify().damping(13)}>
    <Press onPress={onPress} scale={0.9} style={styles.catWrap}>
      <View style={[styles.catCircle, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={21} color={item.color} />
      </View>
      <Text style={styles.catLabel}>{item.label}</Text>
    </Press>
  </Animated.View>
));

// ==================== SERVICE CARD ====================
const ServiceCard = React.memo(({ item, index, onPress }) => (
  <Animated.View entering={FadeInUp.delay(index * 70 + 100).duration(440).springify()}>
    <Press onPress={onPress} scale={0.985}>
      <View style={styles.svcCard}>
        {item.badge && (
          <LinearGradient
            colors={item.badge === "POPULAR" ? GRAD.primary : GRAD.goldShine}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.svcBadge}
          >
            {item.badge === "POPULAR" && <Ionicons name="star" size={8} color={C.white} />}
            <Text style={[styles.svcBadgeText, item.badge !== "POPULAR" && { color: C.goldDeep }]}>
              {item.badge}
            </Text>
          </LinearGradient>
        )}
        <View style={styles.svcLeft}>
          <View style={[styles.svcIcon, { backgroundColor: item.iconBg }]}>
            <Ionicons name={item.icon} size={22} color={item.iconColor} />
          </View>
          <View style={styles.svcText}>
            <Text style={styles.svcTitle}>{item.title}</Text>
            <Text style={styles.svcDesc}>{item.desc}</Text>
            <View style={styles.svcMeta}>
              <Ionicons name="time-outline" size={11} color={C.textFaint} />
              <Text style={styles.svcMetaText}>{item.eta}</Text>
              <View style={styles.svcMetaDot} />
              <Ionicons name="star" size={11} color={C.gold} />
              <Text style={styles.svcMetaText}>{item.rating}</Text>
            </View>
          </View>
        </View>
        <View style={styles.svcArrow}>
          <Ionicons name="chevron-forward" size={15} color={C.violet} />
        </View>
      </View>
    </Press>
  </Animated.View>
));

// ==================== PROMO BANNER — "Your Rides, Your Way" ====================
const PromoBanner = React.memo(({ onRide, onWash, onDriver }) => {
  const glow = useSharedValue(0.3);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ), -1
    );
    return () => cancelAnimation(glow);
  }, []);

  const glowA = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(500)}>
      <View style={styles.promoBanner}>
        <LinearGradient
          colors={["#0F172A", "#1E293B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Glow effects */}
        <Animated.View style={[styles.promoGlow1, glowA]} />
        <Animated.View style={[styles.promoGlow2, glowA]} />

        {/* Content */}
        <View style={styles.promoContent}>
          {/* Top section */}
          <View style={styles.promoTopRow}>
            <View style={styles.promoTagWrap}>
              <LinearGradient colors={GRAD.goldShine} style={styles.promoTag}>
                <Ionicons name="diamond" size={10} color={C.goldDeep} />
                <Text style={styles.promoTagText}>PREMIUM</Text>
              </LinearGradient>
            </View>
          </View>

          <Text style={styles.promoTitle}>Your Rides,{"\n"}Your Way</Text>
          <Text style={styles.promoDesc}>
            Premium service at your fingertips. Choose what you need.
          </Text>

          {/* Action pills */}
          <View style={styles.promoPillsRow}>
            <TouchableOpacity style={styles.promoPill} onPress={onRide} activeOpacity={0.85}>
              <LinearGradient colors={GRAD.primary} style={styles.promoPillGrad}>
                <Ionicons name="car-sport" size={14} color={C.white} />
                <Text style={styles.promoPillText}>Ride</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.promoPill} onPress={onWash} activeOpacity={0.85}>
              <LinearGradient colors={GRAD.ocean} style={styles.promoPillGrad}>
                <Ionicons name="water" size={14} color={C.white} />
                <Text style={styles.promoPillText}>Wash</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.promoPill} onPress={onDriver} activeOpacity={0.85}>
              <LinearGradient colors={GRAD.teal} style={styles.promoPillGrad}>
                <Ionicons name="person" size={14} color={C.white} />
                <Text style={styles.promoPillText}>Driver</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Side illustration */}
        <View style={styles.promoIllustrationWrap}>
          <View style={styles.promoRing1}>
            <View style={styles.promoRing2}>
              <View style={styles.promoRing3}>
                <Ionicons name="shield-checkmark" size={22} color={C.goldBright} />
              </View>
            </View>
          </View>

          {/* Feature dots */}
          {[
            { icon: "star",      top: -5,  right: 5,  bg: C.goldBright },
            { icon: "heart",     top: 25,  right: -8, bg: C.red },
            { icon: "flash",     bottom: 5, right: 10, bg: C.cyan },
          ].map((d, i) => (
            <View key={i} style={[styles.promoFeatureDot, { top: d.top, right: d.right, bottom: d.bottom, backgroundColor: d.bg }]}>
              <Ionicons name={d.icon} size={8} color={C.white} />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
});

// ==================== MAIN SCREEN ====================
export default function ServiceSelectScreen({ navigation }) {
  const insets       = useSafeAreaInsets();
  const scrollRef    = useRef(null);
  const auth         = getAuth(getApp());
  const firebaseUser = auth.currentUser;

  const [user,           setUser]           = useState(null);
  const [addrTitle,      setAddrTitle]      = useState("Detecting location…");
  const [addrSub,        setAddrSub]        = useState("Please wait");
  const [locLoading,     setLocLoading]     = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [activeOffer,    setActiveOffer]    = useState(0);
  const [trips,          setTrips]          = useState([]);
  const [tripsLoad,      setTripsLoad]      = useState(true);
  const [greeting,       setGreeting]       = useState("Good morning");
  const [currentLoc,     setCurrentLoc]     = useState(null);
  const [nearbyPlaces,   setNearbyPlaces]   = useState([]);
  const [nearbyLoading,  setNearbyLoading]  = useState(false);
  const [nearbyCategory, setNearbyCategory] = useState("");
  const [showNearby,     setShowNearby]     = useState(false);

  const scrollY       = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });
  const headerShadow = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scrollY.value, [0, 60], [0, 0.08], Extrapolate.CLAMP),
    elevation:     interpolate(scrollY.value, [0, 60], [0, 4],    Extrapolate.CLAMP),
  }));

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      setUser({ name: firebaseUser.displayName || "User", email: firebaseUser.email, photo: firebaseUser.photoURL });
    }
  }, []);

  const loadLocation = useCallback(async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setAddrTitle("Location needed"); setAddrSub("Tap to enable"); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await Location.reverseGeocodeAsync(pos.coords);
      const g   = geo?.[0];
      setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setAddrTitle([g?.name, g?.street].filter(Boolean).join(", ") || "Current location");
      setAddrSub([g?.district || g?.subregion, g?.city].filter(Boolean).join(", ") || "Located");
    } catch { setAddrTitle("Unable to detect"); setAddrSub("Tap to retry"); }
    finally { setLocLoading(false); }
  }, []);

  const handleQuickNav = useCallback(async (dest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!currentLoc) { Alert.alert("Location Required", "Enable location to find nearby places."); return; }
    setNearbyCategory(dest.label);
    setNearbyLoading(true);
    setShowNearby(true);
    setNearbyPlaces([]);
    try {
      const places = await searchNearbyPlaces(currentLoc, getPlaceType(dest.label), 10000);
      setNearbyPlaces(places.sort((a, b) => a.distance - b.distance));
    } catch { setNearbyPlaces([]); }
    finally { setNearbyLoading(false); }
  }, [currentLoc]);

  const handleNearbySelect = useCallback((place) => {
    setShowNearby(false);
    navigation.navigate("PickDrop", {
      prefilledDrop: { description: place.name + ", " + place.address, location: place.location },
    });
  }, [navigation]);

  const loadTrips = useCallback(async () => {
    try {
      setTripsLoad(true);
      if (!firebaseUser) return;
      const r = await fetch(`${API_BASE_URL}/orders/user/${firebaseUser.uid}`);
      if (r.ok) setTrips(await r.json());
    } catch (e) { console.log("trips:", e); }
    finally { setTripsLoad(false); }
  }, []);

  useEffect(() => { loadLocation(); loadTrips(); }, []);

  useEffect(() => {
    const iv = setInterval(() => { setActiveOffer((p) => (p + 1) % TOP_OFFERS.length); }, 4000);
    return () => clearInterval(iv);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadLocation(), loadTrips()]);
    setRefreshing(false);
  }, []);

  const goService = useCallback((route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(route);
  }, [navigation]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const HEADER_H  = 64 + insets.top;

  // ==================== RENDER ====================
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, headerShadow, { paddingTop: insets.top, height: HEADER_H }]}>
        <TouchableOpacity style={styles.headerLocBtn} onPress={loadLocation} activeOpacity={0.8}>
          <LinearGradient colors={GRAD.primary} style={styles.headerLocIcon}>
            <Ionicons name="location" size={14} color={C.white} />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerTitleRow}>
            <Pulse size={4} color={C.violet} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {locLoading ? "Updating…" : addrTitle}
            </Text>
            <Ionicons name="chevron-down" size={13} color={C.violet} />
          </View>
          <Text style={styles.headerSub} numberOfLines={1}>{addrSub}</Text>
        </View>
        <TouchableOpacity style={styles.headerNotifBtn} onPress={() => navigation.navigate("Notifications")} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={18} color={C.textDark} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── SCROLL ── */}
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_H, paddingBottom: 100 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.violet} colors={[C.violet]} progressViewOffset={HEADER_H} />
        }
      >
        {/* ── HERO ── */}
        <View style={styles.section}>
          <HeroBanner onPress={() => goService("PickDrop")} greeting={greeting} name={firstName} />
        </View>

        {/* ── TOP OFFERS ── */}
        <View style={styles.section}>
          <SHead title="Quick Book" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topOffersRow}>
            {TOP_OFFERS.map((o, i) => (
              <TopOfferCard key={o.id} item={o} index={i} onPress={() => goService(o.route)} />
            ))}
          </ScrollView>
          <View style={styles.dotRow}>
            {TOP_OFFERS.map((_, i) => (
              <View key={i} style={[styles.indicatorDot, activeOffer === i && styles.indicatorDotActive]} />
            ))}
          </View>
        </View>

        {/* ── CATEGORIES ── */}
        <View style={styles.section}>
          <SHead title="Categories" />
          <View style={styles.catRow}>
            {CATEGORIES.map((c, i) => (
              <CategoryItem key={c.id} item={c} index={i} onPress={() => c.label !== "More" ? handleQuickNav(c) : null} />
            ))}
          </View>
        </View>

        {/* ── SERVICES ── */}
        <View style={styles.section}>
          <SHead title="Our Services" />
          <View style={{ gap: SP.md }}>
            {SERVICES.map((s, i) => (
              <ServiceCard key={s.id} item={s} index={i} onPress={() => goService(s.route)} />
            ))}
          </View>
        </View>

        {/* ── PROMO BANNER — replaces old deal banner ── */}
        <View style={styles.section}>
          <SHead title="For You" />
          <PromoBanner
            onRide={() => goService("PickDrop")}
            onWash={() => goService("CarWash")}
            onDriver={() => goService("Driver")}
          />
        </View>

        {/* ── RECENT ACTIVITY ── */}
        {!tripsLoad && trips.length > 0 && (
          <View style={styles.section}>
            <SHead title="Recent Activity" />
            <View style={{ gap: SP.sm }}>
              {trips.slice(0, 3).map((t) => {
                const iconMap  = { ride: "car-sport", pickdrop: "car-sport", driver: "person", wash: "water", car_wash: "water" };
                const colorMap = { completed: C.success, cancelled: C.red, in_progress: C.violet };
                const bgMap    = { completed: C.successBg, cancelled: C.pastelRed, in_progress: C.primarySoft };
                const ic  = iconMap[t.service_type] || "car-sport";
                const col = colorMap[t.status?.toLowerCase()] || C.textLight;
                const bg  = bgMap[t.status?.toLowerCase()] || C.surface;

                return (
                  <Press
                    key={t.id}
                    onPress={() => navigation.navigate("RideDetails", { rideId: t.id, ride: t })}
                    scale={0.985}
                  >
                    <View style={styles.tripCard}>
                      <View style={[styles.tripIcon, { backgroundColor: bg }]}>
                        <Ionicons name={ic} size={18} color={col} />
                      </View>
                      <View style={styles.tripInfo}>
                        <Text style={styles.tripTitle}>
                          {t.service_type === "driver" ? "Driver" : t.service_type === "wash" || t.service_type === "car_wash" ? "Car Wash" : "Ride"}
                        </Text>
                        <Text style={styles.tripSub} numberOfLines={1}>{t.pickup || "—"}</Text>
                      </View>
                      <View style={styles.tripRight}>
                        <Text style={styles.tripPrice}>₹{t.customer_total || t.price || 0}</Text>
                        <View style={[styles.tripStatusPill, { backgroundColor: bg }]}>
                          <Text style={[styles.tripStatusText, { color: col }]}>
                            {t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Press>
                );
              })}
            </View>
          </View>
        )}

        {/* ── SAFETY BANNER ── */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <View style={styles.safetyBanner}>
            <LinearGradient colors={GRAD.lavender} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={GRAD.primary} style={styles.safetyIconWrap}>
              <Ionicons name="shield-checkmark" size={16} color={C.white} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.safetyTitle}>Your Safety Matters</Text>
              <Text style={styles.safetySub}>All rides are monitored for your safety & comfort.</Text>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.footerLogoRow}>
            <LinearGradient colors={GRAD.primary} style={styles.footerLogoIcon}>
              <Ionicons name="car-sport" size={14} color={C.white} />
            </LinearGradient>
            <Text style={styles.footerBrand}>GoRide</Text>
          </View>
          <Text style={styles.footerTag}>Your daily ride companion</Text>
          <View style={styles.footerDivider} />
          <View style={styles.footerLinks}>
            {["About", "Privacy", "Terms", "Help"].map((l, i) => (
              <TouchableOpacity key={i} activeOpacity={0.7}>
                <Text style={styles.footerLink}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.footerCopy}>© 2024 GoRide Technologies</Text>
        </View>
      </Animated.ScrollView>

      {/* ── NEARBY SHEET ── */}
      <NearbyPlacesSheet
        visible={showNearby}
        onClose={() => setShowNearby(false)}
        places={nearbyPlaces}
        loading={nearbyLoading}
        category={nearbyCategory}
        onSelectPlace={handleNearbySelect}
      />
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: C.white, flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: SP.lg, paddingBottom: SP.sm,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLocBtn:    { width: 38, height: 38, borderRadius: 19, overflow: "hidden", justifyContent: "center", alignItems: "center" },
  headerLocIcon:   { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  headerTitleWrap: { flex: 1, alignItems: "center", paddingHorizontal: SP.md },
  headerTitleRow:  { flexDirection: "row", alignItems: "center", gap: SP.xs },
  headerTitle:     { fontSize: 14, fontWeight: "800", color: C.textDark, letterSpacing: -0.2, flexShrink: 1 },
  headerSub:       { fontSize: 10, color: C.textLight, fontWeight: "500", marginTop: 2 },
  headerNotifBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border, position: "relative",
  },
  notifDot: {
    position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.orange, borderWidth: 2, borderColor: C.white,
  },

  // Section
  section: { paddingHorizontal: SP.lg, paddingVertical: SP.md },
  sHead:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SP.md },
  sTitle:  { fontSize: 17, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },

  // ─── Hero Banner ───
  heroBanner: {
    borderRadius: R.xxl, padding: SP.xl, flexDirection: "row", overflow: "hidden",
    position: "relative", minHeight: 200,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  heroDecor1: {
    position: "absolute", top: -50, right: -50, width: 180, height: 180,
    borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroDecor2: {
    position: "absolute", bottom: -40, left: -40, width: 140, height: 140,
    borderRadius: 70, backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroDecor3: {
    position: "absolute", top: 40, left: "30%", width: 100, height: 100,
    borderRadius: 50, backgroundColor: "rgba(255,255,255,0.03)",
  },
  heroContent: { flex: 1, zIndex: 2, justifyContent: "center" },
  heroGreetRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  heroGreeting: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.7)" },
  heroName:     { fontSize: 13, fontWeight: "800", color: "rgba(255,255,255,0.95)" },
  heroTitle: {
    fontSize: 22, fontWeight: "900", color: C.white,
    letterSpacing: -0.5, lineHeight: 28, marginBottom: SP.md,
  },
  heroStatsRow: {
    flexDirection: "row", gap: SP.md, marginBottom: SP.lg,
  },
  heroStatItem: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: R.full,
  },
  heroStatValue: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
  heroSearchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.sm + 2,
    gap: SP.sm,
  },
  heroSearchDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: C.success,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  heroSearchText: { flex: 1, fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.6)" },
  heroSearchArrow: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.white,
    justifyContent: "center", alignItems: "center",
  },

  // Hero illustrations
  heroIllustrationWrap: {
    position: "absolute", right: SP.lg, top: 20, bottom: 20,
    width: 100, justifyContent: "center", alignItems: "center",
  },
  heroCarWrap: { marginBottom: SP.sm },
  heroCar: {
    width: 68, height: 54, borderRadius: R.lg,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  heroPinWrap: { alignItems: "center" },
  heroPin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  heroPinShadow: {
    width: 16, height: 4, borderRadius: 2, marginTop: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  heroRouteDotsWrap: {
    position: "absolute", left: -15, top: "40%",
    gap: 6,
  },
  heroRouteDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.5)",
  },

  // ─── Top Offers ───
  topOffersRow:      { gap: SP.md, paddingRight: SP.lg },
  topOfferCard: {
    width: 148, backgroundColor: C.white, borderRadius: R.lg, padding: SP.md,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  topOfferIconCircle: {
    width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center", marginBottom: SP.sm,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  topOfferTitle:     { fontSize: 14, fontWeight: "800", color: C.textDark, marginBottom: 3, letterSpacing: -0.2 },
  topOfferDesc:      { fontSize: 11, color: C.textLight, lineHeight: 14, fontWeight: "500", marginBottom: SP.sm, minHeight: 28 },
  topOfferBadge:     { paddingHorizontal: SP.sm, paddingVertical: 4, borderRadius: R.sm, alignSelf: "flex-start" },
  topOfferBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  // Dots
  dotRow:             { flexDirection: "row", justifyContent: "center", marginTop: SP.md, gap: 5 },
  indicatorDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.borderMid },
  indicatorDotActive: { width: 20, backgroundColor: C.violet, borderRadius: 3 },

  // Categories
  catRow:   { flexDirection: "row", justifyContent: "space-between" },
  catWrap:  { alignItems: "center", width: (width - SP.lg * 2) / 5 },
  catCircle: {
    width: 54, height: 54, borderRadius: 27, justifyContent: "center", alignItems: "center", marginBottom: SP.sm,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  catLabel: { fontSize: 11, fontWeight: "600", color: C.textDark, textAlign: "center" },

  // Service Card
  svcCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.lg,
    padding: SP.md, borderWidth: 1.5, borderColor: C.border, position: "relative",
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  svcBadge: {
    position: "absolute", top: -8, left: SP.md, flexDirection: "row", alignItems: "center",
    paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.sm, gap: 3, zIndex: 1,
  },
  svcBadgeText: { fontSize: 8, fontWeight: "800", color: C.white, letterSpacing: 0.5 },
  svcLeft:      { flex: 1, flexDirection: "row", alignItems: "center" },
  svcIcon:      { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center", marginRight: SP.md },
  svcText:      { flex: 1 },
  svcTitle:     { fontSize: 14, fontWeight: "800", color: C.textDark, marginBottom: 2, letterSpacing: -0.2 },
  svcDesc:      { fontSize: 11, color: C.textLight, fontWeight: "500", marginBottom: 5 },
  svcMeta:      { flexDirection: "row", alignItems: "center", gap: 3 },
  svcMetaText:  { fontSize: 10, color: C.textLight, fontWeight: "500" },
  svcMetaDot:   { width: 2, height: 2, borderRadius: 1, backgroundColor: C.textFaint, marginHorizontal: 3 },
  svcArrow:     { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center", marginLeft: SP.sm },

  // ─── Promo Banner ───
  promoBanner: {
    borderRadius: R.xl, overflow: "hidden", position: "relative",
    flexDirection: "row", minHeight: 180,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  promoGlow1: {
    position: "absolute", top: -30, left: -30, width: 120, height: 120,
    borderRadius: 60, backgroundColor: C.violet,
  },
  promoGlow2: {
    position: "absolute", bottom: -20, right: -20, width: 100, height: 100,
    borderRadius: 50, backgroundColor: C.blueAccent,
  },
  promoContent: { flex: 1, padding: SP.xl, zIndex: 2 },
  promoTopRow:  { marginBottom: SP.sm },
  promoTagWrap: { alignSelf: "flex-start" },
  promoTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: SP.sm + 2, paddingVertical: 4, borderRadius: R.full,
  },
  promoTagText: { fontSize: 9, fontWeight: "900", color: C.goldDeep, letterSpacing: 1 },
  promoTitle: {
    fontSize: 22, fontWeight: "900", color: C.white,
    letterSpacing: -0.5, lineHeight: 28, marginBottom: 6,
  },
  promoDesc: {
    fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500",
    lineHeight: 17, marginBottom: SP.lg,
  },
  promoPillsRow: { flexDirection: "row", gap: SP.sm },
  promoPill:     { borderRadius: R.full, overflow: "hidden" },
  promoPillGrad: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: SP.md, paddingVertical: 8,
  },
  promoPillText: { fontSize: 11, fontWeight: "800", color: C.white },

  // Promo illustration
  promoIllustrationWrap: {
    width: 100, justifyContent: "center", alignItems: "center",
    paddingRight: SP.md, zIndex: 2,
  },
  promoRing1: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  promoRing2: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  promoRing3: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  promoFeatureDot: {
    position: "absolute", width: 18, height: 18, borderRadius: 9,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(15,23,42,0.8)",
  },

  // Trip Card
  tripCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.lg,
    padding: SP.md, borderWidth: 1, borderColor: C.border,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  tripIcon:       { width: 42, height: 42, borderRadius: R.md, justifyContent: "center", alignItems: "center", marginRight: SP.md },
  tripInfo:       { flex: 1 },
  tripTitle:      { fontSize: 14, fontWeight: "700", color: C.textDark, marginBottom: 2 },
  tripSub:        { fontSize: 11, color: C.textLight, fontWeight: "500" },
  tripRight:      { alignItems: "flex-end", gap: SP.xs },
  tripPrice:      { fontSize: 14, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  tripStatusPill: { paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  tripStatusText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.3 },

  // Safety Banner
  safetyBanner: {
    flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.md,
    overflow: "hidden", borderWidth: 1, borderColor: C.violet + "20", gap: SP.md,
  },
  safetyIconWrap: {
    width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center",
    shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  safetyTitle: { fontSize: 13, fontWeight: "800", color: C.violet, marginBottom: 2 },
  safetySub:   { fontSize: 11, color: C.textMid, fontWeight: "500", lineHeight: 15 },

  // Footer
  footer:         { paddingHorizontal: SP.lg, paddingVertical: SP.xxxl, alignItems: "center", marginTop: SP.lg },
  footerLogoRow:  { flexDirection: "row", alignItems: "center", gap: SP.sm, marginBottom: SP.xs },
  footerLogoIcon: { width: 32, height: 32, borderRadius: R.md, justifyContent: "center", alignItems: "center" },
  footerBrand:    { fontSize: 18, fontWeight: "900", color: C.textDark, letterSpacing: -0.3 },
  footerTag:      { fontSize: 11, color: C.textLight, marginBottom: SP.lg, fontWeight: "500" },
  footerDivider:  { width: 60, height: 1, backgroundColor: C.border, marginBottom: SP.lg },
  footerLinks:    { flexDirection: "row", gap: SP.xl, marginBottom: SP.md },
  footerLink:     { fontSize: 12, color: C.textMid, fontWeight: "600" },
  footerCopy:     { fontSize: 10, color: C.textFaint, fontWeight: "500" },
});