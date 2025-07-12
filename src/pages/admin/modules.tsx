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
  Filter
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

export default function ModulesPage() {
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
      const response = await fetch(`/api/modules/data?module=${module}&limit=20`);
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
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'from-blue-50 to-indigo-50'
      },
      'scraperr': {
        title: 'Scraperr',
        icon: '🕷️',
        color: 'from-green-500 to-emerald-600',
        bgColor: 'from-green-50 to-emerald-50'
      },
      'deepscrape': {
        title: 'DeepScrape',
        icon: '🔍',
        color: 'from-purple-500 to-violet-600',
        bgColor: 'from-purple-50 to-violet-50'
      },
      'custom': {
        title: 'Custom',
        icon: '⚙️',
        color: 'from-gray-500 to-slate-600',
        bgColor: 'from-gray-50 to-slate-50'
      }
    };
    return configs[moduleName] || configs['custom'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas de módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Principal */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 backdrop-blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
                  <Database className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">
                  Datos de Módulos
                </h1>
                <p className="text-white/80 font-medium">
                  Monitoreo y análisis de extracción de datos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {globalStats && (
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                  <TrendingUp className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-medium">{globalStats.successRate.toFixed(1)}% éxito</span>
                </div>
              )}
              <button
                onClick={fetchStats}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-xl p-2 transition-all duration-300 hover:scale-105 group"
              >
                <RefreshCw className="h-5 w-5 text-white group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas Globales */}
        {globalStats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Extracciones</p>
                  <p className="text-2xl font-bold text-gray-900">{globalStats.totalExtractions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Exitosas</p>
                  <p className="text-2xl font-bold text-gray-900">{globalStats.successfulExtractions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center">
                <div className="bg-red-500 p-3 rounded-xl">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fallidas</p>
                  <p className="text-2xl font-bold text-gray-900">{globalStats.failedExtractions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center">
                <div className="bg-purple-500 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-gray-900">{globalStats.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas por Módulo */}
        <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Activity className="h-6 w-6 text-gray-600 mr-3" />
              Estadísticas por Módulo
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {moduleStats.map((stats) => {
                const config = getModuleConfig(stats.module);
                return (
                  <div
                    key={stats.module}
                    onClick={() => setSelectedModule(stats.module)}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedModule === stats.module ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    <div className={`bg-gradient-to-br ${config.bgColor} rounded-2xl p-6 border-2 border-gray-100 hover:border-gray-200`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`bg-gradient-to-br ${config.color} p-3 rounded-xl shadow-lg`}>
                            <span className="text-xl">{config.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{config.title}</h4>
                            <p className="text-sm text-gray-600">{stats.module}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{stats.totalExtractions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Éxito:</span>
                          <span className="font-medium text-green-600">{stats.successfulExtractions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tasa:</span>
                          <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                        </div>
                        {stats.lastExtraction && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Última:</span>
                            <span className="font-medium text-xs">
                              {new Date(stats.lastExtraction).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Datos Detallados del Módulo Seleccionado */}
        {selectedModule && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Eye className="h-6 w-6 text-gray-600 mr-3" />
                  Datos de {getModuleConfig(selectedModule).title}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchModuleData(selectedModule)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {moduleData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No hay datos disponibles</p>
                  <p className="text-sm">Este módulo aún no ha procesado ninguna extracción</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moduleData.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {item.success ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 truncate">{item.url}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.success
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.success ? 'Exitoso' : 'Fallido'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {item.error && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 font-medium">Error:</p>
                              <p className="text-sm text-red-600">{item.error}</p>
                            </div>
                          )}

                          {item.metadata && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-700 font-medium mb-1">Metadatos:</p>
                              <div className="text-xs text-blue-600 space-y-1">
                                {Object.entries(item.metadata).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium">{key}:</span>
                                    <span className="truncate ml-2">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex-shrink-0">
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
                            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                            title="Descargar datos"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
