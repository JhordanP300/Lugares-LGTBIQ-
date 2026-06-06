'use client';

import React, { useState } from 'react';
import { PlaceRequest } from '@/app/lib/requests-db';
import {
  MapPin,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  Phone,
  Globe,
  Clock,
  ShieldCheck,
  Shield,
  X,
} from 'lucide-react';
import { categoryLabels } from '@/app/lib/places';

interface RequestCardProps {
  request: PlaceRequest;
  onApprove: (id: string, notes: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
  isProcessing: boolean;
}

export default function RequestCard({
  request,
  onApprove,
  onReject,
  isProcessing,
}: RequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };

  const handleConfirm = async () => {
    if (showModal === 'approve') {
      await onApprove(request.id, notes);
    } else if (showModal === 'reject') {
      await onReject(request.id, notes);
    }
    setShowModal(null);
    setNotes('');
  };

  const handleCloseModal = () => {
    setShowModal(null);
    setNotes('');
  };

  return (
    <>
      <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
        {/* Header */}
        <div className='p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    statusColors[request.status]
                  }`}
                >
                  {statusLabels[request.status]}
                </span>
                <span className='text-xs text-gray-500'>
                  {new Date(request.createdAt).toLocaleDateString('es-CO')}
                </span>
              </div>
              <h3 className='font-bold text-gray-900 truncate'>{request.name}</h3>
              <p className='text-sm text-gray-600'>
                {categoryLabels[request.category as keyof typeof categoryLabels] || request.category}
              </p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className='p-1 text-gray-400 hover:text-gray-600'
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {/* Info básica */}
          <div className='mt-3 space-y-1'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <MapPin size={14} className='flex-shrink-0' />
              <span className='truncate'>{request.address}</span>
            </div>
            {request.userName && (
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <User size={14} className='flex-shrink-0' />
                <span>Solicitado por: {request.userName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenido expandido */}
        {expanded && (
          <div className='px-4 pb-4 border-t border-gray-100 pt-4 space-y-4'>
            <div>
              <h4 className='text-sm font-semibold text-gray-700 mb-1'>Descripción</h4>
              <p className='text-sm text-gray-600'>{request.description}</p>
            </div>

            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <span className='text-gray-500'>Barrio:</span>
                <p className='font-medium text-gray-900'>{request.barrio}</p>
              </div>
              <div className='flex items-center gap-1'>
                <span className='text-gray-500'>Seguridad:</span>
                <div className='flex gap-0.5'>
                  {Array.from({ length: 5 }).map((_, i) =>
                    i < request.safetyRating ? (
                      <ShieldCheck
                        key={i}
                        size={14}
                        className='text-yellow-500'
                      />
                    ) : (
                      <Shield
                        key={i}
                        size={14}
                        className='text-gray-300'
                      />
                    )
                  )}
                </div>
              </div>
              {request.phone && (
                <div className='flex items-center gap-1'>
                  <Phone size={12} className='text-gray-400' />
                  <span className='font-medium text-gray-900'>{request.phone}</span>
                </div>
              )}
              {request.website && (
                <div className='flex items-center gap-1'>
                  <Globe size={12} className='text-gray-400' />
                  <span className='font-medium text-purple-600 truncate'>{request.website}</span>
                </div>
              )}
              {request.hours && (
                <div className='flex items-center gap-1'>
                  <Clock size={12} className='text-gray-400' />
                  <span className='font-medium text-gray-900'>{request.hours}</span>
                </div>
              )}
            </div>

            {request.accessibility.length > 0 && (
              <div>
                <span className='text-sm text-gray-500'>Accesibilidad:</span>
                <div className='flex flex-wrap gap-1 mt-1'>
                  {request.accessibility.map((item, i) => (
                    <span key={i} className='px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full'>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones para pendientes */}
            {request.status === 'pending' && (
              <div className='flex gap-2 pt-2'>
                <button
                  onClick={() => setShowModal('approve')}
                  disabled={isProcessing}
                  className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors'
                >
                  <CheckCircle size={16} />
                  Aprobar
                </button>
                <button
                  onClick={() => setShowModal('reject')}
                  disabled={isProcessing}
                  className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition-colors'
                >
                  <XCircle size={16} />
                  Rechazar
                </button>
              </div>
            )}

            {/* Notas del admin si ya fue revisada */}
            {request.adminNotes && (
              <div className='bg-gray-50 rounded-lg p-3'>
                <p className='text-xs text-gray-500 mb-1'>Notas del admin:</p>
                <p className='text-sm text-gray-700'>{request.adminNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de observaciones */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md shadow-2xl'>
            <div className={`p-6 rounded-t-2xl ${
              showModal === 'approve'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
            }`}>
              <div className='flex items-center justify-between'>
                <h3 className='text-white text-lg font-bold'>
                  {showModal === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                </h3>
                <button onClick={handleCloseModal} className='text-white/80 hover:text-white'>
                  <X size={20} />
                </button>
              </div>
              <p className='text-white/80 text-sm mt-1'>{request.name}</p>
            </div>

            <div className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  {showModal === 'approve'
                    ? 'Observaciones (opcional)'
                    : 'Razón del rechazo (recomendado)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    showModal === 'approve'
                      ? 'Ej: ¡Excelente lugar! Aprobado con gusto.'
                      : 'Ej: La dirección no corresponde a un lugar público.'
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none'
                />
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={handleCloseModal}
                  className='flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all ${
                    showModal === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className='animate-spin' size={18} />
                  ) : showModal === 'approve' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  {showModal === 'approve' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
