export interface ScriptData {
  type: string;
  selector: string;
  data: any;
}

export interface XHRRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface XHRResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  data: any;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  images: string[];
  price: number;
  model: string;
}

export interface ProductValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
