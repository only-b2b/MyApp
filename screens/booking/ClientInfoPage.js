// screens/booking/ClientInfoPage.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../../config";
import auth from "@react-native-firebase/auth";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const CHARCOAL = "#1C1C1E";
const MUTED = "#6B7280";
const CANVAS = "#FFF9F5";
const CARD_BG = "#FFFDFC";

export default function ClientInfoPage({ route, navigation }) {
  const { order } = route.params || {};
  const user = auth().currentUser;
  const firebase_uid = user?.uid;

  if (!order) {
    Alert.alert("Error", "Invalid order data");
    navigation.goBack();
    return null;
  }

  const {
    vehicle,
    package_name: pkg,
    price,
  } = order;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  if (!name || !phone || !city || !address.trim()) {
    Alert.alert("Missing Info", "Please fill all required fields.");
    return;
  }

  if (!firebase_uid) {
    Alert.alert("Error", "User session missing. Please login again.");
    return;
  }

  try {
    setLoading(true);

    // 1️⃣ Register / fetch user
    await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid,
        name,
        phone,
      }),
    });

    // 2️⃣ Save address
    const addressRes = await fetch(`${API_BASE_URL}/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid,
        label: "Home",
        address: address.trim(),
        city: city.trim(),
      }),
    });

    if (!addressRes.ok) {
      const err = await addressRes.json();
      throw new Error(err.error);
    }

    // 3️⃣ Save lead
    await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        city,
        vehicle,
        pkg,
        price,
      }),
    });

    Alert.alert("Success", "Information saved successfully ✅", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);

  } catch (err) {
    Alert.alert("Error", err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: CANVAS }}
    >
      <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Information</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91XXXXXXXXXX"
          />

          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Pune"
          />

          <Text style={styles.label}>Current Address</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter full address"
            multiline
          />
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={handleSubmit} disabled={loading}>
          <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.btn}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Save & Proceed to Payment</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    padding: 4,
    marginRight: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  label: { color: MUTED, fontWeight: "600", fontSize: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    color: CHARCOAL,
    backgroundColor: "#fff",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 6 },
});
