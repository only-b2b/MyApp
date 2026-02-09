import { View, Text, StyleSheet } from "react-native";

export default function TechnicianAssignedPage({ route }) {
  const { technician } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Technician Assigned 🎉</Text>

      <View style={styles.card}>
        <Text>Name: {technician.full_name}</Text>
        <Text>Phone: {technician.phone}</Text>
        <Text>Vehicle: {technician.vehicle}</Text>
        <Text>Experience: {technician.experience}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    elevation: 3,
  },
});
