"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

interface Device {
  id: number;
  name: string;
  location: string;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'offline';
  coordinates: { lat: number; lng: number };
  health: number | null;
}

const DEVICES: Device[] = [
  // { id: 1, name: 'Device 1', location: 'CDR Chowk, Near Chattarpur Metro',                       status: 'critical',  health: 45,   coordinates: { lat: 28.5063,    lng: 77.1756    } },
  // { id: 2, name: 'Device 2', location: 'Hauz Khas Metro Station, Delhi',                          status: 'excellent', health: 88,   coordinates: { lat: 28.5494,    lng: 77.2066    } },
  // { id: 3, name: 'Device 3', location: 'Qutub Minar, Delhi',                                      status: 'good',      health: 92,   coordinates: { lat: 28.5244,    lng: 77.1855    } },
  // { id: 4, name: 'Device 4', location: 'TB Hospital near Qutub Minar, Delhi',                     status: 'critical',  health: 89,   coordinates: { lat: 28.5180,    lng: 77.1920    } },
  { id: 5, name: 'Device 4', location: 'Sapna Cinema, Phase 3 Industrial Area, Delhi',                           status: 'good',      health: 92,   coordinates: { lat: 28.5594,    lng: 77.2444    } },
  { id: 6, name: 'Device 1', location: 'Piccadily Back side parking, Sector 34 Chandigarh',       status: 'excellent', health: 85,   coordinates: { lat: 30.723361,  lng: 76.768370  } },
  { id: 7, name: 'Device 2', location: 'Passport office front side parking, Sector 34 Chandigarh',status: 'excellent', health: 85,   coordinates: { lat: 30.7242732, lng: 76.7694117 } },
  { id: 8, name: 'Device 3', location: 'Piccadily multiplex II, Sector 34 Chandigarh',            status: 'excellent', health: 85,   coordinates: { lat: 30.7238258, lng: 76.7676255 } },
  // { id: 9, name: 'Device 4', location: 'Okhla Industrial Estate, Phase III, Delhi',               status: 'good',      health: 92,   coordinates: { lat: 28.5594,    lng: 77.2444    } },
];

// Dynamically import react-leaflet components to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => (
  <div className="w-full h-full flex items-center justify-center bg-blue-50 rounded-lg">
    <p className="text-sm text-gray-500 animate-pulse">Loading map…</p>
  </div>
)});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return '#10B981';
    case 'good':      return '#10B981';
    case 'warning':   return '#F59E0B';
    case 'critical':  return '#EF4444';
    case 'offline':   return '#6B7280';
    default:          return '#6B7280';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'excellent': return 'Excellent';
    case 'good':      return 'Good';
    case 'warning':   return 'Warning';
    case 'critical':  return 'Critical';
    case 'offline':   return 'Offline';
    default:          return 'Unknown';
  }
};

const MapComponent: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const openInGoogleMaps = (device: Device) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${device.coordinates.lat},${device.coordinates.lng}`,
      '_blank'
    );
  };

  const openFullMap = () => {
    const dest = DEVICES.map(d => `${d.coordinates.lat},${d.coordinates.lng}`).join('|');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
      {/* Header */}
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

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-4 sm:mb-6 h-64 sm:h-96">
        <LeafletMap devices={DEVICES} onSelect={setSelectedDevice} />
      </div>

      {/* Selected device info panel */}
      {selectedDevice && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{selectedDevice.name}</h3>
              <p className="text-gray-600 text-sm mb-1">📍 {selectedDevice.location}</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: getStatusColor(selectedDevice.status) }} />
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

      {/* Device list */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Device Locations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {DEVICES.map((device) => (
            <div
              key={device.id}
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setSelectedDevice(device)}
            >
              <div
                className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                style={{ backgroundColor: getStatusColor(device.status) }}
              />
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
