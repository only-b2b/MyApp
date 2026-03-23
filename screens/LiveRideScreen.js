// screens/LiveRideScreen.js
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
import { API_BASE_URL } from "../config";
import ScreenWrapper from "../components/ScreenWrapper";

// ✅ Import car image
const CAR_IMAGE = require("../assets/car-top.png");

const GOOGLE_MAPS_APIKEY = "AIzaSyDbTEOzGx3L0pr6D1_9q8whfqhLyyyL-EI";

const { width, height } = Dimensions.get("window");

// ✅ Calculate bottom card height (approximately)
const BOTTOM_CARD_HEIGHT = height * 0.45;
const HEADER_HEIGHT = Platform.OS === "ios" ? 100 : 70;
const VISIBLE_MAP_HEIGHT = height - BOTTOM_CARD_HEIGHT - HEADER_HEIGHT;

const COLORS = {
  primary: "#000000",
  orange: "#FF6B00",
  white: "#FFFFFF",
  dark: "#1F2937",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  success: "#10B981",
  error: "#EF4444",
};

// Custom Map Style (Uber/Ola like)
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

// ✅ Calculate distance between two coordinates (in km)
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// ✅ FIXED: Get zoom level based on distance - more conservative values
const getZoomLevel = (distanceKm) => {
  // Keep both points visible by using larger delta values
  if (distanceKm > 30) return { latDelta: 0.5, lngDelta: 0.5 };
  if (distanceKm > 20) return { latDelta: 0.35, lngDelta: 0.35 };
  if (distanceKm > 15) return { latDelta: 0.25, lngDelta: 0.25 };
  if (distanceKm > 10) return { latDelta: 0.18, lngDelta: 0.18 };
  if (distanceKm > 5) return { latDelta: 0.12, lngDelta: 0.12 };
  if (distanceKm > 3) return { latDelta: 0.08, lngDelta: 0.08 };
  if (distanceKm > 2) return { latDelta: 0.05, lngDelta: 0.05 };
  if (distanceKm > 1) return { latDelta: 0.03, lngDelta: 0.03 };
  if (distanceKm > 0.5) return { latDelta: 0.015, lngDelta: 0.015 };
  if (distanceKm > 0.2) return { latDelta: 0.008, lngDelta: 0.008 };
  return { latDelta: 0.005, lngDelta: 0.005 };
};

// ✅ Pulse Animation for Destination Marker
const PulseMarker = ({ coordinate }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
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

// ✅ CAR MARKER WITH IMAGE
const CarMarker = ({ coordinate, heading }) => {
  if (!coordinate) return null;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading || 0}
      flat={true}
      tracksViewChanges={false}
      zIndex={999}
    >
      <View style={styles.carMarkerWrapper}>
        <View style={styles.carShadow} />
        <Image
          source={CAR_IMAGE}
          style={styles.carImage}
          resizeMode="contain"
        />
      </View>
    </Marker>
  );
};

// ✅ FALLBACK: Icon-based Car Marker
const CarMarkerIcon = ({ coordinate, heading }) => {
  if (!coordinate) return null;
  
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading || 0}
      flat={true}
      tracksViewChanges={false}
      zIndex={999}
    >
      <View style={styles.carIconContainer}>
        <View style={styles.carIconBg}>
          <FontAwesome5 name="car-side" size={16} color={COLORS.white} />
        </View>
        <View style={styles.carIconShadow} />
      </View>
    </Marker>
  );
};

// ✅ Pickup Marker
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

  // ✅ States
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
  
  // ✅ SOS Modal
  const [sosModalVisible, setSosModalVisible] = useState(false);

  const prevCoordRef = useRef(null);
  const lastZoomUpdateRef = useRef(0);

  // Calculate heading between two points
  const calculateHeading = (from, to) => {
    if (!from || !to) return 0;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const lng1 = (from.longitude * Math.PI) / 180;
    const lng2 = (to.longitude * Math.PI) / 180;
    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  // ✅ SOS FUNCTIONS
  const handleSOS = () => {
    setSosModalVisible(true);
  };

  const callEmergency = () => {
    setSosModalVisible(false);
    Linking.openURL("tel:112"); // India emergency number
  };

  const callPolice = () => {
    setSosModalVisible(false);
    Linking.openURL("tel:100"); // Police
  };

  const callAmbulance = () => {
    setSosModalVisible(false);
    Linking.openURL("tel:108"); // Ambulance
  };

  const shareLocation = async () => {
    if (!driverCoord) return;
    
    const message = `🆘 EMERGENCY! I need help!\n\nI'm in a ride with:\nDriver: ${order?.driver?.full_name || "Unknown"}\nVehicle: ${order?.driver?.vehicle || "Unknown"}\n\nMy current location:\nhttps://www.google.com/maps?q=${driverCoord.latitude},${driverCoord.longitude}\n\nOrder ID: ${orderId}`;
    
    try {
      await Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
    } catch (err) {
      Alert.alert("Error", "Could not open SMS app");
    }
    setSosModalVisible(false);
  };

  const callSupport = () => {
    setSosModalVisible(false);
    // Replace with your support number
    Linking.openURL("tel:+919999999999");
  };

  // ✅ FETCH ORDER DATA
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
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!isMounted) return;

        setOrder(data);
        setLoading(false);

        if (data.status === "completed") {
          setRideEnded(true);
          return;
        }

        // Set drop location
        if (data.drop_lat && data.drop_lng) {
          const dropLat = Number(data.drop_lat);
          const dropLng = Number(data.drop_lng);
          if (!isNaN(dropLat) && !isNaN(dropLng)) {
            setDropCoord({ latitude: dropLat, longitude: dropLng });
          }
        }

        // Set pickup location
        if (data.pickup_lat && data.pickup_lng) {
          const pickupLat = Number(data.pickup_lat);
          const pickupLng = Number(data.pickup_lng);
          if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
            setPickupCoord({ latitude: pickupLat, longitude: pickupLng });
          }
        }

        // Set driver location
        let newDriverCoord = null;

        if (data.driverLocation && data.driverLocation.lat && data.driverLocation.lng) {
          const lat = Number(data.driverLocation.lat);
          const lng = Number(data.driverLocation.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            newDriverCoord = { latitude: lat, longitude: lng };
          }
        }

        // Fallback to pickup location
        if (!newDriverCoord && data.pickup_lat && data.pickup_lng) {
          const lat = Number(data.pickup_lat);
          const lng = Number(data.pickup_lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            newDriverCoord = { latitude: lat, longitude: lng };
          }
        }

        if (newDriverCoord) {
          if (prevCoordRef.current) {
            const newHeading = calculateHeading(prevCoordRef.current, newDriverCoord);
            if (newHeading !== 0) setHeading(newHeading);
          }
          prevCoordRef.current = newDriverCoord;
          setDriverCoord(newDriverCoord);
        }

      } catch (err) {
        console.error("Fetch error:", err);
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
  }, [orderId]);

  // ✅ FIXED: Initial fit to show both markers properly
  useEffect(() => {
    if (mapReady && mapRef.current && driverCoord && dropCoord && !initialFitDone) {
      setTimeout(() => {
        fitMapToRoute();
        setInitialFitDone(true);
      }, 800);
    }
  }, [mapReady, driverCoord, dropCoord, initialFitDone]);

  // ✅ FIXED: Fit map to show both car and destination
  const fitMapToRoute = () => {
    if (!mapRef.current || !driverCoord || !dropCoord) return;

    const coordinates = [driverCoord, dropCoord];
    
    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 80,
        right: 50,
        bottom: BOTTOM_CARD_HEIGHT + 20, // Account for bottom card
        left: 50,
      },
      animated: true,
    });
  };

  // ✅ FIXED: Auto-follow with proper zoom that keeps both points visible
  useEffect(() => {
    if (!mapReady || !mapRef.current || !driverCoord || !dropCoord) return;
    if (!autoFollow || !initialFitDone) return;

    const now = Date.now();
    if (now - lastZoomUpdateRef.current < 3000) return; // Throttle to 3 seconds
    lastZoomUpdateRef.current = now;

    // Calculate distance
    const distanceToDestination = getDistanceFromLatLonInKm(
      driverCoord.latitude,
      driverCoord.longitude,
      dropCoord.latitude,
      dropCoord.longitude
    );

    console.log(`📍 Distance: ${distanceToDestination.toFixed(2)} km`);

    // ✅ For close distances, just follow the car
    if (distanceToDestination < 0.3) {
      mapRef.current?.animateToRegion({
        latitude: driverCoord.latitude,
        longitude: driverCoord.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
      return;
    }

    // ✅ For medium to far distances, fit both points
    fitMapToRoute();

  }, [driverCoord, dropCoord, mapReady, autoFollow, initialFitDone]);

  // Calculate progress percentage
  const getProgress = () => {
    if (!totalDistance || !distance) return 0;
    const progress = ((totalDistance - parseFloat(distance)) / totalDistance) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Call driver
  const callDriver = () => {
    const phone = order?.driver?.phone || order?.driver_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Error", "Driver phone number not available");
    }
  };

  // ✅ Recenter
  const handleRecenter = () => {
    setAutoFollow(true);
    fitMapToRoute();
  };

  // ✅ Show full route
  const handleShowFullRoute = () => {
    setAutoFollow(false);
    fitMapToRoute();
  };

  // ✅ Handle map drag
  const handleMapPanDrag = () => {
    setAutoFollow(false);
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading ride details...</Text>
          <Text style={styles.loaderSubText}>Please wait</Text>
        </View>
      </View>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.loaderText}>Failed to load ride</Text>
          <Text style={styles.loaderSubText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ WAITING FOR COORDINATES
  if (!driverCoord || !dropCoord) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Waiting for driver location...</Text>
          <Text style={styles.loaderSubText}>Driver will appear on map shortly</Text>
        </View>
      </View>
    );
  }

  // Get order info
  const driverName = order?.driver?.full_name || order?.driver_name || "Driver";
  const vehicleNumber = order?.driver?.vehicle || order?.vehicle_number || "---";
  const vehicleModel = order?.vehicle_model || order?.vehicle || "Vehicle";
  const driverPhone = order?.driver?.phone || order?.driver_phone;
  const fare = order?.price || 0;
  const paymentMode = order?.payment_mode || "cash";
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
          
          {/* ✅ SOS Button */}
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={true}
          onMapReady={() => setMapReady(true)}
          onPanDrag={handleMapPanDrag}
          initialRegion={{
            latitude: driverCoord.latitude,
            longitude: driverCoord.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Car Marker */}
          {useCarImage ? (
            <CarMarker coordinate={driverCoord} heading={heading} />
          ) : (
            <CarMarkerIcon coordinate={driverCoord} heading={heading} />
          )}

          {/* Pickup Marker */}
          {pickupCoord && order?.status === "in_progress" && (
            <PickupMarker coordinate={pickupCoord} />
          )}

          {/* Destination Marker */}
          <PulseMarker coordinate={dropCoord} />

          {/* Route Line */}
          <MapViewDirections
            origin={driverCoord}
            destination={dropCoord}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor={COLORS.primary}
            optimizeWaypoints={true}
            mode="DRIVING"
            precision="high"
            onReady={(result) => {
              setDistance(result.distance.toFixed(1));
              setDuration(Math.ceil(result.duration));
              
              if (!totalDistance) {
                setTotalDistance(result.distance);
              }
            }}
            onError={(error) => console.log("Directions error:", error)}
          />
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.mapControlBtn, !autoFollow && styles.mapControlBtnActive]}
            onPress={handleShowFullRoute}
          >
            <MaterialCommunityIcons 
              name="map-marker-distance" 
              size={18} 
              color={!autoFollow ? COLORS.white : COLORS.dark} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapControlBtn, autoFollow && styles.mapControlBtnActive]}
            onPress={handleRecenter}
          >
            <MaterialCommunityIcons 
              name="crosshairs-gps" 
              size={18} 
              color={autoFollow ? COLORS.white : COLORS.dark} 
            />
          </TouchableOpacity>
        </View>

        {/* Auto-Follow Badge */}
        {autoFollow && (
          <View style={styles.autoFollowBadge}>
            <View style={styles.autoFollowDot} />
            <Text style={styles.autoFollowText}>Auto-tracking</Text>
          </View>
        )}

        {/* Bottom Card */}
        <View style={styles.bottomCard}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>On the way</Text>
              <Text style={styles.progressText}>Drop-off</Text>
            </View>
          </View>

          {/* ETA Section */}
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

          {/* Driver Info */}
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
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={callDriver}
              >
                <Ionicons name="call" size={18} color={COLORS.success} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ride Details */}
          <View style={styles.rideDetails}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <View style={styles.greenDot} />
              </View>
              <Text style={styles.locationText} numberOfLines={1}>
                {pickupAddress}
              </Text>
            </View>
            
            <View style={styles.locationLine} />
            
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <View style={styles.redDot} />
              </View>
              <Text style={styles.locationText} numberOfLines={1}>
                {dropAddress}
              </Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentSection}>
            <View style={styles.paymentLeft}>
              <Ionicons
                name={paymentMode === "cash" ? "cash" : "card"}
                size={18}
                color={COLORS.dark}
              />
              <Text style={styles.paymentMode}>
                {paymentMode?.toUpperCase() || "CASH"}
              </Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.fareAmount}>₹{fare}</Text>
              {paymentStatus === "paid" && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ✅ SOS Modal */}
        <Modal visible={sosModalVisible} transparent animationType="fade">
          <View style={styles.sosModalOverlay}>
            <View style={styles.sosModalContent}>
              <View style={styles.sosModalHeader}>
                <View style={styles.sosModalIconBg}>
                  <Ionicons name="warning" size={32} color={COLORS.white} />
                </View>
                <Text style={styles.sosModalTitle}>Emergency SOS</Text>
                <Text style={styles.sosModalSubtitle}>
                  Select an option below to get help
                </Text>
              </View>

              <View style={styles.sosOptions}>
                {/* Emergency 112 */}
                <TouchableOpacity style={styles.sosOption} onPress={callEmergency}>
                  <View style={[styles.sosOptionIcon, { backgroundColor: "#DC2626" }]}>
                    <Ionicons name="call" size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.sosOptionText}>
                    <Text style={styles.sosOptionTitle}>Call Emergency</Text>
                    <Text style={styles.sosOptionDesc}>Dial 112</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>

                {/* Police */}
                <TouchableOpacity style={styles.sosOption} onPress={callPolice}>
                  <View style={[styles.sosOptionIcon, { backgroundColor: "#2563EB" }]}>
                    <Ionicons name="shield" size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.sosOptionText}>
                    <Text style={styles.sosOptionTitle}>Call Police</Text>
                    <Text style={styles.sosOptionDesc}>Dial 100</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>

                {/* Ambulance */}
                <TouchableOpacity style={styles.sosOption} onPress={callAmbulance}>
                  <View style={[styles.sosOptionIcon, { backgroundColor: "#059669" }]}>
                    <Ionicons name="medkit" size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.sosOptionText}>
                    <Text style={styles.sosOptionTitle}>Call Ambulance</Text>
                    <Text style={styles.sosOptionDesc}>Dial 108</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>

                {/* Share Location */}
                <TouchableOpacity style={styles.sosOption} onPress={shareLocation}>
                  <View style={[styles.sosOptionIcon, { backgroundColor: "#7C3AED" }]}>
                    <Ionicons name="share-social" size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.sosOptionText}>
                    <Text style={styles.sosOptionTitle}>Share Location</Text>
                    <Text style={styles.sosOptionDesc}>Send via SMS</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>

                {/* Call Support */}
                <TouchableOpacity style={styles.sosOption} onPress={callSupport}>
                  <View style={[styles.sosOptionIcon, { backgroundColor: "#F59E0B" }]}>
                    <Ionicons name="headset" size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.sosOptionText}>
                    <Text style={styles.sosOptionTitle}>Call Support</Text>
                    <Text style={styles.sosOptionDesc}>24/7 Helpline</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity 
                style={styles.sosCancelBtn} 
                onPress={() => setSosModalVisible(false)}
              >
                <Text style={styles.sosCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Ride Completed Modal */}
        <Modal visible={rideEnded} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <View style={styles.modalIconBg}>
                  <Ionicons name="checkmark" size={50} color={COLORS.white} />
                </View>
              </View>

              <Text style={styles.modalTitle}>Ride Completed!</Text>
              <Text style={styles.modalSubtitle}>
                You have reached your destination safely
              </Text>

              <View style={styles.tripSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trip Fare</Text>
                  <Text style={styles.summaryValue}>₹{fare}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payment</Text>
                  <Text style={styles.summaryValue}>
                    {paymentMode?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.thanksText}>
                Thank you for riding with us! 🙏
              </Text>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "HomeTabs" }],
                  });
                }}
              >
                <Text style={styles.homeButtonText}>Back to Home</Text>
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
  
  // Loader
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.lightGray },
  loaderCard: { backgroundColor: COLORS.white, padding: 30, borderRadius: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginHorizontal: 20 },
  loaderText: { marginTop: 15, fontSize: 16, fontWeight: "600", color: COLORS.dark },
  loaderSubText: { marginTop: 5, fontSize: 13, color: COLORS.gray, textAlign: "center" },
  retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },
  
  // Header
  header: { 
    position: "absolute", 
    top: Platform.OS === "ios" ? 50 : 15, 
    left: 0, 
    right: 0, 
    zIndex: 100, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 15 
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerCenter: { alignItems: "center" },
  liveIndicator: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 6 },
  liveText: { fontSize: 11, fontWeight: "700", color: COLORS.success },
  sosButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.error, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sosText: { fontSize: 10, fontWeight: "800", color: COLORS.white },
  
  // Map
  map: { flex: 1 },
  
  // Map Controls
  mapControls: {
    position: "absolute",
    right: 12,
    bottom: height * 0.48,
    gap: 8,
  },
  mapControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapControlBtnActive: {
    backgroundColor: COLORS.primary,
  },
  
  // Auto-Follow Badge
  autoFollowBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 65,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoFollowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  autoFollowText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.gray,
  },

  // Car Marker
  carMarkerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 55,
  },
  carImage: {
    width: 40,
    height: 40,
  },
  carShadow: {
    position: "absolute",
    bottom: 2,
    width: 30,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  
  // Car Icon
  carIconContainer: { alignItems: "center" },
  carIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  carIconShadow: { width: 28, height: 5, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.15)", marginTop: 2 },
  
  // Pickup Marker
  pickupMarkerContainer: { alignItems: "center", justifyContent: "center" },
  pickupOuterCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(16, 185, 129, 0.2)", alignItems: "center", justifyContent: "center" },
  pickupInnerCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white },
  
  // Destination Marker
  destinationMarkerContainer: { alignItems: "center", justifyContent: "center" },
  pulseCircle: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(239, 68, 68, 0.2)" },
  destinationDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.error, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.white },
  
  // Bottom Card
  bottomCard: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 22, 
    borderTopRightRadius: 22, 
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 22 : 16,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: -3 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 8,
  },
  
  // Progress
  progressContainer: { marginBottom: 14 },
  progressBar: { height: 3, backgroundColor: COLORS.lightGray, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.success, borderRadius: 2 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  progressText: { fontSize: 10, color: COLORS.gray },
  
  // ETA
  etaSection: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 12, marginBottom: 14 },
  etaMain: { flexDirection: "row", alignItems: "baseline" },
  etaTime: { fontSize: 28, fontWeight: "800", color: COLORS.dark },
  etaUnit: { fontSize: 13, fontWeight: "600", color: COLORS.gray, marginLeft: 3 },
  etaDivider: { width: 1, height: 32, backgroundColor: "#D1D5DB", marginHorizontal: 14 },
  etaDetails: { flex: 1 },
  etaLabel: { fontSize: 11, color: COLORS.gray },
  etaDistance: { fontSize: 13, fontWeight: "600", color: COLORS.dark, marginTop: 2 },
  
  // Driver
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
  
  // Ride Details
  rideDetails: { marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationIcon: { width: 20, alignItems: "center" },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  redDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.error },
  locationLine: { width: 2, height: 14, backgroundColor: COLORS.lightGray, marginLeft: 9, marginVertical: 2 },
  locationText: { fontSize: 12, color: COLORS.dark, marginLeft: 8, flex: 1 },
  
  // Payment
  paymentSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.lightGray, padding: 10, borderRadius: 10 },
  paymentLeft: { flexDirection: "row", alignItems: "center" },
  paymentMode: { fontSize: 12, fontWeight: "600", color: COLORS.dark, marginLeft: 6 },
  paymentRight: { flexDirection: "row", alignItems: "center" },
  fareAmount: { fontSize: 15, fontWeight: "800", color: COLORS.dark },
  paidBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#D1FAE5", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, marginLeft: 6 },
  paidText: { fontSize: 10, fontWeight: "600", color: COLORS.success, marginLeft: 2 },
  
  // ✅ SOS Modal
  sosModalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.6)", 
    justifyContent: "center", 
    alignItems: "center",
    padding: 20,
  },
  sosModalContent: { 
    width: "100%",
    backgroundColor: COLORS.white, 
    borderRadius: 24, 
    padding: 20,
    maxHeight: height * 0.75,
  },
  sosModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  sosModalIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  sosModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.dark,
  },
  sosModalSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  sosOptions: {
    gap: 10,
  },
  sosOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    padding: 14,
    borderRadius: 14,
  },
  sosOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sosOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  sosOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  sosOptionDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  sosCancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  sosCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray,
  },
  
  // Completed Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center" },
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
});