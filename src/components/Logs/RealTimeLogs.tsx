import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export default function RealTimeLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logId = useRef(0);

  // Generar logs de ejemplo en tiempo real
  useEffect(() => {
    const levels: ('INFO' | 'WARN' | 'ERROR' | 'DEBUG')[] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = [
      'Caché actualizado correctamente',
      'Tiempo de respuesta lento en la API',
      'No se pudo conectar al servidor de caché',
      'Datos recibidos: {\"status\":\"ok\"}',
      'Proceso de limpieza completado',
      'Espacio en disco bajo',
      'Caché sincronizado con la base de datos',
      'Iniciando análisis de rendimiento'
    ];

    const interval = setInterval(() => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      setLogs(prev => {
        const newLogs = [...prev, {
          id: logId.current++,
          timestamp: new Date().toLocaleTimeString(),
          level,
          message
        }];
        
        // Mantener solo los últimos 50 logs
        return newLogs.slice(-50);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll al final de los logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-500';
      case 'WARN': return 'text-yellow-500';
      case 'INFO': return 'text-green-500';
      case 'DEBUG': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">Registros en Tiem Real</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded ${autoScroll ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={clearLogs}
            className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            Limpiar
          </button>
        </div>
      </div>
      
      <div 
        className="h-64 overflow-y-auto font-mono text-xs p-2"
        onScroll={() => {
          // Desactivar auto-scroll si el usuario hace scroll hacia arriba
          if (logsEndRef.current?.parentElement) {
            const { scrollTop, scrollHeight, clientHeight } = logsEndRef.current.parentElement;
            const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
            if (autoScroll !== isAtBottom) {
              setAutoScroll(isAtBottom);
            }
          }
        }}
      >
        {logs.length === 0 ? (
          <div className="text-center text-gray-600 mt-20">
            Esperando registros...
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex">
                <span className="text-gray-500 w-16 flex-shrink-0">[{log.timestamp}]</span>
                <span className={`${getLevelColor(log.level)} font-semibold w-12 flex-shrink-0`}>
                  {log.level}:
                </span>
                <span className="text-gray-300 break-all">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
