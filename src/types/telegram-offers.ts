/**
 * Tipos específicos para ofertas del bot de Telegram
 */

export interface TelegramOffer {
  id: string;
  precio: number;
  precioOriginal?: number;
  referencia: string;
  categoria: 'niño' | 'hombre' | 'mujer' | 'unisex';
  cantidadDisponible: number;
  estatus: 'disponible' | 'agotado' | 'limitado';
  imagenes: TelegramImage[];
  titulo?: string;
  marca: string;
  descripcion?: string;
  url?: string;
  descuento?: number;
  tallas?: string[];
  colores?: string[];
  timestamp?: Date;
  fechaCreacion: string; // ISO string para compatibilidad
  fuente: 'browser-mcp' | 'scraperr' | 'deepscrape' | 'telegram';
}

export interface TelegramImage {
  id?: string;
  url: string;
  width: number;
  height: number;
  alt?: string;
  isMain?: boolean;
  optimized?: boolean; // Para imágenes optimizadas para móvil
}

export interface TelegramCarousel {
  offers: TelegramOffer[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters?: TelegramFilters;
}

export interface TelegramFilters {
  categoria?: 'niño' | 'hombre' | 'mujer' | 'unisex';
  precioMin?: number;
  precioMax?: number;
  marca?: string;
  descuentoMin?: number;
  disponible?: boolean;
  talla?: string;
  color?: string;
}

export interface TelegramUser {
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  favoritos: string[]; // IDs de ofertas favoritas
  filtros: TelegramFilters;
  ultimaActividad: Date;
}

/**
 * Configuración para imágenes optimizadas para móvil
 */
export const TELEGRAM_IMAGE_CONFIG = {
  // Tamaños estándar para móvil (como Tinder)
  CAROUSEL: {
    width: 375,  // Ancho estándar de iPhone
    height: 667, // Alto estándar de iPhone (proporción 9:16)
    quality: 85
  },
  THUMBNAIL: {
    width: 150,
    height: 150,
    quality: 80
  },
  DETAIL: {
    width: 750,  // 2x para pantallas retina
    height: 1334, // 2x para pantallas retina
    quality: 90
  }
};

/**
 * Configuración del carrusel para Telegram
 */
export const TELEGRAM_CAROUSEL_CONFIG = {
  ITEMS_PER_PAGE: 5,
  MAX_IMAGES_PER_OFFER: 5,
  CACHE_DURATION: 300000, // 5 minutos
  SWIPE_THRESHOLD: 50, // píxeles para activar swipe
  AUTO_ADVANCE: false,
  SHOW_INDICATORS: true
};
