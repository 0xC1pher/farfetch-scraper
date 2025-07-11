import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simular logs en tiempo real
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)] as any,
        module: ['Orchestrator', 'Bot', 'API', 'Workflow', 'Proxy'][Math.floor(Math.random() * 5)],
        message: generateRandomLogMessage()
      };
      
      setLogs(prev => [...prev.slice(-99), newLog]); // Mantener solo los últimos 100 logs
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const generateRandomLogMessage = (): string => {
    const messages = [
      'Scraping completado exitosamente - 25 ofertas encontradas',
      'Rotación de proxy ejecutada correctamente',
      'Usuario inició sesión en el bot',
      'Workflow de autenticación completado',
      'Error temporal de conexión - reintentando',
      'Filtros aplicados: precio máximo €500',
      'Sesión guardada en MinIO',
      'Health check ejecutado - todos los servicios activos',
      'Bot respondió a comando /ofertas',
      'Proxy validado correctamente'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const filteredLogs = logs.filter(log => {
    const matchesText = log.message.toLowerCase().includes(filter.toLowerCase()) ||
                       log.module.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesText && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
      default: return '📝';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} [${log.module}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mexa-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Logs del Sistema - Mexa</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              📋 Logs del Sistema
            </h1>
            <a 
              href="/admin" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              ← Volver al Panel
            </a>
          </div>

          {/* Controles */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por texto
                </label>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Buscar en logs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de log
                </label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Auto-scroll</span>
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={clearLogs}
                  className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 text-sm"
                >
                  🗑️ Limpiar
                </button>
                <button
                  onClick={exportLogs}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm"
                >
                  💾 Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
              <div className="text-sm text-gray-600">Total Logs</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.level === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Errores</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.level === 'warn').length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(l => l.level === 'info').length}
              </div>
              <div className="text-sm text-gray-600">Info</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {logs.filter(l => l.level === 'debug').length}
              </div>
              <div className="text-sm text-gray-600">Debug</div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                Logs en Tiempo Real ({filteredLogs.length} entradas)
              </h2>
            </div>
            
            <div className="h-96 overflow-y-auto p-4 font-mono text-sm">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay logs que coincidan con los filtros
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md border-l-4 ${getLevelColor(log.level)}`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">{getLevelIcon(log.level)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span className="font-semibold">{log.module}</span>
                            <span>•</span>
                            <span className="uppercase font-semibold">{log.level}</span>
                          </div>
                          <div className="text-gray-900">{log.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
