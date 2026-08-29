export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type BodyType = 'none' | 'json' | 'text';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface WorkbenchRequest {
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  body: string;
  timeoutSeconds: number;
}

export interface WorkbenchResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  isJson: boolean;
  sizeBytes: number;
  elapsedMs: number;
  error?: string | null;
}

export interface QuickPreset {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers?: KeyValuePair[];
  params?: KeyValuePair[];
  bodyType?: BodyType;
  body?: string;
}
