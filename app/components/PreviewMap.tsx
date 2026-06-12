'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MEDELLIN_CENTER: [number, number] = [6.2442, -75.5812];

interface PreviewMapProps {
  coordinates: [number, number];
  address?: string;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const markerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8B5CF6"/>
        <stop offset="100%" style="stop-color:#EC4899"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#grad)" stroke="white" stroke-width="3"/>
    <path d="M34 22c0 8-10 14-10 14s-10-6-10-14a10 10 0 0 1 20 0Z" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="24" cy="21" r="4" fill="none" stroke="white" stroke-width="2.5"/>
  </svg>
`;

function MapInner({ coordinates, interactive, onMapClick }: { coordinates: [number, number]; interactive: boolean; onMapClick?: (lat: number, lng: number) => void }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [showMarker, setShowMarker] = useState(false);
  const prevCoordsRef = useRef<string>('');

  useEffect(() => {
    const key = `${coordinates[0]},${coordinates[1]}`;
    if (key !== prevCoordsRef.current) {
      prevCoordsRef.current = key;
      setShowMarker(true);
    }
  }, [coordinates]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!onMapClick || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    onMapClick(lat, lng);
    setShowMarker(true);
  }, [onMapClick]);

  const hasPosition = showMarker && (coordinates[0] !== MEDELLIN_CENTER[0] || coordinates[1] !== MEDELLIN_CENTER[1]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: coordinates[0], lng: coordinates[1] }}
      zoom={hasPosition ? 17 : 14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={interactive ? handleMapClick : undefined}
      options={{
        ...mapOptions,
        draggable: interactive,
        scrollwheel: interactive,
        zoomControl: interactive,
        disableDoubleClickZoom: !interactive,
        gestureHandling: interactive ? 'greedy' : 'none',
      }}
    >
      {hasPosition && (
        <MarkerF
          position={{ lat: coordinates[0], lng: coordinates[1] }}
          icon={{
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
            scaledSize: new google.maps.Size(48, 48),
            anchor: new google.maps.Point(24, 48),
          }}
          animation={google.maps.Animation.DROP}
        />
      )}
    </GoogleMap>
  );
}

export default function PreviewMap({ coordinates, address, interactive = false, onMapClick }: PreviewMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const mapHeight = interactive ? 'h-80' : 'h-48';

  if (loadError) {
    return (
      <div className={`w-full ${mapHeight} rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50`}>
        <p className="text-sm text-gray-500">Error al cargar Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`w-full ${mapHeight} rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${mapHeight} rounded-lg overflow-hidden border border-gray-200 transition-all duration-300`}>
      <MapInner coordinates={coordinates} interactive={interactive} onMapClick={onMapClick} />
    </div>
  );
}
