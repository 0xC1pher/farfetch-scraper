import type { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

interface DocsResponse {
  success: boolean;
  documentation?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DocsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Leer el archivo swagger.yaml
    const swaggerPath = join(process.cwd(), 'docs', 'api', 'swagger.yaml');
    const swaggerContent = readFileSync(swaggerPath, 'utf8');
    
    // Parsear YAML a JSON
    const documentation = yaml.load(swaggerContent);

    // Agregar información adicional
    const enhancedDocs = {
      ...documentation,
      'x-mexa-info': {
        version: '1.0.0',
        buildDate: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        features: [
          'Autenticación con Farfetch',
          'Web scraping automatizado',
          'Gestión de proxies',
          'Persistencia en MinIO',
          'Rate limiting',
          'Filtros avanzados'
        ],
        endpoints: {
          total: 6,
          authentication: 1,
          sessions: 2,
          scraping: 1,
          offers: 1,
          proxies: 2
        }
      }
    };

    return res.status(200).json({
      success: true,
      documentation: enhancedDocs
    });

  } catch (error) {
    console.error('Error loading API documentation:', error);
    
    // Fallback con documentación básica
    const fallbackDocs = {
      openapi: '3.0.3',
      info: {
        title: 'Mexa Farfetch Scraper API',
        version: '1.0.0',
        description: 'API REST para el sistema de web scraping de Farfetch'
      },
      servers: [
        {
          url: `${req.headers.origin || 'http://localhost:3000'}/api`,
          description: 'Current server'
        }
      ],
      paths: {
        '/auth/login': {
          post: {
            summary: 'Autenticar usuario en Farfetch',
            tags: ['Autenticación']
          }
        },
        '/sessions/{id}': {
          get: {
            summary: 'Obtener información de sesión',
            tags: ['Sesiones']
          },
          delete: {
            summary: 'Eliminar sesión',
            tags: ['Sesiones']
          }
        },
        '/scraping/start': {
          post: {
            summary: 'Iniciar proceso de scraping',
            tags: ['Scraping']
          }
        },
        '/offers/latest': {
          get: {
            summary: 'Obtener ofertas más recientes',
            tags: ['Ofertas']
          }
        },
        '/proxies/status': {
          get: {
            summary: 'Obtener estado de proxies',
            tags: ['Proxies']
          },
          post: {
            summary: 'Rotar proxy actual',
            tags: ['Proxies']
          }
        }
      },
      'x-mexa-info': {
        error: 'Could not load full documentation',
        fallback: true
      }
    };

    return res.status(200).json({
      success: true,
      documentation: fallbackDocs
    });
  }
}
