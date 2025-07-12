import { useState, useCallback } from 'react';
import { X, TestTube } from 'lucide-react';
import RealTimeLogsCard from '../../components/Logs/RealTimeLogsCard';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
}

export default function LogsTab() {
  const [showLogsCard, setShowLogsCard] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingLogs, setIsGeneratingLogs] = useState(false);

  const toggleLogsCard = useCallback(() => {
    setShowLogsCard(prev => !prev);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const generateTestLogs = useCallback(async () => {
    setIsGeneratingLogs(true);
    try {
      const response = await fetch('/api/test-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error generando logs de prueba');
      }

      const result = await response.json();
      console.log('Logs de prueba generados:', result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGeneratingLogs(false);
    }
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Monitoreo de Logs en Tiempo Real</h2>
        <div className="flex space-x-2">
          <button
            onClick={generateTestLogs}
            disabled={isGeneratingLogs}
            className="px-4 py-2 rounded-md text-sm font-medium flex items-center bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <TestTube className="mr-1 h-4 w-4" />
            {isGeneratingLogs ? 'Generando...' : 'Generar Logs de Prueba'}
          </button>
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
              'Mostrar Logs en Tiempo Real'
            )}
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sistema de Logs en Tiempo Real</h3>
        <div className="prose max-w-none">
          <p>El nuevo sistema de logs muestra información en tiempo real de todos los módulos del sistema.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Streaming en tiempo real</strong>: Los logs se actualizan automáticamente usando Server-Sent Events (SSE)</li>
            <li><strong>Filtros avanzados</strong>: Filtra por módulo, nivel de log, o busca texto específico</li>
            <li><strong>Control de conexión</strong>: Pausa/reanuda el stream según necesites</li>
            <li><strong>Auto-scroll inteligente</strong>: Se desplaza automáticamente a menos que hayas hecho scroll hacia arriba</li>
            <li><strong>Exportación</strong>: Descarga los logs en formato JSON para análisis posterior</li>
            <li><strong>Detalles expandibles</strong>: Haz clic en "Ver detalles" para información adicional</li>
          </ul>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">Módulos monitoreados:</h4>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-blue-800">
              <div>• Orchestrator</div>
              <div>• Browser-MCP</div>
              <div>• Scraperr</div>
              <div>• DeepScrape</div>
              <div>• MinIO</div>
              <div>• Telegram Bot</div>
              <div>• API</div>
              <div>• Workflow Engine</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Real-Time Logs Card */}
      {showLogsCard && (
        <RealTimeLogsCard
          onClose={toggleLogsCard}
          onToggleExpand={toggleExpand}
          isExpanded={isExpanded}
        />
      )}
    </div>
  );
}
