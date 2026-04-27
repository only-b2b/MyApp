// screens/profile/PaymentMethodsScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const COLORS = {
  primary: "#00A86B",
  background: "#F5F6F8",
  white: "#FFFFFF",
  textDark: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#3B82F6",
};

export default function PaymentMethodsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState("cash");

  const [paymentMethods] = useState([
    { id: "cash", type: "cash", name: "Cash", icon: "cash-outline", color: COLORS.success },
    { id: "upi", type: "upi", name: "UPI", icon: "phone-portrait-outline", color: COLORS.blue },
  ]);

  const [savedCards] = useState([
    // { id: "card1", type: "card", last4: "4242", brand: "Visa", expiry: "12/25" },
  ]);

  const handleSetDefault = (methodId) => {
    setDefaultMethod(methodId);
    Alert.alert("Success", "Default payment method updated");
  };

  const handleDeleteCard = (cardId) => {
    Alert.alert("Delete Card", "Are you sure you want to remove this card?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {} },
    ]);
  };

  const PaymentMethodCard = ({ method, isDefault }) => (
    <TouchableOpacity
      style={[styles.methodCard, isDefault && styles.methodCardActive]}
      onPress={() => handleSetDefault(method.id)}
    >
      <View style={[styles.methodIcon, { backgroundColor: method.color + "15" }]}>
        <Ionicons name={method.icon} size={24} color={method.color} />
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{method.name}</Text>
        {isDefault && <Text style={styles.defaultBadge}>Default</Text>}
      </View>
      <View style={[styles.radioOuter, isDefault && styles.radioOuterActive]}>
        {isDefault && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  const SavedCardItem = ({ card }) => (
    <View style={styles.cardItem}>
      <View style={styles.cardIcon}>
        <Ionicons name="card" size={24} color={COLORS.blue} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand}>
          {card.brand} •••• {card.last4}
        </Text>
        <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteCard(card.id)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Payment Options</Text>
        <View style={styles.section}>
          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} isDefault={defaultMethod === method.id} />
          ))}
        </View>

        {/* Saved Cards */}
        <Text style={styles.sectionTitle}>Saved Cards</Text>
        <View style={styles.section}>
          {savedCards.length > 0 ? (
            savedCards.map((card) => <SavedCardItem key={card.id} card={card} />)
          ) : (
            <View style={styles.emptyCards}>
              <Ionicons name="card-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No saved cards</Text>
              <Text style={styles.emptySubtext}>Add a card for faster payments</Text>
            </View>
          )}

          <TouchableOpacity style={styles.addCardBtn} onPress={() => setShowAddCardModal(true)}>
            <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.addCardText}>Add New Card</Text>
          </TouchableOpacity>
        </View>

        {/* UPI Section */}
        <Text style={styles.sectionTitle}>UPI</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.upiOption}>
            <View style={styles.upiIcon}>
              <Text style={styles.upiIconText}>G</Text>
            </View>
            <Text style={styles.upiName}>Google Pay</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.upiOption}>
            <View style={[styles.upiIcon, { backgroundColor: "#5F259F15" }]}>
              <Text style={[styles.upiIconText, { color: "#5F259F" }]}>P</Text>
            </View>
            <Text style={styles.upiName}>PhonePe</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.upiOption}>
            <View style={[styles.upiIcon, { backgroundColor: "#002E6C15" }]}>
              <Text style={[styles.upiIconText, { color: "#002E6C" }]}>B</Text>
            </View>
            <Text style={styles.upiName}>BHIM UPI</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={showAddCardModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Card</Text>
              <TouchableOpacity onPress={() => setShowAddCardModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput style={styles.input} placeholder="1234 5678 9012 3456" keyboardType="numeric" />
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Expiry</Text>
                  <TextInput style={styles.input} placeholder="MM/YY" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput style={styles.input} placeholder="123" keyboardType="numeric" secureTextEntry />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput style={styles.input} placeholder="Name on card" autoCapitalize="characters" />
              </View>
            </View>

            <TouchableOpacity style={styles.saveCardBtn}>
              <Text style={styles.saveCardBtnText}>Save Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", marginBottom: 8, marginTop: 16 },
  section: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 4, overflow: "hidden" },
  methodCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12 },
  methodCardActive: { backgroundColor: "#00A86B10" },
  methodIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodName: { fontSize: 15, fontWeight: "600", color: "#111111" },
  defaultBadge: { fontSize: 11, color: "#00A86B", fontWeight: "500", marginTop: 2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  radioOuterActive: { borderColor: "#00A86B" },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#00A86B" },
  cardItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#3B82F615", justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardBrand: { fontSize: 15, fontWeight: "600", color: "#111111" },
  cardExpiry: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyCards: { alignItems: "center", paddingVertical: 32 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#6B7280", marginTop: 12 },
  emptySubtext: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  addCardBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  addCardText: { fontSize: 15, fontWeight: "600", color: "#00A86B", marginLeft: 8 },
  upiOption: { flexDirection: "row", alignItems: "center", padding: 16 },
  upiIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#4285F415", justifyContent: "center", alignItems: "center" },
  upiIconText: { fontSize: 18, fontWeight: "700", color: "#4285F4" },
  upiName: { flex: 1, fontSize: 15, fontWeight: "500", color: "#111111", marginLeft: 12 },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginLeft: 68 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 34 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  modalContent: { marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  input: { backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: "#E5E7EB" },
  inputRow: { flexDirection: "row" },
  saveCardBtn: { backgroundColor: "#00A86B", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  saveCardBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});