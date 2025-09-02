import { AppleAuthManager, AppleAuthStatus } from '../auth-manager/apple-auth';

export class AppleAuthAPI {
  private authManager: AppleAuthManager;
  private static instance: AppleAuthAPI | null = null;

  constructor() {
    this.authManager = new AppleAuthManager();
  }

  /**
   * Singleton para reutilizar instancia
   */
  static getInstance(): AppleAuthAPI {
    if (!AppleAuthAPI.instance) {
      AppleAuthAPI.instance = new AppleAuthAPI();
    }
    return AppleAuthAPI.instance;
  }

  /**
   * Inicializar autenticación Apple
   */
  async initializeAuth(options: {
    proxy?: string;
    headless?: boolean;
    timeout?: number;
  } = {}): Promise<AppleAuthStatus> {
    try {
      console.log('🍎 API: Inicializando autenticación Apple...');
      
      const result = await this.authManager.initializeWithEnvCredentials({
        proxy: options.proxy,
        headless: options.headless !== false,
        timeout: options.timeout || 30000
      });

      return result;
    } catch (error) {
      console.error('❌ API: Error inicializando autenticación:', error);
      
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Obtener estado de autenticación
   */
  async getAuthStatus(): Promise<AppleAuthStatus> {
    try {
      return await this.authManager.getAuthStatus();
    } catch (error) {
      console.error('❌ API: Error obteniendo estado:', error);
      
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Manejar código 2FA
   */
  async handle2FA(code: string, token: string): Promise<AppleAuthStatus> {
    try {
      console.log('🔐 API: Procesando código 2FA...');
      
      // Validar formato del código
      if (!/^\d{6}$/.test(code.trim())) {
        return {
          isAuthenticated: false,
          error: 'Código 2FA debe tener 6 dígitos'
        };
      }

      const result = await this.authManager.handle2FA(code.trim(), token);
      return result;
    } catch (error) {
      console.error('❌ API: Error en 2FA:', error);
      
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authManager.logout();
      
      return {
        success: true,
        message: 'Sesión Apple cerrada correctamente'
      };
    } catch (error) {
      console.error('❌ API: Error cerrando sesión:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Obtener cookies de sesión
   */
  async getSessionCookies(): Promise<{
    success: boolean;
    cookies?: any[];
    sessionId?: string;
    error?: string;
  }> {
    try {
      const status = await this.getAuthStatus();
      
      if (!status.isAuthenticated) {
        return {
          success: false,
          error: 'No hay sesión Apple activa'
        };
      }

      const cookies = this.authManager.getCurrentSessionCookies();
      const sessionId = this.authManager.getCurrentSessionId();

      return {
        success: true,
        cookies: cookies || [],
        sessionId: sessionId || undefined
      };
    } catch (error) {
      console.error('❌ API: Error obteniendo cookies:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Renovar sesión si es necesario
   */
  async renewSession(): Promise<{
    success: boolean;
    renewed: boolean;
    message: string;
  }> {
    try {
      const renewed = await this.authManager.renewSessionIfNeeded();
      
      return {
        success: true,
        renewed,
        message: renewed ? 'Sesión renovada correctamente' : 'Sesión no requiere renovación'
      };
    } catch (error) {
      console.error('❌ API: Error renovando sesión:', error);
      
      return {
        success: false,
        renewed: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Verificar si hay sesión activa
   */
  hasActiveSession(): boolean {
    return this.authManager.hasActiveSession();
  }

  /**
   * Limpiar recursos
   */
  async cleanup(): Promise<void> {
    try {
      await this.authManager.cleanup();
      console.log('🧹 API: Recursos limpiados');
    } catch (error) {
      console.error('❌ API: Error limpiando recursos:', error);
    }
  }

  /**
   * Obtener información de salud del servicio
   */
  async getHealthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    details: {
      hasActiveSession: boolean;
      authManagerReady: boolean;
      envCredentialsConfigured: boolean;
    };
  }> {
    try {
      const hasActiveSession = this.hasActiveSession();
      const authManagerReady = this.authManager !== null;
      const envCredentialsConfigured = !!(process.env.Apple_user && process.env.apple_passw);

      const isHealthy = authManagerReady && envCredentialsConfigured;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date(),
        details: {
          hasActiveSession,
          authManagerReady,
          envCredentialsConfigured
        }
      };
    } catch (error) {
      console.error('❌ API: Error en health check:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        details: {
          hasActiveSession: false,
          authManagerReady: false,
          envCredentialsConfigured: false
        }
      };
    }
  }
}
