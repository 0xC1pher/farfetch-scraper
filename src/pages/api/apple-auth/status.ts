import type { NextApiRequest, NextApiResponse } from 'next';
import { AppleAuthAPI } from '../../../apple-auth/api/auth-endpoints';

interface StatusResponse {
  success: boolean;
  isAuthenticated: boolean;
  sessionId?: string;
  email?: string;
  lastLogin?: string;
  expiresAt?: string;
  requiresReauth?: boolean;
  error?: string;
  message: string;
  healthCheck?: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    details: {
      hasActiveSession: boolean;
      authManagerReady: boolean;
      envCredentialsConfigured: boolean;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      isAuthenticated: false,
      message: 'Método no permitido'
    });
  }

  try {
    console.log('🍎 API Endpoint: Verificando estado Apple Auth...');
    
    // Obtener instancia de la API
    const appleAuthAPI = AppleAuthAPI.getInstance();

    // Obtener estado de autenticación
    const authStatus = await appleAuthAPI.getAuthStatus();
    
    // Obtener health check
    const healthCheck = await appleAuthAPI.getHealthCheck();

    if (authStatus.isAuthenticated) {
      console.log('✅ Sesión Apple activa encontrada');
      
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        sessionId: authStatus.sessionId,
        email: authStatus.email,
        lastLogin: authStatus.lastLogin?.toISOString(),
        expiresAt: authStatus.expiresAt?.toISOString(),
        message: 'Sesión Apple activa',
        healthCheck: {
          status: healthCheck.status,
          timestamp: healthCheck.timestamp.toISOString(),
          details: healthCheck.details
        }
      });
    } else {
      console.log('❌ No hay sesión Apple activa');

      // Agregar información de demostración para mostrar cómo se vería el panel
      const demoSessionInfo = req.query.demo === 'true' ? {
        sessionId: 'demo-session-' + Date.now().toString(36),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días
        authMethod: 'Selenium WebDriver + 2FA',
        isValid: true
      } : undefined;

      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        requiresReauth: authStatus.requiresReauth,
        error: authStatus.error,
        message: authStatus.error || 'No hay sesión Apple activa',
        healthCheck: {
          status: healthCheck.status,
          timestamp: healthCheck.timestamp.toISOString(),
          details: healthCheck.details
        },
        ...(demoSessionInfo && { sessionInfo: demoSessionInfo })
      });
    }
  } catch (error) {
    console.error('❌ Error en endpoint status Apple:', error);
    
    return res.status(500).json({
      success: false,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Error interno del servidor'
    });
  }
}
