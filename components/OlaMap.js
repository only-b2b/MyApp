import React from "react";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function OlaMap({ center, routeCoords, onMapPress, destination }) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
      onLongPress={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onMapPress({ lat: latitude, lng: longitude });
      }}
    >
      {/* Current Location */}
      <Marker
        coordinate={{
          latitude: center.lat,
          longitude: center.lng,
        }}
        title="Your Location"
        pinColor="#2dd36f"
      />

      {/* Destination Marker */}
      {destination && (
        <Marker
          coordinate={{
            latitude: destination.location.lat,
            longitude: destination.location.lng,
          }}
          title={destination.description}
          pinColor="#0a84ff"
        />
      )}

      {routeCoords?.length > 0 && (
        <Polyline
          coordinates={routeCoords}
          strokeWidth={4}
          strokeColor="#0a84ff"
        />
      )}
    </MapView>
  );
}
