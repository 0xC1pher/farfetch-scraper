import type { NextApiRequest, NextApiResponse } from 'next';
import { getWorkflowEngine } from '../../../workflow-engine';
import { withMiddleware, rateLimit, validateSchema, requestLogger, cors } from '../../../middleware/api-middleware';

interface ExecuteWorkflowRequest {
  workflowName: string;
  params?: Record<string, any>;
}

interface ExecuteWorkflowResponse {
  success: boolean;
  executionId?: string;
  status?: string;
  message?: string;
  error?: string;
}

async function executeWorkflowHandler(
  req: NextApiRequest,
  res: NextApiResponse<ExecuteWorkflowResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { workflowName, params = {} }: ExecuteWorkflowRequest = req.body;

    // Validación de entrada
    if (!workflowName) {
      return res.status(400).json({
        success: false,
        error: 'workflowName is required'
      });
    }

    // Validar que el workflow existe
    const validWorkflows = ['auth-flow', 'scraping-flow', 'proxy-rotation', 'monitoring'];
    if (!validWorkflows.includes(workflowName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid workflow name. Valid options: ${validWorkflows.join(', ')}`
      });
    }

    console.log(`[API] Starting workflow execution: ${workflowName}`);

    // Ejecutar workflow
    const engine = await getWorkflowEngine();
    const execution = await engine.executeWorkflow(workflowName, params);

    return res.status(200).json({
      success: true,
      executionId: execution.id,
      status: execution.status,
      message: `Workflow ${workflowName} started successfully`
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to load workflow')) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to execute workflow'
    });
  }
}

// Esquema de validación
const executeWorkflowSchema = {
  required: ['workflowName'],
  properties: {
    workflowName: { type: 'string' },
    params: { type: 'object' }
  }
};

// Exportar con middleware aplicado
export default withMiddleware(
  cors(),
  requestLogger(),
  rateLimit({ windowMs: 5 * 60 * 1000, maxRequests: 20 }), // 20 requests por 5 minutos
  validateSchema(executeWorkflowSchema)
)(executeWorkflowHandler);
