"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Device {
  id: number;
  name: string;
  location: string;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'offline';
  coordinates: { lat: number; lng: number };
  health: number | null;
}

interface LeafletMapProps {
  devices: Device[];
  onSelect: (device: Device) => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case 'excellent': return '#10B981';
    case 'good':      return '#10B981';
    case 'warning':   return '#F59E0B';
    case 'critical':  return '#EF4444';
    case 'offline':   return '#6B7280';
    default:          return '#6B7280';
  }
};

const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -44],
  });

const LeafletMap: React.FC<LeafletMapProps> = ({ devices, onSelect }) => {
  // Fix Leaflet's default icon asset paths (broken in webpack/Next.js)
  useEffect(() => {
    // @ts-expect-error — _getIconUrl is internal but must be deleted to force custom icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={[28.5755, 77.16]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={[device.coordinates.lat, device.coordinates.lng]}
          icon={makeIcon(statusColor(device.status))}
          eventHandlers={{ click: () => onSelect(device) }}
        >
          <Popup>
            <strong>{device.name}</strong><br />
            {device.location}<br />
            Status: {device.status}
            {device.health !== null ? <><br />Health: {device.health}%</> : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LeafletMap;
