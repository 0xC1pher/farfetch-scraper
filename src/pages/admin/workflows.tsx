import { useState, useEffect } from 'react';
import Head from 'next/head';

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
    <>
      <Head>
        <title>Gestión de Workflows - Mexa</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🔄 Gestión de Workflows
            </h1>
            <a 
              href="/admin" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              ← Volver al Panel
            </a>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Ejecutar Workflow */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🚀 Ejecutar Workflow</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Workflow
                </label>
                <select
                  value={selectedWorkflow}
                  onChange={(e) => {
                    setSelectedWorkflow(e.target.value);
                    setExecutionParams(getWorkflowParams(e.target.value));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                >
                  <option value="">Selecciona un workflow...</option>
                  {workflows?.available.map(workflow => (
                    <option key={workflow} value={workflow}>
                      {workflow}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={executeWorkflow}
                  disabled={!selectedWorkflow}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                  ▶️ Ejecutar Workflow
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parámetros (JSON)
                </label>
                <textarea
                  value={executionParams}
                  onChange={(e) => setExecutionParams(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="{ }"
                />
              </div>
            </div>
          </div>

          {/* Workflows Disponibles */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Workflows Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflows?.available.map(workflow => (
                <div key={workflow} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{workflow}</h3>
                  <p className="text-sm text-gray-600 mb-3">
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
                    className="w-full bg-blue-100 text-blue-800 py-1 px-3 rounded text-sm hover:bg-blue-200"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ejecuciones Recientes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Ejecuciones Recientes</h2>
            {workflows?.executions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay ejecuciones recientes
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
    </>
  );
}
