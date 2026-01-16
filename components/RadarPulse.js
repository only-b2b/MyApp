// components/RadarPulse.js
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function RadarPulse({ size = 220 }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = () => {
      scale.setValue(0);
      opacity.setValue(1);

      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]).start(() => loop());
    };

    loop();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    borderRadius: 500,
    backgroundColor: "rgba(255, 107, 0, 0.25)",
  },
});
