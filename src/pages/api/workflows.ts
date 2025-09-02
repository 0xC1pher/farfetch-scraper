import { NextApiRequest, NextApiResponse } from 'next';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  output?: any;
  error?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  steps: WorkflowStep[];
  config: {
    target: string;
    modules: string[];
    filters: any;
  };
  results?: {
    totalOffers: number;
    uniqueOffers: number;
    errors: number;
  };
}

interface WorkflowsResponse {
  success: boolean;
  workflows: Workflow[];
  activeWorkflows: number;
  totalExecutions: number;
}

// Simulamos workflows del sistema
const generateWorkflows = (): Workflow[] => {
  const now = new Date();
  
  return [
    {
      id: 'workflow-farfetch-1',
      name: 'Farfetch Scraping Workflow',
      description: 'Extracción completa de ofertas de Farfetch usando los 3 módulos',
      status: 'completed',
      progress: 100,
      startTime: new Date(now.getTime() - 300000).toISOString(), // 5 min ago
      endTime: new Date(now.getTime() - 60000).toISOString(), // 1 min ago
      duration: 240000, // 4 minutes
      config: {
        target: 'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx',
        modules: ['browser-mcp', 'scraperr', 'deepscrape'],
        filters: {
          category: 'women',
          sale: true,
          minPrice: 0,
          maxPrice: 1000
        }
      },
      results: {
        totalOffers: 156,
        uniqueOffers: 142,
        errors: 3
      },
      steps: [
        {
          id: 'step-1',
          name: 'Browser-MCP Initialization',
          status: 'completed',
          startTime: new Date(now.getTime() - 300000).toISOString(),
          endTime: new Date(now.getTime() - 280000).toISOString(),
          duration: 20000,
          output: { sessionId: 'session-123', cookies: 15 }
        },
        {
          id: 'step-2',
          name: 'Browser-MCP Scraping',
          status: 'completed',
          startTime: new Date(now.getTime() - 280000).toISOString(),
          endTime: new Date(now.getTime() - 220000).toISOString(),
          duration: 60000,
          output: { offers: 52, pages: 3 }
        },
        {
          id: 'step-3',
          name: 'Scraperr Processing',
          status: 'completed',
          startTime: new Date(now.getTime() - 220000).toISOString(),
          endTime: new Date(now.getTime() - 160000).toISOString(),
          duration: 60000,
          output: { offers: 48, enhanced: 45 }
        },
        {
          id: 'step-4',
          name: 'DeepScrape Analysis',
          status: 'completed',
          startTime: new Date(now.getTime() - 160000).toISOString(),
          endTime: new Date(now.getTime() - 100000).toISOString(),
          duration: 60000,
          output: { offers: 56, deepData: 52 }
        },
        {
          id: 'step-5',
          name: 'Data Consolidation',
          status: 'completed',
          startTime: new Date(now.getTime() - 100000).toISOString(),
          endTime: new Date(now.getTime() - 80000).toISOString(),
          duration: 20000,
          output: { totalOffers: 156, uniqueOffers: 142 }
        },
        {
          id: 'step-6',
          name: 'MinIO Storage',
          status: 'completed',
          startTime: new Date(now.getTime() - 80000).toISOString(),
          endTime: new Date(now.getTime() - 70000).toISOString(),
          duration: 10000,
          output: { stored: 142, bucket: 'mexa-data' }
        },
        {
          id: 'step-7',
          name: 'Telegram Notification',
          status: 'completed',
          startTime: new Date(now.getTime() - 70000).toISOString(),
          endTime: new Date(now.getTime() - 60000).toISOString(),
          duration: 10000,
          output: { sent: true, recipients: 2 }
        }
      ]
    },
    {
      id: 'workflow-farfetch-2',
      name: 'Quick Farfetch Check',
      description: 'Verificación rápida de nuevas ofertas usando Browser-MCP',
      status: 'running',
      progress: 65,
      startTime: new Date(now.getTime() - 120000).toISOString(), // 2 min ago
      config: {
        target: 'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx',
        modules: ['browser-mcp'],
        filters: {
          category: 'women',
          sale: true,
          newOnly: true
        }
      },
      steps: [
        {
          id: 'step-1',
          name: 'Browser-MCP Initialization',
          status: 'completed',
          startTime: new Date(now.getTime() - 120000).toISOString(),
          endTime: new Date(now.getTime() - 110000).toISOString(),
          duration: 10000,
          output: { sessionId: 'session-456', cookies: 12 }
        },
        {
          id: 'step-2',
          name: 'Browser-MCP Scraping',
          status: 'running',
          startTime: new Date(now.getTime() - 110000).toISOString(),
          output: { offers: 23, currentPage: 2 }
        },
        {
          id: 'step-3',
          name: 'Data Processing',
          status: 'pending'
        },
        {
          id: 'step-4',
          name: 'Storage & Notification',
          status: 'pending'
        }
      ]
    },
    {
      id: 'workflow-farfetch-3',
      name: 'Failed Workflow Example',
      description: 'Ejemplo de workflow que falló por problemas de conexión',
      status: 'failed',
      progress: 25,
      startTime: new Date(now.getTime() - 600000).toISOString(), // 10 min ago
      endTime: new Date(now.getTime() - 580000).toISOString(), // 9.5 min ago
      duration: 20000,
      config: {
        target: 'https://www.farfetch.com/nl/shopping/men/items.aspx',
        modules: ['browser-mcp', 'scraperr'],
        filters: {
          category: 'men'
        }
      },
      results: {
        totalOffers: 0,
        uniqueOffers: 0,
        errors: 1
      },
      steps: [
        {
          id: 'step-1',
          name: 'Browser-MCP Initialization',
          status: 'completed',
          startTime: new Date(now.getTime() - 600000).toISOString(),
          endTime: new Date(now.getTime() - 590000).toISOString(),
          duration: 10000,
          output: { sessionId: 'session-789' }
        },
        {
          id: 'step-2',
          name: 'Browser-MCP Scraping',
          status: 'failed',
          startTime: new Date(now.getTime() - 590000).toISOString(),
          endTime: new Date(now.getTime() - 580000).toISOString(),
          duration: 10000,
          error: 'Connection timeout: Unable to load page after 30 seconds'
        },
        {
          id: 'step-3',
          name: 'Scraperr Processing',
          status: 'skipped'
        }
      ]
    }
  ];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkflowsResponse | any>
) {
  console.log('[API] GET /api/workflows - Client:', req.socket.remoteAddress);

  if (req.method === 'GET') {
    try {
      const workflows = generateWorkflows();
      const activeWorkflows = workflows.filter(w => w.status === 'running' || w.status === 'paused').length;
      const totalExecutions = workflows.length;

      const response: WorkflowsResponse = {
        success: true,
        workflows,
        activeWorkflows,
        totalExecutions
      };

      console.log(`[API] GET /api/workflows - 200 - ${workflows.length} workflows returned`);
      return res.status(200).json(response);

    } catch (error) {
      console.error('Error fetching workflows:', error);
      return res.status(500).json({
        success: false,
        error: 'Error retrieving workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    // Crear nuevo workflow
    const { name, target, modules, filters } = req.body;
    
    if (!name || !target || !modules) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, target, modules'
      });
    }

    // Simular creación de workflow
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name,
      description: `Workflow creado para ${target}`,
      status: 'idle',
      progress: 0,
      config: {
        target,
        modules,
        filters: filters || {}
      },
      steps: []
    };

    console.log(`[API] POST /api/workflows - 201 - Workflow created: ${newWorkflow.id}`);
    return res.status(201).json({
      success: true,
      workflow: newWorkflow,
      message: 'Workflow created successfully'
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
