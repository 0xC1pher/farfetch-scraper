import { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Clock,
  Eye,
  Download,
  AlertTriangle
} from 'lucide-react';

interface ModuleStats {
  module: string;
  totalExtractions: number;
  successfulExtractions: number;
  failedExtractions: number;
  successRate: number;
  lastExtraction?: string;
}

interface ModuleData {
  module: string;
  url: string;
  data: any;
  timestamp: string;
  success: boolean;
  error?: string;
  metadata?: any;
}

interface GlobalStats {
  totalExtractions: number;
  successfulExtractions: number;
  failedExtractions: number;
  successRate: number;
}

export default function ModulesTab() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleData, setModuleData] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchModuleData(selectedModule);
    }
  }, [selectedModule]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/modules/stats');
      const data = await response.json();
      
      if (data.success) {
        setGlobalStats(data.global);
        setModuleStats(data.modules);
        if (!selectedModule && data.modules.length > 0) {
          setSelectedModule(data.modules[0].module);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error fetching module statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleData = async (module: string) => {
    try {
      const response = await fetch(`/api/modules/data?module=${module}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setModuleData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Error fetching data for module: ${module}`);
    }
  };

  const getModuleConfig = (moduleName: string) => {
    const configs: Record<string, any> = {
      'browser-mcp': {
        title: 'Browser MCP',
        icon: '🌐',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50'
      },
      'scraperr': {
        title: 'Scraperr',
        icon: '🕷️',
        color: 'bg-green-500',
        bgColor: 'bg-green-50'
      },
      'deepscrape': {
        title: 'DeepScrape',
        icon: '🔍',
        color: 'bg-purple-500',
        bgColor: 'bg-purple-50'
      },
      'custom': {
        title: 'Custom',
        icon: '⚙️',
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50'
      }
    };
    return configs[moduleName] || configs['custom'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex">
            <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
            <div className="ml-2">
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Globales */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{globalStats.totalExtractions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-500 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Exitosas</p>
                <p className="text-lg font-bold text-gray-900">{globalStats.successfulExtractions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-red-500 p-2 rounded-lg">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Fallidas</p>
                <p className="text-lg font-bold text-gray-900">{globalStats.failedExtractions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-purple-500 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Tasa Éxito</p>
                <p className="text-lg font-bold text-gray-900">{globalStats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas por Módulo */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center">
              <Activity className="h-4 w-4 text-gray-600 mr-2" />
              Módulos de Extracción
            </h4>
            <button
              onClick={fetchStats}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {moduleStats.map((stats) => {
              const config = getModuleConfig(stats.module);
              return (
                <div
                  key={stats.module}
                  onClick={() => setSelectedModule(stats.module)}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedModule === stats.module ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className={`${config.bgColor} rounded-lg p-3 border border-gray-200 hover:border-gray-300`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${config.color} p-2 rounded-lg shadow-sm`}>
                          <span className="text-sm">{config.icon}</span>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 text-sm">{config.title}</h5>
                          <p className="text-xs text-gray-600">{stats.module}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{stats.totalExtractions}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Éxito:</span>
                        <span className="font-medium text-green-600">{stats.successfulExtractions}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Tasa:</span>
                        <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Datos del Módulo Seleccionado */}
      {selectedModule && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <Eye className="h-4 w-4 text-gray-600 mr-2" />
                Datos de {getModuleConfig(selectedModule).title}
              </h4>
              <button
                onClick={() => fetchModuleData(selectedModule)}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {moduleData.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No hay datos disponibles</p>
                <p className="text-xs">Este módulo aún no ha procesado extracciones</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {moduleData.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {item.success ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          )}
                          <p className="font-medium text-gray-900 text-xs truncate">{item.url}</p>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.success 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.success ? 'Exitoso' : 'Fallido'}
                          </span>
                        </div>
                        
                        {item.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <p className="text-red-700 font-medium">Error:</p>
                            <p className="text-red-600">{item.error}</p>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          const dataStr = JSON.stringify(item, null, 2);
                          const blob = new Blob([dataStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${item.module}-${new Date(item.timestamp).toISOString()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                        title="Descargar datos"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
