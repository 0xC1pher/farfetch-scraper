import { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
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
  ShoppingBag,
  Book,
  RefreshCw
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
  const [feedback, setFeedback] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Caché</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAction('clear')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vaciar Caché
              </button>
              <button
                onClick={handleInvalidatePattern}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Invalidar Patrón
              </button>
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
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
          {feedback && (
            <div className="rounded-md bg-green-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{feedback}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                      onClick={() => setFeedback(null)}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <BarChart2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Entradas en caché</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats?.totalEntries?.toLocaleString() ?? '0'}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Aciertos</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats?.totalHits?.toLocaleString() ?? '0'}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Fallos</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats?.totalMisses?.toLocaleString() ?? '0'}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Tasa de acierto</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats?.hitRate?.toFixed(1) ?? '0.0'}%</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Uso de Memoria y Acciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-cyan-100 rounded-md p-3">
                  <Cpu className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Uso de Memoria</h3>
              </div>
              <div className="mt-6 space-y-6">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-medium">Memoria utilizada:</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {stats?.memoryUsage || 0} KB
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Progreso de uso</span>
                    <span className="text-gray-700 font-medium">
                      {((stats?.memoryUsage || 0) / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min((stats?.memoryUsage || 0) / 1024 * 100, 100)}%`
                      }}
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    Estimación basada en el contenido del cache
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Acciones de Cache</h3>
            </div>

            <div className="mt-6 space-y-4">
              <button
                onClick={() => handleAction('cleanup')}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Limpiar Expirados
              </button>

              <button
                onClick={() => handleAction('invalidate-offers')}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Invalidar Ofertas
              </button>

              <button
                onClick={handleInvalidatePattern}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
              >
                <Book className="h-5 w-5 mr-2" />
                Invalidar Patrón
              </button>

              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres limpiar todo el cache?')) {
                    handleAction('clear');
                  }
                }}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <Zap className="h-5 w-5 mr-2" />
                Limpiar Todo
              </button>
            </div>
          </div>

        </div>

        {/* Sección de Workflows */}
        <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </span>
                  Workflows Activos
                </h3>
                <p className="text-sm text-gray-500 mt-1">Monitorea y gestiona los workflows en ejecución</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  onClick={() => console.log('Nuevo workflow')}
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Iniciar Nuevo
                </button>
                <button 
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  onClick={fetchStats}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Actualizar
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {/* Workflow 1 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 text-base">Extracción de Productos</h4>
                    <p className="text-sm text-gray-500 mt-1">Última ejecución: Hace 5 min</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Productos</p>
                    <p className="font-medium">120/160</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Velocidad</p>
                    <p className="font-medium">4.2s/ítem</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <button 
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => console.log('Detener workflow')}
                >
                  Detener
                </button>
                <button 
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                  onClick={() => console.log('Ver detalles')}
                >
                  Ver Detalles
                </button>
              </div>
            </div>

            {/* Workflow 2 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 text-base">Sincronización de Precios</h4>
                    <p className="text-sm text-gray-500 mt-1">Última ejecución: Hace 2 min</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pausado
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full" 
                      style={{ width: '30%' }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Productos</p>
                    <p className="font-medium">45/150</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Velocidad</p>
                    <p className="font-medium">2.1s/ítem</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <button 
                  className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md shadow-sm transition-colors"
                  onClick={() => console.log('Reanudar workflow')}
                >
                  Reanudar
                </button>
                <button 
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  onClick={() => console.log('Ver detalles')}
                >
                  Ver Detalles
                </button>
              </div>
            </div>

            {/* Workflow 3 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 text-base">Actualización de Inventario</h4>
                    <p className="text-sm text-gray-500 mt-1">Completado: Hace 1 hora</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completado
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span className="font-medium text-green-600">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Productos</p>
                    <p className="font-medium">200/200</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Velocidad</p>
                    <p className="font-medium">1.8s/ítem</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Tiempo total: 6m 12s
                </span>
                <div className="flex space-x-2">
                  <button 
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => console.log('Ver historial')}
                  >
                    Historial
                  </button>
                  <button 
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                    onClick={() => console.log('Ver detalles')}
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Entradas Más Populares */}
        <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-yellow-500 mr-2">🔥</span>
              Entradas Más Populares
            </h3>
            <p className="text-sm text-gray-500 mt-1">Estadísticas de uso del caché en tiempo real</p>
          </div>
          <div className="bg-white px-6 py-4">
            {stats?.popularEntries && stats.popularEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clave de Cache
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hits
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.popularEntries.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-800">
                          {entry.key.length > 50 ? `${entry.key.substring(0, 50)}...` : entry.key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {entry.hits}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.key.startsWith('offers:') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              🛍️ Ofertas
                            </span>
                          )}
                          {entry.key.startsWith('session:') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              🔐 Sesión
                            </span>
                          )}
                          {entry.key.startsWith('health:') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              🏥 Health
                            </span>
                          )}
                          {entry.key.startsWith('proxy:') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                              🔄 Proxy
                            </span>
                          )}
                          {entry.key.startsWith('workflow:') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⚙️ Workflow
                            </span>
                          )}
                          {!['offers:', 'session:', 'health:', 'proxy:', 'workflow:'].some(prefix => entry.key.startsWith(prefix)) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              📄 API
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No hay entradas en el caché</p>
                <button
                  onClick={fetchStats}
                  className="mt-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100"
                >
                  Actualizar
                </button>
              </div>
            )}
          </div>
        </div>

            {/* Información Adicional */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-600" />
              Información del Cache
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• El cache se limpia automáticamente cada 5 minutos para mantener la frescura de los datos.</p>
              <p>• Los datos en caché se invalidan automáticamente según su tiempo de vida (TTL).</p>
              <p>• El uso de caché mejora significativamente el rendimiento de la aplicación.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Logs en Tiem Real */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center">
            <Terminal className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Registros del Sistema</h3>
          </div>
          <div className="p-0">
            <RealTimeLogs />
          </div>
        </div>
      </div>
    </div>
  );
}
