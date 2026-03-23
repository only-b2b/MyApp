import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: "#00A86B",
  primaryLight: "rgba(0, 168, 107, 0.1)",
  primaryDark: "#008F5B",
  primaryGradient: ["#00C77B", "#00A86B"],

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

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 100,
};

// ==================== HELPER FUNCTIONS ====================
// Format currency in Indian Rupee format
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "₹0";
  
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  
  // Format with Indian numbering system (lakhs, crores)
  return "₹" + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

// ==================== MENU ITEMS ====================
const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { id: "edit_profile", label: "Edit Profile", icon: "person-outline", color: COLORS.primary },
      
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
    ],
  },
];

// ==================== AVATAR COLORS ====================
const AVATAR_COLORS = [
  "#00A86B", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F59E0B", "#EF4444", "#06B6D4", "#10B981",
];

// ==================== MAIN COMPONENT ====================
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = auth().currentUser;

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: null,
    avatarColor: AVATAR_COLORS[0],
  });

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Wallet Stats - Single Total Value
  const [walletData, setWalletData] = useState({
    totalAmount: 0,
    totalRides: 0,
    rewards: 0,
  });

  // ==================== FETCH DATA ====================
  const fetchUserData = useCallback(async () => {
    try {
      // Fetch completed rides to calculate total
      const ridesRes = await fetch(
        `${API_BASE_URL}/orders/completed?firebase_uid=${user?.uid}`
      );
      const ridesData = await ridesRes.json();

      // Calculate total amount spent (Sum of all ride prices)
      let totalSpent = 0;
      
      if (Array.isArray(ridesData) && ridesData.length > 0) {
        totalSpent = ridesData.reduce((sum, ride) => {
          // Handle different possible price field names
          const price = parseFloat(ride.price) || 
                        parseFloat(ride.amount) || 
                        parseFloat(ride.fare) || 
                        parseFloat(ride.total_price) || 
                        parseFloat(ride.total_amount) || 
                        0;
          return sum + price;
        }, 0);
      }

      console.log("Rides Data:", ridesData);
      console.log("Total Spent Calculated:", totalSpent);

      setWalletData({
        totalAmount: totalSpent,
        totalRides: Array.isArray(ridesData) ? ridesData.length : 0,
        rewards: 150, // Fetch from API if available
      });

      // Set user profile
      setUserProfile({
        name: user?.displayName || "User",
        email: user?.email || "",
        phone: user?.phoneNumber || "",
        avatar: user?.photoURL || null,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      });

      setEditName(user?.displayName || "");
      setEditEmail(user?.email || "");
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation, fetchUserData]);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, [fetchUserData]);

  // ==================== HANDLERS ====================
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await auth().signOut();
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUserProfile((prev) => ({
        ...prev,
        avatar: result.assets[0].uri,
      }));
      setShowAvatarModal(false);
    }
  };

  const handleSelectAvatarColor = (color) => {
    setUserProfile((prev) => ({
      ...prev,
      avatar: null,
      avatarColor: color,
    }));
    setShowAvatarModal(false);
  };

  const handleSaveProfile = async () => {
    try {
      await user.updateProfile({
        displayName: editName,
      });
      setUserProfile((prev) => ({
        ...prev,
        name: editName,
        email: editEmail,
      }));
      setShowEditModal(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleMenuPress = (itemId) => {
    switch (itemId) {
      case "edit_profile":
        setShowEditModal(true);
        break;
      case "ride_history":
        navigation.navigate("RideHistoryScreen");
        break;
      case "saved_places":
        navigation.navigate("SavedPlaces");
        break;
      case "payment":
        navigation.navigate("PaymentMethods");
        break;
      case "help":
        navigation.navigate("Help");
        break;
      default:
        Alert.alert("Coming Soon", "This feature will be available soon!");
    }
  };

  // ==================== RENDER COMPONENTS ====================

  // Avatar Component
  const AvatarSection = () => {
    const initials = userProfile.name
      ? userProfile.name.charAt(0).toUpperCase()
      : userProfile.phone?.slice(-2) || "U";

    return (
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => setShowAvatarModal(true)}
        activeOpacity={0.8}
      >
        {userProfile.avatar ? (
          <Image source={{ uri: userProfile.avatar }} style={styles.avatarImage} />
        ) : (
          <View
            style={[styles.avatarPlaceholder, { backgroundColor: userProfile.avatarColor }]}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.avatarEditBadge}>
          <Ionicons name="camera" size={12} color={COLORS.white} />
        </View>
      </TouchableOpacity>
    );
  };

  // Wallet Card - Single Total Amount (SUM)
  const WalletCard = () => (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      style={styles.walletCard}
    >
      {/* Main Total Section */}
      <View style={styles.walletMainSection}>
        <View style={styles.walletIconContainer}>
          <Ionicons name="wallet" size={28} color={COLORS.white} />
        </View>
        <View style={styles.walletAmountContainer}>
          <Text style={styles.walletLabel}>Total Amount Spent</Text>
          <Text style={styles.walletAmount}>{formatCurrency(walletData.totalAmount)}</Text>
          <Text style={styles.walletSubtext}>
            Across {walletData.totalRides} {walletData.totalRides === 1 ? 'ride' : 'rides'}
          </Text>
        </View>
      </View>

      {/* View Details Button */}
      <TouchableOpacity 
        style={styles.viewDetailsBtn}
        onPress={() => navigation.navigate("RideHistoryScreen")}
        activeOpacity={0.8}
      >
        <Text style={styles.viewDetailsBtnText}>View Ride History</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>

      {/* Stats Row */}
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
  );

  // Quick Actions
  const QuickActions = () => (
    <Animated.View
      entering={FadeInDown.delay(300).duration(400)}
      style={styles.quickActionsContainer}
    >
      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate("RideHistoryScreen")}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.infoBg }]}>
          <Ionicons name="time" size={22} color={COLORS.blue} />
        </View>
        <Text style={styles.quickActionLabel}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate("PaymentMethods")}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warningBg }]}>
          <Ionicons name="card" size={22} color={COLORS.orange} />
        </View>
        <Text style={styles.quickActionLabel}>Payments</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate("SavedPlaces")}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: "rgba(139, 92, 246, 0.1)" }]}>
          <Ionicons name="bookmark" size={22} color={COLORS.purple} />
        </View>
        <Text style={styles.quickActionLabel}>Places</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate("Help")}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLight }]}>
          <Ionicons name="help-circle" size={22} color={COLORS.primary} />
        </View>
        <Text style={styles.quickActionLabel}>Help</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Menu Section
  const MenuSection = ({ section, index }) => (
    <Animated.View
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
  );

  // Edit Profile Modal
  const EditProfileModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>
                  {userProfile.phone || "Not set"}
                </Text>
                <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
              </View>
              <Text style={styles.inputHint}>Phone number cannot be changed</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Avatar Selection Modal
  const AvatarModal = () => (
    <Modal
      visible={showAvatarModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowAvatarModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.avatarModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Avatar</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowAvatarModal(false)}
            >
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarModalContent}>
            <TouchableOpacity
              style={styles.uploadPhotoBtn}
              onPress={handlePickImage}
            >
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
                    userProfile.avatarColor === color && styles.colorOptionActive,
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
  );

  // ==================== MAIN RENDER ====================
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileSection}>
            <AvatarSection />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name || "User"}</Text>
              <Text style={styles.profilePhone}>{userProfile.phone || "No phone"}</Text>
              {userProfile.email && (
                <Text style={styles.profileEmail}>{userProfile.email}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Wallet Card - Total Amount Sum */}
        <WalletCard />

        {/* Quick Actions */}
        <QuickActions />

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section, index) => (
          <MenuSection key={section.title} section={section} index={index} />
        ))}

        {/* Logout Button */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(400)}
          style={styles.logoutSection}
        >
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal />
      <AvatarModal />
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Header
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  // Profile Section
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  profilePhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  // Wallet Card - Updated Styles
  walletCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  walletMainSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  walletIconContainer: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  walletAmountContainer: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  walletLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 2,
  },
  walletSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  viewDetailsBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginRight: SPACING.sm,
  },
  walletStatsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  walletStatBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  walletStatBoxDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  statTextBox: {
    marginLeft: SPACING.sm,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  statBoxLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  quickActionItem: {
    alignItems: "center",
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },

  // Menu Section
  menuSection: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textDark,
  },
  menuBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginLeft: 72,
  },

  // Logout Section
  logoutSection: {
    marginTop: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.errorBg,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },

  // Version
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: SPACING.lg,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 15,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    opacity: 0.7,
  },
  inputDisabledText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Avatar Modal
  avatarModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  avatarModalContent: {
    padding: SPACING.lg,
  },
  uploadPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  uploadPhotoText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  avatarSectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});