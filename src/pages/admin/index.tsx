import React, { useState, useEffect } from 'react';

// Tipos simplificados
interface SystemStatus {
  success: boolean;
  status: string;
  services: {
    minio: { status: string; available: boolean };
    browserMCP: { status: string; available: boolean };
    scraperr: { status: string; available: boolean };
    deepScrape: { status: string; available: boolean };
    proxyManager?: { status: string; totalProxies: number; activeProxies: number };
  };
  uptime: number;
  memory: { used: number; total: number; percentage: number };
}

interface BotStatus {
  success: boolean;
  bot: {
    isConfigured: boolean;
    isRunning: boolean;
    activeSessions: number;
    uptime: number;
    lastActivity?: string;
    config: {
      maxOffersPerMessage: number;
      hasAdmins: boolean;
    };
  };
}

interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'starting' | 'stopping';
  description: string;
  path: string;
  port?: number;
  pid?: number;
  startTime?: string;
  lastActivity?: string;
  metrics: {
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
    uptime: number;
  };
  config: {
    autoRestart: boolean;
    maxRetries: number;
    timeout: number;
    dependencies: string[];
  };
  health: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    checks: {
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message: string;
      lastCheck: string;
    }[];
  };
}

interface ModulesData {
  success: boolean;
  modules: ModuleInfo[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    errors: number;
  };
}

interface CacheEntry {
  key: string;
  value: any;
  size: number;
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed: string;
  tags: string[];
}

interface CacheData {
  success: boolean;
  entries: CacheEntry[];
  stats: {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    expiredEntries: number;
    memoryUsage: {
      used: number;
      available: number;
      percentage: number;
    };
  };
}

interface AppleAuthStatus {
  success: boolean;
  isAuthenticated: boolean;
  requiresReauth: boolean;
  error?: string;
  message: string;
  healthCheck: {
    status: string;
    timestamp: string;
    details: {
      hasActiveSession: boolean;
      authManagerReady: boolean;
      envCredentialsConfigured: boolean;
    };
  };
  sessionInfo?: {
    sessionId: string;
    createdAt: string;
    lastActivity: string;
    expiresAt: string;
    authMethod: string;
    isValid: boolean;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  details?: any;
}

interface LogsData {
  success: boolean;
  logs: LogEntry[];
  total: number;
  stats: {
    total: number;
    byLevel: {
      info: number;
      warn: number;
      error: number;
      debug: number;
      success: number;
    };
    byModule: Record<string, number>;
    lastHour: number;
  };
}

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  output?: any;
  error?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  steps: WorkflowStep[];
  config: {
    target: string;
    modules: string[];
    filters: any;
  };
  results?: {
    totalOffers: number;
    uniqueOffers: number;
    errors: number;
  };
}

interface WorkflowsData {
  success: boolean;
  workflows: Workflow[];
  activeWorkflows: number;
  totalExecutions: number;
}

interface CacheEntry {
  key: string;
  value: any;
  size: number;
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed: string;
  tags: string[];
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  expiredEntries: number;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

interface CacheData {
  success: boolean;
  entries?: CacheEntry[];
  stats?: CacheStats;
}

interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'starting' | 'stopping';
  description: string;
  path: string;
  port?: number;
  pid?: number;
  startTime?: string;
  lastActivity?: string;
  metrics: {
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
    uptime: number;
  };
  config: {
    autoRestart: boolean;
    maxRetries: number;
    timeout: number;
    dependencies: string[];
  };
  health: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    checks: {
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message: string;
      lastCheck: string;
    }[];
  };
}

interface ModulesData {
  success: boolean;
  modules: ModuleInfo[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    errors: number;
  };
}

const TABS = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'logs', label: '📋 Logs' },
  { key: 'workflows', label: '⚙️ Workflows' },
  { key: 'cache', label: '💾 Cache' },
  { key: 'modules', label: '🔧 Módulos' },
  { key: 'apple-auth', label: '🍎 Apple Auth' },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [appleAuthStatus, setAppleAuthStatus] = useState<AppleAuthStatus | null>(null);
  const [logsData, setLogsData] = useState<LogsData | null>(null);
  const [workflowsData, setWorkflowsData] = useState<WorkflowsData | null>(null);
  const [modulesData, setModulesData] = useState<ModulesData | null>(null);
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Función para iniciar sesión en Apple
  const handleAppleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/apple-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headless: true,
          timeout: 60000
        })
      });

      const result = await response.json();

      if (result.success && result.isAuthenticated) {
        // Login exitoso, recargar datos
        await loadData();
        alert('✅ Autenticación Apple completada exitosamente');
      } else if (result.requires2FA) {
        // Se requiere 2FA
        const code = prompt('🔐 Ingresa el código de verificación de dos factores:');
        if (code) {
          // Aquí podrías implementar el endpoint de 2FA
          alert('⚠️ Funcionalidad de 2FA en desarrollo');
        }
      } else {
        alert(`❌ Error en autenticación: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('❌ Error de conexión al intentar autenticar');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Cargar datos del sistema
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar estado del sistema
        const systemResponse = await fetch('/api/health');
        if (systemResponse.ok) {
          const systemData = await systemResponse.json();
          setSystemStatus(systemData);
        }

        // Cargar estado del bot
        const botResponse = await fetch('/api/bot/status');
        if (botResponse.ok) {
          const botData = await botResponse.json();
          setBotStatus(botData);
        }

        // Cargar estado de Apple Auth
        const appleAuthResponse = await fetch('/api/apple-auth/status');
        if (appleAuthResponse.ok) {
          const appleAuthData = await appleAuthResponse.json();
          setAppleAuthStatus(appleAuthData);
        }

        // Cargar logs
        const logsResponse = await fetch('/api/logs?limit=100');
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setLogsData(logsData);
        }

        // Cargar workflows
        const workflowsResponse = await fetch('/api/workflows');
        if (workflowsResponse.ok) {
          const workflowsData = await workflowsResponse.json();
          setWorkflowsData(workflowsData);
        }

        // Cargar cache
        const cacheResponse = await fetch('/api/cache');
        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json();
          setCacheData(cacheData);
        }

        // Cargar módulos
        const modulesResponse = await fetch('/api/modules');
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          setModulesData(modulesData);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'up':
      case 'healthy':
        return '#22c55e';
      case 'down':
      case 'unhealthy':
        return '#ef4444';
      case 'degraded':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const renderDashboard = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>📊 Panel de Administración Mexa</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando datos del sistema...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          
          {/* Estado del Sistema */}
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '20px', 
            backgroundColor: '#f9fafb' 
          }}>
            <h3 style={{ marginBottom: '15px', color: '#374151' }}>🖥️ Estado del Sistema</h3>
            {systemStatus ? (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Estado General:</strong> 
                  <span style={{ 
                    color: getStatusColor(systemStatus.status), 
                    marginLeft: '8px',
                    fontWeight: 'bold'
                  }}>
                    {systemStatus.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Uptime:</strong> {formatUptime(systemStatus.uptime)}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Memoria:</strong> {systemStatus.memory.used}MB / {systemStatus.memory.total}MB 
                  ({systemStatus.memory.percentage}%)
                </div>
                
                <h4 style={{ marginBottom: '10px', color: '#374151' }}>Servicios:</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>MinIO:</span>
                    <span style={{ color: getStatusColor(systemStatus.services.minio.status) }}>
                      {systemStatus.services.minio.available ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Browser-MCP:</span>
                    <span style={{ color: getStatusColor(systemStatus.services.browserMCP.status) }}>
                      {systemStatus.services.browserMCP.available ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Scraperr:</span>
                    <span style={{ color: getStatusColor(systemStatus.services.scraperr.status) }}>
                      {systemStatus.services.scraperr.available ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>DeepScrape:</span>
                    <span style={{ color: getStatusColor(systemStatus.services.deepScrape.status) }}>
                      {systemStatus.services.deepScrape.available ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </div>
                  {systemStatus.services.proxyManager && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Proxy Manager:</span>
                      <span style={{ color: getStatusColor(systemStatus.services.proxyManager.status) }}>
                        {systemStatus.services.proxyManager.activeProxies}/{systemStatus.services.proxyManager.totalProxies} activos
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No se pudo cargar el estado del sistema</p>
            )}
          </div>

          {/* Estado del Bot */}
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '20px', 
            backgroundColor: '#f9fafb' 
          }}>
            <h3 style={{ marginBottom: '15px', color: '#374151' }}>🤖 Estado del Bot de Telegram</h3>
            {botStatus?.success && botStatus.bot ? (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Configurado:</strong> 
                  <span style={{ 
                    color: botStatus.bot.isConfigured ? '#22c55e' : '#ef4444', 
                    marginLeft: '8px' 
                  }}>
                    {botStatus.bot.isConfigured ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Ejecutándose:</strong> 
                  <span style={{ 
                    color: botStatus.bot.isRunning ? '#22c55e' : '#ef4444', 
                    marginLeft: '8px' 
                  }}>
                    {botStatus.bot.isRunning ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Sesiones Activas:</strong> {botStatus.bot.activeSessions}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Uptime:</strong> {formatUptime(botStatus.bot.uptime)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Última Actividad:</strong> {formatDate(botStatus.bot.lastActivity)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Ofertas por Mensaje:</strong> {botStatus.bot.config.maxOffersPerMessage}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Admins Configurados:</strong> 
                  <span style={{ 
                    color: botStatus.bot.config.hasAdmins ? '#22c55e' : '#f59e0b', 
                    marginLeft: '8px' 
                  }}>
                    {botStatus.bot.config.hasAdmins ? '✅ Sí' : '⚠️ No'}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No se pudo cargar el estado del bot</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderAppleAuth = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>🍎 Autenticación Apple</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando estado de Apple Auth...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>

          {/* Botón de Login */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#ffffff',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#374151' }}>🔐 Iniciar Sesión</h3>
            <p style={{ marginBottom: '20px', color: '#6b7280' }}>
              Inicia sesión en Apple usando las credenciales configuradas en el archivo .env
            </p>
            <button
              onClick={handleAppleLogin}
              disabled={isLoggingIn || (appleAuthStatus?.isAuthenticated && !appleAuthStatus?.requiresReauth)}
              style={{
                padding: '12px 24px',
                backgroundColor: isLoggingIn ? '#9ca3af' :
                                (appleAuthStatus?.isAuthenticated && !appleAuthStatus?.requiresReauth) ? '#22c55e' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isLoggingIn || (appleAuthStatus?.isAuthenticated && !appleAuthStatus?.requiresReauth) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {isLoggingIn ? '🔄 Iniciando sesión...' :
               (appleAuthStatus?.isAuthenticated && !appleAuthStatus?.requiresReauth) ? '✅ Ya autenticado' :
               '🍎 Iniciar Sesión Apple'}
            </button>
            {appleAuthStatus?.isAuthenticated && !appleAuthStatus?.requiresReauth && (
              <p style={{ marginTop: '10px', color: '#22c55e', fontSize: '14px' }}>
                ✅ Sesión activa y válida
              </p>
            )}
          </div>

          {/* Estado General de Apple Auth */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#374151' }}>📊 Estado General</h3>
            {appleAuthStatus ? (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Estado del Módulo:</strong>
                  <span style={{
                    color: appleAuthStatus.healthCheck.status === 'healthy' ? '#22c55e' : '#ef4444',
                    marginLeft: '8px',
                    fontWeight: 'bold'
                  }}>
                    {appleAuthStatus.healthCheck.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Autenticado:</strong>
                  <span style={{
                    color: appleAuthStatus.isAuthenticated ? '#22c55e' : '#ef4444',
                    marginLeft: '8px'
                  }}>
                    {appleAuthStatus.isAuthenticated ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Requiere Re-autenticación:</strong>
                  <span style={{
                    color: appleAuthStatus.requiresReauth ? '#f59e0b' : '#22c55e',
                    marginLeft: '8px'
                  }}>
                    {appleAuthStatus.requiresReauth ? '⚠️ Sí' : '✅ No'}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Última Verificación:</strong> {formatDate(appleAuthStatus.healthCheck.timestamp)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Mensaje:</strong>
                  <span style={{
                    color: appleAuthStatus.success ? '#374151' : '#ef4444',
                    marginLeft: '8px'
                  }}>
                    {appleAuthStatus.message}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No se pudo cargar el estado de Apple Auth</p>
            )}
          </div>

          {/* Información de Sesión Activa */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#374151' }}>🔐 Sesión Activa</h3>
            {appleAuthStatus?.sessionInfo ? (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>ID de Sesión:</strong>
                  <code style={{
                    backgroundColor: '#e5e7eb',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    fontSize: '12px'
                  }}>
                    {appleAuthStatus.sessionInfo.sessionId.substring(0, 16)}...
                  </code>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Método de Autenticación:</strong>
                  <span style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    marginLeft: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {appleAuthStatus.sessionInfo.authMethod}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Creada:</strong> {formatDate(appleAuthStatus.sessionInfo.createdAt)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Última Actividad:</strong> {formatDate(appleAuthStatus.sessionInfo.lastActivity)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Expira:</strong> {formatDate(appleAuthStatus.sessionInfo.expiresAt)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Estado de Sesión:</strong>
                  <span style={{
                    color: appleAuthStatus.sessionInfo.isValid ? '#22c55e' : '#ef4444',
                    marginLeft: '8px'
                  }}>
                    {appleAuthStatus.sessionInfo.isValid ? '✅ Válida' : '❌ Inválida'}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                <p>🚫 No hay sesión activa</p>
                <p style={{ fontSize: '14px' }}>
                  Inicia sesión usando la API POST /api/apple-auth/login
                </p>
              </div>
            )}
          </div>

          {/* Detalles Técnicos */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#374151' }}>🔧 Detalles Técnicos</h3>
            {appleAuthStatus ? (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Auth Manager:</strong>
                  <span style={{
                    color: appleAuthStatus.healthCheck.details.authManagerReady ? '#22c55e' : '#ef4444',
                    marginLeft: '8px'
                  }}>
                    {appleAuthStatus.healthCheck.details.authManagerReady ? '✅ Listo' : '❌ No listo'}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Credenciales ENV:</strong>
                  <span style={{
                    color: appleAuthStatus.healthCheck.details.envCredentialsConfigured ? '#22c55e' : '#f59e0b',
                    marginLeft: '8px'
                  }}>
                    {appleAuthStatus.healthCheck.details.envCredentialsConfigured ? '✅ Configuradas' : '⚠️ No configuradas'}
                  </span>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Sesión Activa:</strong>
                  <span style={{
                    color: appleAuthStatus.healthCheck.details.hasActiveSession ? '#22c55e' : '#6b7280',
                    marginLeft: '8px'
                  }}>
                    {appleAuthStatus.healthCheck.details.hasActiveSession ? '✅ Sí' : '⚪ No'}
                  </span>
                </div>

                <h4 style={{ marginBottom: '10px', color: '#374151' }}>APIs Disponibles:</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                    <code style={{ fontSize: '12px' }}>GET /api/apple-auth/status</code>
                    <span style={{ color: '#22c55e', fontSize: '12px' }}>✅ Activo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                    <code style={{ fontSize: '12px' }}>POST /api/apple-auth/login</code>
                    <span style={{ color: '#22c55e', fontSize: '12px' }}>✅ Activo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                    <code style={{ fontSize: '12px' }}>POST /api/apple-auth/two-factor</code>
                    <span style={{ color: '#22c55e', fontSize: '12px' }}>✅ Activo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                    <code style={{ fontSize: '12px' }}>GET/DELETE/PUT /api/apple-auth/session</code>
                    <span style={{ color: '#22c55e', fontSize: '12px' }}>✅ Activo</span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No se pudieron cargar los detalles técnicos</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>📋 Logs del Sistema</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando logs...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>

          {/* Filtros de Logs */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#f9fafb',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontWeight: 'bold', color: '#374151' }}>Filtros:</span>

            {logsData?.stats ? Object.entries(logsData.stats.byLevel).map(([level, count]) => (
              <button
                key={level}
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: level === 'error' ? '#fee2e2' :
                                 level === 'warn' ? '#fef3c7' :
                                 level === 'info' ? '#dbeafe' :
                                 level === 'success' ? '#dcfce7' : '#f3f4f6',
                  color: level === 'error' ? '#dc2626' :
                         level === 'warn' ? '#d97706' :
                         level === 'info' ? '#2563eb' :
                         level === 'success' ? '#16a34a' : '#6b7280'
                }}
              >
                {level.toUpperCase()} ({count})
              </button>
            )) : []}

            <span style={{ marginLeft: '20px', color: '#6b7280' }}>
              Total: {logsData?.total || 0} logs
            </span>
          </div>

          {/* Lista de Logs */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {logsData?.logs?.map((log, index) => (
              <div
                key={log.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: index < ((logsData?.logs?.length || 0) - 1) ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  fontSize: '14px'
                }}
              >
                {/* Timestamp */}
                <div style={{
                  minWidth: '140px',
                  color: '#6b7280',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {formatDate(log.timestamp)}
                </div>

                {/* Level Badge */}
                <div style={{
                  minWidth: '60px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: log.level === 'error' ? '#fee2e2' :
                                 log.level === 'warning' ? '#fef3c7' :
                                 log.level === 'info' ? '#dbeafe' : '#f3f4f6',
                  color: log.level === 'error' ? '#dc2626' :
                         log.level === 'warning' ? '#d97706' :
                         log.level === 'info' ? '#2563eb' : '#6b7280'
                }}>
                  {log.level.toUpperCase()}
                </div>

                {/* Source */}
                <div style={{
                  minWidth: '100px',
                  fontWeight: 'bold',
                  color: '#374151'
                }}>
                  {log.source}
                </div>

                {/* Message */}
                <div style={{
                  flex: 1,
                  color: '#1f2937'
                }}>
                  {log.message}
                  {log.details && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontFamily: 'monospace',
                      backgroundColor: '#f9fafb',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      maxWidth: '400px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {JSON.stringify(log.details, null, 2).substring(0, 100)}
                      {JSON.stringify(log.details).length > 100 && '...'}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {(!logsData?.logs || logsData?.logs?.length === 0) && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                No hay logs disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderWorkflows = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>⚙️ Gestión de Workflows</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando workflows...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>

          {/* Resumen de Workflows */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {workflowsData?.totalExecutions || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Workflows</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                {workflowsData?.activeWorkflows || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Activos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {workflowsData?.workflows?.filter(w => w.status === 'completed').length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Completados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                {workflowsData?.workflows?.filter(w => w.status === 'failed').length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Fallidos</div>
            </div>
          </div>

          {/* Lista de Workflows */}
          <div style={{ display: 'grid', gap: '15px' }}>
            {workflowsData?.workflows?.map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#ffffff'
                }}
              >
                {/* Header del Workflow */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 5px 0',
                      color: '#1f2937',
                      fontSize: '18px'
                    }}>
                      {workflow.name}
                    </h3>
                    <p style={{
                      margin: '0 0 10px 0',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {workflow.description}
                    </p>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      ID: {workflow.id}
                    </div>
                  </div>

                  {/* Estado del Workflow */}
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: workflow.status === 'completed' ? '#dcfce7' :
                                   workflow.status === 'running' ? '#dbeafe' :
                                   workflow.status === 'failed' ? '#fee2e2' :
                                   workflow.status === 'paused' ? '#fef3c7' : '#f3f4f6',
                    color: workflow.status === 'completed' ? '#16a34a' :
                           workflow.status === 'running' ? '#2563eb' :
                           workflow.status === 'failed' ? '#dc2626' :
                           workflow.status === 'paused' ? '#d97706' : '#6b7280'
                  }}>
                    {workflow.status.toUpperCase()}
                  </div>
                </div>

                {/* Progreso */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                    fontSize: '14px'
                  }}>
                    <span>Progreso</span>
                    <span>{workflow.progress}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${workflow.progress}%`,
                      height: '100%',
                      backgroundColor: workflow.status === 'completed' ? '#22c55e' :
                                     workflow.status === 'running' ? '#3b82f6' :
                                     workflow.status === 'failed' ? '#ef4444' : '#f59e0b',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Información de Tiempo */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '10px',
                  marginBottom: '15px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {workflow.startTime && (
                    <div>
                      <strong>Iniciado:</strong> {formatDate(workflow.startTime)}
                    </div>
                  )}
                  {workflow.endTime && (
                    <div>
                      <strong>Finalizado:</strong> {formatDate(workflow.endTime)}
                    </div>
                  )}
                  {workflow.duration && (
                    <div>
                      <strong>Duración:</strong> {Math.round(workflow.duration / 1000)}s
                    </div>
                  )}
                </div>

                {/* Resultados */}
                {workflow.results && (
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    <div>
                      <strong>Ofertas Totales:</strong> {workflow.results.totalOffers}
                    </div>
                    <div>
                      <strong>Ofertas Únicas:</strong> {workflow.results.uniqueOffers}
                    </div>
                    <div>
                      <strong>Errores:</strong> {workflow.results.errors}
                    </div>
                  </div>
                )}

                {/* Pasos del Workflow */}
                <div>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Pasos del Workflow:
                  </h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {workflow.steps.map((step, index) => (
                      <div
                        key={step.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        {/* Número del paso */}
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: step.status === 'completed' ? '#22c55e' :
                                         step.status === 'running' ? '#3b82f6' :
                                         step.status === 'failed' ? '#ef4444' :
                                         step.status === 'pending' ? '#d1d5db' : '#f59e0b',
                          color: 'white'
                        }}>
                          {index + 1}
                        </div>

                        {/* Nombre del paso */}
                        <div style={{ flex: 1, fontWeight: 'bold' }}>
                          {step.name}
                        </div>

                        {/* Estado del paso */}
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: step.status === 'completed' ? '#dcfce7' :
                                         step.status === 'running' ? '#dbeafe' :
                                         step.status === 'failed' ? '#fee2e2' :
                                         step.status === 'pending' ? '#f3f4f6' : '#fef3c7',
                          color: step.status === 'completed' ? '#16a34a' :
                                 step.status === 'running' ? '#2563eb' :
                                 step.status === 'failed' ? '#dc2626' :
                                 step.status === 'pending' ? '#6b7280' : '#d97706'
                        }}>
                          {step.status.toUpperCase()}
                        </div>

                        {/* Duración */}
                        {step.duration && (
                          <div style={{ color: '#9ca3af' }}>
                            {Math.round(step.duration / 1000)}s
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )) || []}

            {(!workflowsData?.workflows || workflowsData.workflows.length === 0) && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
              }}>
                No hay workflows disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderModules = () => {
    if (!modulesData) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Cargando información de módulos...</p>
        </div>
      );
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return '#10b981';
        case 'inactive': return '#6b7280';
        case 'error': return '#ef4444';
        case 'starting': return '#f59e0b';
        case 'stopping': return '#f59e0b';
        default: return '#6b7280';
      }
    };

    const getHealthColor = (health: string) => {
      switch (health) {
        case 'healthy': return '#10b981';
        case 'unhealthy': return '#ef4444';
        case 'unknown': return '#6b7280';
        default: return '#6b7280';
      }
    };

    const formatUptime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    const formatBytes = (bytes: number) => {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>🧩 Estado de Módulos</h2>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
            <span style={{ color: '#10b981' }}>● {modulesData.summary.active} Activos</span>
            <span style={{ color: '#6b7280' }}>● {modulesData.summary.inactive} Inactivos</span>
            <span style={{ color: '#ef4444' }}>● {modulesData.summary.errors} Errores</span>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {modulesData.modules.map((module) => (
            <div key={module.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1f2937' }}>{module.name}</h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getStatusColor(module.status)
                    }}>
                      {module.status.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getHealthColor(module.health.status)
                    }}>
                      {module.health.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>{module.description}</p>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    v{module.version} • {module.path}
                    {module.port && ` • Puerto: ${module.port}`}
                    {module.pid && ` • PID: ${module.pid}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                  {module.startTime && (
                    <div>Iniciado: {new Date(module.startTime).toLocaleTimeString()}</div>
                  )}
                  {module.lastActivity && (
                    <div>Última actividad: {new Date(module.lastActivity).toLocaleTimeString()}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>CPU</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{module.metrics.cpu}%</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Memoria</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{formatBytes(module.metrics.memory * 1024 * 1024)}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Requests</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{module.metrics.requests.toLocaleString()}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Errores</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: module.metrics.errors > 0 ? '#ef4444' : '#10b981' }}>{module.metrics.errors}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Uptime</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{formatUptime(module.metrics.uptime)}</div>
                </div>
              </div>

              {module.health.checks.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '14px' }}>Health Checks</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {module.health.checks.map((check, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: check.status === 'pass' ? '#f0fdf4' : check.status === 'warn' ? '#fffbeb' : '#fef2f2',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            color: check.status === 'pass' ? '#10b981' : check.status === 'warn' ? '#f59e0b' : '#ef4444'
                          }}>
                            {check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗'}
                          </span>
                          <span style={{ fontWeight: 'bold' }}>{check.name}</span>
                          <span style={{ color: '#6b7280' }}>{check.message}</span>
                        </div>
                        <span style={{ color: '#9ca3af' }}>
                          {new Date(check.lastCheck).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCache = () => {
    if (!cacheData) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Cargando información de cache...</p>
        </div>
      );
    }

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    const getExpirationStatus = (expiresAt?: string) => {
      if (!expiresAt) return { status: 'permanent', color: '#10b981', text: 'Permanente' };

      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) return { status: 'expired', color: '#ef4444', text: 'Expirado' };
      if (diff < 60000) return { status: 'expiring', color: '#f59e0b', text: 'Expirando pronto' };
      return { status: 'valid', color: '#10b981', text: 'Válido' };
    };

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>🗄️ Gestión de Cache</h2>
          <button
            onClick={() => {
              fetch('/api/cache', { method: 'DELETE' })
                .then(() => {
                  // Recargar datos del cache
                  fetch('/api/cache')
                    .then(res => res.json())
                    .then(data => setCacheData(data));
                });
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Limpiar Cache
          </button>
        </div>

        {/* Estadísticas del Cache */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total de Entradas</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{cacheData.stats.totalEntries.toLocaleString()}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tamaño Total</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{formatBytes(cacheData.stats.totalSize)}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Hit Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{(cacheData.stats.hitRate * 100).toFixed(1)}%</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Miss Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{(cacheData.stats.missRate * 100).toFixed(1)}%</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Uso de Memoria</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{cacheData.stats.memoryUsage.percentage.toFixed(1)}%</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
              {formatBytes(cacheData.stats.memoryUsage.used)} / {formatBytes(cacheData.stats.memoryUsage.available)}
            </div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Entradas Expiradas</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{cacheData.stats.expiredEntries.toLocaleString()}</div>
          </div>
        </div>

        {/* Lista de Entradas del Cache */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
            <h3 style={{ margin: 0, color: '#1f2937' }}>Entradas del Cache</h3>
          </div>

          {cacheData.entries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p>No hay entradas en el cache</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {cacheData.entries.map((entry, index) => {
                const expiration = getExpirationStatus(entry.expiresAt);
                return (
                  <div key={entry.key} style={{
                    padding: '16px',
                    borderBottom: index < cacheData.entries.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <code style={{
                          backgroundColor: '#f3f4f6',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'monospace'
                        }}>
                          {entry.key}
                        </code>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: 'white',
                          backgroundColor: expiration.color
                        }}>
                          {expiration.text}
                        </span>
                        {entry.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {entry.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} style={{
                                padding: '2px 6px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: '10px',
                                color: '#6b7280'
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>Tamaño:</span> {formatBytes(entry.size)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>Accesos:</span> {entry.accessCount.toLocaleString()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>Creado:</span> {formatDate(entry.createdAt)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>Último acceso:</span> {formatDate(entry.lastAccessed)}
                        </div>
                        {entry.expiresAt && (
                          <div>
                            <span style={{ fontWeight: 'bold' }}>Expira:</span> {formatDate(entry.expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        fetch(`/api/cache?key=${encodeURIComponent(entry.key)}`, { method: 'DELETE' })
                          .then(() => {
                            // Recargar datos del cache
                            fetch('/api/cache')
                              .then(res => res.json())
                              .then(data => setCacheData(data));
                          });
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginLeft: '12px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlaceholder = (title: string) => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>{title}</h2>
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '40px',
        backgroundColor: '#f9fafb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <p>Esta sección está en desarrollo.</p>
        <p>Funcionalidad disponible próximamente.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        color: 'white', 
        padding: '20px',
        borderBottom: '1px solid #374151'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🚀 Mexa Admin Panel</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Sistema de administración y monitoreo
        </p>
      </div>

      {/* Navigation */}
      <div style={{ 
        backgroundColor: '#374151', 
        padding: '0 20px',
        borderBottom: '1px solid #4b5563'
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === tab.key ? '#1f2937' : 'transparent',
                color: 'white',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'workflows' && renderWorkflows()}
        {activeTab === 'cache' && renderCache()}
        {activeTab === 'modules' && renderModules()}
        {activeTab === 'apple-auth' && renderAppleAuth()}
      </div>
    </div>
  );
}
