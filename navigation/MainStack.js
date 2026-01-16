import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeTabs from "./HomeTabs";
import QuotationPage from "../screens/QuotationPage";
import ClientInfoPage from "../screens/ClientInfoPage";
import PaymentPage from "../screens/PaymentPage";
import RideInProgressScreen from "../screens/RideInProgressScreen";
import FindingDriverScreen from "../screens/FindingDriverScreen";
import DriverAcceptedScreen from "../screens/DriverAcceptedScreen";



const Stack = createNativeStackNavigator();

export default function MainStack({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
          <Stack.Screen name="ClientInfoPage" component={ClientInfoPage} />
          <Stack.Screen name="QuotationPage" component={QuotationPage} />
          <Stack.Screen name="PaymentPage" component={PaymentPage} />
          <Stack.Screen name="FindingDriverScreen" component={FindingDriverScreen} />
<Stack.Screen name="DriverAcceptedScreen" component={DriverAcceptedScreen} />
<Stack.Screen name="RideInProgressScreen" component={RideInProgressScreen} />

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
