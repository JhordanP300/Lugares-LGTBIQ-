'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Info, Plus, Heart, LogIn, LogOut, User, UserPlus, Shield } from 'lucide-react';
import AddPlaceForm from '@/app/components/AddPlaceForm';
import Favorites from '@/app/components/Favorites';
import NotificationBell from '@/app/components/NotificationBell';
import { usePlaces } from '@/app/context/PlacesContext';
import { useAuth } from '@/app/context/AuthContext';
import { insertPlaceRequest, fetchAllRequests } from '@/app/lib/requests-db';

// Cargamos el mapa de forma dinámica para evitar problemas con SSR
const Map = dynamic(() => import('@/app/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center bg-gray-100">Cargando mapa...</div>,
});

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'inicio' | 'favoritos'>('inicio');
  const { places, addPlace } = usePlaces();
  const { user, profile, loading, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState(0);

  // Cargar solicitudes pendientes para admin
  useEffect(() => {
    if (isAdmin) {
      const loadPending = async () => {
        const all = await fetchAllRequests('all');
        setPendingRequests(all.filter((r) => r.status === 'pending').length);
      };
      loadPending();
      const interval = setInterval(loadPending, 15000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  return (
    <div className='w-full h-screen relative'>
      {/* Mapa */}
      <div className='absolute inset-0 overflow-hidden'>
        <Map />
      </div>

      {/* Botón flotante para agregar lugar o ir al admin */}
      {isAdmin ? (
        <button
          onClick={() => router.push('/admin')}
          className='fixed bottom-16 right-3 sm:bottom-20 sm:right-4 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-110 flex items-center gap-2'
          title='Panel de administración'
        >
          <Shield size={20} className='sm:w-6 sm:h-6' />
        </button>
      ) : (
        <button
          onClick={() => {
            if (!user) {
              router.push('/auth/login');
              return;
            }
            setIsAddPlaceOpen(true);
          }}
          className='fixed bottom-16 right-3 sm:bottom-20 sm:right-4 z-40 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-110 flex items-center gap-2'
          title={user ? 'Enviar solicitud de lugar' : 'Inicia sesión para enviar solicitudes'}
        >
          <Plus size={20} className='sm:w-6 sm:h-6' />
        </button>
      )}

      {/* Sidebar con información */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className='fixed top-4 right-4 z-40 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white p-2 rounded-lg md:hidden shadow-lg hover:shadow-xl transition-shadow'
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] sm:w-80 max-w-[320px] bg-white shadow-2xl z-30 transition-transform duration-300 transform flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:translate-x-0`}
      >
        {/* Header del Sidebar */}
        <div className='bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-6 text-white flex-shrink-0'>
          <h1 className='text-2xl font-bold mb-2'>🌈 Lugares Seguros</h1>
          <p className='text-sm opacity-90'>Espacios LGBTIQ+ en Medellín</p>
        </div>

        {/* Auth section */}
        <div className='px-4 py-3 border-b bg-gray-50 flex-shrink-0'>
          {loading ? (
            <div className='text-xs text-gray-500 text-center py-1'>Cargando...</div>
          ) : user ? (
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 min-w-0'>
                <div className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0'>
                  <User size={16} className='text-purple-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold text-gray-900 truncate'>
                    {profile?.name || user.email?.split('@')[0]}
                  </p>
                  <p className='text-xs text-gray-500 truncate'>{user.email}</p>
                </div>
              </div>
              <div className='flex items-center gap-1'>
                {isAdmin && (
                  <button
                    onClick={() => router.push('/admin')}
                    className='p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0'
                    title='Panel de administración'
                  >
                    <Shield size={16} />
                  </button>
                )}
                <NotificationBell pendingCount={isAdmin ? pendingRequests : 0} />
                <button
                  onClick={signOut}
                  className='p-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0'
                  title='Cerrar sesión'
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              <button
                onClick={() => router.push('/auth/register')}
                className='w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-shadow'
              >
                <UserPlus size={16} />
                Regístrate
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className='w-full flex items-center justify-center gap-2 py-2 px-4 border border-purple-600 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors'
              >
                <LogIn size={16} />
                Iniciar sesión
              </button>
            </div>
          )}
        </div>

        {/* Contenido scrollable */}
        <div className='flex-1 overflow-y-auto min-h-0'>
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
          {isAdmin ? (
            <button
              onClick={() => {
                setIsAddPlaceOpen(true);
                setSidebarOpen(false);
              }}
              className='w-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
            >
              <Plus size={20} />
              Agregar Lugar Directamente
            </button>
          ) : (
            <button
              onClick={() => {
                if (!user) {
                  router.push('/auth/login');
                  return;
                }
                setIsAddPlaceOpen(true);
                setSidebarOpen(false);
              }}
              className='w-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
            >
              <Plus size={20} />
              Enviar Solicitud de Lugar
            </button>
          )}

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
                <span className='text-gray-700'>📍 Lugares Emblemáticos</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full' style={{ backgroundColor: '#FF69B4' }}></div>
                <span className='text-gray-700'>🏳️‍🌈 Lugares Simbólicos</span>
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
      </div>

      {/* Overlay para cerrar sidebar en mobile */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-20 bg-black/30 md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Footer flotante */}
      <div className='fixed bottom-4 left-3 sm:left-4 z-20 bg-white rounded-lg shadow-lg p-2 sm:p-3 max-w-[160px] sm:max-w-xs'>
        <p className='text-[10px] sm:text-xs text-gray-600'>
          <strong>💡 Tip:</strong> {isAdmin ? 'Usa el botón 🛡️ para ir al panel de admin' : 'Usa el botón + para enviar una solicitud de lugar'}
        </p>
      </div>

      {/* Formulario para agregar lugar */}
      <AddPlaceForm
        isOpen={isAddPlaceOpen}
        onClose={() => setIsAddPlaceOpen(false)}
        onAddPlace={async (newPlace) => {
          if (isAdmin) {
            const placeId = await addPlace(newPlace, user?.id);
            return placeId;
          } else if (user) {
            const request = await insertPlaceRequest(newPlace, user.id);
            if (request) {
              alert('¡Solicitud enviada! El equipo de administración evaluará tu lugar y recibirás una notificación cuando sea revisado.');
            } else {
              alert('Hubo un error al enviar la solicitud. Inténtalo de nuevo.');
            }
          }
          return null;
        }}
      />
    </div>
  );
}


