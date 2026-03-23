// utils/safeJsonParse.js
export const safeJsonParse = (data, fallback = null) => {
  if (!data) return fallback;
  
  // Check if data is HTML error page
  if (typeof data === 'string' && data.trim().startsWith('<')) {
    console.warn('Received HTML instead of JSON');
    return fallback;
  }
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback;
  }
};

// Usage:
import { safeJsonParse } from '../utils/safeJsonParse';

const data = await AsyncStorage.getItem('saved_places');
const places = safeJsonParse(data, []);