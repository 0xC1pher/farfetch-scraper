import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
      case 'error': return 'bg-red-500/10 border-red-400/30';
      case 'warn': return 'bg-yellow-500/10 border-yellow-400/30';
      case 'info': return 'bg-green-500/10 border-green-400/30';
      case 'debug': return 'bg-gray-500/10 border-gray-400/30';
      default: return 'bg-gray-500/10 border-gray-400/30';
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
    <AdminLayout
      title="Logs del Sistema"
      description="Monitoreo en tiempo real"
    >
      <div className="space-y-6">

          {/* Controles */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-200">
                  <span className="inline mr-2">🔍</span>
                  Filtrar por texto
                </label>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Buscar en logs..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-200">
                  <span className="inline mr-2">🔽</span>
                  Nivel de log
                </label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                >
                  <option value="all" className="bg-slate-800">Todos</option>
                  <option value="error" className="bg-slate-800">Error</option>
                  <option value="warn" className="bg-slate-800">Warning</option>
                  <option value="info" className="bg-slate-800">Info</option>
                  <option value="debug" className="bg-slate-800">Debug</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-3 p-3 bg-purple-500/10 rounded-xl border border-purple-400/20">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-purple-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-purple-200 font-medium">Auto-scroll</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={clearLogs}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="inline mr-2">🗑️</span>
                  Limpiar
                </button>
                <button
                  onClick={exportLogs}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="inline mr-2">📥</span>
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-400">{logs.length}</div>
                  <div className="text-sm text-blue-200 font-medium">Total Logs</div>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <span className="text-blue-400">📄</span>
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-400">
                    {logs.filter(l => l.level === 'error').length}
                  </div>
                  <div className="text-sm text-red-200 font-medium">Errores</div>
                </div>
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {logs.filter(l => l.level === 'warn').length}
                  </div>
                  <div className="text-sm text-yellow-200 font-medium">Warnings</div>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-400">
                    {logs.filter(l => l.level === 'info').length}
                  </div>
                  <div className="text-sm text-green-200 font-medium">Info</div>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <InformationCircleIcon className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-400">
                    {logs.filter(l => l.level === 'debug').length}
                  </div>
                  <div className="text-sm text-gray-200 font-medium">Debug</div>
                </div>
                <div className="p-3 bg-gray-500/20 rounded-xl">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-cyan-400" />
                </div>
                Logs en Tiempo Real
                <span className="ml-3 px-3 py-1 bg-cyan-500/20 rounded-full text-sm text-cyan-300 font-medium">
                  {filteredLogs.length} entradas
                </span>
              </h2>
            </div>
            
            <div className="h-96 overflow-y-auto p-6 font-mono text-sm bg-slate-900/50 backdrop-blur-sm">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <div className="p-4 bg-gray-500/10 rounded-xl border border-gray-400/20 inline-block">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400 mx-auto mb-3" />
                    <div className="text-lg font-medium">No hay logs disponibles</div>
                    <div className="text-sm text-gray-500 mt-1">
                      No hay logs que coincidan con los filtros actuales
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-l-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] ${getLevelColor(log.level)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <span className="text-xl">{getLevelIcon(log.level)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 text-xs mb-2">
                            <span className="px-2 py-1 bg-white/10 rounded-md text-gray-300 font-medium">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="px-2 py-1 bg-blue-500/20 rounded-md text-blue-300 font-semibold">
                              {log.module}
                            </span>
                            <span className={`px-2 py-1 rounded-md font-bold text-xs uppercase ${
                              log.level === 'error' ? 'bg-red-500/20 text-red-300' :
                              log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-300' :
                              log.level === 'info' ? 'bg-green-500/20 text-green-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {log.level}
                            </span>
                          </div>
                          <div className="text-white leading-relaxed">{log.message}</div>
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
    </AdminLayout>
  );
}
