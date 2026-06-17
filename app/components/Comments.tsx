'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, Send, Trash2, User, Upload, X, Video, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { fetchComments, insertComment, deleteComment, Comment } from '@/app/lib/comments-db';
import { fetchUserPhotos, insertPhoto, uploadFile, deletePhoto, Photo } from '@/app/lib/media-db';

interface CommentsProps {
  placeId: string;
}

export default function Comments({ placeId }: CommentsProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const getAuthorName = (): string => {
    if (profile?.name) return profile.name;
    if (user?.email) return user.email.split('@')[0];
    return '';
  };

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      const [c, p] = await Promise.all([
        fetchComments(placeId),
        fetchUserPhotos(placeId),
      ]);
      setComments(c);
      setPhotos(p);
      setLoadingData(false);
    }
    load();
  }, [placeId]);

  const handleAddComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      alert('Por favor, escribe tu comentario');
      return;
    }

    const authorName = getAuthorName();
    if (!authorName) {
      alert('Debes iniciar sesión para comentar');
      return;
    }

    const created = await insertComment(
      placeId,
      authorName,
      user?.id ?? null,
      newComment,
      newRating
    );

    if (created) {
      setComments(prev => [created, ...prev]);
      setNewComment('');
      setNewRating(5);
    } else {
      alert('Error al guardar el comentario. Intenta de nuevo.');
    }
  }, [newComment, newRating, placeId, user, profile]);

  const handleDeleteComment = useCallback(async (id: string) => {
    if (!user?.id) return;
    const ok = await deleteComment(id, user.id);
    if (ok) {
      setComments(prev => prev.filter(c => c.id !== id));
    }
  }, [user]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`El archivo es demasiado grande. Máximo ${file.type.startsWith('video/') ? '50MB' : '10MB'}`);
      return;
    }

    setUploading(true);

    const uploadResult = await uploadFile(file, placeId, user.id);
    if (!uploadResult) {
      alert('Error al subir el archivo. Intenta de nuevo.');
      setUploading(false);
      return;
    }

    const created = await insertPhoto(
      placeId,
      uploadResult.url,
      uploadResult.thumbnailUrl,
      getAuthorName(),
      user.id,
      'user'
    );

    if (created) {
      setPhotos(prev => [created, ...prev]);
    }
    setUploading(false);
    e.target.value = '';
  }, [placeId, user, profile]);

  const handleDeletePhoto = useCallback(async (id: string) => {
    if (!user?.id) return;
    const ok = await deletePhoto(id, user.id);
    if (ok) {
      setPhotos(prev => prev.filter(p => p.id !== id));
    }
  }, [user]);

  const authorName = getAuthorName();

  return (
    <div className='space-y-6'>
      {/* Sección de Comentarios */}
      <div>
        <h3 className='font-bold text-gray-900 mb-3'>Deja tu comentario</h3>
        <form onSubmit={handleAddComment} className='bg-purple-50 p-3 sm:p-4 rounded-lg border-2 border-purple-200'>
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Comentar como</label>
              {user ? (
                <div className='flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg'>
                  <div className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center'>
                    <User size={16} className='text-purple-600' />
                  </div>
                  <span className='text-sm font-medium text-gray-900'>{authorName}</span>
                </div>
              ) : (
                <p className='text-sm text-gray-500 px-3 py-2 bg-gray-100 rounded-lg'>
                  Inicia sesión para dejar tu comentario
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Calificación</label>
              <div className='flex gap-2'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => setNewRating(star)}
                    className='transition-transform hover:scale-110'
                  >
                    <Star
                      size={24}
                      className={star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Tu comentario</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? 'Cuéntanos tu experiencia en este lugar...' : 'Inicia sesión para comentar'}
                rows={3}
                disabled={!user}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
            </div>

            <button
              type='submit'
              disabled={!user || !newComment.trim()}
              className='w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Send size={18} />
              Publicar comentario
            </button>
          </div>
        </form>
      </div>

      {/* Sección de Fotos y Videos */}
      <div>
        <h3 className='font-bold text-gray-900 mb-3'>Fotos y Videos</h3>

        {user && (
          <div className='mb-4'>
            <label className='block'>
              <input
                type='file'
                accept='image/*,video/*'
                onChange={handleFileUpload}
                disabled={uploading}
                className='hidden'
              />
              <span className='flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold cursor-pointer hover:shadow-lg transition-shadow disabled:opacity-50'>
                <Upload size={18} />
                {uploading ? 'Subiendo a Storage...' : 'Subir foto o video'}
              </span>
            </label>
            <p className='text-xs text-gray-500 mt-2 text-center'>
              Imágenes: máximo 10MB | Videos: máximo 50MB
            </p>
          </div>
        )}

        {loadingData ? (
          <p className='text-gray-500 text-sm text-center py-4'>Cargando...</p>
        ) : photos.length === 0 ? (
          <p className='text-gray-500 text-sm text-center py-4'>
            No hay fotos o videos aún. ¡Sé el primero en compartir!
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {photos.map((item) => (
              <div
                key={item.id}
                className='relative group cursor-pointer overflow-hidden rounded-lg aspect-square'
                onClick={() => setSelectedPhoto(item)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Por ${item.author}`}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                />

                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center'>
                  {user && user.id === item.userId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(item.id);
                      }}
                      className='opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full transition-opacity'
                      title='Eliminar'
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2'>
                  <p className='text-white text-xs font-semibold'>{item.author}</p>
                  <p className='text-white/80 text-xs'>{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de comentarios */}
      <div>
        <h3 className='font-bold text-gray-900 mb-3'>Comentarios ({comments.length})</h3>
        {loadingData ? (
          <p className='text-gray-500 text-sm'>Cargando...</p>
        ) : comments.length === 0 ? (
          <p className='text-gray-500 text-sm'>No hay comentarios aún. ¡Sé el primero en comentar!</p>
        ) : (
          <div className='space-y-3'>
            {comments.map((comment) => (
              <div key={comment.id} className='bg-gray-50 p-3 rounded-lg'>
                <div className='flex justify-between items-start mb-2'>
                  <div>
                    <p className='font-semibold text-gray-900'>{comment.author}</p>
                    <div className='flex items-center gap-2 mt-1'>
                      <div className='flex gap-1'>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <span className='text-xs text-gray-500'>{comment.date}</span>
                    </div>
                  </div>
                  {user && user.id === comment.userId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className='text-gray-400 hover:text-red-600 transition-colors'
                      title='Eliminar comentario'
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className='text-gray-700 text-sm'>{comment.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de foto expandida */}
      {selectedPhoto && (
        <div
          className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4'
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className='relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className='absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 z-10'
            >
              <X size={24} className='text-white' />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.url}
              alt={`Por ${selectedPhoto.author}`}
              className='w-full max-h-[70vh] object-contain'
            />

            <div className='bg-gray-900 text-white p-4'>
              <p className='font-semibold'>{selectedPhoto.author}</p>
              <p className='text-sm text-gray-300'>{selectedPhoto.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
