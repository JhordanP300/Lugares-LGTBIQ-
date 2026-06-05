'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import {
  PlaceRequest,
  fetchAllRequests,
  approveRequest,
  rejectRequest,
} from '@/app/lib/requests-db';
import { createNotification } from '@/app/lib/notifications-db';
import RequestCard from '@/app/components/admin/RequestCard';

export default function RequestsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PlaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    const data = await fetchAllRequests(filter);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests(true);
  }, [filter]);

  // Auto-refresh cada 15 segundos para ver nuevas solicitudes (sin loader)
  useEffect(() => {
    const interval = setInterval(() => loadRequests(false), 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const refreshCounts = async () => {
    const all = await fetchAllRequests('all');
    setAllRequests(all);
  };

  const handleApprove = async (requestId: string, notes: string) => {
    if (!profile) return;
    setProcessingId(requestId);
    const success = await approveRequest(requestId, profile.id, notes);
    if (success) {
      const request = requests.find((r) => r.id === requestId);
      if (request?.userId) {
        createNotification(
          request.userId,
          'Lugar aprobado',
          `Tu solicitud "${request.name}" fue aprobada y ya está visible en el mapa.${notes ? ` Notas: ${notes}` : ''}`,
          'place_approved',
          requestId
        ).catch(() => {});
      }
      await Promise.all([loadRequests(), refreshCounts()]);
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId: string, notes: string) => {
    if (!profile) return;
    setProcessingId(requestId);
    const success = await rejectRequest(requestId, profile.id, notes);
    if (success) {
      const request = requests.find((r) => r.id === requestId);
      if (request?.userId) {
        createNotification(
          request.userId,
          'Lugar no aprobado',
          `Tu solicitud "${request.name}" no fue aprobada.${notes ? ` Razón: ${notes}` : ''}`,
          'place_rejected',
          requestId
        ).catch(() => {});
      }
      await Promise.all([loadRequests(), refreshCounts()]);
    }
    setProcessingId(null);
  };

  const [allRequests, setAllRequests] = useState<PlaceRequest[]>([]);
  useEffect(() => {
    refreshCounts();
  }, []);

  return (
    <div className='space-y-6'>
      {/* Resumen rápido */}
      <div className='grid grid-cols-3 gap-3'>
        <button
          onClick={() => setFilter('pending')}
          className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
            filter === 'pending'
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            <Clock size={18} className='text-yellow-600' />
            <span className='text-2xl font-bold text-gray-900'>
              {allRequests.filter((r) => r.status === 'pending').length}
            </span>
          </div>
          <p className='text-xs text-gray-500 mt-1'>Pendientes</p>
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
            filter === 'approved'
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            <CheckCircle size={18} className='text-green-600' />
            <span className='text-2xl font-bold text-gray-900'>
              {allRequests.filter((r) => r.status === 'approved').length}
            </span>
          </div>
          <p className='text-xs text-gray-500 mt-1'>Aprobadas</p>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
            filter === 'rejected'
              ? 'border-red-400 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            <XCircle size={18} className='text-red-600' />
            <span className='text-2xl font-bold text-gray-900'>
              {allRequests.filter((r) => r.status === 'rejected').length}
            </span>
          </div>
          <p className='text-xs text-gray-500 mt-1'>Rechazadas</p>
        </button>
      </div>

      {/* Header con filtro */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
          Solicitudes de Lugares
        </h1>
        <div className='flex items-center gap-2'>
          <Filter size={16} className='text-gray-500' />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600'
          >
            <option value='all'>Todas</option>
            <option value='pending'>Pendientes</option>
            <option value='approved'>Aprobadas</option>
            <option value='rejected'>Rechazadas</option>
          </select>
        </div>
      </div>

      <p className='text-sm text-gray-500'>
        {requests.length} solicitud{requests.length !== 1 ? 'es' : ''} encontrada{requests.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='animate-spin text-purple-600' size={40} />
        </div>
      ) : requests.length === 0 ? (
        <div className='text-center py-20 bg-white rounded-xl border border-gray-100'>
          <CheckCircle size={48} className='mx-auto text-green-400 mb-3' />
          <p className='text-gray-500 text-lg'>
            {filter === 'pending'
              ? 'No hay solicitudes pendientes. ¡Todo al día!'
              : `No hay solicitudes ${filter !== 'all' ? `con estado "${filter}"` : ''}`}
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={processingId === request.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
