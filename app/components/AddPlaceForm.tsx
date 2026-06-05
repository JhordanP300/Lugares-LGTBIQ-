'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Lock, Unlock, MapPin, Search, Loader2 } from 'lucide-react';
import { Place } from '@/app/lib/places';
import { cargarBarrios, Barrio } from '@/app/lib/barrios';
import { geocodificarDireccion, parsearCoordenadasGoogleMaps, obtenerDireccionInversa, Suggestion } from '@/app/lib/geocoding';
import dynamic from 'next/dynamic';

// Mapa dinámico para el preview
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
  onAddPlace: (place: Omit<Place, 'id'>) => void;
}

export default function AddPlaceForm({ isOpen, onClose, onAddPlace }: AddPlaceFormProps) {
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
  });

  const [step, setStep] = useState(1);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [loadingBarrios, setLoadingBarrios] = useState(true);
  const [sugerencias, setSugerencias] = useState<Suggestion[]>([]);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [direccionEncontrada, setDireccionEncontrada] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const categories = [
    { value: 'cafe', label: 'Café' },
    { value: 'bar', label: 'Bar' },
    { value: 'lugar', label: 'Lugar Emblemático' },
    { value: 'parque', label: 'Parque' },
    { value: 'culturalCenter', label: 'Centro Cultural' },
    { value: 'health', label: 'Salud' },
    { value: 'other', label: 'Otro' },
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

  // Cargar barrios al abrir el formulario
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

  // Buscar sugerencias de dirección con debounce
  const buscarSugerencias = useCallback(async (busqueda: string) => {
    if (busqueda.length < 3) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    setBuscandoDireccion(true);
    const resultados = await geocodificarDireccion(busqueda);
    
    // También obtener sugerencias para el autocompletado
    const { obtenerSugerencias } = await import('@/app/lib/geocoding');
    const sugerenciasData = await obtenerSugerencias(busqueda);
    setSugerencias(sugerenciasData);
    setMostrarSugerencias(sugerenciasData.length > 0);
    setBuscandoDireccion(false);

    if (resultados) {
      setFormData(prev => ({
        ...prev,
        coordinates: [resultados.lat, resultados.lng],
        address: resultados.displayName.split(',').slice(0, 2).join(','),
      }));
      setDireccionEncontrada(true);
    }
  }, []);

  // Manejar cambio en el campo de dirección
  const handleDireccionChange = async (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    setDireccionEncontrada(false);

    // Primero intentar parsear como coordenadas de Google Maps
    const coordenadas = parsearCoordenadasGoogleMaps(value);
    if (coordenadas) {
      // Obtener la dirección legible con reverse geocoding
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

    // Si no es coordenadas, usar el flujo normal de geocodificación con debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      buscarSugerencias(value);
    }, 500);
  };

  // Seleccionar una sugerencia
  const seleccionarSugerencia = (sugerencia: Suggestion) => {
    setFormData(prev => ({
      ...prev,
      address: sugerencia.displayName.split(',').slice(0, 2).join(','),
      coordinates: [sugerencia.lat, sugerencia.lng],
    }));
    setSugerencias([]);
    setMostrarSugerencias(false);
    setDireccionEncontrada(true);
  };

  // Buscar dirección al presionar Enter
  const handleDireccionKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      await buscarSugerencias(formData.address);
    }
  };

  const handleAccessibilityToggle = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      accessibility: prev.accessibility.includes(item)
        ? prev.accessibility.filter((a) => a !== item)
        : [...prev.accessibility, item],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    onAddPlace(formData);
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
    });
    setDireccionEncontrada(false);
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 modal-backdrop'>
      <div
        className='bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl animate-in overflow-hidden'
        style={{ maxHeight: 'min(95vh, 95dvh)' }}
      >
        {/* Header */}
        <div className='flex-shrink-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-3 sm:p-6 rounded-t-2xl sm:rounded-t-2xl relative'>
          <button
            onClick={onClose}
            className='absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/30 hover:bg-white/50 rounded-full p-1 sm:p-2 transition-colors shadow-lg'
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
          {[1, 2, 3].map((s) => (
            <div key={s} className='flex items-center flex-1 sm:flex-none'>
              <button
                onClick={() => s < step && setStep(s)}
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
              {s < 3 && (
                <div
                  className={`h-1 flex-1 mx-1 sm:w-12 sm:mx-2 transition-colors ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Contenido del formulario */}
        <form onSubmit={handleSubmit} className='overflow-y-auto flex-1 p-3 sm:p-6 space-y-3 sm:space-y-4'>
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

              {/* Campo de Dirección con autocompletado */}
              <div className='relative'>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Dirección *
                </label>
                <div className='relative'>
                  <MapPin size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                  <input
                    type='text'
                    required
                    value={formData.address}
                    onChange={(e) => handleDireccionChange(e.target.value)}
                    onKeyDown={handleDireccionKeyDown}
                    onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
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
                
                {/* Lista de sugerencias */}
                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
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
                  </div>
                )}
              </div>

              {/* Preview del mapa */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Ubicación en el mapa
                </label>
                <PreviewMap 
                  coordinates={formData.coordinates} 
                  address={formData.address}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  {direccionEncontrada 
                    ? parsearCoordenadasGoogleMaps(formData.address) 
                      ? '✓ Coordenadas de Google Maps detectadas y ubicadas'
                      : '✓ Dirección ubicada correctamente' 
                    : 'Pega una URL de Google Maps o escribe una dirección y presiona Enter'}
                </p>
              </div>

              {/* Calificación de Seguridad */}
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
                      title={`Calificación: ${rating} candados de seguridad`}
                      aria-label={`Seleccionar ${rating} candados de seguridad`}
                    >
                      <span className='text-2xl sm:text-3xl'>
                        {rating <= formData.safetyRating ? (
                          <Lock className='text-purple-600 fill-purple-100' size={28} />
                        ) : (
                          <Unlock className='text-gray-300' size={28} />
                        )}
                      </span>
                    </button>
                  ))}
                  <span className='text-sm text-gray-600 ml-2'>
                    {formData.safetyRating}/5 candados
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
        </form>

        {/* Botones de acción */}
        <div className='flex-shrink-0 flex flex-wrap gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-gray-50'>
          {step > 1 && (
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
          ) : (
            <>
              <button
                onClick={onClose}
                className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 border border-gray-300 rounded-lg font-semibold text-xs sm:text-base text-gray-700 hover:bg-gray-100 transition-colors'
                title='Cancelar el formulario'
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className='flex-1 min-w-[100px] px-3 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-xs sm:text-base hover:shadow-lg transition-shadow'
                title='Enviar el formulario'
              >
                ✓ Agregar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
