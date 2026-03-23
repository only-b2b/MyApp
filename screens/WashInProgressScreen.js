// screens/WashInProgressScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../config";

const COLORS = {
  primary: "#00A86B",
  primaryLight: "#00C77B",
  dark: "#1C1C1E",
  muted: "#6B7280",
  white: "#FFFFFF",
  bg: "#F5F6F8",
};

const WASH_STAGES = [
  { id: 1, name: "Exterior Rinse", icon: "water-outline", duration: 10 },
  { id: 2, name: "Foam Application", icon: "cloudy-outline", duration: 15 },
  { id: 3, name: "Scrub & Clean", icon: "brush-outline", duration: 20 },
  { id: 4, name: "Interior Vacuum", icon: "car-outline", duration: 15 },
  { id: 5, name: "Final Rinse", icon: "water", duration: 10 },
  { id: 6, name: "Dry & Polish", icon: "sparkles-outline", duration: 10 },
];

export default function WashInProgressScreen({ route, navigation }) {
  const { orderId, technician } = route.params;
  
  const [currentStage, setCurrentStage] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [prePhotos, setPrePhotos] = useState([]);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const onlyHttp = (arr) => (arr || []).filter(u => typeof u === "string" && /^https?:\/\//.test(u));
  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate stage progression
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < WASH_STAGES.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 10000); // Change stage every 10 seconds for demo

    return () => clearInterval(stageInterval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStage / WASH_STAGES.length,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStage]);

  // Poll for order completion
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(pollInterval);
          navigation.replace("WashCompletedScreen", { 
            orderId,
            order: data,
          });
        }

        // Update pre-photos if available
        // Update pre-photos if available
      if (data.pre_photos) {
        const arr =
          typeof data.pre_photos === "string"
            ? JSON.parse(data.pre_photos)
            : data.pre_photos;

        if (Array.isArray(arr) && arr.length > 0) {
          setPrePhotos(onlyHttp(arr));
        }
      }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Animated.View 
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Ionicons name="water" size={32} color={COLORS.primary} />
          </Animated.View>
          <Text style={styles.headerTitle}>Wash In Progress</Text>
          <Text style={styles.headerTime}>{formatTime(elapsedTime)}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Wash Progress</Text>
            <Text style={styles.progressPercent}>
              {Math.round((currentStage / WASH_STAGES.length) * 100)}%
            </Text>
          </View>

          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[styles.progressBarFill, { width: progressWidth }]}
            />
          </View>

          <Text style={styles.currentStageText}>
            Current: {WASH_STAGES[currentStage - 1]?.name || "Completing..."}
          </Text>
        </View>

        {/* Stages List */}
        <View style={styles.stagesCard}>
          <Text style={styles.stagesTitle}>Wash Stages</Text>
          
          {WASH_STAGES.map((stage, index) => {
            const isCompleted = stage.id < currentStage;
            const isCurrent = stage.id === currentStage;
            
            return (
              <View key={stage.id} style={styles.stageItem}>
                <View 
                  style={[
                    styles.stageIcon,
                    isCompleted && styles.stageIconCompleted,
                    isCurrent && styles.stageIconCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  ) : (
                    <Ionicons 
                      name={stage.icon} 
                      size={18} 
                      color={isCurrent ? COLORS.white : COLORS.muted} 
                    />
                  )}
                </View>
                
                <View style={styles.stageContent}>
                  <Text 
                    style={[
                      styles.stageName,
                      isCompleted && styles.stageNameCompleted,
                      isCurrent && styles.stageNameCurrent,
                    ]}
                  >
                    {stage.name}
                  </Text>
                  <Text style={styles.stageDuration}>~{stage.duration} mins</Text>
                </View>

                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>IN PROGRESS</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Pre-Photos */}
        {prePhotos.length > 0 && (
          <View style={styles.photosCard}>
            <Text style={styles.photosTitle}>Pre-Wash Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {prePhotos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photoThumb}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Technician Info */}
        <View style={styles.techCard}>
          <View style={styles.techAvatar}>
            <Ionicons name="person" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.techInfo}>
            <Text style={styles.techName}>
              {technician?.full_name || "Technician"}
            </Text>
            <Text style={styles.techStatus}>Working on your vehicle</Text>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.tipText}>
            You'll be notified when the wash is complete with before & after photos!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
  },
  headerTime: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginTop: -15,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  currentStageText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.muted,
  },
  stagesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  stagesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 16,
  },
  stageItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.muted}20`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  stageIconCompleted: {
    backgroundColor: COLORS.primary,
  },
  stageIconCurrent: {
    backgroundColor: COLORS.primary,
  },
  stageContent: {
    flex: 1,
  },
  stageName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },
  stageNameCompleted: {
    color: COLORS.dark,
    textDecorationLine: "line-through",
  },
  stageNameCurrent: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  stageDuration: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  photosCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  photosTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 12,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
  },
  techCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  techAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  techInfo: {
    marginLeft: 14,
  },
  techName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  techStatus: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: 14,
  },
  tipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },
});