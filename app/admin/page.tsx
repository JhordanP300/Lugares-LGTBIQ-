'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  FileText,
  Users,
  MessageSquare,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { fetchPlacesStats } from '@/app/lib/places-db';
import { getRequestStats } from '@/app/lib/requests-db';
import { getUserStats } from '@/app/lib/users-db';
import { fetchAllCommentsCount } from '@/app/lib/comments-db';
import { fetchAllPhotosCount } from '@/app/lib/media-db';
import StatsCharts from '@/app/components/admin/StatsCharts';

interface Stats {
  places: { total: number; byCategory: Record<string, number> };
  requests: { total: number; pending: number; approved: number; rejected: number };
  users: { total: number; admins: number; users: number };
  comments: number;
  photos: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const [places, requests, users, comments, photos] = await Promise.all([
        fetchPlacesStats(),
        getRequestStats(),
        getUserStats(),
        fetchAllCommentsCount(),
        fetchAllPhotosCount(),
      ]);
      setStats({ places, requests, users, comments, photos });
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='animate-spin text-purple-600' size={40} />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Lugares Aprobados',
      value: stats.places.total,
      icon: MapPin,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Solicitudes Pendientes',
      value: stats.requests.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Solicitudes Aprobadas',
      value: stats.requests.approved,
      icon: CheckCircle,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Solicitudes Rechazadas',
      value: stats.requests.rejected,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Usuarios Totales',
      value: stats.users.total,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Comentarios',
      value: stats.comments,
      icon: MessageSquare,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
    },
    {
      label: 'Fotos',
      value: stats.photos,
      icon: Heart,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
          Dashboard de Administración
        </h1>
        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <TrendingUp size={16} />
          <span>Resumen general</span>
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'>
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bgColor} rounded-xl p-4 md:p-5 border border-gray-100`}
          >
            <div className='flex items-center gap-3'>
              <div className={`${card.color} p-2 rounded-lg text-white`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className='text-2xl md:text-3xl font-bold text-gray-900'>
                  {card.value}
                </p>
                <p className='text-xs md:text-sm text-gray-600'>{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de solicitudes */}
      <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
        <h2 className='text-lg font-bold text-gray-900 mb-4'>Resumen de Solicitudes</h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'>
          <div className='flex-1 text-center p-4 bg-gray-50 rounded-lg'>
            <p className='text-3xl font-bold text-gray-900'>{stats.requests.total}</p>
            <p className='text-sm text-gray-600'>Total</p>
          </div>
          <div className='flex-1 text-center p-4 bg-yellow-50 rounded-lg'>
            <p className='text-3xl font-bold text-yellow-600'>{stats.requests.pending}</p>
            <p className='text-sm text-gray-600'>Pendientes</p>
          </div>
          <div className='flex-1 text-center p-4 bg-green-50 rounded-lg'>
            <p className='text-3xl font-bold text-green-600'>{stats.requests.approved}</p>
            <p className='text-sm text-gray-600'>Aprobadas</p>
          </div>
          <div className='flex-1 text-center p-4 bg-red-50 rounded-lg'>
            <p className='text-3xl font-bold text-red-600'>{stats.requests.rejected}</p>
            <p className='text-sm text-gray-600'>Rechazadas</p>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <StatsCharts
        placesByCategory={stats.places.byCategory}
        userStats={stats.users}
      />
    </div>
  );
}
