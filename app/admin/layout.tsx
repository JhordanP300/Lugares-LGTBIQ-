'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { fetchAllRequests } from '@/app/lib/requests-db';
import {
  LayoutDashboard,
  FileText,
  Users,
  MapPin,
  Shield,
  ArrowLeft,
  Menu,
  X,
  Loader2,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Solicitudes', icon: FileText, showBadge: true },
  { href: '/admin/places', label: 'Lugares', icon: MapPin },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/moderation', label: 'Moderación', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!profile || profile.role !== 'admin') {
        router.push('/');
      } else {
        setAuthorized(true);
      }
    }
  }, [profile, loading, router]);

  // Cargar solicitudes pendientes
  const loadPendingCount = async () => {
    const all = await fetchAllRequests('all');
    setPendingCount(all.filter((r) => r.status === 'pending').length);
  };

  useEffect(() => {
    if (authorized) {
      loadPendingCount();
      const interval = setInterval(loadPendingCount, 15000);
      return () => clearInterval(interval);
    }
  }, [authorized]);

  if (loading || !authorized) {
    return (
      <div className='w-full h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='animate-spin text-purple-600 mx-auto' size={40} />
          <p className='mt-4 text-gray-600'>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen bg-gray-50 flex overflow-hidden'>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className='flex items-center justify-between p-4 border-b'>
          <Link href='/' className='flex items-center gap-2 text-purple-600 font-bold text-lg'>
            <ArrowLeft size={20} />
            Volver al mapa
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className='md:hidden p-1 text-gray-500 hover:text-gray-700'
          >
            <X size={20} />
          </button>
        </div>

        <div className='p-4 border-b bg-purple-50'>
          <div className='flex items-center gap-2'>
            <div className='w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold'>
              {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className='font-semibold text-gray-900 text-sm'>{profile?.name}</p>
              <p className='text-xs text-purple-600 font-medium'>Administrador</p>
            </div>
          </div>
        </div>

        <nav className='p-4 space-y-1'>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const showBadge = item.showBadge && pendingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} />
                <span className='flex-1'>{item.label}</span>
                {showBadge && (
                  <span className='bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center'>
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/30 md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className='flex-1 md:ml-64 h-screen overflow-y-auto'>
        {/* Header mobile */}
        <header className='sticky top-0 z-30 bg-white shadow-sm px-4 py-3 flex items-center gap-4 md:hidden'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='p-2 text-gray-600 hover:text-gray-900'
          >
            <Menu size={24} />
          </button>
          <h1 className='font-bold text-gray-900'>Panel de Admin</h1>
        </header>

        {/* Header desktop */}
        <header className='hidden md:flex sticky top-0 z-30 bg-white shadow-sm px-6 py-3 items-center justify-between'>
          <div />
        </header>

        <main className='p-4 md:p-8 max-w-7xl mx-auto'>{children}</main>
      </div>
    </div>
  );
}
