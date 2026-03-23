import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE_URL } from "../config";

export default function ManageAddressesPage({ route, navigation }) {
  const { firebase_uid } = route.params;

  const [addresses, setAddresses] = useState([]);

  const loadAddresses = async () => {
    const res = await fetch(`${API_BASE_URL}/addresses/${firebase_uid}`);
    const data = await res.json();
    setAddresses(data || []);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const deleteAddress = async (id) => {
    Alert.alert("Delete Address", "Are you sure?", [
      {
        text: "Cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(`${API_BASE_URL}/addresses/${id}`, {
            method: "DELETE",
          });
          loadAddresses();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text>{item.address}</Text>
              <Text>{item.city}</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("EditAddressPage", {
                  address: item,
                  firebase_uid,
                })
              }
            >
              <Ionicons name="create-outline" size={20} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteAddress(item.id)}>
              <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.add}
        onPress={() =>
          navigation.navigate("AddAddressPage", {
            firebase_uid,
          })
        }
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Add Address</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  label: {
    fontWeight: "700",
  },

  add: {
    backgroundColor: "#22c55e",
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
  },
});