import type { NextApiRequest, NextApiResponse } from 'next';
import { workflowEngine } from '../../../workflow-engine';
import { withMiddleware, requestLogger, cors } from '../../../middleware/api-middleware';

interface WorkflowStatusResponse {
  success: boolean;
  execution?: {
    id: string;
    workflowName: string;
    status: string;
    startTime: string;
    endTime?: string;
    currentStep?: number;
    results: Record<string, any>;
    errors: string[];
    logs: string[];
    duration?: number;
    progress?: number;
  };
  message?: string;
  error?: string;
}

async function workflowStatusHandler(
  req: NextApiRequest,
  res: NextApiResponse<WorkflowStatusResponse>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Execution ID is required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getWorkflowStatus(id, res);
      
      case 'DELETE':
        return await cancelWorkflow(id, res);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Workflow status API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function getWorkflowStatus(executionId: string, res: NextApiResponse<WorkflowStatusResponse>) {
  try {
    const execution = workflowEngine.getExecution(executionId);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    // Calcular duración y progreso
    const startTime = execution.startTime.getTime();
    const endTime = execution.endTime?.getTime() || Date.now();
    const duration = Math.round((endTime - startTime) / 1000); // segundos

    // Calcular progreso basado en el paso actual
    const totalSteps = execution.currentStep !== undefined ? Math.max(execution.currentStep + 1, 1) : 1;
    const currentStep = execution.currentStep || 0;
    const progress = execution.status === 'completed' ? 100 : 
                    execution.status === 'failed' || execution.status === 'cancelled' ? 0 :
                    Math.round((currentStep / totalSteps) * 100);

    // Preparar respuesta (sin exponer datos sensibles)
    const safeResults = { ...execution.results };
    delete safeResults.session; // Remover datos de sesión sensibles
    if (safeResults.sessionId) {
      safeResults.sessionId = `${safeResults.sessionId.substring(0, 8)}...`; // Truncar sessionId
    }

    return res.status(200).json({
      success: true,
      execution: {
        id: execution.id,
        workflowName: execution.workflowName,
        status: execution.status,
        startTime: execution.startTime.toISOString(),
        endTime: execution.endTime?.toISOString(),
        currentStep: execution.currentStep,
        results: safeResults,
        errors: execution.errors,
        logs: execution.logs.slice(-20), // Solo los últimos 20 logs
        duration,
        progress
      },
      message: 'Execution status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting workflow status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get workflow status'
    });
  }
}

async function cancelWorkflow(executionId: string, res: NextApiResponse<WorkflowStatusResponse>) {
  try {
    const cancelled = workflowEngine.cancelExecution(executionId);
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found or cannot be cancelled'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Workflow execution cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel workflow'
    });
  }
}

// Exportar con middleware aplicado
export default withMiddleware(
  cors(),
  requestLogger()
)(workflowStatusHandler);
