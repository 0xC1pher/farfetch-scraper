import type { NextApiRequest, NextApiResponse } from 'next';
import { minioStorage } from '../../../modules/minio/index.js';
import { mexaCache } from '../../../cache/index.js';

interface OffersRequest {
  limit?: number;
  url?: string;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    minDiscount?: number;
  };
}

interface OffersResponse {
  success: boolean;
  offers?: any[];
  totalFound?: number;
  message?: string;
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
    const { 
      limit = 50, 
      url = 'https://www.farfetch.com',
      filters 
    }: OffersRequest = req.query;

    // Validación de parámetros
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 200) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 200'
      });
    }

    console.log(`[API] Fetching latest offers with limit: ${limitNum}`);

    // Usar cache para respuesta rápida
    const cacheKey = `offers:${url}:${limitNum}:${JSON.stringify(filters)}`;
    const cachedOffers = mexaCache.get<any[]>(cacheKey);

    if (cachedOffers && Array.isArray(cachedOffers)) {
      console.log(`[API] Returning cached offers: ${cachedOffers.length} items`);
      return res.status(200).json({
        success: true,
        offers: cachedOffers,
        totalFound: cachedOffers.length,
        message: `Found ${cachedOffers.length} offers (cached)`
      });
    }

    // Obtener datos de scraping desde MinIO
    const scrapingData = await minioStorage.getScrapingData(url as string, limitNum);

    if (!scrapingData || scrapingData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No offers found'
      });
    }

    // Extraer todas las ofertas de los datos de scraping
    let allOffers: any[] = [];
    scrapingData.forEach(data => {
      if (data.offers && Array.isArray(data.offers)) {
        allOffers = allOffers.concat(data.offers);
      }
    });

    // Aplicar filtros si se proporcionan
    let filteredOffers = allOffers;
    if (filters) {
      filteredOffers = applyFilters(allOffers, filters);
    }

    // Ordenar por timestamp (más recientes primero)
    filteredOffers.sort((a, b) => {
      const timestampA = new Date(a.timestamp || 0).getTime();
      const timestampB = new Date(b.timestamp || 0).getTime();
      return timestampB - timestampA;
    });

    // Limitar resultados
    const limitedOffers = filteredOffers.slice(0, limitNum);

    console.log(`[API] Returning ${limitedOffers.length} offers`);

    // Guardar en cache para próximas consultas
    mexaCache.set(cacheKey, limitedOffers, 5 * 60 * 1000); // 5 minutos

    return res.status(200).json({
      success: true,
      offers: limitedOffers,
      totalFound: limitedOffers.length,
      message: `Found ${limitedOffers.length} offers`
    });

  } catch (error) {
    console.error('Error fetching offers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch offers'
    });
  }
}

function applyFilters(offers: any[], filters: any): any[] {
  return offers.filter(offer => {
    // Filtro por precio mínimo
    if (filters.minPrice && offer.price < parseFloat(filters.minPrice)) {
      return false;
    }

    // Filtro por precio máximo
    if (filters.maxPrice && offer.price > parseFloat(filters.maxPrice)) {
      return false;
    }

    // Filtro por marca
    if (filters.brand && !offer.brand?.toLowerCase().includes(filters.brand.toLowerCase())) {
      return false;
    }

    // Filtro por descuento mínimo
    if (filters.minDiscount) {
      const discount = offer.discount || 0;
      if (discount < parseFloat(filters.minDiscount)) {
        return false;
      }
    }

    return true;
  });
}
