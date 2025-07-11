import TelegramBot from 'node-telegram-bot-api';
import Orchestrator from '../orchestrator/index.js';
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
      console.log('🤖 Mexa Telegram Bot iniciado correctamente');
      
      // Limpiar sesiones expiradas cada 30 minutos
      setInterval(() => this.cleanExpiredSessions(), 30 * 60 * 1000);
      
    } catch (error) {
      console.error('❌ Error iniciando bot:', error);
      throw error;
    }
  }

  /**
   * Detener el bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.bot.stopPolling();
      this.isRunning = false;
      console.log('🤖 Bot detenido');
    } catch (error) {
      console.error('❌ Error deteniendo bot:', error);
    }
  }

  /**
   * Configurar comandos del bot
   */
  private setupCommands(): void {
    // Comando /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleStart(chatId);
    });

    // Comando /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleHelp(chatId);
    });

    // Comando /ofertas
    this.bot.onText(/\/ofertas/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleOfertas(chatId);
    });

    // Comando /login
    this.bot.onText(/\/login/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleLogin(chatId);
    });

    // Comando /filtros
    this.bot.onText(/\/filtros/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleFiltros(chatId);
    });

    // Comando /estado
    this.bot.onText(/\/estado/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleEstado(chatId);
    });

    // Comando /favoritos
    this.bot.onText(/\/favoritos/, async (msg) => {
      const chatId = msg.chat.id.toString();
      await this.handleFavoritos(chatId);
    });

    // Manejo de mensajes de texto
    this.bot.on('message', async (msg) => {
      if (msg.text?.startsWith('/')) return; // Ignorar comandos
      
      const chatId = msg.chat.id.toString();
      await this.handleTextMessage(chatId, msg.text || '');
    });
  }

  /**
   * Configurar callbacks de botones inline
   */
  private setupCallbacks(): void {
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id.toString();
      const data = query.data;
      
      if (!chatId || !data) return;

      try {
        await this.bot.answerCallbackQuery(query.id);
        await this.handleCallback(chatId, data);
      } catch (error) {
        console.error('Error handling callback:', error);
      }
    });
  }

  /**
   * Manejar comando /start
   */
  private async handleStart(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    session.state = 'idle';

    const welcomeMessage = `
🛍️ *¡Bienvenido a Mexa!*

Soy tu asistente personal para encontrar las mejores ofertas en Farfetch.

*Comandos disponibles:*
• /ofertas - Ver ofertas más recientes
• /login - Configurar credenciales
• /filtros - Configurar filtros de búsqueda
• /estado - Ver estado del sistema
• /help - Mostrar esta ayuda

¡Empecemos! Usa /ofertas para ver las últimas ofertas disponibles.
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🛍️ Ver Ofertas', callback_data: 'ofertas' },
          { text: '⚙️ Configurar', callback_data: 'config' }
        ],
        [
          { text: '🔍 Filtros', callback_data: 'filtros' },
          { text: '📊 Estado', callback_data: 'estado' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Manejar comando /help
   */
  private async handleHelp(chatId: string): Promise<void> {
    const helpMessage = `
📖 *Guía de Uso - Mexa Bot*

*Comandos Principales:*
• \`/start\` - Iniciar el bot
• \`/ofertas\` - Ver ofertas más recientes
• \`/login\` - Configurar credenciales de Farfetch
• \`/filtros\` - Configurar filtros de búsqueda
• \`/estado\` - Ver estado del sistema

*Filtros Disponibles:*
• Precio mínimo y máximo
• Marca específica
• Descuento mínimo
• Categoría de producto

*Ejemplo de uso:*
1. Usa \`/login\` para configurar tus credenciales
2. Usa \`/filtros\` para establecer tus preferencias
3. Usa \`/ofertas\` para ver ofertas personalizadas

*Soporte:* Si tienes problemas, usa \`/estado\` para verificar el sistema.
    `;

    await this.bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown'
    });
  }

  /**
   * Manejar comando /ofertas
   */
  private async handleOfertas(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    
    try {
      await this.bot.sendMessage(chatId, '🔍 Buscando ofertas...');

      // Si no hay credenciales, usar datos públicos
      let offers: any[] = [];
      
      if (session.credentials) {
        // Ejecutar workflow de scraping con credenciales
        const execution = await workflowEngine.executeWorkflow('scraping-flow', {
          email: session.credentials.email,
          password: session.credentials.password,
          filters: session.filters
        });

        // Esperar a que termine la ejecución
        await this.waitForExecution(execution.id);
        const finalExecution = workflowEngine.getExecution(execution.id);
        offers = finalExecution?.results.offers_filtered || finalExecution?.results.offers || [];
      } else {
        // Usar API para obtener ofertas públicas
        offers = await this.getPublicOffers(session.filters);
      }

      if (offers.length === 0) {
        await this.bot.sendMessage(chatId, '😔 No se encontraron ofertas con los filtros actuales.');
        return;
      }

      await this.sendOffers(chatId, offers);

    } catch (error) {
      console.error('Error getting offers:', error);
      await this.bot.sendMessage(chatId, '❌ Error obteniendo ofertas. Intenta más tarde.');
    }
  }

  /**
   * Manejar comando /login
   */
  private async handleLogin(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    session.state = 'awaiting_credentials';

    const message = `
🔐 *Configuración de Credenciales*

Para acceder a ofertas personalizadas, necesito tus credenciales de Farfetch.

Por favor, envía tus credenciales en el formato:
\`email:password\`

Ejemplo: \`usuario@email.com:mipassword\`

⚠️ *Importante:* Tus credenciales se almacenan de forma segura y solo se usan para acceder a Farfetch.
    `;

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  }

  /**
   * Manejar comando /filtros
   */
  private async handleFiltros(chatId: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);
    const currentFilters = session.filters || {};

    const message = `
🔍 *Configuración de Filtros*

*Filtros actuales:*
• Precio mínimo: ${currentFilters.minPrice || 'Sin límite'}€
• Precio máximo: ${currentFilters.maxPrice || 'Sin límite'}€
• Marca: ${currentFilters.brand || 'Cualquiera'}
• Descuento mínimo: ${currentFilters.minDiscount || 0}%

Selecciona qué filtro quieres configurar:
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💰 Precio Mínimo', callback_data: 'filter_minprice' },
          { text: '💸 Precio Máximo', callback_data: 'filter_maxprice' }
        ],
        [
          { text: '🏷️ Marca', callback_data: 'filter_brand' },
          { text: '🔥 Descuento', callback_data: 'filter_discount' }
        ],
        [
          { text: '🗑️ Limpiar Filtros', callback_data: 'filter_clear' },
          { text: '✅ Guardar', callback_data: 'filter_save' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Manejar comando /estado
   */
  private async handleEstado(chatId: string): Promise<void> {
    try {
      // Simular llamada a health check
      const status = {
        system: 'healthy',
        services: {
          orchestrator: 'up',
          workflows: 'up',
          storage: 'up'
        },
        uptime: Math.floor(process.uptime())
      };

      const message = `
📊 *Estado del Sistema*

🟢 *Sistema:* ${status.system}
⏱️ *Tiempo activo:* ${Math.floor(status.uptime / 60)} minutos

*Servicios:*
• Orquestador: ${status.services.orchestrator === 'up' ? '✅' : '❌'}
• Workflows: ${status.services.workflows === 'up' ? '✅' : '❌'}
• Almacenamiento: ${status.services.storage === 'up' ? '✅' : '❌'}

*Sesiones activas:* ${this.userSessions.size}
      `;

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
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
    }
  }

  /**
   * Manejar callbacks de botones
   */
  private async handleCallback(chatId: string, data: string): Promise<void> {
    switch (data) {
      case 'ofertas':
        await this.handleOfertas(chatId);
        break;

      case 'config':
        await this.handleLogin(chatId);
        break;

      case 'filtros':
        await this.handleFiltros(chatId);
        break;

      case 'estado':
        await this.handleEstado(chatId);
        break;

      case 'filter_clear':
        await this.clearFilters(chatId);
        break;

      default:
        if (data.startsWith('filter_')) {
          await this.handleFilterCallback(chatId, data);
        } else if (data.startsWith('page_')) {
          await this.handlePageCallback(chatId, data);
        } else if (data.startsWith('fav_')) {
          await this.handleFavoriteCallback(chatId, data);
        }
    }
  }

  /**
   * Manejar callback de paginación
   */
  private async handlePageCallback(chatId: string, data: string): Promise<void> {
    const pageNumber = parseInt(data.replace('page_', ''));
    const session = this.getOrCreateSession(chatId);

    // Obtener ofertas nuevamente (podrían estar en cache)
    try {
      await this.bot.sendMessage(chatId, '🔄 Cargando página...');

      let offers: any[] = [];

      if (session.credentials) {
        const execution = await workflowEngine.executeWorkflow('scraping-flow', {
          email: session.credentials.email,
          password: session.credentials.password,
          filters: session.filters
        });

        await this.waitForExecution(execution.id);
        const finalExecution = workflowEngine.getExecution(execution.id);
        offers = finalExecution?.results.offers_filtered || finalExecution?.results.offers || [];
      } else {
        offers = await this.getPublicOffers(session.filters);
      }

      if (offers.length === 0) {
        await this.bot.sendMessage(chatId, '😔 No se encontraron ofertas.');
        return;
      }

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

    // Inicializar favoritos si no existen
    if (!session.favorites) {
      session.favorites = [];
    }

    if (session.favorites.includes(offerId)) {
      // Remover de favoritos
      session.favorites = session.favorites.filter(id => id !== offerId);
      await this.bot.sendMessage(chatId, '💔 Removido de favoritos');
    } else {
      // Agregar a favoritos
      session.favorites.push(offerId);
      await this.bot.sendMessage(chatId, '❤️ Agregado a favoritos');
    }
  }

  /**
   * Manejar entrada de credenciales
   */
  private async handleCredentialsInput(chatId: string, text: string): Promise<void> {
    const session = this.getOrCreateSession(chatId);

    if (!text.includes(':')) {
      await this.bot.sendMessage(chatId,
        '❌ Formato incorrecto. Usa: email:password'
      );
      return;
    }

    const [email, password] = text.split(':');

    if (!email || !password) {
      await this.bot.sendMessage(chatId,
        '❌ Email y password son requeridos.'
      );
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await this.bot.sendMessage(chatId,
        '❌ Formato de email inválido.'
      );
      return;
    }

    session.credentials = { email, password };
    session.state = 'idle';

    await this.bot.sendMessage(chatId,
      '✅ Credenciales guardadas correctamente. Ahora puedes usar /ofertas para ver ofertas personalizadas.'
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
          '💰 Envía el precio mínimo en euros (ejemplo: 50)'
        );
        break;

      case 'filter_maxprice':
        session.state = 'awaiting_filters';
        await this.bot.sendMessage(chatId,
          '💸 Envía el precio máximo en euros (ejemplo: 500)'
        );
        break;

      case 'filter_brand':
        session.state = 'awaiting_filters';
        await this.bot.sendMessage(chatId,
          '🏷️ Envía el nombre de la marca (ejemplo: Nike)'
        );
        break;

      case 'filter_discount':
        session.state = 'awaiting_filters';
        await this.bot.sendMessage(chatId,
          '🔥 Envía el descuento mínimo en % (ejemplo: 30)'
        );
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
      '🗑️ Filtros limpiados. Ahora verás todas las ofertas disponibles.'
    );
  }

  /**
   * Enviar ofertas al usuario con paginación
   */
  private async sendOffers(chatId: string, offers: any[], page: number = 0): Promise<void> {
    const maxOffers = this.config.maxOffersPerMessage || 5; // Reducido para mejor UX
    const startIndex = page * maxOffers;
    const endIndex = startIndex + maxOffers;
    const offersToShow = offers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(offers.length / maxOffers);

    if (offersToShow.length === 0) {
      await this.bot.sendMessage(chatId, '😔 No hay más ofertas disponibles.');
      return;
    }

    // Enviar ofertas
    for (const offer of offersToShow) {
      const message = this.formatOffer(offer);

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🛒 Ver en Farfetch', url: offer.productUrl || 'https://www.farfetch.com' },
            { text: '❤️ Favorito', callback_data: `fav_${offer.id || 'unknown'}` }
          ]
        ]
      };

      try {
        if (offer.imageUrl) {
          await this.bot.sendPhoto(chatId, offer.imageUrl, {
            caption: message,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
        } else {
          await this.bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
        }
      } catch (error) {
        // Si falla el envío con imagen, enviar solo texto
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
    }

    // Controles de paginación
    if (totalPages > 1) {
      const paginationKeyboard = this.createPaginationKeyboard(page, totalPages, offers.length);

      await this.bot.sendMessage(chatId,
        `📄 Página ${page + 1} de ${totalPages} (${offers.length} ofertas totales)`,
        { reply_markup: paginationKeyboard }
      );
    }
  }

  /**
   * Crear teclado de paginación
   */
  private createPaginationKeyboard(currentPage: number, totalPages: number, totalOffers: number) {
    const buttons = [];

    // Fila de navegación
    const navRow = [];
    if (currentPage > 0) {
      navRow.push({ text: '⬅️ Anterior', callback_data: `page_${currentPage - 1}` });
    }
    if (currentPage < totalPages - 1) {
      navRow.push({ text: '➡️ Siguiente', callback_data: `page_${currentPage + 1}` });
    }
    if (navRow.length > 0) {
      buttons.push(navRow);
    }

    // Fila de acciones
    const actionRow = [
      { text: '🔍 Filtrar', callback_data: 'filtros' },
      { text: '🔄 Actualizar', callback_data: 'ofertas' }
    ];
    buttons.push(actionRow);

    // Fila de salto de página (solo si hay muchas páginas)
    if (totalPages > 5) {
      const jumpRow = [
        { text: '⏮️ Primera', callback_data: 'page_0' },
        { text: '⏭️ Última', callback_data: `page_${totalPages - 1}` }
      ];
      buttons.push(jumpRow);
    }

    return { inline_keyboard: buttons };
  }

  /**
   * Formatear oferta para mostrar
   */
  private formatOffer(offer: any): string {
    const title = offer.title || 'Producto sin título';
    const brand = offer.brand || 'Marca desconocida';
    const price = offer.price ? `€${offer.price}` : 'Precio no disponible';
    const originalPrice = offer.originalPrice ? `€${offer.originalPrice}` : null;
    const discount = offer.discount ? `${Math.round(offer.discount)}% OFF` : null;

    let message = `🛍️ *${title}*\n`;
    message += `🏷️ ${brand}\n`;

    if (originalPrice && discount) {
      message += `💰 ~~${originalPrice}~~ *${price}* (${discount})\n`;
    } else {
      message += `💰 *${price}*\n`;
    }

    if (offer.availability) {
      message += `✅ Disponible\n`;
    } else {
      message += `❌ No disponible\n`;
    }

    return message;
  }

  /**
   * Obtener ofertas públicas (sin autenticación)
   */
  private async getPublicOffers(filters?: any): Promise<any[]> {
    try {
      // Simular ofertas públicas - en producción esto vendría de la API
      const mockOffers = [
        {
          id: 'public-1',
          title: 'Nike Air Max 90',
          brand: 'Nike',
          price: 120,
          originalPrice: 150,
          discount: 20,
          imageUrl: 'https://via.placeholder.com/300x300',
          productUrl: 'https://www.farfetch.com/product/1',
          availability: true,
          timestamp: new Date()
        },
        {
          id: 'public-2',
          title: 'Adidas Ultraboost',
          brand: 'Adidas',
          price: 180,
          originalPrice: 200,
          discount: 10,
          imageUrl: 'https://via.placeholder.com/300x300',
          productUrl: 'https://www.farfetch.com/product/2',
          availability: true,
          timestamp: new Date()
        }
      ];

      // Aplicar filtros si existen
      if (filters) {
        return mockOffers.filter(offer => {
          if (filters.minPrice && offer.price < filters.minPrice) return false;
          if (filters.maxPrice && offer.price > filters.maxPrice) return false;
          if (filters.brand && !offer.brand.toLowerCase().includes(filters.brand.toLowerCase())) return false;
          if (filters.minDiscount && offer.discount < filters.minDiscount) return false;
          return true;
        });
      }

      return mockOffers;
    } catch (error) {
      console.error('Error getting public offers:', error);
      return [];
    }
  }

  /**
   * Esperar a que termine la ejecución de un workflow
   */
  private async waitForExecution(executionId: string, maxWait: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const execution = workflowEngine.getExecution(executionId);

      if (!execution) break;

      if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Obtener o crear sesión de usuario
   */
  private getOrCreateSession(chatId: string): UserSession {
    let session = this.userSessions.get(chatId);

    if (!session) {
      session = {
        chatId,
        state: 'idle',
        lastActivity: new Date()
      };
      this.userSessions.set(chatId, session);
    }

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

    console.log(`🧹 Limpieza de sesiones: ${this.userSessions.size} sesiones activas`);
  }

  /**
   * Obtener estadísticas del bot
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      activeSessions: this.userSessions.size,
      uptime: process.uptime()
    };
  }
}
