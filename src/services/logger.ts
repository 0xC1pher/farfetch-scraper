import { EventEmitter } from 'events';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  module: string;
  message: string;
  details?: any;
}

export type LogLevel = LogEntry['level'];

class LoggerService extends EventEmitter {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private logId: number = 0;

  constructor() {
    super();
    this.setMaxListeners(50); // Permitir más listeners
  }

  private generateId(): string {
    return `log_${++this.logId}_${Date.now()}`;
  }

  private createLogEntry(level: LogLevel, module: string, message: string, details?: any): LogEntry {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Emitir evento para listeners en tiempo real
    this.emit('newLog', entry);
    this.emit('logsUpdated', this.logs);

    // También log a consola para debugging
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelEmoji = this.getLevelEmoji(entry.level);
    console.log(`${levelEmoji} [${timestamp}] [${entry.module}] ${entry.message}`);
    
    if (entry.details) {
      console.log('   Details:', entry.details);
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🐛';
      case 'success': return '✅';
      default: return '📝';
    }
  }

  // Métodos públicos para logging
  info(module: string, message: string, details?: any): void {
    this.addLog(this.createLogEntry('info', module, message, details));
  }

  warn(module: string, message: string, details?: any): void {
    this.addLog(this.createLogEntry('warn', module, message, details));
  }

  error(module: string, message: string, details?: any): void {
    this.addLog(this.createLogEntry('error', module, message, details));
  }

  debug(module: string, message: string, details?: any): void {
    this.addLog(this.createLogEntry('debug', module, message, details));
  }

  success(module: string, message: string, details?: any): void {
    this.addLog(this.createLogEntry('success', module, message, details));
  }

  // Métodos para obtener logs
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByModule(module: string): LogEntry[] {
    return this.logs.filter(log => log.module === module);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Filtrar logs
  filterLogs(filter: {
    module?: string;
    level?: LogLevel;
    search?: string;
    since?: Date;
  }): LogEntry[] {
    return this.logs.filter(log => {
      if (filter.module && log.module !== filter.module) return false;
      if (filter.level && log.level !== filter.level) return false;
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.since && new Date(log.timestamp) < filter.since) return false;
      return true;
    });
  }

  // Limpiar logs
  clearLogs(): void {
    this.logs = [];
    this.emit('logsCleared');
    this.emit('logsUpdated', this.logs);
  }

  // Exportar logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      const headers = 'Timestamp,Level,Module,Message,Details\n';
      const rows = this.logs.map(log => 
        `"${log.timestamp}","${log.level}","${log.module}","${log.message}","${log.details ? JSON.stringify(log.details) : ''}"`
      ).join('\n');
      return headers + rows;
    }
  }

  // Estadísticas
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byModule: Record<string, number>;
    lastHour: number;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const byLevel: Record<LogLevel, number> = {
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
      success: 0
    };

    const byModule: Record<string, number> = {};
    let lastHour = 0;

    this.logs.forEach(log => {
      byLevel[log.level]++;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
      
      if (new Date(log.timestamp) > oneHourAgo) {
        lastHour++;
      }
    });

    return {
      total: this.logs.length,
      byLevel,
      byModule,
      lastHour
    };
  }
}

// Instancia singleton
export const logger = new LoggerService();

// Función helper para logging rápido
export const log = {
  info: (module: string, message: string, details?: any) => logger.info(module, message, details),
  warn: (module: string, message: string, details?: any) => logger.warn(module, message, details),
  error: (module: string, message: string, details?: any) => logger.error(module, message, details),
  debug: (module: string, message: string, details?: any) => logger.debug(module, message, details),
  success: (module: string, message: string, details?: any) => logger.success(module, message, details),
};

export default logger;
