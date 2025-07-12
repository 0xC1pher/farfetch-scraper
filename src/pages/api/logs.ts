import { NextApiRequest, NextApiResponse } from 'next';
import { logger, LogEntry, LogLevel } from '../../services/logger';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  // Configurar CORS y headers para SSE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (method) {
    case 'GET':
      handleGetLogs(req, res);
      break;
    case 'POST':
      handleAddLog(req, res);
      break;
    case 'DELETE':
      handleClearLogs(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function handleGetLogs(req: NextApiRequest, res: NextApiResponse) {
  const { 
    stream, 
    module, 
    level, 
    search, 
    since, 
    limit = '100',
    format = 'json'
  } = req.query;

  // Si es una solicitud de streaming (SSE)
  if (stream === 'true') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Enviar logs existentes
    const existingLogs = logger.getRecentLogs(parseInt(limit as string));
    res.write(`data: ${JSON.stringify({ type: 'initial', logs: existingLogs })}\n\n`);

    // Listener para nuevos logs
    const onNewLog = (log: LogEntry) => {
      res.write(`data: ${JSON.stringify({ type: 'newLog', log })}\n\n`);
    };

    const onLogsUpdated = (logs: LogEntry[]) => {
      const recentLogs = logs.slice(-parseInt(limit as string));
      res.write(`data: ${JSON.stringify({ type: 'update', logs: recentLogs })}\n\n`);
    };

    logger.on('newLog', onNewLog);
    logger.on('logsUpdated', onLogsUpdated);

    // Cleanup cuando se cierra la conexión
    req.on('close', () => {
      logger.removeListener('newLog', onNewLog);
      logger.removeListener('logsUpdated', onLogsUpdated);
    });

    // Mantener la conexión viva
    const keepAlive = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });

    return;
  }

  // Solicitud normal de logs
  try {
    let logs: LogEntry[];

    // Aplicar filtros
    if (module || level || search || since) {
      const filter: any = {};
      if (module) filter.module = module as string;
      if (level) filter.level = level as LogLevel;
      if (search) filter.search = search as string;
      if (since) filter.since = new Date(since as string);

      logs = logger.filterLogs(filter);
    } else {
      logs = logger.getAllLogs();
    }

    // Limitar resultados
    const limitNum = parseInt(limit as string);
    if (limitNum > 0) {
      logs = logs.slice(-limitNum);
    }

    // Formato de respuesta
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
      res.status(200).send(logger.exportLogs('csv'));
    } else {
      res.status(200).json({
        success: true,
        logs,
        total: logs.length,
        stats: logger.getStats()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function handleAddLog(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { level, module, message, details } = req.body;

    if (!level || !module || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: level, module, message'
      });
    }

    // Validar level
    const validLevels: LogLevel[] = ['info', 'warn', 'error', 'debug', 'success'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: `Invalid level. Must be one of: ${validLevels.join(', ')}`
      });
    }

    // Agregar log
    logger[level](module, message, details);

    res.status(201).json({
      success: true,
      message: 'Log added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error adding log',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function handleClearLogs(req: NextApiRequest, res: NextApiResponse) {
  try {
    logger.clearLogs();
    res.status(200).json({
      success: true,
      message: 'Logs cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error clearing logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
