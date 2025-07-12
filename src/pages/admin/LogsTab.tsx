import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Trash2, X } from 'lucide-react';
import LogsCard from '../../components/Logs/LogsCard';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
}

export default function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogsCard, setShowLogsCard] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate a random log message
  const generateRandomLogMessage = useCallback((): string => {
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
  }, []);

  // Simulate real-time logs
  useEffect(() => {
    if (!showLogsCard) return;
    
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)] as any,
        module: ['Orchestrator', 'Bot', 'API', 'Workflow', 'Proxy'][Math.floor(Math.random() * 5)],
        message: generateRandomLogMessage()
      };
      
      setLogs(prev => [...prev.slice(-199), newLog]); // Keep only the last 200 logs
    }, 2000);

    return () => clearInterval(interval);
  }, [showLogsCard, generateRandomLogMessage]);

  // This is kept for backward compatibility but not used in the UI directly
  const filteredLogs = logs;

  const exportLogs = useCallback(() => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [logs]);
  
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleLogsCard = useCallback(() => {
    setShowLogsCard(prev => !prev);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Monitoreo de Logs en Tiem Real</h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleLogsCard}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${showLogsCard ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}
          >
            {showLogsCard ? (
              <>
                <X className="mr-1 h-4 w-4" />
                Ocultar Logs
              </>
            ) : (
              'Mostrar Logs en Tiem Real'
            )}
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instrucciones</h3>
        <div className="prose max-w-none">
          <p>Los logs del sistema se muestran en una ventana flotante en la esquina inferior derecha.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Haz clic en <strong>Mostrar Logs</strong> para abrir el panel de logs.</li>
            <li>Usa el campo de búsqueda para filtrar logs por contenido o módulo.</li>
            <li>Selecciona un nivel específico de logs para filtrar (todos, errores, advertencias, etc.).</li>
            <li>Haz clic en el ícono de expansión para ver los logs en pantalla completa.</li>
            <li>Usa los botones para exportar o limpiar los logs según sea necesario.</li>
          </ul>
        </div>
      </div>

      {/* Floating Logs Card */}
      {showLogsCard && (
        <LogsCard 
          logs={logs}
          onClearLogs={clearLogs}
          onExportLogs={exportLogs}
          onClose={toggleLogsCard}
          onToggleExpand={toggleExpand}
          isExpanded={isExpanded}
        />
      )}
    </div>
  );
}
