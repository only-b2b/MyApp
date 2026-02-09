import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function DriverAssignedScreen({ route }) {
  const { driver, driverLocation } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Assigned 🚗</Text>

      <Text style={styles.text}>Name: {driver.full_name}</Text>
      <Text style={styles.text}>Phone: {driver.phone}</Text>
      <Text style={styles.text}>Vehicle: {driver.vehicle}</Text>

      {driverLocation && (
        <Text style={styles.text}>
          Live Location: {driverLocation.lat}, {driverLocation.lng}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 8 },
});
