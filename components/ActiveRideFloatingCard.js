// components/ActiveRideFloatingCard.js
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const COLORS = {
  primary: "#00A86B",
  white: "#FFFFFF",
  dark: "#111827",
  gray: "#6B7280",
  orange: "#FF6B00",
  blue: "#3B82F6",
};

export default function ActiveRideFloatingCard({
  visible,
  order,
  onResume,
  onClose,
}) {
  const translateY = useSharedValue(150);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && order) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(150, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, order]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!order) return null;

  // ✅ Get icon based on service type
  const getIcon = () => {
    if (order.service_type === "car_wash") return "water-outline";
    return "car-sport-outline";
  };

  // ✅ Get status text
  const getStatusText = () => {
    const statusMap = {
      requested: "Searching...",
      accepted: "Driver Assigned",
      arrived: "Driver Arrived",
      in_progress: "Ride Active",
    };
    return statusMap[order.status] || order.status?.replace("_", " ");
  };

  // ✅ Get color based on status
  const getStatusColor = () => {
    const colorMap = {
      requested: COLORS.orange,
      accepted: COLORS.primary,
      arrived: COLORS.blue,
      in_progress: COLORS.primary,
    };
    return colorMap[order.status] || COLORS.gray;
  };

  // ✅ Get service name
  const getServiceName = () => {
    const serviceMap = {
      car_wash: "Car Wash",
      driver: "Driver",
      pickdrop: "Ride",
    };
    return serviceMap[order.service_type] || "Service";
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.95}
          style={styles.card}
          onPress={onResume}
        >
          {/* Left Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
            <Ionicons name={getIcon()} size={24} color={getStatusColor()} />
          </View>

          {/* Center Content */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {getServiceName()} in Progress
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Right Arrow */}
          <View style={styles.arrowContainer}>
            <Text style={styles.tapText}>Tap to view</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 90,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 999,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.dark,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  tapText: {
    fontSize: 11,
    color: COLORS.gray,
    marginRight: 4,
  },
});