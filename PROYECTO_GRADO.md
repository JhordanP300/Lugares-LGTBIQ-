# 🌈 Lugares Seguros - Plataforma LGBTIQ+ del Valle de Aburrá

## Descripción
Plataforma web interactiva y segura para que la comunidad LGBTIQ+ del Valle de Aburrá (Medellín, Antioquia) encuentre y comparta espacios donde se sienten protegidas y bienvenidas.

## ✨ Características

### 🗺️ Mapa Interactivo
- Mapa completo del Valle de Aburrá con barrios específicos
- Marcadores de colores según la bandera LGBTIQ+ para diferentes categorías
- Zoom e interactividad total
- Basado en OpenStreetMap

### 📍 Lugares Destacados
La plataforma incluye 8 lugares iniciales:
- ☕ **Cafés**: Café Rainbow
- 🍹 **Bares**: La Comunidad Bar
- 🏨 **Hoteles**: Hotel Identidad
- 🌳 **Parques**: Parque Explora
- 🎨 **Centros Culturales**: Centro Cultural LGBTIQ+, Biblioteca Pública Piloto
- ⚕️ **Salud**: Clínica de Salud Integral
- 🍽️ **Restaurantes**: Restaurante Diverso

### 📋 Funcionalidades por Lugar

#### 1️⃣ Información Detallada
- Descripción del lugar
- Dirección exacta
- Teléfono y website
- Horario de atención
- ⭐ Calificación de seguridad (1-5 estrellas)
- ♿ Información de accesibilidad
- Botón "Cómo llegar" (integrado con Google Maps)

#### 2️⃣ Comentarios Comunitarios
- Publicar comentarios anónimos o con nombre
- Calificación de experiencia (1-5 estrellas)
- Ver experiencias de otros visitantes
- Eliminar comentarios propios

#### 3️⃣ Galería de Fotos
- Subir fotos del lugar
- Galería comunitaria
- Vista expandida de fotos
- Información del autor y fecha

### 🎨 Diseño Inclusivo
- **Colores de la Bandera LGBTIQ+**: Rojo, Naranja, Amarillo, Verde, Azul, Índigo, Violeta
- **Interfaz accesible**: Diseño responsive para móvil y desktop
- **Navegación intuitiva**: Sidebar con información y tutorial
- **Contraste adecuado**: Para mejor legibilidad

## 🚀 Cómo Usar

### Instalación
```bash
cd lugares
npm install
npm run dev
```

El proyecto abrirá en `http://localhost:3000`

### Pasos para Explorar
1. **Abre el mapa**: La plataforma carga automáticamente el mapa completo
2. **Explora lugares**: Haz click en cualquier marcador del mapa
3. **Lee información**: En el modal, consulta detalles del lugar
4. **Cómo llegar**: Usa el botón para abrir Google Maps
5. **Comenta**: Comparte tu experiencia en la pestaña de comentarios
6. **Sube fotos**: Comparte fotos del lugar en la galería

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16.2.6
- **Lenguaje**: TypeScript
- **UI**: React 19.2.4
- **Estilos**: Tailwind CSS 4
- **Mapas**: Leaflet + React-Leaflet
- **Iconos**: Lucide React

## 📁 Estructura del Proyecto

```
app/
├── components/
│   ├── Map.tsx              # Mapa interactivo
│   ├── PlaceModal.tsx       # Modal con información
│   ├── Comments.tsx         # Sistema de comentarios
│   └── PhotoGallery.tsx     # Galería de fotos
├── lib/
│   └── places.ts            # Base de datos de lugares
├── layout.tsx               # Layout principal
├── page.tsx                 # Página de inicio
└── globals.css              # Estilos globales
```

## 📊 Base de Datos de Lugares

Cada lugar incluye:
```typescript
{
  id: number;
  name: string;
  description: string;
  category: 'cafe' | 'bar' | 'hotel' | 'parque' | 'culturalCenter' | 'health';
  address: string;
  barrio: string;
  coordinates: [lat, lng];
  phone?: string;
  website?: string;
  hours?: string;
  safetyRating: 1-5;
  lgbtiqFriendly: boolean;
  accessibility: string[];
}
```

## 🔒 Privacidad y Seguridad

- Los comentarios y fotos son públicos (el usuario debe estar consciente)
- No se requiere autenticación para comentar o subir fotos
- Todos pueden eliminar sus propios comentarios y fotos
- Se mantiene la privacidad de los usuarios sin registros personales

## 🎓 Proyecto de Grado

Este proyecto fue desarrollado como iniciativa para la comunidad LGBTIQ+ del Valle de Aburrá, proporcionando una herramienta segura y accesible para:
- Descubrir espacios inclusivos
- Compartir experiencias
- Construir comunidad
- Promover respeto y diversidad

## 🤝 Contribuciones Futuras

Posibles mejoras:
- Sistema de autenticación opcional
- Base de datos persistente (Backend)
- Filtros avanzados por categoría
- Notificaciones de nuevos lugares
- Integración con redes sociales
- App móvil nativa
- Moderación de contenido

## 📧 Contacto

Para preguntas o sugerencias sobre lugares seguros, contáctanos.

---

**Hecho con ❤️ para la comunidad LGBTIQ+ del Valle de Aburrá** 🌈
