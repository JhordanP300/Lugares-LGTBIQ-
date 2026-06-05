'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotifications } from '@/app/context/NotificationsContext';
import { useRouter } from 'next/navigation';

interface NotificationBellProps {
  pendingCount?: number;
}

export default function NotificationBell({ pendingCount = 0 }: NotificationBellProps) {
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [btnPos, setBtnPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const badgeCount = unreadCount + pendingCount;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.read) {
        markRead(id);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inWrapper && !inDropdown) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setBtnPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
      refresh();
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={wrapperRef} className='relative'>
      <button
        onClick={handleToggle}
        className='relative p-2 rounded-lg hover:bg-gray-100 transition-colors'
      >
        <Bell size={20} className='text-gray-600' />
        {badgeCount > 0 && (
          <span className='absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center'>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {mounted && createPortal(
        open ? (
          <div
            ref={dropdownRef}
            className='fixed w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden'
            style={{ top: btnPos.top, left: btnPos.left, zIndex: 99999 }}
          >
            <div className='px-4 py-3 border-b border-gray-100 bg-gray-50'>
              <span className='text-sm font-semibold text-gray-800'>Notificaciones</span>
            </div>

            <div className='max-h-80 overflow-y-auto'>
              {pendingCount > 0 && (
                <div className='p-3 border-b border-gray-100 bg-yellow-50'>
                  <p className='text-sm text-yellow-800 font-medium mb-2'>
                    {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push('/admin/requests');
                    }}
                    className='w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg text-sm transition-colors'
                  >
                    Revisar solicitudes
                  </button>
                </div>
              )}

              {notifications.length === 0 && pendingCount === 0 ? (
                <div className='p-8 text-center text-gray-400 text-sm'>
                  Sin notificaciones
                </div>
              ) : notifications.length === 0 && pendingCount > 0 ? (
                <div className='p-4 text-center text-gray-400 text-sm'>
                  No tienes notificaciones nuevas
                </div>
              ) : (
                notifications.map((notif) => {
                  const isExpanded = expandedId === notif.id;
                  return (
                  <div
                    key={notif.id}
                    onClick={() => toggleExpand(notif.id)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.read && !isExpanded ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notif.type === 'place_approved'
                            ? 'bg-green-500'
                            : notif.type === 'place_rejected'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='text-sm font-medium text-gray-800 leading-snug'>
                            {notif.title}
                          </p>
                          {isExpanded ? (
                            <ChevronUp size={14} className='text-gray-400 flex-shrink-0' />
                          ) : (
                            <ChevronDown size={14} className='text-gray-400 flex-shrink-0' />
                          )}
                        </div>
                        {isExpanded ? (
                          <div className='mt-1.5 space-y-2'>
                            <p className='text-sm text-gray-600 whitespace-pre-wrap break-words leading-relaxed'>
                              {notif.message}
                            </p>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                notif.type === 'place_approved'
                                  ? 'bg-green-100 text-green-700'
                                  : notif.type === 'place_rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {notif.type === 'place_approved'
                                ? 'Aprobado'
                                : notif.type === 'place_rejected'
                                ? 'Rechazado'
                                : 'Sistema'}
                            </span>
                          </div>
                        ) : (
                          <p className='text-xs text-gray-500 mt-0.5 line-clamp-2'>
                            {notif.message}
                          </p>
                        )}
                        <p className='text-[11px] text-gray-400 mt-1'>
                          {new Date(notif.createdAt).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null,
        document.body
      )}
    </div>
  );
}
