import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Download, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
}

interface LogsCardProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onExportLogs: () => void;
  onClose: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
}

export default function LogsCard({ 
  logs, 
  onClearLogs, 
  onExportLogs, 
  onClose, 
  onToggleExpand,
  isExpanded 
}: LogsCardProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLogLevelClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 text-red-800';
      case 'warn':
        return 'bg-yellow-50 text-yellow-800';
      case 'info':
        return 'bg-blue-50 text-blue-800';
      case 'debug':
        return 'bg-purple-50 text-purple-800';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <span className="text-red-500">✖</span>;
      case 'warn':
        return <span className="text-yellow-500">⚠</span>;
      case 'info':
        return <span className="text-blue-500">ℹ</span>;
      case 'debug':
        return <span className="text-purple-500">🐞</span>;
      default:
        return <span className="text-gray-500">📄</span>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = filter === '' || 
                         log.message.toLowerCase().includes(filter.toLowerCase()) ||
                         log.module.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'w-1/3 h-3/4' : 'w-80 h-96'
    }`}>
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Logs del Sistema</span>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
            {filteredLogs.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
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
            <option value="all">Todos</option>
            <option value="error">Errores</option>
            <option value="warn">Advertencias</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
        <div className="flex justify-between items-center text-xs">
          <div className="flex space-x-1">
            <button
              onClick={onClearLogs}
              className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Limpiar logs"
            >
              <Trash2 size={14} className="mr-1" />
              Limpiar
            </button>
            <button
              onClick={onExportLogs}
              className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Exportar logs"
            >
              <Download size={14} className="mr-1" />
              Exportar
            </button>
          </div>
          <label className="flex items-center text-xs text-gray-600">
            <input
              type="checkbox"
              className="mr-1 h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Logs */}
      <div 
        className="overflow-y-auto font-mono text-xs"
        style={{ height: isExpanded ? 'calc(100% - 120px)' : 'calc(100% - 100px)' }}
        onScroll={() => {
          // Disable auto-scroll if user scrolls up
          if (logsEndRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logsEndRef.current.parentElement!;
            const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
            setAutoScroll(isAtBottom);
          }
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No hay registros que coincidan con los filtros
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredLogs.map((log, index) => (
              <li 
                key={index} 
                className={`px-3 py-1.5 hover:bg-gray-50 ${getLogLevelClass(log.level)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5 mr-2">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">
                        {log.module}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-0.5 break-all">{log.message}</p>
                  </div>
                </div>
              </li>
            ))}
            <div ref={logsEndRef} />
          </ul>
        )}
      </div>
    </div>
  );
}
