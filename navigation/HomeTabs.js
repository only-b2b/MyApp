// navigation/HomeTabs.js
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";

import ServiceSelectScreen from "../screens/home/ServiceSelectScreen";
import DashboardScreen from "../screens/home/DashboardScreen";
import PickDropScreen from "../screens/home/PickDropScreen";
import DriverScreen from "../screens/home/DriverScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ActiveRideHandler from "../components/ActiveRideHandler";

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: "#000000",
  primarySoft: "rgba(0,0,0,0.06)",
  white: "#FFFFFF",
  offWhite: "#F8F9FA",
  border: "#F0F0F0",
  textActive: "#000000",
  textInactive: "#ABABAB",
  accent: "#00C853",
  accentSoft: "rgba(0,200,83,0.12)",
};

const TAB_DATA = [
  {
    name: "Home",
    label: "Home",
    icon: "home",
    iconOutline: "home-outline",
  },
  {
    name: "CarWash",
    label: "Wash",
    icon: "water",
    iconOutline: "water-outline",
  },
  {
    name: "PickDrop",
    label: "Ride",
    icon: "navigate",
    iconOutline: "navigate-outline",
    isCenter: true,
  },
  {
    name: "Driver",
    label: "Driver",
    icon: "car-sport",
    iconOutline: "car-sport-outline",
  },
  {
    name: "Profile",
    label: "Profile",
    icon: "person-circle",
    iconOutline: "person-circle-outline",
  },
];

const triggerHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
};

// ==================== ANIMATED TAB ITEM ====================
const TabItem = ({ tab, isFocused, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.08 : 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      style={styles.tabTouchable}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Active pill background */}
        <Animated.View
          style={[styles.tabPill, { opacity: opacityAnim }]}
        />

        <Ionicons
          name={isFocused ? tab.icon : tab.iconOutline}
          size={22}
          color={isFocused ? COLORS.primary : COLORS.textInactive}
        />
        <Text
          style={[
            styles.tabLabel,
            isFocused && styles.tabLabelActive,
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ==================== ANIMATED CENTER TAB ====================
const CenterTabItem = ({ tab, isFocused, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.12,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "15deg"],
  });

  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      style={styles.centerTabTouchable}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      activeOpacity={0.85}
    >
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.centerGlowRing,
          {
            opacity: glowAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />

      {/* Main button */}
      <Animated.View
        style={[
          styles.centerTabButton,
          isFocused && styles.centerTabButtonActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons
            name={isFocused ? tab.icon : tab.iconOutline}
            size={26}
            color={COLORS.white}
          />
        </Animated.View>
      </Animated.View>

      <Text
        style={[
          styles.centerTabLabel,
          isFocused && styles.centerTabLabelActive,
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

// ==================== CUSTOM TAB BAR ====================
function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: bottomPadding }]}>
      {/* Top border accent line */}
      <View style={styles.topAccentLine} />

      <View style={styles.tabBarContainer}>
        <View style={styles.tabItemsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const tabConfig = TAB_DATA.find((t) => t.name === route.name);

            if (!tabConfig) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (tabConfig.isCenter) {
              return (
                <CenterTabItem
                  key={route.key}
                  tab={tabConfig}
                  isFocused={isFocused}
                  onPress={onPress}
                />
              );
            }

            return (
              <TabItem
                key={route.key}
                tab={tabConfig}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ==================== MAIN NAVIGATOR ====================
export default function HomeTabs() {
  return (
    <>
      <ActiveRideHandler />
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false, lazy: true }}
        initialRouteName="Home"
      >
        <Tab.Screen name="Home" component={ServiceSelectScreen} />
        <Tab.Screen name="CarWash" component={DashboardScreen} />
        <Tab.Screen
          name="PickDrop"
          component={PickDropScreen}
          options={{ unmountOnBlur: false }}
        />
        <Tab.Screen name="Driver" component={DriverScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  // ── Wrapper ──────────────────────────────────────────────
  tabBarWrapper: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  topAccentLine: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  tabBarContainer: {
    backgroundColor: COLORS.white,
    paddingTop: 6,
  },

  tabItemsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },

  // ── Regular Tab ──────────────────────────────────────────
  tabTouchable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
  },

  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    position: "relative",
  },

  tabPill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 18,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.textInactive,
    marginTop: 3,
    letterSpacing: 0.2,
  },

  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  // ── Center Tab ───────────────────────────────────────────
  centerTabTouchable: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: -22,
    paddingHorizontal: 8,
    minWidth: 72,
  },

  // centerGlowRing: {
  //   position: "absolute",
  //   top: -1,
  //   width: 62,
  //   height: 62,
  //   borderRadius: 36,
  //   borderWidth: 2,
  //   borderColor: COLORS.primary,
  //   opacity: 0.15,
  // },

  centerTabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ABABAB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  centerTabButtonActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: {
        elevation: 14,
      },
    }),
  },

  centerTabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.textInactive,
    marginTop: 5,
    letterSpacing: 0.2,
  },

  centerTabLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});