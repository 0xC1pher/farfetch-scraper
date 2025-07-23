import { NativeMessage, NativeMessageType } from './types';

export const TOOL_NAMES = {
  DYNAMIC_EXTRACTION: {
    EXTRACT_SCRIPT_DATA: 'chrome_extract_script_data',
    ANALYZE_XHR: 'chrome_analyze_xhr',
    VALIDATE_PRODUCTS: 'chrome_validate_products',
  },
};

export const DYNAMIC_EXTRACTION_TOOLS: NativeMessage<Record<string, any>>[] = [
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      toolName: TOOL_NAMES.DYNAMIC_EXTRACTION.EXTRACT_SCRIPT_DATA,
      toolDescription: 'Extract data from embedded scripts and JSON objects in the page',
      toolInputSchema: {
        type: 'object',
        properties: {
          scriptTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Types of script elements to extract data from',
          },
          selectors: {
            type: 'array',
            items: { type: 'string' },
            description: 'CSS selectors for script elements to extract data from',
          },
          validateData: {
            type: 'boolean',
            description: 'Validate extracted data against expected schema',
            default: true,
          },
        },
        required: ['scriptTypes'],
      },
    },
  },
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      toolName: TOOL_NAMES.DYNAMIC_EXTRACTION.ANALYZE_XHR,
      toolDescription: 'Analyze XHR requests and responses for product data',
      toolInputSchema: {
        type: 'object',
        properties: {
          endpoints: {
            type: 'array',
            items: { type: 'string' },
            description: 'API endpoints to monitor for product data',
          },
          validateResponses: {
            type: 'boolean',
            description: 'Validate XHR responses against expected schema',
            default: true,
          },
          timeout: {
            type: 'number',
            description: 'Maximum time to wait for XHR responses in milliseconds',
            default: 10000,
          },
        },
        required: ['endpoints'],
      },
    },
  },
  {
    type: NativeMessageType.CALL_TOOL,
    payload: {
      toolName: TOOL_NAMES.DYNAMIC_EXTRACTION.VALIDATE_PRODUCTS,
      toolDescription: 'Validate extracted products against schema and duplicates',
      toolInputSchema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: { type: 'object' },
            description: 'Array of products to validate',
          },
          validateImages: {
            type: 'boolean',
            description: 'Validate that product images are real and not placeholders',
            default: true,
          },
          checkDuplicates: {
            type: 'boolean',
            description: 'Check for duplicate products by model',
            default: true,
          },
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Allowed product categories (woman, men, kids)',
            default: ['woman', 'men', 'kids'],
          },
        },
        validateImages: {
          type: 'boolean',
          description: 'Validate that product images are real and not placeholders',
          default: true,
        },
        checkDuplicates: {
          type: 'boolean',
          description: 'Check for duplicate products by model',
          default: true,
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed product categories (woman, men, kids)',
          default: ['woman', 'men', 'kids'],
        },
      },
      required: ['products'],
    },
  },
];
