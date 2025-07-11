import { useState, useEffect } from 'react';
import Head from 'next/head';

interface SystemStatus {
  services: {
    minio: { status: string; available: boolean };
    browserMCP: { status: string; available: boolean };
    scraperr: { status: string; available: boolean };
    proxyManager: { status: string; totalProxies: number; activeProxies: number };
  };
  uptime: number;
  memory: { used: number; total: number; percentage: number };
}

interface BotStatus {
  isConfigured: boolean;
  isRunning: boolean;
  activeSessions: number;
}

export default function AdminPanel() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para configuración
  const [botToken, setBotToken] = useState('');
  const [farfetchEmail, setFarfetchEmail] = useState('');
  const [farfetchPassword, setFarfetchPassword] = useState('');

  useEffect(() => {
    fetchSystemStatus();
    fetchBotStatus();
    
    // Actualizar cada 10 segundos
    const interval = setInterval(() => {
      fetchSystemStatus();
      fetchBotStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setSystemStatus(data);
    } catch (err) {
      setError('Error fetching system status');
    }
  };

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/bot/status');
      const data = await response.json();
      setBotStatus(data.bot);
      setLoading(false);
    } catch (err) {
      setError('Error fetching bot status');
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    // En un sistema real, esto guardaría en variables de entorno o base de datos
    alert('Configuración guardada (simulado)');
  };

  const handleTestWorkflow = async (workflowName: string) => {
    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowName })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Workflow ${workflowName} iniciado: ${data.executionId}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error ejecutando workflow');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Panel de Administración - Mexa</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🛠️ Panel de Administración - Mexa
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Estado del Sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Estado del Sistema</h2>
              {systemStatus && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>MinIO:</span>
                    <span className={systemStatus.services.minio.status === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {systemStatus.services.minio.status === 'up' ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Browser MCP:</span>
                    <span className={systemStatus.services.browserMCP.status === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {systemStatus.services.browserMCP.status === 'up' ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scraperr:</span>
                    <span className={systemStatus.services.scraperr.status === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {systemStatus.services.scraperr.status === 'up' ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proxies:</span>
                    <span className="text-blue-600">
                      {systemStatus.services.proxyManager.activeProxies}/{systemStatus.services.proxyManager.totalProxies}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🤖 Estado del Bot</h2>
              {botStatus && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Configurado:</span>
                    <span className={botStatus.isConfigured ? 'text-green-600' : 'text-red-600'}>
                      {botStatus.isConfigured ? '✅ Sí' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ejecutándose:</span>
                    <span className={botStatus.isRunning ? 'text-green-600' : 'text-red-600'}>
                      {botStatus.isRunning ? '✅ Sí' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sesiones activas:</span>
                    <span className="text-blue-600">{botStatus.activeSessions}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">💾 Recursos</h2>
              {systemStatus && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Memoria:</span>
                    <span className="text-blue-600">
                      {systemStatus.memory.used}MB / {systemStatus.memory.total}MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${systemStatus.memory.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="text-blue-600">{Math.floor(systemStatus.uptime / 60)} min</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">⚙️ Configuración</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token del Bot de Telegram
                  </label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Token del bot..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Farfetch
                  </label>
                  <input
                    type="email"
                    value={farfetchEmail}
                    onChange={(e) => setFarfetchEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña de Farfetch
                  </label>
                  <input
                    type="password"
                    value={farfetchPassword}
                    onChange={(e) => setFarfetchPassword(e.target.value)}
                    placeholder="Contraseña..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSaveConfig}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  💾 Guardar Configuración
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🔄 Workflows</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleTestWorkflow('proxy-rotation')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  🔄 Probar Rotación de Proxies
                </button>
                <button
                  onClick={() => handleTestWorkflow('auth-flow')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  🔐 Probar Autenticación
                </button>
                <button
                  onClick={() => handleTestWorkflow('monitoring')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  📊 Probar Monitoreo
                </button>
                <button
                  onClick={() => window.open('/api/docs', '_blank')}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  📖 Ver Documentación API
                </button>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">⚡ Acciones Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => window.open('/api/health', '_blank')}
                className="bg-green-100 text-green-800 py-3 px-4 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                🏥 Health Check
              </button>
              <button
                onClick={() => window.open('/api/proxies/status', '_blank')}
                className="bg-blue-100 text-blue-800 py-3 px-4 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                🔄 Estado Proxies
              </button>
              <button
                onClick={() => window.open('/api/offers/latest', '_blank')}
                className="bg-purple-100 text-purple-800 py-3 px-4 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                🛍️ Últimas Ofertas
              </button>
              <button
                onClick={() => window.open('/api/workflows/list', '_blank')}
                className="bg-yellow-100 text-yellow-800 py-3 px-4 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                📋 Lista Workflows
              </button>
            </div>
          </div>

          {/* Enlaces Adicionales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Páginas Adicionales</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/logs"
                className="bg-gray-100 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-center block"
              >
                📋 Ver Logs
              </a>
              <a
                href="/admin/workflows"
                className="bg-blue-100 text-blue-800 py-3 px-4 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center block"
              >
                🔄 Gestión Workflows
              </a>
              <a
                href="/admin/cache"
                className="bg-green-100 text-green-800 py-3 px-4 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-center block"
              >
                🚀 Cache del Sistema
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
