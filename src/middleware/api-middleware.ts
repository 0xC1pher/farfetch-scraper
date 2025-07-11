import type { NextApiRequest, NextApiResponse } from 'next';

// Rate limiting storage (en producción usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxRequests: number; // Máximo número de requests por ventana
}

/**
 * Middleware de rate limiting
 */
export function rateLimit(options: RateLimitOptions) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Limpiar entradas expiradas
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    // Obtener o crear entrada para el cliente
    let clientData = rateLimitStore.get(clientId);
    if (!clientData || clientData.resetTime < now) {
      clientData = {
        count: 0,
        resetTime: now + options.windowMs
      };
    }

    // Incrementar contador
    clientData.count++;
    rateLimitStore.set(clientId, clientData);

    // Verificar límite
    if (clientData.count > options.maxRequests) {
      const resetIn = Math.ceil((clientData.resetTime - now) / 1000);
      
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: resetIn
      });
      return;
    }

    // Agregar headers informativos
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - clientData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));

    next();
  };
}

/**
 * Middleware de validación de esquemas
 */
export function validateSchema(schema: any) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    try {
      // Validación básica de tipos requeridos
      const errors = validateObject(req.body, schema);
      
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid JSON format'
      });
    }
  };
}

/**
 * Middleware de logging de requests
 */
export function requestLogger() {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const start = Date.now();
    const clientId = getClientId(req);
    
    console.log(`[API] ${req.method} ${req.url} - Client: ${clientId}`);
    
    // Interceptar el final de la respuesta para logging
    const originalSend = res.json;
    res.json = function(data: any) {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Middleware de CORS
 */
export function cors() {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    // Configurar headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  };
}

/**
 * Middleware de manejo de errores
 */
export function errorHandler() {
  return (error: Error, req: NextApiRequest, res: NextApiResponse) => {
    console.error(`[API Error] ${req.method} ${req.url}:`, error);

    // No exponer detalles internos en producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      ...(isDevelopment && { details: error.message, stack: error.stack })
    });
  };
}

/**
 * Composición de middlewares
 */
export function withMiddleware(...middlewares: Array<(req: NextApiRequest, res: NextApiResponse, next: () => void) => void>) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      let index = 0;

      const next = () => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          middleware(req, res, next);
        } else {
          // Ejecutar el handler final
          handler(req, res).catch(error => {
            errorHandler()(error, req, res);
          });
        }
      };

      next();
    };
  };
}

// Utilidades privadas

function getClientId(req: NextApiRequest): string {
  // En producción, usar IP real del cliente
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress;
  return ip || 'unknown';
}

function validateObject(obj: any, schema: any): string[] {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    errors.push('Request body must be an object');
    return errors;
  }

  // Validar campos requeridos
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        errors.push(`Field '${field}' is required`);
      }
    }
  }

  // Validar tipos de campos
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties as any)) {
      if (field in obj) {
        const value = obj[field];
        const expectedType = (fieldSchema as any).type;

        if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`Field '${field}' must be a string`);
        } else if (expectedType === 'number' && typeof value !== 'number') {
          errors.push(`Field '${field}' must be a number`);
        } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Field '${field}' must be a boolean`);
        } else if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Field '${field}' must be an array`);
        }

        // Validar formato de email
        if ((fieldSchema as any).format === 'email' && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`Field '${field}' must be a valid email`);
          }
        }

        // Validar formato de URL
        if ((fieldSchema as any).format === 'uri' && typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            errors.push(`Field '${field}' must be a valid URL`);
          }
        }
      }
    }
  }

  return errors;
}

// Esquemas de validación comunes
export const schemas = {
  login: {
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
      fingerprintLevel: { type: 'string' },
      proxy: { type: 'string' }
    }
  },
  
  scraping: {
    required: ['sessionId', 'scrapeUrl'],
    properties: {
      sessionId: { type: 'string' },
      scrapeUrl: { type: 'string', format: 'uri' },
      maxRetries: { type: 'number' },
      filters: { type: 'object' }
    }
  }
};
