import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkflowEngine } from '../../../workflow-engine/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { executionId } = req.query;

    if (!executionId || typeof executionId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid executionId parameter' 
      });
    }

    // Obtener el motor de workflows
    const workflowEngine = await getWorkflowEngine();

    // Obtener el estado de la ejecución
    const execution = workflowEngine.getExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
        message: `No se encontró la ejecución con ID: ${executionId}`
      });
    }

    // Calcular progreso
    const totalSteps = 6; // Según el workflow YAML
    const currentStep = execution.currentStep || 0;
    const progress = Math.round((currentStep / totalSteps) * 100);

    // Extraer resultados de módulos
    const moduleResults = {
      browserMcp: {
        completed: !!execution.results.browserMcpOffers,
        count: execution.results.browserMcpCount || 0,
        error: execution.results.browserMcpError
      },
      scraperr: {
        completed: !!execution.results.scraperrOffers,
        count: execution.results.scraperrCount || 0,
        error: execution.results.scraperrError
      },
      deepscrape: {
        completed: !!execution.results.deepscrapeOffers,
        count: execution.results.deepscrapeCount || 0,
        error: execution.results.deepscrapeError
      }
    };

    // Calcular totales
    const totalOffers = (execution.results.browserMcpCount || 0) + 
                       (execution.results.scraperrCount || 0) + 
                       (execution.results.deepscrapeCount || 0);

    res.status(200).json({
      success: true,
      execution: {
        id: execution.id,
        workflowName: execution.workflowName,
        status: execution.status,
        progress,
        currentStep,
        totalSteps,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.endTime ? 
          execution.endTime.getTime() - execution.startTime.getTime() : 
          Date.now() - execution.startTime.getTime()
      },
      results: {
        totalOffers,
        moduleResults,
        errors: execution.errors,
        logs: execution.logs.slice(-10) // Últimos 10 logs
      },
      message: `Workflow ${execution.status}`
    });

  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error obteniendo estado del workflow'
    });
  }
}
