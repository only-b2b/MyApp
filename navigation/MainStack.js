// navigation/MainStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ========== AUTH SCREENS ==========
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// ========== TAB NAVIGATOR ==========
import HomeTabs from "./HomeTabs";

// ========== BOOKING FLOW ==========
import QuotationPage from "../screens/booking/QuotationPage";
import ClientInfoPage from "../screens/booking/ClientInfoPage";
import PaymentPage from "../screens/booking/PaymentPage";
import SelectAddressPage from "../screens/booking/SelectAddressPage";
import SuccessPage from "../screens/booking/SuccessPage";

// ========== DRIVER SERVICE FLOW ==========
import FindingDriverScreen from "../screens/driver/FindingDriverScreen";
import DriverAcceptedScreen from "../screens/driver/DriverAcceptedScreen";
import DriverAssignedScreen from "../screens/driver/DriverAssignedScreen";
import LiveRideScreen from "../screens/driver/LiveRideScreen";
import RideInProgressScreen from "../screens/driver/RideInProgressScreen";

// ========== CAR WASH FLOW ==========
import FindingTechnicianScreen from "../screens/carwash/FindingTechnicianScreen";
import TechnicianEnRouteScreen from "../screens/carwash/TechnicianEnRouteScreen";
import TechnicianArrivedScreen from "../screens/carwash/TechnicianArrivedScreen";
import WashInProgressScreen from "../screens/carwash/WashInProgressScreen";
import WashCompletedScreen from "../screens/carwash/WashCompletedScreen";

// ========== PAYMENT SCREENS ==========
import AdvancePaymentScreen from "../screens/AdvancePaymentScreen";
import FinalPaymentScreen from "../screens/FinalPaymentScreen";
import OrderCompleteScreen from "../screens/OrderCompleteScreen";

// ========== CANCELLATION & REFUND SCREENS ==========
import CancelBookingScreen from "../screens/CancelBookingScreen";
import RefundStatusScreen from "../screens/RefundStatusScreen";

// ========== PROFILE SCREENS ==========
import RideHistoryScreen from "../screens/profile/RideHistoryScreen";
import RideDetailsScreen from "../screens/profile/RideDetailsScreen";
import PaymentMethodsScreen from "../screens/profile/PaymentMethodsScreen";
import SavedPlacesScreen from "../screens/profile/SavedPlacesScreen";
import NotificationSettingsScreen from "../screens/profile/NotificationSettingsScreen";
import HelpSupportScreen from "../screens/profile/HelpSupportScreen";
import AboutUsScreen from "../screens/profile/AboutUsScreen";
import TermsPrivacyScreen from "../screens/profile/TermsPrivacyScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function MainStack({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* ========== MAIN APP ========== */}
          <Stack.Screen name="HomeTabs" component={HomeTabs} />

          {/* ========== BOOKING FLOW ========== */}
          <Stack.Screen name="ClientInfoPage" component={ClientInfoPage} />
          <Stack.Screen name="QuotationPage" component={QuotationPage} />
          <Stack.Screen name="PaymentPage" component={PaymentPage} />
          <Stack.Screen name="SelectAddressPage" component={SelectAddressPage} />
          <Stack.Screen name="SuccessPage" component={SuccessPage} />

          {/* ========== DRIVER SERVICE FLOW ========== */}
          <Stack.Screen name="FindingDriverScreen" component={FindingDriverScreen} />
          <Stack.Screen name="DriverAcceptedScreen" component={DriverAcceptedScreen} />
          <Stack.Screen name="DriverAssignedScreen" component={DriverAssignedScreen} />
          <Stack.Screen name="LiveRideScreen" component={LiveRideScreen} />
          <Stack.Screen name="RideInProgressScreen" component={RideInProgressScreen} />

          {/* ========== CAR WASH FLOW ========== */}
          <Stack.Screen name="FindingTechnicianScreen" component={FindingTechnicianScreen} />
          <Stack.Screen name="TechnicianEnRouteScreen" component={TechnicianEnRouteScreen} />
          <Stack.Screen name="TechnicianArrivedScreen" component={TechnicianArrivedScreen} />
          <Stack.Screen name="WashInProgressScreen" component={WashInProgressScreen} />
          <Stack.Screen name="WashCompletedScreen" component={WashCompletedScreen} />

          {/* ========== PAYMENT SCREENS ========== */}
          <Stack.Screen name="AdvancePaymentScreen" component={AdvancePaymentScreen} />
          <Stack.Screen name="FinalPaymentScreen" component={FinalPaymentScreen} />
          <Stack.Screen 
            name="OrderCompleteScreen" 
            component={OrderCompleteScreen}
            options={{ gestureEnabled: false }}
          />

          {/* ========== CANCELLATION & REFUND SCREENS ========== */}
          <Stack.Screen name="CancelBookingScreen" component={CancelBookingScreen} />
          <Stack.Screen 
            name="RefundStatusScreen" 
            component={RefundStatusScreen}
            options={{ gestureEnabled: false }}
          />

          {/* ========== PROFILE SCREENS ========== */}
          <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
          <Stack.Screen name="RideDetails" component={RideDetailsScreen} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
          <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="AboutUs" component={AboutUsScreen} />
          <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          {/* ========== AUTH SCREENS ========== */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}