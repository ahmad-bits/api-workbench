import type { HealthResponse } from '../types/api';
import type {
  WorkbenchRequest,
  WorkbenchResponse,
  BatchWorkbenchResponse,
  BenchmarkStats,
  StatusCodeStat,
} from '../types/workbench';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private buildPayload(req: WorkbenchRequest) {
    const headersMap: Record<string, string> = {};
    req.headers
      .filter((h) => h.enabled && h.key.trim() !== '')
      .forEach((h) => {
        headersMap[h.key.trim()] = h.value;
      });

    const paramsMap: Record<string, string> = {};
    req.params
      .filter((p) => p.enabled && p.key.trim() !== '')
      .forEach((p) => {
        paramsMap[p.key.trim()] = p.value;
      });

    return {
      method: req.method,
      url: req.url,
      headers: headersMap,
      params: paramsMap,
      body: req.bodyType !== 'none' ? req.body : null,
      body_type: req.bodyType,
      timeout_seconds: req.timeoutSeconds || 30.0,
      request_count: Math.min(100, Math.max(1, req.requestCount || 1)),
    };
  }

  private formatResponse(result: any): WorkbenchResponse {
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
    const payload = this.buildPayload(req);

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
    return this.formatResponse(result);
  }

  async dispatchBenchmarkRequest(req: WorkbenchRequest): Promise<BatchWorkbenchResponse> {
    const payload = this.buildPayload(req);

    const response = await fetch(`${this.baseUrl}/requests/benchmark`, {
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

    const rawStats = result.stats || {};
    const statusCodesList: StatusCodeStat[] = (rawStats.status_codes || []).map((s: any) => ({
      statusCode: s.status_code,
      statusText: s.status_text,
      count: s.count,
      percentage: s.percentage,
    }));

    const stats: BenchmarkStats = {
      totalRequests: rawStats.total_requests || 0,
      successfulRequests: rawStats.successful_requests || 0,
      failedRequests: rawStats.failed_requests || 0,
      successRate: rawStats.success_rate || 0,
      avgLatencyMs: rawStats.avg_latency_ms || 0,
      minLatencyMs: rawStats.min_latency_ms || 0,
      maxLatencyMs: rawStats.max_latency_ms || 0,
      statusCodeDistribution: rawStats.status_code_distribution || {},
      statusCodes: statusCodesList,
    };

    const results: WorkbenchResponse[] = (result.results || []).map((r: any) => this.formatResponse(r));
    const latestResponse: WorkbenchResponse = result.latest_response
      ? this.formatResponse(result.latest_response)
      : results[results.length - 1] || {
          statusCode: 0,
          statusText: 'No response',
          headers: {},
          data: null,
          isJson: false,
          sizeBytes: 0,
          elapsedMs: 0,
        };

    return {
      stats,
      results,
      latestResponse,
    };
  }
}

export const api = new ApiClient();

