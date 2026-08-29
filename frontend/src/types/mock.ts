import type { HttpMethod } from './workbench';

export interface MockEndpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  responseType: 'json' | 'text';
  description?: string | null;
  mockUrl: string;
  fullUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  callCount: number;
}

export interface MockEndpointCreate {
  name?: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  responseHeaders?: Record<string, string>;
  responseBody: string;
  responseType?: 'json' | 'text';
  description?: string;
}

export interface MockEndpointUpdate {
  name?: string;
  method?: HttpMethod;
  path?: string;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  responseType?: 'json' | 'text';
  description?: string;
}

export interface MockHeaderRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}
