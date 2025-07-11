import { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  ChartBarIcon,
  TrashIcon,
  CpuChipIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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
    
    // Actualizar cada 5 segundos
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
        fetchStats(); // Actualizar estadísticas
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
        <div className="text-xl">Cargando estadísticas de cache...</div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Cache del Sistema"
      description="Optimización y estadísticas"
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

          {/* Estadísticas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {stats?.totalEntries || 0}
                  </div>
                  <div className="text-sm text-blue-200 font-medium">Entradas Totales</div>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {stats?.totalHits || 0}
                  </div>
                  <div className="text-sm text-green-200 font-medium">Cache Hits</div>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-400 mb-2">
                    {stats?.totalMisses || 0}
                  </div>
                  <div className="text-sm text-red-200 font-medium">Cache Misses</div>
                </div>
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {stats?.hitRate.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-purple-200 font-medium">Tasa de Aciertos</div>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Uso de Memoria y Acciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                    <CpuChipIcon className="h-4 w-4 text-cyan-400" />
                  </div>
                  Uso de Memoria
                </h2>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-cyan-200 font-medium">Memoria utilizada:</span>
                  <span className="font-bold text-cyan-300 text-lg">
                    {stats?.memoryUsage || 0} KB
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-200">Progreso de uso</span>
                    <span className="text-cyan-300 font-medium">
                      {((stats?.memoryUsage || 0) / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{
                        width: `${Math.min((stats?.memoryUsage || 0) / 1024 * 100, 100)}%`
                      }}
                    ></div>
                  </div>

                  <div className="text-xs text-cyan-200">
                    Estimación basada en el contenido del cache
                  </div>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                    <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  Acciones de Cache
                </h2>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => handleAction('cleanup')}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Limpiar Expirados</span>
                </button>

                <button
                  onClick={() => handleAction('invalidate-offers')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Invalidar Ofertas</span>
                </button>

                <button
                  onClick={handleInvalidatePattern}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Invalidar Patrón</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres limpiar todo el cache?')) {
                      handleAction('clear');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Limpiar Todo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Entradas Más Populares */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🔥 Entradas Más Populares</h2>
            {stats?.popularEntries && stats.popularEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clave de Cache
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.popularEntries.map((entry, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {entry.key.length > 50 ? `${entry.key.substring(0, 50)}...` : entry.key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {entry.hits}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.key.startsWith('offers:') && '🛍️ Ofertas'}
                          {entry.key.startsWith('session:') && '🔐 Sesión'}
                          {entry.key.startsWith('health:') && '🏥 Health'}
                          {entry.key.startsWith('proxy:') && '🔄 Proxy'}
                          {entry.key.startsWith('workflow:') && '⚙️ Workflow'}
                          {!['offers:', 'session:', 'health:', 'proxy:', 'workflow:'].some(prefix => entry.key.startsWith(prefix)) && '📄 API'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No hay entradas en el cache
              </div>
            )}
          </div>

          {/* Información Adicional */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              ℹ️ Información del Cache
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• El cache se limpia automáticamente cada 5 minutos</p>
              <p>• Las ofertas se cachean por 5 minutos</p>
              <p>• Los health checks se cachean por 30 segundos</p>
              <p>• Las sesiones se cachean por 30 minutos</p>
              <p>• El cache mejora significativamente la velocidad de respuesta</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
