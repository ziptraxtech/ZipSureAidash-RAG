import React, { useState } from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface Device {
  id: number;
  name: string;
  location: string;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'offline';
  coordinates: {
    lat: number;
    lng: number;
  };
  health: number | null;
}

const MapComponent: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Device data with South Delhi coordinates
  const devices: Device[] = [
    {
      id: 1,
      name: 'Andheria More Charging Hub',
      location: 'CDR Chowk, Near Chattarpur Metro',
      status: 'critical',
      health: 45,
      coordinates: { lat: 28.5063, lng: 77.1756 } // CDR Chowk near Chattarpur Metro
    },
    {
      id: 2,
      name: 'Hauz Khas District Center',
      location: 'Hauz Khas Metro Station, 1km ahead',
      status: 'excellent',
      health: 92,
      coordinates: { lat: 28.5494, lng: 77.2066 } // Near Hauz Khas Metro, 1km ahead
    },
    {
      id: 3,
      name: 'Qutub Minar Charging Station',
      location: 'Qutub Minar',
      status: 'good',
      health: 78,
      coordinates: { lat: 28.5244, lng: 77.1855 } // Qutub Minar
    },
    {
      id: 4,
      name: 'TB Hospital Charging Point',
      location: 'TB Hospital near Qutub Minar',
      status: 'critical',
      health: 34,
      coordinates: { lat: 28.5180, lng: 77.1920 } // TB Hospital near Qutub Minar (1-2km away)
    },
    {
      id: 5,
      name: 'Hauz Khas Metro Gate 1',
      location: 'Hauz Khas Metro Gate 1',
      status: 'offline',
      health: 0,
      coordinates: { lat: 28.5431, lng: 77.2068 } // Hauz Khas Metro Gate 1
    },
    {
      id: 6,
      name: 'RK Puram Sector 5',
      location: 'RK Puram Sector 5',
      status: 'good',
      health: 81,
      coordinates: { lat: 28.5640, lng: 77.1825 } // RK Puram Sector 5
    },
    {
      id: 7,
      name: 'IIT Delhi Campus',
      location: 'IIT Delhi',
      status: 'excellent',
      health: 96,
      coordinates: { lat: 28.5458, lng: 77.1931 } // IIT Delhi
    },
    {
      id: 8,
      name: 'Panchsheel Park Metro',
      location: 'Panchsheel Park Metro Station',
      status: 'good',
      health: 87,
      coordinates: { lat: 28.5355, lng: 77.2162 } // Panchsheel Park Metro Station
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10B981'; // green-500
      case 'good': return '#10B981'; // green-500  
      case 'warning': return '#F59E0B'; // amber-500
      case 'critical': return '#EF4444'; // red-500
      case 'offline': return '#6B7280'; // gray-500
      default: return '#6B7280'; // gray-500
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const openInGoogleMaps = (device: Device) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${device.coordinates.lat},${device.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const openFullMap = () => {
    // Create Google Maps URL with all markers
    const markers = devices.map(device => {
      return `${device.coordinates.lat},${device.coordinates.lng}`;
    }).join('|');
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${markers}`;
    window.open(url, '_blank');
  };

  // Render the map component with embedded markers

  // Render the map component with truly embedded markers
  const renderMap = () => {
    // Use an actual Leaflet map embedded via data URL
    const createLeafletMap = () => {
      const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        var map = L.map('map').setView([28.5755, 77.1600], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Define marker colors based on status
        var markers = [
          ${devices.map((device, index) => `
          {
            lat: ${device.coordinates.lat},
            lng: ${device.coordinates.lng},
            name: "${device.name}",
            location: "${device.location}",
            status: "${device.status}",
            id: ${device.id}
          }`).join(',')}
        ];
        
        markers.forEach(function(device, index) {
          var color = device.status === 'offline' ? 'red' : 
                     device.status === 'critical' ? 'red' :
                     device.status === 'warning' ? 'orange' : 'green';
          
          var marker = L.marker([device.lat, device.lng]).addTo(map);
          marker.bindPopup('<b>' + device.name + '</b><br/>' + device.location + '<br/>Status: ' + device.status);
        });
    </script>
</body>
</html>`;
      
      return 'data:text/html;charset=utf-8,' + encodeURIComponent(mapHtml);
    };

    return (
      <div className="w-full h-full relative bg-blue-50">
        {/* Embedded Leaflet map with real markers */}
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          src={createLeafletMap()}
          title="EV Charging Stations Map - South Delhi"
          className="rounded-lg"
          sandbox="allow-scripts"
        ></iframe>
        
        {/* Device status list overlay */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-2 sm:p-3 shadow-lg w-36 sm:max-w-xs border border-gray-200 max-h-[80%] overflow-y-auto">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 flex items-center">
            <MapPin className="mr-1 text-blue-600" size={12} />
            Stations ({devices.length})
          </h3>
          <div className="space-y-1">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center text-xs cursor-pointer hover:bg-gray-50 p-1 rounded gap-1"
                onClick={() => setSelectedDevice(device)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(device.status) }}
                ></div>
                <span className="text-gray-600 truncate flex-1">{device.id}. {device.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center min-w-0">
          <div className="bg-blue-600 p-2 rounded-lg mr-3 flex-shrink-0">
            <MapPin className="text-white" size={18} />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Device Locations Map</h2>
        </div>
        <button
          onClick={openFullMap}
          className="flex items-center px-2.5 sm:px-3 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors flex-shrink-0 ml-2"
        >
          <ExternalLink size={14} className="sm:mr-1" />
          <span className="hidden sm:inline">View All on Google Maps</span>
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-4 sm:mb-6">
        {/* Interactive Map with Custom Markers */}
        <div className="relative h-64 sm:h-96 bg-gradient-to-br from-blue-50 to-gray-100 rounded-lg">
          {renderMap()}
        </div>
      </div>

      {/* Selected Device Info */}
      {selectedDevice && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{selectedDevice.name}</h3>
              <p className="text-gray-600 text-sm mb-1">📍 {selectedDevice.location}</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: getStatusColor(selectedDevice.status) }}></div>
                  <span className="text-sm font-medium">{getStatusLabel(selectedDevice.status)}</span>
                </div>
                {selectedDevice.health && (
                  <span className="text-sm text-gray-600">
                    🔋 <span className="font-medium text-green-600">{selectedDevice.health}%</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => openInGoogleMaps(selectedDevice)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Navigation size={16} className="mr-1" />
                Navigate
              </button>
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device list below map */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Device Locations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {devices.map((device) => (
            <div 
              key={device.id} 
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setSelectedDevice(device)}
            >
              <div 
                className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                style={{ backgroundColor: getStatusColor(device.status) }}
              ></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{device.name}</p>
                <p className="text-sm text-gray-600 truncate">{device.location}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{getStatusLabel(device.status)}</p>
                  {device.health && (
                    <p className="text-xs text-green-600 font-medium">{device.health}%</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;