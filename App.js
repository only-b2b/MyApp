// App.js
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

export default function App() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    try {
      const app = getApp(); // ✅ NEW API
      const auth = getAuth(app); // ✅ NEW API

      const unsubscribe = onAuthStateChanged(auth, (u) => { // ✅ NEW API
        if (isMounted) {
          setUser(u || null);
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