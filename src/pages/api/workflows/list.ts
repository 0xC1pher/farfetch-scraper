import type { NextApiRequest, NextApiResponse } from 'next';
import { workflowEngine } from '../../../workflow-engine/index.js';
import { withMiddleware, requestLogger, cors } from '../../../middleware/api-middleware.js';
import { readdirSync } from 'fs';
import { join } from 'path';

interface WorkflowListResponse {
  success: boolean;
  workflows?: {
    available: string[];
    executions: Array<{
      id: string;
      workflowName: string;
      status: string;
      startTime: string;
      endTime?: string;
      duration?: number;
      progress?: number;
    }>;
  };
  message?: string;
  error?: string;
}

async function workflowListHandler(
  req: NextApiRequest,
  res: NextApiResponse<WorkflowListResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Obtener workflows disponibles
    const availableWorkflows = getAvailableWorkflows();
    
    // Obtener ejecuciones
    const executions = workflowEngine.listExecutions();
    
    // Preparar datos de ejecuciones (sin información sensible)
    const executionSummaries = executions.map(execution => {
      const startTime = execution.startTime.getTime();
      const endTime = execution.endTime?.getTime() || Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      // Calcular progreso
      const progress = execution.status === 'completed' ? 100 : 
                      execution.status === 'failed' || execution.status === 'cancelled' ? 0 :
                      execution.currentStep ? Math.round((execution.currentStep / 10) * 100) : 0;

      return {
        id: execution.id,
        workflowName: execution.workflowName,
        status: execution.status,
        startTime: execution.startTime.toISOString(),
        endTime: execution.endTime?.toISOString(),
        duration,
        progress
      };
    });

    // Ordenar por fecha de inicio (más recientes primero)
    executionSummaries.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return res.status(200).json({
      success: true,
      workflows: {
        available: availableWorkflows,
        executions: executionSummaries.slice(0, 50) // Limitar a 50 ejecuciones más recientes
      },
      message: 'Workflows retrieved successfully'
    });

  } catch (error) {
    console.error('Error listing workflows:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list workflows'
    });
  }
}

function getAvailableWorkflows(): string[] {
  try {
    const workflowsDir = join(process.cwd(), 'workflows');
    const files = readdirSync(workflowsDir);
    
    return files
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
      .map(file => file.replace(/\.(yaml|yml)$/, ''))
      .sort();
  } catch (error) {
    console.warn('Could not read workflows directory:', error);
    // Fallback a workflows conocidos
    return ['auth-flow', 'scraping-flow', 'proxy-rotation', 'monitoring'];
  }
}

// Exportar con middleware aplicado
export default withMiddleware(
  cors(),
  requestLogger()
)(workflowListHandler);
