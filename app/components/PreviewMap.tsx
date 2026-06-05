'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

interface PreviewMapProps {
  coordinates: [number, number];
  address?: string;
}

// Icono personalizado para el marcador del preview
const previewIcon = divIcon({
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8B5CF6, #EC4899);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      cursor: pointer;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'preview-marker',
});

// Componente para actualizar la vista del mapa cuando cambian las coordenadas
function MapUpdater({ coordinates }: { coordinates: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates) {
      map.setView(coordinates, 16, { animate: true });
    }
  }, [coordinates, map]);
  
  return null;
}

export default function PreviewMap({ coordinates, address }: PreviewMapProps) {
  return (
    <div className='w-full h-48 rounded-lg overflow-hidden border border-gray-200'>
      <MapContainer
        center={coordinates}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker
          position={coordinates}
          icon={previewIcon}
        />
        <MapUpdater coordinates={coordinates} />
      </MapContainer>
    </div>
  );
}
