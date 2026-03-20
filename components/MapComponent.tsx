import React, { useState } from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface Device {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'charging' | 'offline';
  coordinates: {
    lat: number;
    lng: number;
  };
  health: number;
}

const MapComponent: React.FC = () => {
  // Fixed Location: 28°33'33.8"N 77°14'39.8"E
  const sapnaCharger: Device = {
    id: 1,
    name: 'Sapna Terminal - Okhla',
    location: 'Okhla Industrial Estate, Phase III, New Delhi',
    status: 'online', // This can be passed as a prop later
    health: 98,
    coordinates: { lat: 28.5594, lng: 77.2444 }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${sapnaCharger.coordinates.lat},${sapnaCharger.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const renderMap = () => {
    const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .custom-pin { color: #2563eb; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        var map = L.map('map', {zoomControl: false}).setView([${sapnaCharger.coordinates.lat}, ${sapnaCharger.coordinates.lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        
        var marker = L.marker([${sapnaCharger.coordinates.lat}, ${sapnaCharger.coordinates.lng}]).addTo(map);
        marker.bindPopup("<b>${sapnaCharger.name}</b><br/>Active Terminal").openPopup();
    </script>
</body>
</html>`;

    return (
      <div className="w-full h-full relative">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          srcDoc={mapHtml}
          title="Charger Location"
          className="rounded-xl"
        ></iframe>
        
        {/* Floating Mini Overlay to match your screenshot */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-100 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Live Terminal</span>
          </div>
          <p className="text-xs font-black text-slate-800 mt-1">Okhla Phase III</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      {/* Header Info */}
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{sapnaCharger.name}</h3>
            <p className="text-[10px] text-slate-500 font-medium">{sapnaCharger.location}</p>
          </div>
        </div>
        <button 
          onClick={openInGoogleMaps}
          className="p-2 hover:bg-slate-50 rounded-full text-blue-600 transition-colors"
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* Map Content */}
      <div className="flex-grow relative min-h-[300px]">
        {renderMap()}
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Coord:</span>
            <code className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">28.559, 77.244</code>
         </div>
         <button className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
            Fullscreen <ExternalLink size={10} />
         </button>
      </div>
    </div>
  );
};

export default MapComponent;