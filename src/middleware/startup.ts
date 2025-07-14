import { NextRequest, NextResponse } from 'next/server';
import StartupManager from '../modules/startup';

let initializationPromise: Promise<any> | null = null;
let isInitialized = false;

/**
 * Middleware de inicialización automática del sistema
 */
export async function startupMiddleware(request: NextRequest) {
  // Solo ejecutar en desarrollo y una sola vez
  if (process.env.NODE_ENV !== 'development' || isInitialized) {
    return NextResponse.next();
  }

  // Si ya hay una inicialización en progreso, esperar a que termine
  if (initializationPromise) {
    await initializationPromise;
    return NextResponse.next();
  }

  // Iniciar la inicialización
  initializationPromise = initializeSystem();
  
  try {
    await initializationPromise;
    isInitialized = true;
  } catch (error) {
    console.error('❌ Error en inicialización automática:', error);
  }

  return NextResponse.next();
}

async function initializeSystem() {
  console.log('🚀 Iniciando sistema automáticamente...');
  
  try {
    const startup = new StartupManager();
    const result = await startup.initialize();
    
    if (result.success) {
      console.log('✅ Sistema inicializado correctamente');
    } else {
      console.log('⚠️ Sistema inicializado con errores:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('💥 Error crítico en inicialización:', error);
    throw error;
  }
}

/**
 * API para obtener el estado de inicialización
 */
export function getInitializationStatus() {
  return {
    isInitialized,
    isInitializing: initializationPromise !== null && !isInitialized
  };
}
