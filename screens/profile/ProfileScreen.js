// screens/profile/ProfileScreen.js

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";

const { width } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  primaryDark: "#008F5B",
  white: "#FFFFFF",
  background: "#F5F6F8",
  card: "#FFFFFF",
  surface: "#F9FAFB",
  border: "#E5E7EB",
  divider: "#F0F0F0",
  textDark: "#111111",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  orange: "#F59E0B",
  pink: "#EC4899",
  shadow: "#000000",
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 100 };

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "₹0";
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
};

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { id: "edit_profile", label: "Edit Profile", icon: "person-outline", color: COLORS.primary },
      { id: "ride_history", label: "Ride History", icon: "time-outline", color: COLORS.blue, badge: true },
      { id: "saved_places", label: "Saved Places", icon: "bookmark-outline", color: COLORS.purple },
      { id: "payment", label: "Payment Methods", icon: "card-outline", color: COLORS.orange },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "notifications", label: "Notifications", icon: "notifications-outline", color: COLORS.orange },
      { id: "language", label: "Language", icon: "language-outline", color: COLORS.info },
      { id: "theme", label: "App Theme", icon: "color-palette-outline", color: COLORS.pink },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help & Support", icon: "help-circle-outline", color: COLORS.primary },
      { id: "about", label: "About Us", icon: "information-circle-outline", color: COLORS.textSecondary },
      { id: "terms", label: "Terms & Privacy", icon: "document-text-outline", color: COLORS.textSecondary },
      { id: "rate_app", label: "Rate the App", icon: "star-outline", color: COLORS.warning },
    ],
  },
];

const AVATAR_COLORS = ["#00A86B", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#06B6D4", "#10B981"];

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // ✅ FIX 1: Store user UID only (stable reference)
  const userRef = useRef(auth().currentUser);
  const user = userRef.current;

  // ✅ FIX 2: Track modal state with IMMEDIATE ref update
  const isModalOpenRef = useRef(false);
  const isFetchingRef = useRef(false);
  const hasFetchedOnce = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: null,
    avatarColor: AVATAR_COLORS[0],
  });

  // ✅ FIX 3: Separate modal states with stable initial values
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // ✅ FIX 4: Form state is ONLY set when modal opens, NOT during fetch
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);

  const [walletData, setWalletData] = useState({
    totalAmount: 0,
    totalRides: 0,
    rewards: 150,
  });

  // ✅ FIX 5: Update ref IMMEDIATELY (not in useEffect)
  const updateModalRef = useCallback((isOpen) => {
    isModalOpenRef.current = isOpen;
  }, []);

  // ✅ FIX 6: Fetch function that NEVER touches form state
  const fetchUserData = useCallback(async (forceRefresh = false) => {
    // Guard against concurrent fetches
    if (isFetchingRef.current) {
      console.log("⏭️ Skipping: Already fetching");
      return;
    }
    
    // Guard against fetch when modal is open
    if (isModalOpenRef.current) {
      console.log("⏭️ Skipping: Modal is open");
      return;
    }
    
    // Guard against unnecessary refetch
    if (hasFetchedOnce.current && !forceRefresh) {
      console.log("⏭️ Skipping: Already fetched");
      return;
    }

    isFetchingRef.current = true;
    console.log("🔄 Fetching user data...");

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log("❌ No user found");
        return;
      }

      const ridesRes = await fetch(
        `${API_BASE_URL}/orders/completed?firebase_uid=${currentUser.uid}`
      );
      const ridesData = await ridesRes.json();

      let totalSpent = 0;
      if (Array.isArray(ridesData) && ridesData.length > 0) {
        totalSpent = ridesData.reduce((sum, ride) => {
          const price = parseFloat(ride.price) || parseFloat(ride.amount) || 0;
          return sum + price;
        }, 0);
      }

      // ✅ Only update wallet and profile data, NOT form data
      setWalletData({
        totalAmount: totalSpent,
        totalRides: Array.isArray(ridesData) ? ridesData.length : 0,
        rewards: 150,
      });

      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      setUserProfile({
        name: currentUser.displayName || "User",
        email: currentUser.email || "",
        phone: currentUser.phoneNumber || "",
        avatar: currentUser.photoURL || null,
        avatarColor: randomColor,
      });

      hasFetchedOnce.current = true;
      console.log("✅ Fetch complete");
    } catch (err) {
      console.log("❌ Fetch error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []); // ✅ No dependencies - uses refs and gets fresh user

  // ✅ FIX 7: Initial fetch only once on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // ✅ FIX 8: Navigation focus - only refresh if not modal open
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Only allow pull-to-refresh, no auto refresh on focus
      console.log("📱 Screen focused, modal open:", isModalOpenRef.current);
    });
    return unsubscribe;
  }, [navigation]);

  // ✅ FIX 9: Manual refresh with guards
  const onRefresh = useCallback(async () => {
    if (isModalOpenRef.current) {
      console.log("⏭️ Refresh blocked: Modal open");
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    await fetchUserData(true);
    setRefreshing(false);
  }, [fetchUserData]);

  // ✅ FIX 10: Open edit modal - initialize form state HERE
  const handleOpenEditModal = useCallback(() => {
    // Update ref IMMEDIATELY before state change
    updateModalRef(true);
    
    // Initialize form with current profile values
    setEditForm({
      name: userProfile.name,
      email: userProfile.email,
    });
    
    setShowEditModal(true);
  }, [userProfile.name, userProfile.email, updateModalRef]);

  // ✅ FIX 11: Close edit modal - update ref IMMEDIATELY
  const handleCloseEditModal = useCallback(() => {
    Keyboard.dismiss();
    setShowEditModal(false);
    
    // Small delay to ensure modal animation completes
    setTimeout(() => {
      updateModalRef(false);
    }, 300);
  }, [updateModalRef]);

  // ✅ FIX 12: Open avatar modal
  const handleOpenAvatarModal = useCallback(() => {
    updateModalRef(true);
    setShowAvatarModal(true);
  }, [updateModalRef]);

  // ✅ FIX 13: Close avatar modal
  const handleCloseAvatarModal = useCallback(() => {
    setShowAvatarModal(false);
    setTimeout(() => {
      updateModalRef(false);
    }, 300);
  }, [updateModalRef]);

  // ✅ FIX 14: Form input handlers - isolated from fetch
  const handleNameChange = useCallback((text) => {
    setEditForm(prev => ({ ...prev, name: text }));
  }, []);

  const handleEmailChange = useCallback((text) => {
    setEditForm(prev => ({ ...prev, email: text }));
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => auth().signOut() },
    ]);
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUserProfile((prev) => ({ ...prev, avatar: result.assets[0].uri }));
        handleCloseAvatarModal();
      }
    } catch (error) {
      console.log("Image picker error:", error);
    }
  }, [handleCloseAvatarModal]);

  const handleSelectAvatarColor = useCallback((color) => {
    setUserProfile((prev) => ({ ...prev, avatar: null, avatarColor: color }));
    handleCloseAvatarModal();
  }, [handleCloseAvatarModal]);

  // ✅ FIX 15: Save profile - properly update both states
  const handleSaveProfile = useCallback(async () => {
    if (!editForm.name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.updateProfile({ displayName: editForm.name.trim() });
      }
      
      // Update profile state
      setUserProfile((prev) => ({
        ...prev,
        name: editForm.name.trim(),
        email: editForm.email,
      }));
      
      handleCloseEditModal();
      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      console.log("Save error:", err);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [editForm.name, editForm.email, handleCloseEditModal]);

  const handleMenuPress = useCallback((itemId) => {
    switch (itemId) {
      case "edit_profile":
        handleOpenEditModal();
        break;
      case "ride_history":
        navigation.navigate("RideHistory");
        break;
      case "saved_places":
        navigation.navigate("SavedPlaces");
        break;
      case "payment":
        navigation.navigate("PaymentMethods");
        break;
      case "notifications":
        navigation.navigate("NotificationSettings");
        break;
      case "help":
        navigation.navigate("HelpSupport");
        break;
      case "about":
        navigation.navigate("AboutUs");
        break;
      case "terms":
        navigation.navigate("TermsPrivacy");
        break;
      case "rate_app":
        Alert.alert("Rate Us", "Thank you! Redirecting to app store...");
        break;
      default:
        Alert.alert("Coming Soon", "This feature will be available soon!");
    }
  }, [navigation, handleOpenEditModal]);

  // ==================== COMPONENTS ====================
  
  const AvatarSection = useMemo(() => {
    const initials = userProfile.name
      ? userProfile.name.charAt(0).toUpperCase()
      : userProfile.phone?.slice(-2) || "U";

    return (
      <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={handleOpenAvatarModal} 
        activeOpacity={0.8}
      >
        {userProfile.avatar ? (
          <Image source={{ uri: userProfile.avatar }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: userProfile.avatarColor }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.avatarEditBadge}>
          <Ionicons name="camera" size={12} color={COLORS.white} />
        </View>
      </TouchableOpacity>
    );
  }, [userProfile.name, userProfile.phone, userProfile.avatar, userProfile.avatarColor, handleOpenAvatarModal]);

  const WalletCard = useMemo(() => (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.walletCard}>
      <View style={styles.walletMainSection}>
        <View style={styles.walletIconContainer}>
          <Ionicons name="wallet" size={28} color={COLORS.white} />
        </View>
        <View style={styles.walletAmountContainer}>
          <Text style={styles.walletLabel}>Total Amount Spent</Text>
          <Text style={styles.walletAmount}>{formatCurrency(walletData.totalAmount)}</Text>
          <Text style={styles.walletSubtext}>
            Across {walletData.totalRides} {walletData.totalRides === 1 ? "ride" : "rides"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewDetailsBtn}
        onPress={() => navigation.navigate("RideHistory")}
        activeOpacity={0.8}
      >
        <Text style={styles.viewDetailsBtnText}>View Ride History</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.walletStatsRow}>
        <View style={styles.walletStatBox}>
          <View style={[styles.statIconBox, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="car" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.statTextBox}>
            <Text style={styles.statBoxValue}>{walletData.totalRides}</Text>
            <Text style={styles.statBoxLabel}>Total Rides</Text>
          </View>
        </View>

        <View style={styles.walletStatBoxDivider} />

        <View style={styles.walletStatBox}>
          <View style={[styles.statIconBox, { backgroundColor: COLORS.warningBg }]}>
            <Ionicons name="gift" size={20} color={COLORS.orange} />
          </View>
          <View style={styles.statTextBox}>
            <Text style={styles.statBoxValue}>{walletData.rewards}</Text>
            <Text style={styles.statBoxLabel}>Rewards</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  ), [walletData, navigation]);

  const QuickActions = useMemo(() => (
    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.quickActionsContainer}>
      {[
        { icon: "time", color: COLORS.blue, bg: COLORS.infoBg, label: "History", screen: "RideHistory" },
        { icon: "card", color: COLORS.orange, bg: COLORS.warningBg, label: "Payments", screen: "PaymentMethods" },
        { icon: "bookmark", color: COLORS.purple, bg: "rgba(139,92,246,0.1)", label: "Places", screen: "SavedPlaces" },
        { icon: "help-circle", color: COLORS.primary, bg: COLORS.primaryLight, label: "Help", screen: "HelpSupport" },
      ].map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.quickActionItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={22} color={item.color} />
          </View>
          <Text style={styles.quickActionLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  ), [navigation]);

  const renderMenuSection = useCallback(({ section, index }) => (
    <Animated.View 
      key={section.title}
      entering={FadeInDown.delay(400 + index * 100).duration(400)} 
      style={styles.menuSection}
    >
      <Text style={styles.menuSectionTitle}>{section.title}</Text>
      <View style={styles.menuCard}>
        {section.items.map((item, idx) => (
          <React.Fragment key={item.id}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuPress(item.id)} 
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + "15" }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge && walletData.totalRides > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{walletData.totalRides}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
            {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  ), [handleMenuPress, walletData.totalRides]);

  // ==================== MODALS ====================

  // ✅ FIX 16: Edit Modal as separate memoized component
  const EditProfileModal = useMemo(() => (
    <Modal 
      visible={showEditModal} 
      animationType="slide" 
      transparent 
      onRequestClose={handleCloseEditModal}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleCloseEditModal}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity style={styles.modalClose} onPress={handleCloseEditModal}>
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={handleNameChange}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>{userProfile.phone || "Not set"}</Text>
                <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
              </View>
              <Text style={styles.inputHint}>Phone number cannot be changed</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseEditModal}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [showEditModal, editForm, saving, userProfile.phone, handleCloseEditModal, handleNameChange, handleEmailChange, handleSaveProfile]);

  const AvatarModal = useMemo(() => (
    <Modal 
      visible={showAvatarModal} 
      animationType="slide" 
      transparent 
      onRequestClose={handleCloseAvatarModal}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleCloseAvatarModal}
        />
        <View style={styles.avatarModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Avatar</Text>
            <TouchableOpacity style={styles.modalClose} onPress={handleCloseAvatarModal}>
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarModalContent}>
            <TouchableOpacity style={styles.uploadPhotoBtn} onPress={handlePickImage}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
              <Text style={styles.uploadPhotoText}>Upload Photo</Text>
            </TouchableOpacity>

            <Text style={styles.avatarSectionLabel}>Or choose a color</Text>

            <View style={styles.colorGrid}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    userProfile.avatarColor === color && !userProfile.avatar && styles.colorOptionActive,
                  ]}
                  onPress={() => handleSelectAvatarColor(color)}
                >
                  {userProfile.avatarColor === color && !userProfile.avatar && (
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  ), [showAvatarModal, userProfile.avatarColor, userProfile.avatar, handleCloseAvatarModal, handlePickImage, handleSelectAvatarColor]);

  // ==================== LOADING STATE ====================
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading profile...</Text>
      </View>
    );
  }

  // ==================== MAIN RENDER ====================
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary} 
            colors={[COLORS.primary]} 
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate("Settings")}>
              <Ionicons name="settings-outline" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            {AvatarSection}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name || "User"}</Text>
              <Text style={styles.profilePhone}>{userProfile.phone || "No phone"}</Text>
              {userProfile.email && <Text style={styles.profileEmail}>{userProfile.email}</Text>}
            </View>
            <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditModal}>
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {WalletCard}
        {QuickActions}

        {MENU_SECTIONS.map((section, index) => renderMenuSection({ section, index }))}

        <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {EditProfileModal}
      {AvatarModal}
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F6F8" },
  loaderText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  header: { backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111111" },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatarContainer: { position: "relative" },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  avatarEditBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#00A86B", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#FFFFFF" },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 20, fontWeight: "700", color: "#111111" },
  profilePhone: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  profileEmail: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  editProfileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,168,107,0.1)", justifyContent: "center", alignItems: "center" },
  walletCard: { backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16, elevation: 4 },
  walletMainSection: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  walletIconContainer: { width: 60, height: 60, borderRadius: 16, backgroundColor: "#00A86B", justifyContent: "center", alignItems: "center" },
  walletAmountContainer: { flex: 1, marginLeft: 16 },
  walletLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  walletAmount: { fontSize: 28, fontWeight: "800", color: "#111111", marginTop: 2 },
  walletSubtext: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  viewDetailsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#00A86B", paddingVertical: 12, borderRadius: 12, marginBottom: 16 },
  viewDetailsBtnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginRight: 8 },
  walletStatsRow: { flexDirection: "row", backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12 },
  walletStatBox: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  walletStatBoxDivider: { width: 1, height: 40, backgroundColor: "#E5E7EB" },
  statIconBox: { width: 40, height: 40, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  statTextBox: { marginLeft: 8 },
  statBoxValue: { fontSize: 18, fontWeight: "700", color: "#111111" },
  statBoxLabel: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  quickActionsContainer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 16 },
  quickActionItem: { alignItems: "center", flex: 1 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  quickActionLabel: { fontSize: 12, fontWeight: "500", color: "#6B7280" },
  menuSection: { marginTop: 24, paddingHorizontal: 16 },
  menuSectionTitle: { fontSize: 13, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  menuCard: { backgroundColor: "#FFFFFF", borderRadius: 20, overflow: "hidden", elevation: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: "#111111" },
  menuBadge: { backgroundColor: "#00A86B", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, marginRight: 8 },
  menuBadgeText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  menuDivider: { height: 1, backgroundColor: "#F0F0F0", marginLeft: 72 },
  logoutSection: { marginTop: 32, paddingHorizontal: 16 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", paddingVertical: 16, borderRadius: 16 },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444", marginLeft: 8 },
  versionText: { textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 20 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBackdrop: { flex: 1 },
  modalContainer: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === "ios" ? 34 : 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  modalContent: { padding: 16 },
  modalFooter: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  input: { backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#111111", borderWidth: 1, borderColor: "#E5E7EB" },
  inputDisabled: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", opacity: 0.7 },
  inputDisabledText: { fontSize: 15, color: "#6B7280" },
  inputHint: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#F9FAFB", alignItems: "center", marginRight: 8 },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#00A86B", alignItems: "center", marginLeft: 8 },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  avatarModalContainer: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === "ios" ? 34 : 24 },
  avatarModalContent: { padding: 16 },
  uploadPhotoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,168,107,0.1)", paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: "#00A86B", marginBottom: 20 },
  uploadPhotoText: { fontSize: 15, fontWeight: "600", color: "#00A86B", marginLeft: 8 },
  avatarSectionLabel: { fontSize: 13, fontWeight: "500", color: "#6B7280", textAlign: "center", marginBottom: 16 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  colorOption: { width: 50, height: 50, borderRadius: 25, margin: 8, justifyContent: "center", alignItems: "center" },
  colorOptionActive: { borderWidth: 3, borderColor: "#FFFFFF", elevation: 6 },
});