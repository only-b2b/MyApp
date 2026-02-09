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
import SelectAddressPage from "../screens/SelectAddressPage";
import SuccessPage from "../screens/SuccessPage";
import FindingTechnicianScreen from "../screens/FindingTechnicianScreen";
import DriverAssignedScreen from "../screens/DriverAssignedScreen";

// import WaitingForTechnicianPage from "../screens/WaitingForTechnicianPage";
// import TechnicianAssignedPage from "../screens/TechnicianAssignedPage";

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
          <Stack.Screen name="SelectAddressPage" component={SelectAddressPage} />
          <Stack.Screen name="SuccessPage" component={SuccessPage} />
          <Stack.Screen
  name="FindingTechnicianScreen"
  component={FindingTechnicianScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen name="DriverAssignedScreen" component={DriverAssignedScreen} />

{/* <Stack.Screen
  name="WaitingForTechnicianPage"
  component={WaitingForTechnicianPage}
/>
<Stack.Screen
  name="TechnicianAssignedPage"
  component={TechnicianAssignedPage}
/> */}
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
