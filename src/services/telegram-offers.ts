/**
 * Servicio para gestión de ofertas del bot de Telegram
 */
import { minioStorage } from '../modules/minio/index';
import { TelegramOffer, TelegramCarousel, TelegramFilters, TelegramUser, TELEGRAM_CAROUSEL_CONFIG } from '../types/telegram-offers';

export class TelegramOffersService {
  private static instance: TelegramOffersService;

  public static getInstance(): TelegramOffersService {
    if (!TelegramOffersService.instance) {
      TelegramOffersService.instance = new TelegramOffersService();
    }
    return TelegramOffersService.instance;
  }

  /**
   * Guardar ofertas en MinIO
   */
  async saveOffers(offers: TelegramOffer[]): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `telegram/offers/${timestamp}.json`;
      
      const data = {
        offers,
        timestamp: new Date(),
        count: offers.length
      };

      await minioStorage.saveData(key, data);
      console.log(`✅ ${offers.length} ofertas guardadas en MinIO: ${key}`);
    } catch (error) {
      console.error('❌ Error guardando ofertas:', error);
      throw error;
    }
  }

  /**
   * Obtener ofertas con filtros y paginación
   */
  async getOffers(
    page: number = 0,
    filters?: TelegramFilters
  ): Promise<TelegramCarousel> {
    try {
      // Obtener ofertas más recientes de MinIO
      const latestOffers = await this.getLatestOffers();
      
      // Aplicar filtros
      let filteredOffers = this.applyFilters(latestOffers, filters);
      
      // Calcular paginación
      const itemsPerPage = TELEGRAM_CAROUSEL_CONFIG.ITEMS_PER_PAGE;
      const totalCount = filteredOffers.length;
      const totalPages = Math.ceil(totalCount / itemsPerPage);
      const startIndex = page * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      const paginatedOffers = filteredOffers.slice(startIndex, endIndex);

      return {
        offers: paginatedOffers,
        totalCount,
        currentPage: page,
        totalPages,
        filters
      };
    } catch (error) {
      console.error('❌ Error obteniendo ofertas:', error);
      return {
        offers: [],
        totalCount: 0,
        currentPage: 0,
        totalPages: 0,
        filters
      };
    }
  }

  /**
   * Obtener ofertas más recientes de MinIO
   */
  private async getLatestOffers(): Promise<TelegramOffer[]> {
    try {
      const objects = await minioStorage.listObjects('telegram/offers/');
      
      if (objects.length === 0) {
        return this.getMockOffers(); // Fallback a datos mock
      }

      // Obtener el archivo más reciente
      const latestObject = objects.sort((a, b) => 
        new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
      )[0];

      const data = await minioStorage.loadData(latestObject.name);
      return data.offers || [];
    } catch (error) {
      console.warn('⚠️ Error cargando ofertas de MinIO, usando datos mock:', error);
      return this.getMockOffers();
    }
  }

  /**
   * Aplicar filtros a las ofertas
   */
  private applyFilters(offers: TelegramOffer[], filters?: TelegramFilters): TelegramOffer[] {
    if (!filters) return offers;

    return offers.filter(offer => {
      // Filtro por categoría
      if (filters.categoria && offer.categoria !== filters.categoria) {
        return false;
      }

      // Filtro por precio mínimo
      if (filters.precioMin && offer.precio < filters.precioMin) {
        return false;
      }

      // Filtro por precio máximo
      if (filters.precioMax && offer.precio > filters.precioMax) {
        return false;
      }

      // Filtro por marca
      if (filters.marca && !offer.marca.toLowerCase().includes(filters.marca.toLowerCase())) {
        return false;
      }

      // Filtro por descuento mínimo
      if (filters.descuentoMin && (!offer.descuento || offer.descuento < filters.descuentoMin)) {
        return false;
      }

      // Filtro por disponibilidad
      if (filters.disponible && offer.estatus !== 'disponible') {
        return false;
      }

      // Filtro por talla
      if (filters.talla && (!offer.tallas || !offer.tallas.includes(filters.talla))) {
        return false;
      }

      // Filtro por color
      if (filters.color && (!offer.colores || !offer.colores.includes(filters.color))) {
        return false;
      }

      return true;
    });
  }

  /**
   * Guardar usuario de Telegram
   */
  async saveUser(user: TelegramUser): Promise<void> {
    try {
      const key = `telegram/users/${user.chatId}.json`;
      await minioStorage.saveData(key, user);
      console.log(`✅ Usuario guardado: ${user.chatId}`);
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario de Telegram
   */
  async getUser(chatId: string): Promise<TelegramUser | null> {
    try {
      const key = `telegram/users/${chatId}.json`;
      const userData = await minioStorage.loadData(key);
      return userData as TelegramUser;
    } catch (error) {
      console.warn(`⚠️ Usuario no encontrado: ${chatId}`);
      return null;
    }
  }

  /**
   * Agregar oferta a favoritos
   */
  async addToFavorites(chatId: string, offerId: string): Promise<void> {
    try {
      const user = await this.getUser(chatId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.favoritos.includes(offerId)) {
        user.favoritos.push(offerId);
        user.ultimaActividad = new Date();
        await this.saveUser(user);
      }
    } catch (error) {
      console.error('❌ Error agregando a favoritos:', error);
      throw error;
    }
  }

  /**
   * Remover oferta de favoritos
   */
  async removeFromFavorites(chatId: string, offerId: string): Promise<void> {
    try {
      const user = await this.getUser(chatId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      user.favoritos = user.favoritos.filter(id => id !== offerId);
      user.ultimaActividad = new Date();
      await this.saveUser(user);
    } catch (error) {
      console.error('❌ Error removiendo de favoritos:', error);
      throw error;
    }
  }

  /**
   * Obtener ofertas favoritas de un usuario
   */
  async getFavorites(chatId: string): Promise<TelegramOffer[]> {
    try {
      const user = await this.getUser(chatId);
      if (!user || user.favoritos.length === 0) {
        return [];
      }

      const allOffers = await this.getLatestOffers();
      return allOffers.filter(offer => user.favoritos.includes(offer.id));
    } catch (error) {
      console.error('❌ Error obteniendo favoritos:', error);
      return [];
    }
  }

  /**
   * Datos mock para pruebas
   */
  private getMockOffers(): TelegramOffer[] {
    return [
      {
        id: 'mock-1',
        precio: 299.99,
        precioOriginal: 399.99,
        referencia: 'NK-AIR-001',
        categoria: 'hombre',
        cantidadDisponible: 15,
        estatus: 'disponible',
        imagenes: [
          {
            id: 'img-1',
            url: 'https://via.placeholder.com/375x667/FF6B6B/FFFFFF?text=Nike+Air+Max',
            width: 375,
            height: 667,
            alt: 'Nike Air Max - Vista principal',
            isMain: true
          },
          {
            id: 'img-2',
            url: 'https://via.placeholder.com/375x667/4ECDC4/FFFFFF?text=Nike+Air+Max+2',
            width: 375,
            height: 667,
            alt: 'Nike Air Max - Vista lateral',
            isMain: false
          }
        ],
        titulo: 'Nike Air Max 270 React',
        marca: 'Nike',
        descripcion: 'Zapatillas deportivas con tecnología React para máximo confort',
        url: 'https://farfetch.com/nike-air-max-270',
        descuento: 25,
        tallas: ['40', '41', '42', '43', '44'],
        colores: ['Negro', 'Blanco', 'Gris'],
        timestamp: new Date()
      },
      {
        id: 'mock-2',
        precio: 1299.99,
        precioOriginal: 1599.99,
        referencia: 'GC-BELT-002',
        categoria: 'mujer',
        cantidadDisponible: 3,
        estatus: 'limitado',
        imagenes: [
          {
            id: 'img-3',
            url: 'https://via.placeholder.com/375x667/FFD93D/000000?text=Gucci+Belt',
            width: 375,
            height: 667,
            alt: 'Cinturón Gucci - Vista principal',
            isMain: true
          }
        ],
        titulo: 'Cinturón Gucci GG Marmont',
        marca: 'Gucci',
        descripcion: 'Cinturón de cuero con hebilla GG dorada',
        url: 'https://farfetch.com/gucci-gg-marmont-belt',
        descuento: 19,
        tallas: ['75', '80', '85', '90'],
        colores: ['Negro', 'Marrón'],
        timestamp: new Date()
      },
      {
        id: 'mock-3',
        precio: 89.99,
        precioOriginal: 129.99,
        referencia: 'AD-KIDS-003',
        categoria: 'niño',
        cantidadDisponible: 25,
        estatus: 'disponible',
        imagenes: [
          {
            id: 'img-4',
            url: 'https://via.placeholder.com/375x667/6BCF7F/FFFFFF?text=Adidas+Kids',
            width: 375,
            height: 667,
            alt: 'Adidas Kids - Vista principal',
            isMain: true
          }
        ],
        titulo: 'Adidas Superstar Kids',
        marca: 'Adidas',
        descripcion: 'Zapatillas clásicas para niños',
        url: 'https://farfetch.com/adidas-superstar-kids',
        descuento: 31,
        tallas: ['28', '29', '30', '31', '32'],
        colores: ['Blanco', 'Negro'],
        timestamp: new Date()
      }
    ];
  }
}
