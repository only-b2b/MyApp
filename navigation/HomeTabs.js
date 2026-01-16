import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

// Screens
import ServiceSelectScreen from "../screens/ServiceSelectScreen";
import DashboardScreen from "../screens/DashboardScreen";
import PickDropScreen from "../screens/PickDropScreen";
import DriverScreen from "../screens/DriverScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const ACTIVE = "#FF7A00";     // Swiggy orange
const INACTIVE = "#A6A6A6";   // Swiggy grey
const BG = "#FFFFFF";         // flat white background

// ------------------------------------------
//      MINIMAL SWIGGY TAB ITEM
// ------------------------------------------
function SwiggyTabItem({ label, icon, isFocused, onPress }) {
  const scale = useSharedValue(isFocused ? 1 : 0.9);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.9, { damping: 10 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.itemContainer}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={icon}
          size={22}
          color={isFocused ? ACTIVE : INACTIVE}
        />
      </Animated.View>

      <Text style={[styles.label, isFocused && styles.activeLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ------------------------------------------
//      SWIGGY TAB BAR
// ------------------------------------------
function SwiggyTabBar({ state, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        let label = route.name;
        let icon = "ellipse-outline";

        if (route.name === "Home") {
          label = "Home";
          icon = "home-outline";
        } else if (route.name === "CarWash") {
          label = "Car Wash";
          icon = "water-outline";
        } else if (route.name === "PickDrop") {
          label = "Pick & Drop";
          icon = "car-outline";
        } else if (route.name === "Driver") {
          label = "Driver";
          icon = "person-outline";
        } else if (route.name === "Profile") {
          label = "Profile";
          icon = "person-circle-outline";
        }

        return (
          <SwiggyTabItem
            key={route.key}
            label={label}
            icon={icon}
            isFocused={isFocused}
            onPress={() => navigation.navigate(route.name)}
          />
        );
      })}
    </View>
  );
}

// ------------------------------------------
//      MAIN TABS
// ------------------------------------------
export default function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <SwiggyTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={ServiceSelectScreen} />
      <Tab.Screen name="CarWash" component={DashboardScreen} />
      <Tab.Screen name="PickDrop" component={PickDropScreen} />
      <Tab.Screen name="Driver" component={DriverScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ------------------------------------------
//      STYLES (TRUE SWIGGY MINIMAL)
// ------------------------------------------
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 62,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: "#E9E9E9",
  },

  itemContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    width: 70,
  },

  label: {
    fontSize: 11,
    color: INACTIVE,
    marginTop: 2,
    fontWeight: "500",
  },

  activeLabel: {
    color: ACTIVE,
    fontWeight: "700",
  },
});
