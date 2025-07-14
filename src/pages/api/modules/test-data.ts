import { NextApiRequest, NextApiResponse } from 'next';
import { MinioStorage } from '../../../modules/minio';

const minio = new MinioStorage();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generar datos de prueba para Browser-MCP
    await minio.saveBrowserMCPData({
      action: 'login',
      email: 'test@example.com',
      sessionId: 'sess_' + Date.now(),
      cookies: [
        { name: 'session_token', value: 'abc123', domain: '.farfetch.com' },
        { name: 'user_pref', value: 'es-ES', domain: '.farfetch.com' }
      ],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1366, height: 768 },
      fingerprint: {
        canvas: 'canvas_hash_123',
        webgl: 'webgl_hash_456',
        fonts: ['Arial', 'Helvetica', 'Times New Roman']
      },
      proxy: {
        host: '192.168.1.100',
        port: 8080,
        country: 'ES'
      }
    }, 'https://www.farfetch.com/login');

    // Generar datos de prueba para Scraperr
    await minio.saveScaperrData({
      selectors: ['.product-card', '.price', '.title', '.image'],
      items: [
        {
          id: 'prod_001',
          title: 'Zapatillas Nike Air Max',
          price: 129.99,
          currency: 'EUR',
          image: 'https://example.com/image1.jpg',
          brand: 'Nike',
          category: 'Calzado',
          sizes: ['40', '41', '42', '43'],
          colors: ['Negro', 'Blanco'],
          discount: 20
        },
        {
          id: 'prod_002',
          title: 'Camiseta Adidas Originals',
          price: 45.50,
          currency: 'EUR',
          image: 'https://example.com/image2.jpg',
          brand: 'Adidas',
          category: 'Ropa',
          sizes: ['S', 'M', 'L', 'XL'],
          colors: ['Azul', 'Negro', 'Gris'],
          discount: 15
        }
      ],
      itemCount: 2,
      options: {
        maxPages: 5,
        delay: 2000,
        scrollTimes: 3
      }
    }, 'https://www.farfetch.com/es/shopping/men/sneakers/items.aspx');

    // Generar datos de prueba para DeepScrape
    await minio.saveDeepScrapeData({
      elements: [
        {
          type: 'product',
          selector: 'div[data-testid="product-card"]',
          description: 'Tarjeta de producto principal',
          confidence: 0.95,
          attributes: {
            'data-product-id': 'prod_001',
            'data-brand': 'Nike'
          }
        },
        {
          type: 'price',
          selector: 'span.price-current',
          description: 'Precio actual del producto',
          confidence: 0.98,
          text: '129,99 €'
        }
      ],
      extractedData: [
        {
          productId: 'prod_001',
          extractedBy: 'semantic-analysis',
          confidence: 0.95,
          data: {
            title: 'Zapatillas Nike Air Max (Extraído por IA)',
            price: 129.99,
            availability: 'En stock',
            rating: 4.5,
            reviews: 234
          }
        }
      ],
      extractedCount: 1,
      depth: 3,
      waitForSelector: 'div[data-testid="product-card"]',
      timeout: 30000
    }, 'https://www.farfetch.com/es/shopping/men/sneakers/items.aspx');

    // Generar algunos datos adicionales con diferentes estados
    await minio.saveBrowserMCPData({
      action: 'navigation',
      sessionId: 'sess_' + (Date.now() + 1000),
      cookies: [],
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      viewport: { width: 1920, height: 1080 },
      fingerprint: {
        canvas: 'canvas_hash_789',
        webgl: 'webgl_hash_012'
      }
    }, 'https://www.farfetch.com/es/shopping/women/bags');

    // Generar un dato con error para mostrar manejo de fallos
    const errorData = {
      module: 'scraperr',
      url: 'https://www.farfetch.com/error-page',
      data: null,
      timestamp: new Date(),
      success: false,
      error: 'Página no encontrada - Error 404',
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        attemptNumber: 3,
        lastAttempt: new Date().toISOString()
      }
    };

    await minio.saveModuleData(errorData);

    return res.status(200).json({
      success: true,
      message: 'Datos de prueba generados exitosamente',
      generated: {
        'browser-mcp': 2,
        'scraperr': 1,
        'deepscrape': 1,
        'errors': 1
      },
      structure: {
        bucket: 'mexa-data',
        paths: [
          'extraction/browser-mcp/' + new Date().toISOString().split('T')[0] + '/',
          'extraction/scraperr/' + new Date().toISOString().split('T')[0] + '/',
          'extraction/deepscrape/' + new Date().toISOString().split('T')[0] + '/'
        ]
      }
    });

  } catch (error) {
    console.error('Error generating test data:', error);
    return res.status(500).json({
      success: false,
      error: 'Error generating test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
