// screens/booking/SelectAddressPage.js

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../../config";

export default function SelectAddressPage({ route, navigation }) {
  const { firebase_uid, selectedId } = route.params;

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/addresses/${firebase_uid}`)
      .then(res => res.json())
      .then(data => {
        setAddresses(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [firebase_uid]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Select Address</Text>

      {addresses.map(addr => (
        <TouchableOpacity
          key={addr.id}
          style={[
            styles.card,
            addr.id === selectedId && styles.active,
          ]}
          onPress={() => {
            navigation.navigate("QuotationPage", {
              selectedAddress: addr
            });
          }}
        >
          <Text style={styles.address}>
            {addr.address}, {addr.city}
          </Text>

          {addr.id === selectedId && (
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() =>
          navigation.navigate("ClientInfoPage", {
            fromAddressManager: true,
          })
        }
      >
        <Ionicons name="add-circle" size={18} color="#fff" />
        <Text style={styles.addBtnText}>Add New Address</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  active: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  addBtn: {
  backgroundColor: "#22c55e",
  padding: 14,
  borderRadius: 12,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  marginTop: 10,
},
addBtnText: {
  color: "#fff",
  fontWeight: "700",
},
  address: { fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
