// screens/auth/LoginScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getApp } from "@react-native-firebase/app";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const CANVAS = "#FFF9F5";
const MUTED = "#6B7280";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ SEND OTP - FIXED
  const sendVerification = async () => {
    if (!phone.startsWith("+")) {
      Alert.alert("Invalid Format", "Enter number like +91XXXXXXXXXX");
      return;
    }

    try {
      setLoading(true);
      
      const app = getApp();
      const auth = getAuth(app);
      
      const confirmation = await signInWithPhoneNumber(auth, phone);
      setConfirm(confirmation);
      
      Alert.alert("Success", "OTP Sent Successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
      console.log("Send OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFY OTP - FIXED
  const confirmCode = async () => {
    if (!confirm) {
      Alert.alert("Error", "Please request OTP first");
      return;
    }

    try {
      setLoading(true);

      const result = await confirm.confirm(code);
      const uid = result.user.uid;

      const app = getApp();
      const firestore = getFirestore(app);
      const userRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        Alert.alert("Profile Missing", "You must register before login.");
        navigation.replace("Register");
        return;
      }

      const userData = docSnap.data();
      console.log("USER DATA LOADED:", userData);

      Alert.alert("Success", "Login Successful!");
      navigation.replace("HomeTabs", { screen: "Home" });

    } catch (error) {
      Alert.alert("Error", "Invalid OTP or verification failed");
      console.log("Verify OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.bg}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          <View style={styles.card}>
            {!confirm ? (
              <>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91XXXXXXXXXX"
                  value={phone}
                  keyboardType="phone-pad"
                  onChangeText={setPhone}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={sendVerification}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[ORANGE_LIGHT, ORANGE]}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Send OTP</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  value={code}
                  maxLength={6}
                  onChangeText={setCode}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={confirmCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[ORANGE_LIGHT, ORANGE]}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Verify & Login</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footerText}>
            {"Don't have an account? "}
            <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
              Register
            </Text>
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 16, color: "#fff", marginBottom: 20 },
  card: {
    backgroundColor: CANVAS,
    borderRadius: 18,
    padding: 20,
    elevation: 4,
  },
  label: { fontSize: 14, color: MUTED, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  button: { borderRadius: 12, overflow: "hidden" },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  footerText: { textAlign: "center", marginTop: 20, color: "#fff" },
  link: { fontWeight: "700", color: "#fff", textDecorationLine: "underline" },
});