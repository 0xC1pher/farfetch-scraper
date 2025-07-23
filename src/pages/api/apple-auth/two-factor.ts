import type { NextApiRequest, NextApiResponse } from 'next';
import { AppleAuthAPI } from '../../../apple-auth/api/auth-endpoints';

interface TwoFactorRequest {
  code: string;
  token: string;
}

interface TwoFactorResponse {
  success: boolean;
  isAuthenticated: boolean;
  sessionId?: string;
  email?: string;
  lastLogin?: string;
  expiresAt?: string;
  error?: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TwoFactorResponse>
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
    console.log('🔐 API Endpoint: Procesando código 2FA...');
    
    const { code, token }: TwoFactorRequest = req.body;

    // Validar entrada
    if (!code || !token) {
      return res.status(400).json({
        success: false,
        isAuthenticated: false,
        error: 'Código y token son requeridos',
        message: 'Parámetros faltantes'
      });
    }

    // Validar formato del código
    if (!/^\d{6}$/.test(code.trim())) {
      return res.status(400).json({
        success: false,
        isAuthenticated: false,
        error: 'El código debe tener 6 dígitos',
        message: 'Formato de código inválido'
      });
    }

    // Obtener instancia de la API
    const appleAuthAPI = AppleAuthAPI.getInstance();

    // Procesar código 2FA
    const authResult = await appleAuthAPI.handle2FA(code.trim(), token);

    if (authResult.isAuthenticated) {
      console.log('✅ 2FA Apple completado exitosamente');
      
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        sessionId: authResult.sessionId,
        email: authResult.email,
        lastLogin: authResult.lastLogin?.toISOString(),
        expiresAt: authResult.expiresAt?.toISOString(),
        message: 'Autenticación de dos factores completada exitosamente'
      });
    } else {
      console.log('❌ Error en 2FA Apple:', authResult.error);
      
      return res.status(400).json({
        success: false,
        isAuthenticated: false,
        error: authResult.error,
        message: authResult.error || 'Error en verificación de dos factores'
      });
    }
  } catch (error) {
    console.error('❌ Error crítico en endpoint 2FA Apple:', error);
    
    return res.status(500).json({
      success: false,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Error interno del servidor'
    });
  }
}
