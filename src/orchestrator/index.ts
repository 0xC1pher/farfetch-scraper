import { browserMCP } from '../modules/browser-mcp/index';
import { minioStorage, SessionData } from '../modules/minio/index';
import { scraperr, Offer } from '../modules/scraperr/index';

type OrchestratorOptions = {
  sessionId?: string;
  email?: string;
  password?: string;
  loginIfNeeded?: boolean;
  proxy?: string;
  fingerprintLevel?: 'low' | 'medium' | 'high';
  scrapeUrl?: string;
  persistSession?: boolean;
  maxRetries?: number;
};

export class Orchestrator {
  private browserMCP = browserMCP;
  private minio = minioStorage;
  private scraperr = scraperr;

  constructor() {
    // Los hooks ya están instanciados en sus módulos respectivos
  }

  /**
   * Flujo robusto de login y persistencia de sesión
   */
  async ensureSession(options: OrchestratorOptions): Promise<SessionData> {
    const {
      sessionId = '',
      email,
      password,
      loginIfNeeded = true,
      fingerprintLevel = 'medium',
      persistSession = true,
      proxy
    } = options;

    // 1. Intentar cargar sesión desde MinIO
    if (sessionId) {
      try {
        const session = await this.minio.loadSession(sessionId);
        if (session && session.status === 'active') {
          this.log(`✅ Sesión encontrada en MinIO: ${sessionId}`);
          return session;
        }
      } catch (error) {
        this.log(`⚠️ Error cargando sesión: ${error}`);
      }
    }

    // 2. Si no existe, hacer login si está permitido
    if (loginIfNeeded && email && password) {
      this.log('🔐 Iniciando login con Browser MCP...');
      
      try {
        const loginResult = await this.browserMCP.login(email, password, {
          use2FA: false,
          fingerprint: this.generateFingerprint(fingerprintLevel),
          proxy
        });

        if (loginResult.success && persistSession) {
          const sessionData: SessionData = {
            sessionId: loginResult.sessionId || `session-${Date.now()}`,
            cookies: loginResult.cookies || [],
            userId: '',
            fingerprint: {},
            timestamp: new Date(),
            status: 'active'
          };
          
          await this.minio.saveSession(sessionData);
          this.log(`💾 Sesión guardada en MinIO: ${sessionData.sessionId}`);
          return sessionData;
        } else {
          throw new Error(`Login fallido: ${loginResult.error || 'Unknown error'}`);
        }
      } catch (error) {
        this.log(`❌ Error en login: ${error}`);
        throw error;
      }
    }

    throw new Error('No se pudo obtener una sesión válida');
  }

  /**
   * Flujo robusto de scraping con manejo de sesión y fallback
   */
  async scrapeWithSession(options: OrchestratorOptions): Promise<Offer[]> {
    const {
      sessionId = '',
      scrapeUrl = '',
      maxRetries = 2
    } = options;

    if (!scrapeUrl) {
      throw new Error('URL de scraping requerida');
    }

    let session: SessionData | null = null;
    let retries = 0;
    let lastError: any = null;

    // 1. Cargar sesión
    try {
      if (sessionId) {
        session = await this.minio.loadSession(sessionId);
        if (session) {
          await this.scraperr.loadSession(session);
          this.log(`✅ Sesión cargada: ${sessionId}`);
        }
      }
    } catch (error) {
      this.log(`⚠️ Error cargando sesión: ${error}`);
      // Continuar sin sesión si falla
    }

    // 2. Intentar scraping con reintentos y fallback
    while (retries <= maxRetries) {
      try {
        this.log(`🔎 Scraping intento #${retries + 1} para ${scrapeUrl}`);
        const offers = await this.scraperr.scrapeOffers(scrapeUrl, { 
          useSession: !!session, 
          sessionId,
          timeout: 30000
        });
        
        if (offers.length > 0) {
          this.log(`✅ Scraping exitoso: ${offers.length} ofertas encontradas`);

          // Guardar datos de scraping en MinIO para la API
          try {
            await this.storage.saveScrapingData({
              url: scrapeUrl,
              selectors: [], // Los selectores se manejan internamente en scraperr
              data: { offers, timestamp: new Date(), totalFound: offers.length },
              timestamp: new Date()
            });
            this.log(`📦 Datos de scraping guardados en MinIO`);
          } catch (error) {
            this.log(`⚠️ Error guardando datos de scraping: ${error}`);
            // No fallar el scraping por error de guardado
          }

          return offers;
        }
        throw new Error('No se encontraron ofertas');
      } catch (error) {
        lastError = error;
        this.log(`❌ Error en scraping: ${error}`);
        retries++;
        if (retries > maxRetries) break;
        this.log('🔄 Reintentando scraping...');
        await this.delay(2000 * retries);
      }
    }

    // 3. Fallback a deepscrape si todo falla
    this.log('🤖 Fallback a deepscrape...');
    try {
      const offers = await this.scraperr.extractWithFallback(scrapeUrl, { 
        useSession: !!session, 
        sessionId,
        timeout: 30000
      });
      
      if (offers.length > 0) {
        this.log(`✅ Deepscrape exitoso: ${offers.length} ofertas encontradas`);

        // Guardar datos de scraping en MinIO para la API
        try {
          await this.storage.saveScrapingData({
            url: scrapeUrl,
            selectors: [], // Los selectores se manejan internamente en deepscrape
            data: { offers, timestamp: new Date(), totalFound: offers.length, source: 'deepscrape' },
            timestamp: new Date()
          });
          this.log(`📦 Datos de deepscrape guardados en MinIO`);
        } catch (error) {
          this.log(`⚠️ Error guardando datos de deepscrape: ${error}`);
          // No fallar el scraping por error de guardado
        }

        return offers;
      }
      throw new Error('Deepscrape tampoco encontró ofertas');
    } catch (error) {
      this.log(`❌ Fallback deepscrape fallido: ${error}`);
      throw lastError || error;
    }
  }

  /**
   * Generar fingerprint para Browser MCP
   */
  private generateFingerprint(level: 'low' | 'medium' | 'high' = 'medium') {
    // Implementación básica de fingerprint
    return {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      viewport: { width: 1366, height: 768 },
      timezone: 'America/New_York',
      locale: 'en-US',
      languages: ['en-US', 'en'],
      webglVendor: 'Intel Inc.',
      webglRenderer: 'Intel Iris OpenGL Engine',
      audioContext: 44100,
      lastRotation: new Date()
    };
  }

  /**
   * Utilidad para logging centralizado
   */
  private log(msg: string) {
    // Aquí puedes integrar winston, pino, Sentry, etc.
    console.log(`[Orchestrator] ${new Date().toISOString()} - ${msg}`);
  }

  /**
   * Utilidad para delays/reintentos
   */
  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getStats() {
    const browserStatus = await this.browserMCP.getStatus();
    const scraperrStats = await this.scraperr.getStatsAsync();
    const minioStatus = await this.minio.getStatus();
    
    return {
      browserMCP: browserStatus,
      scraperr: scraperrStats,
      minio: minioStatus,
      timestamp: new Date()
    };
  }
}

// Ejemplo de uso (puedes mover esto a un handler o script aparte)
async function main() {
  const orchestrator = new Orchestrator();

  try {
    // 1. Login y persistencia de sesión
    const session = await orchestrator.ensureSession({
      sessionId: 'user1-session',
      email: process.env.FF_EMAIL,
      password: process.env.FF_PASSWORD,
      fingerprintLevel: 'medium',
      persistSession: true,
      loginIfNeeded: true
    });

    // 2. Scraping robusto con fallback
    const offers = await orchestrator.scrapeWithSession({
      sessionId: session.sessionId,
      scrapeUrl: 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx'
    });

    console.log('Ofertas encontradas:', offers);
  } catch (error) {
    console.error('Error en orquestador:', error);
    process.exit(1);
  }
}

// Si quieres que se ejecute como script
if (require.main === module) {
  main().catch((err) => {
    console.error('Error en orquestador:', err);
    process.exit(1);
  });
}

export default Orchestrator; 