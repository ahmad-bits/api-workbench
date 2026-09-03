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
  initialResourceData?: string | null;
  currentResourceData?: string | null;
  mockUrl: string;
  fullUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  callCount: number;
  historyCount?: number;
}

export interface MockRequestHistoryItem {
  id: string;
  mockId: string;
  body: string;
  createdAt: string;
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
  initialResourceData?: string;
  currentResourceData?: string;
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
  initialResourceData?: string;
  currentResourceData?: string;
}

export interface MockHeaderRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}
