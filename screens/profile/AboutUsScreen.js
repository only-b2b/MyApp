// screens/profile/AboutUsScreen.js

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from "react-native";
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

export default function AboutUsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const socialLinks = [
    { icon: "logo-facebook", url: "https://facebook.com", color: "#1877F2" },
    { icon: "logo-twitter", url: "https://twitter.com", color: "#1DA1F2" },
    { icon: "logo-instagram", url: "https://instagram.com", color: "#E4405F" },
    { icon: "logo-linkedin", url: "https://linkedin.com", color: "#0A66C2" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Motors</Text>
          <Text style={styles.tagline}>Your Trusted Ride Partner</Text>
        </View>

        {/* About Text */}
        <View style={styles.section}>
          <Text style={styles.aboutText}>
            Motors is a premium ride-hailing service dedicated to providing safe, reliable, and comfortable transportation solutions. Our mission is to revolutionize urban mobility while maintaining the highest standards of service.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1M+</Text>
            <Text style={styles.statLabel}>Rides Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>50K+</Text>
            <Text style={styles.statLabel}>Happy Customers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>10K+</Text>
            <Text style={styles.statLabel}>Verified Drivers</Text>
          </View>
        </View>

        {/* Features */}
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <View style={styles.featuresContainer}>
          {[
            { icon: "shield-checkmark", title: "Safe Rides", desc: "Verified drivers & real-time tracking" },
            { icon: "time", title: "24/7 Service", desc: "Available round the clock" },
            { icon: "cash", title: "Fair Pricing", desc: "Transparent & competitive fares" },
            { icon: "heart", title: "Customer First", desc: "Dedicated support team" },
          ].map((feature) => (
            <View key={feature.title} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Social Links */}
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <View style={styles.socialContainer}>
          {socialLinks.map((social) => (
            <TouchableOpacity
              key={social.icon}
              style={[styles.socialBtn, { backgroundColor: social.color + "15" }]}
              onPress={() => Linking.openURL(social.url)}
            >
              <Ionicons name={social.icon} size={24} color={social.color} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactLabel}>Contact Us</Text>
          <Text style={styles.contactText}>support@motors.com</Text>
          <Text style={styles.contactText}>+91 1234 567 890</Text>
        </View>

        <Text style={styles.copyright}>© 2024 Motors. All rights reserved.</Text>

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
  logoSection: { alignItems: "center", paddingVertical: 32 },
  logoContainer: { width: 100, height: 100, borderRadius: 24, backgroundColor: "#00A86B15", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: "800", color: "#111111" },
  tagline: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  section: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20 },
  aboutText: { fontSize: 15, color: "#6B7280", lineHeight: 24, textAlign: "center" },
  statsContainer: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800", color: "#00A86B" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  statDivider: { width: 1, backgroundColor: "#E5E7EB" },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", marginBottom: 12 },
  featuresContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 8, marginBottom: 20 },
  featureItem: { flexDirection: "row", alignItems: "center", padding: 12 },
  featureIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#00A86B15", justifyContent: "center", alignItems: "center" },
  featureText: { flex: 1, marginLeft: 12 },
  featureTitle: { fontSize: 15, fontWeight: "600", color: "#111111" },
  featureDesc: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  socialContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 24 },
  socialBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginHorizontal: 8 },
  contactSection: { alignItems: "center", marginBottom: 24 },
  contactLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  contactText: { fontSize: 14, color: "#111111", marginTop: 4 },
  copyright: { textAlign: "center", fontSize: 12, color: "#9CA3AF" },
});