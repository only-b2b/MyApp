// components/SearchBar.js
import React from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AddressSearch from "./AddressSearch";

export default function SearchBar({ onSelect, nearby }) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color="#2f966f" />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <AddressSearch
          placeholder="Search Destination"
          onSelect={onSelect}
          nearby={nearby}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
});
