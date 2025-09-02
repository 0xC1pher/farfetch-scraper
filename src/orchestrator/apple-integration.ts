import { AppleAuthAPI } from '../apple-auth/api/auth-endpoints';
import { AppleSession } from '../apple-auth/storage/session-storage';

export interface AppleIntegrationOptions {
  useAppleSession?: boolean;
  fallbackToNormal?: boolean;
  proxy?: string;
  timeout?: number;
}

export interface AppleSessionData {
  sessionId: string;
  cookies: any[];
  userAgent: string;
  isValid: boolean;
  email: string;
}

export class AppleIntegration {
  private appleAuthAPI: AppleAuthAPI;
  private static instance: AppleIntegration | null = null;

  constructor() {
    this.appleAuthAPI = AppleAuthAPI.getInstance();
  }

  /**
   * Singleton para reutilizar instancia
   */
  static getInstance(): AppleIntegration {
    if (!AppleIntegration.instance) {
      AppleIntegration.instance = new AppleIntegration();
    }
    return AppleIntegration.instance;
  }

  /**
   * Verificar si hay sesión Apple disponible
   */
  async hasAppleSession(): Promise<boolean> {
    try {
      const status = await this.appleAuthAPI.getAuthStatus();
      return status.isAuthenticated;
    } catch (error) {
      console.error('❌ Error verificando sesión Apple:', error);
      return false;
    }
  }

  /**
   * Obtener sesión Apple para usar en Browser-MCP
   */
  async getAppleSessionForBrowserMCP(): Promise<AppleSessionData | null> {
    try {
      console.log('🍎 Obteniendo sesión Apple para Browser-MCP...');
      
      const sessionResult = await this.appleAuthAPI.getSessionCookies();
      
      if (!sessionResult.success || !sessionResult.cookies || !sessionResult.sessionId) {
        console.log('❌ No hay sesión Apple disponible para Browser-MCP');
        return null;
      }

      const status = await this.appleAuthAPI.getAuthStatus();
      
      if (!status.isAuthenticated || !status.email) {
        console.log('❌ Sesión Apple no está autenticada');
        return null;
      }

      console.log('✅ Sesión Apple obtenida para Browser-MCP');
      
      return {
        sessionId: sessionResult.sessionId,
        cookies: sessionResult.cookies,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        isValid: true,
        email: status.email
      };
    } catch (error) {
      console.error('❌ Error obteniendo sesión Apple para Browser-MCP:', error);
      return null;
    }
  }

  /**
   * Inicializar sesión Apple si no existe
   */
  async ensureAppleSession(options: AppleIntegrationOptions = {}): Promise<AppleSessionData | null> {
    try {
      console.log('🔍 Verificando sesión Apple...');
      
      // Verificar si ya hay sesión activa
      const existingSession = await this.getAppleSessionForBrowserMCP();
      if (existingSession) {
        console.log('✅ Sesión Apple existente encontrada');
        return existingSession;
      }

      // Si no hay sesión y se permite usar Apple, intentar inicializar
      if (options.useAppleSession !== false) {
        console.log('🍎 Inicializando nueva sesión Apple...');
        
        const authResult = await this.appleAuthAPI.initializeAuth({
          proxy: options.proxy,
          headless: true,
          timeout: options.timeout || 30000
        });

        if (authResult.isAuthenticated) {
          console.log('✅ Nueva sesión Apple inicializada');
          return await this.getAppleSessionForBrowserMCP();
        } else if (authResult.requiresReauth) {
          console.log('🔐 Se requiere 2FA para sesión Apple');
          // En este caso, el usuario necesitará completar 2FA manualmente
          return null;
        } else {
          console.log('❌ Error inicializando sesión Apple:', authResult.error);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error asegurando sesión Apple:', error);
      return null;
    }
  }

  /**
   * Convertir sesión Apple a formato compatible con Browser-MCP
   */
  convertAppleSessionToBrowserMCPFormat(appleSession: AppleSessionData): any {
    return {
      sessionId: appleSession.sessionId,
      cookies: appleSession.cookies,
      userAgent: appleSession.userAgent,
      isValid: appleSession.isValid,
      email: appleSession.email,
      source: 'apple-auth',
      timestamp: new Date(),
      // Formato compatible con Browser-MCP
      browserMCPCompatible: true
    };
  }

  /**
   * Obtener configuración de sesión para el orchestrator
   */
  async getSessionConfigForOrchestrator(options: AppleIntegrationOptions = {}): Promise<{
    useAppleSession: boolean;
    sessionData?: any;
    fallbackToNormal: boolean;
  }> {
    try {
      const appleSession = await this.ensureAppleSession(options);
      
      if (appleSession) {
        return {
          useAppleSession: true,
          sessionData: this.convertAppleSessionToBrowserMCPFormat(appleSession),
          fallbackToNormal: options.fallbackToNormal !== false
        };
      } else {
        return {
          useAppleSession: false,
          fallbackToNormal: options.fallbackToNormal !== false
        };
      }
    } catch (error) {
      console.error('❌ Error obteniendo configuración de sesión:', error);
      
      return {
        useAppleSession: false,
        fallbackToNormal: options.fallbackToNormal !== false
      };
    }
  }

  /**
   * Verificar y renovar sesión Apple si es necesario
   */
  async maintainAppleSession(): Promise<boolean> {
    try {
      const renewResult = await this.appleAuthAPI.renewSession();
      return renewResult.success;
    } catch (error) {
      console.error('❌ Error manteniendo sesión Apple:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de la integración Apple
   */
  async getIntegrationStats(): Promise<{
    hasActiveSession: boolean;
    sessionEmail?: string;
    lastLogin?: string;
    expiresAt?: string;
    healthStatus: 'healthy' | 'unhealthy';
  }> {
    try {
      const status = await this.appleAuthAPI.getAuthStatus();
      const healthCheck = await this.appleAuthAPI.getHealthCheck();

      return {
        hasActiveSession: status.isAuthenticated,
        sessionEmail: status.email,
        lastLogin: status.lastLogin?.toISOString(),
        expiresAt: status.expiresAt?.toISOString(),
        healthStatus: healthCheck.status
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de integración:', error);
      
      return {
        hasActiveSession: false,
        healthStatus: 'unhealthy'
      };
    }
  }

  /**
   * Limpiar recursos de la integración
   */
  async cleanup(): Promise<void> {
    try {
      await this.appleAuthAPI.cleanup();
      console.log('🧹 Integración Apple limpiada');
    } catch (error) {
      console.error('❌ Error limpiando integración Apple:', error);
    }
  }
}
