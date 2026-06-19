'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Place, places as initialPlaces } from '@/app/lib/places';
import { fetchPlaces, insertPlace as dbInsertPlace, deletePlace as dbDeletePlace } from '@/app/lib/places-db';

const STORAGE_KEY = 'lugares_places';

function loadPlacesFromStorage(): Place[] {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function savePlacesToStorage(places: Place[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    }
  } catch {
    // ignore
  }
}

interface PlacesContextType {
  places: Place[];
  addPlace: (place: Omit<Place, 'id'>, userId?: string) => Promise<string | null>;
  deletePlace: (id: string) => Promise<void>;
  loading: boolean;
}

export const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      // Try Supabase first
      const dbPlaces = await fetchPlaces();
      if (dbPlaces.length > 0) {
        setPlaces(dbPlaces);
        savePlacesToStorage(dbPlaces);
      } else {
        // Fallback to localStorage
        const local = loadPlacesFromStorage();
        if (local.length > 0) {
          setPlaces(local);
        } else {
          // No places anywhere
          setPlaces([]);
        }
      }
      setLoaded(true);
      setLoading(false);
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (loaded) {
      savePlacesToStorage(places);
    }
  }, [places, loaded]);

  const addPlace = useCallback(async (newPlace: Omit<Place, 'id'>, userId?: string): Promise<string | null> => {
    if (userId) {
      const dbPlace = await dbInsertPlace(newPlace, userId);
      if (dbPlace) {
        setPlaces(prev => [dbPlace, ...prev]);
        return dbPlace.id;
      }
      console.error('[PlacesContext] DB insert falló. Causas posibles:');
      console.error('1. La tabla "places" no existe en Supabase. Ejecuta lib/supabase/schema-full.sql en SQL Editor.');
      console.error('2. RLS bloquea el INSERT. Verifica las políticas de la tabla places.');
      console.error('3. Falta la columna social_links. Ejecuta lib/supabase/add-social-links.sql en SQL Editor.');
    }
    // Fallback: local only
    console.warn('[PlacesContext] Usando fallback localStorage (el lugar NO se guarda en Supabase)');
    const localPlace: Place = {
      ...newPlace,
      id: crypto.randomUUID?.() || Date.now().toString(36),
    };
    setPlaces(prev => [localPlace, ...prev]);
    return localPlace.id;
  }, []);

  const deletePlaceFn = useCallback(async (id: string) => {
    await dbDeletePlace(id);
    setPlaces(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <PlacesContext.Provider value={{ places, addPlace, deletePlace: deletePlaceFn, loading }}>
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  const context = React.useContext(PlacesContext);
  if (context === undefined) {
    throw new Error('usePlaces must be used within PlacesProvider');
  }
  return context;
}
