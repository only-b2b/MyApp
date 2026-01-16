// components/AddressSearch.js
import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { olaAutocomplete, olaPlaceDetails } from "../lib/ola";

export default function AddressSearch({
  placeholder,
  onSelect,
  nearby,
  defaultText = "",
}) {
  const [q, setQ] = useState(defaultText);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q || q === defaultText) {
        setItems([]);
        return;
      }
      try {
        setLoading(true);
        const resp = await olaAutocomplete(q, nearby);
        setItems(resp.predictions || []);
      } catch (_) {}
      finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  const chooseItem = async (item) => {
    try {
      const details = await olaPlaceDetails(item.place_id);
      const loc = details?.location;

      if (loc) {
        onSelect({
          description: item.description,
          location: { lat: loc.lat, lng: loc.lng },
        });
        setQ(item.description);
        setItems([]);
      }
    } catch (_) {}
  };

  return (
    <View style={{ width: "100%" }}>
      <TextInput
        placeholder={placeholder}
        value={q}
        onChangeText={setQ}
        style={styles.input}
      />

      {/* replacement for FlatList → ScrollView */}
      {items.length > 0 && (
        <ScrollView
          style={styles.list}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="always"
        >
          {items.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.item}
              onPress={() => chooseItem(item)}
            >
              <Text style={styles.itemText}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    elevation: 2,
  },
  list: {
    backgroundColor: "#fff",
    marginTop: 6,
    borderRadius: 10,
    maxHeight: 220,
    paddingVertical: 4,
    elevation: 3,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.6,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 15,
    color: "#1C1C1E",
  },
});
