'use client';

import React, { useState, useEffect } from 'react';
import { Place, categoryLabels } from '@/app/lib/places';
import { X, Phone, Globe, Clock, MapPin, ShieldCheck, Shield, Heart, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchPhotos, Photo } from '@/app/lib/media-db';
import Comments from './Comments';
import Toast from './Toast';
import { useFavorites } from '@/app/hooks/useFavorites';

interface PlaceModalProps {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
}

function getSocialIcon(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes('instagram')) return <span className='text-pink-500 font-bold text-sm'>IG</span>;
  if (lower.includes('facebook') || lower.includes('fb.com')) return <span className='text-blue-600 font-bold text-sm'>fb</span>;
  if (lower.includes('tiktok')) return <span className='text-sm'>🎵</span>;
  if (lower.includes('twitter') || lower.includes('x.com')) return <span className='text-sm font-bold'>𝕏</span>;
  if (lower.includes('youtube')) return <span className='text-sm'>▶️</span>;
  if (lower.includes('wa.me') || lower.includes('whatsapp')) return <span className='text-sm'>💬</span>;
  return <Globe size={18} className='text-purple-600' />;
}

function getSocialName(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('facebook') || lower.includes('fb.com')) return 'Facebook';
  if (lower.includes('tiktok')) return 'TikTok';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter / X';
  if (lower.includes('youtube')) return 'YouTube';
  if (lower.includes('wa.me') || lower.includes('whatsapp')) return 'WhatsApp';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Enlace';
  }
}

export default function PlaceModal({ place, isOpen, onClose }: PlaceModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'comments'>('info');
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  
  useEffect(() => {
    if (isOpen && place.id) {
      setLoadingPhotos(true);
      fetchPhotos(place.id).then((data) => {
        setPhotos(data);
        setLoadingPhotos(false);
      });
    }
  }, [isOpen, place.id]);
  
  if (!isOpen) return null;

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/${place.coordinates[0]},${place.coordinates[1]}`;
    window.open(url, '_blank');
  };

  const getRainbowGradient = () => {
    return 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500';
  };

  const hasSocialLinks = place.socialLinks && place.socialLinks.length > 0;

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 modal-backdrop'>
      <div
        className='bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl animate-in overflow-hidden'
        style={{ maxHeight: 'min(95vh, 95dvh)' }}
      >
        {/* Header con degradado arcoíris */}
        <div className={`flex-shrink-0 ${getRainbowGradient()} p-6 rounded-t-2xl sm:rounded-t-2xl relative`}>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 z-10 bg-white/30 hover:bg-white/50 rounded-full p-2 transition-colors shadow-lg'
            aria-label='Cerrar'
            title='Cerrar'
          >
            <X size={24} className='text-white' />
          </button>
          
          <div className='flex items-start justify-between pr-12'>
            <div className='flex-1'>
              <p className='text-white/90 text-sm mb-2'>{categoryLabels[place.category]}</p>
              <h2 className='text-white text-xl sm:text-2xl font-bold'>{place.name}</h2>
              <p className='text-white/90 text-sm mt-2'>{place.barrio}</p>
            </div>
            <button
              onClick={() => {
                const wasFavorite = isFavorite(place.id);
                toggleFavorite(place);
                setToastMessage(wasFavorite ? '💔 Removido de favoritos' : '❤️ Agregado a favoritos');
                setShowFavoriteToast(true);
              }}
              className='flex-shrink-0 ml-2 bg-white/30 hover:bg-white/50 rounded-full p-2 transition-colors shadow-lg'
              aria-label={isFavorite(place.id) ? 'Remover de favoritos' : 'Agregar a favoritos'}
              title={isFavorite(place.id) ? 'Remover de favoritos' : 'Agregar a favoritos'}
            >
              <Heart
                size={24}
                className={isFavorite(place.id) ? 'fill-white text-white' : 'text-white'}
              />
            </button>
          </div>

          {/* Rating de seguridad */}
          <div className='mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-2 rounded-full'>
            <span className='text-white font-semibold text-sm'>Seguridad:</span>
            <div className='flex gap-0.5'>
              {Array.from({ length: 5 }).map((_, i) =>
                i < place.safetyRating ? (
                  <ShieldCheck key={i} size={16} className='text-yellow-300 drop-shadow-sm' />
                ) : (
                  <Shield key={i} size={16} className='text-white/30' />
                )
              )}
            </div>
            <span className='text-white/80 text-xs ml-1'>{place.safetyRating}/5</span>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex-shrink-0 flex border-b bg-white'>
          {(['info', 'comments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'info' && 'Información'}
              {tab === 'comments' && 'Comentarios'}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className='overflow-y-auto flex-1 p-4 sm:p-6'>
          {activeTab === 'info' && (
            <div className='space-y-5'>
              {/* Descripción */}
              <div>
                <h3 className='font-bold text-gray-900 mb-2'>Descripción</h3>
                <p className='text-gray-700'>{place.description}</p>
              </div>

              {/* Fotos */}
              {loadingPhotos ? (
                <div className='flex items-center justify-center py-6'>
                  <div className='w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin' />
                </div>
              ) : photos.length > 0 ? (
                <div>
                  <h3 className='font-bold text-gray-900 mb-3'>📸 Fotos</h3>
                  <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhoto(index)}
                        className='relative aspect-square rounded-lg overflow-hidden group cursor-pointer'
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={`Foto por ${photo.author}`}
                          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                        />
                        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors' />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Información de contacto */}
              <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                <div className='flex items-center gap-3'>
                  <MapPin size={18} className='text-purple-600 flex-shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600'>Dirección</p>
                    <p className='font-semibold text-gray-900'>{place.address}</p>
                  </div>
                </div>

                {place.phone && (
                  <div className='flex items-center gap-3'>
                    <Phone size={18} className='text-purple-600 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600'>Teléfono</p>
                      <a
                        href={`tel:${place.phone}`}
                        className='font-semibold text-purple-600 hover:text-purple-700'
                      >
                        {place.phone}
                      </a>
                    </div>
                  </div>
                )}

                {place.website && (
                  <div className='flex items-center gap-3'>
                    <Globe size={18} className='text-purple-600 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600'>Website</p>
                      <a
                        href={place.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-semibold text-purple-600 hover:text-purple-700'
                      >
                        {place.website}
                      </a>
                    </div>
                  </div>
                )}

                {place.hours && (
                  <div className='flex items-center gap-3'>
                    <Clock size={18} className='text-purple-600 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600'>Horario</p>
                      <p className='font-semibold text-gray-900'>{place.hours}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Redes Sociales */}
              {hasSocialLinks && (
                <div>
                  <h3 className='font-bold text-gray-900 mb-3'>📱 Redes Sociales</h3>
                  <div className='flex flex-wrap gap-2'>
                    {place.socialLinks!.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group'
                      >
                        {getSocialIcon(link)}
                        <span className='text-sm font-medium text-gray-700 group-hover:text-purple-700'>
                          {getSocialName(link)}
                        </span>
                        <ExternalLink size={12} className='text-gray-400 group-hover:text-purple-500' />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Accesibilidad */}
              {place.accessibility.length > 0 && (
                <div>
                  <h3 className='font-bold text-gray-900 mb-2'>♿ Accesibilidad</h3>
                  <ul className='space-y-1'>
                    {place.accessibility.map((item, i) => (
                      <li key={i} className='flex items-center gap-2 text-gray-700'>
                        <span className='text-green-600'>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botón para ir */}
              <button
                onClick={openGoogleMaps}
                className='w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow'
              >
                📍 Cómo llegar
              </button>
            </div>
          )}

          {activeTab === 'comments' && <Comments placeId={place.id} />}
        </div>
      </div>

      {/* Modal de foto expandida */}
      {selectedPhoto !== null && photos[selectedPhoto] && (
        <div
          className='fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4'
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className='absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 z-10'
          >
            <X size={24} className='text-white' />
          </button>

          {/* Navegación */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto((prev) => (prev! - 1 + photos.length) % photos.length);
                }}
                className='absolute left-4 bg-white/20 hover:bg-white/30 rounded-full p-3 z-10'
              >
                <ChevronLeft size={24} className='text-white' />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto((prev) => (prev! + 1) % photos.length);
                }}
                className='absolute right-4 bg-white/20 hover:bg-white/30 rounded-full p-3 z-10'
              >
                <ChevronRight size={24} className='text-white' />
              </button>
            </>
          )}

          <div
            className='relative max-w-4xl max-h-[90vh]'
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[selectedPhoto].url}
              alt={`Por ${photos[selectedPhoto].author}`}
              className='max-h-[80vh] object-contain rounded-lg'
            />
            <div className='bg-gray-900 text-white p-3 rounded-b-lg'>
              <p className='font-semibold text-sm'>{photos[selectedPhoto].author}</p>
              <p className='text-xs text-gray-400'>{photos[selectedPhoto].date}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {showFavoriteToast && (
        <Toast
          message={toastMessage}
          type='success'
          duration={3000}
          onClose={() => setShowFavoriteToast(false)}
        />
      )}
    </div>
  );
}
