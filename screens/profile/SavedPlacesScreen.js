// screens/profile/SavedPlacesScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";

const COLORS = {
  primary: "#00A86B",
  background: "#F5F6F8",
  white: "#FFFFFF",
  textDark: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  orange: "#F59E0B",
};

const PLACE_TYPES = [
  { id: "home", label: "Home", icon: "home", color: COLORS.primary },
  { id: "work", label: "Work", icon: "briefcase", color: COLORS.blue },
  { id: "gym", label: "Gym", icon: "fitness", color: COLORS.orange },
  { id: "other", label: "Other", icon: "location", color: COLORS.purple },
];

export default function SavedPlacesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = auth().currentUser;

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlace, setNewPlace] = useState({ type: "home", name: "", address: "" });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/saved-places?firebase_uid=${user?.uid}`);
      const data = await res.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Fetch places error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlace = async () => {
    if (!newPlace.name || !newPlace.address) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/saved-places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user?.uid,
          ...newPlace,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewPlace({ type: "home", name: "", address: "" });
        fetchPlaces();
        Alert.alert("Success", "Place added successfully");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to add place");
    }
  };

  const handleDeletePlace = (placeId) => {
    Alert.alert("Delete Place", "Are you sure you want to delete this place?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API_BASE_URL}/users/saved-places/${placeId}`, {
              method: "DELETE",
            });
            fetchPlaces();
          } catch (err) {
            Alert.alert("Error", "Failed to delete place");
          }
        },
      },
    ]);
  };

  const getPlaceConfig = (type) => PLACE_TYPES.find((p) => p.id === type) || PLACE_TYPES[3];

  const PlaceCard = ({ item }) => {
    const config = getPlaceConfig(item.type);

    return (
      <View style={styles.placeCard}>
        <View style={[styles.placeIcon, { backgroundColor: config.color + "15" }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{item.name || config.label}</Text>
          <Text style={styles.placeAddress} numberOfLines={2}>
            {item.address}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePlace(item.id)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Places</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => <PlaceCard item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No saved places</Text>
            <Text style={styles.emptySubtext}>Add your favorite places for quick booking</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Add Place</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Place Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Place</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Place Type */}
              <Text style={styles.inputLabel}>Place Type</Text>
              <View style={styles.typeGrid}>
                {PLACE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeItem,
                      newPlace.type === type.id && { backgroundColor: type.color + "15", borderColor: type.color },
                    ]}
                    onPress={() => setNewPlace({ ...newPlace, type: type.id })}
                  >
                    <Ionicons name={type.icon} size={20} color={type.color} />
                    <Text style={[styles.typeLabel, newPlace.type === type.id && { color: type.color }]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Name */}
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., My Home"
                placeholderTextColor={COLORS.textMuted}
                value={newPlace.name}
                onChangeText={(text) => setNewPlace({ ...newPlace, name: text })}
              />

              {/* Address */}
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="Enter full address"
                placeholderTextColor={COLORS.textMuted}
                value={newPlace.address}
                onChangeText={(text) => setNewPlace({ ...newPlace, address: text })}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddPlace}>
              <Text style={styles.saveBtnText}>Save Place</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#00A86B15", justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16 },
  placeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12 },
  placeIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  placeInfo: { flex: 1, marginLeft: 12 },
  placeName: { fontSize: 15, fontWeight: "600", color: "#111111" },
  placeAddress: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  deleteBtn: { padding: 8 },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 16 },
  emptySubtext: { fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#00A86B", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  emptyBtnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 34 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  modalContent: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8, marginTop: 16 },
  typeGrid: { flexDirection: "row", justifyContent: "space-between" },
  typeItem: { flex: 1, alignItems: "center", paddingVertical: 12, marginHorizontal: 4, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
  typeLabel: { fontSize: 12, fontWeight: "500", color: "#6B7280", marginTop: 4 },
  input: { backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: "#E5E7EB" },
  saveBtn: { backgroundColor: "#00A86B", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});