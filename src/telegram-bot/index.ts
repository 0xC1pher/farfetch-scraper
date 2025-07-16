import TelegramBot from 'node-telegram-bot-api';
import { SimpleOrchestrator } from '../orchestrator/simple-orchestrator';
import { workflowEngine } from '../workflow-engine/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import axios from 'axios';
import sharp from 'sharp';

export interface BotConfig {
  token: string;
  adminChatIds?: string[];
  maxOffersPerMessage?: number;
  defaultFilters?: {
    maxPrice?: number;
    minDiscount?: number;
  };
}

export interface UserSession {
  chatId: string;
  state: 'idle' | 'awaiting_credentials' | 'awaiting_filters' | 'browsing';
  pendingFilter?: 'minPrice' | 'maxPrice' | 'brand' | 'minDiscount';
  credentials?: {
    email: string;
    password: string;
  };
  filters?: {
    minPrice?: string | number;
    maxPrice?: string | number;
    brand?: string;
    category?: string;
    minDiscount?: string | number;
    [key: string]: string | number | undefined;
  };
  favorites?: string[];
  lastActivity: Date;
}

// Ajuste de tipo para aceptar string | number | undefined en session.filters
export interface UserSession {
  chatId: string;
  state: 'idle' | 'awaiting_credentials' | 'awaiting_filters' | 'browsing';
  pendingFilter?: 'minPrice' | 'maxPrice' | 'brand' | 'minDiscount';
  credentials?: {
    email: string;
    password: string;
  };
  filters?: {
    minPrice?: string | number;
    maxPrice?: string | number;
    brand?: string;
    category?: string;
    minDiscount?: string | number;
    [key: string]: string | number | undefined;
  };
  favorites?: string[];
  lastActivity: Date;
}

export class MexaTelegramBot {
  private bot: TelegramBot;
  private orchestrator: SimpleOrchestrator | null;
  private config: BotConfig;
  private userSessions: Map<string, UserSession> = new Map();
  private isRunning: boolean = false;

  constructor(config: BotConfig) {
    this.config = {
      maxOffersPerMessage: 10,
      defaultFilters: { maxPrice: 5000, minDiscount: 0 },
      ...config
    };

    this.bot = new TelegramBot(config.token, { polling: false });
    this.orchestrator = null; // Se inicializará en start()
    this.setupCommands();
    this.setupCallbacks();
  }

  /**
   * Iniciar el bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🤖 Bot ya está ejecutándose');
      return;
    }

    try {
      // Inicializar orquestador
      this.orchestrator = await SimpleOrchestrator.create();
      console.log('✅ Orquestador inicializado');

      await this.bot.startPolling();
      this.isRunning = true;
      console.log('🤖 Bot de Telegram iniciado correctamente');

      // Limpiar sesiones expiradas cada hora
      setInterval(() => this.cleanExpiredSessions(), 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error iniciando bot:', error.message);
      } else {
        console.error('❌ Error iniciando bot:', error);
      }
      throw error;
    }
  }

  /**
   * Detener el bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('🤖 Bot ya está detenido');
      return;
    }

    try {
      await this.bot.stopPolling();
      this.isRunning = false;
      console.log('🤖 Bot de Telegram detenido correctamente');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error deteniendo bot:', error.message);
      } else {
        console.error('❌ Error deteniendo bot:', error);
      }
      throw error;
    }
  }

  /**
   * Configurar comandos del bot
   */
  private setupCommands(): void {
    // Comando /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleStartCommand(chatId);
    });

    // Comando /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleHelpCommand(chatId);
    });

    // Comando /search
    this.bot.onText(/\/search/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleSearchCommand(chatId);
    });

    // Comando /filters
    this.bot.onText(/\/filters/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleFiltersCommand(chatId);
    });

    // Comando /favorites
    this.bot.onText(/\/favorites/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleFavoritesCommand(chatId);
    });

    // Comando /status
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleStatusCommand(chatId);
    });

    // Manejar mensajes de texto
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id.toString();
        await this.handleTextMessage(chatId, msg.text);
      }
    });
  }

  /**
   * Configurar callbacks del bot
   */
  private setupCallbacks(): void {
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id.toString();
      const data = query.data;

      if (!chatId || !data) return;

      try {
        if (data.startsWith('page_')) {
          await this.handlePageCallback(chatId, data);
        } else if (data.startsWith('fav_')) {
          await this.handleFavoriteCallback(chatId, data);
        } else if (data.startsWith('filter_')) {
          await this.handleFilterCallback(chatId, data);
        }

        // Responder al callback para quitar el loading
        await this.bot.answerCallbackQuery(query.id);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error handling callback:', error.message);
        } else {
          console.error('Error handling callback:', error);
        }
        await this.bot.answerCallbackQuery(query.id, { text: 'Error procesando solicitud' });
      }
    });
  }

  /**
   * Manejar comando /start
   */
  private async handleStartCommand(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    session.state = 'idle';

    const welcomeMessage = `
🛍️ *¡Bienvenido a Mexa Bot!*

Soy tu asistente personal para encontrar las mejores ofertas en Farfetch.

*Comandos disponibles:*
/search - Buscar ofertas
/filters - Configurar filtros
/favorites - Ver favoritos
/status - Estado del sistema
/help - Mostrar ayuda

¡Empecemos! Usa /search para buscar ofertas.
    `;

    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Manejar comando /help
   */
  private async handleHelpCommand(chatId: string): Promise<void> {
    const helpMessage = `
🤖 *Ayuda de Mexa Bot*

*Comandos principales:*
• /start - Iniciar el bot
• /search - Buscar ofertas en Farfetch
• /filters - Configurar filtros de búsqueda
• /favorites - Ver tus productos favoritos
• /status - Ver estado del sistema

*Cómo usar:*
1. Usa /search para buscar ofertas
2. Configura filtros con /filters
3. Guarda productos en favoritos
4. Navega por páginas con los botones

*Filtros disponibles:*
• Precio mínimo y máximo
• Marca específica
• Descuento mínimo

¿Necesitas más ayuda? Contacta al administrador.
    `;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Manejar comando /search
   */
  private async handleSearchCommand(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    
    try {
      await this.bot.sendMessage(chatId, '🔍 Buscando ofertas...');
      
      const offers = await this.getPublicOffers(session.filters);
      
      if (offers.length === 0) {
        await this.bot.sendMessage(chatId, 
          '😔 No se encontraron ofertas con los filtros actuales.\n\nPrueba ajustar tus filtros con /filters'
        );
        return;
      }

      await this.sendOffers(chatId, offers);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in search command:', error.message);
      } else {
        console.error('Error in search command:', error);
      }
      await this.bot.sendMessage(chatId, '❌ Error buscando ofertas. Intenta más tarde.');
    }
  }

  /**
   * Manejar comando /filters
   */
  private async handleFiltersCommand(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '💰 Precio mínimo', callback_data: 'filter_minprice' },
          { text: '💸 Precio máximo', callback_data: 'filter_maxprice' }
        ],
        [
          { text: '🏷️ Marca', callback_data: 'filter_brand' },
          { text: '🔥 Descuento mín.', callback_data: 'filter_discount' }
        ],
        [
          { text: '🗑️ Limpiar filtros', callback_data: 'filter_clear' }
        ]
      ]
    };

    const currentFilters = session.filters || {};
    const filtersText = Object.keys(currentFilters).length > 0 
      ? `\n*Filtros actuales:*\n${JSON.stringify(currentFilters, null, 2)}`
      : '\n*No hay filtros configurados*';

    await this.bot.sendMessage(chatId, 
      `⚙️ *Configuración de Filtros*${filtersText}\n\nSelecciona qué filtro quieres configurar:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }

  /**
   * Manejar comando /favorites
   */
  private async handleFavoritesCommand(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    
    if (!session.favorites || session.favorites.length === 0) {
      await this.bot.sendMessage(chatId, 
        '💔 No tienes productos favoritos aún.\n\nUsa /search para encontrar productos y agrégalos a favoritos.'
      );
      return;
    }

    await this.bot.sendMessage(chatId, 
      `⭐ *Tus Favoritos (${session.favorites.length})*\n\n` +
      session.favorites.map((id, index) => `${index + 1}. Producto ${id}`).join('\n'),
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Manejar comando /status
   */
  private async handleStatusCommand(chatId: string): Promise<void> {
    if (!this.orchestrator) {
      await this.bot.sendMessage(chatId, '❌ El orquestador no está inicializado.');
      return;
    }
    try {
      const stats = this.orchestrator.getModuleStatus();
      
      const statusMessage = `
🔧 *Estado del Sistema*

*Servicios:*
• Browser MCP: ${stats.browserMCP ? '✅' : '❌'}
• Scraperr: ${stats.scraperr ? '✅' : '❌'}
• DeepScrape: ${stats.deepscrape ? '✅' : '❌'}

*Estadísticas:*
• Sesiones activas: ${this.userSessions.size}
• Última actualización: ${new Date().toLocaleString()}

*Bot:*
• Estado: ${this.isRunning ? '🟢 Activo' : '🔴 Inactivo'}
      `;

      await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting status:', error.message);
      } else {
        console.error('Error getting status:', error);
      }
      await this.bot.sendMessage(chatId, '❌ Error obteniendo estado del sistema.');
    }
  }

  /**
   * Manejar mensajes de texto
   */
  private async handleTextMessage(chatId: string, text: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);

    switch (session.state) {
      case 'awaiting_credentials':
        await this.handleCredentialsInput(chatId, text);
        break;
      
      case 'awaiting_filters':
        await this.handleFilterInput(chatId, text);
        break;

      default:
        await this.bot.sendMessage(chatId,
          'No entiendo ese mensaje. Usa /help para ver los comandos disponibles.'
        );
        break;
    }
  }

  /**
   * Manejar callbacks de página
   */
  private async handlePageCallback(chatId: string, data: string): Promise<void> {
    try {
      const pageNumber = parseInt(data.replace('page_', ''));
      const session = this.getOrCreateSession(chatId);

      const offers = await this.getPublicOffers(session.filters);
      await this.sendOffers(chatId, offers, pageNumber);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in page callback:', error.message);
      } else {
        console.error('Error in page callback:', error);
      }
      await this.bot.sendMessage(chatId, '❌ Error cargando página. Intenta más tarde.');
    }
  }

  /**
   * Manejar callback de favoritos
   */
  private async handleFavoriteCallback(chatId: string, data: string): Promise<void> {
    const offerId = data.replace('fav_', '');
    const session = this.getOrCreateSession(chatId);

    if (!session.favorites) {
      session.favorites = [];
    }

    if (session.favorites.includes(offerId)) {
      session.favorites = session.favorites.filter(id => id !== offerId);
      await this.bot.sendMessage(chatId, '💔 Producto removido de favoritos');
    } else {
      session.favorites.push(offerId);
      await this.bot.sendMessage(chatId, '⭐ Producto agregado a favoritos');
    }
  }

  /**
   * Manejar input de credenciales
   */
  private async handleCredentialsInput(chatId: string, text: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);

    if (!text.includes(':')) {
      await this.bot.sendMessage(chatId,
        '❌ Formato incorrecto. Usa: email:contraseña'
      );
      return;
    }

    const [email, password] = text.split(':');

    if (!email || !password) {
      await this.bot.sendMessage(chatId,
        '❌ Email y contraseña son requeridos. Usa: email:contraseña'
      );
      return;
    }

    session.credentials = { email: email.trim(), password: password.trim() };
    session.state = 'idle';

    await this.bot.sendMessage(chatId,
      '✅ Credenciales guardadas correctamente.\n\nAhora puedes usar /search para buscar ofertas.'
    );
  }

  /**
   * Manejar callbacks de filtros
   */
  private async handleFilterCallback(chatId: string, data: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    session.state = 'awaiting_filters';

    switch (data) {
      case 'filter_minprice':
        session.pendingFilter = 'minPrice';
        await this.bot.sendMessage(chatId, '💰 Ingresa el precio mínimo (solo números):');
        break;

      case 'filter_maxprice':
        session.pendingFilter = 'maxPrice';
        await this.bot.sendMessage(chatId, '💸 Ingresa el precio máximo (solo números):');
        break;

      case 'filter_brand':
        session.pendingFilter = 'brand';
        await this.bot.sendMessage(chatId, '🏷️ Ingresa el nombre de la marca:');
        break;

      case 'filter_discount':
        session.pendingFilter = 'minDiscount';
        await this.bot.sendMessage(chatId, '🔥 Ingresa el descuento mínimo (%):');
        break;

      case 'filter_clear':
        session.state = 'idle';
        await this.clearFilters(chatId);
        break;
    }
  }

  /**
   * Limpiar filtros
   */
  private async clearFilters(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    session.filters = {};

    await this.bot.sendMessage(chatId,
      '🗑️ Filtros limpiados correctamente.'
    );
  }

  /**
   * Enviar ofertas con imagen en tamaño estándar siempre
   */
  private async sendOffers(chatId: string, offers: any[], page: number = 0): Promise<void> {
    const maxOffers = this.config.maxOffersPerMessage || 5;
    const startIndex = page * maxOffers;
    const endIndex = startIndex + maxOffers;
    const offersToShow = offers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(offers.length / maxOffers);

    if (offersToShow.length === 0) {
      await this.bot.sendMessage(chatId, '😔 No hay ofertas para mostrar.');
      return;
    }

    for (const offer of offersToShow) {
      const caption = this.formatOffer(offer);
      const keyboard = {
        inline_keyboard: [
          [{ text: '⭐ Favorito', callback_data: `fav_${offer.id}` }]
        ]
      };

      if (offer.imageUrl) {
        console.log(`🖼️ Intentando cargar imagen: ${offer.imageUrl}`);
        try {
          // Verificar si la URL es válida antes de descargar
          if (!offer.imageUrl.startsWith('http')) {
            throw new Error('URL de imagen inválida');
          }

          // Descargar la imagen
          const response = await axios.get(offer.imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          // Corrección: aseguro que response.data sea un Buffer
          const imageBuffer = Buffer.from(response.data as ArrayBuffer);
          console.log(`✅ Imagen descargada exitosamente: ${imageBuffer.length} bytes`);

          // Procesar con sharp: redimensionar y convertir a jpeg para compatibilidad
          const processedImage = await sharp(imageBuffer)
            .resize({ width: 1280, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

          await this.bot.sendPhoto(chatId, processedImage, {
            caption: caption,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`❌ Error cargando imagen ${offer.imageUrl}:`, errorMessage);
          // Si falla la imagen, enviar solo el texto
          await this.bot.sendMessage(chatId, `🖼️ (Imagen no disponible)\n\n${caption}`, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
        }
      } else {
        await this.bot.sendMessage(chatId, caption, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
    }

    // Agregar navegación si hay múltiples páginas
    if (totalPages > 1) {
      const navKeyboard = this.createPaginationKeyboard(page, totalPages, offers.length);
      await this.bot.sendMessage(chatId,
        `📄 Página ${page + 1} de ${totalPages} (${offers.length} ofertas total)`,
        { reply_markup: navKeyboard }
      );
    }
  }

  /**
   * Manejar input de filtros
   */
  private async handleFilterInput(chatId: string, text: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    const { pendingFilter } = session;

    if (!pendingFilter) {
      session.state = 'idle';
      await this.bot.sendMessage(chatId, '⚠️ Ocurrió un error. Por favor, intenta de nuevo.');
      return;
    }

    if (!session.filters) {
      session.filters = {};
    }

    let value: string | number = text.trim();
    let confirmationMessage = '';

    if (pendingFilter === 'minPrice' || pendingFilter === 'maxPrice' || pendingFilter === 'minDiscount') {
      const numValue = parseInt(value as string, 10);
      if (isNaN(numValue)) {
        await this.bot.sendMessage(chatId, '❌ Valor inválido. Por favor, ingresa solo números.');
        return;
      }
      value = numValue;
    } else {
      // Para filtros de texto (brand, category), asegurar que sea string
      value = value.toString();
    }
    session.filters[pendingFilter] = value as string;
    confirmationMessage = `✅ Filtro '${pendingFilter}' configurado a '${value}'.`;

    // Limpiar estado
    session.state = 'idle';
    delete session.pendingFilter;

    await this.bot.sendMessage(chatId, confirmationMessage);
    await this.handleFiltersCommand(chatId); // Mostrar menú de filtros actualizado
  }



  /**
   * Limpiar filtros
   */
  private createPaginationKeyboard(currentPage: number, totalPages: number, totalOffers: number) {
    const buttons = [];

    if (currentPage > 0) {
      buttons.push({ text: '⬅️ Anterior', callback_data: `page_${currentPage - 1}` });
    }

    if (currentPage < totalPages - 1) {
      buttons.push({ text: '➡️ Siguiente', callback_data: `page_${currentPage + 1}` });
    }

    return {
      inline_keyboard: buttons.length > 0 ? [buttons] : []
    };
  }

  /**
   * Formatear oferta para mostrar
   */
  private formatOffer(offer: any): string {
    const discount = offer.originalPrice && offer.price
      ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
      : 0;

    const caption = `🛍️ *${offer.title}*
💰 Precio: $${offer.price}${offer.originalPrice ? ` ~~$${offer.originalPrice}~~` : ''}${discount > 0 ? ` (${discount}% OFF)` : ''}
📦 Categoría: ${offer.category}
🏷️ Marca: ${offer.brand}`;

    return caption.trim();
  }

  /**
   * Obtener ofertas desde directorio local con filtros
   */
  private async getPublicOffers(filters?: any): Promise<any[]> {
    try {
      console.log('🔍 Obteniendo ofertas desde directorio local...');

      const dataDir = join(process.cwd(), 'data', 'scraping');

      // Verificar si el directorio existe
      try {
        await fs.access(dataDir);
      } catch {
        console.log('⚠️ No hay directorio de datos');
        return [];
      }

      // Obtener datos de todos los módulos
      let allOffers: any[] = [];

      try {
        const modules = await fs.readdir(dataDir);
        console.log(`📁 Módulos encontrados: ${modules.join(', ')}`);

        for (const module of modules) {
          const moduleDir = join(dataDir, module);
          const files = await fs.readdir(moduleDir);
          const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 5); // Últimos 5 archivos por módulo

          for (const file of jsonFiles) {
            try {
              const content = await fs.readFile(join(moduleDir, file), 'utf-8');
              const data = JSON.parse(content);

              // Manejar diferentes estructuras de datos según el módulo
              let offers: any[] = [];

              if (data.data?.offers && Array.isArray(data.data.offers)) {
                offers = data.data.offers;
              } else if (data.items && Array.isArray(data.items)) {
                // Para datos de scraperr que pueden venir directamente en items
                offers = data.items;
              } else if (data.extractedData && Array.isArray(data.extractedData)) {
                // Para datos de deepscrape
                offers = data.extractedData.map((item: any) => item.data || item);
              } else if (Array.isArray(data)) {
                // Para datos que vienen directamente como array
                offers = data;
              }

              if (offers.length > 0) {
                // Agregar información del módulo a cada oferta y mapear campos de imagen
                const offersWithModule = offers.map((offer: any) => ({
                  ...offer,
                  source: data.data?.source || module,
                  extractedAt: data.timestamp,
                  // Mapear diferentes campos de imagen a imageUrl
                  imageUrl: offer.imageUrl || offer.image || offer.img || offer.src || null,
                  // Asegurar que tenga los campos básicos
                  id: offer.id || `${module}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                  title: offer.title || offer.name || 'Producto sin título',
                  price: parseFloat(offer.price) || 0,
                  brand: offer.brand || 'Sin marca'
                }));
                allOffers.push(...offersWithModule);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              console.log(`⚠️ Error leyendo archivo ${file}: ${message}`);
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`⚠️ Error leyendo directorio: ${message}`);
        return [];
      }

      console.log(`📊 Total ofertas encontradas: ${allOffers.length}`);

      // Filtrar duplicados por ID
      const uniqueOffers = allOffers.filter((offer, index, self) =>
        index === self.findIndex(o => o.id === offer.id)
      );

      console.log(`🔍 Ofertas únicas: ${uniqueOffers.length}`);

      // Aplicar filtros si existen
      let filteredOffers = uniqueOffers;

      if (filters) {
        filteredOffers = uniqueOffers.filter(offer => {
          // Filtro por precio mínimo
          if (filters.minPrice && offer.price < filters.minPrice) return false;

          // Filtro por precio máximo
          if (filters.maxPrice && offer.price > filters.maxPrice) return false;

          // Filtro por marca
          if (filters.brand && !offer.brand?.toLowerCase().includes(filters.brand.toLowerCase())) return false;

          // Filtro por categoría
          if (filters.category && !offer.category?.toLowerCase().includes(filters.category.toLowerCase())) return false;

          // Filtro por descuento mínimo
          if (filters.minDiscount && offer.originalPrice) {
            const discount = ((offer.originalPrice - offer.price) / offer.originalPrice) * 100;
            if (discount < filters.minDiscount) return false;
          }

          return true;
        });
      }

      console.log(`✅ Ofertas después de filtros: ${filteredOffers.length}`);

      // Ordenar por timestamp más reciente
      filteredOffers.sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());

      return filteredOffers;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error obteniendo ofertas desde directorio local:', message);
      return [];
    }
  }

  /**
   * Obtener o crear sesión de usuario
   */
  private getOrCreateSession(chatId: string): UserSession {
    if (!this.userSessions.has(chatId)) {
      this.userSessions.set(chatId, {
        chatId,
        state: 'idle',
        lastActivity: new Date()
      });
    }

    const session = this.userSessions.get(chatId)!;
    session.lastActivity = new Date();
    return session;
  }

  /**
   * Limpiar sesiones expiradas
   */
  private cleanExpiredSessions(): void {
    const now = Date.now();
    const expireTime = 24 * 60 * 60 * 1000; // 24 horas

    for (const [chatId, session] of this.userSessions.entries()) {
      if (now - session.lastActivity.getTime() > expireTime) {
        this.userSessions.delete(chatId);
      }
    }
  }

  /**
   * Obtener estadísticas del bot
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      activeSessions: this.userSessions.size,
      totalSessions: this.userSessions.size
    };
  }
}


