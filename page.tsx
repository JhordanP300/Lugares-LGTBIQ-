'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Menu, X, Info, Plus, Heart } from 'lucide-react';
import AddPlaceForm from '@/app/components/AddPlaceForm';
import Favorites from '@/app/components/Favorites';
import { usePlaces } from '@/app/context/PlacesContext';

// Cargamos el mapa de forma dinámica para evitar problemas con SSR
const Map = dynamic(() => import('@/app/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center bg-gray-100">Cargando mapa...</div>,
});

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  // Estado para controlar qué pestaña del sidebar está activa (inicio o favoritos)
  const [sidebarTab, setSidebarTab] = useState<'inicio' | 'favoritos'>('inicio');
  const { places, addPlace } = usePlaces();

  return (
    <div className='w-full h-screen relative overflow-hidden'>
      {/* Mapa */}
      <Map />

      {/* Botón flotante para agregar lugar */}
      <button
        onClick={() => setIsAddPlaceOpen(true)}
        className='fixed bottom-20 right-4 z-40 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-110 flex items-center gap-2'
        title='Agregar nuevo lugar'
      >
        <Plus size={24} />
      </button>

      {/* Sidebar con información */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className='fixed top-4 right-4 z-40 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white p-2 rounded-lg md:hidden shadow-lg hover:shadow-xl transition-shadow'
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-30 transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:translate-x-0 overflow-y-auto`}
      >
        {/* Header del Sidebar */}
        <div className='bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-6 text-white'>
          <h1 className='text-2xl font-bold mb-2'>🌈 Lugares Seguros</h1>
          <p className='text-sm opacity-90'>Espacios LGBTIQ+ en Medellín</p>
        </div>

        {/* Pestañas del Sidebar - Inicio y Favoritos */}
        <div className='flex border-b bg-gray-50 sticky top-0 z-10'>
          <button
            onClick={() => setSidebarTab('inicio')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              sidebarTab === 'inicio'
                ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title='Ver información general'
          >
            <Info size={16} />
            Inicio
          </button>
          <button
            onClick={() => setSidebarTab('favoritos')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              sidebarTab === 'favoritos'
                ? 'border-b-2 border-red-500 text-red-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title='Ver mis favoritos'
          >
            <Heart size={16} />
            Favoritos
          </button>
        </div>

        {/* Contenido - Pestaña Inicio */}
        {sidebarTab === 'inicio' && (
          <div className='p-6 space-y-6'>
          {/* Bienvenida */}
          <div className='bg-purple-50 rounded-lg p-4 border-l-4 border-purple-600'>
            <h2 className='font-bold text-gray-900 mb-2 flex items-center gap-2'>
              <Info size={18} className='text-purple-600' />
              Bienvenide
            </h2>
            <p className='text-sm text-gray-700'>
              Esta plataforma fue creada para que la comunidad LGBTIQ+ pueda
              encontrar y compartir espacios seguros en el Valle de Aburrá.
            </p>
          </div>

          {/* Estadísticas */}
          <div className='bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600'>
            <h3 className='font-bold text-gray-900 mb-2'>📊 Comunidad</h3>
            <p className='text-sm text-gray-700'>
              <strong>{places.length}</strong> lugares seguros registrados
            </p>
          </div>

          {/* Cómo usar */}
          <div>
            <h3 className='font-bold text-gray-900 mb-3'>¿Cómo usar?</h3>
            <ol className='space-y-2 text-sm text-gray-700'>
              <li className='flex gap-2'>
                <span className='font-bold text-purple-600 flex-shrink-0'>1.</span>
                <span>Explora el mapa para encontrar lugares seguros</span>
              </li>
              <li className='flex gap-2'>
                <span className='font-bold text-purple-600 flex-shrink-0'>2.</span>
                <span>Haz clic en un marcador para ver detalles</span>
              </li>
              <li className='flex gap-2'>
                <span className='font-bold text-purple-600 flex-shrink-0'>3.</span>
                <span>Lee comentarios y fotos de otros visitantes</span>
              </li>
              <li className='flex gap-2'>
                <span className='font-bold text-purple-600 flex-shrink-0'>4.</span>
                <span>¡Agrega nuevos lugares que conoces!</span>
              </li>
            </ol>
          </div>

          {/* Botón para agregar lugar */}
          <button
            onClick={() => {
              setIsAddPlaceOpen(true);
              setSidebarOpen(false);
            }}
            className='w-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
          >
            <Plus size={20} />
            Agregar Lugar
          </button>

          {/* Categorías */}
          <div>
            <h3 className='font-bold text-gray-900 mb-3'>Categorías</h3>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full bg-red-500'></div>
                <span className='text-gray-700'>☕ Cafés</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full bg-orange-500'></div>
                <span className='text-gray-700'>🍹 Bares</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full bg-yellow-500'></div>
                <span className='text-gray-700'>🏨 Hoteles</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full bg-green-500'></div>
                <span className='text-gray-700'>🌳 Parques</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full bg-blue-500'></div>
                <span className='text-gray-700'>🎨 Centros Culturales</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full bg-indigo-600'></div>
                <span className='text-gray-700'>⚕️ Salud</span>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className='bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600'>
            <h3 className='font-bold text-gray-900 mb-2'>Nuestros Valores</h3>
            <ul className='space-y-1 text-xs text-gray-700'>
              <li>✨ Seguridad y confianza</li>
              <li>🤝 Comunidad inclusiva</li>
              <li>💜 Respeto y dignidad</li>
              <li>🌍 Diversidad celebrada</li>
            </ul>
          </div>

          {/* Aviso */}
          <div className='bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-600 text-xs text-gray-700'>
            <p>
              <strong>Nota:</strong> Esta plataforma es comunitaria. Los
              comentarios y fotos compartidas son públicos.
            </p>
          </div>
        </div>
        )}

        {/* Contenido - Pestaña Favoritos */}
        {sidebarTab === 'favoritos' && (
          <Favorites
            onSelectPlace={(placeId) => {
              // Aquí se puede agregar lógica para seleccionar y centrar el mapa en un lugar
              console.log('Seleccionado lugar:', placeId);
            }}
          />
        )}
      </div>

      {/* Overlay para cerrar sidebar en mobile */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-20 bg-black/30 md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Footer flotante */}
      <div className='fixed bottom-4 left-4 z-20 bg-white rounded-lg shadow-lg p-3 max-w-xs'>
        <p className='text-xs text-gray-600'>
          <strong>💡 Tip:</strong> Usa el botón + para agregar un nuevo lugar seguro
        </p>
      </div>

      {/* Formulario para agregar lugar */}
      <AddPlaceForm
        isOpen={isAddPlaceOpen}
        onClose={() => setIsAddPlaceOpen(false)}
        onAddPlace={(newPlace) => {
          addPlace(newPlace);
          alert('¡Lugar agregado exitosamente! Gracias por contribuir a la comunidad.');
        }}
      /> del mapa y
    </div>
  );
}


