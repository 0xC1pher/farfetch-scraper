import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Download, Trash2, Pause, Play, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  module: string;
  message: string;
  details?: any;
}

interface RealTimeLogsCardProps {
  onClose: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
}

export default function RealTimeLogsCard({ onClose, onToggleExpand, isExpanded }: RealTimeLogsCardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<any>({});
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Detectar si el usuario ha hecho scroll hacia arriba
  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      shouldAutoScrollRef.current = isAtBottom;
    }
  };

  // Conectar al stream de logs
  useEffect(() => {
    if (isStreaming) {
      connectToLogStream();
    } else {
      disconnectFromLogStream();
    }

    return () => {
      disconnectFromLogStream();
    };
  }, [isStreaming]);

  const connectToLogStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/logs?stream=true&limit=200');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'initial') {
          setLogs(data.logs || []);
        } else if (data.type === 'newLog') {
          setLogs(prev => [...prev.slice(-199), data.log]);
        } else if (data.type === 'update') {
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error('Error parsing log data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // Reconectar después de 5 segundos
      setTimeout(() => {
        if (isStreaming) {
          connectToLogStream();
        }
      }, 5000);
    };
  };

  const disconnectFromLogStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  };

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const clearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getLogLevelClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50 text-red-800';
      case 'warn':
        return 'border-l-4 border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-l-4 border-blue-500 bg-blue-50 text-blue-800';
      case 'debug':
        return 'border-l-4 border-gray-500 bg-gray-50 text-gray-800';
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50 text-green-800';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50 text-gray-800';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'debug':
        return '🐛';
      case 'success':
        return '✅';
      default:
        return '📝';
    }
  };

  // Filtrar logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === '' || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.module.toLowerCase().includes(filter.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    
    return matchesFilter && matchesLevel && matchesModule;
  });

  // Obtener módulos únicos para el filtro
  const uniqueModules = [...new Set(logs.map(log => log.module))];

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'w-2/3 h-5/6' : 'w-96 h-96'
    }`}>
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Logs en Tiempo Real</span>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
            {filteredLogs.length}
          </span>
          {isConnected ? (
            <Wifi size={14} className="text-green-400" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleStreaming}
            className={`p-1 rounded hover:bg-gray-700 ${isStreaming ? 'text-green-400' : 'text-red-400'}`}
            title={isStreaming ? "Pausar stream" : "Reanudar stream"}
          >
            {isStreaming ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-gray-700"
            title={isExpanded ? "Minimizar" : "Expandir"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            className="flex-1 text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Filtrar logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">Todos los niveles</option>
            <option value="error">Errores</option>
            <option value="warn">Advertencias</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
            <option value="success">Éxito</option>
          </select>
          <select
            className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="all">Todos los módulos</option>
            {uniqueModules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={exportLogs}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <Download size={12} className="mr-1" />
              Exportar
            </button>
            <button
              onClick={clearLogs}
              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
            >
              <Trash2 size={12} className="mr-1" />
              Limpiar
            </button>
          </div>
          <div className="text-xs text-gray-600">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
      </div>

      {/* Logs Container */}
      <div 
        ref={logsContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        style={{ height: isExpanded ? 'calc(100% - 120px)' : 'calc(100% - 120px)' }}
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {logs.length === 0 ? 'Esperando logs...' : 'No hay registros que coincidan con los filtros'}
          </div>
        ) : (
          <ul className="space-y-1">
            {filteredLogs.map((log) => (
              <li 
                key={log.id} 
                className={`px-3 py-2 rounded text-xs ${getLogLevelClass(log.level)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5 mr-2">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">
                        {log.module}
                      </span>
                      <span className="text-gray-500 ml-2 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-0.5 break-words">{log.message}</p>
                    {log.details && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Ver detalles
                        </summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
