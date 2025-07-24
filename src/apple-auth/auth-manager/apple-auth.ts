import { AppleSeleniumDriver, AppleLoginOptions, AppleLoginResult } from '../selenium-driver/apple-login';
import { AppleDirectAuth } from '../alternative-auth/apple-direct-auth';
import { SessionStorage, AppleSession } from '../storage/session-storage';
import { TwoFactorHandler } from './two-factor';
import { PlaywrightStealthDriver } from '../advanced-scraping/playwright-stealth';
import { PuppeteerStealthDriver } from '../advanced-scraping/puppeteer-stealth';
import { ProxyRotationDriver } from '../advanced-scraping/proxy-rotation';

export interface AppleAuthConfig {
  email?: string;
  password?: string;
  proxy?: string;
  headless?: boolean;
  timeout?: number;
  autoRetry?: boolean;
  maxRetries?: number;
}

export interface AppleAuthStatus {
  isAuthenticated: boolean;
  sessionId?: string;
  email?: string;
  lastLogin?: Date;
  expiresAt?: Date;
  requiresReauth?: boolean;
  error?: string;
}

export class AppleAuthManager {
  private driver: AppleSeleniumDriver;
  private directAuth: AppleDirectAuth;
  private sessionStorage: SessionStorage;
  private twoFactorHandler: TwoFactorHandler;
  private playwrightDriver: PlaywrightStealthDriver;
  private puppeteerDriver: PuppeteerStealthDriver;
  private proxyDriver: ProxyRotationDriver;
  private currentSession: AppleSession | null = null;
  private useDirectAuth: boolean = false;
  private advancedMode: boolean = false;

  constructor() {
    this.driver = new AppleSeleniumDriver();
    this.directAuth = new AppleDirectAuth();
    this.sessionStorage = new SessionStorage();
    this.twoFactorHandler = new TwoFactorHandler();
    this.playwrightDriver = new PlaywrightStealthDriver();
    this.puppeteerDriver = new PuppeteerStealthDriver();
    this.proxyDriver = new ProxyRotationDriver();
  }

  /**
   * Inicializar autenticación Apple con credenciales del .env
   */
  async initializeWithEnvCredentials(config: AppleAuthConfig = {}): Promise<AppleAuthStatus> {
    const email = config.email || process.env.Apple_user;
    const password = config.password || process.env.apple_passw;

    if (!email || !password) {
      return {
        isAuthenticated: false,
        error: 'Credenciales Apple no encontradas en .env (Apple_user, apple_passw)'
      };
    }

    console.log('🍎 Inicializando autenticación Apple para:', email);

    // Verificar si ya hay una sesión válida
    const existingSession = await this.sessionStorage.getActiveSession(email);
    if (existingSession) {
      console.log('✅ Sesión Apple existente encontrada');
      this.currentSession = existingSession;
      return {
        isAuthenticated: true,
        sessionId: existingSession.sessionId,
        email: existingSession.email,
        lastLogin: existingSession.timestamp,
        expiresAt: existingSession.expiresAt
      };
    }

    // No hay sesión válida, intentar login
    return await this.performLogin({
      email,
      password,
      proxy: config.proxy,
      headless: config.headless !== false, // Por defecto headless
      timeout: config.timeout || 30000
    });
  }

  /**
   * Realizar login en Apple con técnicas ULTRA-AVANZADAS
   */
  async performLogin(options: AppleLoginOptions): Promise<AppleAuthStatus> {
    try {
      console.log('🔐 Iniciando proceso de login Apple ULTRA-AVANZADO...');

      let result;

      // 🚀 ESTRATEGIA 1: Playwright Stealth (MÁS AVANZADO)
      if (!this.useDirectAuth) {
        try {
          console.log('🎭 Intentando con Playwright Stealth (Ultra-Avanzado)...');
          await this.playwrightDriver.initialize(options);
          result = await this.playwrightDriver.login(options);

          if (result.success) {
            console.log('✅ Autenticación Playwright Stealth exitosa');
            await this.playwrightDriver.close();
            // Convertir resultado a formato AppleAuthStatus
            const session = await this.sessionStorage.createSession({
              sessionId: result.sessionToken || `playwright_${Date.now()}`,
              email: options.email,
              timestamp: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
              isValid: true,
              loginMethod: 'playwright-stealth'
            });
            this.currentSession = session;
            return {
              isAuthenticated: true,
              sessionId: session.sessionId,
              email: session.email,
              lastLogin: session.timestamp,
              expiresAt: session.expiresAt
            };
          }
          await this.playwrightDriver.close();
        } catch (playwrightError) {
          console.log('❌ Error Playwright Stealth:', playwrightError instanceof Error ? playwrightError.message : String(playwrightError));
          await this.playwrightDriver.close();
        }
      }

      // 🚀 ESTRATEGIA 2: Puppeteer Stealth
      try {
        console.log('🎭 Intentando con Puppeteer Stealth...');
        await this.puppeteerDriver.initialize(options);
        result = await this.puppeteerDriver.login(options);

        if (result.success) {
          console.log('✅ Autenticación Puppeteer Stealth exitosa');
          await this.puppeteerDriver.close();
          const session = await this.sessionStorage.createSession({
            sessionId: result.sessionToken || `puppeteer_${Date.now()}`,
            email: options.email,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isValid: true,
            loginMethod: 'puppeteer-stealth'
          });
          this.currentSession = session;
          return {
            isAuthenticated: true,
            sessionId: session.sessionId,
            email: session.email,
            lastLogin: session.timestamp,
            expiresAt: session.expiresAt
          };
        }
        await this.puppeteerDriver.close();
      } catch (puppeteerError) {
        console.log('❌ Error Puppeteer Stealth:', puppeteerError instanceof Error ? puppeteerError.message : String(puppeteerError));
        await this.puppeteerDriver.close();
      }

      // 🚀 ESTRATEGIA 3: Proxy Rotation
      try {
        console.log('🔄 Intentando con Proxy Rotation...');
        result = await this.proxyDriver.login({
          email: options.email,
          password: options.password,
          maxRetries: 5
        });

        if (result.success) {
          console.log('✅ Autenticación Proxy Rotation exitosa');
          const session = await this.sessionStorage.createSession({
            sessionId: result.sessionToken || `proxy_${Date.now()}`,
            email: options.email,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isValid: true,
            loginMethod: 'proxy-rotation'
          });
          this.currentSession = session;
          return {
            isAuthenticated: true,
            sessionId: session.sessionId,
            email: session.email,
            lastLogin: session.timestamp,
            expiresAt: session.expiresAt
          };
        }
      } catch (proxyError) {
        console.log('❌ Error Proxy Rotation:', proxyError instanceof Error ? proxyError.message : String(proxyError));
      }

      // 🚀 ESTRATEGIA 4: Selenium Robusto (Fallback)
      if (!this.useDirectAuth) {
        try {
          console.log('🔧 Intentando autenticación con Selenium Robusto...');
          result = await this.driver.login(options);

          if (result.success) {
            console.log('✅ Autenticación Selenium exitosa');
            // Continuar con el flujo normal de Selenium
          }
        } catch (seleniumError) {
          console.log('⚠️ Selenium falló, cambiando a autenticación directa...');
          console.log('Error Selenium:', seleniumError);
          this.useDirectAuth = true;
        }
      }

      // 🚀 ESTRATEGIA 5: Implementación Directa (Último recurso)
      if (this.useDirectAuth || !result || !result.success) {
        console.log('🔄 Usando implementación directa (último recurso)...');
        await this.directAuth.initialize();
        result = await this.directAuth.login(options.email, options.password, {
          headless: options.headless,
          timeout: options.timeout,
          proxy: options.proxy
        });
      }

      if (result.success) {
        // Login exitoso - manejar tanto Selenium como implementación directa
        if (result.sessionId) {
          // Resultado de Selenium
          const session = await this.sessionStorage.loadSession(result.sessionId);
          if (session) {
            this.currentSession = session;
            console.log('✅ Autenticación Apple completada exitosamente (Selenium)');

            return {
              isAuthenticated: true,
              sessionId: session.sessionId,
              email: session.email,
              lastLogin: session.timestamp,
              expiresAt: session.expiresAt
            };
          }
        } else if (result.sessionToken) {
          // Resultado de implementación directa
          console.log('✅ Autenticación Apple completada exitosamente (Directa)');

          return {
            isAuthenticated: true,
            sessionId: result.sessionToken,
            email: result.userInfo?.email || 'unknown',
            lastLogin: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
          };
        }
      } else if (result.requires2FA && result.twoFactorToken) {
        // Se requiere 2FA
        console.log('🔐 Se requiere autenticación de dos factores');
        
        return {
          isAuthenticated: false,
          requiresReauth: true,
          error: 'Se requiere código de verificación de dos factores'
        };
      } else {
        // Error en login
        console.log('❌ Error en autenticación Apple:', result.error);
        
        return {
          isAuthenticated: false,
          error: result.error || 'Error desconocido en autenticación'
        };
      }
    } catch (error) {
      console.error('❌ Error crítico en autenticación Apple:', error);
      
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      // Cerrar driver para liberar recursos
      await this.driver.close();
    }

    return {
      isAuthenticated: false,
      error: 'Estado de autenticación indeterminado'
    };
  }

  /**
   * Manejar código 2FA
   */
  async handle2FA(code: string, twoFactorToken?: string): Promise<AppleAuthStatus> {
    try {
      console.log('🔐 Procesando código 2FA...');
      
      if (!twoFactorToken) {
        return {
          isAuthenticated: false,
          error: 'Token de 2FA requerido'
        };
      }

      const result = await this.driver.handle2FA(code, twoFactorToken);

      if (result.success && result.sessionId) {
        const session = await this.sessionStorage.loadSession(result.sessionId);
        if (session) {
          this.currentSession = session;
          console.log('✅ 2FA completado exitosamente');
          
          return {
            isAuthenticated: true,
            sessionId: session.sessionId,
            email: session.email,
            lastLogin: session.timestamp,
            expiresAt: session.expiresAt
          };
        }
      }

      return {
        isAuthenticated: false,
        error: result.error || 'Error en verificación 2FA'
      };
    } catch (error) {
      console.error('❌ Error en 2FA:', error);
      
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      await this.driver.close();
    }
  }

  /**
   * Obtener estado actual de autenticación
   */
  async getAuthStatus(): Promise<AppleAuthStatus> {
    try {
      const appleEmail = process.env.Apple_user;
      if (!appleEmail) {
        return {
          isAuthenticated: false,
          error: 'Email Apple no configurado en .env'
        };
      }

      const session = await this.sessionStorage.getActiveSession(appleEmail);
      if (session) {
        this.currentSession = session;
        return {
          isAuthenticated: true,
          sessionId: session.sessionId,
          email: session.email,
          lastLogin: session.timestamp,
          expiresAt: session.expiresAt
        };
      }

      return {
        isAuthenticated: false,
        requiresReauth: true,
        error: 'No hay sesión Apple activa'
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Cerrar sesión Apple
   */
  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        await this.sessionStorage.invalidateSession(this.currentSession.sessionId);
        this.currentSession = null;
        console.log('🔓 Sesión Apple cerrada');
      }
      
      await this.driver.close();
    } catch (error) {
      console.error('❌ Error cerrando sesión Apple:', error);
    }
  }

  /**
   * Obtener cookies de la sesión actual
   */
  getCurrentSessionCookies(): any[] | null {
    return this.currentSession?.cookies || null;
  }

  /**
   * Obtener ID de sesión actual
   */
  getCurrentSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  /**
   * Verificar si hay sesión activa
   */
  hasActiveSession(): boolean {
    return this.currentSession !== null && this.currentSession.isValid;
  }

  /**
   * Renovar sesión si está próxima a expirar
   */
  async renewSessionIfNeeded(): Promise<boolean> {
    try {
      if (!this.currentSession) return false;

      const now = new Date();
      const expiresAt = new Date(this.currentSession.expiresAt);
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Renovar si expira en menos de 24 horas
      if (hoursUntilExpiry < 24) {
        console.log('🔄 Renovando sesión Apple próxima a expirar...');
        
        const renewResult = await this.initializeWithEnvCredentials();
        return renewResult.isAuthenticated;
      }

      return true;
    } catch (error) {
      console.error('❌ Error renovando sesión:', error);
      return false;
    }
  }

  /**
   * Limpiar recursos
   */
  async cleanup(): Promise<void> {
    try {
      await this.driver.close();
      await this.sessionStorage.cleanExpiredSessions();
      this.currentSession = null;
      console.log('🧹 Recursos Apple Auth limpiados');
    } catch (error) {
      console.error('❌ Error limpiando recursos:', error);
    }
  }
}
