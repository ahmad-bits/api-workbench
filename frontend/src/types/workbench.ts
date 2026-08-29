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
  requestCount?: number;
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

export interface StatusCodeStat {
  statusCode: number;
  statusText: string;
  count: number;
  percentage: number;
}

export interface BenchmarkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  statusCodeDistribution: Record<number, number>;
  statusCodes: StatusCodeStat[];
}

export interface BatchWorkbenchResponse {
  stats: BenchmarkStats;
  results: WorkbenchResponse[];
  latestResponse: WorkbenchResponse;
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
  requestCount?: number;
}

