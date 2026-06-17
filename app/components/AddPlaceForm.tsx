'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ShieldCheck, Shield, MapPin, Loader2, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { Place } from '@/app/lib/places';
import { cargarBarrios, Barrio } from '@/app/lib/barrios';
import { geocodificarDireccion, parsearCoordenadasGoogleMaps, obtenerDireccionInversa, obtenerSugerencias, formatearDireccionColombiana, Suggestion } from '@/app/lib/geocoding';
import { uploadFile, insertPhoto } from '@/app/lib/media-db';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const PreviewMap = dynamic(() => import('./PreviewMap'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center'>
      <Loader2 className='animate-spin text-gray-400' size={24} />
    </div>
  ),
});

interface AddPlaceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Omit<Place, 'id'>) => Promise<string | null>;
}

export default function AddPlaceForm({ isOpen, onClose, onAddPlace }: AddPlaceFormProps) {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'cafe' as Place['category'],
    address: '',
    barrio: '',
    coordinates: [6.2442, -75.5812] as [number, number],
    phone: '',
    website: '',
    hours: '',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: [] as string[],
    socialLinks: [] as string[],
  });

  const [step, setStep] = useState(1);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [loadingBarrios, setLoadingBarrios] = useState(true);
  const [sugerencias, setSugerencias] = useState<Suggestion[]>([]);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [direccionEncontrada, setDireccionEncontrada] = useState(false);
  const [mapaInteractivo, setMapaInteractivo] = useState(false);
  const [cargandoDireccionMapa, setCargandoDireccionMapa] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Photo upload states
  const [createdPlaceId, setCreatedPlaceId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [creatingPlace, setCreatingPlace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      cargarBarriosFormulario();
    }
  }, [isOpen]);

  const cargarBarriosFormulario = async () => {
    setLoadingBarrios(true);
    const data = await cargarBarrios();
    setBarrios(data);
    setLoadingBarrios(false);
  };

  const buscarSugerencias = useCallback(async (busqueda: string) => {
    if (busqueda.length < 3) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    setBuscandoDireccion(true);
    const sugerenciasData = await obtenerSugerencias(busqueda);
    setSugerencias(sugerenciasData);
    setMostrarSugerencias(sugerenciasData.length > 0);

    // Si hay resultados, geocodificar el primero para centrar el mapa
    // y formatear la dirección con nomenclatura colombiana
    if (sugerenciasData.length > 0) {
      const mejor = sugerenciasData[0];
      const direccionFormateada = mejor.address
        ? formatearDireccionColombiana(mejor.address, mejor.displayName)
        : mejor.displayName.split(',').slice(0, 3).join(',').trim();
      setFormData(prev => ({
        ...prev,
        coordinates: [mejor.lat, mejor.lng],
        address: direccionFormateada,
      }));
      setDireccionEncontrada(true);
    } else {
      // Si no hay sugerencias, intentar geocodificar directamente
      const resultados = await geocodificarDireccion(busqueda);
      if (resultados) {
        const direccionFormateada = formatearDireccionColombiana(resultados.address, resultados.displayName);
        setFormData(prev => ({
          ...prev,
          coordinates: [resultados.lat, resultados.lng],
          address: direccionFormateada,
        }));
        setDireccionEncontrada(true);
      }
    }
    setBuscandoDireccion(false);
  }, []);

  const handleDireccionChange = async (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    setDireccionEncontrada(false);

    const coordenadas = parsearCoordenadasGoogleMaps(value);
    if (coordenadas) {
      setBuscandoDireccion(true);
      const direccionLegible = await obtenerDireccionInversa(coordenadas.lat, coordenadas.lng);
      setFormData(prev => ({
        ...prev,
        coordinates: [coordenadas.lat, coordenadas.lng],
        address: direccionLegible || `${coordenadas.lat}, ${coordenadas.lng}`,
      }));
      setDireccionEncontrada(true);
      setBuscandoDireccion(false);
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      buscarSugerencias(value);
    }, 500);
  };

  const seleccionarSugerencia = (sugerencia: Suggestion) => {
    const direccionFormateada = sugerencia.address
      ? formatearDireccionColombiana(sugerencia.address, sugerencia.displayName)
      : sugerencia.displayName.split(',').slice(0, 3).join(',').trim();
    setFormData(prev => ({
      ...prev,
      address: direccionFormateada,
      coordinates: [sugerencia.lat, sugerencia.lng],
    }));
    setSugerencias([]);
    setMostrarSugerencias(false);
    setDireccionEncontrada(true);
  };

  const handleDireccionKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      await buscarSugerencias(formData.address);
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      coordinates: [lat, lng],
    }));
    setDireccionEncontrada(true);
    setCargandoDireccionMapa(true);
    try {
      const direccion = await obtenerDireccionInversa(lat, lng);
      if (direccion) {
        const direccionFormateada = formatearDireccionColombiana(
          (() => {
            try {
              const partes = direccion.split(', ');
              return {
                road: partes[0] || undefined,
                neighbourhood: partes.find(p => !p.match(/^\d/) && p !== direccion.split(', ').slice(-2, -1)[0]) || undefined,
                city: partes.find(p => p.includes('Medellín') || p.includes('Bello') || p.includes('Envigado')) || partes.slice(-3, -2)[0] || undefined,
              };
            } catch {
              return {};
            }
          })(),
          direccion
        );
        setFormData(prev => ({
          ...prev,
          address: direccionFormateada,
        }));
        setDireccionEncontrada(true);
      }
    } catch {
      setFormData(prev => ({
        ...prev,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }));
    }
    setCargandoDireccionMapa(false);
  }, []);

  const handleAccessibilityToggle = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      accessibility: prev.accessibility.includes(item)
        ? prev.accessibility.filter((a) => a !== item)
        : [...prev.accessibility, item],
    }));
  };

  const addSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ''],
    }));
  };

  const updateSocialLink = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => (i === index ? value : link)),
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    const newPreviewUrls = imageFiles.map(f => URL.createObjectURL(f));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePlace = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.address.trim()) {
      alert('Por favor, completa los campos obligatorios');
      return;
    }

    if (!direccionEncontrada) {
      const confirmar = confirm(
        'La dirección no fue verificada en el mapa. ¿Deseas agregar el lugar de todas formas?'
      );
      if (!confirmar) return;
    }

    setCreatingPlace(true);
    const dataToSend = {
      ...formData,
      socialLinks: formData.socialLinks.filter(link => link.trim() !== ''),
    };
    const placeId = await onAddPlace(dataToSend);
    setCreatingPlace(false);

    if (placeId) {
      setCreatedPlaceId(placeId);
      if (selectedFiles.length > 0) {
        await uploadPhotos(placeId);
      } else {
        setStep(4);
      }
    } else {
      // No placeId returned (user request or error) — close modal
      handleClose();
    }
  };

  const uploadPhotos = async (placeId: string) => {
    if (selectedFiles.length === 0) {
      setStep(4);
      return;
    }

    setUploadingPhotos(true);
    setUploadProgress({ done: 0, total: selectedFiles.length });

    const authorName = profile?.name || user?.email?.split('@')[0] || 'Anónimo';
    const userId = user?.id || '';

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const uploadResult = await uploadFile(file, placeId, userId);
      
      if (uploadResult) {
        await insertPhoto(
          placeId,
          uploadResult.url,
          uploadResult.thumbnailUrl,
          authorName,
          userId || null,
          'admin'
        );
      }
      
      setUploadProgress({ done: i + 1, total: selectedFiles.length });
    }

    setUploadingPhotos(false);
    setStep(4);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'cafe',
      address: '',
      barrio: '',
      coordinates: [6.2442, -75.5812],
      phone: '',
      website: '',
      hours: '',
      safetyRating: 5,
      lgbtiqFriendly: true,
      accessibility: [],
      socialLinks: [],
    });
    setDireccionEncontrada(false);
    setMapaInteractivo(false);
    setCargandoDireccionMapa(false);
    setCreatedPlaceId(null);
    setSelectedFiles([]);
    photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setPhotoPreviewUrls([]);
    setUploadProgress({ done: 0, total: 0 });
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const isProcessing = creatingPlace || uploadingPhotos;

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 modal-backdrop'>
      <div
        className='bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl animate-in overflow-hidden'
        style={{ maxHeight: 'min(95vh, 95dvh)' }}
      >
        {/* Header */}
        <div className='flex-shrink-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-3 sm:p-6 rounded-t-2xl sm:rounded-t-2xl relative'>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className='absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/30 hover:bg-white/50 rounded-full p-1 sm:p-2 transition-colors shadow-lg disabled:opacity-50'
            aria-label='Cerrar'
            title='Cerrar'
          >
            <X size={20} className='text-white sm:w-6 sm:h-6' />
          </button>
          <h2 className='text-white text-lg sm:text-2xl font-bold flex items-center gap-1 sm:gap-2 pr-10 sm:pr-12'>
            <Plus size={24} className='sm:w-7 sm:h-7' />
            Agregar Nuevo Lugar
          </h2>
          <p className='text-white/90 text-xs sm:text-sm mt-1 sm:mt-2'>
            Ayuda a la comunidad LGBTIQ+ a encontrar espacios seguros
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className='flex-shrink-0 flex items-center justify-between px-3 sm:px-6 pt-2 sm:pt-4 pb-1 sm:pb-2 bg-white gap-1 sm:gap-0'>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className='flex items-center flex-1 sm:flex-none'>
              <button
                onClick={() => s < step && !isProcessing && setStep(s)}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-colors ${
                  s === step
                    ? 'bg-purple-600 text-white'
                    : s < step
                      ? 'bg-green-500 text-white cursor-pointer'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? '✓' : s}
              </button>
              {s < 4 && (
                <div
                  className={`h-1 flex-1 mx-1 sm:w-8 sm:mx-1 transition-colors ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Contenido del formulario */}
        <div className='overflow-y-auto flex-1 p-3 sm:p-6 space-y-3 sm:space-y-4'>
          {/* PASO 1: Información Básica */}
          {step === 1 && (
            <div className='space-y-4'>
              <h3 className='font-bold text-gray-900 text-lg'>Información Básica</h3>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Nombre del lugar *
                </label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='ej: Café Rainbow'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Descripción *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Describe el lugar, su ambiente y por qué es especial para la comunidad LGBTIQ+...'
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Categoría *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as Place['category'],
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Barrio *
                  </label>
                  {loadingBarrios ? (
                    <div className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2'>
                      <Loader2 className='animate-spin text-purple-600' size={16} />
                      <span className='text-sm text-gray-500'>Cargando barrios...</span>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.barrio}
                      onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                    >
                      <option value=''>Selecciona un barrio</option>
                      {barrios.map((barrio) => (
                        <option key={barrio.id} value={barrio.nombre}>
                          {barrio.nombre} - {barrio.comuna}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className='relative'>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Dirección *
                </label>
                <div className='relative'>
                  <MapPin size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                  <input
                    ref={inputRef}
                    type='text'
                    required
                    value={formData.address}
                    onChange={(e) => handleDireccionChange(e.target.value)}
                    onKeyDown={handleDireccionKeyDown}
                    onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                    placeholder='Pega una URL de Google Maps o escribe la dirección'
                    className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  />
                  {buscandoDireccion && (
                    <Loader2 size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 animate-spin' />
                  )}
                  {direccionEncontrada && !buscandoDireccion && (
                    <MapPin size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-green-500' />
                  )}
                </div>
                
                {mostrarSugerencias && sugerencias.length > 0 && inputRef.current && (
                  createPortal(
                    <div
                      style={{
                        position: 'fixed',
                        zIndex: 9999,
                        left: inputRef.current.getBoundingClientRect().left,
                        top: inputRef.current.getBoundingClientRect().bottom + window.scrollY,
                        width: inputRef.current.offsetWidth,
                      }}
                      className='bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto'
                    >
                      {sugerencias.map((sugerencia) => (
                        <button
                          key={sugerencia.placeId}
                          type='button'
                          onClick={() => seleccionarSugerencia(sugerencia)}
                          className='w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-0 transition-colors'
                        >
                          <div className='flex items-start gap-2'>
                            <MapPin size={14} className='text-purple-600 mt-0.5 flex-shrink-0' />
                            <span className='text-sm text-gray-700 line-clamp-2'>
                              {sugerencia.displayName}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>,
                    document.body
                  )
                )}
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <label className='block text-sm font-semibold text-gray-700'>
                    Ubicación en el mapa
                  </label>
                  <button
                    type='button'
                    onClick={() => setMapaInteractivo(!mapaInteractivo)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                      mapaInteractivo
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mapaInteractivo ? '📍 Marcando en mapa' : '🗺️ Marcar en mapa'}
                  </button>
                </div>
                <PreviewMap 
                  coordinates={formData.coordinates} 
                  address={formData.address}
                  interactive={mapaInteractivo}
                  onMapClick={handleMapClick}
                />
                {mapaInteractivo && (
                  <p className='text-xs text-purple-600 mt-1 font-medium flex items-center gap-1'>
                    <span className='inline-block w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse' />
                    Navega por el mapa y haz clic para colocar el marcador
                  </p>
                )}
                {cargandoDireccionMapa && (
                  <p className='text-xs text-blue-600 mt-1 font-medium flex items-center gap-1'>
                    <Loader2 size={12} className='animate-spin' />
                    Obteniendo dirección...
                  </p>
                )}
                {!mapaInteractivo && (
                  <p className='text-xs text-gray-500 mt-1'>
                    {direccionEncontrada 
                      ? parsearCoordenadasGoogleMaps(formData.address) 
                        ? '✓ Coordenadas de Google Maps detectadas y ubicadas'
                        : '✓ Dirección ubicada correctamente' 
                      : 'Pega una URL de Google Maps o escribe una dirección y presiona Enter'}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Calificación de Seguridad
                </label>
                <div className='flex flex-wrap gap-2 items-center'>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type='button'
                      onClick={() => setFormData({ ...formData, safetyRating: rating })}
                      className='transition-transform hover:scale-125 active:scale-95 p-1 cursor-pointer'
                      title={`Calificación: ${rating} de seguridad`}
                      aria-label={`Seleccionar ${rating} de seguridad`}
                    >
                      <span className='text-2xl sm:text-3xl'>
                        {rating <= formData.safetyRating ? (
                          <ShieldCheck className='text-purple-600' size={28} />
                        ) : (
                          <Shield className='text-gray-300' size={28} />
                        )}
                      </span>
                    </button>
                  ))}
                  <span className='text-sm text-gray-600 ml-2'>
                    {formData.safetyRating}/5
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Contacto e Información */}
          {step === 2 && (
            <div className='space-y-4'>
              <h3 className='font-bold text-gray-900 text-lg'>Contacto e Información</h3>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Teléfono</label>
                <input
                  type='tel'
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder='ej: +57 300 123 4567'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Website</label>
                <input
                  type='url'
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder='ej: www.milugar.com'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Horario de Atención
                </label>
                <input
                  type='text'
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder='ej: Lun-Dom: 8AM - 10PM'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>

              <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.lgbtiqFriendly}
                    onChange={(e) => setFormData({ ...formData, lgbtiqFriendly: e.target.checked })}
                    className='w-4 h-4 rounded border-gray-300 text-purple-600'
                  />
                  <span className='font-semibold text-gray-900'>
                    Este lugar es LGBTIQ+ Friendly ✨
                  </span>
                </label>
                <p className='text-xs text-gray-600 mt-2'>
                  Marca esta opción si el lugar es seguro y acogedor para la comunidad LGBTIQ+
                </p>
              </div>

              {/* Redes Sociales */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Redes Sociales
                </label>
                <p className='text-xs text-gray-500 mb-3'>
                  Agrega los links de las redes sociales del lugar (Instagram, Facebook, TikTok, etc.)
                </p>
                
                <div className='space-y-2'>
                  {formData.socialLinks.map((link, index) => (
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
            </div>
          )}

          {/* PASO 3: Accesibilidad */}
          {step === 3 && (
            <div className='space-y-4'>
              <h3 className='font-bold text-gray-900 text-lg'>Accesibilidad</h3>

              <p className='text-sm text-gray-600'>
                Selecciona todas las características de accesibilidad disponibles en el lugar:
              </p>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {accessibilityOptions.map((option) => (
                  <label
                    key={option}
                    className='flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={formData.accessibility.includes(option)}
                      onChange={() => handleAccessibilityToggle(option)}
                      className='w-4 h-4 rounded border-gray-300 text-purple-600'
                    />
                    <span className='text-sm text-gray-700'>{option}</span>
                  </label>
                ))}
              </div>

              <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                <p className='text-sm text-gray-700'>
                  <strong>✓ Accesibilidad seleccionada:</strong>{' '}
                  {formData.accessibility.length > 0
                    ? formData.accessibility.join(', ')
                    : 'Ninguna'}
                </p>
              </div>
            </div>
          )}

          {/* PASO 4: Fotos */}
          {step === 4 && (
            <div className='space-y-4'>
              <h3 className='font-bold text-gray-900 text-lg'>📸 Fotos del Lugar</h3>
              
              {createdPlaceId ? (
                <div className='bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0'>
                    <Check size={20} className='text-white' />
                  </div>
                  <div>
                    <p className='font-semibold text-green-800'>¡Lugar creado exitosamente!</p>
                    <p className='text-sm text-green-700'>Ahora sube las fotos seleccionadas</p>
                  </div>
                </div>
              ) : (
                <p className='text-sm text-gray-600'>
                  Selecciona fotos del lugar para que la comunidad lo conozca. Este paso es opcional, puedes omitirlo.
                </p>
              )}

              {/* Upload zone */}
              {!createdPlaceId && (
                <div>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handlePhotoSelect}
                    className='hidden'
                  />
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhotos}
                  className='w-full border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Upload size={32} className='mx-auto text-purple-400 mb-2' />
                  <p className='text-sm font-semibold text-gray-700'>
                    Haz clic para agregar fotos
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    {selectedFiles.length === 0 ? 'Selecciona una o más fotos' : `${selectedFiles.length} foto(s) seleccionada(s)`} • JPG, PNG (máx. 10MB c/u)
                  </p>
                </button>
                </div>
              )}

              {/* Photo previews */}
              {photoPreviewUrls.length > 0 && (
                <div className='grid grid-cols-3 sm:grid-cols-5 gap-3'>
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className='relative group aspect-square rounded-lg overflow-hidden bg-gray-100'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                      {!createdPlaceId && (
                        <button
                          type='button'
                          onClick={() => removePhoto(index)}
                          disabled={uploadingPhotos}
                          className='absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50'
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload progress - solo cuando ya se creó el lugar */}
              {uploadingPhotos && (
                <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                  <div className='flex items-center gap-3 mb-2'>
                    <Loader2 className='animate-spin text-blue-600' size={20} />
                    <span className='text-sm font-semibold text-blue-800'>
                      Subiendo fotos... ({uploadProgress.done}/{uploadProgress.total})
                    </span>
                  </div>
                  <div className='w-full bg-blue-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                      style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className='flex-shrink-0 flex flex-wrap gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-gray-50'>
          {step > 1 && !isProcessing && (
            <button
              onClick={() => setStep(step - 1)}
              className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 border border-gray-300 rounded-lg font-semibold text-xs sm:text-base text-gray-700 hover:bg-gray-100 transition-colors'
              title='Ir al paso anterior'
            >
              ← Anterior
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-xs sm:text-base hover:shadow-lg transition-shadow'
              title='Ir al siguiente paso'
            >
              Siguiente →
            </button>
          ) : step === 3 ? (
            <button
              onClick={() => setStep(4)}
              className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-xs sm:text-base hover:shadow-lg transition-shadow'
              title='Ir al siguiente paso'
            >
              Siguiente →
            </button>
          ) : step === 4 && !createdPlaceId ? (
            <>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 border border-gray-300 rounded-lg font-semibold text-xs sm:text-base text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50'
                title='Cancelar'
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlace}
                disabled={isProcessing}
                className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-xs sm:text-base hover:shadow-lg transition-shadow flex items-center justify-center gap-2 disabled:opacity-50'
                title='Crear lugar y subir fotos'
              >
                {creatingPlace ? (
                  <>
                    <Loader2 className='animate-spin' size={18} />
                    Creando...
                  </>
                ) : (
                  '✓ Crear Lugar'
                )}
              </button>
            </>
          ) : step === 4 && createdPlaceId ? (
            <>
              {!uploadingPhotos && (
                <button
                  onClick={handleClose}
                  className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 border border-gray-300 rounded-lg font-semibold text-xs sm:text-base text-gray-700 hover:bg-gray-100 transition-colors'
                  title='Omitir fotos'
                >
                  Omitir
                </button>
              )}
              <button
                onClick={handleClose}
                disabled={uploadingPhotos}
                className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-xs sm:text-base hover:shadow-lg transition-shadow disabled:opacity-50'
                title='Finalizar'
              >
                {uploadingPhotos ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Loader2 className='animate-spin' size={18} />
                    Subiendo...
                  </span>
                ) : (
                  '✓ Listo'
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
