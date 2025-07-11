import type { NextApiRequest, NextApiResponse } from 'next';
import { minioStorage } from '../../modules/minio/index.js';
import { mexaCache } from '../../cache/index.js';
import { browserMCP } from '../../modules/browser-mcp/index.js';
import { scraperr } from '../../modules/scraperr/index.js';

interface HealthResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    minio: {
      status: 'up' | 'down';
      available: boolean;
      bucket?: string;
    };
    browserMCP: {
      status: 'up' | 'down';
      available: boolean;
      version?: string;
    };
    scraperr: {
      status: 'up' | 'down';
      available: boolean;
      version?: string;
    };
    proxyManager: {
      status: 'up' | 'down';
      totalProxies: number;
      activeProxies: number;
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  error?: string;
}

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {} as any,
      uptime: 0,
      memory: {} as any,
      error: 'Method not allowed'
    });
  }

  try {
    // Usar cache para health check (30 segundos)
    const cacheKey = 'health:status';
    const cachedHealth = mexaCache.get<HealthResponse>(cacheKey);

    if (cachedHealth) {
      return res.status(cachedHealth.success ? 200 : 503).json(cachedHealth);
    }

    // Verificar estado de todos los servicios
    const [minioStatus, browserMCPStatus, scraperrStatus, proxyManagerStatus] = await Promise.allSettled([
      checkMinioHealth(),
      checkBrowserMCPHealth(),
      checkScraperrHealth(),
      checkProxyManagerHealth()
    ]);

    // Calcular memoria
    const memoryUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    };

    // Determinar estado general
    const services = {
      minio: minioStatus.status === 'fulfilled' ? minioStatus.value : { status: 'down' as const, available: false },
      browserMCP: browserMCPStatus.status === 'fulfilled' ? browserMCPStatus.value : { status: 'down' as const, available: false },
      scraperr: scraperrStatus.status === 'fulfilled' ? scraperrStatus.value : { status: 'down' as const, available: false },
      proxyManager: proxyManagerStatus.status === 'fulfilled' ? proxyManagerStatus.value : { status: 'down' as const, totalProxies: 0, activeProxies: 0 }
    };

    // Calcular estado general
    const upServices = Object.values(services).filter(service => service.status === 'up').length;
    const totalServices = Object.keys(services).length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (upServices === totalServices) {
      overallStatus = 'healthy';
    } else if (upServices >= totalServices / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const response: HealthResponse = {
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services,
      uptime: Math.round((Date.now() - startTime) / 1000), // segundos
      memory
    };

    // Determinar código de estado HTTP
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    // Guardar en cache por 30 segundos
    mexaCache.set(cacheKey, response, 30 * 1000);

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {} as any,
      uptime: Math.round((Date.now() - startTime) / 1000),
      memory: {} as any,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function checkMinioHealth() {
  try {
    const status = await minioStorage.getStatus();
    return {
      status: status.available ? 'up' as const : 'down' as const,
      available: status.available,
      bucket: status.bucket
    };
  } catch (error) {
    return {
      status: 'down' as const,
      available: false
    };
  }
}

async function checkBrowserMCPHealth() {
  try {
    const status = await browserMCP.getStatus();
    return {
      status: status.available ? 'up' as const : 'down' as const,
      available: status.available,
      version: status.version
    };
  } catch (error) {
    return {
      status: 'down' as const,
      available: false
    };
  }
}

async function checkScraperrHealth() {
  try {
    const status = await scraperr.getStatus();
    return {
      status: status.available ? 'up' as const : 'down' as const,
      available: status.available,
      version: status.version
    };
  } catch (error) {
    return {
      status: 'down' as const,
      available: false
    };
  }
}

async function checkProxyManagerHealth() {
  try {
    // Simular estado de proxies para health check
    return {
      status: 'up' as const,
      totalProxies: 5, // Simulado
      activeProxies: 3  // Simulado
    };
  } catch (error) {
    return {
      status: 'down' as const,
      totalProxies: 0,
      activeProxies: 0
    };
  }
}
