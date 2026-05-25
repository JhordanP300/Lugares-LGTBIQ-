'use client';

import { useState, useEffect } from 'react';
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
export function useFavorites() {
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar favoritos de localStorage al montar el componente
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('lugares_favoritos');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
    setIsLoaded(true);
  }, []);

  // Guardar favoritos en localStorage cada vez que cambien
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('lugares_favoritos', JSON.stringify(favorites));
      } catch (error) {
        console.error('Error guardando favoritos:', error);
      }
    }
  }, [favorites, isLoaded]);

  /**
   * Agregar un lugar a favoritos
   * @param place - El lugar a agregar
   */
  const addFavorite = (place: Place) => {
    setFavorites((prev) => {
      // Evitar duplicados
      if (prev.some(p => p.id === place.id)) {
        return prev;
      }
      return [...prev, place];
    });
  };

  /**
   * Remover un lugar de favoritos
   * @param placeId - El ID del lugar a remover
   */
  const removeFavorite = (placeId: number) => {
    setFavorites((prev) => prev.filter(p => p.id !== placeId));
  };

  /**
   * Alternar entre agregar/remover de favoritos
   * @param place - El lugar a alternar
   */
  const toggleFavorite = (place: Place) => {
    if (isFavorite(place.id)) {
      removeFavorite(place.id);
    } else {
      addFavorite(place);
    }
  };

  /**
   * Verificar si un lugar está en favoritos
   * @param placeId - El ID del lugar a verificar
   * @returns true si está en favoritos, false si no
   */
  const isFavorite = (placeId: number): boolean => {
    return favorites.some(p => p.id === placeId);
  };

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoaded,
  };
}
