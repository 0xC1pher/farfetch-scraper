import type { NextApiRequest, NextApiResponse } from 'next';
import Orchestrator from '../../../orchestrator/index.js';
import { withMiddleware, rateLimit, validateSchema, requestLogger, cors, schemas } from '../../../middleware/api-middleware.js';

interface LoginRequest {
  email: string;
  password: string;
  fingerprintLevel?: 'low' | 'medium' | 'high';
  proxy?: string;
}

interface LoginResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
  error?: string;
}

async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { email, password, fingerprintLevel = 'medium', proxy }: LoginRequest = req.body;

    // Validación de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Usar el orquestador para manejar el login
    const orchestrator = new Orchestrator();
    
    const session = await orchestrator.ensureSession({
      email,
      password,
      loginIfNeeded: true,
      fingerprintLevel,
      proxy,
      persistSession: true
    });

    return res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      if (error.message.includes('Login fallido')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials or login failed'
        });
      }
      
      if (error.message.includes('Browser MCP not available')) {
        return res.status(503).json({
          success: false,
          error: 'Authentication service temporarily unavailable'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Exportar con middleware aplicado
export default withMiddleware(
  cors(),
  requestLogger(),
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }), // 10 requests por 15 minutos
  validateSchema(schemas.login)
)(loginHandler);
