// screens/WashCompletedScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");
const onlyHttp = (arr) => (arr || []).filter(u => typeof u === "string" && /^https?:\/\//.test(u));

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  dark: "#1C1C1E",
  muted: "#6B7280",
  white: "#FFFFFF",
  bg: "#F5F6F8",
  gold: "#F59E0B",
};

export default function WashCompletedScreen({ route, navigation }) {
  const { orderId, order } = route.params;
  
  const [rating, setRating] = useState(0);
  const [showPhotos, setShowPhotos] = useState("before");
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const [freshOrder, setFreshOrder] = useState(order);

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRating = (value) => {
    setRating(value);
  };

  useEffect(() => {
  (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      const data = await res.json();
      setFreshOrder(data);
    } catch (e) {}
  })();
}, [orderId]);

  const handleSubmitRating = async () => {
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      
      navigation.popToTop();
    } catch (err) {
      console.log("Rating error:", err);
      navigation.popToTop();
    }
  };

  const normalizePhotos = (val) => {
    if (!val) return [];
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  };

  const prePhotos = normalizePhotos(order?.pre_photos);
  const postPhotos = normalizePhotos(order?.post_photos);


  // Mock photos for demo
  // ✅ choose correct list + keep only http/https
const beforePhotosToShow = prePhotos.length ? prePhotos : [
  "https://via.placeholder.com/300x200/e0e0e0/666?text=Before+1",
  "https://via.placeholder.com/300x200/e0e0e0/666?text=Before+2",
];

const afterPhotosToShow = postPhotos.length ? postPhotos : [
  "https://via.placeholder.com/300x200/00A86B/fff?text=After+1",
  "https://via.placeholder.com/300x200/00A86B/fff?text=After+2",
];

const photosToShow =
  showPhotos === "before"
    ? onlyHttp(beforePhotosToShow)
    : onlyHttp(afterPhotosToShow);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <Animated.View 
          style={[
            styles.successContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={50} color={COLORS.white} />
          </View>
          <Text style={styles.successTitle}>Wash Complete! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Your car is now sparkling clean
          </Text>
        </Animated.View>

        {/* Before/After Toggle */}
        <View style={styles.photoToggle}>
          <TouchableOpacity 
            style={[
              styles.toggleBtn,
              showPhotos === "before" && styles.toggleBtnActive,
            ]}
            onPress={() => setShowPhotos("before")}
          >
            <Text 
              style={[
                styles.toggleText,
                showPhotos === "before" && styles.toggleTextActive,
              ]}
            >
              Before
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.toggleBtn,
              showPhotos === "after" && styles.toggleBtnActive,
            ]}
            onPress={() => setShowPhotos("after")}
          >
            <Text 
              style={[
                styles.toggleText,
                showPhotos === "after" && styles.toggleTextActive,
              ]}
            >
              After
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photos */}
        <View style={styles.photosContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photosToShow.length > 0 ? (
              photosToShow.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  onError={(e) => console.log("Image load error:", photo, e.nativeEvent)}
                />
              ))
            ) : (
              <Text style={{ color: COLORS.muted }}>
                No photos available yet
              </Text>
            )}
          </ScrollView>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Service Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Package</Text>
            <Text style={styles.summaryValue}>{order?.package_name || "Car Wash"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle</Text>
            <Text style={styles.summaryValue}>{order?.vehicle || "—"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{order?.duration || "—"}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>
              ₹{order?.price?.toLocaleString("en-IN") || "—"}
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Rate your experience</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star}
                onPress={() => handleRating(star)}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color={COLORS.gold}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 5 ? "Excellent! 🌟" : 
               rating === 4 ? "Great! 👍" : 
               rating === 3 ? "Good 🙂" : 
               rating === 2 ? "Fair 😐" : "Poor 😞"}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.primaryBtn}
          onPress={handleSubmitRating}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.btnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>Done</Text>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.dark,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  photoToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontWeight: "600",
    color: COLORS.muted,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  photosContainer: {
    marginBottom: 20,
  },
  photo: {
    width: width * 0.7,
    height: 180,
    borderRadius: 16,
    marginRight: 12,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  ratingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
  },
  ratingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    marginRight: 8,
  },
});