import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

export default function ScreenWrapper({ children, style }) {
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.bg }, style]}
      edges={["top", "left", "right"]}
    >
      {children}
    </SafeAreaView>
  );
}
