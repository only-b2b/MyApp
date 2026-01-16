import Constants from "expo-constants";

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig.extra?.googleMapsApiKey ||
  "AIzaSyDbTEOzGx3L0pr6D1_9q8whfqhLyyyL-EI"; // fallback

// ---- Autocomplete ----
export async function olaAutocomplete(query, nearby) {
  try {
    const location = nearby
      ? `&location=${nearby.lat},${nearby.lng}&radius=50000`
      : "";
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}${location}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    console.error("Autocomplete error:", e);
    return { predictions: [] };
  }
}

// ---- Place Details ----
export async function olaPlaceDetails(placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    const loc = json.result?.geometry?.location;
    return { location: loc };
  } catch (e) {
    console.error("Place details error:", e);
    return null;
  }
}
