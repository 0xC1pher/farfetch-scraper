import type { NextApiRequest, NextApiResponse } from 'next';
import { AppleAuthAPI } from '../../../apple-auth/api/auth-endpoints';

interface LoginRequest {
  proxy?: string;
  headless?: boolean;
  timeout?: number;
}

interface LoginResponse {
  success: boolean;
  isAuthenticated: boolean;
  sessionId?: string;
  email?: string;
  lastLogin?: string;
  expiresAt?: string;
  requiresReauth?: boolean;
  requires2FA?: boolean;
  twoFactorToken?: string;
  error?: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      isAuthenticated: false,
      message: 'Método no permitido'
    });
  }

  try {
    console.log('🍎 API Endpoint: Iniciando login Apple...');
    
    const { proxy, headless = true, timeout = 30000 }: LoginRequest = req.body;

    // Obtener instancia de la API
    const appleAuthAPI = AppleAuthAPI.getInstance();

    // Inicializar autenticación
    const authResult = await appleAuthAPI.initializeAuth({
      proxy,
      headless,
      timeout
    });

    if (authResult.isAuthenticated) {
      // Login exitoso
      console.log('✅ Login Apple exitoso');
      
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        sessionId: authResult.sessionId,
        email: authResult.email,
        lastLogin: authResult.lastLogin?.toISOString(),
        expiresAt: authResult.expiresAt?.toISOString(),
        message: 'Autenticación Apple completada exitosamente'
      });
    } else if (authResult.requiresReauth) {
      // Se requiere 2FA
      console.log('🔐 Se requiere 2FA para Apple');
      
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        requiresReauth: true,
        requires2FA: true,
        message: 'Se requiere código de verificación de dos factores'
      });
    } else {
      // Error en login
      console.log('❌ Error en login Apple:', authResult.error);
      
      return res.status(400).json({
        success: false,
        isAuthenticated: false,
        error: authResult.error,
        message: authResult.error || 'Error en autenticación Apple'
      });
    }
  } catch (error) {
    console.error('❌ Error crítico en endpoint login Apple:', error);
    
    return res.status(500).json({
      success: false,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Error interno del servidor'
    });
  }
}
