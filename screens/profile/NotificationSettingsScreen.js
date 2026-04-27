// screens/profile/NotificationSettingsScreen.js

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from "react-native";
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
};

export default function NotificationSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    pushEnabled: true,
    rideUpdates: true,
    promotions: false,
    priceDrops: true,
    newsletter: false,
    smsEnabled: true,
    emailEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingItem = ({ icon, title, description, settingKey, color = COLORS.primary }) => (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: "#E5E7EB", true: COLORS.primary + "50" }}
        thumbColor={settings[settingKey] ? COLORS.primary : "#9CA3AF"}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <View style={styles.section}>
          <SettingItem
            icon="notifications"
            title="Enable Notifications"
            description="Receive push notifications"
            settingKey="pushEnabled"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="car"
            title="Ride Updates"
            description="Driver arrival, ride status"
            settingKey="rideUpdates"
            color="#3B82F6"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="pricetag"
            title="Promotions"
            description="Offers and discounts"
            settingKey="promotions"
            color="#F59E0B"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="trending-down"
            title="Price Drops"
            description="Surge price alerts"
            settingKey="priceDrops"
            color="#10B981"
          />
        </View>

        {/* Communication */}
        <Text style={styles.sectionTitle}>Communication</Text>
        <View style={styles.section}>
          <SettingItem
            icon="chatbubble"
            title="SMS Notifications"
            description="Ride confirmations via SMS"
            settingKey="smsEnabled"
            color="#8B5CF6"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="mail"
            title="Email Updates"
            description="Receipts and newsletters"
            settingKey="emailEnabled"
            color="#EC4899"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="newspaper"
            title="Newsletter"
            description="Weekly tips and updates"
            settingKey="newsletter"
            color="#6B7280"
          />
        </View>

        {/* Sound & Vibration */}
        <Text style={styles.sectionTitle}>Sound & Vibration</Text>
        <View style={styles.section}>
          <SettingItem
            icon="volume-high"
            title="Sound"
            description="Play notification sounds"
            settingKey="soundEnabled"
            color="#EF4444"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="phone-portrait"
            title="Vibration"
            description="Vibrate on notifications"
            settingKey="vibrationEnabled"
            color="#06B6D4"
          />
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
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", marginBottom: 8, marginTop: 16 },
  section: { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" },
  settingItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  settingIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  settingInfo: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 15, fontWeight: "600", color: "#111111" },
  settingDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginLeft: 72 },
});