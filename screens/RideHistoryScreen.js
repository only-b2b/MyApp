import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../config";

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  primaryDark: "#008F5B",

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

  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",

  blue: "#3B82F6",
  purple: "#8B5CF6",
  orange: "#F59E0B",
  pink: "#EC4899",

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

// ==================== FILTER CATEGORIES ====================
const RIDE_CATEGORIES = [
  { id: "all", label: "All", icon: "list" },
  { id: "pickdrop", label: "Rides", icon: "car" },
  { id: "car_wash", label: "Car Wash", icon: "water" },
  { id: "driver", label: "Driver", icon: "person" },
];

// ==================== DATE FILTERS ====================
const DATE_FILTERS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

// ==================== MAIN COMPONENT ====================
export default function RideHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = auth().currentUser;

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedRides, setCompletedRides] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalRides: 0,
    totalSpent: 0,
  });

  // ==================== FETCH DATA ====================
  const fetchRideHistory = useCallback(async () => {
    try {
      const ridesRes = await fetch(
        `${API_BASE_URL}/orders/completed?firebase_uid=${user?.uid}`
      );
      const ridesData = await ridesRes.json();
      setCompletedRides(ridesData || []);

      // Calculate stats
      const totalSpent = (ridesData || []).reduce(
        (sum, ride) => sum + (ride.price || 0),
        0
      );

      setStats({
        totalRides: ridesData?.length || 0,
        totalSpent,
      });
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRideHistory();
  }, [fetchRideHistory]);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRideHistory();
    setRefreshing(false);
  }, [fetchRideHistory]);

  // ==================== FILTER FUNCTIONS ====================
  const filterByDate = (ride) => {
    if (selectedDateFilter === "all") return true;

    const rideDate = new Date(ride.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (selectedDateFilter) {
      case "today":
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        return rideDate >= today && rideDate <= todayEnd;
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return rideDate >= weekStart;
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return rideDate >= monthStart;
      default:
        return true;
    }
  };

  // ==================== FILTERED RIDES ====================
  const filteredRides = completedRides
    .filter((ride) => {
      if (selectedCategory === "all") return true;
      return ride.service_type === selectedCategory;
    })
    .filter(filterByDate);

  // Calculate filtered stats
  const filteredStats = {
    count: filteredRides.length,
    total: filteredRides.reduce((sum, ride) => {
        let price = ride.price;

        if (!price) return sum;

        // If string like "₹250" or "250"
        if (typeof price === "string") {
        price = price.replace(/[^\d.]/g, ""); // remove ₹ or any symbol
        price = parseFloat(price);
        }

        if (isNaN(price)) return sum;

        return sum + price;
    }, 0),
    };

  // ==================== RENDER COMPONENTS ====================

  // Header
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Ride History</Text>
      <TouchableOpacity
        style={styles.filterBtn}
        onPress={() => setShowDateFilter(!showDateFilter)}
      >
        <Ionicons name="calendar-outline" size={20} color={COLORS.textDark} />
      </TouchableOpacity>
    </View>
  );

  // Stats Summary
  const StatsSummary = () => (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      style={styles.statsContainer}
    >
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{filteredStats.count}</Text>
        <Text style={styles.statLabel}>Rides</Text>
      </View>
      <View style={styles.statDividerVertical} />
      <View style={styles.statBox}>
        <Text style={styles.statValue}>₹{filteredStats.total.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Total Spent</Text>
      </View>
    </Animated.View>
  );

  // Date Filter Pills
  const DateFilterPills = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.dateFilterContainer}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateFilterScroll}
      >
        {DATE_FILTERS.map((filter) => {
          const isActive = selectedDateFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.dateFilterPill,
                isActive && styles.dateFilterPillActive,
              ]}
              onPress={() => setSelectedDateFilter(filter.id)}
            >
              <Text
                style={[
                  styles.dateFilterText,
                  isActive && styles.dateFilterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  // Category Tabs
  const CategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {RIDE_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;
          const count = category.id === "all"
            ? completedRides.filter(filterByDate).length
            : completedRides.filter(
                (r) => r.service_type === category.id && filterByDate(r)
              ).length;

          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryTab, isActive && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={isActive ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}
              >
                {category.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.categoryCount,
                    isActive && styles.categoryCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryCountText,
                      isActive && styles.categoryCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Ride Item
  const RideItem = ({ ride, index }) => {
    const getServiceIcon = () => {
      switch (ride.service_type) {
        case "pickdrop":
          return { icon: "car", color: COLORS.primary, bg: COLORS.primaryLight };
        case "car_wash":
          return { icon: "water", color: COLORS.blue, bg: COLORS.infoBg };
        case "driver":
          return { icon: "person", color: COLORS.purple, bg: "rgba(139, 92, 246, 0.1)" };
        default:
          return { icon: "car", color: COLORS.primary, bg: COLORS.primaryLight };
      }
    };

    const serviceStyle = getServiceIcon();
    const rideDate = ride.created_at ? new Date(ride.created_at) : new Date();

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <TouchableOpacity style={styles.rideCard} activeOpacity={0.8}>
          <View style={[styles.rideIcon, { backgroundColor: serviceStyle.bg }]}>
            <Ionicons name={serviceStyle.icon} size={22} color={serviceStyle.color} />
          </View>

          <View style={styles.rideInfo}>
            <View style={styles.rideHeader}>
              <Text style={styles.rideTitle}>
                {ride.service_type === "pickdrop"
                  ? "Ride"
                  : ride.service_type === "car_wash"
                  ? "Car Wash"
                  : "Driver"}
              </Text>
              <Text style={styles.ridePrice}>₹{ride.price}</Text>
            </View>

            <Text style={styles.rideId}>#{ride.id}</Text>

            {ride.pickup_address && (
              <View style={styles.rideLocation}>
                <View style={styles.locationDot} />
                <Text style={styles.rideLocationText} numberOfLines={1}>
                  {ride.pickup_address}
                </Text>
              </View>
            )}

            {ride.drop_address && (
              <View style={styles.rideLocation}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.rideLocationText} numberOfLines={1}>
                  {ride.drop_address}
                </Text>
              </View>
            )}

            <View style={styles.rideFooter}>
              <View style={styles.rideStatusBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.rideStatusText}>Completed</Text>
              </View>
              <View style={styles.rideMeta}>
                {ride.distance && (
                  <View style={styles.rideMetaItem}>
                    <Ionicons name="navigate" size={12} color={COLORS.textMuted} />
                    <Text style={styles.rideMetaText}>{ride.distance}</Text>
                  </View>
                )}
                <Text style={styles.rideDate}>
                  {rideDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Empty State
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="car-outline" size={50} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No rides found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory === "all"
          ? "Your completed rides will appear here"
          : `No ${RIDE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || "rides"} found`}
      </Text>
      {selectedCategory !== "all" && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => {
            setSelectedCategory("all");
            setSelectedDateFilter("all");
          }}
        >
          <Text style={styles.emptyBtnText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ==================== MAIN RENDER ====================
  if (loading) {
    return (
      <View style={[styles.loaderContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading ride history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <Header />

      {/* Date Filter (Collapsible) */}
      {showDateFilter && <DateFilterPills />}

      {/* Stats Summary */}
      <StatsSummary />

      {/* Category Tabs */}
      <CategoryTabs />

      {/* Rides List */}
      {filteredRides.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <RideItem ride={item} index={index} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  // Date Filter
  dateFilterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dateFilterScroll: {
    paddingHorizontal: SPACING.lg,
  },
  dateFilterPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateFilterPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  dateFilterTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statDividerVertical: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.lg,
  },

  // Category Tabs
  categoryContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.lg,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  categoryLabelActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  categoryCount: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
  },
  categoryCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  categoryCountTextActive: {
    color: COLORS.white,
  },

  // List
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    paddingTop: SPACING.sm,
  },

  // Ride Card
  rideCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rideIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  rideInfo: {
    flex: 1,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  rideId: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rideLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  rideLocationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  rideFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  rideStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  rideStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.success,
    marginLeft: 4,
  },
  rideMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  rideMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  rideDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
});