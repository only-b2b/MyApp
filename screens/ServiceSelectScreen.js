import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

const ORANGE = "#FF6B00";
const SOFT_ORANGE = "#FFF4E8";
const BLUE = "#0A84FF";
const PURPLE = "#7C3AED";
const BG = "#FAFAFA";
const DARK = "#1C1C1E";
const MUTED = "#6B7280";

export default function ServiceSelectScreen({ navigation }) {

  const Card = ({ title, desc, icon, color, bg, onPress }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={() => (scale.value = withSpring(0.97))}
          onPressOut={() => (scale.value = withSpring(1))}
          onPress={onPress}
          style={[styles.card, { backgroundColor: "#FFFFFF" }]}
        >
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSub}>{desc}</Text>

            <View style={[styles.tag, { backgroundColor: bg }]}>
              <Ionicons name={icon} size={14} color={color} />
              <Text style={[styles.tagText, { color }]}>{title}</Text>
            </View>
          </View>

          <Ionicons name={icon} size={40} color={color} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header - Minimal Swiggy Style */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>OnlyB2B Motors</Text>
          <Text style={styles.headerSub}>Select a service</Text>
        </View>

        <TouchableOpacity style={styles.locationBar}>
          <Ionicons name="location-outline" size={16} color={ORANGE} />
          <Text style={styles.locationText}>Use current location</Text>
          <Ionicons name="chevron-down" size={14} color={ORANGE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Info Chips */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="shield-checkmark-outline" size={14} color={ORANGE} />
            <Text style={styles.chipText}>Verified Partners</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="flash-outline" size={14} color={ORANGE} />
            <Text style={styles.chipText}>Fast Service</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="star-outline" size={14} color={ORANGE} />
            <Text style={styles.chipText}>Top Rated</Text>
          </View>
        </View>

        {/* Cards */}
        <Card
          title="Car Wash"
          desc="Doorstep wash & shine"
          icon="water-outline"
          color={ORANGE}
          bg={SOFT_ORANGE}
          onPress={() => navigation.navigate("CarWash")}
        />

        <Card
          title="Pick & Drop"
          desc="Pickup, service & return"
          icon="car-outline"
          color={BLUE}
          bg="#E1F0FF"
          onPress={() => navigation.navigate("PickDrop")}
        />

        <Card
          title="Driver on Demand"
          desc="Professional drivers anytime"
          icon="person-outline"
          color={PURPLE}
          bg="#F2E8FF"
          onPress={() => navigation.navigate("Driver")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: DARK,
  },

  headerSub: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },

  locationBar: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2E7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD2B7",
  },

  locationText: {
    marginHorizontal: 6,
    fontSize: 12,
    color: ORANGE,
    fontWeight: "600",
  },

  scroll: { flex: 1, paddingHorizontal: 16 },

  chipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
  },

  chip: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
  },

  chipText: { marginLeft: 6, fontSize: 12, color: MUTED },

  card: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardLeft: { width: "70%" },

  cardTitle: { fontSize: 18, fontWeight: "800", color: DARK },

  cardSub: { marginTop: 4, color: MUTED, fontSize: 13 },

  tag: {
    flexDirection: "row",
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "flex-start",
  },

  tagText: { marginLeft: 4, fontSize: 10, fontWeight: "700" },
});
