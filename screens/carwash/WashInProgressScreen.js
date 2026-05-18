// screens/carwash/WashInProgressScreen.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Image,
  ScrollView,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../../config";
import ScreenWrapper from "../../components/ScreenWrapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SCENE_WIDTH = SCREEN_WIDTH - 32;

// ==================== DESIGN SYSTEM ====================
const C = {
  violet: "#3D2B8C", violetDark: "#2A1E6B", violetMid: "#4D3CA0",
  blue: "#1E40AF", blueDark: "#1E3A8A", blueDeep: "#172554",
  primarySoft: "#EEEAFB", primarySoftDeep: "#DCD4F5", lavenderBg: "#F1EEFB",
  gold: "#F5C518", goldLight: "#FFD740", goldDark: "#C9A015",
  bg: "#F7F7FA", card: "#FFFFFF", surface: "#F9FAFB",
  textDark: "#0F0F1F", textPrimary: "#1F1F33", textMid: "#4A4A66",
  textLight: "#7B7B95", textFaint: "#A8A8BC",
  border: "#EDEDF2", borderMid: "#DDDDE5", divider: "#E8E8EE",
  success: "#22C55E", successDark: "#16A34A",
  white: "#FFFFFF", shadow: "#0F0F1F",
};
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };
const GRAD = {
  primary: [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const onlyHttp = (arr) =>
  (arr || []).filter((u) => typeof u === "string" && /^https?:\/\//.test(u));

const WASH_STAGES = [
  { id: 1, name: "Exterior Rinse", icon: "water-outline", tip: "Pre-rinsing removes loose dirt", color: "#3B82F6" },
  { id: 2, name: "Foam Application", icon: "cloudy-outline", tip: "Snow foam lifts stubborn grime", color: "#8B5CF6" },
  { id: 3, name: "Scrub & Clean", icon: "brush-outline", tip: "Gentle scrub protects your paint", color: "#EC4899" },
  { id: 4, name: "Interior Vacuum", icon: "car-outline", tip: "Deep cleaning every corner", color: "#F59E0B" },
  { id: 5, name: "Final Rinse", icon: "water", tip: "Spotless rinse for a clean finish", color: "#10B981" },
  { id: 6, name: "Dry & Polish", icon: "sparkles-outline", tip: "Microfiber drying prevents spots", color: "#F5C518" },
];

const FUN_FACTS = [
  "🚗 Your car collects over 1,000 bacteria per square inch!",
  "💧 Professional washes save up to 80% more water than DIY",
  "✨ Regular washes protect your paint from UV damage",
  "🧽 Our technicians are trained in 15+ wash techniques",
  "🌿 We use eco-friendly, biodegradable cleaning products",
];

// ─── Water Drop ───
const WaterDrop = ({ delay, startX, duration = 1400, size = 4 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start(() => run());
    };
    run();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", left: startX, top: 0,
        width: size, height: size * 1.5,
        borderTopLeftRadius: size, borderTopRightRadius: size,
        borderBottomLeftRadius: size * 0.3, borderBottomRightRadius: size * 0.3,
        backgroundColor: "rgba(96,165,250,0.65)",
        opacity: anim.interpolate({ inputRange: [0, 0.08, 0.82, 1], outputRange: [0, 0.85, 0.85, 0] }),
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 240] }) },
          { rotate: "180deg" },
        ],
      }}
    />
  );
};

// ─── Foam Bubble ───
const FoamBubble = ({ x, y, size, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0); scale.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 2800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(scale, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0, duration: 500, delay: 1500, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => run());
    };
    run();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: "rgba(255,255,255,0.5)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.85)",
        opacity: anim.interpolate({ inputRange: [0, 0.06, 0.88, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { scale },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -35 - Math.random() * 20] }) },
          { translateX: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 22] }) },
        ],
      }}
    >
      <View style={{ position: "absolute", top: size * 0.15, left: size * 0.22, width: size * 0.28, height: size * 0.18, borderRadius: size * 0.14, backgroundColor: "rgba(255,255,255,0.9)" }} />
    </Animated.View>
  );
};

// ─── Sparkle Star ───
const SparkleStar = ({ x, y, size, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0); rot.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 400, delay: 400, useNativeDriver: true }),
          ]),
          Animated.timing(rot, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ]).start(() => run());
    };
    run();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", left: x, top: y,
        opacity: anim,
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
          { rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) },
        ],
      }}
    >
      <Ionicons name="sparkles" size={size} color={C.gold} />
    </Animated.View>
  );
};

// ─── Splash Particle ───
const SplashParticle = ({ x, angle, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => run());
    };
    run();
  }, []);

  const rad = (angle * Math.PI) / 180;
  const dist = 10 + Math.random() * 12;

  return (
    <Animated.View
      style={{
        position: "absolute", left: x, bottom: 0,
        width: 3, height: 3, borderRadius: 1.5,
        backgroundColor: "rgba(96,165,250,0.75)",
        opacity: anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * dist] }) },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -Math.sin(rad) * dist] }) },
        ],
      }}
    />
  );
};

// ─── Spray Stream ───
const SprayLine = ({ startX, startY, length, angle, delay, color = "rgba(96,165,250,0.35)" }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => run());
    };
    run();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", left: startX, top: startY,
        width: length, height: 1.5, backgroundColor: color, borderRadius: 1,
        opacity: anim.interpolate({ inputRange: [0, 0.12, 0.65, 1], outputRange: [0, 0.75, 0.75, 0] }),
        transform: [
          { rotate: `${angle}deg` },
          { scaleX: anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }) },
        ],
      }}
    />
  );
};

// ─── Conveyor Belt ───
const ConveyorBelt = () => {
  const scroll = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(scroll, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start();
  }, []);

  return (
    <View style={convS.belt}>
      <LinearGradient colors={["#374151", "#4B5563", "#374151"]} style={convS.surface}>
        {Array.from({ length: 14 }).map((_, i) => (
          <Animated.View key={i} style={[convS.tread, { left: `${i * 7.5}%`, transform: [{ translateX: scroll.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) }] }]} />
        ))}
      </LinearGradient>
      <View style={convS.edgeTop} />
      <View style={convS.edgeBot} />
    </View>
  );
};

const convS = StyleSheet.create({
  belt: { position: "absolute", bottom: 0, left: 0, right: 0, height: 14, overflow: "hidden" },
  surface: { flex: 1, overflow: "hidden" },
  tread: { position: "absolute", top: 3, width: 2, height: 8, backgroundColor: "rgba(156,163,175,0.3)", borderRadius: 1 },
  edgeTop: { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#6B7280" },
  edgeBot: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#6B7280" },
});

// ════════════════════════════════════════════════════════
//  REALISTIC SEDAN — SIDE VIEW (proper car shape)
// ════════════════════════════════════════════════════════
const CAR_W = 190;
const CAR_H = 90;

const RealisticCar = ({ shineOpacity, foamOpacity }) => (
  <View style={{ width: CAR_W, height: CAR_H }}>

    {/* ── Ground Shadow ── */}
    <View style={sedanS.groundShadow} />

    {/* ════ LOWER BODY (main shell) ════ */}
    <View style={sedanS.lowerBody}>
      {/* Main body panel */}
      <LinearGradient
        colors={["#1E3A8A", "#1E40AF", "#2563EB"]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={sedanS.lowerBodyGrad}
      />

      {/* Front fender curve */}
      <View style={sedanS.frontFender} />
      {/* Rear fender curve */}
      <View style={sedanS.rearFender} />

      {/* ── Headlight assembly ── */}
      <View style={sedanS.headlightOuter}>
        <LinearGradient colors={["#FBBF24", "#F59E0B", "#FDE68A"]} style={sedanS.headlightInner} />
        <View style={sedanS.headlightGlint} />
      </View>

      {/* ── Taillight assembly ── */}
      <View style={sedanS.taillightOuter}>
        <LinearGradient colors={["#DC2626", "#EF4444", "#FCA5A5"]} style={sedanS.taillightInner} />
        <View style={sedanS.taillightGlint} />
      </View>

      {/* ── Front grille ── */}
      <View style={sedanS.grille}>
        {[0, 1, 2].map(i => (
          <View key={i} style={sedanS.grilleBar} />
        ))}
      </View>

      {/* ── Door panel ── */}
      <View style={sedanS.doorPanel}>
        <View style={sedanS.doorLine} />
        <View style={sedanS.doorHandle} />
      </View>

      {/* ── Rear door panel ── */}
      <View style={sedanS.rearDoorPanel}>
        <View style={sedanS.doorLine} />
        <View style={sedanS.doorHandleRear} />
      </View>

      {/* ── Body character line (horizontal crease) ── */}
      <View style={sedanS.characterLine} />
      <View style={sedanS.characterLine2} />

      {/* ── Body shine / reflection ── */}
      <Animated.View style={[sedanS.bodyShineTop, { opacity: shineOpacity }]} />
      <Animated.View style={[sedanS.bodyShineBot, { opacity: shineOpacity }]} />

      {/* ── Wheel arch cutouts (visual) ── */}
      <View style={sedanS.wheelArchFront} />
      <View style={sedanS.wheelArchRear} />
    </View>

    {/* ════ UPPER BODY / GREENHOUSE (cabin) ════ */}
    <View style={sedanS.cabin}>
      <LinearGradient
        colors={["#1E3A8A", "#1D4ED8"]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={sedanS.cabinGrad}
      />

      {/* ── A-Pillar (windshield frame, angled) ── */}
      <View style={sedanS.aPillar} />

      {/* ── Windshield ── */}
      <View style={sedanS.windshield}>
        <LinearGradient colors={["#93C5FD", "#60A5FA", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sedanS.glassGrad} />
        <View style={sedanS.windshieldReflect1} />
        <View style={sedanS.windshieldReflect2} />
      </View>

      {/* ── Front side window ── */}
      <View style={sedanS.frontWindow}>
        <LinearGradient colors={["#93C5FD", "#60A5FA", "#3B82F6"]} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={sedanS.glassGrad} />
        <View style={sedanS.windowReflect} />
      </View>

      {/* ── B-Pillar ── */}
      <View style={sedanS.bPillar} />

      {/* ── Rear side window ── */}
      <View style={sedanS.rearWindow}>
        <LinearGradient colors={["#93C5FD", "#60A5FA", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={sedanS.glassGrad} />
        <View style={sedanS.windowReflect} />
      </View>

      {/* ── C-Pillar ── */}
      <View style={sedanS.cPillar} />

      {/* ── Rear glass (back window, smaller & angled) ── */}
      <View style={sedanS.backGlass}>
        <LinearGradient colors={["#93C5FD", "#60A5FA"]} style={sedanS.glassGrad} />
      </View>

      {/* ── Roof highlight ── */}
      <View style={sedanS.roofHighlight} />
      <View style={sedanS.roofEdge} />
    </View>

    {/* ════ SIDE SKIRT ════ */}
    <View style={sedanS.sideSkirt} />

    {/* ════ BUMPERS (3D effect) ════ */}
    <View style={sedanS.frontBumper}>
      <View style={sedanS.bumperLip} />
      <View style={sedanS.fogLight} />
    </View>
    <View style={sedanS.rearBumper}>
      <View style={sedanS.bumperLipRear} />
      <View style={sedanS.exhaust} />
    </View>

    {/* ════ SIDE MIRROR ════ */}
    <View style={sedanS.mirror}>
      <View style={sedanS.mirrorGlass} />
    </View>

    {/* ════ FRONT WHEEL ════ */}
    <View style={sedanS.wheelPosFront}>
      <View style={sedanS.tire}>
        <View style={sedanS.tireThread} />
        <View style={sedanS.rim}>
          <LinearGradient colors={["#E5E7EB", "#9CA3AF", "#6B7280"]} style={sedanS.rimGrad} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "0deg" }] }]} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "45deg" }] }]} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "90deg" }] }]} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "135deg" }] }]} />
          <View style={sedanS.hubCap}>
            <View style={sedanS.hubCenter} />
          </View>
        </View>
      </View>
    </View>

    {/* ════ REAR WHEEL ════ */}
    <View style={sedanS.wheelPosRear}>
      <View style={sedanS.tire}>
        <View style={sedanS.tireThread} />
        <View style={sedanS.rim}>
          <LinearGradient colors={["#E5E7EB", "#9CA3AF", "#6B7280"]} style={sedanS.rimGrad} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "0deg" }] }]} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "45deg" }] }]} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "90deg" }] }]} />
          <View style={[sedanS.spoke, { transform: [{ rotate: "135deg" }] }]} />
          <View style={sedanS.hubCap}>
            <View style={sedanS.hubCenter} />
          </View>
        </View>
      </View>
    </View>

    {/* ════ FOAM ON CAR ════ */}
    <Animated.View style={[sedanS.foamWrap, { opacity: foamOpacity }]}>
      {[
        { l: 15,  t: 5,  s: 11 },
        { l: 35,  t: 2,  s: 9  },
        { l: 58,  t: 0,  s: 13 },
        { l: 82,  t: 3,  s: 10 },
        { l: 105, t: 1,  s: 12 },
        { l: 128, t: 4,  s: 8  },
        { l: 148, t: 2,  s: 11 },
        { l: 25,  t: 8,  s: 7  },
        { l: 70,  t: 7,  s: 9  },
        { l: 115, t: 6,  s: 8  },
        { l: 160, t: 5,  s: 10 },
        { l: 45,  t: 10, s: 6  },
        { l: 95,  t: 9,  s: 7  },
        { l: 140, t: 8,  s: 8  },
      ].map((b, i) => (
        <View key={i} style={{
          position: "absolute", left: b.l, top: b.t,
          width: b.s, height: b.s, borderRadius: b.s / 2,
          backgroundColor: "rgba(255,255,255,0.6)",
          borderWidth: 0.5, borderColor: "rgba(255,255,255,0.9)",
        }}>
          <View style={{ position: "absolute", top: b.s * 0.15, left: b.s * 0.2, width: b.s * 0.25, height: b.s * 0.15, borderRadius: b.s * 0.1, backgroundColor: "rgba(255,255,255,0.9)" }} />
        </View>
      ))}
    </Animated.View>
  </View>
);

const sedanS = StyleSheet.create({
  groundShadow: {
    position: "absolute", bottom: -3, left: 18, right: 18,
    height: 10, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 50,
  },

  // ── Lower body ──
  lowerBody: {
    position: "absolute", bottom: 16, left: 2, right: 2,
    height: 32, borderRadius: 4,
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
    borderBottomLeftRadius: 7, borderBottomRightRadius: 7,
    overflow: "hidden",
  },
  lowerBodyGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 4 },

  frontFender: {
    position: "absolute", right: -1, top: 0, bottom: 0, width: 12,
    backgroundColor: "rgba(30,64,175,0.8)",
    borderTopRightRadius: 12, borderBottomRightRadius: 10,
  },
  rearFender: {
    position: "absolute", left: -1, top: 0, bottom: 0, width: 12,
    backgroundColor: "rgba(30,64,175,0.8)",
    borderTopLeftRadius: 8, borderBottomLeftRadius: 10,
  },

  // Headlight
  headlightOuter: {
    position: "absolute", right: 3, top: 4, width: 14, height: 10,
    borderRadius: 4, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  headlightInner: { flex: 1 },
  headlightGlint: {
    position: "absolute", top: 1, left: 2, width: 4, height: 3,
    backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 2,
  },

  // Taillight
  taillightOuter: {
    position: "absolute", left: 3, top: 4, width: 10, height: 12,
    borderRadius: 3, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  taillightInner: { flex: 1 },
  taillightGlint: {
    position: "absolute", top: 2, left: 1, width: 3, height: 2,
    backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 1,
  },

  // Grille
  grille: {
    position: "absolute", right: 14, top: 6, width: 8, height: 12,
    justifyContent: "space-between", paddingVertical: 1,
  },
  grilleBar: {
    height: 2, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 1,
  },

  // Door panels
  doorPanel: {
    position: "absolute", right: 50, top: 2, width: 48, height: 28,
    borderRightWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  rearDoorPanel: {
    position: "absolute", right: 98, top: 2, width: 42, height: 28,
    borderRightWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  doorLine: {
    position: "absolute", right: 0, top: 0, bottom: 0, width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  doorHandle: {
    position: "absolute", right: 6, top: 10, width: 10, height: 3,
    backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 1.5,
  },
  doorHandleRear: {
    position: "absolute", right: 6, top: 10, width: 10, height: 3,
    backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 1.5,
  },

  // Character lines
  characterLine: {
    position: "absolute", left: 16, right: 16, top: 12,
    height: 1, backgroundColor: "rgba(255,255,255,0.12)",
  },
  characterLine2: {
    position: "absolute", left: 20, right: 14, bottom: 6,
    height: 1, backgroundColor: "rgba(0,0,0,0.15)",
  },

  // Body shine
  bodyShineTop: {
    position: "absolute", left: 22, right: 20, top: 5,
    height: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2,
  },
  bodyShineBot: {
    position: "absolute", left: 18, right: 22, top: 20,
    height: 2, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 1,
  },

  // Wheel arches
  wheelArchFront: {
    position: "absolute", right: 28, bottom: -2, width: 36, height: 18,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  wheelArchRear: {
    position: "absolute", left: 22, bottom: -2, width: 36, height: 18,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  // ── Cabin / Greenhouse ──
  cabin: {
    position: "absolute", bottom: 44, left: 30, right: 22,
    height: 30, overflow: "visible",
  },
  cabinGrad: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 4, borderTopRightRadius: 14,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },

  aPillar: {
    position: "absolute", right: 0, top: -2, width: 4, height: 34,
    backgroundColor: "#1E3A8A",
    transform: [{ rotate: "-12deg" }],
    borderRadius: 2, zIndex: 5,
  },

  windshield: {
    position: "absolute", right: -2, top: 2, width: 26, height: 26,
    borderTopRightRadius: 12, borderBottomRightRadius: 3,
    overflow: "hidden",
    transform: [{ skewX: "-14deg" }],
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  windshieldReflect1: {
    position: "absolute", top: 3, left: 4, width: 5, height: 16,
    backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3,
    transform: [{ rotate: "-8deg" }],
  },
  windshieldReflect2: {
    position: "absolute", top: 4, left: 11, width: 3, height: 10,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2,
    transform: [{ rotate: "-8deg" }],
  },

  frontWindow: {
    position: "absolute", right: 22, top: 3, width: 40, height: 23,
    borderRadius: 3, borderTopRightRadius: 8,
    overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },

  bPillar: {
    position: "absolute", right: 62, top: 0, width: 4, height: 30,
    backgroundColor: "#1E3A8A", zIndex: 5,
  },

  rearWindow: {
    position: "absolute", left: 10, top: 3, width: 34, height: 23,
    borderRadius: 3, borderTopLeftRadius: 4,
    overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },

  cPillar: {
    position: "absolute", left: 4, top: 0, width: 8, height: 30,
    backgroundColor: "#1E3A8A", zIndex: 5,
    borderTopLeftRadius: 4,
  },

  backGlass: {
    position: "absolute", left: -2, top: 4, width: 14, height: 20,
    borderRadius: 3,
    overflow: "hidden",
    transform: [{ skewX: "10deg" }],
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },

  glassGrad: { ...StyleSheet.absoluteFillObject },

  windowReflect: {
    position: "absolute", top: 2, left: 3, width: 4, height: 12,
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 2,
  },

  roofHighlight: {
    position: "absolute", top: -2, left: 20, right: 20,
    height: 2, backgroundColor: "rgba(147,197,253,0.4)", borderRadius: 1,
  },
  roofEdge: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 1, backgroundColor: "rgba(0,0,0,0.15)",
  },

  // ── Side skirt ──
  sideSkirt: {
    position: "absolute", bottom: 14, left: 20, right: 20,
    height: 3, backgroundColor: "#111827", borderRadius: 1.5,
  },

  // ── Bumpers ──
  frontBumper: {
    position: "absolute", right: 0, bottom: 16,
    width: 8, height: 28,
    backgroundColor: "#1E3A8A",
    borderTopRightRadius: 14, borderBottomRightRadius: 10,
  },
  bumperLip: {
    position: "absolute", bottom: 2, left: 0, right: 0,
    height: 3, backgroundColor: "#111827", borderRadius: 1,
  },
  fogLight: {
    position: "absolute", top: 16, left: 1, width: 5, height: 4,
    backgroundColor: "rgba(253,224,71,0.5)", borderRadius: 2,
  },
  rearBumper: {
    position: "absolute", left: 0, bottom: 16,
    width: 6, height: 28,
    backgroundColor: "#1E3A8A",
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
  },
  bumperLipRear: {
    position: "absolute", bottom: 2, left: 0, right: 0,
    height: 3, backgroundColor: "#111827", borderRadius: 1,
  },
  exhaust: {
    position: "absolute", bottom: 4, right: 0, width: 6, height: 4,
    backgroundColor: "#374151", borderRadius: 2,
    borderWidth: 0.5, borderColor: "#6B7280",
  },

  // ── Mirror ──
  mirror: {
    position: "absolute", right: 18, bottom: 52,
    width: 10, height: 7, backgroundColor: "#1E3A8A",
    borderRadius: 3, borderTopRightRadius: 5,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)",
  },
  mirrorGlass: {
    position: "absolute", top: 1, right: 1, width: 5, height: 4,
    backgroundColor: "rgba(147,197,253,0.5)", borderRadius: 2,
  },

  // ── Wheels ──
  wheelPosFront: { position: "absolute", bottom: 0, right: 28 },
  wheelPosRear: { position: "absolute", bottom: 0, left: 24 },
  tire: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#1F2937",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#111827",
  },
  tireThread: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: "rgba(55,65,81,0.6)",
  },
  rim: {
    width: 20, height: 20, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
  },
  rimGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 10 },
  spoke: {
    position: "absolute", width: 1.5, height: 20,
    backgroundColor: "rgba(75,85,99,0.5)", left: 9.25,
  },
  hubCap: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#9CA3AF",
    justifyContent: "center", alignItems: "center",
    borderWidth: 0.5, borderColor: "#6B7280", zIndex: 3,
  },
  hubCenter: {
    width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#4B5563",
  },

  // ── Foam ──
  foamWrap: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
  },
});


// ════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════
export default function WashInProgressScreen({ route, navigation }) {
  const { orderId, technician } = route.params;

  const [currentStage, setCurrentStage] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [prePhotos, setPrePhotos] = useState([]);
  const [factIndex, setFactIndex] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const factFadeAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0.8)).current;

  const carBobAnim = useRef(new Animated.Value(0)).current;
  const sprayAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const foamAnim = useRef(new Animated.Value(0)).current;
  const waterFlowAnim = useRef(new Animated.Value(0)).current;

  // Entrance
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start(); }, []);

  // Pulse
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);

  // Shimmer
  useEffect(() => { Animated.loop(Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true })).start(); }, []);

  // Ring
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 1.3, duration: 1200, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  // Car bob
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(carBobAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(carBobAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  // Spray
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sprayAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(sprayAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  // Glow
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
    ])).start();
  }, []);

  // Foam
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(foamAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
      Animated.timing(foamAnim, { toValue: 0.2, duration: 2500, useNativeDriver: true }),
    ])).start();
  }, []);

  // Water flow
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(waterFlowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(waterFlowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Stage progression
  useEffect(() => {
    const t = setInterval(() => setCurrentStage(p => (p < WASH_STAGES.length ? p + 1 : p)), 10000);
    return () => clearInterval(t);
  }, []);

  // Fun facts
  useEffect(() => {
    const t = setInterval(() => {
      Animated.timing(factFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setFactIndex(p => (p + 1) % FUN_FACTS.length);
        Animated.timing(factFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Progress bar
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: currentStage / WASH_STAGES.length, duration: 600, useNativeDriver: false }).start();
  }, [currentStage]);

  // Poll
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();
        if (data.status === "completed") { clearInterval(t); navigation.replace("WashCompletedScreen", { orderId, order: data }); }
        if (data.pre_photos) {
          const arr = typeof data.pre_photos === "string" ? JSON.parse(data.pre_photos) : data.pre_photos;
          if (Array.isArray(arr) && arr.length > 0) setPrePhotos(onlyHttp(arr));
        }
      } catch (e) { console.log("Polling error:", e); }
    }, 5000);
    return () => clearInterval(t);
  }, [orderId]);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const progressPercent = Math.round((currentStage / WASH_STAGES.length) * 100);
  const currentStageName = WASH_STAGES[currentStage - 1]?.name || "Finishing...";
  const currentTip = WASH_STAGES[currentStage - 1]?.tip || "";
  const currentColor = WASH_STAGES[currentStage - 1]?.color || C.violet;
  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 300] });

  return (
    <ScreenWrapper backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.white}>

      {/* ─── HEADER ─── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <LinearGradient colors={GRAD.primary} style={s.headerIconWrap}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="water" size={16} color={C.white} />
            </Animated.View>
          </LinearGradient>
          <View>
            <Text style={s.headerTitle}>Wash In Progress</Text>
            <Text style={s.headerTimer}>{formatTime(elapsedTime)} elapsed</Text>
          </View>
        </View>
        <View style={s.liveBadge}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>LIVE</Text>
        </View>
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HERO CARD ── */}
        <View style={s.heroCard}>
          <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGradient}>
            <View style={s.heroDecor1} />
            <View style={s.heroDecor2} />
            <View style={s.heroIconArea}>
              <Animated.View style={[s.heroRing, { transform: [{ scale: ringAnim }] }]} />
              <LinearGradient colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]} style={s.heroIconBg}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name={WASH_STAGES[currentStage - 1]?.icon || "water"} size={36} color={C.white} />
                </Animated.View>
              </LinearGradient>
            </View>
            <Text style={s.heroStageLabel}>NOW WASHING</Text>
            <Text style={s.heroStageName}>{currentStageName}</Text>
            <View style={s.heroStatsRow}>
              <View style={s.heroStat}><Text style={s.heroStatValue}>{formatTime(elapsedTime)}</Text><Text style={s.heroStatLabel}>Elapsed</Text></View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}><Text style={s.heroStatValue}>{progressPercent}%</Text><Text style={s.heroStatLabel}>Complete</Text></View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}><Text style={s.heroStatValue}>{currentStage}/{WASH_STAGES.length}</Text><Text style={s.heroStatLabel}>Stage</Text></View>
            </View>
          </LinearGradient>
          <View style={s.progressBarContainer}>
            <View style={s.progressBarBg}>
              <Animated.View style={[s.progressBarFill, { width: progressWidth }]}>
                <LinearGradient colors={GRAD.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                <Animated.View style={[s.shimmer, { transform: [{ translateX: shimmerX }] }]} />
              </Animated.View>
            </View>
            <Text style={s.progressBarLabel}>{progressPercent}% complete</Text>
          </View>
        </View>

        {/* ══ WASH ANIMATION SCENE ══ */}
        <View style={s.washSceneCard}>
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.washSceneHeader}>
            <View style={s.washSceneHeaderIcon}><Ionicons name="play-circle" size={14} color={C.violet} /></View>
            <Text style={s.washSceneTitle}>Live Wash View</Text>
            <Animated.View style={[s.washSceneLive, { opacity: glowAnim }]}>
              <View style={s.washSceneLiveDot} />
              <Text style={s.washSceneLiveText}>LIVE</Text>
            </Animated.View>
          </LinearGradient>

          <View style={s.scene}>
            {/* Background */}
            <LinearGradient colors={["#E0E7FF", "#DBEAFE", "#EFF6FF"]} style={s.sceneBg} />

            {/* Back wall tiles */}
            <View style={s.backWall}>
              <LinearGradient colors={["#C7D2FE", "#DDD6FE", "#E0E7FF"]} style={s.backWallGrad} />
              {[0,1,2,3].map(i => <View key={`h${i}`} style={[s.tileLine, { top: 14 + i * 18 }]} />)}
              {Array.from({ length: 9 }).map((_, i) => <View key={`v${i}`} style={[s.tileLineV, { left: 8 + i * (SCENE_WIDTH / 9) }]} />)}
            </View>

            {/* ── Nozzle pipes ── */}
            {/* Left pipe */}
            <View style={s.pipeLeft}>
              <LinearGradient colors={["#9CA3AF", "#6B7280", "#4B5563"]} style={s.pipeFill} />
            </View>
            <View style={s.nozzleLeft}>
              <LinearGradient colors={["#6B7280", "#4B5563"]} style={s.nozzleFill} />
            </View>
            {/* Right pipe */}
            <View style={s.pipeRight}>
              <LinearGradient colors={["#9CA3AF", "#6B7280", "#4B5563"]} style={s.pipeFill} />
            </View>
            <View style={s.nozzleRight}>
              <LinearGradient colors={["#6B7280", "#4B5563"]} style={s.nozzleFill} />
            </View>

            {/* ── Spray lines from nozzles ── */}
            {[0,1,2,3,4,5].map(i => (
              <SprayLine key={`ls${i}`} startX={30} startY={74 + i * 7} length={SCENE_WIDTH * 0.28} angle={8 + i * 4} delay={i * 100} />
            ))}
            {[0,1,2,3,4,5].map(i => (
              <SprayLine key={`rs${i}`} startX={SCENE_WIDTH - 30 - SCENE_WIDTH * 0.28} startY={74 + i * 7} length={SCENE_WIDTH * 0.28} angle={-(8 + i * 4)} delay={i * 100 + 50} />
            ))}

            {/* ── Water drops ── */}
            {[
              { x: SCENE_WIDTH * 0.22, d: 0, sz: 3 },
              { x: SCENE_WIDTH * 0.3, d: 180, sz: 4 },
              { x: SCENE_WIDTH * 0.38, d: 350, sz: 3 },
              { x: SCENE_WIDTH * 0.46, d: 80, sz: 5 },
              { x: SCENE_WIDTH * 0.54, d: 250, sz: 3 },
              { x: SCENE_WIDTH * 0.62, d: 420, sz: 4 },
              { x: SCENE_WIDTH * 0.7, d: 120, sz: 3 },
              { x: SCENE_WIDTH * 0.78, d: 550, sz: 4 },
              { x: SCENE_WIDTH * 0.34, d: 600, sz: 3 },
              { x: SCENE_WIDTH * 0.58, d: 700, sz: 3 },
              { x: SCENE_WIDTH * 0.42, d: 150, sz: 4 },
              { x: SCENE_WIDTH * 0.66, d: 300, sz: 3 },
            ].map((d, i) => <WaterDrop key={`wd${i}`} startX={d.x} delay={d.d} size={d.sz} duration={1300} />)}

            {/* ── Foam bubbles ── */}
            {[
              { x: SCENE_WIDTH * 0.22, y: 105, s: 11, d: 0 },
              { x: SCENE_WIDTH * 0.32, y: 115, s: 8,  d: 300 },
              { x: SCENE_WIDTH * 0.48, y: 98,  s: 13, d: 600 },
              { x: SCENE_WIDTH * 0.58, y: 108, s: 9,  d: 200 },
              { x: SCENE_WIDTH * 0.68, y: 118, s: 12, d: 500 },
              { x: SCENE_WIDTH * 0.28, y: 125, s: 7,  d: 800 },
              { x: SCENE_WIDTH * 0.52, y: 92,  s: 8,  d: 400 },
              { x: SCENE_WIDTH * 0.42, y: 122, s: 10, d: 700 },
              { x: SCENE_WIDTH * 0.36, y: 88,  s: 6,  d: 150 },
              { x: SCENE_WIDTH * 0.62, y: 90,  s: 7,  d: 450 },
              { x: SCENE_WIDTH * 0.75, y: 102, s: 9,  d: 250 },
            ].map((b, i) => <FoamBubble key={`fb${i}`} x={b.x} y={b.y} size={b.s} delay={b.d} />)}

            {/* ══ THE CAR ══ */}
            <Animated.View style={[s.carPosition, {
              transform: [{ translateY: carBobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
            }]}>
              <RealisticCar shineOpacity={glowAnim} foamOpacity={foamAnim} />
            </Animated.View>

            {/* ── Splash particles ── */}
            <View style={s.splashArea}>
              {[
                { x: SCENE_WIDTH * 0.28, a: 100, d: 0 },
                { x: SCENE_WIDTH * 0.34, a: 120, d: 150 },
                { x: SCENE_WIDTH * 0.4,  a: 90,  d: 300 },
                { x: SCENE_WIDTH * 0.48, a: 80,  d: 100 },
                { x: SCENE_WIDTH * 0.54, a: 110, d: 250 },
                { x: SCENE_WIDTH * 0.6,  a: 70,  d: 400 },
                { x: SCENE_WIDTH * 0.66, a: 100, d: 50 },
                { x: SCENE_WIDTH * 0.72, a: 85,  d: 350 },
              ].map((sp, i) => <SplashParticle key={`sp${i}`} x={sp.x} angle={sp.a} delay={sp.d} />)}
            </View>

            {/* ── Sparkles ── */}
            <SparkleStar x={SCENE_WIDTH * 0.22} y={72} size={16} delay={0} />
            <SparkleStar x={SCENE_WIDTH * 0.68} y={68} size={14} delay={600} />
            <SparkleStar x={SCENE_WIDTH * 0.44} y={62} size={12} delay={1200} />
            <SparkleStar x={SCENE_WIDTH * 0.56} y={78} size={11} delay={400} />
            <SparkleStar x={SCENE_WIDTH * 0.34} y={85} size={10} delay={900} />
            <SparkleStar x={SCENE_WIDTH * 0.76} y={82} size={13} delay={300} />

            {/* ── Floor water puddle ── */}
            <View style={s.floorWater}>
              <Animated.View style={[s.floorWaterShine, { opacity: waterFlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }) }]} />
            </View>

            {/* ── Conveyor belt ── */}
            <ConveyorBelt />

            {/* ── Bay frame ── */}
            <View style={s.bayFrameL} />
            <View style={s.bayFrameR} />
            <View style={s.bayFrameT} />

            {/* ── Stage chip ── */}
            <View style={s.sceneStageChip}>
              <View style={[s.sceneStageIconWrap, { backgroundColor: currentColor }]}>
                <Ionicons name={WASH_STAGES[currentStage - 1]?.icon || "water"} size={10} color={C.white} />
              </View>
              <Text style={s.sceneStageText}>{currentStageName}</Text>
            </View>
          </View>

          {/* Tip */}
          <View style={s.sceneTip}>
            <Ionicons name="information-circle-outline" size={14} color={C.violet} />
            <Text style={s.sceneTipText}>{currentTip}</Text>
          </View>
        </View>

        {/* ── FUN FACT ── */}
        <Animated.View style={[s.factCard, { opacity: factFadeAnim }]}>
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={s.factIconWrap}><Ionicons name="bulb" size={16} color={C.violet} /></View>
          <Text style={s.factText}>{FUN_FACTS[factIndex]}</Text>
        </Animated.View>

        {/* ── PRE-WASH PHOTOS ── */}
        {prePhotos.length > 0 && (
          <View style={s.photosCard}>
            <View style={s.photosHeader}>
              <View style={s.photosHeaderIcon}><Ionicons name="camera" size={14} color={C.violet} /></View>
              <Text style={s.photosTitle}>Pre-Wash Photos</Text>
              <View style={s.photosCount}><Text style={s.photosCountText}>{prePhotos.length}</Text></View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photosScroll}>
              {prePhotos.map((photo, idx) => <Image key={idx} source={{ uri: photo }} style={s.photoThumb} />)}
            </ScrollView>
          </View>
        )}

        {/* ── TECHNICIAN ── */}
        <View style={s.techCard}>
          <LinearGradient colors={GRAD.primary} style={s.techAvatar}>
            <Text style={s.techAvatarText}>{technician?.full_name?.charAt(0)?.toUpperCase() || "T"}</Text>
          </LinearGradient>
          <View style={s.techInfo}>
            <Text style={s.techName}>{technician?.full_name || "Your Technician"}</Text>
            <View style={s.techStatusRow}>
              <View style={s.techStatusDot} />
              <Text style={s.techStatus}>Working on your vehicle</Text>
            </View>
          </View>
          <View style={s.techBadge}>
            <Ionicons name="water" size={12} color={C.violet} />
            <Text style={s.techBadgeText}>Active</Text>
          </View>
        </View>

        {/* ── BOTTOM TIP ── */}
        <View style={s.bottomTip}>
          <LinearGradient colors={[C.primarySoft, C.lavenderBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Ionicons name="notifications-outline" size={18} color={C.violet} style={{ marginRight: SP.sm }} />
          <Text style={s.bottomTipText}>You'll get notified with before & after photos when done!</Text>
        </View>

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

// ==================== STYLES ====================
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SP.md, paddingBottom: SP.md, paddingHorizontal: SP.lg, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: SP.md },
  headerIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  headerTitle: { fontSize: 15, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  headerTimer: { fontSize: 12, fontWeight: "700", color: C.violet, marginTop: 1 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.textDark, paddingHorizontal: SP.md, paddingVertical: 5, borderRadius: R.full },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  liveText: { fontSize: 11, fontWeight: "700", color: C.white },

  scrollContent: { paddingHorizontal: SP.lg, paddingTop: SP.lg, paddingBottom: SP.xxxl },

  heroCard: { borderRadius: R.lg, marginBottom: SP.md, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroGradient: { padding: SP.xl, overflow: "hidden", position: "relative" },
  heroDecor1: { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)" },
  heroDecor2: { position: "absolute", bottom: -30, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.04)" },
  heroIconArea: { alignItems: "center", marginBottom: SP.md, position: "relative" },
  heroRing: { position: "absolute", width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },
  heroIconBg: { width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" },
  heroStageLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 2, textAlign: "center", marginBottom: 4 },
  heroStageName: { fontSize: 20, fontWeight: "900", color: C.white, letterSpacing: -0.5, textAlign: "center", marginBottom: SP.lg },
  heroStatsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: R.md, padding: SP.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { fontSize: 18, fontWeight: "900", color: C.white, letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  heroStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  progressBarContainer: { backgroundColor: C.white, paddingHorizontal: SP.lg, paddingVertical: SP.md },
  progressBarBg: { height: 8, backgroundColor: C.primarySoft, borderRadius: R.full, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: R.full, overflow: "hidden", position: "relative" },
  shimmer: { position: "absolute", top: 0, bottom: 0, width: 80, backgroundColor: "rgba(255,255,255,0.4)", transform: [{ skewX: "-20deg" }] },
  progressBarLabel: { fontSize: 11, fontWeight: "700", color: C.violet, textAlign: "right", marginTop: 4 },

  washSceneCard: { backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  washSceneHeader: { flexDirection: "row", alignItems: "center", gap: SP.sm, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  washSceneHeaderIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center" },
  washSceneTitle: { flex: 1, fontSize: 13, fontWeight: "800", color: C.violet },
  washSceneLive: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#DCFCE7", paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  washSceneLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.success },
  washSceneLiveText: { fontSize: 8, fontWeight: "800", color: C.successDark, letterSpacing: 0.5 },

  scene: { height: 250, position: "relative", overflow: "hidden" },
  sceneBg: { ...StyleSheet.absoluteFillObject },

  backWall: { position: "absolute", top: 0, left: 0, right: 0, height: 85, overflow: "hidden" },
  backWallGrad: { flex: 1 },
  tileLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(165,180,252,0.3)" },
  tileLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(165,180,252,0.2)" },

  // Nozzle pipes
  pipeLeft: { position: "absolute", left: 10, top: 15, width: 6, height: 55, borderRadius: 3, overflow: "hidden" },
  pipeRight: { position: "absolute", right: 10, top: 15, width: 6, height: 55, borderRadius: 3, overflow: "hidden" },
  pipeFill: { flex: 1 },
  nozzleLeft: { position: "absolute", left: 7, top: 68, width: 14, height: 9, borderRadius: 4, overflow: "hidden" },
  nozzleRight: { position: "absolute", right: 7, top: 68, width: 14, height: 9, borderRadius: 4, overflow: "hidden" },
  nozzleFill: { flex: 1 },

  carPosition: { position: "absolute", bottom: 18, left: "50%", marginLeft: -CAR_W / 2 },

  splashArea: { position: "absolute", bottom: 14, left: 0, right: 0, height: 22 },

  floorWater: { position: "absolute", bottom: 14, left: "18%", right: "18%", height: 8, backgroundColor: "rgba(96,165,250,0.06)", borderRadius: 4, overflow: "hidden" },
  floorWaterShine: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(96,165,250,0.12)", borderRadius: 4 },

  bayFrameL: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: "rgba(107,114,128,0.25)" },
  bayFrameR: { position: "absolute", right: 0, top: 0, bottom: 0, width: 4, backgroundColor: "rgba(107,114,128,0.25)" },
  bayFrameT: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "rgba(107,114,128,0.18)" },

  sceneStageChip: { position: "absolute", bottom: 18, left: SP.sm, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: SP.sm, paddingVertical: 4, borderRadius: R.full, borderWidth: 1, borderColor: C.border, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  sceneStageIconWrap: { width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  sceneStageText: { fontSize: 10, fontWeight: "700", color: C.textDark },

  sceneTip: { flexDirection: "row", alignItems: "center", gap: SP.sm, padding: SP.md, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  sceneTipText: { flex: 1, fontSize: 12, color: C.textMid, fontWeight: "500" },

  factCard: { flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.md, marginBottom: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.violet + "20", gap: SP.sm },
  factIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  factText: { flex: 1, fontSize: 12, color: C.violet, fontWeight: "600", lineHeight: 17 },

  photosCard: { backgroundColor: C.white, borderRadius: R.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, overflow: "hidden", shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  photosHeader: { flexDirection: "row", alignItems: "center", gap: SP.sm, padding: SP.lg, borderBottomWidth: 1, borderBottomColor: C.border },
  photosHeaderIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primarySoft, justifyContent: "center", alignItems: "center" },
  photosTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: C.textDark },
  photosCount: { backgroundColor: C.violet, width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  photosCountText: { fontSize: 10, fontWeight: "800", color: C.white },
  photosScroll: { paddingHorizontal: SP.lg, paddingVertical: SP.md, gap: SP.sm },
  photoThumb: { width: 110, height: 110, borderRadius: R.md, marginRight: SP.sm },

  techCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, shadowColor: C.violet, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  techAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: SP.md, shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  techAvatarText: { fontSize: 18, fontWeight: "800", color: C.white },
  techInfo: { flex: 1 },
  techName: { fontSize: 14, fontWeight: "800", color: C.textDark },
  techStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  techStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  techStatus: { fontSize: 12, color: C.successDark, fontWeight: "600" },
  techBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.primarySoft, paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.full },
  techBadgeText: { fontSize: 11, fontWeight: "700", color: C.violet },

  bottomTip: { flexDirection: "row", alignItems: "center", borderRadius: R.lg, padding: SP.md, overflow: "hidden", borderWidth: 1, borderColor: C.violet + "20" },
  bottomTipText: { flex: 1, fontSize: 12, color: C.violet, fontWeight: "600", lineHeight: 17 },
});