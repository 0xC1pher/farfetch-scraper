import React, { useState, useEffect } from 'react';

interface AppleAuthStatus {
  isAuthenticated: boolean;
  sessionId?: string;
  email?: string;
  lastLogin?: string;
  expiresAt?: string;
  requiresReauth?: boolean;
  error?: string;
}

export const AppleAuthPanel: React.FC = () => {
  const [status, setStatus] = useState<AppleAuthStatus>({ isAuthenticated: false });
  const [loading, setLoading] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Cargar estado inicial
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/apple-auth/status');
      const data = await response.json();
      
      setStatus({
        isAuthenticated: data.isAuthenticated,
        sessionId: data.sessionId,
        email: data.email,
        lastLogin: data.lastLogin,
        expiresAt: data.expiresAt,
        requiresReauth: data.requiresReauth,
        error: data.error
      });
    } catch (error) {
      console.error('Error checking Apple auth status:', error);
      setMessage('Error verificando estado de autenticación');
      setMessageType('error');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/apple-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headless: true,
          timeout: 30000
        }),
      });

      const data = await response.json();

      if (data.success && data.isAuthenticated) {
        setStatus({
          isAuthenticated: true,
          sessionId: data.sessionId,
          email: data.email,
          lastLogin: data.lastLogin,
          expiresAt: data.expiresAt
        });
        setMessage('Autenticación Apple completada exitosamente');
        setMessageType('success');
      } else if (data.requires2FA) {
        setShowTwoFactor(true);
        setTwoFactorToken(data.twoFactorToken || '');
        setMessage('Se requiere código de verificación de dos factores');
        setMessageType('info');
      } else {
        setMessage(data.error || 'Error en autenticación Apple');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error during Apple login:', error);
      setMessage('Error durante el login');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactor = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setMessage('El código debe tener 6 dígitos');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/apple-auth/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: twoFactorCode,
          token: twoFactorToken
        }),
      });

      const data = await response.json();

      if (data.success && data.isAuthenticated) {
        setStatus({
          isAuthenticated: true,
          sessionId: data.sessionId,
          email: data.email,
          lastLogin: data.lastLogin,
          expiresAt: data.expiresAt
        });
        setShowTwoFactor(false);
        setTwoFactorCode('');
        setMessage('Autenticación de dos factores completada');
        setMessageType('success');
      } else {
        setMessage(data.error || 'Código 2FA inválido');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error during 2FA:', error);
      setMessage('Error procesando código 2FA');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/apple-auth/session', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ isAuthenticated: false });
        setShowTwoFactor(false);
        setTwoFactorCode('');
        setMessage('Sesión Apple cerrada correctamente');
        setMessageType('success');
      } else {
        setMessage(data.message || 'Error cerrando sesión');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setMessage('Error cerrando sesión');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusBadge = () => {
    if (status.isAuthenticated) {
      return <span style={{color: 'green'}}>🍎 Autenticado</span>;
    } else if (status.requiresReauth) {
      return <span style={{color: 'orange'}}>⏰ Requiere Auth</span>;
    } else {
      return <span style={{color: 'red'}}>❌ No Autenticado</span>;
    }
  };

  return (
    <div style={{padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9'}}>
      <h3 style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
        🍎 Autenticación Apple
        {getStatusBadge()}
      </h3>

      {/* Mensaje de estado */}
      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          backgroundColor: messageType === 'success' ? '#d4edda' : messageType === 'error' ? '#f8d7da' : '#d1ecf1',
          color: messageType === 'success' ? '#155724' : messageType === 'error' ? '#721c24' : '#0c5460',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : messageType === 'error' ? '#f5c6cb' : '#bee5eb'}`
        }}>
          {message}
          <button 
            onClick={() => setMessage('')}
            style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer'}}
          >
            ✕
          </button>
        </div>
      )}

      {/* Información de sesión */}
      {status.isAuthenticated && (
        <div style={{padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px', marginBottom: '15px'}}>
          <div style={{marginBottom: '10px', fontWeight: 'bold'}}>🛡️ Sesión Activa</div>
          <div style={{fontSize: '14px', color: '#666'}}>
            <div><strong>Email:</strong> {status.email}</div>
            <div><strong>Último login:</strong> {formatDate(status.lastLogin)}</div>
            <div><strong>Expira:</strong> {formatDate(status.expiresAt)}</div>
            <div><strong>Session ID:</strong> {status.sessionId?.substring(0, 20)}...</div>
          </div>
        </div>
      )}

      {/* Formulario 2FA */}
      {showTwoFactor && (
        <div style={{padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '15px'}}>
          <div style={{marginBottom: '10px', fontWeight: 'bold'}}>🔐 Código de Verificación</div>
          <p style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>
            Ingresa el código de 6 dígitos enviado a tu dispositivo Apple
          </p>
          <div style={{display: 'flex', gap: '10px'}}>
            <input
              type="text"
              placeholder="123456"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              maxLength={6}
              style={{
                padding: '8px',
                textAlign: 'center',
                fontSize: '18px',
                letterSpacing: '0.2em',
                border: '1px solid #ccc',
                borderRadius: '4px',
                flex: 1
              }}
            />
            <button 
              onClick={handleTwoFactor}
              disabled={loading || twoFactorCode.length !== 6}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || twoFactorCode.length !== 6 ? 'not-allowed' : 'pointer',
                opacity: loading || twoFactorCode.length !== 6 ? 0.6 : 1
              }}
            >
              {loading ? '⏳' : 'Verificar'}
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
        {!status.isAuthenticated ? (
          <button 
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? '⏳' : '🍎'} Iniciar Sesión Apple
          </button>
        ) : (
          <button 
            onClick={handleLogout}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? '⏳' : '🔓'} Cerrar Sesión
          </button>
        )}
        
        <button 
          onClick={checkAuthStatus}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Información adicional */}
      <div style={{
        fontSize: '12px',
        color: '#666',
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        <p><strong>Nota:</strong> Esta autenticación permite acceder a ofertas premium y exclusivas de Apple.</p>
        <p>Las credenciales se toman automáticamente del archivo .env (Apple_user, apple_passw).</p>
      </div>
    </div>
  );
};
