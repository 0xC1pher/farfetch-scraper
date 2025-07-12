import type { NextApiRequest, NextApiResponse } from 'next';
import { TelegramOffersService } from '../../../services/telegram-offers';
import { TelegramOffer } from '../../../types/telegram-offers';

interface FavoritesResponse {
  success: boolean;
  data?: TelegramOffer[];
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FavoritesResponse>
) {
  const { chatId } = req.query;

  if (!chatId || typeof chatId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Chat ID is required'
    });
  }

  const offersService = TelegramOffersService.getInstance();

  try {
    switch (req.method) {
      case 'GET':
        // Obtener favoritos
        const favorites = await offersService.getFavorites(chatId);
        return res.status(200).json({
          success: true,
          data: favorites
        });

      case 'POST':
        // Agregar a favoritos
        const { offerId } = req.body;
        if (!offerId) {
          return res.status(400).json({
            success: false,
            error: 'Offer ID is required'
          });
        }

        await offersService.addToFavorites(chatId, offerId);
        return res.status(200).json({
          success: true,
          message: 'Added to favorites'
        });

      case 'DELETE':
        // Remover de favoritos
        const { offerId: removeOfferId } = req.body;
        if (!removeOfferId) {
          return res.status(400).json({
            success: false,
            error: 'Offer ID is required'
          });
        }

        await offersService.removeFromFavorites(chatId, removeOfferId);
        return res.status(200).json({
          success: true,
          message: 'Removed from favorites'
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Error managing favorites:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
