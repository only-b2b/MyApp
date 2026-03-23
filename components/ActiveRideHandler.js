// components/ActiveRideHandler.js
import React, { useEffect, useState, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getAuth } from "@react-native-firebase/auth";
import { API_BASE_URL } from "../config";
import ActiveRideFloatingCard from "./ActiveRideFloatingCard";

const API = `${API_BASE_URL}/orders`;

export default function ActiveRideHandler() {
  const navigation = useNavigation();
  const [activeOrder, setActiveOrder] = useState(null);
  const [visible, setVisible] = useState(false);

  // ✅ Check on mount and every 10 seconds
  useEffect(() => {
    checkActiveRide();
    const interval = setInterval(checkActiveRide, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Re-check when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      checkActiveRide();
    }, [])
  );

  const checkActiveRide = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setVisible(false);
        setActiveOrder(null);
        return;
      }

      const response = await fetch(
        `${API}/active/by-user?firebase_uid=${user.uid}`
      );

      const data = await response.json();

      console.log("📱 Active ride check:", data);

      if (!data || !data.id) {
        setVisible(false);
        setActiveOrder(null);
        return;
      }

      setActiveOrder(data);
      setVisible(true);
    } catch (error) {
      console.log("Active ride check error:", error);
      setVisible(false);
    }
  };

  const resumeActiveRide = () => {
    if (!activeOrder) return;

    const { id, status, service_type } = activeOrder;

    console.log(`📱 Resuming: Order ${id}, Status: ${status}, Service: ${service_type}`);

    setVisible(false);

    // ✅ DRIVER / PICKDROP SERVICE - Using EXACT screen names from MainStack.js
    if (service_type === "driver" || service_type === "pickdrop") {
      switch (status) {
        case "requested":
          navigation.navigate("FindingDriverScreen", { orderId: id });
          break;
        case "accepted":
          navigation.navigate("DriverAcceptedScreen", { orderId: id });
          break;
        case "arrived":
          navigation.navigate("DriverAssignedScreen", { orderId: id });
          break;
        case "in_progress":
          navigation.navigate("LiveRideScreen", { orderId: id });
          break;
        default:
          console.log("Unknown status:", status);
      }
    }

    // ✅ CAR WASH SERVICE - Using EXACT screen names from MainStack.js
    if (service_type === "car_wash") {
      switch (status) {
        case "requested":
          navigation.navigate("FindingTechnicianScreen", { orderId: id });
          break;
        case "accepted":
          navigation.navigate("TechnicianEnRouteScreen", { orderId: id });
          break;
        case "arrived":
          navigation.navigate("TechnicianArrivedScreen", { orderId: id });
          break;
        case "in_progress":
          navigation.navigate("WashInProgressScreen", { orderId: id });
          break;
        default:
          console.log("Unknown status:", status);
      }
    }
  };

  // ✅ Don't render if not visible
  if (!visible || !activeOrder) return null;

  return (
    <ActiveRideFloatingCard
      visible={visible}
      order={activeOrder}
      onResume={resumeActiveRide}
      onClose={() => setVisible(false)}
    />
  );
}