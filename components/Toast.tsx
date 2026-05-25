'use client';

import React, { useEffect, useState } from 'react';
import { Heart, X, AlertCircle, CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

/**
 * Componente Toast - Notificación flotante
 * 
 * Propósito: Mostrar mensajes breves al usuario sin interrumpir su flujo
 * (ej: "Agregado a favoritos", errores, confirmaciones)
 * 
 * Props:
 * - message: Texto del mensaje a mostrar
 * - type: 'success' (verde), 'error' (rojo), 'info' (azul) - default: 'success'
 * - duration: Milisegundos antes de desaparecer - default: 3000 (3 segundos)
 * - onClose: Callback cuando se cierra el toast
 */
export default function Toast({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-desaparece después del tiempo especificado
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  // Estilos según el tipo de notificación
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
        };
    }
  };

  const styles = getStyles();

  // Icono según el tipo
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className={styles.icon} />;
      case 'error':
        return <AlertCircle size={20} className={styles.icon} />;
      case 'info':
        return <Heart size={20} className={styles.icon} />;
    }
  };

  return (
    <div
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] max-w-sm 
        ${styles.bg} border ${styles.border} rounded-lg p-4 shadow-lg
        animate-in fade-in slide-in-from-bottom-2 duration-300
      `}
    >
      <div className='flex items-center gap-3'>
        {/* Icono según el tipo */}
        <div className='flex-shrink-0'>
          {getIcon()}
        </div>

        {/* Mensaje */}
        <p className={`text-sm font-medium ${styles.text}`}>
          {message}
        </p>

        {/* Botón cerrar (opcional) */}
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className={`flex-shrink-0 ml-auto ${styles.icon} hover:opacity-75 transition-opacity`}
          aria-label='Cerrar notificación'
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
