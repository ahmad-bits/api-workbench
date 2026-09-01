import React, { useState, useEffect } from 'react';
import type { HttpMethod } from '../../types/workbench';
import { useToast } from '../../context/ToastContext';
import type {
  MockEndpoint,
  MockEndpointCreate,
  MockEndpointUpdate,
  MockHeaderRow,
} from '../../types/mock';

interface MockEditorPaneProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MockEndpointCreate | MockEndpointUpdate, isEdit: boolean, id?: string) => Promise<void>;
  initialMock?: MockEndpoint | null;
  existingMocks?: MockEndpoint[];
}

const STATUS_CODES = [
  { code: 200, label: '200 — OK' },
  { code: 201, label: '201 — Created' },
  { code: 204, label: '204 — No Content' },
  { code: 400, label: '400 — Bad Request' },
  { code: 401, label: '401 — Unauthorized' },
  { code: 403, label: '403 — Forbidden' },
  { code: 404, label: '404 — Not Found' },
  { code: 409, label: '409 — Conflict' },
  { code: 422, label: '422 — Unprocessable Content' },
  { code: 500, label: '500 — Internal Server Error' },
  { code: 503, label: '503 — Service Unavailable' },
];

const ALL_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

// Which methods accept a request body?
const METHODS_WITH_REQUEST_BODY: HttpMethod[] = ['POST', 'PUT', 'PATCH'];

// Which methods show response body?
const methodHasResponseBody = (method: HttpMethod, statusCode: number): boolean => {
  if (method === 'HEAD' || method === 'OPTIONS') return false;
  if (method === 'DELETE' && statusCode === 204) return false;
  return true;
};

// Default status code per method
const defaultStatusForMethod = (method: HttpMethod): number => {
  if (method === 'POST') return 201;
  if (method === 'DELETE') return 204;
  return 200;
};

export const MockEditorPane: React.FC<MockEditorPaneProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMock,
  existingMocks = [],
}) => {
  const toast = useToast();
  const isEdit = !!initialMock;

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [path, setPath] = useState('/api/v1/resource');
  const [statusCode, setStatusCode] = useState<number>(200);
  const [responseBody, setResponseBody] = useState(`{\n  "id": 1,\n  "message": "Success"\n}`);
  const [requestBody, setRequestBody] = useState('');
  const [headers, setHeaders] = useState<MockHeaderRow[]>([
    { id: 'h_default', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  // OPTIONS: allowed methods
  const [allowedMethods, setAllowedMethods] = useState<HttpMethod[]>(['GET', 'POST']);

  const [jsonError, setJsonError] = useState<string | null>(null);
  const [requestJsonError, setRequestJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate form from initialMock or reset for create
  useEffect(() => {
    if (initialMock) {
      setMethod(initialMock.method);
      setPath(initialMock.path);
      setStatusCode(initialMock.statusCode);
      setResponseBody(initialMock.responseBody || '');
      setRequestBody('');

      const loadedHeaders: MockHeaderRow[] = Object.entries(initialMock.responseHeaders || {}).map(
        ([k, v], i) => ({
          id: `h_${i}_${Date.now()}`,
          key: k,
          value: String(v),
          enabled: true,
        })
      );
      if (loadedHeaders.length === 0) {
        loadedHeaders.push({ id: 'h_default', key: 'Content-Type', value: 'application/json', enabled: true });
      }
      setHeaders(loadedHeaders);

      // Parse Allow header for OPTIONS
      if (initialMock.method === 'OPTIONS') {
        const allowHdr = initialMock.responseHeaders?.['Allow'] || '';
        if (allowHdr) {
          setAllowedMethods(allowHdr.split(',').map(m => m.trim()) as HttpMethod[]);
        }
      }
    } else {
      setMethod('GET');
      setPath('/api/v1/resource');
      setStatusCode(200);
      setResponseBody(`{\n  "id": 1,\n  "message": "Success"\n}`);
      setRequestBody('');
      setHeaders([
        { id: 'h_default', key: 'Content-Type', value: 'application/json', enabled: true },
      ]);
      setAllowedMethods(['GET', 'POST']);
    }
    setJsonError(null);
    setRequestJsonError(null);
    setErrorMessage(null);
  }, [initialMock, isOpen]);

  // When method changes, adjust status code defaults
  const handleMethodChange = (newMethod: HttpMethod) => {
    setMethod(newMethod);
    if (!isEdit) {
      setStatusCode(defaultStatusForMethod(newMethod));
    }
  };

  // Validate response JSON
  useEffect(() => {
    if (!methodHasResponseBody(method, statusCode)) {
      setJsonError(null);
      return;
    }
    if (responseBody.trim()) {
      try {
        JSON.parse(responseBody);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON');
      }
    } else {
      setJsonError(null);
    }
  }, [responseBody, method, statusCode]);

  // Validate request JSON
  useEffect(() => {
    if (!METHODS_WITH_REQUEST_BODY.includes(method)) {
      setRequestJsonError(null);
      return;
    }
    if (requestBody.trim()) {
      try {
        JSON.parse(requestBody);
        setRequestJsonError(null);
      } catch (err: any) {
        setRequestJsonError(err.message || 'Invalid JSON');
      }
    } else {
      setRequestJsonError(null);
    }
  }, [requestBody, method]);

  if (!isOpen) return null;

  const handleAddHeader = () => {
    setHeaders([
      ...headers,
      { id: `h_${Date.now()}`, key: '', value: '', enabled: true },
    ]);
  };

  const handleUpdateHeader = (id: string, field: 'key' | 'value', val: string) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const toggleAllowedMethod = (m: HttpMethod) => {
    setAllowedMethods(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const showResponseBody = methodHasResponseBody(method, statusCode);
  const showRequestBody = METHODS_WITH_REQUEST_BODY.includes(method);
  const showAllowedMethods = method === 'OPTIONS';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPath = path.trim();
    if (!cleanPath) {
      setErrorMessage('Endpoint path is required.');
      toast.warning('Endpoint path is required.');
      return;
    }

    const formattedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const normalizedPath =
      formattedPath.length > 1 && formattedPath.endsWith('/')
        ? formattedPath.slice(0, -1)
        : formattedPath;

    // Check for duplicate endpoint in this user's mocks
    if (existingMocks && existingMocks.length > 0) {
      const isDuplicate = existingMocks.some((m) => {
        if (isEdit && m.id === initialMock?.id) return false;
        const mNorm =
          m.path.length > 1 && m.path.endsWith('/') ? m.path.slice(0, -1) : m.path;
        return m.method.toUpperCase() === method.toUpperCase() && mNorm === normalizedPath;
      });

      if (isDuplicate) {
        const msg = `A mock endpoint with method '${method}' and path '${formattedPath}' already exists in your account.`;
        setErrorMessage(msg);
        toast.warning(msg);
        return;
      }
    }

    if (showResponseBody && responseBody.trim()) {
      try {
        JSON.parse(responseBody);
      } catch {
        setErrorMessage('Response body contains invalid JSON.');
        toast.warning('Response body contains invalid JSON.');
        return;
      }
    }

    const headersMap: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => {
        headersMap[h.key.trim()] = h.value;
      });

    if (!Object.keys(headersMap).some((k) => k.toLowerCase() === 'content-type')) {
      headersMap['Content-Type'] = 'application/json';
    }

    // For OPTIONS, inject Allow headers
    if (method === 'OPTIONS' && allowedMethods.length > 0) {
      const allowStr = allowedMethods.join(', ');
      headersMap['Allow'] = allowStr;
      headersMap['Access-Control-Allow-Methods'] = allowStr;
    }

    // For HEAD, set Content-Length
    if (method === 'HEAD') {
      headersMap['Content-Length'] = '0';
    }

    const payload: MockEndpointCreate = {
      method,
      path: formattedPath,
      statusCode,
      responseHeaders: headersMap,
      responseBody: showResponseBody ? responseBody : '',
      responseType: 'json',
    };

    try {
      setIsSubmitting(true);
      await onSave(payload, isEdit, initialMock?.id);
    } catch (err: any) {
      const msg = err.message || 'Failed to save mock endpoint.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wb-mock-editor-card">
      {/* Header */}
      <div className="wb-mock-editor-header">
        <div className="wb-mock-editor-title-group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <h3 className="wb-mock-editor-title">{isEdit ? 'Edit Endpoint' : 'Create Mock API'}</h3>
        </div>
        <button type="button" className="wb-mock-btn-close" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="wb-mock-form">
        {errorMessage && (
          <div className="wb-mock-error-banner">{errorMessage}</div>
        )}

        {/* Method + Path */}
        <div className="wb-form-field">
          <div className="wb-form-row-2">
            <div>
              <label className="wb-form-label">Method</label>
              <select
                value={method}
                onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
                className="wb-form-select"
              >
                {ALL_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="wb-form-label">Endpoint Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="wb-form-input mono"
                placeholder="/api/v1/resource"
                required
              />
            </div>
          </div>
        </div>

        {/* Status Code */}
        <div className="wb-form-field">
          <label className="wb-form-label">Status Code</label>
          <select
            value={statusCode}
            onChange={(e) => setStatusCode(parseInt(e.target.value, 10))}
            className="wb-form-select"
          >
            {STATUS_CODES.map(sc => (
              <option key={sc.code} value={sc.code}>{sc.label}</option>
            ))}
          </select>
        </div>

        {/* OPTIONS: Allowed Methods */}
        {showAllowedMethods && (
          <div className="wb-form-field">
            <label className="wb-form-label">Allowed Methods</label>
            <div className="wb-mock-allowed-methods">
              {ALL_METHODS.map(m => (
                <label key={m} className="wb-mock-method-checkbox">
                  <input
                    type="checkbox"
                    checked={allowedMethods.includes(m)}
                    onChange={() => toggleAllowedMethod(m)}
                  />
                  <span className="wb-mock-method-checkbox-label">{m}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Request Body (POST/PUT/PATCH) */}
        {showRequestBody && (
          <div className="wb-form-field">
            <label className="wb-form-label">Request Body (JSON)</label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="wb-mock-body-textarea"
              rows={6}
              spellCheck={false}
              placeholder='{ "key": "value" }'
            />
            {requestJsonError && (
              <span className="wb-mock-json-error">{requestJsonError}</span>
            )}
          </div>
        )}

        {/* Response Headers */}
        <div className="wb-mock-headers-section">
          <div className="wb-mock-headers-header">
            <label className="wb-form-label" style={{ margin: 0 }}>Response Headers</label>
            <button type="button" className="wb-btn-add-header-link" onClick={handleAddHeader}>
              + Add
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {headers.map((h) => (
              <div key={h.id} className="wb-mock-header-row">
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => handleUpdateHeader(h.id, 'key', e.target.value)}
                  className="wb-form-input mono"
                  placeholder="Header-Name"
                />
                <span className="wb-mock-header-colon">:</span>
                <input
                  type="text"
                  value={h.value}
                  onChange={(e) => handleUpdateHeader(h.id, 'value', e.target.value)}
                  className="wb-form-input mono"
                  placeholder="value"
                />
                <button
                  type="button"
                  className="wb-btn-remove-hdr"
                  onClick={() => handleRemoveHeader(h.id)}
                  title="Remove"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Response Body */}
        {showResponseBody && (
          <div className="wb-form-field">
            <label className="wb-form-label">Response Body (JSON)</label>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              className="wb-mock-body-textarea"
              rows={10}
              spellCheck={false}
            />
            {jsonError && (
              <span className="wb-mock-json-error">{jsonError}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="wb-mock-editor-footer">
          <button type="button" className="wb-btn-mock-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="wb-btn-mock-save" disabled={isSubmitting || !path.trim()}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Endpoint' : 'Create Endpoint'}
          </button>
        </div>
      </form>
    </div>
  );
};
