'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { MEDELLIN_CENTER, categoryColors, Place } from '@/app/lib/places';
import { usePlaces } from '@/app/context/PlacesContext';
import PlaceModal from './PlaceModal';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
};

const mapCenter = { lat: MEDELLIN_CENTER[0], lng: MEDELLIN_CENTER[1] };

const getCategoryEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    cafe: '☕',
    bar: '🍹',
    lugar: '📍',
    lugarSimbolico: '🏳️‍🌈',
    parque: '🌳',
    culturalCenter: '🎨',
    health: '⚕️',
    other: '📍',
  };
  return emojis[category] || '📍';
};

function createCategoryIcon(category: string): google.maps.Icon {
  const bgColor = categoryColors[category as keyof typeof categoryColors] || '#9400D3';
  const emoji = getCategoryEmoji(category);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="${bgColor}" stroke="white" stroke-width="3"/>
        <text x="20" y="26" text-anchor="middle" font-size="20">${emoji}</text>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 40),
  };
}

export default function Map() {
  const { places } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMarkerHover = useCallback((place: Place) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredPlace(place);
    setHoveredId(place.id);
  }, []);

  const handleMarkerLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPlace(null);
      setHoveredId(null);
    }, 200);
  }, []);

  const handleInfoWindowMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleInfoWindowMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPlace(null);
      setHoveredId(null);
    }, 200);
  }, []);

  const handlePlaceClick = useCallback((place: Place) => {
    setHoveredPlace(null);
    setSelectedPlace(place);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPlace(null);
  }, []);

  if (loadError) {
    return <div className="w-full h-screen flex items-center justify-center bg-gray-100">Error al cargar Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="w-full h-screen flex items-center justify-center bg-gray-100">Cargando mapa...</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Mapa */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Marcadores de lugares de la base de datos */}
        {places.map((place) => (
          <MarkerF
            key={place.id}
            position={{ lat: place.coordinates[0], lng: place.coordinates[1] }}
            icon={createCategoryIcon(place.category)}
            onClick={() => handlePlaceClick(place)}
            onMouseOver={() => handleMarkerHover(place)}
            onMouseOut={handleMarkerLeave}
          />
        ))}

        {/* Tooltip para lugares hover */}
        {hoveredPlace && (
          <InfoWindowF
            position={{ lat: hoveredPlace.coordinates[0], lng: hoveredPlace.coordinates[1] }}
            onCloseClick={() => { setHoveredPlace(null); setHoveredId(null); }}
            options={{ pixelOffset: new google.maps.Size(0, -40), disableAutoPan: true }}
          >
            <div
              onMouseEnter={handleInfoWindowMouseEnter}
              onMouseLeave={handleInfoWindowMouseLeave}
              className="p-1 max-w-[220px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getCategoryEmoji(hoveredPlace.category)}</span>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{hoveredPlace.name}</h4>
                  <p className="text-xs text-gray-500">{hoveredPlace.barrio}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">{hoveredPlace.address}</p>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Modal con información del lugar */}
      {isModalOpen && selectedPlace && (
        <PlaceModal
          place={selectedPlace}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
