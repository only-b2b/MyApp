import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ServiceSelectScreen from "../screens/ServiceSelectScreen";
import DashboardScreen from "../screens/DashboardScreen";
import PickDropScreen from "../screens/PickDropScreen";
import DriverScreen from "../screens/DriverScreen";
import QuotationPage from "../screens/QuotationPage";
import PaymentPage from "../screens/PaymentPage";
import ClientInfoPage from "../screens/ClientInfoPage";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* Always first like Swiggy Home */}
      <Stack.Screen name="ServiceSelect" component={ServiceSelectScreen} />

      {/* Car Wash Flow */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />

      {/* Other service flows */}
      <Stack.Screen name="PickDrop" component={PickDropScreen} />
      <Stack.Screen name="Driver" component={DriverScreen} />

      {/* Common screens */}
      <Stack.Screen name="QuotationPage" component={QuotationPage} />
      <Stack.Screen name="PaymentPage" component={PaymentPage} />
      <Stack.Screen name="ClientInfoPage" component={ClientInfoPage} />

    </Stack.Navigator>
  );
}
