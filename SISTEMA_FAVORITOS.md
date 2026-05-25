# ❤️ Sistema de Favoritos - Documentación Completa

## 📋 Descripción General

Se creó un **sistema completo de favoritos** que permite a los usuarios:
1. Marcar lugares como favoritos con un click
2. Ver notificación de confirmación
3. Acceder a lista de favoritos en el sidebar
4. Remover favoritos desde dos lugares diferentes
5. Los favoritos **persisten** incluso después de cerrar el navegador

---

## 🏗️ Arquitectura

### 1️⃣ Hook Personalizado: `useFavorites`

**Archivo:** `app/hooks/useFavorites.ts`

```tsx
/**
 * Hook personalizado para manejar favoritos
 * Propósito: Guardar y sincronizar favoritos con localStorage
 */
const { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite } = useFavorites();
```

**Métodos:**

| Método | Parámetro | Retorno | Descripción |
|--------|-----------|---------|-------------|
| `addFavorite(place)` | Place | void | Agrega lugar a favoritos |
| `removeFavorite(placeId)` | number | void | Remueve un lugar |
| `toggleFavorite(place)` | Place | void | Alterna agregar/remover |
| `isFavorite(placeId)` | number | boolean | Verifica si está en favoritos |
| `favorites` | - | Place[] | Array de lugares favoritos |

**Ejemplo de uso:**
```tsx
'use client';
import { useFavorites } from '@/app/hooks/useFavorites';

function MiComponente() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  return (
    <button onClick={() => toggleFavorite(lugar)}>
      {isFavorite(lugar.id) ? '❤️' : '🤍'}
    </button>
  );
}
```

**Cómo funciona internamente:**

```typescript
// 1. Carga favoritos de localStorage al montar
useEffect(() => {
  const saved = localStorage.getItem('lugares_favoritos');
  setFavorites(JSON.parse(saved) || []);
}, []);

// 2. Guarda favoritos en localStorage cada vez que cambian
useEffect(() => {
  localStorage.setItem('lugares_favoritos', JSON.stringify(favorites));
}, [favorites]);
```

---

### 2️⃣ Componente: `Favorites`

**Archivo:** `app/components/Favorites.tsx`

**Propósito:** Mostrar lista interactiva de favoritos en el sidebar

**Props:**
```tsx
interface FavoritesProps {
  onSelectPlace?: (placeId: number) => void; // Callback cuando se selecciona un lugar
}
```

**Características:**

#### ✅ Lista de Favoritos
```tsx
{favorites.length === 0 ? (
  <EmptyState />
) : (
  favorites.map(place => <FavoriteItem place={place} />)
)}
```

#### ✅ FavoriteItem - Información por Lugar
```
┌─────────────────────────┐
│ Café Rainbow        ❤️  │  ← Nombre + botón remover
│ Café                     │  ← Categoría
│ 🌳 Barrio Colombia       │  ← Ubicación
│ ⭐⭐⭐⭐⭐ 5/5 seguridad │  ← Rating
│ 🌈 LGBTIQ+ ♿ Accesible │  ← Badges
└─────────────────────────┘
```

#### ✅ Diseño Responsivo
- Scroll interno (max-height: 96)
- Hover effect para claridad
- Selected state con color purpura

#### ✅ Empty State
Si no hay favoritos, muestra:
```
❤️ (icono grande)
No hay favoritos aún
Explora el mapa y agrega lugares...
```

---

### 3️⃣ Integración en PlaceModal

**Archivo modificado:** `app/components/PlaceModal.tsx`

**Cambios:**
```tsx
// ANTES: Estado local, no persiste
const [isFavorite, setIsFavorite] = useState(false);

// DESPUÉS: Usa hook, persiste en localStorage
const { isFavorite, toggleFavorite } = useFavorites();
const isCurrentFavorite = isFavorite(place.id);

// Click en corazón
<button onClick={() => {
  toggleFavorite(place);  // Agrega/remueve de localStorage
  setShowFavoriteToast(true);  // Muestra notificación
}}>
```

**Toast dinámico:**
```tsx
{showFavoriteToast && (
  <Toast
    message={isCurrentFavorite ? 
      '❤️ Agregado a favoritos' : 
      '💔 Removido de favoritos'
    }
    type='success'
    duration={3000}
  />
)}
```

---

### 4️⃣ Integración en Sidebar (page.tsx)

**Cambios:**

#### 📑 Pestañas
```tsx
{/* PESTAÑA 1: Inicio */}
<button onClick={() => setSidebarTab('inicio')}>
  <Info size={16} /> Inicio
</button>

{/* PESTAÑA 2: Favoritos */}
<button onClick={() => setSidebarTab('favoritos')}>
  <Heart size={16} /> Favoritos
</button>
```

#### 🖼️ Contenido dinámico
```tsx
{sidebarTab === 'inicio' && (
  <div>{/* Contenido original */}</div>
)}

{sidebarTab === 'favoritos' && (
  <Favorites onSelectPlace={handleSelectPlace} />
)}
```

---

## 💾 Persistencia (localStorage)

### Cómo se guarda
```tsx
// Clave: 'lugares_favoritos'
// Valor: JSON array de objetos Place

localStorage.setItem('lugares_favoritos', JSON.stringify([
  { id: 1, name: 'Café Rainbow', ... },
  { id: 3, name: 'Parque Bolívar', ... },
]))
```

### Cómo se recupera
```tsx
useEffect(() => {
  const saved = localStorage.getItem('lugares_favoritos');
  if (saved) {
    const parsed = JSON.parse(saved);
    setFavorites(parsed);  // ✅ Se cargan automáticamente
  }
}, []);
```

### Casos de uso
- ✅ Usuario agrega lugar a favoritos
- ✅ Cierra navegador
- ✅ Regresa semanas después
- ✅ Sus favoritos siguen ahí

---

## 🔄 Flujo de Interacción

### Escenario 1: Agregar a Favoritos
```
1. Usuario abre detalle de lugar (PlaceModal)
2. Click en corazón ❤️
   ├─ toggleFavorite(place) se ejecuta
   ├─ Hook agrega lugar a state
   ├─ useEffect guarda en localStorage
   ├─ Toast muestra "❤️ Agregado a favoritos"
   └─ isFavorite ahora retorna true
```

### Escenario 2: Ver Favoritos
```
1. Usuario abre sidebar
2. Click en pestaña "Favoritos"
   ├─ sidebarTab = 'favoritos'
   ├─ Componente Favorites se renderiza
   ├─ Hook useFavorites carga desde localStorage
   └─ Se muestra lista de favoritos
```

### Escenario 3: Remover de Favoritos
```
1. Usuario en pestaña Favoritos
2. Click en ❤️ de un lugar
   ├─ removeFavorite(id) se ejecuta
   ├─ Hook remueve del estado
   ├─ useEffect actualiza localStorage
   └─ Lista se actualiza automáticamente
```

---

## 🎨 Estilos y Estados Visuales

### Estados del Corazón
```
🤍 No favorito (vacío)
❤️ Es favorito (lleno + rojo)
```

### Estados de Item Favorito
```
Hover:      Borde púrpura, sombra
Selected:   Fondo púrpura claro
Normal:     Borde gris
```

### Empty State
```
- Icono grande gris
- Texto descriptivo
- Call to action
- Responsive en móvil
```

---

## 📱 Responsive Design

### Pestaña Favoritos
- **Mobile (280px):** Stack vertical, sin scroll horizontal
- **Tablet (600px):** Igual, ancho completo
- **Desktop:** Igual, 320px ancho máximo

### Lista de Favoritos
- **Max height:** 384px (24rem)
- **Overflow:** Auto scroll
- **Cards:** Full width, padding adaptativo

### FavoriteItem
- **Truncate:** Nombre se corta si es muy largo
- **Icons:** Tamaño 14-18px adaptativo
- **Badges:** Flex wrap en móvil

---

## ⚡ Optimizaciones

### 1. Evitar Duplicados
```tsx
// No agrega si ya existe
const addFavorite = (place) => {
  if (favorites.some(p => p.id === place.id)) {
    return;  // ← Ya está, no hacer nada
  }
  setFavorites([...favorites, place]);
};
```

### 2. Sincronización Automática
```tsx
// Todos los componentes ven cambios en tiempo real
// Sin necesidad de pasar props
const { favorites } = useFavorites();  // ← Siempre actualizado
```

### 3. LocalStorage Seguro
```tsx
try {
  const saved = localStorage.getItem('lugares_favoritos');
  if (saved) setFavorites(JSON.parse(saved));
} catch (error) {
  console.error('Error cargando favoritos:', error);
  // ← Maneja errores sin romper la app
}
```

---

## 🧪 Testing Checklist

- [ ] Agregar lugar a favoritos muestra notificación
- [ ] Corazón cambia de color al agregar
- [ ] Aparece en pestaña "Favoritos"
- [ ] Remover de favoritos actualiza lista
- [ ] Cerrar y abrir navegador, favoritos persisten
- [ ] Remover desde Favorites component actualiza PlaceModal
- [ ] Empty state se muestra cuando no hay favoritos
- [ ] Responsive en 280x526px
- [ ] Botón remover no cierra el modal innecesariamente

---

## 🚀 Posibles Mejoras Futuras

1. **Backend:** Guardar favoritos en base de datos por usuario
2. **Sincronización:** Sincronizar favoritos entre dispositivos
3. **Animación:** Animación de corazón "pulse" al agregar
4. **Estadísticas:** Mostrar contador de favoritos totales
5. **Compartir:** Opción para compartir lista de favoritos
6. **Filtros:** Filtrar favoritos por categoría
7. **Orden:** Permitir ordenar por fecha añadida o nombre
