import type { NextApiRequest, NextApiResponse } from 'next';
import { mexaCache } from '../../../cache/index.js';
import { withMiddleware, requestLogger, cors } from '../../../middleware/api-middleware.js';

interface CacheStatsResponse {
  success: boolean;
  stats?: {
    totalEntries: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    memoryUsage: number;
    popularEntries: Array<{key: string, hits: number}>;
  };
  actions?: {
    cleanup: string;
    clear: string;
    invalidate: string;
  };
  message?: string;
  error?: string;
}

async function cacheStatsHandler(
  req: NextApiRequest,
  res: NextApiResponse<CacheStatsResponse>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getCacheStats(res);
      
      case 'POST':
        return await handleCacheAction(req, res);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Cache stats API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function getCacheStats(res: NextApiResponse<CacheStatsResponse>) {
  try {
    const stats = mexaCache.getStats();
    const popularEntries = mexaCache.getPopularEntries(10);

    return res.status(200).json({
      success: true,
      stats: {
        ...stats,
        popularEntries
      },
      actions: {
        cleanup: 'POST /api/cache/stats with action=cleanup',
        clear: 'POST /api/cache/stats with action=clear',
        invalidate: 'POST /api/cache/stats with action=invalidate&pattern=...'
      },
      message: 'Cache statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting cache stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
}

async function handleCacheAction(req: NextApiRequest, res: NextApiResponse<CacheStatsResponse>) {
  try {
    const { action, pattern } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    let result: any = {};

    switch (action) {
      case 'cleanup':
        const cleaned = mexaCache.cleanup();
        result = { cleaned };
        break;

      case 'clear':
        mexaCache.clear();
        result = { message: 'Cache cleared completely' };
        break;

      case 'invalidate':
        if (!pattern) {
          return res.status(400).json({
            success: false,
            error: 'Pattern is required for invalidate action'
          });
        }
        const invalidated = mexaCache.invalidatePattern(pattern);
        result = { invalidated, pattern };
        break;

      case 'invalidate-offers':
        const offersInvalidated = mexaCache.invalidateOffers();
        result = { invalidated: offersInvalidated, type: 'offers' };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Valid actions: cleanup, clear, invalidate, invalidate-offers'
        });
    }

    // Obtener estadísticas actualizadas
    const updatedStats = mexaCache.getStats();

    return res.status(200).json({
      success: true,
      stats: {
        ...updatedStats,
        popularEntries: mexaCache.getPopularEntries(5)
      },
      message: `Action '${action}' completed successfully`,
      ...result
    });

  } catch (error) {
    console.error('Error handling cache action:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute cache action'
    });
  }
}

// Exportar con middleware aplicado
export default withMiddleware(
  cors(),
  requestLogger()
)(cacheStatsHandler);
