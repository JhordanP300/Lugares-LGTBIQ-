'use client';

import React, { useState } from 'react';
import { Upload, Trash2, X } from 'lucide-react';

interface PhotoGalleryProps {
  placeId: number;
}

interface Photo {
  id: number;
  url: string;
  author: string;
  date: string;
}

export default function PhotoGallery({ placeId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&h=400',
      author: 'Laura',
      date: '2024-05-12',
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1491841573634-28140f7ced15?w=500&h=400',
      author: 'Juan',
      date: '2024-05-10',
    },
  ]);

  const [uploading, setUploading] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !authorName.trim()) {
      alert('Por favor, ingresa tu nombre antes de subir una foto');
      return;
    }

    setUploading(true);

    // Simular carga de archivo
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhoto: Photo = {
          id: Math.max(...photos.map((p) => p.id), 0) + 1,
          url: event.target?.result as string,
          author: authorName,
          date: new Date().toISOString().split('T')[0],
        };
        setPhotos([newPhoto, ...photos]);
        setAuthorName('');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  const handleDeletePhoto = (id: number) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  return (
    <div className='space-y-4'>
      {/* Formulario de carga */}
      <div className='bg-purple-50 p-4 rounded-lg border-2 border-purple-200'>
        <h3 className='font-bold text-gray-900 mb-3'>Compartir tu foto</h3>
        <div className='space-y-3'>
          <input
            type='text'
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder='Tu nombre'
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
          />

          <label className='block'>
            <input
              type='file'
              accept='image/*'
              onChange={handleFileUpload}
              disabled={uploading}
              className='hidden'
            />
            <span className='flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold cursor-pointer hover:shadow-lg transition-shadow disabled:opacity-50'>
              <Upload size={18} />
              {uploading ? 'Subiendo...' : 'Subir foto'}
            </span>
          </label>
        </div>
      </div>

      {/* Galería de fotos */}
      <div>
        <h3 className='font-bold text-gray-900 mb-3'>Fotos de la comunidad ({photos.length})</h3>
        {photos.length === 0 ? (
          <p className='text-gray-500 text-sm'>No hay fotos aún. ¡Sé el primero en compartir!</p>
        ) : (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {photos.map((photo) => (
              <div
                key={photo.id}
                className='relative group cursor-pointer overflow-hidden rounded-lg aspect-square'
                onClick={() => setSelectedImage(photo)}
              >
                <img
                  src={photo.url}
                  alt={`Foto por ${photo.author}`}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                />
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    className='opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full transition-opacity'
                    title='Eliminar foto'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2'>
                  <p className='text-white text-xs font-semibold'>{photo.author}</p>
                  <p className='text-white/80 text-xs'>{photo.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de foto expandida */}
      {selectedImage && (
        <div
          className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4'
          onClick={() => setSelectedImage(null)}
        >
          <div
            className='relative max-w-2xl max-h-[80vh] bg-white rounded-lg overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className='absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 z-10'
            >
              <X size={24} className='text-white' />
            </button>
            <img
              src={selectedImage.url}
              alt={`Foto por ${selectedImage.author}`}
              className='w-full h-full object-contain'
            />
            <div className='bg-gray-900 text-white p-4'>
              <p className='font-semibold'>{selectedImage.author}</p>
              <p className='text-sm text-gray-300'>{selectedImage.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
