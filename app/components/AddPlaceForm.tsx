'use client';

import React, { useState } from 'react';
import { X, MapPin, Plus } from 'lucide-react';
import { Place, categoryLabels, categoryColors } from '@/app/lib/places';

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

  const [step, setStep] = useState(1); // 1: básico, 2: contacto, 3: accesibilidad
  const [showMap, setShowMap] = useState(false);

  const categories = [
    { value: 'cafe', label: 'Café' },
    { value: 'bar', label: 'Bar' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'parque', label: 'Parque' },
    { value: 'culturalCenter', label: 'Centro Cultural' },
    { value: 'health', label: 'Salud' },
    { value: 'other', label: 'Otro' },
  ];

  const barrios = [
    'Parque Arvi',
    'Parque Bolívar',
    'Manila',
    'Barrio Colombia',
    'La Candelaria',
    'Estadio',
    'Moravia',
    'Prado',
    'Centro',
    'San Alejo',
    'Laureles',
    'Belén',
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
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50'>
      <div className='bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl sm:max-h-[90vh] flex flex-col shadow-2xl animate-in'>
        {/* Header */}
        <div className='bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-6 rounded-t-2xl sm:rounded-t-2xl relative'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors'
          >
            <X size={24} className='text-white' />
          </button>
          <h2 className='text-white text-2xl font-bold flex items-center gap-2'>
            <Plus size={28} />
            Agregar Nuevo Lugar
          </h2>
          <p className='text-white/90 text-sm mt-2'>
            Ayuda a la comunidad LGBTIQ+ a encontrar espacios seguros
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className='flex items-center justify-between px-6 pt-4 pb-2'>
          {[1, 2, 3].map((s) => (
            <div key={s} className='flex items-center'>
              <button
                onClick={() => s < step && setStep(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
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
                  className={`h-1 w-12 mx-2 transition-colors ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Contenido del formulario */}
        <form onSubmit={handleSubmit} className='overflow-y-auto flex-1 p-6 space-y-4'>
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
                  <select
                    required
                    value={formData.barrio}
                    onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                  >
                    <option value=''>Selecciona un barrio</option>
                    {barrios.map((barrio) => (
                      <option key={barrio} value={barrio}>
                        {barrio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Dirección *
                </label>
                <input
                  type='text'
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder='ej: Cra. 45 #55-10'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Calificación de Seguridad
                </label>
                <div className='flex gap-2'>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type='button'
                      onClick={() => setFormData({ ...formData, safetyRating: rating })}
                      className='transition-transform hover:scale-110'
                    >
                      <span
                        className={`text-3xl ${
                          rating <= formData.safetyRating ? '⭐' : '☆'
                        }`}
                      />
                    </button>
                  ))}
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
        <div className='flex gap-3 p-6 border-t'>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className='px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
            >
              ← Anterior
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className='flex-1 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow'
            >
              Siguiente →
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className='px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className='flex-1 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow'
              >
                ✓ Agregar Lugar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
