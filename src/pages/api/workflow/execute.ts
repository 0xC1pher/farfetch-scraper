import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkflowEngine } from '../../../workflow-engine/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, scrapeUrl, maxRetries = 3 } = req.body;

    if (!email || !password || !scrapeUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, scrapeUrl' 
      });
    }

    // Obtener el motor de workflows
    const workflowEngine = await getWorkflowEngine();

    // Ejecutar el workflow de scraping secuencial
    const execution = await workflowEngine.executeWorkflow('scraping-flow', {
      email,
      password,
      scrapeUrl,
      maxRetries
    });

    res.status(200).json({
      success: true,
      executionId: execution.id,
      status: execution.status,
      message: 'Workflow de scraping secuencial iniciado',
      workflow: 'scraping-flow'
    });

  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error ejecutando workflow de scraping'
    });
  }
}
