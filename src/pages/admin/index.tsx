import React, { useState, useEffect } from 'react';
import LogsTab from './LogsTab';
import WorkflowsTab from './workflows';
import CacheTab from './cache';
import ModulesTab from './ModulesTab';

// Tipos para los datos reales
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

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'logs', label: 'Logs' },
  { key: 'workflows', label: 'Workflows' },
  { key: 'cache', label: 'Cache' },
  { key: 'modules', label: 'Módulos' },
];

export default function AdminPanel() {
  // Estados reales
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Configuración del bot
  const [telegramToken, setTelegramToken] = useState('');
  const [farfetchEmail, setFarfetchEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const fetchData = async () => {
      try {
        const [healthResponse, botResponse] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/bot/status')
        ]);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setSystemStatus(healthData);
        }
        if (botResponse.ok) {
          const botData = await botResponse.json();
          setBotStatus(botData);
        }
      } catch (err) {
        setError('Error al cargar el estado del sistema');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken,
          farfetchEmail,
          password
        })
      });
      const data = await response.json();
      if (data.success) {
        setFeedback('¡Configuración guardada exitosamente!');
      } else {
        setFeedback(`Error: ${data.error}`);
      }
    } catch (err) {
      setFeedback('Error guardando configuración');
    }
  };

  const renderDashboard = () => (
    <>
      <div className="admin-grid">
        {/* Estado del Sistema */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Estado del Sistema</h3>
          </div>
          {loading ? (
            <div>Cargando...</div>
          ) : systemStatus ? (
            <ul className="admin-text-sm">
              <li className="admin-mb-2">
                <span className="admin-font-medium">MinIO:</span> 
                <span className={systemStatus.services.minio.available ? 'admin-text-green-600' : 'admin-text-red-600'}>
                  {systemStatus.services.minio.available ? ' Activo' : ' Inactivo'}
                </span>
              </li>
              <li className="admin-mb-2">
                <span className="admin-font-medium">Browser MCP:</span>
                <span className={systemStatus.services.browserMCP.available ? 'admin-text-green-600' : 'admin-text-red-600'}>
                  {systemStatus.services.browserMCP.available ? ' Disponible' : ' No encontrado'}
                </span>
              </li>
              <li className="admin-mb-2">
                <span className="admin-font-medium">Scraperr:</span>
                <span className={systemStatus.services.scraperr.available ? 'admin-text-green-600' : 'admin-text-red-600'}>
                  {systemStatus.services.scraperr.available ? ' Disponible' : ' No encontrado'}
                </span>
              </li>
              <li className="admin-mb-2">
                <span className="admin-font-medium">DeepScrape:</span>
                <span className="admin-text-green-600">
                  Disponible
                </span>
              </li>
              <li>
                <span className="admin-font-medium">Proxies:</span> {systemStatus.services.proxyManager.activeProxies} / {systemStatus.services.proxyManager.totalProxies}
              </li>
            </ul>
          ) : (
            <div>No disponible</div>
          )}
        </div>

        {/* Estado del Bot */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Estado del Bot</h3>
          </div>
          {loading ? (
            <div>Cargando...</div>
          ) : botStatus ? (
            <ul className="admin-text-sm">
              <li className="admin-mb-2">
                <span className="admin-font-medium">Configurado:</span> 
                <span className={botStatus.isConfigured ? 'admin-text-green-600' : 'admin-text-red-600'}>
                  {botStatus.isConfigured ? ' Sí' : ' No'}
                </span>
              </li>
              <li className="admin-mb-2">
                <span className="admin-font-medium">Ejecutándose:</span> 
                <span className={botStatus.isRunning ? 'admin-text-green-600' : 'admin-text-red-600'}>
                  {botStatus.isRunning ? ' Sí' : ' No'}
                </span>
              </li>
              <li>
                <span className="admin-font-medium">Sesiones activas:</span> {botStatus.activeSessions}
              </li>
            </ul>
          ) : (
            <div>No disponible</div>
          )}
        </div>

        {/* Recursos del Sistema */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recursos del Sistema</h3>
          </div>
          {loading ? (
            <div>Cargando...</div>
          ) : systemStatus ? (
            <ul className="admin-text-sm">
              <li className="admin-mb-2">
                <span className="admin-font-medium">Memoria:</span> {systemStatus.memory.used}MB / {systemStatus.memory.total}MB
              </li>
              <li className="admin-mb-2">
                <span className="admin-font-medium">Porcentaje utilizado:</span> {systemStatus.memory.percentage}%
              </li>
              <li>
                <span className="admin-font-medium">Tiempo Activo:</span> {Math.floor(systemStatus.uptime / 60)} min
              </li>
            </ul>
          ) : (
            <div>No disponible</div>
          )}
        </div>
      </div>

      {/* Configuración */}
      <div className="admin-card admin-mt-4">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Configuración</h3>
        </div>
        <form onSubmit={handleSaveConfig} className="admin-p-4">
          {feedback && (
            <div className={`admin-alert ${feedback.includes('Error') ? 'admin-alert-error' : 'admin-alert-success'}`}>
              <div className="admin-alert-content">
                <p className="admin-alert-message">{feedback}</p>
              </div>
              <button 
                type="button" 
                className="admin-btn admin-btn-outline admin-ml-2"
                onClick={() => setFeedback(null)}
              >
                Cerrar
              </button>
            </div>
          )}
          <div className="admin-form-group">
            <label className="admin-form-label">Token del Bot de Telegram</label>
            <input
              type="text"
              className="admin-form-input"
              value={telegramToken}
              onChange={e => setTelegramToken(e.target.value)}
              placeholder="Token del bot..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Email de Farfetch</label>
            <input
              type="email"
              className="admin-form-input"
              value={farfetchEmail}
              onChange={e => setFarfetchEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Contraseña de Farfetch</label>
            <input
              type="password"
              className="admin-form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña..."
            />
          </div>
          <div className="admin-flex admin-justify-between admin-mt-4">
            <button type="button" className="admin-btn admin-btn-outline">
              Cancelar
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </>
  );

  return (
    <div className="admin-container">
      <div>
        <h1>Panel de Administración</h1>
        <p className="admin-text-gray-500 admin-mb-4">Sistema Mexa - Scraping Inteligente</p>
        
        {/* Navegación de pestañas */}
        <div className="admin-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}

      {activeTab === 'logs' && (
        <div className="admin-card admin-mt-4">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Logs del Sistema</h3>
          </div>
          <div style={{margin: 0, padding: '1rem'}}>
            <LogsTab />
          </div>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="admin-card admin-mt-4">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Workflows</h3>
          </div>
          <div style={{margin: 0, padding: '1rem'}}>
            <WorkflowsTab />
          </div>
        </div>
      )}

      {activeTab === 'cache' && (
        <div className="admin-card admin-mt-4">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Gestión de Caché</h3>
          </div>
          <div style={{margin: 0, padding: '1rem'}}>
            <CacheTab />
          </div>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="admin-card admin-mt-4">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Gestión de Módulos</h3>
          </div>
          <div style={{margin: 0, padding: '1rem'}}>
            <ModulesTab />
          </div>
        </div>
      )}
    </div>
  );
}
