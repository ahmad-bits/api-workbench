import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';
import {
  splitUrl,
  buildUrlWithParams,
  mergeUrlAndParams,
  syncParamsFromUrl,
} from '../utils/urlUtils';
import type {
  HttpMethod,
  BodyType,
  KeyValuePair,
  WorkbenchRequest,
  WorkbenchResponse,
  BatchWorkbenchResponse,
} from '../types/workbench';
import type { MockEndpoint } from '../types/mock';

interface WorkbenchContextType {
  method: HttpMethod;
  setMethod: (m: HttpMethod) => void;
  url: string;
  setUrl: (u: string) => void;
  activeTab: 'params' | 'headers' | 'body' | 'auth';
  setActiveTab: (t: 'params' | 'headers' | 'body' | 'auth') => void;
  params: KeyValuePair[];
  setParams: (p: KeyValuePair[]) => void;
  headers: KeyValuePair[];
  setHeaders: (h: KeyValuePair[]) => void;
  authHeaders: KeyValuePair[];
  setAuthHeaders: (a: KeyValuePair[]) => void;
  bodyType: BodyType;
  setBodyType: (b: BodyType) => void;
  body: string;
  setBody: (b: string) => void;
  timeoutSeconds: number;
  requestCount: number;
  setRequestCount: (n: number) => void;
  handleSetCount: (val: number) => void;

  isSending: boolean;
  response: WorkbenchResponse | null;
  batchResponse: BatchWorkbenchResponse | null;

  saveApiModalOpen: boolean;
  setSaveApiModalOpen: (v: boolean) => void;
  savedApiCount: number;
  setSavedApiCount: React.Dispatch<React.SetStateAction<number>>;
  saveToast: string | null;
  setSaveToast: (v: string | null) => void;

  backendStatus: 'loading' | 'healthy' | 'error';
  backendLatency: number | null;
  checkBackend: () => Promise<void>;

  handleNewRequest: () => void;
  handleSendRequest: () => Promise<void>;
  handleKeyDownUrl: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleOpenSavedApi: (apiId: string) => Promise<void>;
  handleTestInWorkbench: (mock: MockEndpoint) => void;
  detectCurrentApiKey: () => string | null;

  enabledParamsCount: number;
  enabledHeadersCount: number;
  enabledAuthCount: number;

  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  navigateToTester: () => void;
  setNavigateToTester: (fn: () => void) => void;
}

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/posts/1');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [params, setParams] = useState<KeyValuePair[]>([]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: 'h_default', key: 'Accept', value: 'application/json', description: '', enabled: true },
  ]);
  const [authHeaders, setAuthHeaders] = useState<KeyValuePair[]>([]);
  const [bodyType, setBodyType] = useState<BodyType>('json');
  const [body, setBody] = useState<string>('');
  const [timeoutSeconds] = useState<number>(30);
  const [requestCount, setRequestCount] = useState<number>(1);

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
    setParams((prev) => syncParamsFromUrl(newUrl, prev));
  }, []);

  const handleParamsChange = useCallback((newParams: KeyValuePair[]) => {
    setParams(newParams);
    setUrl((prevUrl) => {
      const { baseUrl, hash } = splitUrl(prevUrl);
      return buildUrlWithParams(baseUrl, newParams, hash);
    });
  }, []);

  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<WorkbenchResponse | null>(null);
  const [batchResponse, setBatchResponse] = useState<BatchWorkbenchResponse | null>(null);

  const [saveApiModalOpen, setSaveApiModalOpen] = useState<boolean>(false);
  const [savedApiCount, setSavedApiCount] = useState<number>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wb_sidebar_collapsed');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      return false;
    }
    return false;
  });

  const setSidebarCollapsed = useCallback<React.Dispatch<React.SetStateAction<boolean>>>((action) => {
    setIsSidebarCollapsedState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      try {
        localStorage.setItem('wb_sidebar_collapsed', JSON.stringify(next));
      } catch {
        return next;
      }
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, [setSidebarCollapsed]);

  const [backendStatus, setBackendStatus] = useState<'loading' | 'healthy' | 'error'>('loading');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  const navigateToTesterRef = useRef<() => void>(() => {});
  const navigateToTester = useCallback(() => {
    navigateToTesterRef.current();
  }, []);
  const setNavigateToTester = useCallback((fn: () => void) => {
    navigateToTesterRef.current = fn;
  }, []);

  const checkBackend = useCallback(async () => {
    try {
      const { latencyMs } = await api.checkHealth();
      setBackendLatency(latencyMs);
      setBackendStatus('healthy');
    } catch {
      setBackendStatus('error');
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const handleSetCount = (val: number) => {
    if (isNaN(val)) {
      setRequestCount(1);
      return;
    }
    const clamped = Math.max(1, Math.min(100, Math.floor(val)));
    setRequestCount(clamped);
  };

  const handleNewRequest = () => {
    setUrl('');
    setParams([]);
    setHeaders([{ id: `h_${Date.now()}`, key: 'Accept', value: 'application/json', description: '', enabled: true }]);
    setAuthHeaders([]);
    setBodyType('json');
    setBody('');
    setRequestCount(1);
    setResponse(null);
    setBatchResponse(null);
    setActiveTab('params');
    navigateToTester();
    toast.info('Cleared workspace for a new API request.');
  };

  const detectCurrentApiKey = (): string | null => {
    for (const a of authHeaders) {
      if (a.enabled && a.key.trim() && a.value.trim()) {
        return a.value.trim();
      }
    }
    for (const h of headers) {
      if (h.enabled && h.key.trim() && h.value.trim()) {
        const k = h.key.trim().toLowerCase();
        if (
          k === 'x-api-key' ||
          k === 'api-key' ||
          k === 'apikey' ||
          k === 'x-api-token' ||
          k === 'api_key' ||
          k === 'x-auth-token'
        ) {
          return h.value.trim();
        }
        if (k === 'authorization') {
          const val = h.value.trim();
          if (val.toLowerCase().startsWith('bearer ')) {
            return val.slice(7).trim();
          }
          return val;
        }
      }
    }
    for (const p of params) {
      if (p.enabled && p.key.trim() && p.value.trim()) {
        const k = p.key.trim().toLowerCase();
        if (k === 'api_key' || k === 'apikey' || k === 'key' || k === 'token' || k === 'auth') {
          return p.value.trim();
        }
      }
    }
    return null;
  };

  const handleOpenSavedApi = async (apiId: string) => {
    try {
      const openData = await api.getSavedApiToOpen(apiId);
      handleUrlChange(openData.url);
      setMethod('GET');
      setRequestCount(1);
      setResponse(null);
      setBatchResponse(null);

      if (openData.has_api_key && openData.api_key) {
        setAuthHeaders([
          {
            id: `auth_${Date.now()}`,
            key: 'X-API-Key',
            value: openData.api_key,
            enabled: true,
          },
        ]);
        setActiveTab('auth');
      }

      navigateToTester();
      toast.success(`Loaded "${openData.name}" into API Tester.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to open saved API.');
    }
  };

  const handleTestInWorkbench = (mock: MockEndpoint) => {
    const fullMockUrl = mock.fullUrl || (mock.mockUrl ? `http://127.0.0.1:8000${mock.mockUrl}` : `http://127.0.0.1:8000/mock/${mock.path.startsWith('/') ? mock.path.slice(1) : mock.path}`);
    handleUrlChange(fullMockUrl);
    setMethod(mock.method);
    setHeaders([{ id: 'h_default', key: 'Accept', value: 'application/json', enabled: true }]);

    const authList: KeyValuePair[] = [];
    if (mock.authType === 'api_key' && mock.authHeaderValue) {
      authList.push({
        id: `auth_${Date.now()}`,
        key: mock.authHeaderName || 'X-API-Key',
        value: mock.authHeaderValue,
        enabled: true,
      });
    } else if (mock.authType === 'bearer' && mock.authToken) {
      authList.push({
        id: `auth_${Date.now()}`,
        key: 'Authorization',
        value: `Bearer ${mock.authToken}`,
        enabled: true,
      });
    }
    setAuthHeaders(authList);

    setBodyType('json');
    setBody('');
    setRequestCount(1);
    setResponse(null);
    setBatchResponse(null);
    setActiveTab(authList.length > 0 ? 'auth' : 'params');
    navigateToTester();
    toast.info(`Configured Mock Endpoint "${mock.name}" in API Tester.`);
  };

  const handleSendRequest = async () => {
    if (!url.trim()) {
      toast.warning('Please enter a target API URL to send a request.');
      return;
    }
    if (isSending) return;

    setIsSending(true);
    setResponse(null);
    setBatchResponse(null);

    const mergedUrl = mergeUrlAndParams(url.trim(), params);
    const combinedHeaders = [...headers, ...authHeaders];

    const payload: WorkbenchRequest = {
      method,
      url: mergedUrl,
      params,
      headers: combinedHeaders,
      bodyType,
      body,
      timeoutSeconds,
      requestCount,
    };

    try {
      if (requestCount === 1) {
        const res = await api.dispatchHttpRequest(payload);
        setResponse(res);
        if (res.statusCode >= 200 && res.statusCode < 400) {
          toast.success(`Request completed: ${res.statusCode} ${res.statusText}`);
        } else if (res.statusCode >= 400) {
          toast.warning(`Request returned ${res.statusCode} ${res.statusText}`);
        }
      } else {
        const batchRes = await api.dispatchBenchmarkRequest(payload);
        setBatchResponse(batchRes);
        toast.success(`Benchmark finished: ${batchRes.stats.totalRequests} runs completed (${batchRes.stats.successRate}% success).`);
      }
    } catch (err: any) {
      setResponse({
        statusCode: 0,
        statusText: 'Connection Error',
        headers: {},
        data: null,
        isJson: false,
        sizeBytes: 0,
        elapsedMs: 0,
        error: err.message || 'Network request failed. Ensure target endpoint is reachable.',
      });
      toast.error('Network request failed. Target endpoint is unreachable.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDownUrl = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendRequest();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendRequest();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleSendRequest]);

  const enabledParamsCount = params.filter((p) => p.enabled && p.key.trim()).length;
  const enabledHeadersCount = headers.filter((h) => h.enabled && h.key.trim()).length;
  const enabledAuthCount = authHeaders.filter((a) => a.enabled && a.key.trim()).length;

  return (
    <WorkbenchContext.Provider
      value={{
        method, setMethod,
        url, setUrl: handleUrlChange,
        activeTab, setActiveTab,
        params, setParams: handleParamsChange,
        headers, setHeaders,
        authHeaders, setAuthHeaders,
        bodyType, setBodyType,
        body, setBody,
        timeoutSeconds,
        requestCount, setRequestCount,
        handleSetCount,
        isSending,
        response,
        batchResponse,
        saveApiModalOpen, setSaveApiModalOpen,
        savedApiCount, setSavedApiCount,
        saveToast, setSaveToast,
        backendStatus,
        backendLatency,
        checkBackend,
        handleNewRequest,
        handleSendRequest,
        handleKeyDownUrl,
        handleOpenSavedApi,
        handleTestInWorkbench,
        detectCurrentApiKey,
        enabledParamsCount,
        enabledHeadersCount,
        enabledAuthCount,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        navigateToTester,
        setNavigateToTester,
      }}
    >
      {children}
    </WorkbenchContext.Provider>
  );
};

export function useWorkbench(): WorkbenchContextType {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
}
