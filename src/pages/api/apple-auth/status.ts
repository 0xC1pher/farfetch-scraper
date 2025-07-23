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
        }
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
