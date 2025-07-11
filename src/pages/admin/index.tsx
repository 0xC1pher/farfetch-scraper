import { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ServerIcon,
  CloudIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlayIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

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

// Componente para mostrar estado de servicios
const ServiceStatus = ({ name, status, icon }: { name: string; status: string; icon: React.ReactNode }) => {
  const isUp = status === 'up';
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
      isUp
        ? 'bg-green-500/10 border-green-400/20 hover:bg-green-500/15'
        : 'bg-red-500/10 border-red-400/20 hover:bg-red-500/15'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`p-1 rounded ${isUp ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <div className={isUp ? 'text-green-400' : 'text-red-400'}>
            {icon}
          </div>
        </div>
        <span className={`font-medium ${isUp ? 'text-green-100' : 'text-red-100'}`}>
          {name}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {isUp ? (
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
        ) : (
          <XCircleIcon className="h-5 w-5 text-red-400" />
        )}
        <span className={`text-sm font-bold ${isUp ? 'text-green-300' : 'text-red-300'}`}>
          {isUp ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  );
};



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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <div className="text-xl text-white font-medium">Cargando panel de administración...</div>
          <div className="text-purple-300 mt-2">Inicializando servicios...</div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Panel de Administración"
      description="Sistema Mexa - Scraping Inteligente"
    >
      <div className="space-y-6">
        {error && (
            <div className="backdrop-blur-md bg-red-500/20 border border-red-400/30 text-red-100 px-6 py-4 rounded-xl mb-8 shadow-lg">
              <div className="flex items-center space-x-3">
                <span className="text-red-400">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Estado del Sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-3 text-purple-400">🖥️</span>
                  Estado del Sistema
                </h2>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <span className="text-purple-400">📊</span>
                </div>
              </div>
              {systemStatus && (
                <div className="space-y-4">
                  <ServiceStatus
                    name="MinIO"
                    status={systemStatus.services.minio.status}
                    icon={<CloudIcon className="h-3 w-3" />}
                  />
                  <ServiceStatus
                    name="Browser MCP"
                    status={systemStatus.services.browserMCP.status}
                    icon={<CpuChipIcon className="h-3 w-3" />}
                  />
                  <ServiceStatus
                    name="Scraperr"
                    status={systemStatus.services.scraperr.status}
                    icon={<ArrowPathIcon className="h-3 w-3" />}
                  />
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-400/20">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <ServerIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-blue-100 font-medium">Proxies</span>
                    </div>
                    <span className="text-blue-300 font-bold">
                      {systemStatus.services.proxyManager.activeProxies}/{systemStatus.services.proxyManager.totalProxies}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                    <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  Estado del Bot
                </h2>
                <div className={`w-3 h-3 rounded-full ${botStatus?.isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              </div>
              {botStatus && (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    botStatus.isConfigured
                      ? 'bg-green-500/10 border-green-400/20'
                      : 'bg-red-500/10 border-red-400/20'
                  }`}>
                    <span className={`font-medium ${botStatus.isConfigured ? 'text-green-100' : 'text-red-100'}`}>
                      Configurado
                    </span>
                    {botStatus.isConfigured ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-400" />
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    botStatus.isRunning
                      ? 'bg-green-500/10 border-green-400/20'
                      : 'bg-red-500/10 border-red-400/20'
                  }`}>
                    <span className={`font-medium ${botStatus.isRunning ? 'text-green-100' : 'text-red-100'}`}>
                      Ejecutándose
                    </span>
                    {botStatus.isRunning ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
                    <span className="text-purple-100 font-medium">Sesiones activas</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-purple-300 font-bold text-sm">{botStatus.activeSessions}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                    <CpuChipIcon className="h-4 w-4 text-cyan-400" />
                  </div>
                  Recursos del Sistema
                </h2>
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
              {systemStatus && (
                <div className="space-y-6">
                  {/* Memoria */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-100 font-medium">Memoria</span>
                      <span className="text-cyan-300 font-bold">
                        {systemStatus.memory.used}MB / {systemStatus.memory.total}MB
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                        style={{ width: `${systemStatus.memory.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-cyan-200">
                      {systemStatus.memory.percentage}% utilizado
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-400/20">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-green-500/20 rounded">
                        <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-green-100 font-medium">Tiempo Activo</span>
                    </div>
                    <span className="text-green-300 font-bold">
                      {Math.floor(systemStatus.uptime / 60)} min
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                    <span className="text-orange-400">⚙️</span>
                  </div>
                  Configuración
                </h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-orange-200">
                    Token del Bot de Telegram
                  </label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Token del bot..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-orange-200">
                    Email de Farfetch
                  </label>
                  <input
                    type="email"
                    value={farfetchEmail}
                    onChange={(e) => setFarfetchEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-orange-200">
                    Contraseña de Farfetch
                  </label>
                  <input
                    type="password"
                    value={farfetchPassword}
                    onChange={(e) => setFarfetchPassword(e.target.value)}
                    placeholder="Contraseña..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <button
                  onClick={handleSaveConfig}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Guardar Configuración</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                    <span className="text-green-400">🔄</span>
                  </div>
                  Workflows
                </h2>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => handleTestWorkflow('proxy-rotation')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ArrowPathIcon className="h-5 w-5" />
                    <span>Probar Rotación de Proxies</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTestWorkflow('auth-flow')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Probar Autenticación</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTestWorkflow('monitoring')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ChartBarIcon className="h-5 w-5" />
                    <span>Probar Monitoreo</span>
                  </div>
                </button>
                <button
                  onClick={() => window.open('/api/docs', '_blank')}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    <span>Ver Documentación API</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                  <span className="text-yellow-400">⚡</span>
                </div>
                Acciones Rápidas
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => window.open('/api/health', '_blank')}
                className="group bg-green-500/10 border border-green-400/20 text-green-100 py-3 px-3 rounded-xl hover:bg-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 hover:scale-105"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Health Check</span>
                </div>
              </button>
              <button
                onClick={() => window.open('/api/proxies/status', '_blank')}
                className="group bg-blue-500/10 border border-blue-400/20 text-blue-100 py-4 px-4 rounded-xl hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 hover:scale-105"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <ArrowPathIcon className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">Estado Proxies</span>
                </div>
              </button>
              <button
                onClick={() => window.open('/api/offers/latest', '_blank')}
                className="group bg-purple-500/10 border border-purple-400/20 text-purple-100 py-4 px-4 rounded-xl hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 hover:scale-105"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Últimas Ofertas</span>
                </div>
              </button>
              <button
                onClick={() => window.open('/api/workflows/list', '_blank')}
                className="group bg-yellow-500/10 border border-yellow-400/20 text-yellow-100 py-4 px-4 rounded-xl hover:bg-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200 hover:scale-105"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                    <span className="text-yellow-400">📄</span>
                  </div>
                  <span className="text-sm font-medium">Lista Workflows</span>
                </div>
              </button>
            </div>
          </div>

          {/* Enlaces Adicionales */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                  <span className="text-indigo-400">🔗</span>
                </div>
                Páginas Adicionales
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/logs"
                className="group bg-gray-500/10 border border-gray-400/20 text-gray-100 py-4 px-6 rounded-xl hover:bg-gray-500/20 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 text-center block hover:scale-105"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-gray-500/20 rounded-lg group-hover:bg-gray-500/30 transition-colors">
                    <span className="text-gray-400">📋</span>
                  </div>
                  <div>
                    <div className="font-semibold">Ver Logs</div>
                    <div className="text-xs text-gray-300 mt-1">Monitoreo en tiempo real</div>
                  </div>
                </div>
              </a>
              <a
                href="/admin/workflows"
                className="group bg-blue-500/10 border border-blue-400/20 text-blue-100 py-4 px-6 rounded-xl hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-center block hover:scale-105"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <span className="text-blue-400">🔄</span>
                  </div>
                  <div>
                    <div className="font-semibold">Gestión Workflows</div>
                    <div className="text-xs text-blue-300 mt-1">Ejecutar y monitorear</div>
                  </div>
                </div>
              </a>
              <a
                href="/admin/cache"
                className="group bg-green-500/10 border border-green-400/20 text-green-100 py-4 px-6 rounded-xl hover:bg-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 text-center block hover:scale-105"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <span className="text-green-400">💾</span>
                  </div>
                  <div>
                    <div className="font-semibold">Cache del Sistema</div>
                    <div className="text-xs text-green-300 mt-1">Optimización y estadísticas</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
      </div>
    </AdminLayout>
  );
}
