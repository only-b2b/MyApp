// config/api.js
import { Platform } from "react-native";

const LAN_IP = "192.168.1.83"; // For WiFi testing later

export const API_BASE_URL = __DEV__
  ? "http://localhost:4000"  // Works with USB + adb reverse
  : "https://your-deployed-api.railway.app"; // Production

console.log("📡 API URL:", API_BASE_URL);
console.log("📱 Platform:", Platform.OS);
console.log("🔧 Dev mode:", __DEV__);