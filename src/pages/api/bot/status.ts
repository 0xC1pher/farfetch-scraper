import type { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware, requestLogger, cors } from '../../../middleware/api-middleware';

interface BotStatusResponse {
  success: boolean;
  bot?: {
    isConfigured: boolean;
    isRunning: boolean;
    activeSessions: number;
    uptime: number;
    lastActivity?: string;
    config?: {
      maxOffersPerMessage: number;
      hasAdmins: boolean;
    };
  };
  message?: string;
  error?: string;
}

async function botStatusHandler(
  req: NextApiRequest,
  res: NextApiResponse<BotStatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Verificar si el bot está configurado
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const isConfigured = !!botToken;

    if (!isConfigured) {
      return res.status(200).json({
        success: true,
        bot: {
          isConfigured: false,
          isRunning: false,
          activeSessions: 0,
          uptime: 0
        },
        message: 'Bot not configured - TELEGRAM_BOT_TOKEN missing'
      });
    }

    // En un entorno real, aquí obtendríamos el estado del bot
    // Por ahora simulamos el estado
    const botStatus = {
      isConfigured: true,
      isRunning: false, // Se actualizaría cuando el bot esté corriendo
      activeSessions: 0,
      uptime: Math.floor(process.uptime()),
      lastActivity: new Date().toISOString(),
      config: {
        maxOffersPerMessage: parseInt(process.env.MAX_OFFERS_PER_MESSAGE || '10'),
        hasAdmins: !!(process.env.TELEGRAM_ADMIN_CHAT_IDS?.length)
      }
    };

    return res.status(200).json({
      success: true,
      bot: botStatus,
      message: 'Bot status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting bot status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get bot status'
    });
  }
}

// Exportar con middleware aplicado
export default withMiddleware(
  cors(),
  requestLogger()
)(botStatusHandler);
