"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";


const containerStyle = {
  width: "100%",
  height: "220px",
  borderRadius: "12px",
};

const center = {
  lat: 30.7333,
  lng: 76.7794,
};

export default function ChargerMap() {

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[220px] bg-gray-200 rounded-lg">
        Loading Map...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}