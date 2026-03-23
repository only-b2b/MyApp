// navigation/HomeTabs.js
import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolate,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

// Screens
import ServiceSelectScreen from "../screens/ServiceSelectScreen";
import DashboardScreen from "../screens/DashboardScreen";
import PickDropScreen from "../screens/PickDropScreen";
import DriverScreen from "../screens/DriverScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ActiveRideHandler from "../components/ActiveRideHandler";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

// ==================== DESIGN TOKENS ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  primaryMedium: "rgba(0, 168, 107, 0.15)",
  primaryDark: "#008F5B",
  white: "#FFFFFF",
  background: "#FAFBFC",
  surface: "#F5F6F8",
  border: "#EAECEF",
  textActive: "#00A86B",
  textInactive: "#8E99A4",
  textDark: "#1A1D21",
  shadow: "rgba(0, 0, 0, 0.08)",
  shadowDark: "rgba(0, 0, 0, 0.12)",
};

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

const TIMING_CONFIG = {
  duration: 250,
};

// ==================== TAB DATA ====================
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
    icon: "car-sport",
    iconOutline: "car-sport-outline",
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
    icon: "person",
    iconOutline: "person-outline",
  },
  {
    name: "Profile",
    label: "Profile",
    icon: "apps",
    iconOutline: "apps-outline",
  },
];

// ==================== HAPTIC FEEDBACK ====================
const triggerHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // Haptics not available
  }
};

// ==================== TAB ITEM COMPONENT ====================
const TabItem = React.memo(({ tab, isFocused, onPress }) => {
  // Animation Values
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const labelOpacity = useSharedValue(1);
  const bgScale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  // Update animations on focus change
  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1, SPRING_CONFIG);
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withSpring(1.1, SPRING_CONFIG)
      );
      bgScale.value = withSpring(1, SPRING_CONFIG);
      translateY.value = withSpring(-2, SPRING_CONFIG);
      indicatorWidth.value = withSpring(20, SPRING_CONFIG);
      labelOpacity.value = withTiming(1, TIMING_CONFIG);
    } else {
      scale.value = withSpring(0.95, SPRING_CONFIG);
      iconScale.value = withSpring(1, SPRING_CONFIG);
      bgScale.value = withSpring(0, SPRING_CONFIG);
      translateY.value = withSpring(0, SPRING_CONFIG);
      indicatorWidth.value = withSpring(0, SPRING_CONFIG);
      labelOpacity.value = withTiming(0.7, TIMING_CONFIG);
    }
  }, [isFocused]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 20, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(isFocused ? 1 : 0.95, SPRING_CONFIG);
  }, [isFocused]);

  const handlePress = useCallback(() => {
    triggerHaptic();
    onPress();
  }, [onPress]);

  // ✅ FIXED: Wrap transform animations
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }],
    opacity: interpolate(bgScale.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    opacity: interpolate(indicatorWidth.value, [0, 20], [0, 1], Extrapolate.CLAMP),
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabTouchable}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      {/* ✅ WRAPPER VIEW - Prevents warning */}
      <View style={styles.tabWrapper}>
        <Animated.View style={[styles.tabContainer, containerStyle]}>
          {/* Background Pill */}
          <Animated.View style={[styles.tabBackground, bgStyle]} />

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Animated.View style={iconContainerStyle}>
              <Ionicons
                name={isFocused ? tab.icon : tab.iconOutline}
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textInactive}
              />
            </Animated.View>
          </View>

          {/* Label */}
          <Animated.Text
            style={[
              styles.tabLabel,
              isFocused && styles.tabLabelActive,
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Animated.Text>

          {/* Active Indicator */}
          <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
});

// ==================== CENTER TAB (RIDE BUTTON) ====================
const CenterTabItem = React.memo(({ tab, isFocused, onPress }) => {
  const scale = useSharedValue(1);
  const innerScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      innerScale.value = withSpring(1.05, SPRING_CONFIG);
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      innerScale.value = withSpring(1, SPRING_CONFIG);
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isFocused]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
    rotation.value = withSpring(-5, SPRING_CONFIG);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
    rotation.value = withSpring(0, SPRING_CONFIG);
  }, []);

  const handlePress = useCallback(() => {
    triggerHaptic();
    onPress();
  }, [onPress]);

  // ✅ FIXED: Wrap transform animations
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.centerTabTouchable}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      {/* ✅ WRAPPER VIEW */}
      <View style={styles.centerTabWrapper}>
        <Animated.View style={containerStyle}>
          {/* Glow Effect */}
          <Animated.View style={[styles.centerTabGlow, glowStyle]} />

          {/* Main Button */}
          <View style={styles.centerTabButtonWrapper}>
            <Animated.View
              style={[
                styles.centerTabButton,
                isFocused && styles.centerTabButtonActive,
                innerStyle,
              ]}
            >
              <Ionicons
                name={isFocused ? tab.icon : tab.iconOutline}
                size={26}
                color={COLORS.white}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Label */}
      <Text style={[styles.centerTabLabel, isFocused && styles.centerTabLabelActive]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
});

// ==================== CUSTOM TAB BAR ====================
function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarBackground} />

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
  );
}

// ==================== MAIN NAVIGATOR ====================
// ==================== MAIN NAVIGATOR ====================
export default function HomeTabs() {
  return (
    <>
      {/* ✅ ACTIVE RIDE CHECKER (MOUNTED HERE) */}
      <ActiveRideHandler />

      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
        }}
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
  tabBarContainer: {
    position: "relative",
    backgroundColor: "transparent",
  },

  tabBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowDark,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  tabItemsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingHorizontal: 4,
  },

  // ✅ NEW: Wrapper to prevent warning
  tabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  tabTouchable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },

  tabContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    position: "relative",
  },

  tabBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
  },

  // ✅ NEW: Icon wrapper
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textInactive,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  activeIndicator: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
    marginTop: 4,
  },

  // ✅ NEW: Center tab wrapper
  centerTabWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  centerTabTouchable: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: -20,
    paddingHorizontal: 8,
    minWidth: 70,
  },

  centerTabGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // ✅ NEW: Button wrapper
  centerTabButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  centerTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.textInactive,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  centerTabButtonActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  centerTabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textInactive,
    marginTop: 6,
    letterSpacing: 0.2,
  },

  centerTabLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});