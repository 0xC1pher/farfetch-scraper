import { NativeMessage, NativeMessageType } from './types';
import { ScriptData, XHRRequest, XHRResponse } from './types/dynamic-extraction';

export const TOOL_NAMES = {
  DYNAMIC_OPTIMIZATION: {
    OPTIMIZE_RESOURCES: 'chrome_optimize_resources',
    ANALYZE_LOAD_PATTERNS: 'chrome_analyze_load_patterns',
    DETECT_CONTENT: 'chrome_detect_content_changes',
    ANALYZE_NETWORK: 'chrome_advanced_network_analysis'
  }
};

export const DYNAMIC_OPTIMIZATION_TOOLS: NativeMessage<Record<string, any>>[] = [
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      toolName: TOOL_NAMES.DYNAMIC_OPTIMIZATION.OPTIMIZE_RESOURCES,
      toolDescription: 'Optimiza la carga de recursos dinámicos',
      toolInputSchema: {
        type: 'object',
        properties: {
          blockResources: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['image', 'media', 'font', 'stylesheet', 'script']
            },
            description: 'Recursos a bloquear para optimizar carga'
          },
          prioritizeResources: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['xhr', 'fetch', 'script']
            },
            description: 'Recursos a priorizar'
          },
          resourceTimeouts: {
            type: 'object',
            properties: {
              script: { type: 'number', description: 'Timeout para scripts' },
              xhr: { type: 'number', description: 'Timeout para XHR' },
              fetch: { type: 'number', description: 'Timeout para fetch' }
            }
          },
          required: ['blockResources']
        }
      }
    }
  },
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      toolName: TOOL_NAMES.DYNAMIC_OPTIMIZATION.ANALYZE_LOAD_PATTERNS,
      toolDescription: 'Analiza patrones de carga dinámica',
      toolInputSchema: {
        type: 'object',
        properties: {
          eventPatterns: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['scroll', 'click', 'resize', 'load']
            }
          },
          timingPatterns: {
            type: 'object',
            properties: {
              minDelay: { type: 'number', description: 'Retraso mínimo entre eventos' },
              maxDelay: { type: 'number', description: 'Retraso máximo entre eventos' }
            }
          },
          interactionPatterns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', description: 'Tipo de interacción' },
                selector: { type: 'string', description: 'Selector del elemento' },
                action: { type: 'string', description: 'Acción a realizar' }
              }
            }
          }
        }
      }
    }
  },
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      toolName: TOOL_NAMES.DYNAMIC_OPTIMIZATION.DETECT_CONTENT,
      toolDescription: 'Detecta cambios en el contenido dinámico',
      toolInputSchema: {
        type: 'object',
        properties: {
          contentSelectors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Selectores de contenido a monitorear'
          },
          changeThreshold: {
            type: 'number',
            description: 'Umbral de cambios detectados'
          },
          validationRules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                selector: { type: 'string' },
                condition: { type: 'string' },
                value: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      toolName: TOOL_NAMES.DYNAMIC_OPTIMIZATION.ANALYZE_NETWORK,
      toolDescription: 'Analiza patrones de red avanzados',
      toolInputSchema: {
        type: 'object',
        properties: {
          endpointPatterns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                urlPattern: { type: 'string' },
                method: { type: 'string' },
                contentType: { type: 'string' }
              }
            }
          },
          responseAnalysis: {
            type: 'object',
            properties: {
              jsonPathPatterns: { type: 'array', items: { type: 'string' } },
              regexPatterns: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  }
];
