// screens/QuotationPage.js
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FFB347";
const DARK = "#1C1C1E";
const MUTED = "#6B7280";
const BG = "#FFF7F2";
const CARD = "#FFFFFF";

export default function QuotationPage({ route, navigation }) {
  const { order } = route.params || {};
  const [address, setAddress] = useState(order?.address);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!order) {
    return (
      <View style={styles.root}>
        <Text style={{ color: "red" }}>Invalid quotation data</Text>
      </View>
    );
  }

  const isCarWash = order.service_type === "car_wash";
  const isDriver = order.service_type === "driver";

  // Address is mandatory only for car wash
  const canProceed = isDriver || !!address;

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <LinearGradient colors={[ORANGE_LIGHT, ORANGE]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.heading}>Quotation Summary</Text>
        <Text style={styles.subHeading}>
          {order.service_type.replace("_", " ").toUpperCase()}
        </Text>
      </LinearGradient>

      {/* BODY */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* BOOKING DETAILS */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Booking Details</Text>

          <Info label="Service" value={order.service_type} />

          {/* ───── CAR WASH DETAILS ───── */}
          {isCarWash && (
            <>
              <Info label="Nearest Hub" value={order.hub?.name} />
              <Info label="Vehicle" value={order.vehicle?.name} />
              <Info label="Package" value={order.package?.name} />
            </>
          )}

          {/* ───── DRIVER DETAILS ───── */}
          {isDriver && (
            <>
              <Info
                label="Pickup"
                value={order.location?.pickup?.description}
              />
              <Info
                label="Drop"
                value={order.location?.drop?.description}
              />
              <Info
                label="Journey Date"
                value={order.schedule?.date}
              />
              <Info
                label="Pickup Time"
                value={order.schedule?.time}
              />
              <Info
                label="Car"
                value={`${order.car?.brand || ""} ${order.car?.model || ""}`}
              />
              <Info
                label="Car Number"
                value={order.car?.number}
              />
            </>
          )}

          {/* COMMON */}
          <Info label="Distance" value={order.route?.distance} />
          <Info label="Duration" value={order.route?.duration} />

          <View style={styles.divider} />

          <Text style={styles.priceLabel}>Estimated Price</Text>
          <Text style={styles.priceValue}>
            ₹{order.pricing?.total?.toLocaleString("en-IN")}
          </Text>
        </View>

        {/* ADDRESS (ONLY FOR CAR WASH) */}
        {isCarWash && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Service Address</Text>

            {address ? (
              <Text style={styles.addressText}>{address}</Text>
            ) : (
              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={() =>
                  navigation.navigate("ClientInfoPage", {
                    order,
                    fromQuotation: true,
                  })
                }
              >
                <Ionicons name="location-outline" size={20} color={ORANGE} />
                <Text style={styles.addAddressText}>
                  Add service address
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PROCEED */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canProceed}
          onPress={() =>
            navigation.navigate("PaymentPage", {
              order: {
                ...order,
                address: isCarWash ? address : order.address,
              },
            })
          }
        >
          <LinearGradient
            colors={[ORANGE, ORANGE_LIGHT]}
            style={[
              styles.primaryBtn,
              !canProceed && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color="#fff"
            />
            <Text style={styles.primaryText}>Proceed to Payment</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="pencil-outline" size={20} color={ORANGE} />
          <Text style={styles.secondaryText}>Modify Details</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const Info = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

// styles remain EXACTLY the same


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  heading: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subHeading: { color: "#fff", opacity: 0.9 },

  card: {
    backgroundColor: CARD,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: DARK,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: { color: MUTED },
  infoValue: { color: DARK, fontWeight: "700", maxWidth: "55%" },

  divider: { height: 1, backgroundColor: "#eee", marginVertical: 14 },

  priceLabel: { color: MUTED },
  priceValue: { fontSize: 26, fontWeight: "900", color: ORANGE },

  addressText: {
    fontSize: 14,
    color: DARK,
    fontWeight: "600",
  },

  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  addAddressText: {
    marginLeft: 6,
    color: ORANGE,
    fontWeight: "700",
  },

  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 6,
    fontSize: 16,
  },

  secondaryBtn: {
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: ORANGE,
    flexDirection: "row",
    justifyContent: "center",
  },
  secondaryText: {
    color: ORANGE,
    fontWeight: "800",
    marginLeft: 6,
  },
});
