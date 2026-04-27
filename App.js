import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { getApp } from "@react-native-firebase/app";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { LeadsProvider } from "./store/LeadsContext";
import { ServiceProvider } from "./store/ServiceContext";
import MainStack from "./navigation/MainStack";
import { API_BASE_URL } from "./config/api";

// ✅ FIXED: Auto-register user helper
// ✅ FIXED: Handle phone-auth users properly
const syncUserWithBackend = async (user) => {
  if (!user) {
    console.log("⚠️ No user to sync");
    return;
  }

  console.log("🔄 Syncing user:", user.uid);
  console.log("📡 Using API:", API_BASE_URL);
  
  // ✅ Get user data from Firebase (phone auth users don't have email)
  const userData = {
    uid: user.uid,
    name: user.displayName || user.phoneNumber || "User",
    email: user.email || `${user.uid}@temp.com`, // ← Fallback email
    phone: user.phoneNumber || "",
  };

  console.log("📤 Sending user data:", userData);

  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(userData),
    });

    console.log("📥 Response status:", response.status);

    const data = await response.json();
    console.log("📥 Response data:", data);

    if (response.status === 409) {
      console.log("✅ User already exists in database");
      return true;
    }
    
    if (response.status === 201 || response.ok) {
      console.log("✅ User registered successfully");
      return true;
    }

    console.log("⚠️ Unexpected response:", response.status, data);
    return false;

  } catch (error) {
    console.error("❌ Backend sync error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
    });
    return false;
  }
};

export default function App() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    try {
      const app = getApp();
      const auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (isMounted) {
          console.log("👤 Auth state changed:", u ? u.uid : "null");
          setUser(u || null);
          
          // ✅ Sync user with backend
          if (u) {
            await syncUserWithBackend(u);
          }
          
          setChecking(false);
        }
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (error) {
      console.log("Auth init error:", error);
      if (isMounted) {
        setChecking(false);
      }
    }
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ServiceProvider>
        <LeadsProvider>
          <NavigationContainer>
            <MainStack user={user} />
          </NavigationContainer>
        </LeadsProvider>
      </ServiceProvider>
    </GestureHandlerRootView>
  );
}