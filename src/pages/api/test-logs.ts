import { NextApiRequest, NextApiResponse } from 'next';
import { log } from '../../services/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Generar logs de prueba para diferentes módulos
    const modules = ['Orchestrator', 'Browser-MCP', 'Scraperr', 'DeepScrape', 'MinIO', 'Telegram Bot', 'API', 'Workflow Engine'];
    const messages = [
      'Módulo inicializado correctamente',
      'Procesando solicitud de scraping',
      'Conexión establecida con éxito',
      'Datos guardados en MinIO',
      'Sesión de usuario autenticada',
      'Workflow ejecutado exitosamente',
      'Cache actualizado',
      'Proxy rotado correctamente',
      'Ofertas encontradas y procesadas',
      'Health check completado'
    ];

    const errorMessages = [
      'Error de conexión temporal',
      'Timeout en la solicitud',
      'Credenciales inválidas',
      'Servicio no disponible',
      'Error de parsing de datos'
    ];

    const warningMessages = [
      'Reintentos agotados, usando fallback',
      'Cache expirado, renovando',
      'Proxy lento, considerando rotación',
      'Memoria alta, limpiando cache',
      'Rate limit alcanzado, esperando'
    ];

    // Generar 10 logs aleatorios
    for (let i = 0; i < 10; i++) {
      const module = modules[Math.floor(Math.random() * modules.length)];
      const logType = Math.random();
      
      if (logType < 0.1) {
        // 10% errores
        const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        log.error(module, message);
      } else if (logType < 0.25) {
        // 15% advertencias
        const message = warningMessages[Math.floor(Math.random() * warningMessages.length)];
        log.warn(module, message);
      } else if (logType < 0.4) {
        // 15% éxito
        const message = messages[Math.floor(Math.random() * messages.length)];
        log.success(module, message);
      } else if (logType < 0.6) {
        // 20% debug
        const message = `Debug: ${messages[Math.floor(Math.random() * messages.length)]}`;
        log.debug(module, message);
      } else {
        // 40% info
        const message = messages[Math.floor(Math.random() * messages.length)];
        log.info(module, message);
      }

      // Pequeño delay entre logs para simular actividad real
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    }

    // Log especial para mostrar que DeepScrape está funcionando
    log.success('DeepScrape', 'Módulo DeepScrape cargado y funcionando correctamente');
    log.info('DeepScrape', 'Configuración: Puerto 3002, Redis conectado, Playwright inicializado');
    log.debug('DeepScrape', 'Selectores disponibles: [data-testid="product-card"], .product-item, .offer-card');

    res.status(200).json({
      success: true,
      message: 'Logs de prueba generados exitosamente',
      count: 13 // 10 aleatorios + 3 de DeepScrape
    });
  } catch (error) {
    log.error('API', 'Error generando logs de prueba', error);
    res.status(500).json({
      success: false,
      error: 'Error generating test logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function para async/await en el loop
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
