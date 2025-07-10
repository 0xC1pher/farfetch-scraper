// Re-exportaciones principales
export { ProxyManager } from './core/manager.js';
export { BaseProxyProvider } from './providers/base.js';
export { ProxyScrapeProvider } from './providers/proxyscrape.js';

// Strategies
export { RoundRobinStrategy } from './core/strategies/round-robin.js';
export { RandomStrategy } from './core/strategies/random.js';
export { WeightedStrategy } from './core/strategies/weighted.js';

// Tipos
export type {
  ProxyConfig,
  ProxyStats,
  ProxyValidationResult,
  ProxyRotationStrategy,
  ProxyProvider,
  ProxyManagerOptions
} from './types/index.js';
