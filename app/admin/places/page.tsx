'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Place, categoryLabels } from '@/app/lib/places';
import { fetchAllPlaces, adminUpdatePlace, deletePlace } from '@/app/lib/places-db';
import { cargarBarrios, Barrio } from '@/app/lib/barrios';
import { useAuth } from '@/app/context/AuthContext';
import { createNotification } from '@/app/lib/notifications-db';
import { fetchAdminPhotos, uploadFile, insertPhoto, adminDeletePhoto, Photo } from '@/app/lib/media-db';
import { MapPin, Edit2, Trash2, Loader2, X, ShieldCheck, Shield, Save, Plus, Upload } from 'lucide-react';

type PlaceWithMeta = Place & { createdBy: string | null; createdAt: string };

const categories = [
  { value: 'cafe', label: '☕ Café' },
  { value: 'bar', label: '🍹 Bar' },
  { value: 'lugar', label: '📍 Lugar Emblemático' },
  { value: 'lugarSimbolico', label: '🏳️‍🌈 Lugar Simbólico' },
  { value: 'parque', label: '🌳 Parque' },
  { value: 'culturalCenter', label: '🎨 Centro Cultural' },
  { value: 'health', label: '⚕️ Salud' },
];

const accessibilityOptions = [
  'Acceso en silla de ruedas',
  'Baños adaptados',
  'Estacionamiento',
  'Ascensor',
  'Baños inclusivos',
  'Señalización accesible',
  'Personal capacitado',
  'WiFi gratis',
  'Intérpretes disponibles',
  'Menú en braille',
];

export default function AdminPlacesPage() {
  const { profile } = useAuth();
  const [places, setPlaces] = useState<PlaceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlace, setEditingPlace] = useState<PlaceWithMeta | null>(null);
  const [editData, setEditData] = useState<Partial<Place>>({});
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Social links
  const [socialLinks, setSocialLinks] = useState<string[]>([]);

  // Photo management
  const [placePhotos, setPlacePhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadPlaces = async () => {
    setLoading(true);
    const data = await fetchAllPlaces();
    setPlaces(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPlaces();
    cargarBarrios().then(setBarrios);
  }, []);

  const openEdit = async (place: PlaceWithMeta) => {
    setEditingPlace(place);
    setEditData({ ...place });
    setSocialLinks(place.socialLinks || []);
    setSaveError(null);
    setUploadError(null);

    // Load photos for this place
    setLoadingPhotos(true);
    const photos = await fetchAdminPhotos(place.id);
    setPlacePhotos(photos);
    setLoadingPhotos(false);
  };

  const handleSave = async () => {
    if (!editingPlace || !profile) return;
    setSaving(true);
    setSaveError(null);
    const filteredSocialLinks = socialLinks.filter(link => link.trim() !== '');
    const success = await adminUpdatePlace(editingPlace.id, { ...editData, socialLinks: filteredSocialLinks });
    if (success) {
      if (editingPlace.createdBy && editingPlace.createdBy !== profile.id) {
        await createNotification(
          editingPlace.createdBy,
          'Lugar actualizado',
          `Tu lugar "${editData.name || editingPlace.name}" fue editado por un administrador.`,
          'system'
        );
      }
      setEditingPlace(null);
      setEditData({});
      loadPlaces();
    } else {
      setSaveError('Error al guardar. Verifica que todos los campos sean válidos.');
    }
    setSaving(false);
  };

  const handleDelete = async (place: PlaceWithMeta) => {
    if (!confirm(`¿Eliminar el lugar "${place.name}"? Esta acción no se puede deshacer.`)) return;
    if (!profile) return;
    const success = await deletePlace(place.id);
    if (success) {
      if (place.createdBy && place.createdBy !== profile.id) {
        await createNotification(
          place.createdBy,
          'Lugar eliminado',
          `Tu lugar "${place.name}" fue eliminado por un administrador.`,
          'system'
        );
      }
      loadPlaces();
    }
  };

  const toggleAccessibility = (item: string) => {
    setEditData((prev) => ({
      ...prev,
      accessibility: prev.accessibility?.includes(item)
        ? prev.accessibility.filter((a) => a !== item)
        : [...(prev.accessibility || []), item],
    }));
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, '']);
  };

  const updateSocialLink = (index: number, value: string) => {
    setSocialLinks((prev) => prev.map((link, i) => (i === index ? value : link)));
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingPlace || !profile) return;

    setUploadingPhoto(true);
    setUploadError(null);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadResult = await uploadFile(file, editingPlace.id, profile.id);
        await insertPhoto(
          editingPlace.id,
          uploadResult.url,
          uploadResult.thumbnailUrl,
          profile.name || 'Admin',
          profile.id,
          'admin'
        );
        successCount++;
      } catch (err) {
        console.error('Error subiendo archivo:', err);
        errorCount++;
      }
    }

    if (errorCount > 0 && successCount === 0) {
      setUploadError(`Error al subir ${errorCount} archivo(s). Verifica que el archivo no sea demasiado grande.`);
    } else if (errorCount > 0) {
      setUploadError(`${successCount} subido(s), ${errorCount} fallaron.`);
    }

    // Refresh photos
    const photos = await fetchAdminPhotos(editingPlace.id);
    setPlacePhotos(photos);
    setUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    const success = await adminDeletePhoto(photoId);
    if (success && editingPlace) {
      setPlacePhotos((prev) => prev.filter((p) => p.id !== photoId));
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Gestión de Lugares</h1>
        <p className='text-sm text-gray-500'>{places.length} lugares</p>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='animate-spin text-purple-600' size={40} />
        </div>
      ) : places.length === 0 ? (
        <div className='text-center py-20 bg-white rounded-xl border border-gray-100'>
          <p className='text-gray-500 text-lg'>No hay lugares aprobados</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {places.map((place) => (
            <div key={place.id} className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow'>
              <div className='p-4'>
                <div className='flex items-start justify-between gap-2 mb-2'>
                  <div className='flex-1 min-w-0'>
                    <span className='inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mb-1'>
                      {categoryLabels[place.category] || place.category}
                    </span>
                    <h3 className='font-bold text-gray-900 truncate'>{place.name}</h3>
                  </div>
                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <button
                      onClick={() => openEdit(place)}
                      className='p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                      title='Editar'
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(place)}
                      className='p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      title='Eliminar'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className='space-y-1.5 text-sm'>
                  <div className='flex items-center gap-2 text-gray-600'>
                    <MapPin size={14} className='flex-shrink-0' />
                    <span className='truncate'>{place.address}</span>
                  </div>
                  <p className='text-gray-500 text-xs'>{place.barrio}</p>
                </div>

                <div className='mt-3 flex items-center gap-1'>
                  {Array.from({ length: 5 }).map((_, i) =>
                    i < place.safetyRating ? (
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
                  <span className='text-xs text-gray-500 ml-1'>{place.safetyRating}/5</span>
                </div>

                {place.createdAt && (
                  <p className='text-xs text-gray-400 mt-2'>
                    {new Date(place.createdAt).toLocaleDateString('es-CO')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editingPlace && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50'>
          <div
            className='bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl overflow-hidden'
            style={{ maxHeight: 'min(95vh, 95dvh)' }}
          >
            {/* Header */}
            <div className='flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-2xl relative'>
              <button
                onClick={() => setEditingPlace(null)}
                className='absolute top-3 right-3 z-10 bg-white/30 hover:bg-white/50 rounded-full p-2 transition-colors'
              >
                <X size={20} className='text-white' />
              </button>
              <h2 className='text-white text-lg sm:text-xl font-bold pr-10'>Editar Lugar</h2>
              <p className='text-white/80 text-sm mt-1'>{editingPlace.name}</p>
            </div>

            {/* Formulario */}
            <div className='overflow-y-auto flex-1 p-4 sm:p-6 space-y-4'>
              {/* Nombre */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Nombre *</label>
                <input
                  type='text'
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>

              {/* Descripción */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Descripción *</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none'
                />
              </div>

              {/* Categoría y Barrio */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Categoría *</label>
                  <select
                    value={editData.category || 'cafe'}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value as Place['category'] })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Barrio *</label>
                  <select
                    value={editData.barrio || ''}
                    onChange={(e) => setEditData({ ...editData, barrio: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  >
                    <option value=''>Selecciona un barrio</option>
                    {barrios.map((b) => (
                      <option key={b.id} value={b.nombre}>{b.nombre} - {b.comuna}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Dirección *</label>
                <input
                  type='text'
                  value={editData.address || ''}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>

              {/* Calificación de seguridad */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Calificación de Seguridad</label>
                <div className='flex items-center gap-2'>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type='button'
                      onClick={() => setEditData({ ...editData, safetyRating: rating })}
                      className='transition-transform hover:scale-125 active:scale-95 p-1'
                    >
                      <span className='text-2xl'>
                        {rating <= (editData.safetyRating || 5) ? (
                          <ShieldCheck className='text-purple-600' size={24} />
                        ) : (
                          <Shield className='text-gray-300' size={24} />
                        )}
                      </span>
                    </button>
                  ))}
                  <span className='text-sm text-gray-600 ml-2'>{editData.safetyRating || 5}/5</span>
                </div>
              </div>

              {/* Teléfono, Website, Horario */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Teléfono</label>
                  <input
                    type='tel'
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder='ej: +57 300 123 4567'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Website</label>
                  <input
                    type='url'
                    value={editData.website || ''}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                    placeholder='ej: www.milugar.com'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Horario</label>
                  <input
                    type='text'
                    value={editData.hours || ''}
                    onChange={(e) => setEditData({ ...editData, hours: e.target.value })}
                    placeholder='ej: Lun-Dom: 8AM - 10PM'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  />
                </div>
              </div>

              {/* Accesibilidad */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>♿ Accesibilidad</label>
                <div className='grid grid-cols-2 gap-2'>
                  {accessibilityOptions.map((option) => (
                    <label key={option} className='flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors'>
                      <input
                        type='checkbox'
                        checked={editData.accessibility?.includes(option) || false}
                        onChange={() => toggleAccessibility(option)}
                        className='w-4 h-4 rounded border-gray-300 text-purple-600'
                      />
                      <span className='text-sm text-gray-700'>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Redes Sociales */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Redes Sociales
                </label>
                <p className='text-xs text-gray-500 mb-3'>
                  Links de redes sociales del lugar (Instagram, Facebook, TikTok, etc.)
                </p>
                <div className='space-y-2'>
                  {socialLinks.map((link, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <input
                        type='url'
                        value={link}
                        onChange={(e) => updateSocialLink(index, e.target.value)}
                        placeholder='ej: https://instagram.com/milugar'
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm'
                      />
                      <button
                        type='button'
                        onClick={() => removeSocialLink(index)}
                        className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0'
                        title='Eliminar enlace'
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type='button'
                  onClick={addSocialLink}
                  className='mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-dashed border-purple-300 w-full justify-center'
                >
                  <Plus size={16} />
                  Agregar red social
                </button>
              </div>

              {/* Fotos y Videos */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Fotos y Videos del Lugar
                </label>
                <input
                  ref={photoInputRef}
                  type='file'
                  accept='image/*,video/*'
                  multiple
                  onChange={handlePhotoUpload}
                  className='hidden'
                />
                <button
                  type='button'
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className='w-full border-2 border-dashed border-purple-300 rounded-xl p-4 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {uploadingPhoto ? (
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='animate-spin text-purple-600' size={20} />
                      <span className='text-sm text-purple-700'>Subiendo...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className='mx-auto text-purple-400 mb-1' />
                      <p className='text-sm font-medium text-gray-700'>Agregar fotos o videos</p>
                      <p className='text-xs text-gray-500'>JPG, PNG, MP4, MOV</p>
                    </>
                  )}
                </button>

                {uploadError && (
                  <p className='text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2'>{uploadError}</p>
                )}

                {loadingPhotos ? (
                  <div className='flex items-center justify-center py-4'>
                    <Loader2 className='animate-spin text-gray-400' size={20} />
                  </div>
                ) : placePhotos.length > 0 ? (
                  <div className='grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3'>
                    {placePhotos.map((photo) => (
                      <div key={photo.id} className='relative group aspect-square rounded-lg overflow-hidden bg-gray-100'>
                        {/\.(mp4|mov|avi|webm|mkv|3gp)(\?|$)/i.test(photo.url) || photo.url.includes('/videos/') ? (
                          <video
                            src={photo.url}
                            className='w-full h-full object-cover'
                            muted
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={photo.thumbnailUrl || photo.url}
                            alt='Media del lugar'
                            className='w-full h-full object-cover'
                          />
                        )}
                        <button
                          type='button'
                          onClick={() => handleDeletePhoto(photo.id)}
                          className='absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          title='Eliminar'
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-xs text-gray-400 text-center py-3'>No hay archivos multimedia</p>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className='flex-shrink-0 flex flex-col gap-2 p-4 sm:p-6 border-t bg-gray-50'>
              {saveError && (
                <p className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2'>{saveError}</p>
              )}
              <div className='flex gap-3'>
              <button
                onClick={() => setEditingPlace(null)}
                className='flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all'
              >
                {saving ? <Loader2 className='animate-spin' size={18} /> : <Save size={18} />}
                Guardar Cambios
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
