import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button } from "react-native";
import auth from "@react-native-firebase/auth";

export default function ProfileScreen() {
  const user = auth().currentUser;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Profile</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Text style={{ color: "#64748b" }}>UID</Text>
        <Text style={{ fontWeight: "600" }}>{user?.uid ?? "-"}</Text>

        <Text style={{ color: "#64748b", marginTop: 12 }}>Phone</Text>
        <Text style={{ fontWeight: "600" }}>{user?.phoneNumber ?? "-"}</Text>

        <Text style={{ color: "#64748b", marginTop: 12 }}>Email</Text>
        <Text style={{ fontWeight: "600" }}>{user?.email ?? "-"}</Text>

        <View style={{ marginTop: 20, width: 160 }}>
          <Button title="Logout" onPress={() => auth().signOut()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
