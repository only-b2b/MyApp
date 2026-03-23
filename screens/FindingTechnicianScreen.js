// screens/FindingTechnicianScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { API_BASE_URL } from "../config";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  orange: "#FF6B00",
  orangeLight: "#FFB347",
  dark: "#1C1C1E",
  muted: "#6B7280",
  bg: "#F5F6F8",
  white: "#FFFFFF",
};

export default function FindingTechnicianScreen({ route, navigation }) {
  const { orderId, serviceType } = route.params;
  const [searchTime, setSearchTime] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Determine colors based on service type
  const isCarWash = serviceType === "car_wash";
  const primaryColor = isCarWash ? COLORS.primary : COLORS.orange;
  const gradientColors = isCarWash 
    ? [COLORS.primary, COLORS.primaryLight] 
    : [COLORS.orange, COLORS.orangeLight];

  // 🔥 Pulse Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 🔄 Rotate Animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // ⏱️ Search Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔁 Polling for order status
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        if (data.status === "accepted") {
          clearInterval(pollInterval);
          
          if (isCarWash) {
            navigation.replace("TechnicianEnRouteScreen", { 
              orderId,
              technician: data.driver,
            });
          } else {
            navigation.replace("DriverAcceptedScreen", { order: data });
          }
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = async () => {
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "POST",
      });
      navigation.goBack();
    } catch (err) {
      console.log("Cancel error:", err);
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Animated Background Circles */}
      <View style={styles.circlesContainer}>
        <Animated.View 
          style={[
            styles.circle, 
            styles.circleOuter,
            { 
              transform: [{ scale: pulseAnim }],
              borderColor: primaryColor,
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.circle, 
            styles.circleMiddle,
            { borderColor: primaryColor }
          ]} 
        />
        <Animated.View 
          style={[
            styles.circle, 
            styles.circleInner,
            { backgroundColor: `${primaryColor}15` }
          ]} 
        />
        
        {/* Center Icon */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <View style={[styles.iconContainer, { backgroundColor: primaryColor }]}>
            <Ionicons 
              name={isCarWash ? "water" : "car-sport"} 
              size={40} 
              color={COLORS.white} 
            />
          </View>
        </Animated.View>
      </View>

      {/* Status Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isCarWash ? "Finding Technician..." : "Finding Driver..."}
        </Text>
        <Text style={styles.subtitle}>
          Searching for nearby {isCarWash ? "car wash experts" : "professionals"}
        </Text>
        
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.muted} />
          <Text style={styles.timerText}>Searching for {formatTime(searchTime)}</Text>
        </View>
      </View>

      {/* Loading Indicator */}
      <ActivityIndicator size="small" color={primaryColor} style={{ marginTop: 20 }} />

      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Did you know?</Text>
        <Text style={styles.tipsText}>
          {isCarWash 
            ? "Our technicians bring eco-friendly products and use minimal water!"
            : "All our drivers are verified and background checked."
          }
        </Text>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity 
        style={styles.cancelBtn}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelText}>Cancel Request</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  circlesContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
  },
  circleOuter: {
    width: 200,
    height: 200,
    borderWidth: 1,
    opacity: 0.3,
  },
  circleMiddle: {
    width: 150,
    height: 150,
    borderWidth: 2,
    opacity: 0.5,
  },
  circleInner: {
    width: 100,
    height: 100,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
  },
  timerText: {
    marginLeft: 6,
    color: COLORS.muted,
    fontSize: 13,
  },
  tipsContainer: {
    position: "absolute",
    bottom: 120,
    backgroundColor: COLORS.bg,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
  tipsTitle: {
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  tipsText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  cancelBtn: {
    position: "absolute",
    bottom: 50,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
  },
});