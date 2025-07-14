import { NextApiRequest, NextApiResponse } from 'next';
import { MinioStorage } from '../../../modules/minio';

const minio = new MinioStorage();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Generando datos de demostración para Telegram...');

    // Generar datos de Scraperr (productos reales)
    const scaperrData = {
      selectors: ['.product-card', '.offer-item'],
      items: [
        {
          id: 'scraperr_001',
          title: 'Nike Air Max 270 React',
          price: 149.99,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=375&h=667&fit=crop',
          brand: 'Nike',
          category: 'hombre',
          sizes: ['40', '41', '42', '43', '44'],
          colors: ['Negro', 'Blanco'],
          discount: 25,
          available: true,
          stock: 15,
          reference: 'NK-AM270-001'
        },
        {
          id: 'scraperr_002',
          title: 'Gucci Ace Sneakers',
          price: 590.00,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=375&h=667&fit=crop',
          brand: 'Gucci',
          category: 'mujer',
          sizes: ['36', '37', '38', '39', '40'],
          colors: ['Blanco', 'Verde'],
          discount: 15,
          available: true,
          stock: 8,
          reference: 'GC-ACE-002'
        },
        {
          id: 'scraperr_003',
          title: 'Adidas Ultraboost 22',
          price: 89.99,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=375&h=667&fit=crop',
          brand: 'Adidas',
          category: 'niño',
          sizes: ['28', '29', '30', '31', '32'],
          colors: ['Azul', 'Negro'],
          discount: 30,
          available: true,
          stock: 12,
          reference: 'AD-UB22-003'
        }
      ],
      itemCount: 3,
      options: {
        maxPages: 1,
        delay: 1000,
        scrollTimes: 3
      }
    };

    // Generar datos de DeepScrape (análisis IA)
    const deepscrapeData = {
      elements: [
        {
          type: 'product-card',
          selector: 'div[data-testid="product-card"]',
          description: 'Tarjeta de producto con información completa',
          confidence: 0.95,
          attributes: {
            'data-product-id': 'deepscrape_001'
          }
        }
      ],
      extractedData: [
        {
          extractedBy: 'ai-vision-model',
          confidence: 0.92,
          data: {
            title: 'Balenciaga Triple S Sneakers',
            price: 850.00,
            precio: 850.00,
            brand: 'Balenciaga',
            marca: 'Balenciaga',
            category: 'unisex',
            categoria: 'unisex',
            image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=375&h=667&fit=crop',
            imagen: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=375&h=667&fit=crop',
            sizes: ['39', '40', '41', '42', '43'],
            tallas: ['39', '40', '41', '42', '43'],
            colors: ['Blanco', 'Negro', 'Gris'],
            colores: ['Blanco', 'Negro', 'Gris'],
            discount: 20,
            descuento: 20,
            available: true,
            stock: 5,
            cantidad: 5,
            reference: 'BAL-TS-001',
            ref: 'BAL-TS-001'
          }
        },
        {
          extractedBy: 'ai-text-model',
          confidence: 0.88,
          data: {
            title: 'Off-White Vulcanized Sneakers',
            price: 425.00,
            precio: 425.00,
            brand: 'Off-White',
            marca: 'Off-White',
            category: 'hombre',
            categoria: 'hombre',
            image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=375&h=667&fit=crop',
            imagen: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=375&h=667&fit=crop',
            sizes: ['40', '41', '42', '43', '44'],
            tallas: ['40', '41', '42', '43', '44'],
            colors: ['Negro', 'Blanco'],
            colores: ['Negro', 'Blanco'],
            discount: 10,
            descuento: 10,
            available: true,
            stock: 7,
            cantidad: 7,
            reference: 'OW-VULC-002',
            ref: 'OW-VULC-002'
          }
        }
      ],
      extractedCount: 2,
      depth: 2,
      waitForSelector: 'div[data-testid="product-grid"]',
      timeout: 10000
    };

    // Generar datos de Browser-MCP (sesión autenticada)
    const browserMcpData = {
      action: 'authenticated_browsing',
      email: 'demo@farfetch.com',
      sessionId: 'demo_session_' + Date.now(),
      cookies: [
        { name: 'auth_token', value: 'demo_token_123', domain: '.farfetch.com' },
        { name: 'user_preferences', value: 'demo_prefs', domain: '.farfetch.com' }
      ],
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      viewport: { width: 375, height: 667 },
      fingerprint: {
        canvas: 'demo_canvas_hash',
        webgl: 'demo_webgl_hash',
        fonts: ['Arial', 'Helvetica', 'Times']
      },
      products: [
        {
          id: 'browser_mcp_001',
          title: 'Versace Medusa Sneakers',
          price: 695.00,
          brand: 'Versace',
          category: 'mujer',
          image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=375&h=667&fit=crop',
          sizes: ['36', '37', '38', '39', '40'],
          colors: ['Dorado', 'Negro'],
          discount: 12,
          stock: 6,
          reference: 'VER-MED-001'
        }
      ]
    };

    // Guardar datos en MinIO
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];

    await Promise.all([
      minio.saveScaperrData(scaperrData, 'https://demo.farfetch.com/scraperr-demo'),
      minio.saveDeepScrapeData(deepscrapeData, 'https://demo.farfetch.com/deepscrape-demo'),
      minio.saveBrowserMCPData(browserMcpData, 'https://demo.farfetch.com/browser-mcp-demo')
    ]);

    console.log('✅ Datos de demostración generados exitosamente');

    return res.status(200).json({
      success: true,
      message: 'Datos de demostración generados exitosamente',
      data: {
        scraperr: scaperrData.items.length,
        deepscrape: deepscrapeData.extractedData.length,
        browserMcp: browserMcpData.products.length,
        timestamp
      }
    });

  } catch (error) {
    console.error('Error generating demo data:', error);
    return res.status(500).json({
      success: false,
      error: 'Error generating demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
