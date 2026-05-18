// screens/driver/LiveRideScreen.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Linking,
  Image,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import RazorpayCheckout from "react-native-razorpay";
import auth from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";
import ScreenWrapper from "../../components/ScreenWrapper";

const CAR_IMAGE = require("../../assets/car-top.png");
const GOOGLE_MAPS_APIKEY = "AIzaSyDbTEOzGx3L0pr6D1_9q8whfqhLyyyL-EI";

const { width, height } = Dimensions.get("window");
const BOTTOM_CARD_HEIGHT = height * 0.45;

// ==================== DESIGN SYSTEM ====================
const C = {
  violet: "#3D2B8C",
  violetDark: "#2A1E6B",
  violetMid: "#4D3CA0",
  blue: "#1E40AF",
  blueDark: "#1E3A8A",
  blueDeep: "#172554",
  primarySoft: "#EEEAFB",
  primarySoftDeep: "#DCD4F5",
  lavenderBg: "#F1EEFB",
  primaryFade: "rgba(61,43,140,0.08)",
  primaryGlow: "rgba(61,43,140,0.30)",
  gold: "#F5C518",
  goldLight: "#FFD740",
  goldDark: "#C9A015",
  goldSoft: "#FEF7E0",
  bg: "#F7F7FA",
  card: "#FFFFFF",
  surface: "#F9FAFB",
  textDark: "#0F0F1F",
  textPrimary: "#1F1F33",
  textMid: "#4A4A66",
  textLight: "#7B7B95",
  textFaint: "#A8A8BC",
  border: "#EDEDF2",
  borderMid: "#DDDDE5",
  divider: "#E8E8EE",
  pastelBlue: "#E3F0FF",
  blueAccent: "#3B82F6",
  pastelGreen: "#E8F5E9",
  green: "#34A853",
  greenDark: "#16A34A",
  pastelOrange: "#FFE8D6",
  orange: "#F59E0B",
  pastelRed: "#FEE2E2",
  red: "#EF4444",
  success: "#22C55E",
  successBg: "#E8F8EF",
  successDark: "#16A34A",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  white: "#FFFFFF",
  shadow: "#0F0F1F",
  overlay: "rgba(0,0,0,0.5)",
};

const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

const GRAD = {
  primary: [C.violet, C.blue],
  primaryDeep: [C.violetDark, C.blueDeep],
  gold: [C.goldLight, C.gold, C.goldDark],
  goldShine: [C.goldLight, C.gold],
  lavender: [C.primarySoft, C.lavenderBg],
};

// ==================== MAP STYLE ====================
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F5F5F8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7B7B95" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#E8E2F8" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#D0DCF0" }],
  },
];

// ==================== HELPERS ====================
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ==================== MARKERS ====================
const PulseMarker = ({ coordinate }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    p.start();
    return () => p.stop();
  }, []);

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} zIndex={1}>
      <View style={styles.destMarkerWrap}>
        <Animated.View
          style={[
            styles.destPulseRing,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <LinearGradient colors={[C.red, "#C0392B"]} style={styles.destDot}>
          <Ionicons name="location" size={14} color={C.white} />
        </LinearGradient>
      </View>
    </Marker>
  );
};

const CarMarker = ({ coordinate, heading }) => {
  if (!coordinate) return null;
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading || 0}
      flat
      tracksViewChanges={false}
      zIndex={999}
    >
      <View style={styles.carMarkerWrap}>
        <View style={styles.carShadow} />
        <Image source={CAR_IMAGE} style={styles.carImage} resizeMode="contain" />
      </View>
    </Marker>
  );
};

const CarMarkerIcon = ({ coordinate, heading }) => {
  if (!coordinate) return null;
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading || 0}
      flat
      tracksViewChanges={false}
      zIndex={999}
    >
      <View style={styles.carIconWrap}>
        <LinearGradient colors={GRAD.primary} style={styles.carIconCircle}>
          <FontAwesome5 name="car-side" size={15} color={C.white} />
        </LinearGradient>
        <View style={styles.carIconShadow} />
      </View>
    </Marker>
  );
};

const PickupMarker = ({ coordinate }) => {
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
      <View style={styles.pickupMarkerWrap}>
        <View style={styles.pickupMarkerOuter}>
          <LinearGradient colors={GRAD.primary} style={styles.pickupMarkerInner}>
            <View style={styles.pickupMarkerDot} />
          </LinearGradient>
        </View>
      </View>
    </Marker>
  );
};

// ==================== MAIN COMPONENT ====================
export default function LiveRideScreen({ route, navigation }) {
  const { orderId } = route.params;
  const mapRef = useRef(null);
  const user = auth().currentUser;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverCoord, setDriverCoord] = useState(null);
  const [dropCoord, setDropCoord] = useState(null);
  const [pickupCoord, setPickupCoord] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [totalDistance, setTotalDistance] = useState(null);
  const [heading, setHeading] = useState(0);
  const [rideEnded, setRideEnded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [useCarImage, setUseCarImage] = useState(true);
  const [initialFitDone, setInitialFitDone] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const prevCoordRef = useRef(null);
  const lastZoomUpdateRef = useRef(0);
  const paymentTriggeredRef = useRef(false);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const goldPulse = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(goldPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const calculateHeading = (from, to) => {
    if (!from || !to) return 0;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  };

  // ── SOS Handlers ──
  const handleSOS = () => setSosModalVisible(true);
  const callEmergency = () => {
    setSosModalVisible(false);
    Linking.openURL("tel:112");
  };
  const callPolice = () => {
    setSosModalVisible(false);
    Linking.openURL("tel:100");
  };
  const callAmbulance = () => {
    setSosModalVisible(false);
    Linking.openURL("tel:108");
  };
  const callSupport = () => {
    setSosModalVisible(false);
    Linking.openURL("tel:+919999999999");
  };
  const shareLocation = async () => {
    if (!driverCoord) return;
    const msg = `🆘 EMERGENCY!\nDriver: ${
      order?.driver?.full_name || "Unknown"
    }\nVehicle: ${order?.driver?.vehicle || "Unknown"}\nLocation: https://www.google.com/maps?q=${
      driverCoord.latitude
    },${driverCoord.longitude}\nOrder: ${orderId}`;
    try {
      await Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
    } catch {}
    setSosModalVisible(false);
  };

  // ── Payment Helpers ──
  const getPaymentMethod = () =>
    order?.paymentBreakdown?.paymentMethod ||
    order?.payment_method ||
    order?.payment_mode ||
    "cash";
  const getCustomerTotal = () =>
    parseFloat(
      order?.paymentBreakdown?.customerTotal ||
        order?.customer_total ||
        order?.price ||
        0
    );
  const isCashPayment = () => getPaymentMethod() === "cash";
  const isPaymentDone = () =>
    order?.payment_status === "paid" || paymentSuccess;

  // ── Razorpay ──
  const initiatePayment = async () => {
    if (paymentTriggeredRef.current) return;
    paymentTriggeredRef.current = true;
    setPaymentLoading(true);
    try {
      const createRes = await fetch(
        `${API_BASE_URL}/orders/${orderId}/create-payment`,
        { method: "POST" }
      );
      if (!createRes.ok) throw new Error("Failed to create payment order");
      const paymentData = await createRes.json();

      const options = {
        description: `Ride Payment - Order #${orderId}`,
        image: "https://your-app-logo-url.com/logo.png",
        currency: paymentData.currency,
        key: paymentData.key,
        amount: paymentData.amount,
        order_id: paymentData.orderId,
        name: "Motors App",
        prefill: {
          email: user?.email || "",
          contact: user?.phoneNumber || "",
          name: user?.displayName || "Customer",
        },
        theme: { color: C.violet },
      };

      const razorpayResponse = await RazorpayCheckout.open(options);

      const verifyRes = await fetch(
        `${API_BASE_URL}/orders/${orderId}/verify-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          }),
        }
      );
      if (!verifyRes.ok) throw new Error("Payment verification failed");

      setPaymentSuccess(true);
      setShowPaymentModal(false);
    } catch (err) {
      paymentTriggeredRef.current = false;
      if (
        err.code === "CANCELLED" ||
        err.description === "Payment cancelled"
      ) {
        Alert.alert(
          "Payment Required",
          "You need to complete the payment for this ride.",
          [
            {
              text: "Pay Now",
              onPress: () => {
                paymentTriggeredRef.current = false;
                initiatePayment();
              },
            },
            { text: "Pay Later", style: "cancel" },
          ]
        );
      } else {
        Alert.alert(
          "Payment Failed",
          err.message || "Something went wrong. Please try again.",
          [
            {
              text: "Retry",
              onPress: () => {
                paymentTriggeredRef.current = false;
                initiatePayment();
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Fetch & Poll ──
  useEffect(() => {
    if (!orderId) {
      setError("Invalid order ID");
      setLoading(false);
      return;
    }
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        setOrder(data);
        setLoading(false);

        if (data.status === "completed") {
          const payMethod =
            data.payment_method || data.payment_mode || "cash";
          const isPaid = data.payment_status === "paid";
          if (
            payMethod !== "cash" &&
            !isPaid &&
            !paymentTriggeredRef.current &&
            !paymentSuccess
          ) {
            setShowPaymentModal(true);
          } else {
            setRideEnded(true);
          }
          return;
        }

        if (data.drop_lat && data.drop_lng) {
          const dLat = Number(data.drop_lat),
            dLng = Number(data.drop_lng);
          if (!isNaN(dLat) && !isNaN(dLng))
            setDropCoord({ latitude: dLat, longitude: dLng });
        }
        if (data.pickup_lat && data.pickup_lng) {
          const pLat = Number(data.pickup_lat),
            pLng = Number(data.pickup_lng);
          if (!isNaN(pLat) && !isNaN(pLng))
            setPickupCoord({ latitude: pLat, longitude: pLng });
        }

        let newDriverCoord = null;
        if (data.driverLocation?.lat && data.driverLocation?.lng) {
          const lat = Number(data.driverLocation.lat),
            lng = Number(data.driverLocation.lng);
          if (!isNaN(lat) && !isNaN(lng))
            newDriverCoord = { latitude: lat, longitude: lng };
        }
        if (!newDriverCoord && data.pickup_lat && data.pickup_lng) {
          const lat = Number(data.pickup_lat),
            lng = Number(data.pickup_lng);
          if (!isNaN(lat) && !isNaN(lng))
            newDriverCoord = { latitude: lat, longitude: lng };
        }
        if (newDriverCoord) {
          if (prevCoordRef.current) {
            const h = calculateHeading(prevCoordRef.current, newDriverCoord);
            if (h !== 0) setHeading(h);
          }
          prevCoordRef.current = newDriverCoord;
          setDriverCoord(newDriverCoord);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, paymentSuccess]);

  // ── Map fitting ──
  useEffect(() => {
    if (mapReady && mapRef.current && driverCoord && dropCoord && !initialFitDone) {
      setTimeout(() => {
        fitMapToRoute();
        setInitialFitDone(true);
      }, 800);
    }
  }, [mapReady, driverCoord, dropCoord, initialFitDone]);

  const fitMapToRoute = () => {
    if (!mapRef.current || !driverCoord || !dropCoord) return;
    mapRef.current.fitToCoordinates([driverCoord, dropCoord], {
      edgePadding: {
        top: 80,
        right: 50,
        bottom: BOTTOM_CARD_HEIGHT + 20,
        left: 50,
      },
      animated: true,
    });
  };

  useEffect(() => {
    if (
      !mapReady || !driverCoord || !dropCoord ||
      !autoFollow || !initialFitDone
    ) return;
    const now = Date.now();
    if (now - lastZoomUpdateRef.current < 3000) return;
    lastZoomUpdateRef.current = now;
    const d = getDistanceFromLatLonInKm(
      driverCoord.latitude, driverCoord.longitude,
      dropCoord.latitude, dropCoord.longitude
    );
    if (d < 0.3) {
      mapRef.current?.animateToRegion(
        { ...driverCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        1000
      );
    } else {
      fitMapToRoute();
    }
  }, [driverCoord, dropCoord, mapReady, autoFollow, initialFitDone]);

  // ── Progress animation ──
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: getProgress() / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [distance, totalDistance]);

  const getProgress = () => {
    if (!totalDistance || !distance) return 0;
    return Math.min(
      Math.max(
        ((totalDistance - parseFloat(distance)) / totalDistance) * 100,
        0
      ),
      100
    );
  };

  const callDriver = () => {
    const phone = order?.driver?.phone || order?.driver_phone;
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("Error", "Driver phone not available");
  };

  const handleRecenter = () => {
    setAutoFollow(true);
    fitMapToRoute();
  };
  const handleShowFullRoute = () => {
    setAutoFollow(false);
    fitMapToRoute();
  };

  // ── Loading states ──
  if (loading) {
    return (
      <ScreenWrapper backgroundColor={C.bg}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <LinearGradient colors={GRAD.primary} style={styles.loaderIconWrap}>
              <Ionicons name="car-sport" size={32} color={C.white} />
            </LinearGradient>
            <ActivityIndicator
              size="large"
              color={C.violet}
              style={{ marginTop: SP.xl }}
            />
            <Text style={styles.loaderTitle}>Loading ride details...</Text>
            <Text style={styles.loaderSub}>Please wait a moment</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper backgroundColor={C.bg}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <LinearGradient
              colors={[C.pastelRed, "#FEE2E2"]}
              style={styles.loaderIconWrap}
            >
              <Ionicons name="alert-circle" size={32} color={C.red} />
            </LinearGradient>
            <Text style={styles.loaderTitle}>Failed to load ride</Text>
            <Text style={styles.loaderSub}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!driverCoord || !dropCoord) {
    return (
      <ScreenWrapper backgroundColor={C.bg}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <LinearGradient colors={GRAD.primary} style={styles.loaderIconWrap}>
              <Ionicons name="navigate" size={32} color={C.white} />
            </LinearGradient>
            <ActivityIndicator
              size="large"
              color={C.violet}
              style={{ marginTop: SP.xl }}
            />
            <Text style={styles.loaderTitle}>Locating driver...</Text>
            <Text style={styles.loaderSub}>Waiting for driver location</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ── Derived data ──
  const driverName =
    order?.driver?.full_name || order?.driver_name || "Driver";
  const vehicleNumber =
    order?.driver?.vehicle || order?.vehicle_number || "---";
  const vehicleModel =
    order?.vehicle_model || order?.vehicle || "Vehicle";
  const paymentMethod = getPaymentMethod();
  const customerTotal = getCustomerTotal();
  const isCash = isCashPayment();
  const paymentStatus = order?.payment_status;
  const pickupAddress =
    order?.pickup_address || "Pickup Location";
  const dropAddress = order?.drop_address || "Drop Location";

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ==================== RENDER ====================
  return (
    <View style={styles.container}>

      {/* ── MAP ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic
        onMapReady={() => setMapReady(true)}
        onPanDrag={() => setAutoFollow(false)}
        initialRegion={{
          ...driverCoord,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {useCarImage ? (
          <CarMarker coordinate={driverCoord} heading={heading} />
        ) : (
          <CarMarkerIcon coordinate={driverCoord} heading={heading} />
        )}
        {pickupCoord && order?.status === "in_progress" && (
          <PickupMarker coordinate={pickupCoord} />
        )}
        <PulseMarker coordinate={dropCoord} />
        <MapViewDirections
          origin={driverCoord}
          destination={dropCoord}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={5}
          strokeColor={C.violet}
          optimizeWaypoints
          mode="DRIVING"
          onReady={(r) => {
            setDistance(r.distance.toFixed(1));
            setDuration(Math.ceil(r.duration));
            if (!totalDistance) setTotalDistance(r.distance);
          }}
        />
      </MapView>

      {/* ── HEADER ── */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "ios" ? 54 : 20,
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>

        {/* LIVE badge */}
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE TRACKING</Text>
        </View>

        {/* SOS */}
        <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
          <Text style={styles.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Auto-follow badge */}
      {autoFollow && (
        <Animated.View style={[styles.autoFollowBadge, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={GRAD.lavender}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.autoFollowDot} />
          <Text style={styles.autoFollowText}>Auto-tracking</Text>
        </Animated.View>
      )}

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[
            styles.mapControlBtn,
            !autoFollow && styles.mapControlBtnActive,
          ]}
          onPress={handleShowFullRoute}
        >
          {!autoFollow ? (
            <LinearGradient colors={GRAD.primary} style={StyleSheet.absoluteFill} />
          ) : null}
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={18}
            color={!autoFollow ? C.white : C.violet}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mapControlBtn,
            autoFollow && styles.mapControlBtnActive,
          ]}
          onPress={handleRecenter}
        >
          {autoFollow ? (
            <LinearGradient colors={GRAD.primary} style={StyleSheet.absoluteFill} />
          ) : null}
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={18}
            color={autoFollow ? C.white : C.violet}
          />
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM CARD ── */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sheetHandle} />

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
              <LinearGradient
                colors={GRAD.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <View style={styles.progressLabels}>
            <View style={styles.progressLabelLeft}>
              <LinearGradient
                colors={GRAD.primary}
                style={styles.progressDotLeft}
              />
              <Text style={styles.progressLabelText}>On the way</Text>
            </View>
            <View style={styles.progressLabelRight}>
              <Text style={styles.progressLabelText}>Drop-off</Text>
              <View style={styles.progressDotRight} />
            </View>
          </View>
        </View>

        {/* ETA Section */}
        <View style={styles.etaCard}>
          <LinearGradient
            colors={GRAD.lavender}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.etaLeft}>
            <Text style={styles.etaTime}>{duration || "--"}</Text>
            <Text style={styles.etaUnit}>min</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaRight}>
            <Text style={styles.etaLabel}>Arriving in</Text>
            <Text style={styles.etaDistance}>
              {distance || "--"} km away
            </Text>
          </View>
          <View style={styles.etaIconWrap}>
            <LinearGradient colors={GRAD.primary} style={styles.etaIconCircle}>
              <Ionicons name="navigate" size={14} color={C.white} />
            </LinearGradient>
          </View>
        </View>

        {/* Driver Row */}
        <View style={styles.driverRow}>
          <LinearGradient colors={GRAD.primary} style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {driverName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleModel}>{vehicleModel}</Text>
              <View style={styles.vehicleDot} />
              <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
            </View>
            <View style={styles.driverRatingRow}>
              <Ionicons name="star" size={11} color={C.gold} />
              <Text style={styles.driverRating}>4.9</Text>
            </View>
          </View>

          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.callBtn} onPress={callDriver}>
              <Ionicons name="call" size={17} color={C.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.msgBtn}>
              <Ionicons
                name="chatbubble-ellipses"
                size={15}
                color={C.violet}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Route */}
        <View style={styles.routeSection}>
          <View style={styles.routeTimeline}>
            <LinearGradient
              colors={GRAD.primary}
              style={styles.routeDotTop}
            />
            <View style={styles.routeLine} />
            <View style={styles.routeDotBottom} />
          </View>
          <View style={styles.routeLocations}>
            <Text style={styles.routePickup} numberOfLines={1}>
              {pickupAddress}
            </Text>
            <Text style={styles.routeDrop} numberOfLines={1}>
              {dropAddress}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Payment row */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentLeft}>
            <View
              style={[
                styles.paymentIconWrap,
                {
                  backgroundColor: isCash ? C.warningBg : C.primarySoft,
                },
              ]}
            >
              <Ionicons
                name={isCash ? "cash-outline" : "phone-portrait-outline"}
                size={15}
                color={isCash ? C.warning : C.violet}
              />
            </View>
            <View>
              <Text style={styles.paymentLabel}>Payment</Text>
              <Text
                style={[
                  styles.paymentMethod,
                  { color: isCash ? C.warning : C.violet },
                ]}
              >
                {isCash ? "Pay Cash" : "Pay Online"}
              </Text>
            </View>
          </View>

          <View style={styles.paymentRight}>
            <Text style={styles.fareAmount}>₹{customerTotal}</Text>
            {isPaymentDone() && (
              <View style={styles.paidBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={11}
                  color={C.successDark}
                />
                <Text style={styles.paidText}>Paid</Text>
              </View>
            )}
          </View>
        </View>

        {/* Inline Pay Button */}
        {!isCash && !isPaymentDone() && (
          <Animated.View style={{ transform: [{ scale: goldPulse }] }}>
            <TouchableOpacity
              style={[
                styles.payNowInlineBtn,
                paymentLoading && { opacity: 0.6 },
              ]}
              onPress={initiatePayment}
              disabled={paymentLoading}
              activeOpacity={0.85}
            >
              {paymentLoading ? (
                <ActivityIndicator color={C.textDark} size="small" />
              ) : (
                <>
                  <View style={styles.payNowBtnIconLeft}>
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color={C.textDark}
                    />
                  </View>
                  <Text style={styles.payNowBtnText}>
                    Pay ₹{customerTotal} Now
                  </Text>
                  <View style={styles.payNowBtnIconRight}>
                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={C.textDark}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* ── ONLINE PAYMENT MODAL ── */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <View style={styles.paymentModalHandle} />

            {/* Icon */}
            <View style={styles.paymentModalIconRow}>
              <LinearGradient
                colors={GRAD.primary}
                style={styles.paymentModalIcon}
              >
                <Ionicons name="card" size={32} color={C.white} />
              </LinearGradient>
            </View>

            <Text style={styles.paymentModalTitle}>Complete Payment</Text>
            <Text style={styles.paymentModalSub}>
              Your ride is complete! Pay to finish.
            </Text>

            {/* Summary */}
            <View style={styles.paymentModalSummaryCard}>
              <LinearGradient
                colors={GRAD.lavender}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>Ride Fare</Text>
                <Text style={styles.paymentSummaryValue}>
                  ₹{customerTotal}
                </Text>
              </View>
              <View style={styles.paymentSummaryDivider} />
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>Method</Text>
                <View style={styles.paymentSummaryMethodRow}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={14}
                    color={C.violet}
                  />
                  <Text style={styles.paymentSummaryMethod}>Online</Text>
                </View>
              </View>
            </View>

            <Animated.View
              style={{ transform: [{ scale: goldPulse }], width: "100%" }}
            >
              <TouchableOpacity
                style={[
                  styles.payNowModalBtn,
                  paymentLoading && { opacity: 0.6 },
                ]}
                onPress={initiatePayment}
                disabled={paymentLoading}
                activeOpacity={0.85}
              >
                {paymentLoading ? (
                  <ActivityIndicator color={C.textDark} />
                ) : (
                  <>
                    <View style={styles.payNowBtnIconLeft}>
                      <Ionicons
                        name="shield-checkmark"
                        size={15}
                        color={C.textDark}
                      />
                    </View>
                    <Text style={styles.payNowModalBtnText}>
                      Pay ₹{customerTotal} Now
                    </Text>
                    <View style={styles.payNowBtnIconRight}>
                      <Ionicons
                        name="arrow-forward"
                        size={13}
                        color={C.textDark}
                      />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.securedRow}>
              <Ionicons name="lock-closed" size={12} color={C.textFaint} />
              <Text style={styles.securedText}>Secured by Razorpay</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── RIDE COMPLETED MODAL ── */}
      <Modal
        visible={rideEnded || paymentSuccess}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completedModal}>
            <View style={styles.completedModalHandle} />

            {/* Success icon */}
            <View style={styles.completedIconOuter}>
              <View style={styles.completedIconInner}>
                <LinearGradient
                  colors={[C.success, C.greenDark]}
                  style={styles.completedIconCircle}
                >
                  <Ionicons name="checkmark" size={40} color={C.white} />
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.completedTitle}>Ride Completed! 🎉</Text>
            <Text style={styles.completedSub}>
              You have reached your destination safely
            </Text>

            {/* Trip summary */}
            <View style={styles.tripSummaryCard}>
              <LinearGradient
                colors={GRAD.lavender}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tripSummaryHeader}
              >
                <View style={styles.tripSummaryHeaderIcon}>
                  <Ionicons name="receipt" size={13} color={C.violet} />
                </View>
                <Text style={styles.tripSummaryHeaderTitle}>
                  Trip Summary
                </Text>
              </LinearGradient>

              <View style={styles.tripSummaryBody}>
                <View style={styles.tripSummaryRow}>
                  <Text style={styles.tripSummaryLabel}>Trip Fare</Text>
                  <Text style={styles.tripSummaryValue}>
                    ₹{customerTotal}
                  </Text>
                </View>
                <View style={styles.tripSummaryDivider} />
                <View style={styles.tripSummaryRow}>
                  <Text style={styles.tripSummaryLabel}>Payment</Text>
                  <View style={styles.tripSummaryMethodRow}>
                    <Ionicons
                      name={
                        isCash ? "cash-outline" : "phone-portrait-outline"
                      }
                      size={14}
                      color={isCash ? C.warning : C.violet}
                    />
                    <Text
                      style={[
                        styles.tripSummaryMethod,
                        { color: isCash ? C.warning : C.violet },
                      ]}
                    >
                      {isCash ? "Cash" : "Online"}
                    </Text>
                  </View>
                </View>
                {isPaymentDone() && (
                  <>
                    <View style={styles.tripSummaryDivider} />
                    <View style={styles.tripSummaryRow}>
                      <Text style={styles.tripSummaryLabel}>Status</Text>
                      <View style={styles.paidStatusRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={C.successDark}
                        />
                        <Text style={styles.paidStatusText}>Paid</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>

            <Text style={styles.thanksText}>
              Thank you for riding with us! 🙏
            </Text>

            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: "HomeTabs" }],
                })
              }
              activeOpacity={0.85}
            >
              <LinearGradient colors={GRAD.primary} style={styles.homeBtnGrad}>
                <Text style={styles.homeBtnText}>Back to Home</Text>
                <View style={styles.homeBtnIcon}>
                  <Ionicons name="home" size={15} color={C.textDark} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── SOS MODAL ── */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.sosOverlay}>
          <View style={styles.sosModal}>
            {/* Header */}
            <View style={styles.sosModalHeader}>
              <LinearGradient
                colors={[C.red, "#C0392B"]}
                style={styles.sosModalIconCircle}
              >
                <Ionicons name="warning" size={28} color={C.white} />
              </LinearGradient>
              <Text style={styles.sosModalTitle}>Emergency SOS</Text>
              <Text style={styles.sosModalSub}>Select an option below</Text>
            </View>

            <View style={styles.sosOptions}>
              {[
                {
                  fn: callEmergency,
                  bg: [C.red, "#C0392B"],
                  icon: "call",
                  title: "Call Emergency",
                  desc: "Dial 112",
                },
                {
                  fn: callPolice,
                  bg: ["#2563EB", "#1E40AF"],
                  icon: "shield",
                  title: "Call Police",
                  desc: "Dial 100",
                },
                {
                  fn: callAmbulance,
                  bg: ["#059669", "#047857"],
                  icon: "medkit",
                  title: "Call Ambulance",
                  desc: "Dial 108",
                },
                {
                  fn: shareLocation,
                  bg: GRAD.primary,
                  icon: "share-social",
                  title: "Share Location",
                  desc: "Send via SMS",
                },
                {
                  fn: callSupport,
                  bg: GRAD.gold,
                  icon: "headset",
                  title: "Call Support",
                  desc: "24/7 Helpline",
                },
              ].map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.sosOption}
                  onPress={opt.fn}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={opt.bg} style={styles.sosOptionIcon}>
                    <Ionicons name={opt.icon} size={20} color={C.white} />
                  </LinearGradient>
                  <View style={styles.sosOptionInfo}>
                    <Text style={styles.sosOptionTitle}>{opt.title}</Text>
                    <Text style={styles.sosOptionDesc}>{opt.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.textFaint} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.sosCancelBtn}
              onPress={() => setSosModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.sosCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  map: { flex: 1 },

  // ─── Loaders ───
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
  },
  loaderCard: {
    backgroundColor: C.white,
    borderRadius: R.xl,
    padding: SP.xxxl,
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    width: "75%",
  },
  loaderIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
    marginTop: SP.lg,
    letterSpacing: -0.3,
  },
  loaderSub: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: "500",
    marginTop: SP.xs,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: SP.xl,
    backgroundColor: C.primarySoft,
    paddingHorizontal: SP.xl,
    paddingVertical: SP.md,
    borderRadius: R.full,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.violet,
  },

  // ─── Markers ───
  carMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 55,
  },
  carImage: { width: 40, height: 40 },
  carShadow: {
    position: "absolute",
    bottom: 2,
    width: 30,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  carIconWrap: { alignItems: "center" },
  carIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  carIconShadow: {
    width: 28,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginTop: 2,
  },
  pickupMarkerWrap: { alignItems: "center", justifyContent: "center" },
  pickupMarkerOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  pickupMarkerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.white,
  },
  pickupMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.white,
  },
  destMarkerWrap: { alignItems: "center", justifyContent: "center" },
  destPulseRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.red + "60",
  },
  destDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.white,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },

  // ─── Header ───
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SP.lg,
    paddingBottom: SP.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
    backgroundColor: C.white,
    paddingHorizontal: SP.md,
    paddingVertical: 8,
    borderRadius: R.full,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.success,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.violet,
    letterSpacing: 0.5,
  },
  sosBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.red,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  sosBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: C.white,
    letterSpacing: 0.5,
  },

  // ─── Auto-follow badge ───
  autoFollowBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 76,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SP.md,
    paddingVertical: 5,
    borderRadius: R.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.violet + "20",
    gap: SP.xs,
    zIndex: 10,
  },
  autoFollowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.success,
  },
  autoFollowText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.violet,
  },

  // ─── Map Controls ───
  mapControls: {
    position: "absolute",
    right: SP.lg,
    bottom: "47%",
    gap: SP.sm,
    zIndex: 10,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapControlBtnActive: {
    shadowColor: C.violet,
    shadowOpacity: 0.3,
  },

  // ─── Bottom Card ───
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    paddingTop: SP.md,
    paddingHorizontal: SP.lg,
    paddingBottom: Platform.OS === "ios" ? 30 : SP.xl,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: "center",
    marginBottom: SP.md,
  },

  // ─── Progress ───
  progressSection: { marginBottom: SP.md },
  progressBg: {
    height: 6,
    backgroundColor: C.primarySoft,
    borderRadius: R.full,
    overflow: "hidden",
    marginBottom: SP.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: R.full,
    overflow: "hidden",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
  },
  progressLabelRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
  },
  progressDotLeft: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotRight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },
  progressLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textLight,
  },

  // ─── ETA ───
  etaCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: R.lg,
    padding: SP.md,
    marginBottom: SP.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.violet + "18",
  },
  etaLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    marginRight: SP.sm,
  },
  etaTime: {
    fontSize: 30,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -1,
  },
  etaUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textLight,
    marginLeft: 3,
  },
  etaDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.borderMid,
    marginHorizontal: SP.md,
  },
  etaRight: { flex: 1 },
  etaLabel: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: "600",
    marginBottom: 2,
  },
  etaDistance: {
    fontSize: 14,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.3,
  },
  etaIconWrap: {},
  etaIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // ─── Driver ───
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SP.md,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SP.md,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  driverAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: C.white,
  },
  driverInfo: { flex: 1 },
  driverName: {
    fontSize: 15,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  vehicleModel: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
  },
  vehicleDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.textFaint,
    marginHorizontal: 5,
  },
  vehicleNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textDark,
  },
  driverRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  driverRating: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textDark,
  },
  driverActions: { gap: SP.sm },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.violet,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  msgBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },

  cardDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: SP.sm,
  },

  // ─── Route ───
  routeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SP.sm,
  },
  routeTimeline: {
    alignItems: "center",
    marginRight: SP.md,
  },
  routeDotTop: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: C.border,
    marginVertical: 3,
  },
  routeDotBottom: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.red,
  },
  routeLocations: { flex: 1 },
  routePickup: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textDark,
    marginBottom: SP.sm,
  },
  routeDrop: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textDark,
  },

  // ─── Payment row ───
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SP.sm,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.md,
  },
  paymentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textLight,
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  paymentRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.5,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.successBg,
    paddingHorizontal: SP.sm,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  paidText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.successDark,
  },

  // ─── Pay Now Inline ───
  payNowInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gold,
    paddingVertical: SP.md + 2,
    borderRadius: R.full,
    marginTop: SP.md,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    gap: SP.sm,
  },
  payNowBtnIconLeft: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  payNowBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: 0.2,
  },
  payNowBtnIconRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Modal Overlay ───
  modalOverlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: "flex-end",
  },

  // ─── Payment Modal ───
  paymentModal: {
    backgroundColor: C.white,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    padding: SP.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : SP.xl,
    alignItems: "center",
  },
  paymentModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: "center",
    marginBottom: SP.lg,
  },
  paymentModalIconRow: { marginBottom: SP.lg },
  paymentModalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.4,
    marginBottom: SP.xs,
  },
  paymentModalSub: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: SP.lg,
  },
  paymentModalSummaryCard: {
    width: "100%",
    borderRadius: R.lg,
    padding: SP.lg,
    marginBottom: SP.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.violet + "18",
  },
  paymentSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SP.xs,
  },
  paymentSummaryLabel: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: "500",
  },
  paymentSummaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: C.violet,
    letterSpacing: -0.5,
  },
  paymentSummaryDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: SP.sm,
  },
  paymentSummaryMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
  },
  paymentSummaryMethod: {
    fontSize: 13,
    fontWeight: "700",
    color: C.violet,
  },
  payNowModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gold,
    paddingVertical: SP.md + 2,
    borderRadius: R.full,
    width: "100%",
    marginBottom: SP.md,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    gap: SP.sm,
  },
  payNowModalBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: 0.2,
  },
  securedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
  },
  securedText: {
    fontSize: 12,
    color: C.textFaint,
    fontWeight: "500",
  },

  // ─── Completed Modal ───
  completedModal: {
    backgroundColor: C.white,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    padding: SP.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : SP.xl,
    alignItems: "center",
  },
  completedModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: "center",
    marginBottom: SP.lg,
  },
  completedIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.successBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SP.lg,
  },
  completedIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  completedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.5,
    marginBottom: SP.xs,
  },
  completedSub: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: SP.lg,
  },
  tripSummaryCard: {
    width: "100%",
    borderRadius: R.lg,
    marginBottom: SP.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  tripSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tripSummaryHeaderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  tripSummaryHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.violet,
  },
  tripSummaryBody: { padding: SP.lg },
  tripSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SP.xs,
  },
  tripSummaryLabel: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: "500",
  },
  tripSummaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: C.textDark,
  },
  tripSummaryDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: SP.sm,
  },
  tripSummaryMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
  },
  tripSummaryMethod: {
    fontSize: 13,
    fontWeight: "700",
  },
  paidStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.xs,
  },
  paidStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.successDark,
  },
  thanksText: {
    fontSize: 14,
    color: C.textMid,
    fontWeight: "500",
    marginBottom: SP.xl,
    textAlign: "center",
  },
  homeBtn: {
    width: "100%",
    borderRadius: R.full,
    overflow: "hidden",
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  homeBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SP.md + 2,
    gap: SP.md,
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.2,
  },
  homeBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.gold,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── SOS ───
  sosOverlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: SP.xl,
  },
  sosModal: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: R.xxl,
    padding: SP.xl,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  sosModalHeader: {
    alignItems: "center",
    marginBottom: SP.xl,
  },
  sosModalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SP.md,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  sosModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.4,
  },
  sosModalSub: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: "500",
    marginTop: SP.xs,
  },
  sosOptions: { gap: SP.sm, marginBottom: SP.lg },
  sosOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    padding: SP.md,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  sosOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sosOptionInfo: {
    flex: 1,
    marginLeft: SP.md,
  },
  sosOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
  },
  sosOptionDesc: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
    marginTop: 2,
  },
  sosCancelBtn: {
    paddingVertical: SP.md,
    alignItems: "center",
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  sosCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textMid,
  },
});