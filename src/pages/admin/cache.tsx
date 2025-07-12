import { useState, useEffect } from 'react';
import {
  Cpu,
  Trash2,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  Terminal,
  BarChart2,
  TrendingUp,
  Settings,
  RefreshCw,
  Clock
} from 'lucide-react';
import RealTimeLogs from '../../components/Logs/RealTimeLogs';

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  popularEntries: Array<{key: string, hits: number}>;
}

export default function CachePage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      setError('Error fetching cache stats');
      setLoading(false);
    }
  };

  const handleAction = async (action: string, pattern?: string) => {
    try {
      const response = await fetch('/api/cache/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, pattern })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Acción '${action}' completada exitosamente`);
        fetchStats();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error ejecutando acción');
    }
  };

  const handleInvalidatePattern = () => {
    const pattern = prompt('Ingresa el patrón a invalidar (regex):');
    if (pattern) {
      handleAction('invalidate', pattern);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700">No se pudieron cargar las estadísticas del caché.</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100">
      {/* Header Principal Rediseñado */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 backdrop-blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-3xl">
                  <Zap className="h-12 w-12 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black text-white mb-2">
                  Gestión de Caché
                </h1>
                <p className="text-xl text-white/80 font-medium">
                  Optimización y control del sistema de caché
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">{stats?.hitRate?.toFixed(1) || '0.0'}% Hit Rate</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <BarChart2 className="h-4 w-4 text-white" />
                    <span className="text-white font-medium">{stats?.totalEntries || 0} entradas</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <Cpu className="h-4 w-4 text-white" />
                    <span className="text-white font-medium">{stats?.memoryUsage?.toFixed(1) || '0.0'} MB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStats}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-2xl p-4 transition-all duration-300 hover:scale-105 group"
              >
                <RefreshCw className="h-6 w-6 text-white group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center">
              <div className="bg-blue-500 p-3 rounded-xl">
                <BarChart2 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center">
              <div className="bg-green-500 p-3 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hit Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hitRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center">
              <div className="bg-purple-500 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center">
              <div className="bg-orange-500 p-3 rounded-xl">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Memoria</p>
                <p className="text-2xl font-bold text-gray-900">{stats.memoryUsage.toFixed(1)} MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Control de Acciones */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Header del panel */}
            <div className="relative bg-gradient-to-r from-red-600 to-orange-600 px-8 py-6">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Centro de Control</h2>
                  <p className="text-white/80 font-medium">Herramientas de gestión avanzada</p>
                </div>
              </div>
            </div>

            {/* Botones de acción rediseñados */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Vaciar Caché */}
                <div className="group bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-100 hover:border-red-300 transition-all duration-300">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Trash2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Vaciar Caché</h3>
                      <p className="text-red-600 text-sm font-medium">Acción destructiva</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Elimina todas las entradas del caché. Esta acción no se puede deshacer.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de que quieres limpiar todo el caché?')) {
                        handleAction('clear');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Ejecutar Limpieza
                  </button>
                </div>

                {/* Invalidar Patrón */}
                <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Invalidar Patrón</h3>
                      <p className="text-blue-600 text-sm font-medium">Limpieza selectiva</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Invalida entradas específicas usando expresiones regulares.
                  </p>
                  <button
                    onClick={handleInvalidatePattern}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Configurar Patrón
                  </button>
                </div>

                {/* Limpiar Expirados */}
                <div className="group bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Limpiar Expirados</h3>
                      <p className="text-yellow-600 text-sm font-medium">Mantenimiento</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Elimina automáticamente las entradas que han expirado.
                  </p>
                  <button
                    onClick={() => handleAction('cleanup')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Ejecutar Limpieza
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Logs en Tiempo Real */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Terminal className="h-6 w-6 text-gray-600 mr-3" />
              Registros del Sistema
            </h3>
          </div>
          <div className="p-0">
            <RealTimeLogs />
          </div>
        </div>
      </div>
    </div>
  );
}
