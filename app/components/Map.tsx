'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MapPin, Eye } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { MEDELLIN_CENTER, categoryColors, Place } from '@/app/lib/places';
import { usePlaces } from '@/app/context/PlacesContext';
import PlaceModal from './PlaceModal';

const createCategoryIcon = (category: string) => {
  const bgColor = categoryColors[category as keyof typeof categoryColors] || '#9400D3';
  
  return divIcon({
    html: `
      <div class="marker-icon" style="
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
        transition: transform 0.2s ease, box-shadow 0.2s ease;
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
    lugar: '📍',
    parque: '🌳',
    culturalCenter: '🎨',
    health: '⚕️',
    other: '📍',
  };
  return emojis[category] || '📍';
};

// Componente para convertir coordenadas a posición en pantalla
function MapPositionUpdater({ 
  hoveredPlace, 
  onPositionUpdate 
}: { 
  hoveredPlace: Place | null;
  onPositionUpdate: (pos: { x: number; y: number }) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (hoveredPlace && map) {
      const updatePosition = () => {
        const point = map.latLngToContainerPoint(hoveredPlace.coordinates);
        onPositionUpdate({ x: point.x, y: point.y });
      };
      
      updatePosition();
      
      // Actualizar posición cuando se mueve el mapa
      map.on('move', updatePosition);
      map.on('zoom', updatePosition);
      
      return () => {
        map.off('move', updatePosition);
        map.off('zoom', updatePosition);
      };
    }
  }, [hoveredPlace, map, onPositionUpdate]);
  
  return null;
}

export default function Map() {
  const { places } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMarkerClick = useCallback((place: Place) => {
    // Cancelar timeout de ocultar tooltip si existe
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setSelectedPlace(place);
    setIsModalOpen(true);
  }, []);

  const handleMarkerMouseOver = useCallback((place: Place) => {
    // Cancelar timeout de ocultar tooltip si existe
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredPlace(place);
  }, []);

  const handleMarkerMouseOut = useCallback(() => {
    // Agregar un pequeño retraso antes de ocultar el tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredPlace(null);
    }, 100);
  }, []);

  const handlePositionUpdate = useCallback((pos: { x: number; y: number }) => {
    setTooltipPosition(pos);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPlace(null);
  }, []);

  return (
    <div ref={mapRef} className='relative w-full h-full'>
      <MapContainer
        center={MEDELLIN_CENTER}
        zoom={13}
        style={{ height: '100vh', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Componente para actualizar posición del tooltip */}
        <MapPositionUpdater 
          hoveredPlace={hoveredPlace} 
          onPositionUpdate={handlePositionUpdate} 
        />

        {/* Renderizar marcadores de lugares */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={place.coordinates}
            icon={createCategoryIcon(place.category)}
            eventHandlers={{
              click: () => handleMarkerClick(place),
              mouseover: () => handleMarkerMouseOver(place),
              mouseout: handleMarkerMouseOut,
            }}
          />
        ))}
      </MapContainer>

      {/* Tooltip personalizado al hacer hover */}
      {hoveredPlace && (
        <div
          className='absolute z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full tooltip-animate'
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 50,
          }}
        >
          <div className='bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] max-w-[280px]'>
            {/* Header con emoji de categoría */}
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-xl'>
                {getCategoryEmoji(hoveredPlace.category)}
              </span>
              <div className='flex-1 min-w-0'>
                <h4 className='font-bold text-sm text-gray-900 truncate'>
                  {hoveredPlace.name}
                </h4>
                <p className='text-xs text-gray-500'>
                  {hoveredPlace.barrio}
                </p>
              </div>
            </div>
            
            {/* Dirección */}
            <div className='flex items-start gap-1.5 mb-2'>
              <MapPin size={12} className='text-gray-400 mt-0.5 flex-shrink-0' />
              <p className='text-xs text-gray-600 leading-tight'>
                {hoveredPlace.address}
              </p>
            </div>
            
            {/* Indicador de ver detalles */}
            <div className='flex items-center gap-1.5 pt-2 border-t border-gray-100'>
              <Eye size={12} className='text-purple-600' />
              <span className='text-xs font-medium text-purple-600'>
                Clic para ver detalles
              </span>
            </div>
            
            {/* Flecha del tooltip */}
            <div className='absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white' />
          </div>
        </div>
      )}

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
