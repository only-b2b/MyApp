// screens/ServiceSelectScreen.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import Animated, {
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#3d3c02",
  primaryLight: "#00C77B",
  primaryDark: "#008F5B",
  primaryBg: "rgba(0, 168, 107, 0.08)",
  primaryGradient: ["#e6d222", "#cac703"],
  secondary: "#6366F1",
  secondaryBg: "rgba(99, 102, 241, 0.1)",
  orange: "#F59E0B",
  orangeBg: "rgba(245, 158, 11, 0.1)",
  blue: "#3B82F6",
  blueBg: "rgba(59, 130, 246, 0.1)",
  purple: "#8B5CF6",
  purpleBg: "rgba(139, 92, 246, 0.1)",
  pink: "#EC4899",
  pinkBg: "rgba(236, 72, 153, 0.1)",
  cyan: "#06B6D4",
  cyanBg: "rgba(6, 182, 212, 0.1)",
  white: "#FFFFFF",
  background: "#F5F6F8",
  card: "#FFFFFF",
  surface: "#F9FAFB",
  border: "#E5E7EB",
  divider: "#F0F0F0",
  textDark: "#111111",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textLight: "#D1D5DB",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  error: "#EF4444",
  shadow: "#000000",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 100,
};

// ==================== SERVICES DATA ====================
const SERVICES = [
  {
    id: "wash",
    title: "Car Wash",
    subtitle: "Doorstep cleaning",
    icon: "car-sport",
    color: COLORS.blue,
    bgColor: COLORS.blueBg,
    gradient: ["#60A5FA", "#3B82F6"],
    route: "CarWash",
  },
  {
    id: "ride",
    title: "Book Ride",
    subtitle: "Pick & Drop",
    icon: "navigate",
    color: COLORS.primary,
    bgColor: COLORS.primaryBg,
    gradient: ["#34D399", "#00A86B"],
    route: "PickDrop",
  },
  {
    id: "driver",
    title: "Hire Driver",
    subtitle: "Professional drivers",
    icon: "person",
    color: COLORS.purple,
    bgColor: COLORS.purpleBg,
    gradient: ["#A78BFA", "#8B5CF6"],
    route: "Driver",
  },
  {
    id: "rental",
    title: "Rentals",
    subtitle: "Hourly packages",
    icon: "time",
    color: COLORS.orange,
    bgColor: COLORS.orangeBg,
    gradient: ["#FBBF24", "#F59E0B"],
    route: "PickDrop",
  },
];

// ==================== QUICK ACTIONS ====================
const QUICK_ACTIONS = [
  { id: "1", icon: "star", label: "Top Rated", color: COLORS.orange },
  { id: "2", icon: "flash", label: "Express", color: COLORS.primary },
  { id: "3", icon: "shield-checkmark", label: "Verified", color: COLORS.blue },
  { id: "4", icon: "gift", label: "Offers", color: COLORS.pink },
];

// ==================== PROMOTIONS ====================
const PROMOTIONS = [
  {
    id: "1",
    title: "50% OFF",
    subtitle: "on your first ride",
    code: "FIRST50",
    gradient: ["#00C77B", "#00A86B"],
    icon: "car-sport",
  },
  {
    id: "2",
    title: "Free Wash",
    subtitle: "on orders above ₹999",
    code: "FREEWASH",
    gradient: ["#60A5FA", "#3B82F6"],
    icon: "water",
  },
  {
    id: "3",
    title: "₹100 OFF",
    subtitle: "on driver booking",
    code: "DRIVE100",
    gradient: ["#A78BFA", "#8B5CF6"],
    icon: "person",
  },
];

// ==================== PULSING DOT COMPONENT ====================
// ✅ FIXED: Wrapped transform animation properly
const PulseDot = React.memo(() => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseContainer}>
      {/* ✅ Wrapper View for transform animation */}
      <View style={styles.pulseOuterWrapper}>
        <Animated.View style={[styles.pulseOuter, pulseStyle]} />
      </View>
      <View style={styles.pulseDot} />
    </View>
  );
});

// ==================== SERVICE CARD COMPONENT ====================
// ✅ FIXED: Separated layout animation from transform animation
const ServiceCard = React.memo(({ service, index, onPress }) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 150 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    // ✅ Outer wrapper with layout animation (entering)
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400).springify()}
      style={styles.serviceCardWrapper}
    >
      {/* ✅ Inner wrapper for press transform animation */}
      <View style={styles.serviceCardInnerWrapper}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={styles.serviceCard}
          >
            {/* Gradient Background */}
            <LinearGradient
              colors={service.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.serviceGradient}
            >
              <View style={styles.serviceIconContainer}>
                <Ionicons name={service.icon} size={28} color={COLORS.white} />
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
            </View>

            {/* Arrow */}
            <View style={[styles.serviceArrow, { backgroundColor: service.bgColor }]}>
              <Ionicons name="arrow-forward" size={14} color={service.color} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
});

// ==================== PROMO CARD COMPONENT ====================
// ✅ FIXED: Separated layout animation from transform animation
const PromoCard = React.memo(({ promo, index }) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    // ✅ Outer wrapper with layout animation
    <Animated.View
      entering={SlideInRight.delay(index * 150).duration(500).springify()}
      style={styles.promoCard}
    >
      <LinearGradient
        colors={promo.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promoGradient}
      >
        {/* Content */}
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>{promo.title}</Text>
          <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
          <View style={styles.promoCodeContainer}>
            <Text style={styles.promoCode}>Use: {promo.code}</Text>
          </View>
        </View>

        {/* ✅ Floating Icon - Wrapped properly */}
        <View style={styles.promoIconWrapper}>
          <Animated.View style={[styles.promoIconContainer, floatStyle]}>
            <Ionicons name={promo.icon} size={48} color="rgba(255,255,255,0.3)" />
          </Animated.View>
        </View>

        {/* Decorative Circles */}
        <View style={styles.promoCircle1} />
        <View style={styles.promoCircle2} />
      </LinearGradient>
    </Animated.View>
  );
});

// ==================== QUICK ACTION COMPONENT ====================
// ✅ FIXED: Separated layout animation from transform animation
const QuickAction = React.memo(({ action, index, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    // ✅ Outer wrapper with layout animation
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400).springify()}
      style={styles.quickActionOuter}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* ✅ Inner wrapper for transform animation */}
        <View style={styles.quickActionWrapper}>
          <Animated.View style={[styles.quickAction, animatedStyle]}>
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + "15" }]}>
              <Ionicons name={action.icon} size={18} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ==================== MAIN COMPONENT ====================
export default function ServiceSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const promoScrollRef = useRef(null);

  // States
  const [addressTitle, setAddressTitle] = useState("Fetching location...");
  const [addressSub, setAddressSub] = useState("Please wait");
  const [locLoading, setLocLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState("Hello");
  const [activePromo, setActivePromo] = useState(0);

  // Get Greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Load Location
  const loadLocation = useCallback(async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setAddressTitle("Location access needed");
        setAddressSub("Tap to enable");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geo = await Location.reverseGeocodeAsync(pos.coords);
      const g = geo?.[0];

      const primary = [g?.name, g?.street].filter(Boolean).join(", ") || "Current location";
      const secondary = [g?.district || g?.subregion, g?.city, g?.postalCode]
        .filter(Boolean)
        .join(" • ");

      setAddressTitle(primary);
      setAddressSub(secondary || "Location detected");
    } catch (e) {
      setAddressTitle("Unable to fetch location");
      setAddressSub("Tap to retry");
    } finally {
      setLocLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLocation();
    setRefreshing(false);
  }, [loadLocation]);

  // Auto-scroll promos
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo((prev) => {
        const next = (prev + 1) % PROMOTIONS.length;
        promoScrollRef.current?.scrollTo({
          x: next * (width - 64),
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle service press
  const handleServicePress = useCallback((route) => {
    navigation.navigate(route);
  }, [navigation]);

  // Handle quick action press
  const handleQuickActionPress = useCallback((action) => {
    console.log("Quick action pressed:", action.label);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ==================== HEADER ==================== */}
      <LinearGradient
        colors={COLORS.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        {/* Top Row */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.headerTop}
        >
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{greeting} 👋</Text>
            <Text style={styles.greetingSubtext}>Where would you like to go?</Text>
          </View>

          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Location Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.locationCard}
        >
          <View style={styles.locationLeft}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.locationInfo}>
              <View style={styles.locationLabelRow}>
                <Text style={styles.locationLabel}>Your Location</Text>
                <PulseDot />
                <Text style={styles.liveLabel}>LIVE</Text>
              </View>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {addressTitle}
              </Text>
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {addressSub}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadLocation}
            disabled={locLoading}
          >
            <Ionicons
              name={locLoading ? "sync" : "refresh"}
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.searchContainer}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              placeholder="Search services, locations..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.searchFilterBtn}>
              <Ionicons name="options-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Decorative Elements */}
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
      </LinearGradient>

      {/* ==================== CONTENT ==================== */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {QUICK_ACTIONS.map((action, index) => (
              <QuickAction
                key={action.id}
                action={action}
                index={index}
                onPress={() => handleQuickActionPress(action)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Promotions Slider */}
        <Animated.View
          entering={FadeIn.delay(300).duration(500)}
          style={styles.promosSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Special Offers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={promoScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width - 64}
            contentContainerStyle={styles.promosScroll}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - 64));
              setActivePromo(index);
            }}
            scrollEventThrottle={16}
          >
            {PROMOTIONS.map((promo, index) => (
              <PromoCard key={promo.id} promo={promo} index={index} />
            ))}
          </ScrollView>

          {/* Promo Dots */}
          <View style={styles.promoDots}>
            {PROMOTIONS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.promoDot,
                  activePromo === index && styles.promoDotActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚀 Our Services</Text>
          </View>

          <View style={styles.servicesGrid}>
            {SERVICES.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onPress={() => handleServicePress(service.route)}
              />
            ))}
          </View>
        </View>

        {/* Why Choose Us */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.whySection}
        >
          <Text style={styles.sectionTitle}>✨ Why Choose Us</Text>

          <View style={styles.whyGrid}>
            <View style={styles.whyItem}>
              <View style={[styles.whyIcon, { backgroundColor: COLORS.primaryBg }]}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.whyTitle}>Verified</Text>
              <Text style={styles.whySubtitle}>Background checked drivers</Text>
            </View>

            <View style={styles.whyItem}>
              <View style={[styles.whyIcon, { backgroundColor: COLORS.orangeBg }]}>
                <Ionicons name="flash" size={24} color={COLORS.orange} />
              </View>
              <Text style={styles.whyTitle}>Fast</Text>
              <Text style={styles.whySubtitle}>Quick response time</Text>
            </View>

            <View style={styles.whyItem}>
              <View style={[styles.whyIcon, { backgroundColor: COLORS.blueBg }]}>
                <Ionicons name="wallet" size={24} color={COLORS.blue} />
              </View>
              <Text style={styles.whyTitle}>Affordable</Text>
              <Text style={styles.whySubtitle}>Best prices guaranteed</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.recentSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🕐 Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentCard}>
            <View style={styles.recentEmpty}>
              <View style={styles.recentEmptyIcon}>
                <Ionicons name="car-sport-outline" size={32} color={COLORS.textMuted} />
              </View>
              <Text style={styles.recentEmptyTitle}>No recent trips</Text>
              <Text style={styles.recentEmptySubtitle}>
                Book your first ride to see it here
              </Text>
              <TouchableOpacity
                style={styles.recentEmptyBtn}
                onPress={() => navigation.navigate("PickDrop")}
              >
                <Text style={styles.recentEmptyBtnText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ========== HEADER ==========
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },

  greetingContainer: {
    flex: 1,
  },

  greetingText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },

  greetingSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Location Card
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  locationLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },

  locationInfo: {
    flex: 1,
  },

  locationLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  locationLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  // ✅ NEW: Pulse wrapper styles
  pulseContainer: {
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
    width: 8,
    height: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  pulseOuterWrapper: {
    position: "absolute",
    width: 8,
    height: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  pulseOuter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },

  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },

  liveLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.success,
    letterSpacing: 0.5,
  },

  locationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 2,
  },

  locationSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.md,
  },

  // Search Bar
  searchContainer: {
    marginTop: SPACING.xs,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    height: 50,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 14,
    color: COLORS.textDark,
  },

  searchFilterBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header Decorations
  headerDecor1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  headerDecor2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // ========== CONTENT ==========
  content: {
    paddingTop: SPACING.lg,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // ✅ NEW: Quick Actions wrapper styles
  quickActionsContainer: {
    marginBottom: SPACING.xl,
  },

  quickActionsScroll: {
    paddingHorizontal: SPACING.lg,
  },

  quickActionOuter: {
    marginRight: SPACING.xl,
  },

  quickActionWrapper: {
    alignItems: "center",
  },

  quickAction: {
    alignItems: "center",
  },

  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },

  quickActionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },

  // Promotions
  promosSection: {
    marginBottom: SPACING.xl,
  },

  promosScroll: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
  },

  promoCard: {
    width: width - 64,
    marginRight: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
  },

  promoGradient: {
    padding: SPACING.xl,
    height: 140,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  promoContent: {
    zIndex: 1,
  },

  promoTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },

  promoSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: SPACING.md,
  },

  promoCodeContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
  },

  promoCode: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // ✅ NEW: Promo icon wrapper
  promoIconWrapper: {
    position: "absolute",
    right: SPACING.xl,
    top: "50%",
    marginTop: -24,
  },

  promoIconContainer: {
    // Transform animation applied here
  },

  promoCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  promoCircle2: {
    position: "absolute",
    bottom: -30,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  promoDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.md,
  },

  promoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: 3,
  },

  promoDotActive: {
    width: 20,
    backgroundColor: COLORS.primary,
  },

  // Services
  servicesSection: {
    marginBottom: SPACING.xl,
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.lg,
    justifyContent: "space-between",
  },

  serviceCardWrapper: {
    width: "48%",
    marginBottom: SPACING.md,
  },

  // ✅ NEW: Service card inner wrapper
  serviceCardInnerWrapper: {
    flex: 1,
  },

  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  serviceGradient: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  serviceIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  serviceContent: {
    marginBottom: SPACING.sm,
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 2,
  },

  serviceSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  serviceArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },

  // Why Choose Us
  whySection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  whyGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },

  whyItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
  },

  whyIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },

  whyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 2,
  },

  whySubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Recent Activity
  recentSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  recentCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  recentEmpty: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },

  recentEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  recentEmptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },

  recentEmptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },

  recentEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },

  recentEmptyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginRight: SPACING.sm,
  },
});