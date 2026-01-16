import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import 'react-native-gesture-handler';
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
    const unsub = auth().onAuthStateChanged(u => {
      setUser(u || null);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ServiceProvider>
        <LeadsProvider>
          <NavigationContainer>
            <MainStack user={user} />  {/* 👈 ONLY ONE NAVIGATOR */}
          </NavigationContainer>
        </LeadsProvider>
      </ServiceProvider>
    </GestureHandlerRootView>
  );
}
