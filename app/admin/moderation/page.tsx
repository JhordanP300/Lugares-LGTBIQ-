'use client';

import React, { useState, useEffect } from 'react';
import { Comment, fetchAllComments, adminDeleteComment, fetchAllCommentsCount } from '@/app/lib/comments-db';
import { Photo, fetchAllPhotos, adminDeletePhoto, fetchUserPhotosCount } from '@/app/lib/media-db';
import { useAuth } from '@/app/context/AuthContext';
import { createNotification } from '@/app/lib/notifications-db';
import ContentTable from '@/app/components/admin/ContentTable';
import { Loader2, MessageSquare, Image, X } from 'lucide-react';

export default function ModerationPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'comments' | 'photos'>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsCount, setCommentsCount] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadComments = async () => {
    setLoading(true);
    const [data, count] = await Promise.all([
      fetchAllComments(100),
      fetchAllCommentsCount(),
    ]);
    setComments(data);
    setCommentsCount(count);
    setLoading(false);
  };

  const loadPhotos = async () => {
    setLoading(true);
    const [data, count] = await Promise.all([
      fetchAllPhotos(100),
      fetchUserPhotosCount(),
    ]);
    setPhotos(data);
    setPhotosCount(count);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'comments') {
      loadComments();
    } else {
      loadPhotos();
    }
  }, [activeTab]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDeleteComment = async (comment: Comment) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    setError(null);
    const success = await adminDeleteComment(comment.id);
    if (success) {
      if (comment.userId && profile && comment.userId !== profile.id) {
        await createNotification(
          comment.userId,
          'Comentario eliminado',
          `Tu comentario en un lugar fue eliminado por un administrador.`,
          'system'
        );
      }
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      setCommentsCount((prev) => prev - 1);
    } else {
      setError('Error al eliminar comentario');
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    setError(null);
    const success = await adminDeletePhoto(photo.id);
    if (success) {
      if (photo.userId && profile && photo.userId !== profile.id) {
        await createNotification(
          photo.userId,
          'Foto eliminada',
          `Tu foto fue eliminada por un administrador.`,
          'system'
        );
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setPhotosCount((prev) => prev - 1);
    } else {
      setError('Error al eliminar foto');
    }
  };

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
        Moderación de Contenido
      </h1>

      {/* Tabs */}
      <div className='flex gap-2 bg-gray-100 p-1 rounded-lg w-fit'>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'comments'
              ? 'bg-white text-[#189089] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare size={16} />
          Comentarios ({commentsCount})
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'photos'
              ? 'bg-white text-[#189089] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Image size={16} />
          Fotos ({photosCount})
        </button>
      </div>

      {error && (
        <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
          <span className='flex-1'>{error}</span>
          <button onClick={() => setError(null)} className='p-0.5 hover:bg-red-100 rounded'>
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='animate-spin text-[#189089]' size={40} />
        </div>
      ) : activeTab === 'comments' ? (
        <ContentTable
          type='comments'
          comments={comments}
          onDeleteComment={handleDeleteComment}
        />
      ) : (
        <ContentTable
          type='photos'
          photos={photos}
          onDeletePhoto={handleDeletePhoto}
        />
      )}
    </div>
  );
}
