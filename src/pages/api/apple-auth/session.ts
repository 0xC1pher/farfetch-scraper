import type { NextApiRequest, NextApiResponse } from 'next';
import { AppleAuthAPI } from '../../../apple-auth/api/auth-endpoints';

interface SessionResponse {
  success: boolean;
  sessionId?: string;
  cookies?: any[];
  hasActiveSession: boolean;
  error?: string;
  message: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionResponse | LogoutResponse>
) {
  try {
    const appleAuthAPI = AppleAuthAPI.getInstance();

    if (req.method === 'GET') {
      // Obtener información de sesión y cookies
      console.log('🍎 API Endpoint: Obteniendo sesión Apple...');
      
      const sessionResult = await appleAuthAPI.getSessionCookies();
      const hasActiveSession = appleAuthAPI.hasActiveSession();

      if (sessionResult.success) {
        console.log('✅ Sesión Apple obtenida exitosamente');
        
        return res.status(200).json({
          success: true,
          sessionId: sessionResult.sessionId,
          cookies: sessionResult.cookies,
          hasActiveSession,
          message: 'Sesión Apple obtenida exitosamente'
        });
      } else {
        console.log('❌ No hay sesión Apple disponible');
        
        return res.status(200).json({
          success: false,
          hasActiveSession: false,
          error: sessionResult.error,
          message: sessionResult.error || 'No hay sesión Apple disponible'
        });
      }
    } else if (req.method === 'DELETE') {
      // Cerrar sesión
      console.log('🔓 API Endpoint: Cerrando sesión Apple...');
      
      const logoutResult = await appleAuthAPI.logout();
      
      if (logoutResult.success) {
        console.log('✅ Sesión Apple cerrada exitosamente');
        
        return res.status(200).json({
          success: true,
          message: logoutResult.message
        });
      } else {
        console.log('❌ Error cerrando sesión Apple');
        
        return res.status(500).json({
          success: false,
          message: logoutResult.message
        });
      }
    } else if (req.method === 'PUT') {
      // Renovar sesión
      console.log('🔄 API Endpoint: Renovando sesión Apple...');
      
      const renewResult = await appleAuthAPI.renewSession();
      
      if (renewResult.success) {
        console.log('✅ Sesión Apple renovada:', renewResult.renewed);
        
        return res.status(200).json({
          success: true,
          message: renewResult.message
        });
      } else {
        console.log('❌ Error renovando sesión Apple');
        
        return res.status(500).json({
          success: false,
          message: renewResult.message
        });
      }
    } else {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }
  } catch (error) {
    console.error('❌ Error en endpoint session Apple:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Error interno del servidor'
    });
  }
}
