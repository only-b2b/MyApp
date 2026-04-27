// components/NearbyPlacesSheet.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  textDark: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  white: "#FFFFFF",
  background: "#F5F6F8",
  cardBg: "#F9FAFB",
  divider: "#EEEEEE",
  lightGray: "#E5E7EB",
  red: "#E53935",
  orange: "#F59E0B",
  shadow: "#000000",
};

export default function NearbyPlacesSheet({
  visible,
  onClose,
  places,
  loading,
  category,
  onSelectPlace,
}) {
  if (!visible) return null;

  const getCategoryIcon = (cat) => {
    const icons = {
      Airport: "airplane",
      Hospital: "medkit",
      Mall: "cart",
      College: "school",
      Restaurant: "restaurant",
      Temple: "flower",
      Station: "train",
      Park: "leaf",
      Gym: "fitness",
      Hotel: "bed",
    };
    return icons[cat] || "location";
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Airport: "#3B82F6",
      Hospital: "#E53935",
      Mall: "#F59E0B",
      College: "#8B5CF6",
      Restaurant: "#F97316",
      Temple: "#EC4899",
      Station: "#06B6D4",
      Park: "#10B981",
      Gym: "#EF4444",
      Hotel: "#6366F1",
    };
    return colors[cat] || COLORS.primary;
  };

  const categoryColor = getCategoryColor(category);

  const renderPlace = ({ item, index }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => onSelectPlace(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.placeIcon, { backgroundColor: categoryColor + "15" }]}>
        <Ionicons name={getCategoryIcon(category)} size={20} color={categoryColor} />
      </View>

      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.placeAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <View style={styles.placeMetaRow}>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={10} color={COLORS.primary} />
            <Text style={styles.distanceText}>{item.distance} km</Text>
          </View>
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={COLORS.orange} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
          {item.isOpen !== null && (
            <Text
              style={[
                styles.openStatus,
                { color: item.isOpen ? COLORS.primary : COLORS.red },
              ]}
            >
              {item.isOpen ? "Open" : "Closed"}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={[styles.headerIcon, { backgroundColor: categoryColor + "15" }]}>
                <Ionicons name={getCategoryIcon(category)} size={22} color={categoryColor} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Nearby {category}s</Text>
                <Text style={styles.headerSubtitle}>
                  {loading
                    ? "Searching..."
                    : `${places.length} found near you`}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Finding nearest {category.toLowerCase()}s...</Text>
            </View>
          ) : places.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No {category.toLowerCase()}s found</Text>
              <Text style={styles.emptySubtitle}>Try expanding your search area</Text>
            </View>
          ) : (
            <FlatList
              data={places}
              keyExtractor={(item) => item.id}
              renderItem={renderPlace}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  placeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  placeAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  placeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 10,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 50,
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  openStatus: {
    fontSize: 11,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});