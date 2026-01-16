// screens/LeadDetailScreen.js
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import { useLeads } from "../store/LeadsContext";

const minutesToHuman = (min) => {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export default function LeadDetailScreen() {
  const route = useRoute();
  const { updateLead } = useLeads();
  const lead = route.params?.lead || {};

  const distanceKmText = useMemo(() => {
    if (lead.distanceKm != null) return `${Number(lead.distanceKm).toFixed(2)} km`;
    return "—";
  }, [lead.distanceKm]);

  const callCustomer = async () => {
    if (!lead.phone) return Alert.alert("No phone", "This lead has no phone number.");
    const url = `tel:${lead.phone}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) return Alert.alert("Error", "Cannot open dialer.");
    Linking.openURL(url);
  };

  const copyAddress = async () => {
    const addr =
      lead.address ||
      (lead.latitude && lead.longitude
        ? `${lead.latitude}, ${lead.longitude}`
        : "");
    if (!addr) return Alert.alert("No address", "No address available to copy.");
    await Clipboard.setStringAsync(addr);
    Alert.alert("Copied", "Address copied to clipboard.");
  };

  const onSetStatus = async (newStatus) => {
    try {
      await updateLead(lead.id, { status: newStatus });
      Alert.alert("Updated", `Lead marked as "${newStatus}".`);
    } catch (e) {
      Alert.alert("Update failed", e?.message || "Could not update status.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* top card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.leadName}>{lead.name || "—"}</Text>
            <Text style={styles.leadId}>{lead.id || "—"}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color="#64748b" />
            <Text style={styles.mutedText}>&nbsp;{lead.phone || "—"}</Text>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.mutedText}>
              &nbsp;{lead.city || "—"}
              {lead.address ? ` · ${lead.address}` : ""}
            </Text>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <Ionicons name="car-outline" size={16} color="#64748b" />
            <Text style={styles.mutedText}>
              &nbsp;{lead.vehicle || "—"} · {lead.pkg || "—"}
            </Text>
          </View>

          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <Text style={styles.badge}>
              {lead.status || "New"}
            </Text>
            <Text style={styles.price}>₹{lead.price ?? "—"}</Text>
          </View>
        </View>

        {/* ETA / distance card (no maps used) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Travel & ETA (approx.)</Text>
          <View style={{ height: 8 }} />
          <View style={styles.rowBetween}>
            <View style={styles.inline}>
              <Ionicons name="navigate-outline" size={18} color="#0ea5e9" />
              <Text style={styles.kv}>
                &nbsp;Distance:&nbsp;
                <Text style={styles.kvStrong}>{distanceKmText}</Text>
              </Text>
            </View>
            <View style={styles.inline}>
              <Ionicons name="time-outline" size={18} color="#0ea5e9" />
              <Text style={styles.kv}>
                &nbsp;Travel:&nbsp;
                <Text style={styles.kvStrong}>
                  {minutesToHuman(lead.travelMinutes)}
                </Text>
              </Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 8 }]}>
            <Ionicons name="hourglass-outline" size={18} color="#0ea5e9" />
            <Text style={styles.kv}>
              &nbsp;Service Time:&nbsp;
              <Text style={styles.kvStrong}>{minutesToHuman(lead.serviceMinutes || lead.etaMin)}</Text>
            </Text>
          </View>

          <View style={[styles.row, { marginTop: 4 }]}>
            <Ionicons name="stopwatch-outline" size={18} color="#16a34a" />
            <Text style={styles.kv}>
              &nbsp;Total ETA:&nbsp;
              <Text style={[styles.kvStrong, { color: "#16a34a" }]}>
                {minutesToHuman(lead.totalEtaMinutes)}
              </Text>
            </Text>
          </View>
        </View>

        {/* quick actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick actions</Text>
          <View style={{ height: 10 }} />
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#e0f2fe", borderColor: "#bae6fd" }]} onPress={callCustomer}>
              <Ionicons name="call" size={18} color="#0369a1" />
              <Text style={[styles.actionText, { color: "#0369a1" }]}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }]} onPress={copyAddress}>
              <Ionicons name="copy-outline" size={18} color="#9a3412" />
              <Text style={[styles.actionText, { color: "#9a3412" }]}>Copy address</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.actionsRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#ecfccb", borderColor: "#d9f99d" }]}
              onPress={() => onSetStatus("In Progress")}
            >
              <Ionicons name="construct-outline" size={18} color="#3f6212" />
              <Text style={[styles.actionText, { color: "#3f6212" }]}>In Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }]}
              onPress={() => onSetStatus("Closed")}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#166534" />
              <Text style={[styles.actionText, { color: "#166534" }]}>Close Lead</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  content: { padding: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inline: { flexDirection: "row", alignItems: "center" },
  leadName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  leadId: { color: "#64748b", fontWeight: "600" },
  mutedText: { color: "#64748b" },
  price: { fontSize: 18, fontWeight: "800", color: "#0f766e" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    fontWeight: "700",
    overflow: "hidden",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  kv: { color: "#0f172a" },
  kvStrong: { fontWeight: "800" },
  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionText: { fontWeight: "800" },
});
