import { NextApiRequest, NextApiResponse } from 'next';
import ExternalModuleManager from '../../../modules/external-manager';

const moduleManager = ExternalModuleManager.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetStatus(req, res);
      case 'POST':
        return handleModuleAction(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in external modules API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const modules = moduleManager.getModulesStatus();
    
    // Verificar salud de módulos en tiempo real
    const modulesWithHealth = await Promise.all(
      modules.map(async (module) => {
        const isHealthy = await moduleManager.checkModuleHealth(module.name);
        return {
          ...module,
          healthy: isHealthy,
          lastChecked: new Date().toISOString()
        };
      })
    );

    return res.status(200).json({
      success: true,
      modules: modulesWithHealth,
      summary: {
        total: modules.length,
        running: modules.filter(m => m.status === 'running').length,
        stopped: modules.filter(m => m.status === 'stopped').length,
        error: modules.filter(m => m.status === 'error').length
      }
    });
  } catch (error) {
    console.error('Error getting modules status:', error);
    return res.status(500).json({
      success: false,
      error: 'Error getting modules status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleModuleAction(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action, module } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    let result: boolean;
    let message: string;

    switch (action) {
      case 'start':
        if (module) {
          result = await moduleManager.startModule(module);
          message = result 
            ? `Module ${module} started successfully`
            : `Failed to start module ${module}`;
        } else {
          result = await moduleManager.startAllModules();
          message = result 
            ? 'All modules started successfully'
            : 'Some modules failed to start';
        }
        break;

      case 'stop':
        if (module) {
          result = await moduleManager.stopModule(module);
          message = result 
            ? `Module ${module} stopped successfully`
            : `Failed to stop module ${module}`;
        } else {
          result = await moduleManager.stopAllModules();
          message = result 
            ? 'All modules stopped successfully'
            : 'Some modules failed to stop';
        }
        break;

      case 'restart':
        if (module) {
          await moduleManager.stopModule(module);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
          result = await moduleManager.startModule(module);
          message = result 
            ? `Module ${module} restarted successfully`
            : `Failed to restart module ${module}`;
        } else {
          await moduleManager.stopAllModules();
          await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
          result = await moduleManager.startAllModules();
          message = result 
            ? 'All modules restarted successfully'
            : 'Some modules failed to restart';
        }
        break;

      case 'install-deps':
        if (!module) {
          return res.status(400).json({
            success: false,
            error: 'Module name is required for install-deps action'
          });
        }
        
        try {
          await moduleManager.installDependencies(module);
          result = true;
          message = `Dependencies installed for ${module}`;
        } catch (error) {
          result = false;
          message = `Failed to install dependencies for ${module}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: start, stop, restart, install-deps`
        });
    }

    // Obtener estado actualizado
    const updatedModules = moduleManager.getModulesStatus();

    return res.status(200).json({
      success: result,
      message,
      modules: updatedModules,
      action,
      module: module || 'all'
    });

  } catch (error) {
    console.error('Error handling module action:', error);
    return res.status(500).json({
      success: false,
      error: 'Error handling module action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Configuración para manejar timeouts largos
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 300, // 5 minutos para operaciones de módulos
};
