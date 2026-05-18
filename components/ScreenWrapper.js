// components/ScreenWrapper.js

import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, View } from "react-native";

const DEFAULT_BG = "#F7F7FA";

export default function ScreenWrapper({
  children,
  style,
  edges = ["top", "left", "right"],
  statusBarStyle = "dark-content",
  statusBarBg,
  backgroundColor = DEFAULT_BG,
}) {
  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBg || backgroundColor}
        translucent={false}
      />
      <SafeAreaView
        style={[{ flex: 1, backgroundColor }, style]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </>
  );
}