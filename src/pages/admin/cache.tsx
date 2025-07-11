import { useState, useEffect } from 'react';
import Head from 'next/head';

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
    <>
      <Head>
        <title>Cache del Sistema - Mexa</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🚀 Cache del Sistema
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

          {/* Estadísticas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats?.totalEntries || 0}
              </div>
              <div className="text-sm text-gray-600">Entradas Totales</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats?.totalHits || 0}
              </div>
              <div className="text-sm text-gray-600">Cache Hits</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {stats?.totalMisses || 0}
              </div>
              <div className="text-sm text-gray-600">Cache Misses</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats?.hitRate.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-600">Tasa de Aciertos</div>
            </div>
          </div>

          {/* Uso de Memoria y Acciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">💾 Uso de Memoria</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Memoria utilizada:</span>
                  <span className="font-semibold text-blue-600">
                    {stats?.memoryUsage || 0} KB
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min((stats?.memoryUsage || 0) / 1024 * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Estimación basada en el contenido del cache
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🛠️ Acciones de Cache</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleAction('cleanup')}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  🧹 Limpiar Expirados
                </button>
                
                <button
                  onClick={() => handleAction('invalidate-offers')}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  🛍️ Invalidar Ofertas
                </button>
                
                <button
                  onClick={handleInvalidatePattern}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  🎯 Invalidar Patrón
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres limpiar todo el cache?')) {
                      handleAction('clear');
                    }
                  }}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  🗑️ Limpiar Todo
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
    </>
  );
}
