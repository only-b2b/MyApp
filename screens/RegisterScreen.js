import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { API_BASE_URL } from "../config";


const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const CANVAS = "#FFF9F5";
const CHARCOAL = "#1C1C1E";
const MUTED = "#6B7280";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // --------------------------
  // INPUT VALIDATION
  // --------------------------
  const validateInputs = () => {
    if (!name.trim()) return Alert.alert("Error", "Enter full name"), false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return Alert.alert("Error", "Enter valid email"), false;

    if (!phone.startsWith("+") || phone.length < 10)
      return Alert.alert("Error", "Use +91XXXXXXXXXX format"), false;

    return true;
  };

  // --------------------------
  // SEND OTP
  // --------------------------
  const sendOTP = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setConfirm(confirmation);
      setResendTimer(60);

      Alert.alert("OTP Sent", "Please check your SMS.");
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Try again.");
      console.log(error);
    }
    setLoading(false);
  };

  // --------------------------
  // VERIFY OTP & SAVE PROFILE
  // --------------------------
const verifyOTP = async () => {
  if (!confirm) return Alert.alert("Error", "Request OTP first");
  if (code.length < 6) return Alert.alert("Error", "Invalid OTP");

  setLoading(true);
  let uid;

  // STEP 1: OTP VERIFY
  try {
    const result = await confirm.confirm(code);
    uid = result.user.uid;
  } catch (err) {
    setLoading(false);
    console.log("OTP ERROR:", err);
    return Alert.alert("OTP Failed");
  }

  // STEP 3: BACKEND API
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, name, email, phone }),
      });

      const data = await response.json();
      console.log("API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error || "API failed");
      }

      Alert.alert("Success", "Registration completed");
    } catch (err) {
      console.log("API ERROR:", err);
      Alert.alert("API Error", err.message);
    }


  setLoading(false);
};



  return (
    <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.bg}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and get started</Text>

          <View style={styles.card}>
            {!confirm ? (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Your Email"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91XXXXXXXXXX"
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.button}
                  onPress={sendOTP}
                  disabled={loading || resendTimer > 0}
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
                        <Text style={styles.buttonText}>
                          {resendTimer > 0
                            ? `Resend OTP in ${resendTimer}s`
                            : "Send OTP"}
                        </Text>
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
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.button}
                  onPress={verifyOTP}
                  disabled={loading}
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
                        <Text style={styles.buttonText}>Verify & Register</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
              Login
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  title: { fontSize: 30, fontWeight: "800", color: "#fff", marginBottom: 6 },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  card: {
    backgroundColor: CANVAS,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },
  label: { fontSize: 14, color: MUTED, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
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
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 6 },
  footerText: { textAlign: "center", marginTop: 20, color: "#fff" },
  link: { fontWeight: "700", color: "#fff", textDecorationLine: "underline" },
});
