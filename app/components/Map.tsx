'use client';

import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { MapPin, Search, X } from 'lucide-react';
import { MEDELLIN_CENTER, categoryColors, Place } from '@/app/lib/places';
import { usePlaces } from '@/app/context/PlacesContext';
import PlaceModal from './PlaceModal';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
};

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

function getSearchResultIcon(): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="#3B82F6" stroke="white" stroke-width="3"/>
        <circle cx="15" cy="15" r="6" fill="none" stroke="white" stroke-width="2.5"/>
        <line x1="19.5" y1="19.5" x2="25" y2="25" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(36, 36),
    anchor: new google.maps.Point(18, 36),
  };
}

interface SearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  types: string[];
}

export default function Map() {
  const { places } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + ' Medellín Colombia')}&key=${GOOGLE_MAPS_API_KEY}&language=es`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        const results: SearchResult[] = data.results.slice(0, 8).map((r: {
          name: string;
          formatted_address: string;
          geometry: { location: { lat: number; lng: number } };
          place_id: string;
          types: string[];
        }) => ({
          name: r.name,
          address: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          placeId: r.place_id,
          types: r.types,
        }));
        setSearchResults(results);

        if (results.length > 0 && mapRef.current) {
          const bounds = new google.maps.LatLngBounds();
          results.forEach(r => bounds.extend({ lat: r.lat, lng: r.lng }));
          mapRef.current.fitBounds(bounds, 50);
        }
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  }, [searchQuery]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedSearchResult(null);
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

  const flyTo = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(17);
    }
  }, []);

  if (loadError) {
    return <div className="w-full h-screen flex items-center justify-center bg-gray-100">Error al cargar Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="w-full h-screen flex items-center justify-center bg-gray-100">Cargando mapa...</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Barra de búsqueda */}
      <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center">
            <div className="pl-4">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar bares, restaurantes, hoteles..."
              className="flex-1 px-3 py-3 text-sm outline-none"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-3 bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Buscar'
              )}
            </button>
          </div>

          {/* Resultados de búsqueda */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="border-t max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.placeId}
                  onClick={() => {
                    setSelectedSearchResult(result);
                    flyTo(result.lat, result.lng);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-0 transition-colors ${
                    selectedSearchResult?.placeId === result.placeId ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{result.name}</p>
                      <p className="text-xs text-gray-500 truncate">{result.address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && !isSearching && (
            <div className="border-t px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* Mapa */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: MEDELLIN_CENTER[0], lng: MEDELLIN_CENTER[1] }}
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
            onMouseOver={() => setHoveredPlace(place)}
            onMouseOut={() => setHoveredPlace(null)}
          />
        ))}

        {/* Marcadores de resultados de búsqueda */}
        {searchResults.map((result) => (
          <MarkerF
            key={`search-${result.placeId}`}
            position={{ lat: result.lat, lng: result.lng }}
            icon={getSearchResultIcon()}
            onClick={() => setSelectedSearchResult(result)}
          />
        ))}

        {/* InfoWindow para resultados de búsqueda */}
        {selectedSearchResult && (
          <InfoWindowF
            position={{ lat: selectedSearchResult.lat, lng: selectedSearchResult.lng }}
            onCloseClick={() => setSelectedSearchResult(null)}
          >
            <div className="p-1 max-w-[250px]">
              <h3 className="font-bold text-sm text-gray-900">{selectedSearchResult.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{selectedSearchResult.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedSearchResult.lat},${selectedSearchResult.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:underline mt-2 inline-block"
              >
                Ver en Google Maps
              </a>
            </div>
          </InfoWindowF>
        )}

        {/* Tooltip para lugares hover */}
        {hoveredPlace && (
          <InfoWindowF
            position={{ lat: hoveredPlace.coordinates[0], lng: hoveredPlace.coordinates[1] }}
            onCloseClick={() => setHoveredPlace(null)}
            options={{ pixelOffset: new google.maps.Size(0, -40) }}
          >
            <div className="p-1 max-w-[220px]">
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
