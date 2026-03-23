import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function RideCompletedScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Ride Completed</Text>
      <Text style={styles.message}>
        You have reached your destination safely.
      </Text>
      <Text style={styles.thank}>
        Thank you for riding with us!
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  message: {
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  thank: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: "600",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#FF6B00",
    padding: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
