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
import RazorpayCheckout from "react-native-razorpay";
import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import { API_BASE_URL } from "../../config";
import ScreenWrapper from "../../components/ScreenWrapper";

const CAR_IMAGE = require("../../assets/car-top.png");
const GOOGLE_MAPS_APIKEY = "AIzaSyDbTEOzGx3L0pr6D1_9q8whfqhLyyyL-EI";

const { width, height } = Dimensions.get("window");
const BOTTOM_CARD_HEIGHT = height * 0.45;

const COLORS = {
  primary: "#000000",
  white: "#FFFFFF",
  dark: "#1F2937",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  success: "#10B981",
  successLight: "rgba(16, 185, 129, 0.1)",
  error: "#EF4444",
  blue: "#3B82F6",
  blueLight: "rgba(59, 130, 246, 0.1)",
  warning: "#F59E0B",
  warningLight: "rgba(245, 158, 11, 0.1)",
  orange: "#F59E0B",
  orangeLight: "rgba(245, 158, 11, 0.1)",
};

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const PulseMarker = ({ coordinate }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]));
    p.start();
    return () => p.stop();
  }, []);
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} zIndex={1}>
      <View style={styles.destinationMarkerContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.destinationDot}>
          <Ionicons name="flag" size={14} color={COLORS.white} />
        </View>
      </View>
    </Marker>
  );
};

const CarMarker = ({ coordinate, heading }) => {
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} rotation={heading || 0} flat tracksViewChanges={false} zIndex={999}>
      <View style={styles.carMarkerWrapper}>
        <View style={styles.carShadow} />
        <Image source={CAR_IMAGE} style={styles.carImage} resizeMode="contain" />
      </View>
    </Marker>
  );
};

const CarMarkerIcon = ({ coordinate, heading }) => {
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} rotation={heading || 0} flat tracksViewChanges={false} zIndex={999}>
      <View style={styles.carIconContainer}>
        <View style={styles.carIconBg}>
          <FontAwesome5 name="car-side" size={16} color={COLORS.white} />
        </View>
        <View style={styles.carIconShadow} />
      </View>
    </Marker>
  );
};

const PickupMarker = ({ coordinate }) => {
  if (!coordinate) return null;
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
      <View style={styles.pickupMarkerContainer}>
        <View style={styles.pickupOuterCircle}>
          <View style={styles.pickupInnerCircle} />
        </View>
      </View>
    </Marker>
  );
};

export default function LiveRideScreen({ route, navigation }) {
  const { orderId } = route.params;
  const mapRef = useRef(null);

  const app = getApp();
  const auth = getAuth(app);
  const user = auth.currentUser;

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

  // ====== PAYMENT STATES ======
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const prevCoordRef = useRef(null);
  const lastZoomUpdateRef = useRef(0);
  const paymentTriggeredRef = useRef(false);

  const calculateHeading = (from, to) => {
    if (!from || !to) return 0;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  };

  const handleSOS = () => setSosModalVisible(true);
  const callEmergency = () => { setSosModalVisible(false); Linking.openURL("tel:112"); };
  const callPolice = () => { setSosModalVisible(false); Linking.openURL("tel:100"); };
  const callAmbulance = () => { setSosModalVisible(false); Linking.openURL("tel:108"); };
  const callSupport = () => { setSosModalVisible(false); Linking.openURL("tel:+919999999999"); };

  const shareLocation = async () => {
    if (!driverCoord) return;
    const msg = `🆘 EMERGENCY!\nDriver: ${order?.driver?.full_name || "Unknown"}\nVehicle: ${order?.driver?.vehicle || "Unknown"}\nLocation: https://www.google.com/maps?q=${driverCoord.latitude},${driverCoord.longitude}\nOrder: ${orderId}`;
    try { await Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`); } catch {}
    setSosModalVisible(false);
  };

  // ====== PAYMENT HELPERS ======
  const getPaymentMethod = () => order?.paymentBreakdown?.paymentMethod || order?.payment_method || order?.payment_mode || "cash";
  const getCustomerTotal = () => parseFloat(order?.paymentBreakdown?.customerTotal || order?.customer_total || order?.price || 0);
  const isCashPayment = () => getPaymentMethod() === "cash";
  const isOnlinePayment = () => !isCashPayment();
  const isPaymentDone = () => order?.payment_status === "paid" || paymentSuccess;

  // ====== RAZORPAY PAYMENT ======
  const initiatePayment = async () => {
    if (paymentTriggeredRef.current) return;
    paymentTriggeredRef.current = true;
    setPaymentLoading(true);

    try {
      // Step 1: Create Razorpay order on backend
      const createRes = await fetch(`${API_BASE_URL}/orders/${orderId}/create-payment`, {
        method: "POST",
      });

      if (!createRes.ok) {
        throw new Error("Failed to create payment order");
      }

      const paymentData = await createRes.json();

      // Step 2: Open Razorpay checkout
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
        theme: { color: "#000000" },
      };

      const razorpayResponse = await RazorpayCheckout.open(options);

      // Step 3: Verify payment on backend
      const verifyRes = await fetch(`${API_BASE_URL}/orders/${orderId}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error("Payment verification failed");
      }

      // Payment successful!
      setPaymentSuccess(true);
      setShowPaymentModal(false);

      console.log("✅ Payment successful for order", orderId);

    } catch (err) {
      console.error("Payment error:", err);
      paymentTriggeredRef.current = false;

      if (err.code === "CANCELLED" || err.description === "Payment cancelled") {
        Alert.alert(
          "Payment Required",
          "You need to complete the payment for this ride.",
          [
            { text: "Pay Now", onPress: () => { paymentTriggeredRef.current = false; initiatePayment(); } },
            { text: "Pay Later", style: "cancel" },
          ]
        );
      } else {
        Alert.alert(
          "Payment Failed",
          err.message || "Something went wrong. Please try again.",
          [
            { text: "Retry", onPress: () => { paymentTriggeredRef.current = false; initiatePayment(); } },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // ====== FETCH ORDER DATA ======
  useEffect(() => {
    if (!orderId) { setError("Invalid order ID"); setLoading(false); return; }

    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        setOrder(data);
        setLoading(false);

        // ====== CHECK IF RIDE COMPLETED & NEEDS PAYMENT ======
        if (data.status === "completed") {
          const payMethod = data.payment_method || data.payment_mode || "cash";
          const isPaid = data.payment_status === "paid";

          if (payMethod !== "cash" && !isPaid && !paymentTriggeredRef.current && !paymentSuccess) {
            // Online payment needed - show payment modal
            setShowPaymentModal(true);
          } else {
            // Cash ride or already paid - show completed
            setRideEnded(true);
          }
          return;
        }

        if (data.drop_lat && data.drop_lng) {
          const dLat = Number(data.drop_lat), dLng = Number(data.drop_lng);
          if (!isNaN(dLat) && !isNaN(dLng)) setDropCoord({ latitude: dLat, longitude: dLng });
        }
        if (data.pickup_lat && data.pickup_lng) {
          const pLat = Number(data.pickup_lat), pLng = Number(data.pickup_lng);
          if (!isNaN(pLat) && !isNaN(pLng)) setPickupCoord({ latitude: pLat, longitude: pLng });
        }

        let newDriverCoord = null;
        if (data.driverLocation?.lat && data.driverLocation?.lng) {
          const lat = Number(data.driverLocation.lat), lng = Number(data.driverLocation.lng);
          if (!isNaN(lat) && !isNaN(lng)) newDriverCoord = { latitude: lat, longitude: lng };
        }
        if (!newDriverCoord && data.pickup_lat && data.pickup_lng) {
          const lat = Number(data.pickup_lat), lng = Number(data.pickup_lng);
          if (!isNaN(lat) && !isNaN(lng)) newDriverCoord = { latitude: lat, longitude: lng };
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
        if (isMounted) { setError(err.message); setLoading(false); }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [orderId, paymentSuccess]);

  // Map fitting
  useEffect(() => {
    if (mapReady && mapRef.current && driverCoord && dropCoord && !initialFitDone) {
      setTimeout(() => { fitMapToRoute(); setInitialFitDone(true); }, 800);
    }
  }, [mapReady, driverCoord, dropCoord, initialFitDone]);

  const fitMapToRoute = () => {
    if (!mapRef.current || !driverCoord || !dropCoord) return;
    mapRef.current.fitToCoordinates([driverCoord, dropCoord], {
      edgePadding: { top: 80, right: 50, bottom: BOTTOM_CARD_HEIGHT + 20, left: 50 },
      animated: true,
    });
  };

  useEffect(() => {
    if (!mapReady || !driverCoord || !dropCoord || !autoFollow || !initialFitDone) return;
    const now = Date.now();
    if (now - lastZoomUpdateRef.current < 3000) return;
    lastZoomUpdateRef.current = now;

    const d = getDistanceFromLatLonInKm(driverCoord.latitude, driverCoord.longitude, dropCoord.latitude, dropCoord.longitude);
    if (d < 0.3) {
      mapRef.current?.animateToRegion({ ...driverCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000);
    } else {
      fitMapToRoute();
    }
  }, [driverCoord, dropCoord, mapReady, autoFollow, initialFitDone]);

  const getProgress = () => {
    if (!totalDistance || !distance) return 0;
    return Math.min(Math.max(((totalDistance - parseFloat(distance)) / totalDistance) * 100, 0), 100);
  };

  const callDriver = () => {
    const phone = order?.driver?.phone || order?.driver_phone;
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("Error", "Driver phone not available");
  };

  const handleRecenter = () => { setAutoFollow(true); fitMapToRoute(); };
  const handleShowFullRoute = () => { setAutoFollow(false); fitMapToRoute(); };

  // Loading states
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading ride details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.loaderText}>Failed to load ride</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!driverCoord || !dropCoord) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Waiting for driver location...</Text>
        </View>
      </View>
    );
  }

  const driverName = order?.driver?.full_name || order?.driver_name || "Driver";
  const vehicleNumber = order?.driver?.vehicle || order?.vehicle_number || "---";
  const vehicleModel = order?.vehicle_model || order?.vehicle || "Vehicle";
  const paymentMethod = getPaymentMethod();
  const customerTotal = getCustomerTotal();
  const isCash = isCashPayment();
  const paymentStatus = order?.payment_status;
  const pickupAddress = order?.pickup_address || "Pickup Location";
  const dropAddress = order?.drop_address || "Drop Location";

  return (
    <ScreenWrapper bg={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle} showsUserLocation={false}
          showsMyLocationButton={false} showsCompass={false} showsTraffic
          onMapReady={() => setMapReady(true)} onPanDrag={() => setAutoFollow(false)}
          initialRegion={{ ...driverCoord, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        >
          {useCarImage ? <CarMarker coordinate={driverCoord} heading={heading} /> : <CarMarkerIcon coordinate={driverCoord} heading={heading} />}
          {pickupCoord && order?.status === "in_progress" && <PickupMarker coordinate={pickupCoord} />}
          <PulseMarker coordinate={dropCoord} />
          <MapViewDirections
            origin={driverCoord} destination={dropCoord} apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4} strokeColor={COLORS.primary} optimizeWaypoints mode="DRIVING"
            onReady={(r) => { setDistance(r.distance.toFixed(1)); setDuration(Math.ceil(r.duration)); if (!totalDistance) setTotalDistance(r.distance); }}
          />
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={[styles.mapControlBtn, !autoFollow && styles.mapControlBtnActive]} onPress={handleShowFullRoute}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={!autoFollow ? COLORS.white : COLORS.dark} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mapControlBtn, autoFollow && styles.mapControlBtnActive]} onPress={handleRecenter}>
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={autoFollow ? COLORS.white : COLORS.dark} />
          </TouchableOpacity>
        </View>

        {autoFollow && (
          <View style={styles.autoFollowBadge}>
            <View style={styles.autoFollowDot} />
            <Text style={styles.autoFollowText}>Auto-tracking</Text>
          </View>
        )}

        {/* Bottom Card */}
        <View style={styles.bottomCard}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>On the way</Text>
              <Text style={styles.progressText}>Drop-off</Text>
            </View>
          </View>

          <View style={styles.etaSection}>
            <View style={styles.etaMain}>
              <Text style={styles.etaTime}>{duration || "--"}</Text>
              <Text style={styles.etaUnit}>min</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaDetails}>
              <Text style={styles.etaLabel}>Arriving in</Text>
              <Text style={styles.etaDistance}>{distance || "--"} km away</Text>
            </View>
          </View>

          <View style={styles.driverSection}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={22} color={COLORS.gray} />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverName}</Text>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleModel}>{vehicleModel}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
                </View>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn} onPress={callDriver}>
                <Ionicons name="call" size={18} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rideDetails}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}><View style={styles.greenDot} /></View>
              <Text style={styles.locationText} numberOfLines={1}>{pickupAddress}</Text>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}><View style={styles.redDot} /></View>
              <Text style={styles.locationText} numberOfLines={1}>{dropAddress}</Text>
            </View>
          </View>

          <View style={styles.paymentSection}>
            <View style={styles.paymentLeft}>
              <Ionicons name={isCash ? "cash" : "phone-portrait-outline"} size={18} color={isCash ? COLORS.warning : COLORS.blue} />
              <Text style={styles.paymentMode}>{isCash ? "CASH" : "ONLINE"}</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.fareAmount}>₹{customerTotal}</Text>
              {(paymentStatus === "paid" || paymentSuccess) && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              )}
            </View>
          </View>

          {/* ====== INLINE PAY BUTTON ====== */}
          {!isCash && !(paymentStatus === "paid" || paymentSuccess) && (
            <TouchableOpacity
              style={[styles.inlinePayBtn, paymentLoading && { opacity: 0.6 }]}
              onPress={initiatePayment}
              disabled={paymentLoading}
              activeOpacity={0.8}
            >
              {paymentLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
                  <Text style={styles.inlinePayText}>Pay ₹{customerTotal} Now</Text>
                  <Text style={styles.inlinePaySecure}>🔒</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ====== ONLINE PAYMENT MODAL ====== */}
        <Modal visible={showPaymentModal} transparent animationType="slide">
          <View style={styles.paymentModalOverlay}>
            <View style={styles.paymentModalContent}>
              <View style={styles.paymentModalIconContainer}>
                <View style={styles.paymentModalIconBg}>
                  <Ionicons name="card-outline" size={40} color={COLORS.white} />
                </View>
              </View>

              <Text style={styles.paymentModalTitle}>Complete Payment</Text>
              <Text style={styles.paymentModalSubtitle}>
                Your ride is completed! Please pay to finish.
              </Text>

              <View style={styles.paymentModalSummary}>
                <View style={styles.paymentModalRow}>
                  <Text style={styles.paymentModalLabel}>Ride Fare</Text>
                  <Text style={styles.paymentModalValue}>₹{customerTotal}</Text>
                </View>
                <View style={styles.paymentModalDivider} />
                <View style={styles.paymentModalRow}>
                  <Text style={styles.paymentModalLabel}>Payment Method</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="phone-portrait-outline" size={16} color={COLORS.blue} />
                    <Text style={[styles.paymentModalValue, { color: COLORS.blue, marginLeft: 4 }]}>ONLINE</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.payNowBtn, paymentLoading && { opacity: 0.7 }]}
                onPress={initiatePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                    <Text style={styles.payNowText}>Pay ₹{customerTotal} Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.secureText}>
                🔒 Secured by Razorpay
              </Text>
            </View>
          </View>
        </Modal>

        {/* ====== RIDE COMPLETED MODAL ====== */}
        <Modal visible={rideEnded || paymentSuccess} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <View style={styles.modalIconBg}>
                  <Ionicons name="checkmark" size={50} color={COLORS.white} />
                </View>
              </View>

              <Text style={styles.modalTitle}>Ride Completed!</Text>
              <Text style={styles.modalSubtitle}>You have reached your destination safely</Text>

              <View style={styles.tripSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trip Fare</Text>
                  <Text style={styles.summaryValue}>₹{customerTotal}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payment</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name={isCash ? "cash-outline" : "phone-portrait-outline"} size={16} color={isCash ? COLORS.warning : COLORS.blue} />
                    <Text style={{ fontSize: 13, fontWeight: "700", marginLeft: 4, color: isCash ? COLORS.warning : COLORS.blue }}>
                      {isCash ? "CASH" : "ONLINE"}
                    </Text>
                  </View>
                </View>
                {(paymentStatus === "paid" || paymentSuccess) && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Status</Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.success, marginLeft: 4 }}>Paid</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <Text style={styles.thanksText}>Thank you for riding with us! 🙏</Text>

              <TouchableOpacity style={styles.homeButton} onPress={() => navigation.reset({ index: 0, routes: [{ name: "HomeTabs" }] })}>
                <Text style={styles.homeButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* SOS Modal */}
        <Modal visible={sosModalVisible} transparent animationType="fade">
          <View style={styles.sosModalOverlay}>
            <View style={styles.sosModalContent}>
              <View style={styles.sosModalHeader}>
                <View style={styles.sosModalIconBg}><Ionicons name="warning" size={32} color={COLORS.white} /></View>
                <Text style={styles.sosModalTitle}>Emergency SOS</Text>
                <Text style={styles.sosModalSubtitle}>Select an option below</Text>
              </View>
              <View style={styles.sosOptions}>
                {[
                  { fn: callEmergency, bg: "#DC2626", icon: "call", title: "Call Emergency", desc: "Dial 112" },
                  { fn: callPolice, bg: "#2563EB", icon: "shield", title: "Call Police", desc: "Dial 100" },
                  { fn: callAmbulance, bg: "#059669", icon: "medkit", title: "Call Ambulance", desc: "Dial 108" },
                  { fn: shareLocation, bg: "#7C3AED", icon: "share-social", title: "Share Location", desc: "Send via SMS" },
                  { fn: callSupport, bg: "#F59E0B", icon: "headset", title: "Call Support", desc: "24/7 Helpline" },
                ].map((opt, i) => (
                  <TouchableOpacity key={i} style={styles.sosOption} onPress={opt.fn}>
                    <View style={[styles.sosOptionIcon, { backgroundColor: opt.bg }]}>
                      <Ionicons name={opt.icon} size={22} color={COLORS.white} />
                    </View>
                    <View style={styles.sosOptionText}>
                      <Text style={styles.sosOptionTitle}>{opt.title}</Text>
                      <Text style={styles.sosOptionDesc}>{opt.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.sosCancelBtn} onPress={() => setSosModalVisible(false)}>
                <Text style={styles.sosCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.lightGray },
  loaderCard: { backgroundColor: COLORS.white, padding: 30, borderRadius: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginHorizontal: 20 },
  loaderText: { marginTop: 15, fontSize: 16, fontWeight: "600", color: COLORS.dark },
  retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },

  header: { position: "absolute", top: Platform.OS === "ios" ? 50 : 15, left: 0, right: 0, zIndex: 100, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerCenter: { alignItems: "center" },
  liveIndicator: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 6 },
  liveText: { fontSize: 11, fontWeight: "700", color: COLORS.success },
  sosButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.error, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sosText: { fontSize: 10, fontWeight: "800", color: COLORS.white },

  map: { flex: 1 },
  mapControls: { position: "absolute", right: 12, bottom: height * 0.48, gap: 8 },
  mapControlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  mapControlBtnActive: { backgroundColor: COLORS.primary },
  autoFollowBadge: { position: "absolute", top: Platform.OS === "ios" ? 100 : 65, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  autoFollowDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 5 },
  autoFollowText: { fontSize: 10, fontWeight: "600", color: COLORS.gray },

  carMarkerWrapper: { alignItems: "center", justifyContent: "center", width: 45, height: 55 },
  carImage: { width: 40, height: 40 },
  carShadow: { position: "absolute", bottom: 2, width: 30, height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.15)" },
  carIconContainer: { alignItems: "center" },
  carIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  carIconShadow: { width: 28, height: 5, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.15)", marginTop: 2 },
  pickupMarkerContainer: { alignItems: "center", justifyContent: "center" },
  pickupOuterCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(16,185,129,0.2)", alignItems: "center", justifyContent: "center" },
  pickupInnerCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white },
  destinationMarkerContainer: { alignItems: "center", justifyContent: "center" },
  pulseCircle: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(239,68,68,0.2)" },
  destinationDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.error, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.white },

  bottomCard: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: Platform.OS === "ios" ? 22 : 16, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  progressContainer: { marginBottom: 14 },
  progressBar: { height: 3, backgroundColor: COLORS.lightGray, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.success, borderRadius: 2 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  progressText: { fontSize: 10, color: COLORS.gray },
  etaSection: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 12, marginBottom: 14 },
  etaMain: { flexDirection: "row", alignItems: "baseline" },
  etaTime: { fontSize: 28, fontWeight: "800", color: COLORS.dark },
  etaUnit: { fontSize: 13, fontWeight: "600", color: COLORS.gray, marginLeft: 3 },
  etaDivider: { width: 1, height: 32, backgroundColor: "#D1D5DB", marginHorizontal: 14 },
  etaDetails: { flex: 1 },
  etaLabel: { fontSize: 11, color: COLORS.gray },
  etaDistance: { fontSize: 13, fontWeight: "600", color: COLORS.dark, marginTop: 2 },
  driverSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, marginBottom: 10 },
  driverInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  driverAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.lightGray, justifyContent: "center", alignItems: "center" },
  driverDetails: { marginLeft: 10, flex: 1 },
  driverName: { fontSize: 14, fontWeight: "700", color: COLORS.dark },
  vehicleInfo: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  vehicleModel: { fontSize: 11, color: COLORS.gray },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.gray, marginHorizontal: 5 },
  vehicleNumber: { fontSize: 11, fontWeight: "600", color: COLORS.dark },
  actionButtons: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.lightGray, justifyContent: "center", alignItems: "center" },
  rideDetails: { marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationIcon: { width: 20, alignItems: "center" },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  redDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.error },
  locationLine: { width: 2, height: 14, backgroundColor: COLORS.lightGray, marginLeft: 9, marginVertical: 2 },
  locationText: { fontSize: 12, color: COLORS.dark, marginLeft: 8, flex: 1 },
  paymentSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.lightGray, padding: 10, borderRadius: 10 },
  paymentLeft: { flexDirection: "row", alignItems: "center" },
  paymentMode: { fontSize: 12, fontWeight: "600", color: COLORS.dark, marginLeft: 6 },
  paymentRight: { flexDirection: "row", alignItems: "center" },
  fareAmount: { fontSize: 15, fontWeight: "800", color: COLORS.dark },
  paidBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#D1FAE5", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, marginLeft: 6 },
  paidText: { fontSize: 10, fontWeight: "600", color: COLORS.success, marginLeft: 2 },

  // ====== INLINE PAY BUTTON ======
  inlinePayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  inlinePayText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  inlinePaySecure: {
    fontSize: 14,
    marginLeft: 8,
  },

  // ====== PAYMENT MODAL ======
  paymentModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  paymentModalContent: { width: "100%", backgroundColor: COLORS.white, borderRadius: 24, padding: 24, alignItems: "center" },
  paymentModalIconContainer: { marginBottom: 16 },
  paymentModalIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.blue, justifyContent: "center", alignItems: "center" },
  paymentModalTitle: { fontSize: 22, fontWeight: "800", color: COLORS.dark, marginBottom: 6 },
  paymentModalSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: "center", marginBottom: 20 },
  paymentModalSummary: { width: "100%", backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 18, marginBottom: 20 },
  paymentModalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  paymentModalLabel: { fontSize: 14, color: COLORS.gray },
  paymentModalValue: { fontSize: 18, fontWeight: "800", color: COLORS.dark },
  paymentModalDivider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
  payNowBtn: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14, marginBottom: 12 },
  payNowText: { fontSize: 17, fontWeight: "700", color: COLORS.white, marginLeft: 8 },
  secureText: { fontSize: 12, color: COLORS.gray },

  // Completed Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center", paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  modalIconContainer: { marginTop: -45, marginBottom: 16 },
  modalIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.success, justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: COLORS.white },
  modalTitle: { fontSize: 22, fontWeight: "800", color: COLORS.dark, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: "center", marginBottom: 20 },
  tripSummary: { width: "100%", backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 18, marginBottom: 18 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, color: COLORS.gray },
  summaryValue: { fontSize: 15, fontWeight: "700", color: COLORS.dark },
  summaryDivider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },
  thanksText: { fontSize: 14, color: COLORS.dark, marginBottom: 20 },
  homeButton: { width: "100%", backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 10 },
  homeButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },

  // SOS Modal
  sosModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  sosModalContent: { width: "100%", backgroundColor: COLORS.white, borderRadius: 24, padding: 20, maxHeight: height * 0.75 },
  sosModalHeader: { alignItems: "center", marginBottom: 20 },
  sosModalIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.error, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  sosModalTitle: { fontSize: 22, fontWeight: "800", color: COLORS.dark },
  sosModalSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  sosOptions: { gap: 10 },
  sosOption: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.lightGray, padding: 14, borderRadius: 14 },
  sosOptionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  sosOptionText: { flex: 1, marginLeft: 12 },
  sosOptionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.dark },
  sosOptionDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  sosCancelBtn: { marginTop: 16, paddingVertical: 14, alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray },
  sosCancelText: { fontSize: 15, fontWeight: "600", color: COLORS.gray },
});