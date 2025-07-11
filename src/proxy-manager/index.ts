// Re-exportaciones principales
export { ProxyManager } from './core/manager';
export { BaseProxyProvider } from './providers/base';
export { ProxyScrapeProvider } from './providers/proxyscrape';

// Strategies
export { RoundRobinStrategy } from './core/strategies/round-robin';
export { RandomStrategy } from './core/strategies/random';
export { WeightedStrategy } from './core/strategies/weighted';

// Tipos
export type {
  ProxyConfig,
  ProxyStats,
  ProxyValidationResult,
  ProxyRotationStrategy,
  ProxyProvider,
  ProxyManagerOptions
} from './types/index';
