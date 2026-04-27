// lib/nearbyPlaces.js
import { GOOGLE_MAPS_API_KEY } from "../config";

/**
 * Search nearby places by type using Google Places API
 * @param {object} location - { lat, lng }
 * @param {string} type - Google place type (hospital, shopping_mall, etc.)
 * @param {number} radius - Search radius in meters
 * @returns {Array} - List of nearby places
 */
export const searchNearbyPlaces = async (location, type, radius = 5000) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results) {
      console.log("Nearby search failed:", data.status);
      return [];
    }

    return data.results.map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating || null,
      isOpen: place.opening_hours?.open_now ?? null,
      distance: calculateDistance(
        location.lat,
        location.lng,
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
    }));
  } catch (error) {
    console.error("Nearby places error:", error);
    return [];
  }
};

/**
 * Calculate distance between two coordinates (in km)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Map destination category to Google Place type
 */
export const DESTINATION_TYPE_MAP = {
  Office: "office",
  Home: "home",
  Airport: "airport",
  Hospital: "hospital",
  Mall: "shopping_mall",
  College: "university",
  Restaurant: "restaurant",
  Temple: "hindu_temple",
  Station: "train_station",
  Park: "park",
  Gym: "gym",
  Hotel: "lodging",
};

/**
 * Get Google place type from label
 */
export const getPlaceType = (label) => {
  return DESTINATION_TYPE_MAP[label] || "point_of_interest";
};