import { NextApiRequest, NextApiResponse } from 'next';
import StartupManager from '../../../modules/startup';
import PortManager from '../../../modules/port-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetStatus(req, res);
  } else if (req.method === 'POST') {
    return handleInitialize(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const portManager = PortManager.getInstance();
    const startup = new StartupManager();
    
    // Obtener configuración actual de puertos
    const portConfigs = await portManager.configureServicePorts();
    const systemStatus = startup.getSystemStatus();
    
    // Verificar estado de servicios
    const services = {
      nextjs: {
        status: 'running',
        port: process.env.PORT || 3000,
        description: 'Servidor Next.js principal'
      },
      minio: {
        status: systemStatus.minio.available ? 'running' : 'stopped',
        port: process.env.MINIO_PORT || 9000,
        consolePort: process.env.MINIO_CONSOLE_PORT || 9001,
        description: 'Servidor de almacenamiento MinIO'
      },
      modules: {
        'browser-mcp': portConfigs.get('browser-mcp'),
        'scraperr': portConfigs.get('scraperr'),
        'deepscrape': portConfigs.get('deepscrape')
      }
    };

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      services,
      ports: Object.fromEntries(portConfigs),
      minio: {
        available: systemStatus.minio.available,
        bucket: 'mexa-data',
        endpoints: {
          api: `http://localhost:${services.minio.port}`,
          console: `http://localhost:${services.minio.consolePort}`
        }
      }
    });

  } catch (error) {
    console.error('Error getting system status:', error);
    return res.status(500).json({
      success: false,
      error: 'Error getting system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleInitialize(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔄 Inicialización forzada del sistema solicitada...');
    
    const startup = new StartupManager();
    const result = await startup.initialize();
    
    return res.status(200).json({
      success: result.success,
      message: result.success 
        ? 'Sistema inicializado correctamente' 
        : 'Sistema inicializado con errores',
      timestamp: new Date().toISOString(),
      details: {
        ports: Object.fromEntries(result.ports),
        minio: result.minio,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('Error initializing system:', error);
    return res.status(500).json({
      success: false,
      error: 'Error initializing system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
