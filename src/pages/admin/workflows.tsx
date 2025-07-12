import { useState, useEffect } from 'react';
import {
  Play,
  Settings,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
  Code,
  Info,
  Zap
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: any;
}

interface WorkflowList {
  available: string[];
  executions: WorkflowExecution[];
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [executionParams, setExecutionParams] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (workflows?.available.length && !activeTab) {
      setActiveTab(workflows.available[0]);
    }
  }, [workflows, activeTab]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows/list');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.workflows);
      } else {
        setError(data.error || 'Error al obtener los workflows');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error fetching workflows:', errorMessage);
      setError('No se pudo conectar con el servidor de workflows');
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowName: string) => {
    if (!workflowName) {
      setError('Error: No se especificó el workflow a ejecutar');
      return;
    }

    try {
      const params = executionParams[workflowName]?.trim() ? JSON.parse(executionParams[workflowName]) : {};
      
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName,
          params
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setError(null);
        alert(`✅ Workflow "${workflowName}" iniciado correctamente\nID: ${data.executionId}`);
        fetchWorkflows();
      } else {
        throw new Error(data.error || 'Error desconocido al iniciar el workflow');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al ejecutar workflow:', errorMessage);
      setError(`Error al ejecutar el workflow "${workflowName}": ${errorMessage}`);
    }
  };

  const getWorkflowConfig = (workflowName: string) => {
    const configs: Record<string, any> = {
      'auth-flow': {
        title: 'Flujo de Autenticación',
        description: 'Gestión segura de autenticación con Farfetch',
        icon: '🔐',
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'from-blue-50 to-indigo-50',
        defaultParams: {
          email: 'user@example.com',
          password: 'password',
          fingerprintLevel: 'medium',
          timeout: 30000
        },
        features: [
          'Login automático seguro',
          'Gestión de sesiones',
          'Renovación de tokens',
          'Detección de captcha'
        ]
      },
      'scraping-flow': {
        title: 'Flujo de Scraping',
        description: 'Extracción inteligente de datos de productos',
        icon: '🕷️',
        color: 'from-green-500 to-emerald-600',
        bgColor: 'from-green-50 to-emerald-50',
        defaultParams: {
          email: 'user@example.com',
          password: 'password',
          scrapeUrl: 'https://www.farfetch.com/shopping/women/items.aspx',
          maxRetries: 2,
          filters: { maxPrice: 500, category: 'women' }
        },
        features: [
          'Scraping inteligente',
          'Filtros avanzados',
          'Datos estructurados',
          'Control de velocidad'
        ]
      },
      'proxy-rotation': {
        title: 'Rotación de Proxies',
        description: 'Gestión avanzada de proxies y IPs',
        icon: '🌐',
        color: 'from-purple-500 to-violet-600',
        bgColor: 'from-purple-50 to-violet-50',
        defaultParams: {
          rotationCount: 3,
          delayBetweenRotations: 2000,
          proxyList: [],
          validateProxies: true
        },
        features: [
          'Rotación automática',
          'Validación de IPs',
          'Optimización de velocidad',
          'Detección de bloqueos'
        ]
      },
      'monitoring': {
        title: 'Monitoreo del Sistema',
        description: 'Supervisión y alertas en tiempo real',
        icon: '📊',
        color: 'from-orange-500 to-red-600',
        bgColor: 'from-orange-50 to-red-50',
        defaultParams: {
          checkInterval: 10000,
          maxChecks: 3,
          alertThreshold: 0.8,
          enableNotifications: true
        },
        features: [
          'Métricas en tiempo real',
          'Alertas automáticas',
          'Reportes detallados',
          'Dashboard interactivo'
        ]
      }
    };
    return configs[workflowName] || {
      title: workflowName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: 'Workflow personalizado',
      icon: '⚙️',
      color: 'from-gray-500 to-slate-600',
      bgColor: 'from-gray-50 to-slate-50',
      defaultParams: {},
      features: ['Configuración personalizada']
    };
  };

  const updateWorkflowParams = (workflowName: string, params: string) => {
    setExecutionParams(prev => ({
      ...prev,
      [workflowName]: params
    }));
  };

  const initializeWorkflowParams = (workflowName: string) => {
    if (!executionParams[workflowName]) {
      const config = getWorkflowConfig(workflowName);
      updateWorkflowParams(workflowName, JSON.stringify(config.defaultParams, null, 2));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Principal Limpio */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 backdrop-blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">
                  Gestión de Workflows
                </h1>
                <p className="text-white/80 font-medium">
                  Automatización inteligente por módulos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">{workflows?.available.length || 0} workflows</span>
              </div>
              <button
                onClick={fetchWorkflows}
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

        {/* Sistema de Pestañas */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Navegación de Pestañas */}
          <div className="border-b border-gray-200 bg-gray-50/50">
            <nav className="flex space-x-0" aria-label="Tabs">
              {workflows?.available.map((workflow) => {
                const config = getWorkflowConfig(workflow);
                const isActive = activeTab === workflow;
                return (
                  <button
                    key={workflow}
                    onClick={() => {
                      setActiveTab(workflow);
                      initializeWorkflowParams(workflow);
                    }}
                    className={`
                      relative px-6 py-4 text-sm font-semibold transition-all duration-200 border-b-2 flex items-center space-x-2
                      ${isActive 
                        ? 'border-indigo-500 text-indigo-600 bg-white shadow-sm' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-lg">{config.icon}</span>
                    <span>{config.title}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenido de la Pestaña Activa */}
          {activeTab && (
            <div className="p-8">
              {(() => {
                const config = getWorkflowConfig(activeTab);
                initializeWorkflowParams(activeTab);

                return (
                  <div className="space-y-8">
                    {/* Header del Workflow */}
                    <div className={`bg-gradient-to-br ${config.bgColor} rounded-2xl p-6 border-2 border-gray-100`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`bg-gradient-to-br ${config.color} p-4 rounded-2xl shadow-lg`}>
                            <span className="text-2xl">{config.icon}</span>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">{config.title}</h2>
                            <p className="text-gray-600 mt-1">{config.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-gray-700">Disponible</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grid Principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                      {/* Panel de Configuración */}
                      <div className="lg:col-span-2 space-y-6">

                        {/* Características del Workflow */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            <span>Características</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {config.features.map((feature: string, index: number) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Editor de Parámetros */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                            <Code className="h-5 w-5 text-purple-600" />
                            <span>Configuración de Parámetros</span>
                          </h3>
                          <div className="relative">
                            <textarea
                              value={executionParams[activeTab] || ''}
                              onChange={(e) => updateWorkflowParams(activeTab, e.target.value)}
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50 font-mono text-sm resize-none transition-all duration-200"
                              rows={12}
                              placeholder="Configuración JSON del workflow..."
                            />
                            <div className="absolute top-3 right-3 bg-purple-100 rounded-lg px-3 py-1">
                              <span className="text-xs font-medium text-purple-700">JSON</span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                            <Info className="h-4 w-4 text-blue-500" />
                            <span>Los parámetros se cargan automáticamente con valores por defecto</span>
                          </div>
                        </div>
                      </div>

                      {/* Panel de Control */}
                      <div className="space-y-6">

                        {/* Botón de Ejecución */}
                        <div className={`bg-gradient-to-br ${config.bgColor} rounded-2xl p-6 border-2 border-gray-100`}>
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <span>Ejecutar Workflow</span>
                          </h3>

                          <button
                            onClick={() => executeWorkflow(activeTab)}
                            className={`w-full bg-gradient-to-r ${config.color} hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:scale-105 transform flex items-center justify-center space-x-3`}
                          >
                            <Play className="h-5 w-5" />
                            <span>Ejecutar {config.title}</span>
                          </button>

                          <div className="mt-4 p-3 bg-white/50 rounded-xl">
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Workflow:</span>
                                <span className="font-mono">{activeTab}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Estado:</span>
                                <span className="text-green-600 font-medium">Listo</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ejecuciones Recientes */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-gray-600" />
                            <span>Ejecuciones Recientes</span>
                          </h3>

                          {workflows?.executions.filter(exec => exec.workflowName === activeTab).length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No hay ejecuciones recientes</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {workflows?.executions
                                .filter(exec => exec.workflowName === activeTab)
                                .slice(0, 3)
                                .map((execution) => (
                                  <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                      {execution.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                      {execution.status === 'running' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                                      {execution.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                                      <div>
                                        <div className="text-xs font-medium text-gray-800">
                                          {execution.id.slice(0, 8)}...
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(execution.startTime).toLocaleTimeString()}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      execution.status === 'completed' ? 'bg-green-100 text-green-700' :
                                      execution.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {execution.status}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
