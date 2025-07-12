import { NextApiRequest, NextApiResponse } from 'next';
import { MinioStorage } from '../../../modules/minio';

const minio = new MinioStorage();

// Módulos soportados
const SUPPORTED_MODULES = ['browser-mcp', 'scraperr', 'deepscrape', 'custom'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { module } = req.query;

    if (module && typeof module === 'string') {
      // Estadísticas de un módulo específico
      const stats = await minio.getModuleStats(module);
      return res.status(200).json({
        success: true,
        module,
        stats
      });
    } else {
      // Estadísticas de todos los módulos
      const allStats = await Promise.all(
        SUPPORTED_MODULES.map(async (moduleName) => {
          try {
            const stats = await minio.getModuleStats(moduleName);
            return {
              module: moduleName,
              ...stats
            };
          } catch (error) {
            console.error(`Error getting stats for module ${moduleName}:`, error);
            return {
              module: moduleName,
              totalExtractions: 0,
              successfulExtractions: 0,
              failedExtractions: 0,
              successRate: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      // Calcular estadísticas globales
      const globalStats = allStats.reduce((acc, moduleStats) => {
        acc.totalExtractions += moduleStats.totalExtractions;
        acc.successfulExtractions += moduleStats.successfulExtractions;
        acc.failedExtractions += moduleStats.failedExtractions;
        return acc;
      }, {
        totalExtractions: 0,
        successfulExtractions: 0,
        failedExtractions: 0
      });

      const globalSuccessRate = globalStats.totalExtractions > 0 
        ? (globalStats.successfulExtractions / globalStats.totalExtractions) * 100 
        : 0;

      return res.status(200).json({
        success: true,
        global: {
          ...globalStats,
          successRate: Math.round(globalSuccessRate * 100) / 100
        },
        modules: allStats,
        supportedModules: SUPPORTED_MODULES,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in modules stats API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
