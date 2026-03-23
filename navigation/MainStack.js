// navigation/MainStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

// Tab Navigator
import HomeTabs from "./HomeTabs";

// Common Screens
import QuotationPage from "../screens/QuotationPage";
import ClientInfoPage from "../screens/ClientInfoPage";
import PaymentPage from "../screens/PaymentPage";
import SelectAddressPage from "../screens/SelectAddressPage";
import SuccessPage from "../screens/SuccessPage";
import RideHistoryScreen from "../screens/RideHistoryScreen";

// Driver Service Flow
import FindingDriverScreen from "../screens/FindingDriverScreen";
import DriverAcceptedScreen from "../screens/DriverAcceptedScreen";
import DriverAssignedScreen from "../screens/DriverAssignedScreen";
import LiveRideScreen from "../screens/LiveRideScreen";
import RideInProgressScreen from "../screens/RideInProgressScreen";

// Car Wash Flow (NEW SCREENS)
import FindingTechnicianScreen from "../screens/FindingTechnicianScreen";
import TechnicianEnRouteScreen from "../screens/TechnicianEnRouteScreen";
import TechnicianArrivedScreen from "../screens/TechnicianArrivedScreen";
import WashInProgressScreen from "../screens/WashInProgressScreen";
import WashCompletedScreen from "../screens/WashCompletedScreen";

const Stack = createNativeStackNavigator();

export default function MainStack({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* Main App */}
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
          
          {/* Common Screens */}
          <Stack.Screen name="ClientInfoPage" component={ClientInfoPage} />
          <Stack.Screen name="QuotationPage" component={QuotationPage} />
          <Stack.Screen name="PaymentPage" component={PaymentPage} />
          <Stack.Screen name="SelectAddressPage" component={SelectAddressPage} />
          <Stack.Screen name="SuccessPage" component={SuccessPage} />
          <Stack.Screen name="RideHistoryScreen" component={RideHistoryScreen} />

          {/* ========== DRIVER SERVICE FLOW ========== */}
          <Stack.Screen name="FindingDriverScreen" component={FindingDriverScreen} />
          <Stack.Screen name="DriverAcceptedScreen" component={DriverAcceptedScreen} />
          <Stack.Screen name="DriverAssignedScreen" component={DriverAssignedScreen} />
          <Stack.Screen name="LiveRideScreen" component={LiveRideScreen} />
          <Stack.Screen name="RideInProgressScreen" component={RideInProgressScreen} />

          {/* ========== CAR WASH FLOW (NEW) ========== */}
          <Stack.Screen 
            name="FindingTechnicianScreen" 
            component={FindingTechnicianScreen} 
          />
          <Stack.Screen 
            name="TechnicianEnRouteScreen" 
            component={TechnicianEnRouteScreen} 
          />
          <Stack.Screen 
            name="TechnicianArrivedScreen" 
            component={TechnicianArrivedScreen} 
          />
          <Stack.Screen 
            name="WashInProgressScreen" 
            component={WashInProgressScreen} 
          />
          <Stack.Screen 
            name="WashCompletedScreen" 
            component={WashCompletedScreen} 
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}