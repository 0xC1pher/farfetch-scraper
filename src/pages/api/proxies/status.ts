import type { NextApiRequest, NextApiResponse } from 'next';
import { ProxyManager } from '../../../proxy-manager/index.js';

interface ProxyStatusResponse {
  success: boolean;
  proxies?: {
    total: number;
    active: number;
    inactive: number;
    details: Array<{
      id: string;
      host: string;
      port: number;
      type: string;
      country?: string;
      isActive: boolean;
      lastChecked?: Date;
      latency?: number;
      successRate?: number;
    }>;
  };
  currentProxy?: {
    host: string;
    port: number;
    type: string;
  };
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProxyStatusResponse>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getProxyStatus(res);
      
      case 'POST':
        return await rotateProxy(res);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Proxy API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function getProxyStatus(res: NextApiResponse<ProxyStatusResponse>) {
  try {
    // Crear instancia del ProxyManager
    const proxyManager = new ProxyManager({
      rotationStrategy: 'round-robin',
      providers: [] // Se cargarán automáticamente
    });

    // Obtener estado de los proxies
    const allProxies = proxyManager.getAllProxies();
    const activeProxies = proxyManager.getActiveProxies();
    const currentProxy = await proxyManager.getNextProxy();

    // Preparar detalles de los proxies
    const proxyDetails = allProxies.map(proxy => ({
      id: `${proxy.host}:${proxy.port}`,
      host: proxy.host,
      port: proxy.port,
      type: proxy.type,
      country: proxy.country,
      isActive: activeProxies.includes(proxy),
      lastChecked: proxy.lastChecked,
      latency: proxy.latency,
      successRate: proxy.successRate
    }));

    return res.status(200).json({
      success: true,
      proxies: {
        total: allProxies.length,
        active: activeProxies.length,
        inactive: allProxies.length - activeProxies.length,
        details: proxyDetails
      },
      currentProxy: currentProxy ? {
        host: currentProxy.host,
        port: currentProxy.port,
        type: currentProxy.type
      } : undefined,
      message: 'Proxy status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting proxy status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get proxy status'
    });
  }
}

async function rotateProxy(res: NextApiResponse<ProxyStatusResponse>) {
  try {
    // Crear instancia del ProxyManager
    const proxyManager = new ProxyManager({
      rotationStrategy: 'round-robin',
      providers: []
    });

    // Forzar rotación de proxy
    const newProxy = await proxyManager.getNextProxy();

    if (!newProxy) {
      return res.status(503).json({
        success: false,
        error: 'No proxies available for rotation'
      });
    }

    return res.status(200).json({
      success: true,
      currentProxy: {
        host: newProxy.host,
        port: newProxy.port,
        type: newProxy.type
      },
      message: 'Proxy rotated successfully'
    });

  } catch (error) {
    console.error('Error rotating proxy:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rotate proxy'
    });
  }
}
