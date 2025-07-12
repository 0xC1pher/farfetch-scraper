import { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  Play,
  Square,
  Settings,
  Clock,
  CheckCircle2,
  XCircle,
  StopCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  ClipboardList,
  Lock,
  Network,
  Activity,
  AlertTriangle,
  Code,
  Terminal
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  progress?: number;
}

interface WorkflowList {
  available: string[];
  executions: WorkflowExecution[];
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [executionParams, setExecutionParams] = useState<string>('{}');

  useEffect(() => {
    fetchWorkflows();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const executeWorkflow = async () => {
    if (!selectedWorkflow) {
      setError('Por favor selecciona un workflow para ejecutar');
      return;
    }

    try {
      const params = executionParams.trim() ? JSON.parse(executionParams) : {};
      
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: selectedWorkflow,
          params
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Mostrar mensaje de éxito y actualizar la lista
        setError(null);
        alert(`✅ Workflow iniciado correctamente\nID: ${data.executionId}`);
        fetchWorkflows(); // Actualizar lista
      } else {
        throw new Error(data.error || 'Error desconocido al iniciar el workflow');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al ejecutar workflow:', errorMessage);
      setError(`Error al ejecutar el workflow: ${errorMessage || 'Verifica los parámetros e inténtalo de nuevo'}`);
    }
  };

  const cancelExecution = async (executionId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta ejecución?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${executionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert('✅ Ejecución cancelada correctamente');
        fetchWorkflows(); // Actualizar lista
      } else {
        throw new Error(data.error || 'Error al cancelar la ejecución');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al cancelar ejecución:', errorMessage);
      alert(`Error al cancelar la ejecución: ${errorMessage || 'Inténtalo de nuevo más tarde'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { className: "w-3.5 h-3.5 inline-block mr-1" };
    switch (status) {
      case 'completed': 
        return <CheckCircle2 {...iconProps} />;
      case 'running': 
        return <RefreshCw {...iconProps} className={`${iconProps.className} animate-spin`} />;
      case 'failed': 
        return <XCircle {...iconProps} />;
      case 'cancelled': 
        return <StopCircle {...iconProps} />;
      default: 
        return <HelpCircle {...iconProps} />;
    }
  };

  const getWorkflowParams = (workflowName: string) => {
    const params: Record<string, any> = {
      'auth-flow': {
        email: 'user@example.com',
        password: 'password',
        fingerprintLevel: 'medium'
      },
      'scraping-flow': {
        email: 'user@example.com',
        password: 'password',
        scrapeUrl: 'https://www.farfetch.com/shopping/women/items.aspx',
        maxRetries: 2,
        filters: { maxPrice: 500 }
      },
      'proxy-rotation': {
        rotationCount: 3,
        delayBetweenRotations: 2000
      },
      'monitoring': {
        checkInterval: 10000,
        maxChecks: 3
      }
    };
    return JSON.stringify(params[workflowName] || {}, null, 2);
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
    <AdminLayout
      title="Gestión de Workflows"
      description="Automatización y procesos"
    >
      <div className="space-y-8">

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección de Ejecución */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Play className="h-5 w-5 text-blue-600" />
                </span>
                Ejecutar Workflow
              </h3>
              <p className="text-sm text-gray-500 mt-1">Selecciona un workflow y configura sus parámetros</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Settings className="h-4 w-4 inline-block mr-2 text-gray-500" />
                        Seleccionar Workflow
                      </label>
                      <select
                        value={selectedWorkflow}
                        onChange={(e) => {
                          setSelectedWorkflow(e.target.value);
                          setExecutionParams(getWorkflowParams(e.target.value));
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                      >
                        <option value="">Selecciona un workflow...</option>
                        {workflows?.available.map(workflow => (
                          <option key={workflow} value={workflow}>
                            {workflow}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={executeWorkflow}
                      disabled={!selectedWorkflow}
                      className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        !selectedWorkflow
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Ejecutar Workflow
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Code className="h-4 w-4 text-gray-500 mr-2" />
                      <label className="block text-sm font-medium text-gray-700">
                        Parámetros (JSON)
                      </label>
                    </div>
                    <div className="mt-1">
                      <textarea
                        value={executionParams}
                        onChange={(e) => setExecutionParams(e.target.value)}
                        rows={8}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3 font-mono text-sm"
                        placeholder='{\n  "email": "usuario@email.com",\n  "password": "contraseña",\n  "maxRetries": 3\n}'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflows Disponibles */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-blue-100 p-2 rounded-lg mr-3">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </span>
                Workflows Disponibles
              </h3>
              <p className="text-sm text-gray-500 mt-1">Selecciona un workflow para ver sus detalles</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {workflows?.available.map(workflow => {
                  const workflowConfig = {
                    'auth-flow': {
                      icon: <Lock className="h-5 w-5 text-blue-500" />,
                      color: 'blue',
                      description: 'Flujo de autenticación con Farfetch'
                    },
                    'scraping-flow': {
                      icon: <RefreshCw className="h-5 w-5 text-green-500" />,
                      color: 'green',
                      description: 'Scraping completo con filtros'
                    },
                    'proxy-rotation': {
                      icon: <Network className="h-5 w-5 text-purple-500" />,
                      color: 'purple',
                      description: 'Rotación y validación de proxies'
                    },
                    'monitoring': {
                      icon: <Activity className="h-5 w-5 text-orange-500" />,
                      color: 'orange',
                      description: 'Monitoreo del estado del sistema'
                    }
                  }[workflow] || {
                    icon: <Settings className="h-5 w-5 text-gray-500" />,
                    color: 'gray',
                    description: 'Workflow personalizado'
                  };
                  
                  return (
                    <div 
                      key={workflow}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {workflow.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <span className={`p-2 rounded-lg bg-${workflowConfig.color}-50`}>
                            {workflowConfig.icon}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-gray-600 mb-4">
                          {workflowConfig.description}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedWorkflow(workflow);
                            setExecutionParams(getWorkflowParams(workflow));
                            // Desplazarse a la sección de ejecución
                            document.getElementById('ejecutar-workflow')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Seleccionar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ejecuciones Recientes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                </span>
                Ejecuciones Recientes
              </h3>
              <p className="text-sm text-gray-500 mt-1">Historial de ejecuciones de workflows</p>
            </div>
            
            <div className="p-6">
              {workflows?.executions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-500">No hay ejecuciones recientes</h4>
                  <p className="text-gray-400 mt-1">
                    Los workflows ejecutados aparecerán aquí
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workflow
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inicio
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progreso
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workflows?.executions.map(execution => {
                      const statusColors = {
                        'running': 'text-blue-600 bg-blue-100',
                        'completed': 'text-green-600 bg-green-100',
                        'failed': 'text-red-600 bg-red-100',
                        'cancelled': 'text-gray-600 bg-gray-100'
                      }[execution.status] || 'text-gray-600 bg-gray-100';
                      
                      return (
                        <tr key={execution.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {execution.workflowName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-gray-500">
                              {execution.id.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors}`}>
                              {getStatusIcon(execution.status)}
                              <span className="capitalize">{execution.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(execution.startTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {execution.duration ? (
                              <span className="font-mono">{execution.duration}s</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-20 mr-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      execution.status === 'completed' ? 'bg-green-500' :
                                      execution.status === 'failed' ? 'bg-red-500' :
                                      execution.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                                    }`}
                                    style={{ width: `${execution.progress || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">
                                {execution.progress || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {execution.status === 'running' && (
                                <button
                                  onClick={() => cancelExecution(execution.id)}
                                  className="text-red-600 hover:text-red-900 inline-flex items-center text-xs p-1.5 hover:bg-red-50 rounded"
                                  title="Cancelar ejecución"
                                >
                                  <StopCircle className="h-4 w-4 mr-1" />
                                  <span className="sr-only">Cancelar</span>
                                </button>
                              )}
                              <button
                                onClick={() => window.open(`/api/workflows/${execution.id}`, '_blank')}
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center text-xs p-1.5 hover:bg-blue-50 rounded"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="sr-only">Ver</span>
                              </button>
                              <button
                                onClick={() => {
                                  // Lógica para ver logs
                                  console.log('Ver logs de', execution.id);
                                }}
                                className="text-gray-600 hover:text-gray-900 inline-flex items-center text-xs p-1.5 hover:bg-gray-50 rounded"
                                title="Ver logs"
                              >
                                <Terminal className="h-4 w-4 mr-1" />
                                <span className="sr-only">Logs</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
