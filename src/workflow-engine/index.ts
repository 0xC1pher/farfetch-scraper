import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { Orchestrator } from '../orchestrator/orchestrator';
import { ProxyManager } from '../proxy-manager/index';

export interface WorkflowStep {
  name: string;
  action: string;
  params?: Record<string, any>;
  condition?: string;
  retry?: {
    attempts: number;
    delay: number;
  };
  timeout?: number;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  version: string;
  triggers?: string[];
  variables?: Record<string, any>;
  steps: WorkflowStep[];
}

export interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStep?: number;
  results: Record<string, any>;
  errors: string[];
  logs: string[];
}

export class WorkflowEngine {
  private orchestrator: Orchestrator;
  private proxyManager: ProxyManager;
  private executions: Map<string, WorkflowExecution> = new Map();

  private constructor() {
    // Inicializar el ProxyManager con opciones válidas
    this.proxyManager = new ProxyManager({
      rotationStrategy: 'round-robin',
      maxRetries: 3,
      requestTimeout: 30000,
      maxConcurrentRequests: 10,
      blacklist: []
    });
    
    // Inicializamos el orquestador como null por ahora
    this.orchestrator = null as unknown as Orchestrator;
  }

  /**
   * Método de fábrica para crear una instancia del motor de workflows
   */
  static async create(): Promise<WorkflowEngine> {
    const engine = new WorkflowEngine();
    // Inicializar el orquestador de forma asíncrona
    engine.orchestrator = await Orchestrator.create();
    return engine;
  }

  /**
   * Cargar workflow desde archivo YAML
   */
  async loadWorkflow(workflowPath: string): Promise<WorkflowDefinition> {
    try {
      const fullPath = join(process.cwd(), 'workflows', workflowPath);
      const content = readFileSync(fullPath, 'utf8');
      const workflow = yaml.load(content) as WorkflowDefinition;
      
      this.validateWorkflow(workflow);
      return workflow;
    } catch (error) {
      throw new Error(`Failed to load workflow ${workflowPath}: ${error}`);
    }
  }

  /**
   * Ejecutar workflow
   */
  async executeWorkflow(
    workflowName: string, 
    params: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cargar definición del workflow
    const workflow = await this.loadWorkflow(`${workflowName}.yaml`);
    
    // Crear ejecución
    const execution: WorkflowExecution = {
      id: executionId,
      workflowName,
      status: 'running',
      startTime: new Date(),
      currentStep: 0,
      results: { ...params },
      errors: [],
      logs: []
    };

    this.executions.set(executionId, execution);
    this.log(execution, `🚀 Starting workflow: ${workflow.name}`);

    try {
      // Ejecutar pasos secuencialmente
      for (let i = 0; i < workflow.steps.length; i++) {
        execution.currentStep = i;
        const step = workflow.steps[i];
        
        this.log(execution, `📋 Executing step ${i + 1}/${workflow.steps.length}: ${step.name}`);
        
        // Verificar condición si existe
        if (step.condition && !this.evaluateCondition(step.condition, execution.results)) {
          this.log(execution, `⏭️ Skipping step ${step.name} - condition not met`);
          continue;
        }

        // Ejecutar paso con reintentos
        await this.executeStepWithRetry(execution, step);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      this.log(execution, `✅ Workflow completed successfully`);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      execution.errors.push(errorMsg);
      this.log(execution, `❌ Workflow failed: ${errorMsg}`);
    }

    return execution;
  }

  /**
   * Obtener estado de ejecución
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Listar todas las ejecuciones
   */
  listExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Cancelar ejecución
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      this.log(execution, `🛑 Workflow cancelled`);
      return true;
    }
    return false;
  }

  /**
   * Ejecutar paso individual con reintentos
   */
  private async executeStepWithRetry(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const maxAttempts = step.retry?.attempts || 1;
    const retryDelay = step.retry?.delay || 1000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          this.log(execution, `🔄 Retry attempt ${attempt}/${maxAttempts} for step: ${step.name}`);
          await this.delay(retryDelay * attempt);
        }

        // Ejecutar con timeout si está configurado
        if (step.timeout) {
          await Promise.race([
            this.executeStep(execution, step),
            this.timeoutPromise(step.timeout)
          ]);
        } else {
          await this.executeStep(execution, step);
        }

        this.log(execution, `✅ Step completed: ${step.name}`);
        return;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        this.log(execution, `❌ Step failed (attempt ${attempt}): ${errorMsg}`);
        
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }
  }

  /**
   * Ejecutar paso individual
   */
  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const params = this.resolveParams(step.params || {}, execution.results);
    
    switch (step.action) {
      case 'auth.login':
        await this.executeAuthLogin(execution, params);
        break;
        
      case 'scraping.scrape':
        await this.executeScraping(execution, params);
        break;
        
      case 'proxy.rotate':
        await this.executeProxyRotation(execution, params);
        break;
        
      case 'data.filter':
        await this.executeDataFilter(execution, params);
        break;
        
      case 'data.save':
        await this.executeDataSave(execution, params);
        break;
        
      case 'delay':
        await this.executeDelay(execution, params);
        break;
        
      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  /**
   * Acciones específicas
   */
  private async executeAuthLogin(execution: WorkflowExecution, params: any): Promise<void> {
    const { email, password, fingerprintLevel = 'medium' } = params;
    
    if (!email || !password) {
      throw new Error('Email and password are required for auth.login');
    }

    const session = await this.orchestrator.ensureSession({
      email,
      password,
      loginIfNeeded: true,
      fingerprintLevel,
      persistSession: true
    });

    execution.results.sessionId = session.sessionId;
    execution.results.session = session;
  }

  private async executeScraping(execution: WorkflowExecution, params: any): Promise<void> {
    const { url, sessionId, maxRetries = 3 } = params;
    
    if (!url) {
      throw new Error('URL is required for scraping.scrape');
    }

    const finalSessionId = sessionId || execution.results.sessionId;
    if (!finalSessionId) {
      throw new Error('SessionId is required for scraping');
    }

    const offers = await this.orchestrator.scrapeWithSession({
      sessionId: finalSessionId,
      scrapeUrl: url,
      maxRetries
    });

    execution.results.offers = offers;
    execution.results.totalOffers = offers.length;
  }

  private async executeProxyRotation(execution: WorkflowExecution, params: any): Promise<void> {
    const proxy = await this.proxyManager.getNextProxy();
    execution.results.currentProxy = proxy;
    this.log(execution, `🔄 Rotated to proxy: ${proxy?.host}:${proxy?.port}`);
  }

  private async executeDataFilter(execution: WorkflowExecution, params: any): Promise<void> {
    const { source = 'offers', filters } = params;
    const data = execution.results[source];
    
    if (!Array.isArray(data)) {
      throw new Error(`Data source '${source}' is not an array`);
    }

    let filteredData = data;
    
    if (filters) {
      filteredData = data.filter(item => {
        if (filters.minPrice && item.price < filters.minPrice) return false;
        if (filters.maxPrice && item.price > filters.maxPrice) return false;
        if (filters.brand && !item.brand?.toLowerCase().includes(filters.brand.toLowerCase())) return false;
        return true;
      });
    }

    execution.results[`${source}_filtered`] = filteredData;
    execution.results.filteredCount = filteredData.length;
  }

  private async executeDataSave(execution: WorkflowExecution, params: any): Promise<void> {
    const { source = 'offers', format = 'json' } = params;
    const data = execution.results[source];
    
    // En este caso, los datos ya se guardan automáticamente en MinIO
    // por el orquestador, pero podríamos agregar lógica adicional aquí
    this.log(execution, `💾 Data saved: ${Array.isArray(data) ? data.length : 1} items`);
  }

  private async executeDelay(execution: WorkflowExecution, params: any): Promise<void> {
    const { duration = 1000 } = params;
    await this.delay(duration);
    this.log(execution, `⏱️ Delayed for ${duration}ms`);
  }

  /**
   * Utilidades
   */
  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.name || !workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('Invalid workflow format');
    }

    for (const step of workflow.steps) {
      if (!step.name || !step.action) {
        throw new Error('Each step must have name and action');
      }
    }
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Implementación básica de evaluación de condiciones
    // En producción, usar una librería más robusta
    try {
      const func = new Function('context', `with(context) { return ${condition}; }`);
      return !!func(context);
    } catch {
      return false;
    }
  }

  private resolveParams(params: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        resolved[key] = context[varName] || value;
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  private timeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Step timeout after ${timeout}ms`)), timeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(execution: WorkflowExecution, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    execution.logs.push(logEntry);
    console.log(`[Workflow ${execution.id}] ${message}`);
  }
}

// Variable para almacenar la instancia singleton
let workflowEngineInstance: WorkflowEngine | null = null;

/**
 * Obtener la instancia singleton del motor de workflows
 */
export async function getWorkflowEngine(): Promise<WorkflowEngine> {
  if (!workflowEngineInstance) {
    workflowEngineInstance = await WorkflowEngine.create();
  }
  return workflowEngineInstance;
}

// Para compatibilidad con código existente
// Nota: Las importaciones que usen workflowEngine directamente necesitarán ser actualizadas
// para usar getWorkflowEngine() de forma asíncrona
export const workflowEngine = {
  // Métodos que necesiten ser accesibles estáticamente
  // Nota: Los métodos que requieran el orquestador necesitarán ser actualizados
  // para usar getWorkflowEngine()
  getExecution: (executionId: string) => {
    if (!workflowEngineInstance) {
      throw new Error('WorkflowEngine no ha sido inicializado. Usa getWorkflowEngine() primero.');
    }
    return workflowEngineInstance.getExecution(executionId);
  },
  listExecutions: () => {
    if (!workflowEngineInstance) {
      throw new Error('WorkflowEngine no ha sido inicializado. Usa getWorkflowEngine() primero.');
    }
    return workflowEngineInstance.listExecutions();
  }
} as const;
