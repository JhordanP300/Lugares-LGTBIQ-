'use client';

import React, { useState } from 'react';
import { Star, Send, Trash2 } from 'lucide-react';

interface CommentsProps {
  placeId: number;
}

interface Comment {
  id: number;
  author: string;
  text: string;
  rating: number;
  date: string;
}

export default function Comments({ placeId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: 'María',
      text: 'Excelente lugar, muy seguro y acogedor. El personal es muy atento.',
      rating: 5,
      date: '2024-05-10',
    },
    {
      id: 2,
      author: 'Carlos',
      text: 'Me siento muy cómodo aquí. Recomendado 100%',
      rating: 5,
      date: '2024-05-08',
    },
  ]);

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [authorName, setAuthorName] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !authorName.trim()) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const comment: Comment = {
      id: Math.max(...comments.map((c) => c.id), 0) + 1,
      author: authorName,
      text: newComment,
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setAuthorName('');
    setNewRating(5);
  };

  const handleDeleteComment = (id: number) => {
    setComments(comments.filter((c) => c.id !== id));
  };

  return (
    <div className='space-y-4'>
      {/* Formulario para agregar comentario */}
      <form onSubmit={handleAddComment} className='bg-purple-50 p-4 rounded-lg border-2 border-purple-200'>
        <div className='space-y-3'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Tu nombre</label>
            <input
              type='text'
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder='¿Cuál es tu nombre?'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
            />
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
              placeholder='Cuéntanos tu experiencia en este lugar...'
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none'
            />
          </div>

          <button
            type='submit'
            className='w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
          >
            <Send size={18} />
            Publicar comentario
          </button>
        </div>
      </form>

      {/* Lista de comentarios */}
      <div className='space-y-3'>
        <h3 className='font-bold text-gray-900'>Comentarios ({comments.length})</h3>
        {comments.length === 0 ? (
          <p className='text-gray-500 text-sm'>No hay comentarios aún. ¡Sé el primero en comentar!</p>
        ) : (
          comments.map((comment) => (
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
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className='text-gray-400 hover:text-red-600 transition-colors'
                  title='Eliminar comentario'
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className='text-gray-700 text-sm'>{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
