import TelegramBot from 'node-telegram-bot-api';
import { Orchestrator } from '../orchestrator/orchestrator';
import { workflowEngine } from '../workflow-engine/index.js';

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
  credentials?: {
    email: string;
    password: string;
  };
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    category?: string;
    minDiscount?: number;
  };
  favorites?: string[];
  lastActivity: Date;
}

export class MexaTelegramBot {
  private bot: TelegramBot;
  private orchestrator: Orchestrator;
  private config: BotConfig;
  private userSessions: Map<string, UserSession> = new Map();
  private isRunning: boolean = false;

  constructor(config: BotConfig) {
    this.config = {
      maxOffersPerMessage: 10,
      defaultFilters: { maxPrice: 1000, minDiscount: 0 },
      ...config
    };

    this.bot = new TelegramBot(config.token, { polling: false });
    this.orchestrator = new Orchestrator();
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
      await this.bot.startPolling();
      this.isRunning = true;
      console.log('🤖 Bot de Telegram iniciado correctamente');
      
      // Limpiar sesiones expiradas cada hora
      setInterval(() => this.cleanExpiredSessions(), 60 * 60 * 1000);
    } catch (error) {
      console.error('❌ Error iniciando bot:', error);
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
      console.error('❌ Error deteniendo bot:', error);
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
        console.error('Error handling callback:', error);
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
      console.error('Error in search command:', error);
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
    try {
      const stats = await this.orchestrator.getStats();
      
      const statusMessage = `
🔧 *Estado del Sistema*

*Servicios:*
• Browser MCP: ${stats.browserMCP?.available ? '✅' : '❌'}
• Scraperr: ${stats.scraperr?.available ? '✅' : '❌'}
• MinIO: ${stats.minio?.available ? '✅' : '❌'}

*Estadísticas:*
• Sesiones activas: ${this.userSessions.size}
• Última actualización: ${new Date().toLocaleString()}

*Bot:*
• Estado: ${this.isRunning ? '🟢 Activo' : '🔴 Inactivo'}
      `;

      await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error getting status:', error);
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
      console.error('Error in page callback:', error);
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

    switch (data) {
      case 'filter_minprice':
        session.state = 'awaiting_filters';
        await this.bot.sendMessage(chatId,
          '💰 Ingresa el precio mínimo (solo números):'
        );
        break;

      case 'filter_maxprice':
        session.state = 'awaiting_filters';
        await this.bot.sendMessage(chatId,
          '💸 Ingresa el precio máximo (solo números):'
        );
        break;

      case 'filter_brand':
        session.state = 'awaiting_filters';
        await this.bot.sendMessage(chatId,
          '🏷️ Ingresa el nombre de la marca:'
        );
        break;

      case 'filter_discount':
        session.state = 'awaiting_filters';
        await this.bot.sendMessage(chatId,
          '🔥 Ingresa el descuento mínimo (%):'
        );
        break;

      case 'filter_clear':
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
   * Enviar ofertas con paginación
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
      const message = this.formatOffer(offer);
      const keyboard = {
        inline_keyboard: [
          [
            { text: '⭐ Favorito', callback_data: `fav_${offer.id}` },
            { text: '🔗 Ver producto', url: offer.productUrl }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
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
   * Crear teclado de paginación
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

    return `
🛍️ *${offer.title}*
🏷️ Marca: ${offer.brand}
💰 Precio: $${offer.price}${offer.originalPrice ? ` ~~$${offer.originalPrice}~~` : ''}
${discount > 0 ? `🔥 Descuento: ${discount}%` : ''}
📦 Disponible: ${offer.availability ? '✅' : '❌'}
    `.trim();
  }

  /**
   * Obtener ofertas públicas (mock)
   */
  private async getPublicOffers(filters?: any): Promise<any[]> {
    try {
      // Mock data para pruebas
      const mockOffers = [
        {
          id: '1',
          title: 'Sneakers Nike Air Max',
          brand: 'Nike',
          price: 120,
          originalPrice: 150,
          availability: true,
          productUrl: 'https://farfetch.com/product/1'
        },
        {
          id: '2',
          title: 'Gucci Belt',
          brand: 'Gucci',
          price: 450,
          originalPrice: 500,
          availability: true,
          productUrl: 'https://farfetch.com/product/2'
        }
      ];

      return mockOffers;
    } catch (error) {
      console.error('Error getting offers:', error);
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
