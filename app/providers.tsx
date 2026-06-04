'use client';

import { AuthProvider } from '@/app/context/AuthContext';
import { PlacesProvider } from '@/app/context/PlacesContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlacesProvider>
        {children}
      </PlacesProvider>
    </AuthProvider>
  );
}
