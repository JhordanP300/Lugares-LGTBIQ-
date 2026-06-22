'use client';

import React from 'react';
import { categoryLabels } from '@/app/lib/places';

interface StatsChartsProps {
  placesByCategory: Record<string, number>;
  userStats: {
    total: number;
    admins: number;
    users: number;
  };
}

export default function StatsCharts({ placesByCategory, userStats }: StatsChartsProps) {
  const maxPlaces = Math.max(...Object.values(placesByCategory), 1);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {/* Lugares por categoría */}
      <div className='bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100'>
        <h3 className='text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4'>Lugares por Categoría</h3>
        <div className='space-y-3'>
          {Object.entries(placesByCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => {
              const label =
                categoryLabels[category as keyof typeof categoryLabels] || category;
              const percentage = (count / maxPlaces) * 100;
              return (
                <div key={category}>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-700'>{label}</span>
                    <span className='font-semibold text-gray-900'>{count}</span>
                  </div>
                  <div className='w-full h-3 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-[#189089] to-[#c42e89] rounded-full transition-all duration-500'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          {Object.keys(placesByCategory).length === 0 && (
            <p className='text-gray-500 text-sm text-center py-4'>No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Distribución de usuarios */}
      <div className='bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100'>
        <h3 className='text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4'>Distribución de Usuarios</h3>
        <div className='space-y-2 md:space-y-4'>
          <div className='flex items-center justify-between p-2 md:p-3 bg-[#189089]/10 rounded-lg'>
            <div className='flex items-center gap-3'>
              <div className='w-4 h-4 rounded-full bg-[#189089]' />
              <span className='text-sm font-medium text-gray-700'>Administradores</span>
            </div>
            <span className='text-lg md:text-xl font-bold text-[#189089]'>{userStats.admins}</span>
          </div>
          <div className='flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center gap-3'>
              <div className='w-4 h-4 rounded-full bg-gray-400' />
              <span className='text-sm font-medium text-gray-700'>Usuarios</span>
            </div>
            <span className='text-lg md:text-xl font-bold text-gray-600'>{userStats.users}</span>
          </div>
          <div className='pt-2 md:pt-3 border-t border-gray-100 text-center'>
            <p className='text-xs md:text-sm text-gray-500'>Total registrados</p>
            <p className='text-xl md:text-2xl font-bold text-gray-900'>{userStats.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
