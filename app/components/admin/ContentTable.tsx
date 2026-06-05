'use client';

import React from 'react';
import { Comment } from '@/app/lib/comments-db';
import { Photo } from '@/app/lib/media-db';
import { Trash2, MessageSquare, Star, Image } from 'lucide-react';

interface ContentTableProps {
  type: 'comments' | 'photos';
  comments?: Comment[];
  photos?: Photo[];
  onDeleteComment?: (comment: Comment) => void;
  onDeletePhoto?: (photo: Photo) => void;
}

export default function ContentTable({
  type,
  comments = [],
  photos = [],
  onDeleteComment,
  onDeletePhoto,
}: ContentTableProps) {
  if (type === 'comments') {
    if (comments.length === 0) {
      return (
        <div className='text-center py-20 bg-white rounded-xl border border-gray-100'>
          <p className='text-gray-500 text-lg'>No hay comentarios</p>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
        {/* Desktop */}
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                  Autor
                </th>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                  Comentario
                </th>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                  Calificación
                </th>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                  Fecha
                </th>
                <th className='text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {comments.map((comment) => (
                <tr key={comment.id} className='hover:bg-gray-50'>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2'>
                      <MessageSquare size={14} className='text-gray-400' />
                      <span className='text-sm font-medium text-gray-900'>{comment.author}</span>
                    </div>
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-600 max-w-[300px] truncate'>
                    {comment.text}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-0.5'>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-500'>
                    {new Date(comment.date).toLocaleDateString('es-CO')}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button
                      onClick={() => onDeleteComment?.(comment)}
                      className='p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      title='Eliminar'
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className='md:hidden divide-y divide-gray-100'>
          {comments.map((comment) => (
            <div key={comment.id} className='p-4 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-gray-900 text-sm'>{comment.author}</span>
                <button
                  onClick={() => onDeleteComment?.(comment)}
                  className='p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className='text-sm text-gray-600 line-clamp-2'>{comment.text}</p>
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <div className='flex gap-0.5'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span>{new Date(comment.date).toLocaleDateString('es-CO')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Photos
  if (photos.length === 0) {
    return (
      <div className='text-center py-20 bg-white rounded-xl border border-gray-100'>
        <p className='text-gray-500 text-lg'>No hay fotos</p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4'>
        {photos.map((photo) => (
          <div key={photo.id} className='relative group rounded-lg overflow-hidden bg-gray-100'>
            <img
              src={photo.url}
              alt={photo.author || 'Foto'}
              className='w-full h-40 object-cover'
            />
            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors'>
              <button
                onClick={() => onDeletePhoto?.(photo)}
                className='absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className='p-2'>
              <p className='text-xs text-gray-600 truncate'>{photo.author || 'Anónimo'}</p>
              <p className='text-xs text-gray-400'>
                {new Date(photo.date).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
