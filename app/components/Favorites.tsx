'use client';

import React, { useState } from 'react';
import { Heart, MapPin, Star, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { useFavorites } from '@/app/hooks/useFavorites';
import { categoryLabels } from '@/app/lib/places';

interface FavoritesProps {
  onSelectPlace?: (placeId: string) => void;
}

/**
 * Componente Favoritos
 * 
 * Propósito:
 * - Mostrar lista de lugares marcados como favoritos
 * - Permite remover de favoritos directamente
 * - Muestra información clave del lugar (nombre, barrio, rating)
 * - Responsive para móvil
 */
export default function Favorites({ onSelectPlace }: FavoritesProps) {
  const { favorites, removeFavorite } = useFavorites();
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);

  if (favorites.length === 0) {
    return (
      <div className='p-6 text-center'>
        <Heart size={48} className='text-gray-300 mx-auto mb-4' />
        <h3 className='font-bold text-gray-900 mb-2'>No hay favoritos aún</h3>
        <p className='text-sm text-gray-600'>
          Explora el mapa y agrega lugares a tu lista de favoritos ❤️
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='px-4 sm:px-6 py-3 bg-red-50 border-l-4 border-red-500'>
        <h3 className='font-bold text-gray-900 flex items-center gap-2'>
          <Heart size={18} className='fill-red-500 text-red-500' />
          Mis Favoritos ({favorites.length})
        </h3>
      </div>

      {/* Lista de favoritos con scroll */}
      <div className='px-4 sm:px-6 space-y-2 max-h-[60vh] sm:max-h-96 overflow-y-auto'>
        {favorites.map((place) => (
          <div
            key={place.id}
            className={`p-3 border rounded-lg transition-all cursor-pointer ${
              selectedFavoriteId === place.id
                ? 'border-purple-600 bg-purple-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-sm'
            }`}
            onClick={() => {
              setSelectedFavoriteId(place.id);
              onSelectPlace?.(place.id);
            }}
          >
            {/* Header del favorito */}
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1 min-w-0'>
                {/* Nombre y categoría */}
                <h4 className='font-bold text-sm text-gray-900 truncate'>
                  {place.name}
                </h4>
                <p className='text-xs text-gray-600'>
                  {categoryLabels[place.category as keyof typeof categoryLabels]}
                </p>
              </div>

              {/* Botón remover de favoritos */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(place.id);
                  if (selectedFavoriteId === place.id) {
                    setSelectedFavoriteId(null);
                  }
                }}
                className='flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors'
                title='Remover de favoritos'
                aria-label='Remover de favoritos'
              >
                <Heart size={16} className='fill-red-500 text-red-500' />
              </button>
            </div>

            {/* Información del lugar */}
            <div className='mt-2 space-y-1 text-xs text-gray-600'>
              {/* Barrio y dirección */}
              <div className='flex items-center gap-1'>
                <MapPin size={14} className='text-gray-400 flex-shrink-0' />
                <span className='truncate'>{place.barrio}</span>
              </div>

              {/* Calificación de seguridad */}
              <div className='flex items-center gap-1'>
                <div className='flex gap-0.5'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < place.safetyRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <span>{place.safetyRating}/5 seguridad</span>
              </div>

              {/* Badges: LGBTIQ+ Friendly, Accesibilidad */}
              <div className='flex gap-1 flex-wrap pt-1'>
                {place.lgbtiqFriendly && (
                  <span className='inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold'>
                    🌈 LGBTIQ+
                  </span>
                )}
                {place.accessibility.length > 0 && (
                  <span className='inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold'>
                    ♿ Accesible
                  </span>
                )}
              </div>
            </div>

            {/* Indicadores de contenido (comentarios, fotos) */}
            <div className='mt-2 flex gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100'>
              <span className='flex items-center gap-1'>
                <MessageCircle size={12} />
                Comentarios
              </span>
              <span className='flex items-center gap-1'>
                <ImageIcon size={12} />
                Fotos
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer con estadísticas */}
      <div className='px-4 sm:px-6 py-3 bg-gray-50 border-t'>
        <p className='text-xs text-gray-600 text-center'>
          {favorites.length === 1
            ? '1 lugar guardado en tus favoritos'
            : `${favorites.length} lugares guardados en tus favoritos`}
        </p>
      </div>
    </div>
  );
}
