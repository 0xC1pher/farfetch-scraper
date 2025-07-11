import { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

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
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.workflows);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      setError('Error fetching workflows');
      setLoading(false);
    }
  };

  const executeWorkflow = async () => {
    if (!selectedWorkflow) {
      alert('Selecciona un workflow');
      return;
    }

    try {
      const params = JSON.parse(executionParams);
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: selectedWorkflow,
          params
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Workflow iniciado: ${data.executionId}`);
        fetchWorkflows(); // Actualizar lista
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error en parámetros JSON o ejecución');
    }
  };

  const cancelExecution = async (executionId: string) => {
    try {
      const response = await fetch(`/api/workflows/${executionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('Ejecución cancelada');
        fetchWorkflows();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error cancelando ejecución');
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
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'failed': return '❌';
      case 'cancelled': return '⏹️';
      default: return '❓';
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Cargando workflows...</div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Gestión de Workflows"
      description="Automatización y procesos"
    >
      <div className="space-y-6">

          {error && (
            <div className="backdrop-blur-md bg-red-500/20 border border-red-400/30 text-red-100 px-6 py-4 rounded-xl mb-8 shadow-lg">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Ejecutar Workflow */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 mb-8 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                  <PlayIcon className="h-4 w-4 text-green-400" />
                </div>
                Ejecutar Workflow
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-3">
                    <Cog6ToothIcon className="h-4 w-4 inline mr-2" />
                    Seleccionar Workflow
                  </label>
                  <select
                    value={selectedWorkflow}
                    onChange={(e) => {
                      setSelectedWorkflow(e.target.value);
                      setExecutionParams(getWorkflowParams(e.target.value));
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 mb-6"
                  >
                    <option value="" className="bg-slate-800">Selecciona un workflow...</option>
                    {workflows?.available.map(workflow => (
                      <option key={workflow} value={workflow} className="bg-slate-800">
                        {workflow}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={executeWorkflow}
                  disabled={!selectedWorkflow}
                  className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-3 ${
                    !selectedWorkflow
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-400/20'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  <PlayIcon className="h-5 w-5" />
                  <span>Ejecutar Workflow</span>
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-blue-200">
                  <svg className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Parámetros (JSON)
                </label>
                <textarea
                  value={executionParams}
                  onChange={(e) => setExecutionParams(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 font-mono text-sm"
                  placeholder='{\n  "email": "usuario@email.com",\n  "password": "contraseña",\n  "maxRetries": 3\n}'
                />
              </div>
            </div>
          </div>

          {/* Workflows Disponibles */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 mb-8 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                Workflows Disponibles
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflows?.available.map(workflow => (
                <div key={workflow} className="backdrop-blur-sm bg-white/5 border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white text-lg">{workflow}</h3>
                    <div className={`p-2 rounded-lg ${
                      workflow === 'auth-flow' ? 'bg-blue-500/20' :
                      workflow === 'scraping-flow' ? 'bg-green-500/20' :
                      workflow === 'proxy-rotation' ? 'bg-purple-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      {workflow === 'auth-flow' && (
                        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      {workflow === 'scraping-flow' && (
                        <ArrowPathIcon className="h-5 w-5 text-green-400" />
                      )}
                      {workflow === 'proxy-rotation' && (
                        <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      )}
                      {workflow === 'monitoring' && (
                        <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                    {workflow === 'auth-flow' && 'Flujo de autenticación con Farfetch'}
                    {workflow === 'scraping-flow' && 'Scraping completo con filtros'}
                    {workflow === 'proxy-rotation' && 'Rotación y validación de proxies'}
                    {workflow === 'monitoring' && 'Monitoreo del estado del sistema'}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedWorkflow(workflow);
                      setExecutionParams(getWorkflowParams(workflow));
                    }}
                    className="w-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-blue-300 py-2 px-4 rounded-lg text-sm hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-200 font-medium"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ejecuciones Recientes */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                  <ClockIcon className="h-4 w-4 text-cyan-400" />
                </div>
                Ejecuciones Recientes
              </h2>
            </div>
            {workflows?.executions.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="p-4 bg-gray-500/10 rounded-xl border border-gray-400/20 inline-block">
                  <ClockIcon className="h-6 w-6 text-gray-400 mx-auto mb-3" />
                  <div className="text-lg font-medium">No hay ejecuciones recientes</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Los workflows ejecutados aparecerán aquí
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workflow
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workflows?.executions.map(execution => (
                      <tr key={execution.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {execution.workflowName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                            {getStatusIcon(execution.status)} {execution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(execution.startTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {execution.duration ? `${execution.duration}s` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${execution.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{execution.progress || 0}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {execution.status === 'running' && (
                            <button
                              onClick={() => cancelExecution(execution.id)}
                              className="text-red-600 hover:text-red-900 mr-2"
                            >
                              ⏹️ Cancelar
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/api/workflows/${execution.id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            👁️ Ver
                          </button>
                        </td>
                      </tr>
                    ))}
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
