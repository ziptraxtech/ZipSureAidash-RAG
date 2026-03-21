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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
  {/* Header Info - Address Replaces MapPin */}
  <div className="p-5 flex items-center justify-between bg-white">
    <div className="flex flex-col">
      {/* Primary Terminal Name */}
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
          {sapnaCharger.name}
        </h3>
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      
      {/* Full Address Text replacing the MapPin icon */}
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          {sapnaCharger.location}
        </p>
        <span className="text-slate-300">•</span>
        <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
          Terminal ID: ZIP-SAPNA-01
        </span>
      </div>
    </div>

    {/* Navigation Action */}
    <button 
      onClick={openInGoogleMaps}
      className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl text-blue-600 transition-all group"
    >
      <span className="text-[10px] font-black uppercase tracking-widest group-hover:mr-1 transition-all">Directions</span>
      <Navigation size={14} className="fill-blue-600/10" />
    </button>
  </div>

  {/* Map Content */}
  <div className="flex-grow relative min-h-[350px]">
    {renderMap()}
  </div>

  {/* Action Footer */}
  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
     <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lat:</span>
           <code className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">28.5592</code>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lng:</span>
           <code className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">77.2441</code>
        </div>
     </div>
     <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-2 tracking-widest transition-colors">
        Expand View <ExternalLink size={12} />
     </button>
  </div>
</div>
  );
};

export default MapComponent;