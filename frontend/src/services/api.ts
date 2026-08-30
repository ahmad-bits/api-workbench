import type { HealthResponse } from '../types/api';
import type {
  WorkbenchRequest,
  WorkbenchResponse,
  BatchWorkbenchResponse,
  BenchmarkStats,
  StatusCodeStat,
} from '../types/workbench';
import type {
  MockEndpoint,
  MockEndpointCreate,
  MockEndpointUpdate,
} from '../types/mock';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  UserProfileUpdateData,
  DeleteAccountResponse,
  OtpInitiateResponse,
  OtpResendResponse,
} from '../types/auth';
import type {
  SavedApi,
  SavedApiCreate,
  SavedApiUpdate,
  SavedApiOpenResponse,
} from '../types/savedApi';


const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authToken = localStorage.getItem('api_workbench_token') || null;
  }

  private async fetchWithHandling(url: string, options?: RequestInit): Promise<Response> {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err: any) {
      if (
        err instanceof TypeError ||
        (err.message && (err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('network')))
      ) {
        throw new Error(
          'Backend server is unreachable (Failed to fetch). Please ensure the FastAPI backend is running on port 8000 (e.g. uvicorn app.main:app --port 8000).'
        );
      }
      throw err;
    }
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('api_workbench_token', token);
    } else {
      localStorage.removeItem('api_workbench_token');
    }
  }

  getAuthToken(): string | null {
    return this.authToken || localStorage.getItem('api_workbench_token') || null;
  }

  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('api_workbench_token');
    localStorage.removeItem('api_workbench_user');
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
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

  private formatMock(m: any): MockEndpoint {
    return {
      id: m.id,
      name: m.name || `${m.method} ${m.path}`,
      method: m.method,
      path: m.path,
      statusCode: m.status_code,
      responseHeaders: m.response_headers || {},
      responseBody: m.response_body || '',
      responseType: m.response_type || 'json',
      description: m.description,
      mockUrl: m.mock_url,
      fullUrl: m.full_url || `http://127.0.0.1:8000${m.mock_url}`,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      callCount: m.call_count || 0,
    };
  }

  async checkHealth(): Promise<{ data: HealthResponse; latencyMs: number }> {
    const startTime = performance.now();
    const response = await this.fetchWithHandling(`${this.baseUrl}/health`, {
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

  // --- Workbench Dispatcher Operations ---

  async dispatchHttpRequest(req: WorkbenchRequest): Promise<WorkbenchResponse> {
    const payload = this.buildPayload(req);

    const response = await this.fetchWithHandling(`${this.baseUrl}/requests/dispatch`, {
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

    const response = await this.fetchWithHandling(`${this.baseUrl}/requests/benchmark`, {
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

  // --- Authenticated User Mock API Operations ---

  async getMocks(): Promise<MockEndpoint[]> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/mocks`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch mock endpoints`);
    }

    const data = await response.json();
    return data.map((m: any) => this.formatMock(m));
  }

  async createMock(data: MockEndpointCreate): Promise<MockEndpoint> {
    const payload = {
      name: data.name,
      method: data.method,
      path: data.path,
      status_code: data.statusCode,
      response_headers: data.responseHeaders || { 'Content-Type': 'application/json' },
      response_body: data.responseBody,
      response_type: data.responseType || 'json',
      description: data.description,
    };

    const response = await this.fetchWithHandling(`${this.baseUrl}/mocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to create mock: HTTP ${response.status}`);
      } catch {
        throw new Error(errorText || `Failed to create mock: HTTP ${response.status}`);
      }
    }

    const result = await response.json();
    return this.formatMock(result);
  }

  async updateMock(id: string, data: MockEndpointUpdate): Promise<MockEndpoint> {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.method !== undefined) payload.method = data.method;
    if (data.path !== undefined) payload.path = data.path;
    if (data.statusCode !== undefined) payload.status_code = data.statusCode;
    if (data.responseHeaders !== undefined) payload.response_headers = data.responseHeaders;
    if (data.responseBody !== undefined) payload.response_body = data.responseBody;
    if (data.responseType !== undefined) payload.response_type = data.responseType;
    if (data.description !== undefined) payload.description = data.description;

    const response = await this.fetchWithHandling(`${this.baseUrl}/mocks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to update mock: HTTP ${response.status}`);
      } catch {
        throw new Error(errorText || `Failed to update mock: HTTP ${response.status}`);
      }
    }

    const result = await response.json();
    return this.formatMock(result);
  }

  async deleteMock(id: string): Promise<{ success: boolean }> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/mocks/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to delete mock endpoint`);
    }

    return { success: true };
  }

  // --- Authentication Operations ---

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username_or_email: credentials.username_or_email.trim(),
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Authentication failed. Please check your credentials.');
      } catch (e: any) {
        if (e.message && e.message !== 'Authentication failed. Please check your credentials.' && !e.message.startsWith('Unexpected')) {
          throw e;
        }
        throw new Error(errorText || `Authentication failed (HTTP ${response.status})`);
      }
    }

    const data: AuthResponse = await response.json();
    this.setAuthToken(data.access_token);
    localStorage.setItem('api_workbench_user', JSON.stringify(data.user));
    return data;
  }

  async requestRegistrationOtp(credentials: RegisterCredentials): Promise<OtpInitiateResponse> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/register/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: credentials.name.trim(),
        username: credentials.username.trim().toLowerCase(),
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to initiate email verification.');
      } catch (e: any) {
        if (e.message && e.message !== 'Failed to initiate email verification.' && !e.message.startsWith('Unexpected')) {
          throw e;
        }
        throw new Error(errorText || `Failed to initiate verification (HTTP ${response.status})`);
      }
    }

    return await response.json();
  }

  async verifyRegistrationOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/register/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Invalid verification code.');
      } catch (e: any) {
        if (e.message && e.message !== 'Invalid verification code.' && !e.message.startsWith('Unexpected')) {
          throw e;
        }
        throw new Error(errorText || `Verification failed (HTTP ${response.status})`);
      }
    }

    const data: AuthResponse = await response.json();
    this.setAuthToken(data.access_token);
    localStorage.setItem('api_workbench_user', JSON.stringify(data.user));
    return data;
  }

  async resendRegistrationOtp(email: string): Promise<OtpResendResponse> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/register/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to resend verification code.');
      } catch (e: any) {
        if (e.message && e.message !== 'Failed to resend verification code.' && !e.message.startsWith('Unexpected')) {
          throw e;
        }
        throw new Error(errorText || `Resend failed (HTTP ${response.status})`);
      }
    }

    return await response.json();
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: credentials.name.trim(),
        username: credentials.username.trim().toLowerCase(),
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Registration failed. Please verify your details.');
      } catch (e: any) {
        if (e.message && e.message !== 'Registration failed. Please verify your details.' && !e.message.startsWith('Unexpected')) {
          throw e;
        }
        throw new Error(errorText || `Registration failed (HTTP ${response.status})`);
      }
    }

    const data: AuthResponse = await response.json();
    this.setAuthToken(data.access_token);
    localStorage.setItem('api_workbench_user', JSON.stringify(data.user));
    return data;
  }

  async getMe(): Promise<User> {

    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuthToken();
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch authenticated user session`);
    }

    const user: User = await response.json();
    localStorage.setItem('api_workbench_user', JSON.stringify(user));
    return user;
  }

  async updateMe(data: UserProfileUpdateData): Promise<User> {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.username !== undefined) payload.username = data.username.trim().toLowerCase();
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
    if (data.current_password !== undefined) payload.current_password = data.current_password;
    if (data.new_password !== undefined) payload.new_password = data.new_password;

    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to update profile: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected') && !e.message.startsWith('Failed to update profile')) {
          throw e;
        }
        throw new Error(errorText || `Failed to update profile: HTTP ${response.status}`);
      }
    }

    const updatedUser: User = await response.json();
    localStorage.setItem('api_workbench_user', JSON.stringify(updatedUser));
    return updatedUser;
  }

  async deleteMe(): Promise<DeleteAccountResponse> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/auth/me`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to delete account: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected')) throw e;
        throw new Error(errorText || `Failed to delete account: HTTP ${response.status}`);
      }
    }

    const result: DeleteAccountResponse = await response.json();
    this.clearAuthToken();
    return result;
  }

  // ==========================================
  // Saved APIs API Methods
  // ==========================================

  async getSavedApis(): Promise<SavedApi[]> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/saved-apis`, {
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to fetch saved APIs: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected')) throw e;
        throw new Error(errorText || `Failed to fetch saved APIs: HTTP ${response.status}`);
      }
    }

    return await response.json();
  }

  async createSavedApi(data: SavedApiCreate): Promise<SavedApi> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/saved-apis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to save API: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected')) throw e;
        throw new Error(errorText || `Failed to save API: HTTP ${response.status}`);
      }
    }

    return await response.json();
  }

  async getSavedApi(id: string): Promise<SavedApi> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/saved-apis/${id}`, {
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to get saved API: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected')) throw e;
        throw new Error(errorText || `Failed to get saved API: HTTP ${response.status}`);
      }
    }

    return await response.json();
  }

  async getSavedApiToOpen(id: string): Promise<SavedApiOpenResponse> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/saved-apis/${id}/open`, {
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to open saved API: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected')) throw e;
        throw new Error(errorText || `Failed to open saved API: HTTP ${response.status}`);
      }
    }

    return await response.json();
  }

  async updateSavedApi(id: string, data: SavedApiUpdate): Promise<SavedApi> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/saved-apis/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to update saved API: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected')) throw e;
        throw new Error(errorText || `Failed to update saved API: HTTP ${response.status}`);
      }
    }

    return await response.json();
  }

  async deleteSavedApi(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const response = await this.fetchWithHandling(`${this.baseUrl}/saved-apis/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Failed to delete saved API: HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith('Unexpected')) throw e;
        throw new Error(errorText || `Failed to delete saved API: HTTP ${response.status}`);
      }
    }

    return await response.json();
  }
}

export const api = new ApiClient();
