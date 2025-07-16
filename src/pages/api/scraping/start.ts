import type { NextApiRequest, NextApiResponse } from 'next';
import { SimpleOrchestrator } from '../../../orchestrator/simple-orchestrator';

interface ScrapingRequest {
  sessionId: string;
  scrapeUrl: string;
  maxRetries?: number;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    category?: string;
  };
}

interface ScrapingResponse {
  success: boolean;
  jobId?: string;
  offers?: any[];
  totalFound?: number;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScrapingResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { 
      sessionId, 
      scrapeUrl, 
      maxRetries = 3,
      filters 
    }: ScrapingRequest = req.body;

    // Validación de entrada
    if (!sessionId || !scrapeUrl) {
      return res.status(400).json({
        success: false,
        error: 'SessionId and scrapeUrl are required'
      });
    }

    // Validar URL
    try {
      new URL(scrapeUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid scrapeUrl format'
      });
    }

    // Generar ID único para el trabajo
    const jobId = `scrape_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Usar el orquestador simple para el scraping
    const orchestrator = await SimpleOrchestrator.create();

    console.log(`[API] Starting scraping job ${jobId} for URL: ${scrapeUrl}`);

    const offers = await orchestrator.scrapeWithSession({
      sessionId,
      scrapeUrl,
      maxRetries
    });

    // Aplicar filtros si se proporcionan
    let filteredOffers = offers;
    if (filters) {
      filteredOffers = applyFilters(offers, filters);
    }

    console.log(`[API] Scraping job ${jobId} completed. Found ${filteredOffers.length} offers`);

    return res.status(200).json({
      success: true,
      jobId,
      offers: filteredOffers,
      totalFound: filteredOffers.length,
      message: `Successfully scraped ${filteredOffers.length} offers`
    });

  } catch (error) {
    console.error('Scraping error:', error);
    
    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      if (error.message.includes('No se pudo obtener una sesión válida')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session'
        });
      }
      
      if (error.message.includes('Scraperr no disponible')) {
        return res.status(503).json({
          success: false,
          error: 'Scraping service temporarily unavailable'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Scraping failed'
    });
  }
}

function applyFilters(offers: any[], filters: ScrapingRequest['filters']): any[] {
  if (!filters) return offers;

  return offers.filter(offer => {
    // Filtro por precio mínimo
    if (filters.minPrice && offer.price < filters.minPrice) {
      return false;
    }

    // Filtro por precio máximo
    if (filters.maxPrice && offer.price > filters.maxPrice) {
      return false;
    }

    // Filtro por marca
    if (filters.brand && !offer.brand?.toLowerCase().includes(filters.brand.toLowerCase())) {
      return false;
    }

    // Filtro por categoría (si está disponible en el offer)
    if (filters.category && offer.category && !offer.category.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
    }

    return true;
  });
}
