import type { HttpMethod } from './workbench';

export type MockAuthType = 'none' | 'api_key' | 'bearer';

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
  authType?: MockAuthType;
  authHeaderName?: string;
  authHeaderValue?: string;
  authToken?: string;
  delayMs?: number;
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
  authType?: MockAuthType;
  authHeaderName?: string;
  authHeaderValue?: string;
  authToken?: string;
  delayMs?: number;
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
  authType?: MockAuthType;
  authHeaderName?: string;
  authHeaderValue?: string;
  authToken?: string;
  delayMs?: number;
}

export interface MockHeaderRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}
