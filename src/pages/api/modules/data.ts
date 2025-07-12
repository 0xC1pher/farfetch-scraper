import { NextApiRequest, NextApiResponse } from 'next';
import { MinioStorage } from '../../../modules/minio';

const minio = new MinioStorage();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Error in modules data API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { module, action = 'list', limit = '50' } = req.query;

  if (!module || typeof module !== 'string') {
    return res.status(400).json({ error: 'Module parameter is required' });
  }

  try {
    switch (action) {
      case 'list':
        const data = await minio.listModuleData(module, parseInt(limit as string));
        return res.status(200).json({
          success: true,
          module,
          data,
          count: data.length
        });

      case 'stats':
        const stats = await minio.getModuleStats(module);
        return res.status(200).json({
          success: true,
          module,
          stats
        });

      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error(`Error handling GET for module ${module}:`, error);
    return res.status(500).json({ 
      error: 'Failed to retrieve module data',
      module,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { module, action = 'save' } = req.query;
  const { url, data, success = true, error: errorMsg, metadata } = req.body;

  if (!module || typeof module !== 'string') {
    return res.status(400).json({ error: 'Module parameter is required' });
  }

  if (!url || !data) {
    return res.status(400).json({ error: 'URL and data are required' });
  }

  try {
    switch (action) {
      case 'save':
        switch (module) {
          case 'browser-mcp':
            await minio.saveBrowserMCPData(data, url, success, errorMsg);
            break;
          case 'scraperr':
            await minio.saveScaperrData(data, url, success, errorMsg);
            break;
          case 'deepscrape':
            await minio.saveDeepScrapeData(data, url, success, errorMsg);
            break;
          default:
            // Para módulos personalizados
            const moduleData = {
              module,
              url,
              data,
              timestamp: new Date(),
              success,
              error: errorMsg,
              metadata
            };
            await minio.saveModuleData(moduleData);
            break;
        }

        return res.status(200).json({
          success: true,
          message: `Data saved successfully for module: ${module}`,
          module,
          timestamp: new Date().toISOString()
        });

      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error(`Error handling POST for module ${module}:`, error);
    return res.status(500).json({ 
      error: 'Failed to save module data',
      module,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
