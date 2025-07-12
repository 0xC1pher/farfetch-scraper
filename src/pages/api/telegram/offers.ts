import type { NextApiRequest, NextApiResponse } from 'next';
import { TelegramOffersService } from '../../../services/telegram-offers';
import { TelegramCarousel, TelegramFilters } from '../../../types/telegram-offers';

interface OffersRequest {
  page?: number;
  filters?: TelegramFilters;
}

interface OffersResponse {
  success: boolean;
  data?: TelegramCarousel;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OffersResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { page = 0, ...filters } = req.query;
    
    // Convertir query params a filtros
    const telegramFilters: TelegramFilters = {};
    
    if (filters.categoria) {
      telegramFilters.categoria = filters.categoria as any;
    }
    if (filters.precioMin) {
      telegramFilters.precioMin = Number(filters.precioMin);
    }
    if (filters.precioMax) {
      telegramFilters.precioMax = Number(filters.precioMax);
    }
    if (filters.marca) {
      telegramFilters.marca = filters.marca as string;
    }
    if (filters.descuentoMin) {
      telegramFilters.descuentoMin = Number(filters.descuentoMin);
    }
    if (filters.disponible) {
      telegramFilters.disponible = filters.disponible === 'true';
    }
    if (filters.talla) {
      telegramFilters.talla = filters.talla as string;
    }
    if (filters.color) {
      telegramFilters.color = filters.color as string;
    }

    const offersService = TelegramOffersService.getInstance();
    const carousel = await offersService.getOffers(Number(page), telegramFilters);

    res.status(200).json({
      success: true,
      data: carousel
    });

  } catch (error) {
    console.error('Error getting telegram offers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
