import Constants from "expo-constants";

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig.extra?.googleMapsApiKey ||
  "AIzaSyDbTEOzGx3L0pr6D1_9q8whfqhLyyyL-EI";

export async function getDirections(origin, destination) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.routes?.length) return null;

    const route = json.routes[0];
    const leg = route.legs[0];

    const points = decodePolyline(route.overview_polyline.points);
    return {
      coords: points,
      distance: leg.distance.text,
      duration: leg.duration.text,
    };
  } catch (e) {
    console.error("Directions error:", e);
    return null;
  }
}

// ---- Polyline decoding helper ----
function decodePolyline(encoded) {
  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}
