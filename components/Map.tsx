'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { MEDELLIN_CENTER, categoryColors } from '@/app/lib/places';
import { usePlaces } from '@/app/context/PlacesContext';
import PlaceModal from './PlaceModal';

const createCategoryIcon = (category: string) => {
  const bgColor = categoryColors[category as keyof typeof categoryColors] || '#9400D3';
  
  return divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${bgColor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        font-weight: bold;
        font-size: 20px;
        color: white;
      ">
        ${getCategoryEmoji(category)}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'custom-marker',
  });
};

const getCategoryEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    cafe: '☕',
    bar: '🍹',
    hotel: '🏨',
    parque: '🌳',
    culturalCenter: '🎨',
    health: '⚕️',
    other: '📍',
  };
  return emojis[category] || '📍';
};

export default function Map() {
  const { places } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMarkerClick = (place: any) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
  };

  return (
    <>
      <MapContainer
        center={MEDELLIN_CENTER}
        zoom={13}
        style={{ height: '100vh', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Renderizar marcadores de lugares */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={place.coordinates}
            icon={createCategoryIcon(place.category)}
            eventHandlers={{
              click: () => handleMarkerClick(place),
            }}
          >
            <Popup>
              <div className='p-2'>
                <h3 className='font-bold text-sm'>{place.name}</h3>
                <p className='text-xs text-gray-600'>{place.barrio}</p>
                <button
                  onClick={() => handleMarkerClick(place)}
                  className='mt-2 text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700'
                >
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Modal con información del lugar */}
      {isModalOpen && selectedPlace && (
        <PlaceModal
          place={selectedPlace}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlace(null);
          }}
        />
      )}
    </>
  );
}
