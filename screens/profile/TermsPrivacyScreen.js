// screens/profile/TermsPrivacyScreen.js

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const COLORS = {
  primary: "#00A86B",
  background: "#F5F6F8",
  white: "#FFFFFF",
  textDark: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
};

export default function TermsPrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("terms");

  const termsContent = `
Last Updated: January 2024

1. Acceptance of Terms
By accessing and using the Motors app, you agree to be bound by these Terms of Service.

2. Service Description
Motors provides on-demand transportation and car care services connecting users with independent drivers and technicians.

3. User Responsibilities
- You must provide accurate information during registration
- You are responsible for maintaining the confidentiality of your account
- You agree to pay all charges incurred through your account

4. Payment Terms
- All payments are processed securely through our payment partners
- Cancellation fees may apply as per our cancellation policy
- Pricing may vary based on demand, distance, and service type

5. Safety Guidelines
- Always verify driver/technician identity before service
- Share your trip details with family/friends
- Rate your experience to help improve our service

6. Limitation of Liability
Motors is not liable for any indirect, incidental, or consequential damages arising from the use of our services.

7. Changes to Terms
We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.
  `;

  const privacyContent = `
Last Updated: January 2024

1. Information We Collect
- Personal information (name, email, phone number)
- Location data for providing services
- Payment information
- Device information and usage data

2. How We Use Your Information
- To provide and improve our services
- To process payments
- To communicate with you
- To ensure safety and security

3. Information Sharing
We do not sell your personal information. We may share data with:
- Service providers (drivers, technicians)
- Payment processors
- Law enforcement when required by law

4. Data Security
We implement industry-standard security measures to protect your data, including encryption and secure servers.

5. Your Rights
- Access your personal data
- Request data correction
- Delete your account
- Opt-out of marketing communications

6. Cookies and Tracking
We use cookies and similar technologies to improve user experience and analyze app usage.

7. Contact Us
For privacy-related inquiries, contact us at privacy@motors.com
  `;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "terms" && styles.tabActive]}
          onPress={() => setActiveTab("terms")}
        >
          <Text style={[styles.tabText, activeTab === "terms" && styles.tabTextActive]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "privacy" && styles.tabActive]}
          onPress={() => setActiveTab("privacy")}
        >
          <Text style={[styles.tabText, activeTab === "privacy" && styles.tabTextActive]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.contentText}>
            {activeTab === "terms" ? termsContent : privacyContent}
          </Text>
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
  tabContainer: { flexDirection: "row", backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingBottom: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 8, marginHorizontal: 4 },
  tabActive: { backgroundColor: "#00A86B" },
  tabText: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  tabTextActive: { color: "#FFFFFF" },
  content: { flex: 1, padding: 16 },
  contentCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20 },
  contentText: { fontSize: 14, color: "#4B5563", lineHeight: 24 },
});