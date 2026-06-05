'use client';

import { AuthProvider } from '@/app/context/AuthContext';
import { PlacesProvider } from '@/app/context/PlacesContext';
import { NotificationsProvider } from '@/app/context/NotificationsContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlacesProvider>
        <NotificationsProvider>
          {children}
        </NotificationsProvider>
      </PlacesProvider>
    </AuthProvider>
  );
}
