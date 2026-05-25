'use client';

import React, { useState } from 'react';
import { Place, categoryLabels } from '@/app/lib/places';
import { X, Phone, Globe, Clock, MapPin, Star, Heart } from 'lucide-react';
import Comments from './Comments';
import PhotoGallery from './PhotoGallery';
import Toast from './Toast';
import { useFavorites } from '@/app/hooks/useFavorites';

interface PlaceModalProps {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaceModal({ place, isOpen, onClose }: PlaceModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'photos'>('info');
  // Usar el hook de favoritos en lugar de useState local
  const { isFavorite, toggleFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  
  const isCurrentFavorite = isFavorite(place.id);

  if (!isOpen) return null;

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/${place.coordinates[0]},${place.coordinates[1]}`;
    window.open(url, '_blank');
  };

  const getRainbowGradient = () => {
    return 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500';
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50'>
      <div className='bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in overflow-hidden'>
        {/* Header con degradado arcoíris - flex-shrink-0 para que no se comprima */}
        <div className={`flex-shrink-0 ${getRainbowGradient()} p-6 rounded-t-2xl sm:rounded-t-2xl relative`}>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 z-10 bg-white/30 hover:bg-white/50 rounded-full p-2 transition-colors shadow-lg'
            aria-label='Cerrar'
            title='Cerrar'
          >
            <X size={24} className='text-white' />
          </button>
          
          <div className='flex items-start justify-between pr-12'>
            <div className='flex-1'>
              <p className='text-white/90 text-sm mb-2'>{categoryLabels[place.category]}</p>
              <h2 className='text-white text-xl sm:text-2xl font-bold'>{place.name}</h2>
              <p className='text-white/90 text-sm mt-2'>{place.barrio}</p>
            </div>
            <button
              onClick={() => {
                // Usar el hook para agregar/remover de favoritos
                toggleFavorite(place);
                setShowFavoriteToast(true);
              }}
              className='flex-shrink-0 ml-2 bg-white/30 hover:bg-white/50 rounded-full p-2 transition-colors shadow-lg'
              aria-label={isCurrentFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
              title={isCurrentFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
            >
              <Heart
                size={24}
                className={isCurrentFavorite ? 'fill-white text-white' : 'text-white'}
              />
            </button>
          </div>

          {/* Rating de seguridad */}
          <div className='mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-2 rounded-full'>
            <span className='text-white font-semibold text-sm'>Seguridad:</span>
            <div className='flex gap-1'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < place.safetyRating ? 'fill-yellow-300 text-yellow-300' : 'text-white/30'}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs - flex-shrink-0 para que no se comprima */}
        <div className='flex-shrink-0 flex border-b bg-white'>
          {['info', 'comments', 'photos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'info' && 'Información'}
              {tab === 'comments' && 'Comentarios'}
              {tab === 'photos' && 'Fotos'}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className='overflow-y-auto flex-1 p-6'>
          {activeTab === 'info' && (
            <div className='space-y-4'>
              <div>
                <h3 className='font-bold text-gray-900 mb-2'>Descripción</h3>
                <p className='text-gray-700'>{place.description}</p>
              </div>

              {/* Información de contacto */}
              <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                <div className='flex items-center gap-3'>
                  <MapPin size={18} className='text-purple-600 flex-shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600'>Dirección</p>
                    <p className='font-semibold text-gray-900'>{place.address}</p>
                  </div>
                </div>

                {place.phone && (
                  <div className='flex items-center gap-3'>
                    <Phone size={18} className='text-purple-600 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600'>Teléfono</p>
                      <a
                        href={`tel:${place.phone}`}
                        className='font-semibold text-purple-600 hover:text-purple-700'
                      >
                        {place.phone}
                      </a>
                    </div>
                  </div>
                )}

                {place.website && (
                  <div className='flex items-center gap-3'>
                    <Globe size={18} className='text-purple-600 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600'>Website</p>
                      <a
                        href={place.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-semibold text-purple-600 hover:text-purple-700'
                      >
                        {place.website}
                      </a>
                    </div>
                  </div>
                )}

                {place.hours && (
                  <div className='flex items-center gap-3'>
                    <Clock size={18} className='text-purple-600 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600'>Horario</p>
                      <p className='font-semibold text-gray-900'>{place.hours}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Accesibilidad */}
              {place.accessibility.length > 0 && (
                <div>
                  <h3 className='font-bold text-gray-900 mb-2'>♿ Accesibilidad</h3>
                  <ul className='space-y-1'>
                    {place.accessibility.map((item, i) => (
                      <li key={i} className='flex items-center gap-2 text-gray-700'>
                        <span className='text-green-600'>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botón para ir */}
              <button
                onClick={openGoogleMaps}
                className='w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow mt-4'
              >
                📍 Cómo llegar
              </button>
            </div>
          )}

          {activeTab === 'comments' && <Comments placeId={place.id} />}
          {activeTab === 'photos' && <PhotoGallery placeId={place.id} />}
        </div>
      </div>

      {/* Toast de notificación cuando se agrega/remueve de favoritos */}
      {showFavoriteToast && (
        <Toast
          message={isCurrentFavorite ? '❤️ Agregado a favoritos' : '💔 Removido de favoritos'}
          type='success'
          duration={3000}
          onClose={() => setShowFavoriteToast(false)}
        />
      )}
    </div>
  );
}
