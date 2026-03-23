// import React, { useState } from 'react';
// import { MapPin, ExternalLink, Navigation } from 'lucide-react';

// interface Device {
//   id: number;
//   name: string;
//   location: string;
//   status: 'online' | 'charging' | 'offline'| 'critical' | 'good' | 'excellent';
//   coordinates: {
//     lat: number;
//     lng: number;
//   };
// }

// const MapComponent: React.FC = () => {
//   const devices: Device[] = [
//     {
//       id: 2,
//       name: 'Andheria More Charging Hub',
//       location: 'CDR Chowk, Near Chattarpur Metro',
//       status: 'critical',
//       coordinates: { lat: 28.5063, lng: 77.1756 } // CDR Chowk near Chattarpur Metro
//     },
//     {
//       id: 3,
//       name: 'Hauz Khas District Center',
//       location: 'Hauz Khas Metro Station, 1km ahead',
//       status: 'excellent',
//       coordinates: { lat: 28.5494, lng: 77.2066 } // Near Hauz Khas Metro, 1km ahead
//     },
//     {
//       id: 4,
//       name: 'Qutub Minar Charging Station',
//       location: 'Qutub Minar',
//       status: 'good',
//       coordinates: { lat: 28.5244, lng: 77.1855 } // Qutub Minar
//     },
//     {
//       id: 5,
//       name: 'TB Hospital Charging Point',
//       location: 'TB Hospital near Qutub Minar',
//       status: 'critical',
//       coordinates: { lat: 28.5180, lng: 77.1920 } // TB Hospital near Qutub Minar (1-2km away)
//     },
//     {
//       id: 6,
//       name: 'Hauz Khas Metro Gate 1',
//       location: 'Hauz Khas Metro Gate 1',
//       status: 'offline',
//       coordinates: { lat: 28.5431, lng: 77.2068 } // Hauz Khas Metro Gate 1
//     },
//     {
//       id: 7,
//       name: 'RK Puram Sector 5',
//       location: 'RK Puram Sector 5',
//       status: 'good',
//       coordinates: { lat: 28.5640, lng: 77.1825 } // RK Puram Sector 5
//     },
//     {
//       id: 8,
//       name: 'IIT Delhi Campus',
//       location: 'IIT Delhi',
//       status: 'excellent',
//       coordinates: { lat: 28.5458, lng: 77.1931 } // IIT Delhi
//     },
//     {
//       id: 9,
//       name: 'Panchsheel Park Metro',
//       location: 'Panchsheel Park Metro Station',
//       status: 'good',
//       coordinates: { lat: 28.5355, lng: 77.2162 } // Panchsheel Park Metro Station
//     },
//   ];

//   const openInGoogleMaps = () => {
//     const url = `https://www.google.com/maps?q=${sapnaCharger.coordinates.lat},${sapnaCharger.coordinates.lng}`;
//     window.open(url, '_blank');
//   };

//   const renderMap = () => {
//     const mapHtml = `
// <!DOCTYPE html>
// <html>
// <head>
//     <meta charset="utf-8" />
//     <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
//     <style>
//         body { margin: 0; padding: 0; }
//         #map { height: 100vh; width: 100vw; }
//         .custom-pin { color: #2563eb; }
//     </style>
// </head>
// <body>
//     <div id="map"></div>
//     <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
//     <script>
//         var map = L.map('map', {zoomControl: false}).setView([${sapnaCharger.coordinates.lat}, ${sapnaCharger.coordinates.lng}], 15);
//         L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
//             attribution: '© OpenStreetMap'
//         }).addTo(map);
        
//         var marker = L.marker([${sapnaCharger.coordinates.lat}, ${sapnaCharger.coordinates.lng}]).addTo(map);
//         marker.bindPopup("<b>${sapnaCharger.name}</b><br/>Active Terminal").openPopup();
//     </script>
// </body>
// </html>`;

//     return (
//       <div className="w-full h-full relative">
//         <iframe
//           width="100%"
//           height="100%"
//           style={{ border: 0 }}
//           srcDoc={mapHtml}
//           title="Charger Location"
//           className="rounded-xl"
//         ></iframe>
        
//         {/* Floating Mini Overlay to match your screenshot */}
//         <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-100 z-10">
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Live Terminal</span>
//           </div>
//           <p className="text-xs font-black text-slate-800 mt-1">Okhla Phase III</p>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
//   {/* Header Info - Address Replaces MapPin */}
//   <div className="p-5 flex items-center justify-between bg-white">
//     <div className="flex flex-col">
//       {/* Primary Terminal Name */}
//       <div className="flex items-center gap-2 mb-0.5">
//         <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
//           {sapnaCharger.name}
//         </h3>
//         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//       </div>
      
//       {/* Full Address Text replacing the MapPin icon */}
//       <div className="flex items-center gap-1.5">
//         <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
//           {sapnaCharger.location}
//         </p>
//         <span className="text-slate-300">•</span>
//         <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
//           Terminal ID: ZIP-SAPNA-01
//         </span>
//       </div>
//     </div>

//     {/* Navigation Action */}
//     <button 
//       onClick={openInGoogleMaps}
//       className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl text-blue-600 transition-all group"
//     >
//       <span className="text-[10px] font-black uppercase tracking-widest group-hover:mr-1 transition-all">Directions</span>
//       <Navigation size={14} className="fill-blue-600/10" />
//     </button>
//   </div>

//   {/* Map Content */}
//   <div className="flex-grow relative min-h-[350px]">
//     {renderMap()}
//   </div>

//   {/* Action Footer */}
//   <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
//      <div className="flex items-center gap-3">
//         <div className="flex items-center gap-2">
//            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lat:</span>
//            <code className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">28.5592</code>
//         </div>
//         <div className="flex items-center gap-2">
//            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lng:</span>
//            <code className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">77.2441</code>
//         </div>
//      </div>
//      <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-2 tracking-widest transition-colors">
//         Expand View <ExternalLink size={12} />
//      </button>
//   </div>
// </div>
//   );
// };

// export default MapComponent;
import React from 'react';
import { ExternalLink, Navigation } from 'lucide-react';

interface Device {
  id: number;
  name: string;
  location: string;
  status: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface MapProps {
  deviceId: string; // Passed from page.js
}

const MapComponent: React.FC<MapProps> = ({ deviceId }) => {
  const devices: Device[] = [
    { id: 2, name: 'Andheria More Charging Hub', location: 'CDR Chowk, Near Chattarpur Metro', status: 'critical', coordinates: { lat: 28.5063, lng: 77.1756 } },
    { id: 3, name: 'Hauz Khas District Center', location: 'Hauz Khas Metro Station', status: 'excellent', coordinates: { lat: 28.5494, lng: 77.2066 } },
    { id: 4, name: 'Qutub Minar Charging Station', location: 'Qutub Minar', status: 'good', coordinates: { lat: 28.5244, lng: 77.1855 } },
    { id: 5, name: 'TB Hospital Charging Point', location: 'TB Hospital near Qutub Minar', status: 'critical', coordinates: { lat: 28.5180, lng: 77.1920 } },
    { id: 6, name: 'Hauz Khas Metro Gate 1', location: 'Hauz Khas Metro Gate 1', status: 'offline', coordinates: { lat: 28.5431, lng: 77.2068 } },
    { id: 7, name: 'RK Puram Sector 5', location: 'RK Puram Sector 5', status: 'good', coordinates: { lat: 28.5640, lng: 77.1825 } },
    { id: 8, name: 'IIT Delhi Campus', location: 'IIT Delhi', status: 'excellent', coordinates: { lat: 28.5458, lng: 77.1931 } },
    { id: 9, name: 'Sapna Terminal - Okhla', location: 'Okhla Industrial Estate, Phase III', status: 'good', coordinates: { lat: 28.5594, lng: 77.2444 } },
  ];

 // 1. Convert deviceId to a clean number safely
  const numericId = React.useMemo(() => {
    if (!deviceId) return 9;
    const clean = deviceId.toString().replace('device', '');
    return parseInt(clean) || 9;
  }, [deviceId]);

  // 2. Find device OR fallback to the Sapna (ID 9) record
  // Adding "as Device" or checking for ! tells TypeScript this WILL exist
  const activeDevice = devices.find(d => d.id === numericId) || devices[7]; 

  // 3. CRITICAL: Add a "Guard Clause" to satisfy TypeScript
  if (!activeDevice) {
    return <div className="p-4 text-slate-400 font-bold">Location not found...</div>;
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${activeDevice.coordinates.lat},${activeDevice.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const renderMap = () => {
    const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #f8fafc; }
        .leaflet-marker-icon { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
    <script>
        var map = L.map('map', {zoomControl: false}).setView([${activeDevice.coordinates.lat}, ${activeDevice.coordinates.lng}], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // FIX: Manually define the Icon URLs to bypass "Tracking Prevention"
        var blueIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        var marker = L.marker([${activeDevice.coordinates.lat}, ${activeDevice.coordinates.lng}], {icon: blueIcon}).addTo(map);
        marker.bindPopup("<div style='font-family:sans-serif;'><b>${activeDevice.name}</b><br/>Status: ${activeDevice.status.toUpperCase()}</div>").openPopup();
    </script>
</body>
</html>`;

    return (
      <div className="w-full h-full relative">
        <iframe
          key={activeDevice.id} // Forces iframe to reload when device changes
          width="100%"
          height="100%"
          style={{ border: 0 }}
          srcDoc={mapHtml}
          title="Charger Location"
          className="rounded-xl"
        ></iframe>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full border border-slate-100">
      <div className="p-5 flex items-center justify-between bg-white">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {activeDevice.name}
            </h3>
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${activeDevice.status === 'offline' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          </div>
          
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              {activeDevice.location}
            </p>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
              ID: ZIP-UNIT-0{activeDevice.id}
            </span>
          </div>
        </div>

        <button 
          onClick={openInGoogleMaps}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl text-blue-600 transition-all group"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Directions</span>
          <Navigation size={14} className="fill-blue-600/10" />
        </button>
      </div>

      <div className="flex-grow relative min-h-[350px]">
        {renderMap()}
      </div>

      <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lat:</span>
               <code className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">{activeDevice.coordinates.lat}</code>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lng:</span>
               <code className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">{activeDevice.coordinates.lng}</code>
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