import { NativeMessage, NativeMessageType } from './types';

export const TOOL_NAMES = {
  DYNAMIC_LOADING: {
    WAIT_FOR_DYNAMIC_CONTENT: 'chrome_wait_for_dynamic_content',
  },
};

export const DYNAMIC_LOADING_TOOLS = [
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      name: TOOL_NAMES.DYNAMIC_LOADING.WAIT_FOR_DYNAMIC_CONTENT,
      description: 'Wait for dynamic content to load completely, including JS execution and network requests',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element to wait for (optional, if waiting for specific content)',
          },
          timeout: {
            type: 'number',
            description: 'Maximum time to wait in milliseconds (default: 30000)',
            default: 30000,
          },
          networkIdleTimeout: {
            type: 'number',
            description: 'Time to wait after network becomes idle (default: 5000)',
            default: 5000,
          },
          scroll: {
            type: 'boolean',
            description: 'Whether to perform scroll actions to trigger lazy loading (default: true)',
            default: true,
          },
          click: {
            type: 'boolean',
            description: 'Whether to perform click actions on load more buttons (default: true)',
            default: true,
          },
          validateImages: {
            type: 'boolean',
            description: 'Whether to validate that images are real and not placeholders (default: true)',
            default: true,
          },
        },
        required: []
      }
    }
  }
];
