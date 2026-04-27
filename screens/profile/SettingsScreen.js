// screens/profile/SettingsScreen.js

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";

const COLORS = {
  primary: "#00A86B",
  background: "#F5F6F8",
  white: "#FFFFFF",
  textDark: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "Are you sure you want to clear app cache?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", onPress: () => Alert.alert("Success", "Cache cleared successfully") },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your data will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.prompt("Confirm", "Type DELETE to confirm", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Confirm",
                onPress: async (text) => {
                  if (text === "DELETE") {
                    // Handle account deletion
                    await auth().currentUser?.delete();
                  } else {
                    Alert.alert("Error", "Please type DELETE to confirm");
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const SettingRow = ({ icon, title, subtitle, onPress, color = COLORS.textDark, showArrow = true, rightComponent }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress && !rightComponent}>
      <View style={[styles.settingIcon, { backgroundColor: (color || COLORS.primary) + "15" }]}>
        <Ionicons name={icon} size={20} color={color || COLORS.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, color === COLORS.error && { color }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <SettingRow
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme"
            color={COLORS.purple}
            showArrow={false}
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#E5E7EB", true: COLORS.primary + "50" }}
                thumbColor={darkMode ? COLORS.primary : "#9CA3AF"}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="language"
            title="Language"
            subtitle="English"
            color={COLORS.blue}
            onPress={() => Alert.alert("Language", "More languages coming soon!")}
          />
        </View>

        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.section}>
          <SettingRow
            icon="finger-print"
            title="Biometric Login"
            subtitle="Use fingerprint or face ID"
            color={COLORS.primary}
            showArrow={false}
            rightComponent={
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: "#E5E7EB", true: COLORS.primary + "50" }}
                thumbColor={biometric ? COLORS.primary : "#9CA3AF"}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="lock-closed"
            title="Change Password"
            onPress={() => Alert.alert("Password", "Password change feature coming soon!")}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-checkmark"
            title="Two-Factor Authentication"
            subtitle="Not enabled"
            onPress={() => Alert.alert("2FA", "Two-factor authentication coming soon!")}
          />
        </View>

        {/* Data & Storage */}
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        <View style={styles.section}>
          <SettingRow icon="cloud-download" title="Download My Data" onPress={() => Alert.alert("Download", "Your data will be emailed to you.")} />
          <View style={styles.divider} />
          <SettingRow icon="trash-bin" title="Clear Cache" subtitle="Free up storage space" onPress={handleClearCache} />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <SettingRow icon="log-out" title="Logout" color={COLORS.textSecondary} onPress={() => auth().signOut()} />
          <View style={styles.divider} />
          <SettingRow icon="close-circle" title="Delete Account" color={COLORS.error} onPress={handleDeleteAccount} />
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
  settingRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  settingIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  settingInfo: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 15, fontWeight: "500", color: "#111111" },
  settingSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginLeft: 68 },
});