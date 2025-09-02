import { NextApiRequest, NextApiResponse } from 'next';

interface CacheEntry {
  key: string;
  value: any;
  size: number;
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed: string;
  tags: string[];
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  expiredEntries: number;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

interface CacheResponse {
  success: boolean;
  entries?: CacheEntry[];
  stats?: CacheStats;
  message?: string;
}

// Simulamos datos de cache del sistema
const generateCacheData = (): { entries: CacheEntry[], stats: CacheStats } => {
  const now = new Date();
  
  const entries: CacheEntry[] = [
    {
      key: 'module:browser-mcp:status',
      value: { available: true, version: '1.0.0', lastCheck: now.toISOString() },
      size: 256,
      createdAt: new Date(now.getTime() - 300000).toISOString(),
      expiresAt: new Date(now.getTime() + 300000).toISOString(),
      accessCount: 45,
      lastAccessed: new Date(now.getTime() - 5000).toISOString(),
      tags: ['module', 'status', 'browser-mcp']
    },
    {
      key: 'module:scraperr:status',
      value: { available: true, version: '1.0.0', lastCheck: now.toISOString() },
      size: 248,
      createdAt: new Date(now.getTime() - 280000).toISOString(),
      expiresAt: new Date(now.getTime() + 320000).toISOString(),
      accessCount: 42,
      lastAccessed: new Date(now.getTime() - 3000).toISOString(),
      tags: ['module', 'status', 'scraperr']
    },
    {
      key: 'module:deepscrape:status',
      value: { available: true, version: '1.0.0', lastCheck: now.toISOString() },
      size: 252,
      createdAt: new Date(now.getTime() - 260000).toISOString(),
      expiresAt: new Date(now.getTime() + 340000).toISOString(),
      accessCount: 38,
      lastAccessed: new Date(now.getTime() - 2000).toISOString(),
      tags: ['module', 'status', 'deepscrape']
    },
    {
      key: 'api:health:response',
      value: { 
        status: 'healthy', 
        services: { minio: true, modules: true },
        timestamp: now.toISOString()
      },
      size: 512,
      createdAt: new Date(now.getTime() - 30000).toISOString(),
      expiresAt: new Date(now.getTime() + 30000).toISOString(),
      accessCount: 156,
      lastAccessed: new Date(now.getTime() - 1000).toISOString(),
      tags: ['api', 'health', 'system']
    },
    {
      key: 'bot:status:telegram',
      value: {
        isRunning: true,
        activeSessions: 2,
        uptime: 3600,
        lastActivity: now.toISOString()
      },
      size: 384,
      createdAt: new Date(now.getTime() - 120000).toISOString(),
      expiresAt: new Date(now.getTime() + 180000).toISOString(),
      accessCount: 89,
      lastAccessed: new Date(now.getTime() - 500).toISOString(),
      tags: ['bot', 'telegram', 'status']
    },
    {
      key: 'workflow:farfetch:config',
      value: {
        target: 'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx',
        modules: ['browser-mcp', 'scraperr', 'deepscrape'],
        filters: { category: 'women', sale: true }
      },
      size: 1024,
      createdAt: new Date(now.getTime() - 600000).toISOString(),
      expiresAt: new Date(now.getTime() + 1800000).toISOString(),
      accessCount: 12,
      lastAccessed: new Date(now.getTime() - 60000).toISOString(),
      tags: ['workflow', 'farfetch', 'config']
    },
    {
      key: 'proxy:list:active',
      value: [
        { id: 1, host: '192.168.1.100', port: 8080, status: 'active' },
        { id: 2, host: '192.168.1.101', port: 8080, status: 'active' },
        { id: 3, host: '192.168.1.102', port: 8080, status: 'inactive' }
      ],
      size: 768,
      createdAt: new Date(now.getTime() - 900000).toISOString(),
      expiresAt: new Date(now.getTime() + 600000).toISOString(),
      accessCount: 67,
      lastAccessed: new Date(now.getTime() - 15000).toISOString(),
      tags: ['proxy', 'network', 'config']
    },
    {
      key: 'session:apple-auth:expired',
      value: { sessionId: 'expired-123', status: 'expired' },
      size: 128,
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
      expiresAt: new Date(now.getTime() - 3600000).toISOString(), // Expired 1 hour ago
      accessCount: 5,
      lastAccessed: new Date(now.getTime() - 3600000).toISOString(),
      tags: ['session', 'apple-auth', 'expired']
    }
  ];

  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  const expiredEntries = entries.filter(entry => 
    entry.expiresAt && new Date(entry.expiresAt) < now
  ).length;

  const stats: CacheStats = {
    totalEntries: entries.length,
    totalSize,
    hitRate: 87.5,
    missRate: 12.5,
    expiredEntries,
    memoryUsage: {
      used: totalSize,
      available: 50 * 1024 * 1024, // 50MB
      percentage: (totalSize / (50 * 1024 * 1024)) * 100
    }
  };

  return { entries, stats };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheResponse>
) {
  console.log(`[API] ${req.method} /api/cache - Client:`, req.socket.remoteAddress);

  if (req.method === 'GET') {
    try {
      const { tag, expired, stats } = req.query;
      const { entries, stats: cacheStats } = generateCacheData();

      // Si solo se solicitan estadísticas
      if (stats === 'true') {
        console.log('[API] GET /api/cache - 200 - Cache stats returned');
        return res.status(200).json({
          success: true,
          stats: cacheStats
        });
      }

      let filteredEntries = entries;

      // Filtrar por tag si se especifica
      if (tag && typeof tag === 'string') {
        filteredEntries = entries.filter(entry => 
          entry.tags.includes(tag.toLowerCase())
        );
      }

      // Filtrar por entradas expiradas si se especifica
      if (expired === 'true') {
        const now = new Date();
        filteredEntries = filteredEntries.filter(entry => 
          entry.expiresAt && new Date(entry.expiresAt) < now
        );
      }

      console.log(`[API] GET /api/cache - 200 - ${filteredEntries.length} cache entries returned`);
      return res.status(200).json({
        success: true,
        entries: filteredEntries,
        stats: cacheStats
      });

    } catch (error) {
      console.error('Error fetching cache data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving cache data'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { key, tag, expired } = req.query;

      if (key) {
        // Eliminar entrada específica
        console.log(`[API] DELETE /api/cache - 200 - Cache entry deleted: ${key}`);
        return res.status(200).json({
          success: true,
          message: `Cache entry '${key}' deleted successfully`
        });
      }

      if (tag) {
        // Eliminar por tag
        console.log(`[API] DELETE /api/cache - 200 - Cache entries with tag '${tag}' deleted`);
        return res.status(200).json({
          success: true,
          message: `Cache entries with tag '${tag}' deleted successfully`
        });
      }

      if (expired === 'true') {
        // Limpiar entradas expiradas
        console.log('[API] DELETE /api/cache - 200 - Expired cache entries cleaned');
        return res.status(200).json({
          success: true,
          message: 'Expired cache entries cleaned successfully'
        });
      }

      // Limpiar todo el cache
      console.log('[API] DELETE /api/cache - 200 - All cache cleared');
      return res.status(200).json({
        success: true,
        message: 'All cache cleared successfully'
      });

    } catch (error) {
      console.error('Error clearing cache:', error);
      return res.status(500).json({
        success: false,
        message: 'Error clearing cache'
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}
