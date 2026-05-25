'use client';

import React, { createContext, useState, ReactNode } from 'react';
import { Place, places as initialPlaces } from '@/app/lib/places';

interface PlacesContextType {
  places: Place[];
  addPlace: (place: Omit<Place, 'id'>) => void;
}

export const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>(initialPlaces);

  const addPlace = (newPlace: Omit<Place, 'id'>) => {
    const placeWithId: Place = {
      ...newPlace,
      id: Math.max(...places.map(p => p.id), 0) + 1,
    };
    setPlaces([...places, placeWithId]);
  };

  return (
    <PlacesContext.Provider value={{ places, addPlace }}>
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
