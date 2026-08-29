import type { HealthResponse } from '../types/api';
import type { WorkbenchRequest, WorkbenchResponse } from '../types/workbench';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async checkHealth(): Promise<{ data: HealthResponse; latencyMs: number }> {
    const startTime = performance.now();
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: HealthResponse = await response.json();
    return { data, latencyMs };
  }

  async dispatchHttpRequest(req: WorkbenchRequest): Promise<WorkbenchResponse> {
    // Build headers map
    const headersMap: Record<string, string> = {};
    req.headers
      .filter((h) => h.enabled && h.key.trim() !== '')
      .forEach((h) => {
        headersMap[h.key.trim()] = h.value;
      });

    // Build query params map
    const paramsMap: Record<string, string> = {};
    req.params
      .filter((p) => p.enabled && p.key.trim() !== '')
      .forEach((p) => {
        paramsMap[p.key.trim()] = p.value;
      });

    const payload = {
      method: req.method,
      url: req.url,
      headers: headersMap,
      params: paramsMap,
      body: req.bodyType !== 'none' ? req.body : null,
      body_type: req.bodyType,
      timeout_seconds: req.timeoutSeconds || 30.0,
    };

    const response = await fetch(`${this.baseUrl}/requests/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || errorJson.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
    }

    const result = await response.json();
    return {
      statusCode: result.status_code,
      statusText: result.status_text,
      headers: result.headers || {},
      data: result.data,
      isJson: result.is_json,
      sizeBytes: result.size_bytes,
      elapsedMs: result.elapsed_ms,
      error: result.error,
    };
  }
}

export const api = new ApiClient();
