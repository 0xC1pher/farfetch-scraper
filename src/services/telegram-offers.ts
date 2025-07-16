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
   * Obtener ofertas más recientes del directorio local data/scraping
   */
  private async getLatestOffers(): Promise<TelegramOffer[]> {
    try {
      console.log('🔍 Obteniendo ofertas desde directorio local data/scraping...');

      const fs = await import('fs/promises');
      const path = await import('path');
      const dataDir = path.join(process.cwd(), 'data', 'scraping');

      // Verificar si el directorio existe
      try {
        await fs.access(dataDir);
      } catch {
        console.log('⚠️ Directorio data/scraping no existe, usando datos mock');
        return this.getMockOffers();
      }

      const offers: TelegramOffer[] = [];
      const modules = await fs.readdir(dataDir);
      console.log(`📁 Módulos encontrados: ${modules.join(', ')}`);

      for (const module of modules) {
        const moduleDir = path.join(dataDir, module);
        try {
          const files = await fs.readdir(moduleDir);
          const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 5);

          for (const file of jsonFiles) {
            try {
              const content = await fs.readFile(path.join(moduleDir, file), 'utf-8');
              const data = JSON.parse(content);

              // Manejar diferentes estructuras de datos según el módulo
              let moduleOffers: any[] = [];

              if (data.data?.offers && Array.isArray(data.data.offers)) {
                moduleOffers = data.data.offers;
              } else if (data.items && Array.isArray(data.items)) {
                moduleOffers = data.items;
              } else if (data.extractedData && Array.isArray(data.extractedData)) {
                moduleOffers = data.extractedData.map((item: any) => item.data || item);
              } else if (Array.isArray(data)) {
                moduleOffers = data;
              }

              // Convertir ofertas al formato Telegram
              for (const offer of moduleOffers) {
                const telegramOffer = this.convertRealDataToTelegramOffer(offer, module);
                if (telegramOffer) offers.push(telegramOffer);
              }

            } catch (error) {
              console.warn(`⚠️ Error leyendo archivo ${file}:`, error);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error leyendo módulo ${module}:`, error);
        }
      }

      // Eliminar duplicados por ID
      const uniqueOffers = offers.filter((offer, index, self) =>
        index === self.findIndex(o => o.id === offer.id)
      );

      console.log(`📊 Total ofertas encontradas: ${offers.length}`);
      console.log(`🔍 Ofertas únicas: ${uniqueOffers.length}`);

      // En producción, NO usar datos mock
      if (uniqueOffers.length === 0) {
        console.log('⚠️ No se encontraron ofertas reales en data/scraping');
        return [];
      }

      // Ordenar por timestamp más reciente
      uniqueOffers.sort((a, b) =>
        new Date(b.timestamp || b.fechaCreacion).getTime() -
        new Date(a.timestamp || a.fechaCreacion).getTime()
      );

      return uniqueOffers;
    } catch (error) {
      console.error('❌ Error cargando ofertas desde directorio local:', error);
      return [];
    }
  }

  /**
   * Convertir datos reales de scraping al formato Telegram
   */
  private convertRealDataToTelegramOffer(offer: any, module: string): TelegramOffer | null {
    try {
      // Extraer campos básicos con diferentes nombres posibles
      const id = offer.id || `${module}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const title = offer.title || offer.name || offer.titulo || 'Producto sin título';
      const price = parseFloat(offer.price || offer.precio || 0);
      const originalPrice = parseFloat(offer.originalPrice || offer.precioOriginal || offer.original_price || price);
      const brand = offer.brand || offer.marca || 'Designer Brand';
      const imageUrl = offer.imageUrl || offer.image || offer.img || offer.src || null;

      // Calcular descuento
      let discount = 0;
      if (offer.discount !== undefined) {
        discount = parseFloat(offer.discount);
      } else if (originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

      return {
        id,
        precio: price,
        precioOriginal: originalPrice,
        referencia: offer.reference || offer.referencia || id,
        categoria: this.mapCategory(offer.category || offer.categoria || 'general'),
        cantidadDisponible: offer.stock || offer.cantidadDisponible || 1,
        estatus: offer.availability === 'in_stock' || offer.available ? 'disponible' : 'agotado',
        imagenes: imageUrl ? [{
          id: `img_${id}`,
          url: imageUrl,
          width: 375,
          height: 667,
          alt: `${title} - Vista principal`,
          isMain: true
        }] : [],
        titulo: title,
        marca: brand,
        descripcion: offer.description || offer.descripcion || `${brand} ${title}`,
        url: offer.url || 'https://www.farfetch.com',
        descuento: discount,
        tallas: offer.sizes || offer.tallas || [],
        colores: offer.colors || offer.colores || [],
        timestamp: new Date(offer.timestamp || offer.extractedAt || Date.now()),
        fechaCreacion: new Date(offer.timestamp || offer.extractedAt || Date.now()).toISOString(),
        fuente: module as 'browser-mcp' | 'scraperr' | 'deepscrape' | 'telegram'
      };
    } catch (error) {
      console.warn(`⚠️ Error convirtiendo oferta de ${module}:`, error);
      return null;
    }
  }

  /**
   * Mapear categorías a formato estándar
   */
  private mapCategory(category: string): 'hombre' | 'mujer' | 'niño' {
    const cat = category.toLowerCase();
    if (cat.includes('women') || cat.includes('mujer') || cat.includes('woman')) return 'mujer';
    if (cat.includes('men') || cat.includes('hombre') || cat.includes('man')) return 'hombre';
    if (cat.includes('kid') || cat.includes('niño') || cat.includes('child')) return 'niño';
    return 'mujer'; // Default para Farfetch women sale
  }

  /**
   * Obtener ofertas almacenadas directamente en telegram/offers/
   */
  private async getStoredTelegramOffers(): Promise<TelegramOffer[]> {
    try {
      const objects = await minioStorage.listObjects('telegram/offers/');

      if (objects.length === 0) {
        return [];
      }

      // Obtener el archivo más reciente
      const latestObject = objects.sort((a, b) =>
        new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
      )[0];

      const data = await minioStorage.loadData(latestObject.name);
      return data.offers || [];
    } catch (error) {
      console.warn('⚠️ Error cargando ofertas de telegram/offers/:', error);
      return [];
    }
  }

  /**
   * Convertir datos de Scraperr a oferta de Telegram
   */
  private convertScaperrToTelegramOffer(product: any, item: any): TelegramOffer | null {
    try {
      return {
        id: `scraperr_${product.id || Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        precio: parseFloat(product.price) || 0,
        referencia: product.reference || product.id || 'N/A',
        categoria: this.mapCategory(product.category),
        cantidadDisponible: product.stock || 1,
        estatus: product.available !== false ? 'disponible' : 'agotado',
        imagenes: [{
          url: product.image || '/assets/placeholder.jpg',
          width: 375,
          height: 667,
          optimized: true
        }],
        marca: product.brand || 'Unknown',
        titulo: product.title || product.name || 'Producto extraído por Scraperr',
        descripcion: product.description || product.desc,
        tallas: Array.isArray(product.sizes) ? product.sizes : [],
        colores: Array.isArray(product.colors) ? product.colors : [],
        descuento: product.discount || 0,
        fechaCreacion: item.timestamp || new Date().toISOString(),
        fuente: 'scraperr'
      };
    } catch (error) {
      console.warn('Error converting scraperr product:', error);
      return null;
    }
  }

  /**
   * Convertir datos de DeepScrape a oferta de Telegram
   */
  private convertDeepScrapeToTelegramOffer(extracted: any, item: any): TelegramOffer | null {
    try {
      const data = extracted.data || extracted;

      return {
        id: `deepscrape_${extracted.extractedBy || Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        precio: parseFloat(data.price || data.precio) || 0,
        referencia: data.reference || data.ref || 'N/A',
        categoria: this.mapCategory(data.category || data.categoria),
        cantidadDisponible: data.stock || data.cantidad || 1,
        estatus: data.available !== false ? 'disponible' : 'agotado',
        imagenes: [{
          url: data.image || data.imagen || '/assets/placeholder.jpg',
          width: 375,
          height: 667,
          optimized: true
        }],
        marca: data.brand || data.marca || 'Unknown',
        titulo: data.title || data.name || data.descripcion || 'Producto extraído por IA',
        descripcion: data.description || data.desc,
        tallas: Array.isArray(data.sizes || data.tallas) ? (data.sizes || data.tallas) : [],
        colores: Array.isArray(data.colors || data.colores) ? (data.colors || data.colores) : [],
        descuento: data.discount || data.descuento || 0,
        fechaCreacion: item.timestamp || new Date().toISOString(),
        fuente: 'deepscrape'
      };
    } catch (error) {
      console.warn('Error converting deepscrape data:', error);
      return null;
    }
  }

  /**
   * Convertir datos de Browser-MCP a oferta de Telegram
   */
  private convertBrowserMcpToTelegramOffer(product: any, item: any): TelegramOffer | null {
    try {
      return {
        id: `browser-mcp_${product.id || Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        precio: parseFloat(product.price) || 0,
        precioOriginal: parseFloat(product.originalPrice) || parseFloat(product.price) || 0,
        referencia: product.reference || product.id || 'N/A',
        categoria: this.mapCategory(product.category),
        cantidadDisponible: product.stock || 1,
        estatus: 'disponible',
        imagenes: [{
          id: `img-${product.id || Date.now()}`,
          url: product.imageUrl || product.image || '/assets/placeholder.jpg',
          width: 375,
          height: 667,
          alt: product.title || 'Producto',
          isMain: true
        }],
        marca: product.brand || 'Unknown',
        titulo: product.title || 'Producto de sesión autenticada',
        descripcion: product.description || product.desc || `${product.brand} ${product.title}`,
        url: product.url || 'https://www.farfetch.com',
        tallas: Array.isArray(product.sizes) ? product.sizes : [],
        colores: Array.isArray(product.colors) ? product.colors : [],
        descuento: product.discount || 0,
        fechaCreacion: item.timestamp || new Date().toISOString(),
        timestamp: product.timestamp || item.timestamp || new Date().toISOString(),
        fuente: 'browser-mcp'
      };
    } catch (error) {
      console.warn('Error converting browser-mcp product:', error);
      return null;
    }
  }



  /**
   * Eliminar ofertas duplicadas por referencia
   */
  private removeDuplicateOffers(offers: TelegramOffer[]): TelegramOffer[] {
    const seen = new Set<string>();
    return offers.filter(offer => {
      const key = `${offer.referencia}_${offer.marca}_${offer.precio}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
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
        timestamp: new Date(),
        fechaCreacion: new Date().toISOString(),
        fuente: 'telegram'
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
        timestamp: new Date(),
        fechaCreacion: new Date().toISOString(),
        fuente: 'telegram'
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
        timestamp: new Date(),
        fechaCreacion: new Date().toISOString(),
        fuente: 'telegram'
      }
    ];
  }
}
