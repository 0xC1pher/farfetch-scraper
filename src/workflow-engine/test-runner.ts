#!/usr/bin/env node

import { workflowEngine } from './index';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Test runner para workflows
 */
class WorkflowTestRunner {
  
  async runTests(): Promise<void> {
    console.log('🧪 Iniciando pruebas de workflows...\n');

    const tests = [
      {
        name: 'Proxy Rotation Workflow',
        workflow: 'proxy-rotation',
        params: { rotationCount: 3, delayBetweenRotations: 1000 }
      },
      {
        name: 'Monitoring Workflow',
        workflow: 'monitoring',
        params: { checkInterval: 5000, maxChecks: 2 }
      }
    ];

    // Solo probar auth-flow y scraping-flow si hay credenciales
    const hasCredentials = process.env.DEFAULT_FARFETCH_EMAIL && process.env.DEFAULT_FARFETCH_PASSWORD;
    
    if (hasCredentials) {
      tests.push(
        {
          name: 'Authentication Workflow',
          workflow: 'auth-flow',
          params: {
            email: process.env.DEFAULT_FARFETCH_EMAIL,
            password: process.env.DEFAULT_FARFETCH_PASSWORD,
            fingerprintLevel: 'low'
          }
        },
        {
          name: 'Scraping Workflow',
          workflow: 'scraping-flow',
          params: {
            email: process.env.DEFAULT_FARFETCH_EMAIL,
            password: process.env.DEFAULT_FARFETCH_PASSWORD,
            scrapeUrl: 'https://www.farfetch.com/shopping/women/items.aspx',
            maxRetries: 1,
            filters: { maxPrice: 200 }
          }
        }
      );
    } else {
      console.log('⚠️ Credenciales no configuradas - saltando pruebas de auth y scraping');
    }

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`🔄 Ejecutando: ${test.name}`);
        
        const execution = await workflowEngine.executeWorkflow(test.workflow, test.params);
        
        // Esperar a que termine
        await this.waitForCompletion(execution.id, 60000);
        
        const finalExecution = workflowEngine.getExecution(execution.id);
        
        if (finalExecution?.status === 'completed') {
          console.log(`✅ ${test.name} - PASÓ`);
          console.log(`   Duración: ${this.getDuration(finalExecution)}`);
          console.log(`   Resultados: ${Object.keys(finalExecution.results).length} elementos`);
          passed++;
        } else {
          console.log(`❌ ${test.name} - FALLÓ`);
          console.log(`   Estado: ${finalExecution?.status}`);
          console.log(`   Errores: ${finalExecution?.errors.join(', ')}`);
          failed++;
        }
        
      } catch (error) {
        console.log(`❌ ${test.name} - ERROR`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
      
      console.log(''); // Línea en blanco
    }

    // Resumen
    console.log('📊 Resumen de pruebas:');
    console.log(`   ✅ Pasaron: ${passed}`);
    console.log(`   ❌ Fallaron: ${failed}`);
    console.log(`   📈 Tasa de éxito: ${Math.round((passed / (passed + failed)) * 100)}%`);

    if (failed > 0) {
      process.exit(1);
    }
  }

  private async waitForCompletion(executionId: string, maxWait: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const execution = workflowEngine.getExecution(executionId);
      
      if (!execution) break;
      
      if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private getDuration(execution: any): string {
    if (!execution.endTime) return 'En progreso';
    
    const duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
    return `${Math.round(duration / 1000)}s`;
  }

  async listWorkflows(): Promise<void> {
    console.log('📋 Workflows disponibles:\n');
    
    const workflows = ['auth-flow', 'scraping-flow', 'proxy-rotation', 'monitoring'];
    
    for (const workflow of workflows) {
      try {
        const definition = await workflowEngine.loadWorkflow(`${workflow}.yaml`);
        console.log(`🔧 ${definition.name}`);
        console.log(`   Archivo: ${workflow}.yaml`);
        console.log(`   Descripción: ${definition.description}`);
        console.log(`   Pasos: ${definition.steps.length}`);
        console.log('');
      } catch (error) {
        console.log(`❌ ${workflow}.yaml - Error cargando`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log('');
      }
    }
  }

  async runSingleWorkflow(workflowName: string, params: Record<string, any> = {}): Promise<void> {
    console.log(`🚀 Ejecutando workflow: ${workflowName}\n`);
    
    try {
      const execution = await workflowEngine.executeWorkflow(workflowName, params);
      console.log(`📋 Ejecución iniciada: ${execution.id}`);
      console.log(`📊 Estado inicial: ${execution.status}\n`);
      
      // Mostrar progreso en tiempo real
      await this.showProgress(execution.id);
      
    } catch (error) {
      console.error(`❌ Error ejecutando workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  private async showProgress(executionId: string): Promise<void> {
    let lastLogCount = 0;
    
    while (true) {
      const execution = workflowEngine.getExecution(executionId);
      
      if (!execution) break;
      
      // Mostrar nuevos logs
      const newLogs = execution.logs.slice(lastLogCount);
      newLogs.forEach(log => console.log(`📝 ${log}`));
      lastLogCount = execution.logs.length;
      
      // Verificar si terminó
      if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
        console.log(`\n🏁 Workflow terminado: ${execution.status}`);
        
        if (execution.errors.length > 0) {
          console.log(`❌ Errores:`);
          execution.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        console.log(`⏱️ Duración: ${this.getDuration(execution)}`);
        console.log(`📊 Resultados: ${Object.keys(execution.results).length} elementos`);
        
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Función principal
async function main() {
  const runner = new WorkflowTestRunner();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Ejecutar todas las pruebas
    await runner.runTests();
  } else if (args[0] === 'list') {
    // Listar workflows
    await runner.listWorkflows();
  } else if (args[0] === 'run' && args[1]) {
    // Ejecutar workflow específico
    const workflowName = args[1];
    const params = args[2] ? JSON.parse(args[2]) : {};
    await runner.runSingleWorkflow(workflowName, params);
  } else {
    console.log('Uso:');
    console.log('  npm run workflow:test           # Ejecutar todas las pruebas');
    console.log('  npm run workflow:test list      # Listar workflows');
    console.log('  npm run workflow:test run <name> [params]  # Ejecutar workflow específico');
    console.log('');
    console.log('Ejemplos:');
    console.log('  npm run workflow:test run proxy-rotation');
    console.log('  npm run workflow:test run auth-flow \'{"email":"test@test.com","password":"pass"}\'');
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { WorkflowTestRunner };
