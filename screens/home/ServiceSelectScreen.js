// screens/home/ServiceSelectScreen.js

import React, {
  useEffect,
  useMemo,
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
  TextInput,
  Dimensions,
  StatusBar,
  RefreshControl,
  Image,
  Alert,
  Clipboard,
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
  withDelay,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInRight,
  ZoomIn,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";
import { searchNearbyPlaces, getPlaceType } from "../../lib/nearbyPlaces";
import NearbyPlacesSheet from "../../components/NearbyPlacesSheet";

const { width } = Dimensions.get("window");

// ═══════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════
const C = {
  black: "#0A0A0A",
  blackL: "#141414",
  blackM: "#1E1E1E",
  blackS: "#2A2A2A",
  charcoal: "#333333",
  graphite: "#4A4A4A",
  silver: "#888888",
  lightGray: "#AAAAAA",
  smoke: "#CCCCCC",
  offWhite: "#F0F0F0",
  white: "#FFFFFF",
  bg: "#F4F4F6",
  card: "#FFFFFF",
  green: "#22C55E",
  greenBg: "rgba(34,197,94,0.12)",
  greenDk: "#16A34A",
  red: "#EF4444",
  redBg: "rgba(239,68,68,0.12)",
  amber: "#F59E0B",
  blue: "#3B82F6",
  shimmer: "#E5E5E5",
};

const SP = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 50, full: 999 };
const SH = {
  sm: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 16, elevation: 8 },
  xl: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
};

// ═══════════════════════════════════════════
// STATIC DATA  — removed Outstation & Premium
// ═══════════════════════════════════════════
const SERVICES = [
  { id: "ride",   title: "Book Ride",   subtitle: "3 min away",  emoji: "🚗", route: "PickDrop", badge: "POPULAR", eta: "3 min",  rating: "4.9" },
  { id: "wash",   title: "Car Wash",    subtitle: "Doorstep",    emoji: "🫧", route: "CarWash",  badge: "NEW",     eta: "10 min", rating: "4.8" },
  { id: "driver", title: "Hire Driver", subtitle: "All day",     emoji: "👨‍✈️", route: "Driver",   badge: null,      eta: "5 min",  rating: "4.9" }
  // { id: "rental", title: "Rentals",     subtitle: "By hour",     emoji: "⏱️", route: "PickDrop", badge: null,      eta: "Instant",rating: "4.7" },
];

// Replace the DESTINATIONS array with this:
const DESTINATIONS = [
  // { id: "1", emoji: "🏢", label: "Office",   sub: "Your office",   type: "saved"  },
  // { id: "2", emoji: "🏠", label: "Home",     sub: "Your home",     type: "saved"  },
  { id: "3", emoji: "✈️", label: "Airport",  sub: "Nearest",       type: "nearby" },
  { id: "4", emoji: "🏥", label: "Hospital", sub: "Nearest",       type: "nearby" },
  { id: "5", emoji: "🛒", label: "Mall",     sub: "Nearest",       type: "nearby" },
  { id: "6", emoji: "🎓", label: "College",  sub: "Nearest",       type: "nearby" },
];

const OFFERS = [
  { id: "1", tag: "FIRST RIDE", discount: "50%",  title: "Half Off!",  sub: "On your first booking",  code: "FIRST50",  expires: "Today only",  grad: ["#0A0A0A","#2A2A2A"], icon: "🎉" },
  { id: "2", tag: "CAR WASH",   discount: "FREE", title: "Free Wash",  sub: "Orders above ₹999",       code: "FREEWASH", expires: "This week",   grad: ["#0f0c29","#302b63"], icon: "🧼" },
  { id: "3", tag: "DRIVER",     discount: "₹100", title: "Flat Off",   sub: "On driver bookings",      code: "DRIVE100", expires: "3 days left", grad: ["#200122","#6f0000"], icon: "🚀" },
];

const WHY_US = [
  { emoji: "🛡️", title: "100% Safe",  desc: "Verified drivers",  color: C.green },
  { emoji: "⚡",  title: "Super Fast", desc: "3 min avg pickup",  color: C.amber },
  { emoji: "💰",  title: "Best Price", desc: "Transparent fares", color: C.blue  },
  { emoji: "🎧",  title: "Always On",  desc: "24/7 support",      color: C.red   },
];

const STATS = [
  { num: "50K+",  label: "Riders"  },
  { num: "4.9★",  label: "Rating"  },
  { num: "3 min", label: "Pickup"  },
  { num: "24/7",  label: "Support" },
];

// ═══════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════
const PulseDot = React.memo(({ size = 7, color = C.green }) => {
  const sc = useSharedValue(1);
  const op = useSharedValue(1);
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(2, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
    op.value = withRepeat(withSequence(withTiming(0, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
    return () => { cancelAnimation(sc); cancelAnimation(op); };
  }, []);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: op.value }));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ring]} />
      <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, backgroundColor: color }} />
    </View>
  );
});

const Bounce = ({ children, onPress, style, intensity = 0.95 }) => {
  const sc = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} style={style}
      onPressIn={() => { sc.value = withSpring(intensity, { damping: 15, stiffness: 350 }); }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 15, stiffness: 350 }); }}
    >
      <Animated.View style={anim}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const Shimmer = ({ w, h, radius = R.sm, style }) => {
  const tx = useSharedValue(-w);
  useEffect(() => {
    tx.value = withRepeat(withTiming(w * 1.5, { duration: 1300, easing: Easing.ease }), -1, false);
    return () => cancelAnimation(tx);
  }, []);
  const sh = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  return (
    <View style={[{ width: w, height: h, borderRadius: radius, backgroundColor: C.shimmer, overflow: "hidden" }, style]}>
      <Animated.View style={[{ width: w * 0.5, height: "100%", backgroundColor: "rgba(255,255,255,0.55)" }, sh]} />
    </View>
  );
};

// ═══════════════════════════════════════════
// HERO ANIMATION SCENES
// ═══════════════════════════════════════════
const CarShape = ({ flipped = false }) => (
  <View style={[styles.car, flipped && { transform: [{ scaleX: -1 }] }]}>
    <View style={styles.carCabin} />
    <View style={[styles.carGlass, { left: 20 }]} />
    <View style={[styles.carGlass, { left: 38, width: 13 }]} />
    <View style={styles.carBody}>
      <View style={styles.carDoorLine} />
      <View style={[styles.carHandle, { left: 16 }]} />
      <View style={[styles.carHandle, { left: 46 }]} />
      <View style={styles.carHeadlight} />
      <View style={styles.carTaillight} />
    </View>
    <View style={[styles.carBumper, { left: 0 }]} />
    <View style={[styles.carBumper, { right: 0, width: 7 }]} />
    <View style={[styles.carWheel, { left: 8 }]}><View style={styles.carWheelHub} /></View>
    <View style={[styles.carWheel, { right: 8 }]}><View style={styles.carWheelHub} /></View>
  </View>
);

const RoadStrip = () => (
  <View style={styles.road}>
    <View style={styles.roadSurface} />
    <View style={styles.roadDashes}>
      {Array.from({ length: 10 }).map((_, i) => (
        <View key={i} style={styles.roadDash} />
      ))}
    </View>
    <View style={styles.roadCurb} />
  </View>
);

// Replace CitySky component
const CitySky = () => (
  <View style={styles.citySky} pointerEvents="none">
    {[
      [8, 48], [28, 64], [48, 40], [68, 56], [90, 36],
      [112, 60], [134, 44], [156, 70], [178, 50], [200, 38],
      [220, 58], [242, 42], [262, 66], [282, 48], [300, 54],
    ].map(([l, h], i) => (
      <View key={i} style={{
        position: "absolute", left: l, bottom: 28,
        width: 18, height: h,
        backgroundColor: "rgba(255,255,255,0.07)",  // was 0.035 — doubled visibility
        borderTopLeftRadius: 3, borderTopRightRadius: 3,
        // Window lights on buildings
        borderWidth: 0,
      }} >
        {/* Small window lights */}
        {h > 45 && [0, 1, 2].map((row) => (
          <View key={row} style={{
            position: "absolute",
            top: row * 12 + 6,
            left: 3,
            flexDirection: "row",
            gap: 4,
          }}>
            <View style={{ width: 3, height: 3, backgroundColor: Math.random() > 0.4 ? "rgba(255,248,180,0.35)" : "transparent", borderRadius: 0.5 }} />
            <View style={{ width: 3, height: 3, backgroundColor: Math.random() > 0.4 ? "rgba(255,248,180,0.35)" : "transparent", borderRadius: 0.5 }} />
          </View>
        ))}
      </View>
    ))}
    {/* Stars */}
    {[20, 70, 130, 180, 240, 290].map((l, i) => (
      <View key={`s${i}`} style={{ 
        position: "absolute", left: l, 
        top: [8, 14, 6, 18, 10, 4][i], 
        width: 2, height: 2, 
        backgroundColor: "rgba(255,255,255,0.4)",  // brighter stars
        borderRadius: 1 
      }} />
    ))}
  </View>
);

// Replace the LinearGradient inside HeroCarousel
// Find this line:
// <LinearGradient colors={["#080808", "#111111", "#0C0C0C"]} style={StyleSheet.absoluteFill} />
// Replace with:
<LinearGradient 
  colors={["#0D1B2A", "#1B2838", "#0D1B2A"]}   // deep navy — still dark but warmer
  style={StyleSheet.absoluteFill} 
/>

const RideScene = React.memo(() => {
  const carX   = useSharedValue(-90);
  const carBob = useSharedValue(0);
  const exOp   = useSharedValue(0);
  useEffect(() => {
    carX.value = withTiming(width * 0.08, { duration: 1600, easing: Easing.out(Easing.cubic) }, (done) => {
      if (!done) return;
      exOp.value = withTiming(0, { duration: 600 });
      carBob.value = withRepeat(
        withSequence(withTiming(-3, { duration: 450 }), withTiming(0, { duration: 450 })),
        3, true, () => {
          carX.value = withDelay(400, withTiming(width + 80, { duration: 1100, easing: Easing.in(Easing.quad) }));
        }
      );
    });
    exOp.value = withDelay(200, withTiming(0.55, { duration: 400 }));
    return () => { cancelAnimation(carX); cancelAnimation(carBob); cancelAnimation(exOp); };
  }, []);
  const carS = useAnimatedStyle(() => ({ transform: [{ translateX: carX.value }, { translateY: carBob.value }] }));
  const exhS = useAnimatedStyle(() => ({ opacity: exOp.value }));
  return (
    <View style={styles.sceneInner}>
      <CitySky />
      <RoadStrip />
      <Animated.View style={[styles.exhaust, exhS]}>
        <View style={[styles.exPuff, { width: 7, height: 7 }]} />
        <View style={[styles.exPuff, { width: 10, height: 10, left: -8, top: -6 }]} />
        <View style={[styles.exPuff, { width: 6, height: 6, left: -14, top: -2 }]} />
      </Animated.View>
      <Animated.View style={[styles.carWrap, carS]}><CarShape /></Animated.View>
      <View style={styles.sceneChip}><PulseDot size={5} color={C.green} /><Text style={styles.sceneChipTxt}>Book a Ride</Text></View>
      <View style={styles.etaChip}><Text style={styles.etaChipTxt}>⚡ 3 min away</Text></View>
    </View>
  );
});

const WashScene = React.memo(() => {
  const carX   = useSharedValue(-90);
  const armRot = useSharedValue(0);
  const dropY  = useSharedValue(0);
  const dropOp = useSharedValue(0);
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    carX.value = withTiming(width * 0.1, { duration: 1500, easing: Easing.out(Easing.cubic) }, (done) => {
      if (!done) return;
      runOnJS(setArrived)(true);
      armRot.value = withRepeat(withSequence(withTiming(30, { duration: 380 }), withTiming(-18, { duration: 380 })), -1, true);
      dropOp.value = withRepeat(withSequence(withTiming(1, { duration: 250 }), withTiming(0, { duration: 550 })), -1, false);
      dropY.value  = withRepeat(withSequence(withTiming(-24, { duration: 500 }), withTiming(12, { duration: 300 }), withTiming(0, { duration: 0 })), -1, false);
    });
    return () => { cancelAnimation(carX); cancelAnimation(armRot); cancelAnimation(dropY); cancelAnimation(dropOp); };
  }, []);
  const carS  = useAnimatedStyle(() => ({ transform: [{ translateX: carX.value }] }));
  const armS  = useAnimatedStyle(() => ({ transform: [{ rotate: `${armRot.value}deg` }] }));
  const dropS = useAnimatedStyle(() => ({ transform: [{ translateY: dropY.value }], opacity: dropOp.value }));
  return (
    <View style={styles.sceneInner}>
      <CitySky />
      <RoadStrip />
      <View style={styles.washFrame}>
        <View style={styles.washBar} />
        <View style={[styles.washPillar, { left: 0 }]} />
        <View style={[styles.washPillar, { right: 0 }]} />
      </View>
      <Animated.View style={[styles.carWrap, carS]}><CarShape /></Animated.View>
      {arrived && [0, 14, 28, 42, 56].map((xOff, i) => (
        <Animated.View key={i} style={[styles.waterDrop, { left: width * 0.18 + xOff, top: 30 }, dropS]} />
      ))}
      <View style={[styles.personWrap, { right: width * 0.18 - 14, bottom: 28 }]}>
        <View style={styles.personHead} />
        <View style={styles.personBody}>
          <Animated.View style={[styles.personArm, { right: -16, transformOrigin: "left center" }, armS]}>
            <View style={styles.sponge} />
          </Animated.View>
        </View>
        <View style={styles.personLegs}><View style={styles.personLeg} /><View style={styles.personLeg} /></View>
      </View>
      <View style={styles.sceneChip}><PulseDot size={5} color={C.blue} /><Text style={styles.sceneChipTxt}>Car Wash</Text></View>
      <View style={styles.etaChip}><Text style={styles.etaChipTxt}>🧼 Doorstep</Text></View>
    </View>
  );
});

const CabScene = React.memo(() => {
  const carX   = useSharedValue(width + 80);
  const pinY   = useSharedValue(0);
  const handR  = useSharedValue(0);
  const waveOp = useSharedValue(0);
  const waveSc = useSharedValue(0.3);
  useEffect(() => {
    pinY.value  = withRepeat(withSequence(withTiming(-8, { duration: 500, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })), -1, false);
    handR.value = withRepeat(withSequence(withTiming(18, { duration: 300 }), withTiming(-8, { duration: 300 })), 5, true);
    waveOp.value = withRepeat(withSequence(withTiming(0.55, { duration: 300 }), withTiming(0, { duration: 900 })), -1, false);
    waveSc.value = withRepeat(withSequence(withTiming(2.2, { duration: 1200 }), withTiming(0.3, { duration: 0 })), -1, false);
    carX.value   = withDelay(1200, withTiming(width * 0.32, { duration: 1800, easing: Easing.out(Easing.cubic) }));
    return () => { cancelAnimation(carX); cancelAnimation(pinY); cancelAnimation(handR); cancelAnimation(waveOp); cancelAnimation(waveSc); };
  }, []);
  const carS  = useAnimatedStyle(() => ({ transform: [{ translateX: carX.value }, { scaleX: -1 }] }));
  const pinS  = useAnimatedStyle(() => ({ transform: [{ translateY: pinY.value }] }));
  const handS = useAnimatedStyle(() => ({ transform: [{ rotate: `${handR.value}deg` }] }));
  const waveS = useAnimatedStyle(() => ({ opacity: waveOp.value, transform: [{ scale: waveSc.value }] }));
  return (
    <View style={styles.sceneInner}>
      <CitySky />
      <RoadStrip />
      <View style={[styles.personWrap, { right: SP.xl + 4, bottom: 28 }]}>
        <Animated.View style={[styles.signalRing, waveS]} />
        <View style={styles.personHead} />
        <View style={styles.personBody}>
          <Animated.View style={[styles.personArm, { right: -14, transformOrigin: "left center" }, handS]}>
            <View style={styles.phoneIcon} />
          </Animated.View>
        </View>
        <View style={styles.personLegs}><View style={styles.personLeg} /><View style={styles.personLeg} /></View>
      </View>
      <Animated.View style={[styles.locPin, pinS]}>
        <View style={styles.pinHead}><View style={styles.pinDot} /></View>
        <View style={styles.pinTail} />
      </Animated.View>
      <Animated.View style={[styles.carWrap, carS]}><CarShape /></Animated.View>
      <View style={styles.sceneChip}><PulseDot size={5} color={C.amber} /><Text style={styles.sceneChipTxt}>Cab Pickup</Text></View>
      <View style={styles.etaChip}><Text style={styles.etaChipTxt}>📍 On the way</Text></View>
    </View>
  );
});

// ═══════════════════════════════════════════
// HERO CAROUSEL
// ═══════════════════════════════════════════
const SCENES      = [RideScene, WashScene, CabScene];
const SCENE_NAMES = ["Ride Booking", "Car Wash", "Cab Pickup"];

const HeroCarousel = React.memo(() => {
  const [active, setActive] = useState(0);
  const [key,    setKey]    = useState(0);
  const progress = useSharedValue(0);

  const goTo = useCallback((idx) => {
    cancelAnimation(progress);
    progress.value = 0;
    setActive(idx);
    setKey((k) => k + 1);
    progress.value = withTiming(1, { duration: 5800 });
  }, []);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 5800 }, (done) => {
      if (done) runOnJS(advance)();
    });
    return () => cancelAnimation(progress);
  }, [active]);

  const advance = useCallback(() => {
    goTo((active + 1) % SCENES.length);
  }, [active, goTo]);

  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const ActiveScene   = SCENES[active];

  return (
    <View style={styles.hero}>
      <LinearGradient colors={["#080808", "#111111", "#0C0C0C"]} style={StyleSheet.absoluteFill} />
      <Animated.View key={key} entering={FadeIn.duration(450)} style={{ flex: 1 }}>
        <ActiveScene />
      </Animated.View>
      <View style={styles.heroFooter}>
        <Text style={styles.heroLabel}>{SCENE_NAMES[active]}</Text>
        <View style={styles.heroDots}>
          {SCENES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={[styles.heroDot, active === i && styles.heroDotActive]}>
                {active === i && <Animated.View style={[styles.heroDotBar, progressStyle]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

// ═══════════════════════════════════════════
// CONTENT CARDS
// ═══════════════════════════════════════════
const ServiceCard = React.memo(({ item, index, onPress }) => (
  <Animated.View entering={FadeInUp.delay(index * 60 + 80).duration(420).springify().damping(15)} style={styles.svcWrap}>
    <Bounce onPress={onPress} intensity={0.96}>
      <View style={styles.svcCard}>
        <View style={styles.svcAccent} />
        {item.badge && <View style={styles.svcBadge}><Text style={styles.svcBadgeTxt}>{item.badge}</Text></View>}
        <View style={styles.svcEmoji}><Text style={{ fontSize: 26 }}>{item.emoji}</Text></View>
        <Text style={styles.svcTitle}>{item.title}</Text>
        <Text style={styles.svcSub}>{item.subtitle}</Text>
        <View style={styles.svcFooter}>
          <View style={styles.svcEta}><PulseDot size={5} color={C.green} /><Text style={styles.svcEtaTxt}>{item.eta}</Text></View>
          <Text style={styles.svcRating}>⭐ {item.rating}</Text>
        </View>
      </View>
    </Bounce>
  </Animated.View>
));

const DestCircle = React.memo(({ item, index, onPress }) => (
  <Animated.View entering={ZoomIn.delay(index * 50 + 80).duration(360).springify().damping(13)}>
    <Bounce onPress={onPress} intensity={0.88} style={styles.destWrap}>
      <View style={styles.destCircle}><Text style={{ fontSize: 25 }}>{item.emoji}</Text></View>
      <Text style={styles.destLabel}>{item.label}</Text>
      <Text style={styles.destSub}>{item.sub}</Text>
    </Bounce>
  </Animated.View>
));

const OfferCard = React.memo(({ item, index, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const doCopy = useCallback(() => {
    setCopied(true);
    onCopy(item.code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }, [item.code, onCopy]);
  return (
    <Animated.View entering={SlideInRight.delay(index * 90).duration(450).springify().damping(15)} style={styles.offerWrap}>
      <Bounce intensity={0.98}>
        <LinearGradient colors={item.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.offerCard}>
          <View style={styles.offerDeco1} /><View style={styles.offerDeco2} />
          <View style={styles.offerTag}><Text style={styles.offerTagTxt}>{item.tag}</Text></View>
          <View style={styles.offerMain}>
            <Text style={{ fontSize: 30, marginRight: SP.md }}>{item.icon}</Text>
            <View>
              <Text style={styles.offerDiscount}>{item.discount}</Text>
              <Text style={styles.offerTitle}>{item.title}</Text>
            </View>
          </View>
          <Text style={styles.offerSub}>{item.sub}</Text>
          <View style={styles.offerRow}>
            <TouchableOpacity style={[styles.offerCodeBtn, copied && styles.offerCodeCopied]} onPress={doCopy} activeOpacity={0.8}>
              <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={12} color={C.white} />
              <Text style={styles.offerCode}>{copied ? "COPIED!" : item.code}</Text>
            </TouchableOpacity>
            <Text style={styles.offerExp}>{item.expires}</Text>
          </View>
        </LinearGradient>
      </Bounce>
    </Animated.View>
  );
});

const TripCard = React.memo(({ item, index, onPress, onRebook }) => {
  const iconMap  = { ride: "car-sport", driver: "person", wash: "water" };
  const colorMap = { completed: C.green, cancelled: C.red, ongoing: C.blue };
  const nameMap  = { ride: "Ride", driver: "Driver", wash: "Car Wash" };
  const ic    = iconMap[item.service_type]  || "car-sport";
  const col   = colorMap[item.status?.toLowerCase()] || C.silver;
  const sname = nameMap[item.service_type]  || "Service";
  const fmtDate = (ds) => {
    const d = new Date(ds), t = new Date(), y = new Date(t);
    y.setDate(y.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Today " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };
  return (
    <Animated.View entering={FadeInUp.delay(index * 55).duration(390).springify()}>
      <Bounce onPress={onPress} intensity={0.98}>
        <View style={styles.tripCard}>
          <View style={[styles.tripIcon, { backgroundColor: col + "18" }]}>
            <Ionicons name={ic} size={20} color={col} />
          </View>
          <View style={styles.tripInfo}>
            <View style={styles.tripRow}>
              <Text style={styles.tripName}>{sname}</Text>
              <View style={[styles.tripStatus, { backgroundColor: col + "18" }]}>
                <View style={[styles.tripDot, { backgroundColor: col }]} />
                <Text style={[styles.tripStatusTxt, { color: col }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.tripLoc} numberOfLines={1}>{item.pickup || "Location"}</Text>
            <View style={styles.tripRow}>
              <Text style={styles.tripDate}>{fmtDate(item.created_at)}</Text>
              <Text style={styles.tripPrice}>₹{item.price || 0}</Text>
            </View>
          </View>
          {item.status === "completed" && (
            <TouchableOpacity style={styles.rebookBtn} onPress={() => onRebook(item)} activeOpacity={0.7}>
              <Ionicons name="refresh" size={14} color={C.black} />
            </TouchableOpacity>
          )}
        </View>
      </Bounce>
    </Animated.View>
  );
});

const WhyCard = React.memo(({ item, index }) => (
  <Animated.View entering={FadeInUp.delay(index * 70 + 180).duration(420).springify()} style={styles.whyCard}>
    <View style={[styles.whyIcon, { borderColor: item.color + "30" }]}><Text style={{ fontSize: 20 }}>{item.emoji}</Text></View>
    <Text style={styles.whyTitle}>{item.title}</Text>
    <Text style={styles.whyDesc}>{item.desc}</Text>
    <View style={[styles.whyBar, { backgroundColor: item.color }]} />
  </Animated.View>
));

const SecHead = ({ emoji, title, sub, right }) => (
  <View style={styles.secHead}>
    <View>
      <View style={styles.secRow}><Text style={styles.secEmoji}>{emoji}</Text><Text style={styles.secTitle}>{title}</Text></View>
      {sub && <Text style={styles.secSub}>{sub}</Text>}
    </View>
    {right}
  </View>
);

const Divider = () => (
  <View style={styles.divider}>
    <View style={styles.divLine} />
    <View style={styles.divDiamond} />
    <View style={styles.divLine} />
  </View>
);

// ═══════════════════════════════════════════
// FLOATING CTA  — completely redesigned
// ═══════════════════════════════════════════
const FloatingCTA = React.memo(({ visible, onPress }) => {
  const ty  = useSharedValue(120);
  const sc  = useSharedValue(0.92);

  useEffect(() => {
    ty.value = withSpring(visible ? 0 : 120, { damping: 20, stiffness: 160 });
    sc.value = withSpring(visible ? 1  : 0.92, { damping: 18, stiffness: 160 });
  }, [visible]);

  const wrap = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: sc.value }],
  }));

  return (
    <Animated.View style={[styles.ctaWrap, wrap]} pointerEvents={visible ? "auto" : "none"}>
      <Bounce onPress={onPress} intensity={0.97}>
        {/* Card */}
        <View style={styles.ctaCard}>
          {/* Left: icon + text */}
          <View style={styles.ctaLeft}>
            {/* Search icon box */}
            <LinearGradient colors={["#0A0A0A", "#2A2A2A"]} style={styles.ctaIconBox}>
              <Ionicons name="search" size={18} color={C.white} />
            </LinearGradient>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>Where to?</Text>
              <Text style={styles.ctaSub}>Book a ride instantly</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.ctaDivider} />

          {/* Right: arrow */}
          <View style={styles.ctaRight}>
            <View style={styles.ctaArrowBox}>
              <Ionicons name="arrow-forward" size={16} color={C.white} />
            </View>
          </View>
        </View>
      </Bounce>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════
export default function ServiceSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef      = useRef(null);
  const offerScrollRef = useRef(null);

  const [user,        setUser]        = useState(null);
  const [addrTitle,   setAddrTitle]   = useState("Detecting location…");
  const [addrSub,     setAddrSub]     = useState("Please wait");
  const [locLoading,  setLocLoading]  = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [activeOffer, setActiveOffer] = useState(0);
  const [trips,       setTrips]       = useState([]);
  const [tripsLoad,   setTripsLoad]   = useState(true);
  const [showAll,     setShowAll]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [showCTA,     setShowCTA]     = useState(false);
  // Add these new states (inside ServiceSelectScreen component)
  const [savedHome, setSavedHome] = useState(null);
  const [savedOffice, setSavedOffice] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyCategory, setNearbyCategory] = useState("");
  const [showNearbySheet, setShowNearbySheet] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(setShowCTA)(e.contentOffset.y > 220);
    },
  });

  const headerH    = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 160], [128 + insets.top, 58 + insets.top], Extrapolate.CLAMP),
  }));
  const expandedOp = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 90], [1, 0], Extrapolate.CLAMP),
  }));
  const compactOp  = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [70, 140], [0, 1], Extrapolate.CLAMP),
  }));

  useEffect(() => {
    const u = auth().currentUser;
    if (u) setUser({ name: u.displayName || "User", email: u.email, photo: u.photoURL });
  }, []);

  // Replace the existing loadLocation with this:
  const loadLocation = useCallback(async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAddrTitle("Location access needed");
        setAddrSub("Tap to enable");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const geo = await Location.reverseGeocodeAsync(pos.coords);
      const g = geo?.[0];

      // Save current location for nearby search
      setCurrentLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      setAddrTitle(
        [g?.name, g?.street].filter(Boolean).join(", ") || "Current location"
      );
      setAddrSub(
        [g?.district || g?.subregion, g?.city].filter(Boolean).join(", ") ||
          "Located"
      );
    } catch {
      setAddrTitle("Unable to detect location");
      setAddrSub("Tap to retry");
    } finally {
      setLocLoading(false);
    }
  }, []);

  // Add this handler for destination circles
  const handleDestinationTap = useCallback(
    async (dest) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // SAVED PLACES (Home / Office)
      if (dest.type === "saved") {
        if (dest.label === "Home") {
          if (savedHome) {
            navigation.navigate("PickDrop", {
              prefilledDrop: {
                description: savedHome.description,
                location: savedHome.location,
              },
            });
          } else {
            Alert.alert(
              "No Home Address",
              "You haven't saved your home address yet.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Add Now",
                  onPress: () => navigation.navigate("SavedPlaces"),
                },
              ]
            );
          }
          return;
        }

        if (dest.label === "Office") {
          if (savedOffice) {
            navigation.navigate("PickDrop", {
              prefilledDrop: {
                description: savedOffice.description,
                location: savedOffice.location,
              },
            });
          } else {
            Alert.alert(
              "No Office Address",
              "You haven't saved your office address yet.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Add Now",
                  onPress: () => navigation.navigate("SavedPlaces"),
                },
              ]
            );
          }
          return;
        }
      }

      // NEARBY PLACES (Airport, Hospital, Mall, College)
      if (dest.type === "nearby") {
        if (!currentLocation) {
          Alert.alert("Location Required", "Please enable location to find nearby places.");
          return;
        }

        setNearbyCategory(dest.label);
        setNearbyLoading(true);
        setShowNearbySheet(true);
        setNearbyPlaces([]);

        try {
          const placeType = getPlaceType(dest.label);
          const places = await searchNearbyPlaces(currentLocation, placeType, 10000);

          // Sort by distance (nearest first)
          const sorted = places.sort((a, b) => a.distance - b.distance);
          setNearbyPlaces(sorted);
        } catch (err) {
          console.log("Nearby search error:", err);
          setNearbyPlaces([]);
        } finally {
          setNearbyLoading(false);
        }
      }
    },
    [savedHome, savedOffice, currentLocation, navigation]
  );

  // Handler when user selects a nearby place
  const handleNearbyPlaceSelect = useCallback(
    (place) => {
      setShowNearbySheet(false);
      navigation.navigate("PickDrop", {
        prefilledDrop: {
          description: place.name + ", " + place.address,
          location: place.location,
        },
      });
    },
    [navigation]
  );

  const loadTrips = useCallback(async () => {
    try {
      setTripsLoad(true);
      const u = auth().currentUser;
      if (!u) return;
      const r = await fetch(`${API_BASE_URL}/orders/user/${u.uid}`);
      if (r.ok) setTrips(await r.json());
    } catch (e) { console.log("trips err:", e); }
    finally { setTripsLoad(false); }
  }, []);

  useEffect(() => { loadLocation(); loadTrips(); }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setActiveOffer((p) => {
        const n = (p + 1) % OFFERS.length;
        offerScrollRef.current?.scrollTo({ x: n * (width - 48), animated: true });
        return n;
      });
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  // Load saved Home & Office addresses
  useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        const u = auth().currentUser;
        if (!u) return;

        const res = await fetch(`${API_BASE_URL}/users/${u.uid}/saved-places`);
        if (!res.ok) return;

        const places = await res.json();
        if (!Array.isArray(places)) return;

        const home = places.find(
          (p) => p.type?.toLowerCase() === "home" || p.name?.toLowerCase() === "home"
        );
        const office = places.find(
          (p) =>
            p.type?.toLowerCase() === "office" ||
            p.type?.toLowerCase() === "work" ||
            p.name?.toLowerCase() === "office"
        );

        if (home) {
          setSavedHome({
            description: home.address,
            location: { lat: home.lat, lng: home.lng },
            name: home.name,
          });
        }

        if (office) {
          setSavedOffice({
            description: office.address,
            location: { lat: office.lat, lng: office.lng },
            name: office.name,
          });
        }
      } catch (err) {
        console.log("Load saved addresses error:", err);
      }
    };

    loadSavedAddresses();
  }, []);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadLocation(), loadTrips()]);
    setRefreshing(false);
  }, []);

  const goService = useCallback((route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(route);
  }, [navigation]);

  const copyCode = useCallback((code) => {
    Clipboard.setString(code);
    Alert.alert("✅ Copied!", `"${code}" applied`);
  }, []);

  const goTrip = useCallback((trip) => navigation.navigate("TripDetails", { tripId: trip.id, trip }), [navigation]);
  const rebook = useCallback((trip) => {
    Alert.alert("Rebook?", "Same trip again?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => navigation.navigate(
          trip.service_type === "driver" ? "Driver" : trip.service_type === "wash" ? "CarWash" : "PickDrop",
          { rebook: true, previousTrip: trip }
        )},
    ]);
  }, [navigation]);

  const filteredSvc = useMemo(() =>
    search.trim() ? SERVICES.filter((s) => s.title.toLowerCase().includes(search.toLowerCase())) : SERVICES,
    [search]
  );

  const HEADER_H = 128 + insets.top;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} translucent />

      {/* ─── HEADER ─── */}
      <Animated.View style={[styles.header, headerH, { paddingTop: insets.top }]}>
        <LinearGradient colors={["#000000", "#0D0D0D"]} style={StyleSheet.absoluteFill} />

        {/* EXPANDED */}
        <Animated.View style={[styles.headerExp, expandedOp]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.locBtn} onPress={loadLocation} activeOpacity={0.8}>
              <View style={styles.locIcon}><Ionicons name="location-sharp" size={15} color={C.white} /></View>
              <View style={styles.locInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: SP.xs }}>
                  <Text style={styles.locTitle} numberOfLines={1}>{locLoading ? "Updating…" : addrTitle}</Text>
                  <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.45)" />
                </View>
                <Text style={styles.locSub} numberOfLines={1}>{addrSub}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Notifications")}>
                <Ionicons name="notifications-outline" size={19} color={C.white} />
                <View style={styles.badge}><Text style={styles.badgeTxt}>2</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate("Profile")}>
                {user?.photo
                  ? <Image source={{ uri: user.photo }} style={styles.avatar} />
                  : <LinearGradient colors={["#333", "#111"]} style={styles.avatarFB}>
                      <Text style={styles.avatarInit}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
                    </LinearGradient>
                }
              </TouchableOpacity>
            </View>
          </View>
          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={C.silver} />
            <TextInput
              placeholder='Search "ride to airport"'
              placeholderTextColor={C.lightGray}
              style={styles.searchInput}
              value={search} onChangeText={setSearch}
              returnKeyType="search"
            />
            {search
              ? <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={C.lightGray} /></TouchableOpacity>
              : <TouchableOpacity style={styles.micBtn}><Ionicons name="mic" size={15} color={C.black} /></TouchableOpacity>
            }
          </View>
        </Animated.View>

        {/* COMPACT */}
        <Animated.View style={[styles.compact, compactOp]}>
          <TouchableOpacity style={styles.compactLoc} onPress={loadLocation}>
            <Ionicons name="location-sharp" size={14} color={C.white} />
            <Text style={styles.compactTxt} numberOfLines={1}>{addrTitle}</Text>
            <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={18} color={C.white} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ─── SCROLL ─── */}
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_H, paddingBottom: 120 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={onRefresh}
            tintColor={C.white} colors={[C.black]}
            progressViewOffset={HEADER_H}
          />
        }
      >
        {/* HERO */}
        <View style={styles.heroSection}>
          <HeroCarousel />
        </View>

        {/* Quick Destinations */}
        <View style={styles.section}>
          <SecHead emoji="📍" title="Quick Destinations" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destRow}
          >
            {DESTINATIONS.map((d, i) => (
              <DestCircle
                key={d.id}
                item={{
                  ...d,
                  // Show saved address subtitle for Home/Office
                  sub:
                    d.label === "Home" && savedHome
                      ? "Saved ✓"
                      : d.label === "Office" && savedOffice
                      ? "Saved ✓"
                      : d.sub,
                }}
                index={i}
                onPress={() => handleDestinationTap(d)}
              />
            ))}
          </ScrollView>
        </View>

        <Divider />

        {/* Services */}
        <View style={styles.section}>
          <SecHead
            emoji="🚀" title="Our Services" sub="Everything in one tap"
            right={
              <View style={styles.liveChip}>
                <PulseDot size={5} color={C.green} />
                <Text style={styles.liveChipTxt}>All Live</Text>
              </View>
            }
          />
          <View style={styles.svcGrid}>
            {filteredSvc.map((s, i) => (
              <ServiceCard key={s.id} item={s} index={i} onPress={() => goService(s.route)} />
            ))}
          </View>
        </View>

        <Divider />

        {/* Offers */}
        <View style={styles.section}>
          <SecHead
            emoji="🔥" title="Hot Offers" sub="Exclusive deals for you"
            right={<TouchableOpacity onPress={() => navigation.navigate("Offers")}><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>}
          />
          <ScrollView
            ref={offerScrollRef} horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width - 48}
            contentContainerStyle={{ paddingRight: SP.lg }}
            onScroll={(e) => setActiveOffer(Math.round(e.nativeEvent.contentOffset.x / (width - 48)))}
            scrollEventThrottle={16}
          >
            {OFFERS.map((o, i) => <OfferCard key={o.id} item={o} index={i} onCopy={copyCode} />)}
          </ScrollView>
          <View style={styles.dots}>
            {OFFERS.map((_, i) => <View key={i} style={[styles.dot, activeOffer === i && styles.dotActive]} />)}
          </View>
        </View>

        {/* Safety */}
        <Animated.View entering={FadeInUp.delay(150).duration(450)} style={styles.safetyCard}>
          <View style={styles.safetyHead}>
            <Ionicons name="shield-checkmark" size={14} color={C.green} />
            <Text style={styles.safetyHeadTxt}>100% Safe & Verified</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.safetyRow}>
            {["Verified Drivers", "Live Tracking", "SOS Button", "Trip Insurance"].map((f, i) => (
              <Animated.View key={f} entering={FadeInRight.delay(i * 70 + 250).duration(360)} style={styles.safetyPill}>
                <Ionicons name="checkmark" size={10} color={C.green} />
                <Text style={styles.safetyPillTxt}>{f}</Text>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        <Divider />

        {/* Recent Trips */}
        <View style={styles.section}>
          <SecHead
            emoji="🕐" title="Recent Activity" sub="Your bookings history"
            right={trips.length > 2
              ? <TouchableOpacity onPress={() => setShowAll(!showAll)}><Text style={styles.seeAll}>{showAll ? "Less ↑" : "All →"}</Text></TouchableOpacity>
              : null}
          />
          {tripsLoad ? (
            <View style={{ gap: SP.md }}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.shimCard}>
                  <Shimmer w={46} h={46} radius={12} />
                  <View style={{ flex: 1, marginLeft: SP.md, gap: SP.sm }}>
                    <Shimmer w={110} h={13} />
                    <Shimmer w={170} h={11} />
                    <Shimmer w={80} h={9} />
                  </View>
                </View>
              ))}
            </View>
          ) : trips.length > 0 ? (
            <View style={{ gap: SP.md }}>
              {(showAll ? trips : trips.slice(0, 3)).map((t, i) => (
                <TripCard key={t.id} item={t} index={i} onPress={() => goTrip(t)} onRebook={rebook} />
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(450)} style={styles.emptyCard}>
              <Text style={{ fontSize: 38, marginBottom: SP.lg }}>🚗</Text>
              <Text style={styles.emptyTitle}>No rides yet</Text>
              <Text style={styles.emptySub}>Your history will appear here</Text>
              <Bounce onPress={() => navigation.navigate("PickDrop")} intensity={0.95}>
                <LinearGradient colors={["#0A0A0A", "#333333"]} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnTxt}>Book First Ride</Text>
                  <Ionicons name="arrow-forward" size={14} color={C.white} />
                </LinearGradient>
              </Bounce>
            </Animated.View>
          )}
        </View>

        <Divider />

        {/* Why Us */}
        <View style={styles.section}>
          <SecHead emoji="✨" title="Why GoRide?" sub="Built for your comfort" />
          <View style={styles.whyGrid}>
            {WHY_US.map((w, i) => <WhyCard key={w.title} item={w} index={i} />)}
          </View>
        </View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)} style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < 3 && styles.statBorder]}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerLogo}>GoRide</Text>
          <Text style={styles.footerTag}>Your daily ride companion</Text>
          <View style={styles.footerLinks}>
            {["About", "Privacy", "Terms", "Help"].map((l, i) => (
              <TouchableOpacity key={i}><Text style={styles.footerLink}>{l}</Text></TouchableOpacity>
            ))}
          </View>
          <Text style={styles.footerCopy}>© 2024 GoRide Technologies Pvt. Ltd.</Text>
        </View>
      </Animated.ScrollView>

      {/* ─── FLOATING CTA ─── */}
      <FloatingCTA
        visible={showCTA}
        onPress={() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          goService("PickDrop");
        }}
      />

      {/* Nearby Places Sheet */}
<NearbyPlacesSheet
  visible={showNearbySheet}
  onClose={() => setShowNearbySheet(false)}
  places={nearbyPlaces}
  loading={nearbyLoading}
  category={nearbyCategory}
  onSelectPlace={handleNearbyPlaceSelect}
/>
    </View>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header:        { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, overflow: "hidden" },
  headerExp:     { flex: 1, paddingHorizontal: SP.lg, justifyContent: "flex-end", paddingBottom: SP.md },
  headerRow:     { flexDirection: "row", alignItems: "center", marginBottom: SP.md },
  locBtn:        { flex: 1, flexDirection: "row", alignItems: "center", marginRight: SP.md },
  locIcon:       { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center", marginRight: SP.sm },
  locInfo:       { flex: 1 },
  locTitle:      { fontSize: 14, fontWeight: "800", color: C.white, flex: 1, letterSpacing: -0.2 },
  locSub:        { fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: SP.sm },
  iconBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  badge:         { position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: C.red, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: C.black },
  badgeTxt:      { fontSize: 7, fontWeight: "900", color: C.white },
  avatarBtn:     { width: 36, height: 36, borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)" },
  avatar:        { width: "100%", height: "100%", borderRadius: 18 },
  avatarFB:      { width: "100%", height: "100%", borderRadius: 18, justifyContent: "center", alignItems: "center" },
  avatarInit:    { fontSize: 14, fontWeight: "800", color: C.white },
  searchBox:     { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.full, paddingHorizontal: SP.lg, height: 44, ...SH.md },
  searchInput:   { flex: 1, marginLeft: SP.sm, fontSize: 13, color: C.black },
  micBtn:        { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" },
  compact:       { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: SP.lg, paddingBottom: SP.md, gap: SP.sm },
  compactLoc:    { flex: 1, flexDirection: "row", alignItems: "center", gap: SP.xs },
  compactTxt:    { flex: 1, fontSize: 13, fontWeight: "700", color: C.white },

  // Hero
  heroSection: { marginHorizontal: SP.lg, marginTop: SP.lg, borderRadius: R.xxl, overflow: "hidden", ...SH.lg },
  hero:        { height: 155 },

  // Scene
  sceneInner:  { flex: 1, position: "relative", overflow: "hidden" },
  citySky:     { position: "absolute", inset: 0 },
  // Replace only these style definitions in your StyleSheet.create({})
// Everything else stays exactly the same

  // ─── ROAD ───────────────────────────────────────────────
  road:        { position: "absolute", bottom: 0, left: 0, right: 0, height: 28 },
  roadSurface: { 
    position: "absolute", inset: 0, 
    backgroundColor: "#3D3D3D",   // lighter asphalt — was C.charcoal (#333)
    borderRadius: 2 
  },
  roadDashes:  { 
    position: "absolute", top: 11, left: 0, right: 0, 
    flexDirection: "row", gap: 16, paddingHorizontal: SP.md 
  },
  roadDash:    { 
    width: 24, height: 3, 
    backgroundColor: "#F5C518",   // yellow road markings — was C.graphite (dark)
    borderRadius: 2 
  },
  roadCurb:    { 
    position: "absolute", bottom: 0, left: 0, right: 0, height: 4, 
    backgroundColor: "#555555"    // slightly visible curb — was C.blackS
  },

  // ─── CAR ────────────────────────────────────────────────
  carWrap:      { position: "absolute", bottom: 28 },
  car:          { width: 88, height: 42 },
  carCabin:     { 
    position: "absolute", top: 0, left: 18, width: 44, height: 16, 
    backgroundColor: "#2563EB",   // bright blue cabin roof — was C.blackM
    borderTopLeftRadius: 10, borderTopRightRadius: 9, 
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2 
  },
  carGlass:     { 
    position: "absolute", top: 2, width: 16, height: 11, 
    backgroundColor: "rgba(186,230,253,0.55)",  // light blue glass — more visible
    borderRadius: 2 
  },
  carBody:      { 
    position: "absolute", top: 14, left: 0, right: 0, height: 18, 
    backgroundColor: "#1D4ED8",   // rich blue car body — was C.black (invisible)
    borderRadius: 3 
  },
  carDoorLine:  { 
    position: "absolute", top: 3, left: 38, width: 1, height: 12, 
    backgroundColor: "#3B82F6"    // slightly lighter blue door line
  },
  carHandle:    { 
    position: "absolute", top: 6, width: 9, height: 2, 
    backgroundColor: "#93C5FD",   // light blue handle — was dark silver
    borderRadius: 1 
  },
  carHeadlight: { 
    position: "absolute", right: 3, top: 5, width: 8, height: 8, 
    borderRadius: 4, 
    backgroundColor: "#FEF9C3",   // bright yellow headlight
    shadowColor: "#FEF08A",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  carTaillight: { 
    position: "absolute", left: 3, top: 5, width: 7, height: 7, 
    borderRadius: 3, 
    backgroundColor: "#EF4444",   // bright red taillight
    shadowColor: "#EF4444",
    shadowOffset: { width: -1, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  carBumper:    { 
    position: "absolute", top: 29, width: 6, height: 9, 
    backgroundColor: "#4B5563",   // visible grey bumper — was C.charcoal
    borderRadius: 2 
  },
  carWheel:     { 
    position: "absolute", top: 28, width: 15, height: 15, borderRadius: 8, 
    backgroundColor: "#1F2937",   // dark wheel rim
    justifyContent: "center", alignItems: "center",
    borderWidth: 2,
    borderColor: "#6B7280",       // grey tyre ring
  },
  carWheelHub:  { 
    width: 6, height: 6, borderRadius: 3, 
    backgroundColor: "#D1D5DB"    // light hub cap — was dark
  },

  // ─── EXHAUST ────────────────────────────────────────────
  exhaust: { position: "absolute", bottom: 33, left: 0 },
  exPuff:  { 
    position: "absolute", borderRadius: 10, 
    backgroundColor: "rgba(209,213,219,0.6)"  // light grey smoke — more visible
  },

  // ─── WASH FRAME ─────────────────────────────────────────
  washFrame:  { position: "absolute", bottom: 26, left: width * 0.14, width: 80, height: 80 },
  washBar:    { 
    position: "absolute", top: 0, left: 4, right: 4, height: 5, 
    backgroundColor: "#F59E0B",   // amber wash bar — was barely visible
    borderRadius: 2 
  },
  washPillar: { 
    position: "absolute", top: 0, width: 4, bottom: 0, 
    backgroundColor: "#D97706",   // amber pillars
    borderRadius: 2 
  },
  waterDrop:  { 
    position: "absolute", width: 4, height: 9, borderRadius: 4, 
    backgroundColor: "#60A5FA"    // bright blue water drops — was barely visible
  },

  // ─── PERSON ─────────────────────────────────────────────
  personWrap: { position: "absolute" },
  personHead: { 
    width: 12, height: 12, borderRadius: 6, 
    backgroundColor: "#FBBF24",   // skin-tone head — was C.charcoal (dark)
    alignSelf: "center", marginBottom: 1,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  personBody: { 
    width: 14, height: 18, 
    backgroundColor: "#10B981",   // green shirt body — was C.blackS (invisible)
    borderRadius: 3, alignSelf: "center", position: "relative" 
  },
  personArm:  { 
    position: "absolute", top: 3, height: 4, width: 16, 
    backgroundColor: "#34D399",   // lighter green arm — was C.graphite
    borderRadius: 2 
  },
  personLegs: { flexDirection: "row", justifyContent: "center", gap: 3, marginTop: 1 },
  personLeg:  { 
    width: 5, height: 10, 
    backgroundColor: "#374151",   // dark jeans — slightly more visible
    borderRadius: 3 
  },
  sponge:     { 
    position: "absolute", right: -6, top: -3, width: 9, height: 7, 
    backgroundColor: "#F9A8D4",   // pink sponge — was dark silver
    borderRadius: 2 
  },
  phoneIcon:  { 
    position: "absolute", right: -4, top: -8, width: 6, height: 10, 
    backgroundColor: "#1F2937",   // dark phone
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#6B7280",
  },

  // ─── SIGNAL RING & PIN ──────────────────────────────────
  signalRing: { 
    position: "absolute", top: -14, right: -8, width: 22, height: 22, 
    borderRadius: 11, borderWidth: 2, 
    borderColor: "#60A5FA",        // visible blue signal ring — was C.silver
    backgroundColor: "transparent" 
  },
  locPin:     { position: "absolute", bottom: 78, right: SP.xl + 2 },
  pinHead:    { 
    width: 18, height: 18, borderRadius: 9, 
    backgroundColor: "#EF4444",   // red pin — was C.black
    borderWidth: 2, borderColor: C.white, 
    justifyContent: "center", alignItems: "center" 
  },
  pinDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  pinTail:    { 
    width: 0, height: 0, 
    borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 10, 
    borderLeftColor: "transparent", borderRightColor: "transparent", 
    borderTopColor: "#EF4444",    // red pin tail — was C.black
    alignSelf: "center" 
  },

  // ─── CITY SKY BUILDINGS ─────────────────────────────────
  // The CitySky component uses inline styles — replace the component:

  // ─── SCENE CHIPS ────────────────────────────────────────
  sceneChip:    { 
    position: "absolute", top: SP.sm, left: SP.md, 
    flexDirection: "row", alignItems: "center", gap: SP.xs, 
    backgroundColor: "rgba(255,255,255,0.18)",  // slightly more opaque
    paddingHorizontal: SP.md, paddingVertical: 5, 
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  sceneChipTxt: { fontSize: 10, fontWeight: "700", color: C.white },
  etaChip:      { 
    position: "absolute", top: SP.sm, right: SP.md, 
    backgroundColor: "rgba(255,255,255,0.18)", 
    paddingHorizontal: SP.md, paddingVertical: 5, 
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  etaChipTxt:   { fontSize: 10, fontWeight: "600", color: C.white },

  // ─── HERO BACKGROUND ────────────────────────────────────
  // Also update the LinearGradient in HeroCarousel from dark to slightly lighter:
  // colors={["#0D1117", "#161B22", "#0D1117"]}
  // Hero footer
  heroFooter:    { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SP.lg, paddingVertical: SP.sm, backgroundColor: "rgba(0,0,0,0.45)" },
  heroLabel:     { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: 0.4 },
  heroDots:      { flexDirection: "row", gap: SP.sm },
  heroDot:       { width: 22, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  heroDotActive: { width: 30, backgroundColor: "rgba(255,255,255,0.25)" },
  heroDotBar:    { height: "100%", backgroundColor: C.white, borderRadius: 2 },

  // Sections
  section:     { paddingHorizontal: SP.lg, paddingVertical: SP.xl },
  secHead:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SP.lg },
  secRow:      { flexDirection: "row", alignItems: "center", gap: SP.xs },
  secEmoji:    { fontSize: 17 },
  secTitle:    { fontSize: 18, fontWeight: "900", color: C.black, letterSpacing: -0.3 },
  secSub:      { fontSize: 11, color: C.lightGray, marginTop: 2 },
  seeAll:      { fontSize: 12, fontWeight: "700", color: C.black },
  liveChip:    { flexDirection: "row", alignItems: "center", gap: SP.xs, backgroundColor: C.greenBg, paddingHorizontal: SP.md, paddingVertical: 4, borderRadius: R.full },
  liveChipTxt: { fontSize: 10, fontWeight: "700", color: C.greenDk },

  // Divider
  divider:    { flexDirection: "row", alignItems: "center", paddingHorizontal: SP.xxl, marginVertical: SP.xs },
  divLine:    { flex: 1, height: 1, backgroundColor: C.shimmer },
  divDiamond: { width: 7, height: 7, transform: [{ rotate: "45deg" }], borderWidth: 1, borderColor: C.smoke, marginHorizontal: SP.md, backgroundColor: C.bg },

  // Destinations
  destRow:    { paddingRight: SP.lg, gap: SP.xl },
  destWrap:   { alignItems: "center", width: 66 },
  destCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.card, justifyContent: "center", alignItems: "center", marginBottom: SP.sm, borderWidth: 1.5, borderColor: C.shimmer, ...SH.sm },
  destLabel:  { fontSize: 11, fontWeight: "700", color: C.black, textAlign: "center" },
  destSub:    { fontSize: 9, color: C.lightGray, textAlign: "center", marginTop: 1 },

  // Services
  svcGrid:     { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: SP.md },
  svcWrap:     { width: (width - SP.lg * 2 - SP.md) / 2 },
  svcCard:     { backgroundColor: C.card, borderRadius: R.xl, padding: SP.lg, minHeight: 164, position: "relative", overflow: "hidden", ...SH.md },
  svcAccent:   { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: C.black },
  svcBadge:    { position: "absolute", top: SP.sm, right: SP.sm, backgroundColor: C.black, paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: R.xs },
  svcBadgeTxt: { fontSize: 7, fontWeight: "800", color: C.white, letterSpacing: 0.5 },
  svcEmoji:    { width: 48, height: 48, borderRadius: R.md, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", marginBottom: SP.md },
  svcTitle:    { fontSize: 14, fontWeight: "800", color: C.black, letterSpacing: -0.2 },
  svcSub:      { fontSize: 11, color: C.silver, marginTop: 2, marginBottom: SP.sm },
  svcFooter:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  svcEta:      { flexDirection: "row", alignItems: "center", gap: SP.xs },
  svcEtaTxt:   { fontSize: 10, color: C.silver },
  svcRating:   { fontSize: 10, color: C.silver, fontWeight: "600" },

  // Offers
  offerWrap:      { width: width - 48, marginRight: SP.md },
  offerCard:      { borderRadius: R.xxl, padding: SP.xl, minHeight: 155, justifyContent: "center", overflow: "hidden" },
  offerDeco1:     { position: "absolute", top: -32, right: -32, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)" },
  offerDeco2:     { position: "absolute", bottom: -20, left: 40, width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.04)" },
  offerTag:       { backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "flex-start", paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: R.xs, marginBottom: SP.sm },
  offerTagTxt:    { fontSize: 8, fontWeight: "800", color: C.smoke, letterSpacing: 0.8 },
  offerMain:      { flexDirection: "row", alignItems: "center", marginBottom: SP.sm },
  offerDiscount:  { fontSize: 28, fontWeight: "900", color: C.white, letterSpacing: -1 },
  offerTitle:     { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  offerSub:       { fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: SP.md },
  offerRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  offerCodeBtn:   { flexDirection: "row", alignItems: "center", gap: SP.xs, backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: R.full },
  offerCodeCopied:{ backgroundColor: "rgba(34,197,94,0.3)" },
  offerCode:      { fontSize: 11, fontWeight: "800", color: C.white, letterSpacing: 1 },
  offerExp:       { fontSize: 10, color: "rgba(255,255,255,0.4)" },
  dots:           { flexDirection: "row", justifyContent: "center", marginTop: SP.md, gap: SP.xs },
  dot:            { width: 7, height: 7, borderRadius: 4, backgroundColor: C.smoke },
  dotActive:      { width: 20, backgroundColor: C.black, borderRadius: 4 },

  // Safety
  safetyCard:    { marginHorizontal: SP.lg, backgroundColor: C.card, borderRadius: R.xl, padding: SP.lg, ...SH.sm },
  safetyHead:    { flexDirection: "row", alignItems: "center", gap: SP.sm, marginBottom: SP.md },
  safetyHeadTxt: { fontSize: 12, fontWeight: "700", color: C.black },
  safetyRow:     { gap: SP.sm, paddingRight: SP.lg },
  safetyPill:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.bg, paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: R.full },
  safetyPillTxt: { fontSize: 11, fontWeight: "600", color: C.graphite },

  // Trips
  shimCard:      { flexDirection: "row", alignItems: "center", backgroundColor: C.card, padding: SP.lg, borderRadius: R.xl, ...SH.sm },
  tripCard:      { flexDirection: "row", alignItems: "center", backgroundColor: C.card, padding: SP.lg, borderRadius: R.xl, ...SH.sm },
  tripIcon:      { width: 46, height: 46, borderRadius: R.md, justifyContent: "center", alignItems: "center", marginRight: SP.md },
  tripInfo:      { flex: 1 },
  tripRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SP.xs },
  tripName:      { fontSize: 13, fontWeight: "700", color: C.black },
  tripStatus:    { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: R.full },
  tripDot:       { width: 5, height: 5, borderRadius: 3 },
  tripStatusTxt: { fontSize: 9, fontWeight: "700", textTransform: "capitalize" },
  tripLoc:       { fontSize: 11, color: C.silver, marginBottom: SP.xs },
  tripDate:      { fontSize: 10, color: C.lightGray },
  tripPrice:     { fontSize: 12, fontWeight: "800", color: C.black },
  rebookBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", marginLeft: SP.md },

  // Empty
  emptyCard:   { alignItems: "center", backgroundColor: C.card, borderRadius: R.xxl, padding: SP.xxxl, ...SH.sm },
  emptyTitle:  { fontSize: 15, fontWeight: "800", color: C.black },
  emptySub:    { fontSize: 11, color: C.silver, textAlign: "center", marginTop: 4, marginBottom: SP.xl },
  emptyBtn:    { flexDirection: "row", alignItems: "center", gap: SP.sm, paddingHorizontal: SP.xxl, paddingVertical: SP.md, borderRadius: R.full },
  emptyBtnTxt: { fontSize: 12, fontWeight: "700", color: C.white },

  // Why Us
  whyGrid:  { flexDirection: "row", flexWrap: "wrap", gap: SP.md },
  whyCard:  { width: (width - SP.lg * 2 - SP.md) / 2, backgroundColor: C.card, borderRadius: R.xl, padding: SP.lg, position: "relative", overflow: "hidden", ...SH.sm },
  whyIcon:  { width: 42, height: 42, borderRadius: R.md, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", marginBottom: SP.md, borderWidth: 1.5 },
  whyTitle: { fontSize: 12, fontWeight: "800", color: C.black, marginBottom: SP.xxs },
  whyDesc:  { fontSize: 10, color: C.silver, lineHeight: 14 },
  whyBar:   { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },

  // Stats
  statsRow:   { flexDirection: "row", marginHorizontal: SP.lg, backgroundColor: C.black, borderRadius: R.xl, overflow: "hidden", ...SH.lg },
  statItem:   { flex: 1, alignItems: "center", paddingVertical: SP.xl },
  statBorder: { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.07)" },
  statNum:    { fontSize: 15, fontWeight: "900", color: C.white, letterSpacing: -0.2 },
  statLabel:  { fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 3 },

  // Footer
  footer:      { paddingHorizontal: SP.lg, paddingVertical: SP.xl, marginTop: SP.xl, alignItems: "center" },
  footerLine:  { width: "100%", height: 1, backgroundColor: C.shimmer, marginBottom: SP.xxl },
  footerLogo:  { fontSize: 19, fontWeight: "900", color: C.black, letterSpacing: -0.4 },
  footerTag:   { fontSize: 11, color: C.lightGray, marginTop: 3 },
  footerLinks: { flexDirection: "row", gap: SP.xxl, marginTop: SP.lg },
  footerLink:  { fontSize: 11, color: C.silver },
  footerCopy:  { fontSize: 9, color: C.lightGray, marginTop: SP.lg },

  // ── Floating CTA — new design ──
  ctaWrap: {
    position: "absolute",
    bottom: 28,
    left: SP.lg,
    right: SP.lg,
    zIndex: 200,
    ...SH.xl,
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: R.xxl,
    paddingVertical: SP.md,
    paddingHorizontal: SP.lg,
    borderWidth: 1,
    borderColor: C.shimmer,
  },
  ctaLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SP.md,
  },
  ctaIconBox: {
    width: 42,
    height: 42,
    borderRadius: R.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.black,
    letterSpacing: -0.2,
  },
  ctaSub: {
    fontSize: 11,
    color: C.lightGray,
    marginTop: 1,
  },
  ctaDivider: {
    width: 1,
    height: 32,
    backgroundColor: C.shimmer,
    marginHorizontal: SP.md,
  },
  ctaRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  ctaArrowBox: {
    width: 38,
    height: 38,
    borderRadius: R.lg,
    backgroundColor: C.black,
    justifyContent: "center",
    alignItems: "center",
  },
});