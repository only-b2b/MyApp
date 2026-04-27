// screens/profile/HelpSupportScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
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
  blue: "#3B82F6",
};

const FAQ_DATA = [
  {
    question: "How do I book a ride?",
    answer: "Open the app, enter your destination, select a ride type, and tap 'Book Now'. A driver will be assigned to you shortly.",
  },
  {
    question: "How can I cancel my ride?",
    answer: "Go to your active ride, tap on 'Cancel Ride'. Please note that cancellation charges may apply if the driver has already started.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Cash, UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Wallet payments.",
  },
  {
    question: "How do I contact my driver?",
    answer: "Once a driver is assigned, you can call or message them directly from the ride screen using the call/chat buttons.",
  },
  {
    question: "What if I left something in the car?",
    answer: "Go to Ride History, select the ride, and tap 'Report Lost Item'. We'll help connect you with the driver.",
  },
  {
    question: "How do I report an issue with my ride?",
    answer: "Go to Ride History, select the specific ride, and tap 'Report Issue'. Our support team will assist you within 24 hours.",
  },
];

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const filteredFaqs = FAQ_DATA.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContact = (type) => {
    switch (type) {
      case "call":
        Linking.openURL("tel:+911234567890");
        break;
      case "email":
        Linking.openURL("mailto:support@motors.com");
        break;
      case "whatsapp":
        Linking.openURL("whatsapp://send?phone=911234567890");
        break;
    }
  };

  const FaqItem = ({ item, index }) => {
    const isExpanded = expandedFaq === index;

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setExpandedFaq(isExpanded ? null : index)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.textMuted}
          />
        </View>
        {isExpanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => handleContact("call")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#10B98115" }]}>
              <Ionicons name="call" size={24} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>Call Us</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => handleContact("email")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#3B82F615" }]}>
              <Ionicons name="mail" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => handleContact("whatsapp")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#25D36615" }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <Text style={styles.quickActionText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {filteredFaqs.map((faq, index) => (
            <FaqItem key={index} item={faq} index={index} />
          ))}
        </View>

        {/* Other Help Topics */}
        <Text style={styles.sectionTitle}>More Help Topics</Text>
        <View style={styles.topicsContainer}>
          {[
            { icon: "car", label: "Ride Issues", color: COLORS.primary },
            { icon: "card", label: "Payment Help", color: "#F59E0B" },
            { icon: "shield-checkmark", label: "Safety", color: "#EF4444" },
            { icon: "person", label: "Account", color: "#8B5CF6" },
            { icon: "gift", label: "Promotions", color: "#EC4899" },
            { icon: "settings", label: "App Settings", color: "#6B7280" },
          ].map((topic) => (
            <TouchableOpacity key={topic.label} style={styles.topicItem}>
              <View style={[styles.topicIcon, { backgroundColor: topic.color + "15" }]}>
                <Ionicons name={topic.icon} size={22} color={topic.color} />
              </View>
              <Text style={styles.topicLabel}>{topic.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  content: { flex: 1, padding: 16 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#111111" },
  quickActions: { flexDirection: "row", justifyContent: "space-around", marginBottom: 24 },
  quickAction: { alignItems: "center" },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  quickActionText: { fontSize: 13, fontWeight: "500", color: "#6B7280" },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", marginBottom: 12 },
  faqContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  faqItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111111", marginRight: 12 },
  faqAnswer: { fontSize: 14, color: "#6B7280", marginTop: 12, lineHeight: 22 },
  topicsContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" },
  topicItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  topicIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  topicLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: "#111111", marginLeft: 12 },
});