// navigation/LeadsStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeadsScreen from "../screens/LeadsScreen";
import LeadDetailScreen from "../screens/LeadDetailScreen";

const Stack = createNativeStackNavigator();

export default function LeadsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LeadsHome" component={LeadsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}