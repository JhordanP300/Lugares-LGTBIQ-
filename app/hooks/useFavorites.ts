'use client';

import { useState, useCallback, useMemo } from 'react';
import { Place } from '@/app/lib/places';

/**
 * Hook personalizado para manejar favoritos
 *
 * Propósito:
 * - Guardar y recuperar favoritos de localStorage
 * - Sincronizar favoritos entre componentes
 * - Proporcionar métodos para agregar/remover favoritos
 *
 * Uso:
 * const { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite } = useFavorites();
 */

function readFavoritesFromStorage(): Place[] {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('lugares_favoritos');
      return data ? JSON.parse(data) : [];
    }
  } catch {
    // ignore
  }
  return [];
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Place[]>(() => readFavoritesFromStorage());
  const [isLoaded] = useState(true);

  // Persist to localStorage on every change
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lugares_favoritos', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }

  const addFavorite = useCallback((place: Place) => {
    setFavorites((prev) => {
      if (prev.some(p => p.id === place.id)) {
        return prev;
      }
      return [...prev, place];
    });
  }, []);

  const removeFavorite = useCallback((placeId: string) => {
    setFavorites((prev) => prev.filter(p => p.id !== placeId));
  }, []);

  const toggleFavorite = useCallback((place: Place) => {
    setFavorites((prev) => {
      if (prev.some(p => p.id === place.id)) {
        return prev.filter(p => p.id !== place.id);
      }
      return [...prev, place];
    });
  }, []);

  const isFavorite = useCallback((placeId: string): boolean => {
    return favorites.some(p => p.id === placeId);
  }, [favorites]);

  return useMemo(() => ({
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoaded,
  }), [favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite, isLoaded]);
}
