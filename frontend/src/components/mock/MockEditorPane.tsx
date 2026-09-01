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
}

export const MockEditorPane: React.FC<MockEditorPaneProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMock,
}) => {
  const toast = useToast();
  const isEdit = !!initialMock;

  const [name, setName] = useState('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [path, setPath] = useState('/api/v1/users/{id}');
  const [statusCode, setStatusCode] = useState<number>(200);
  const [responseBody, setResponseBody] = useState(`{
  "id": "usr_948j",
  "name": "Jane Developer",
  "email": "jane@techcorp.com",
  "role": "admin",
  "status": "active",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}`);
  const [headers, setHeaders] = useState<MockHeaderRow[]>([
    { id: 'h_default', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);

  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialMock) {
      setName(initialMock.name || '');
      setMethod(initialMock.method);
      setPath(initialMock.path);
      setStatusCode(initialMock.statusCode);
      setResponseBody(initialMock.responseBody || '');

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
    } else {
      setName('New Mock Endpoint');
      setMethod('GET');
      setPath('/api/v1/resource');
      setStatusCode(200);
      setResponseBody(`{\n  "id": "usr_948j",\n  "name": "Jane Developer",\n  "email": "jane@techcorp.com",\n  "role": "admin",\n  "status": "active"\n}`);
      setHeaders([
        { id: 'h_default', key: 'Content-Type', value: 'application/json', enabled: true },
      ]);
    }
    setJsonError(null);
    setErrorMessage(null);
  }, [initialMock, isOpen]);

  // Validate JSON on change
  useEffect(() => {
    if (responseBody.trim()) {
      try {
        JSON.parse(responseBody);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON format');
      }
    } else {
      setJsonError(null);
    }
  }, [responseBody]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPath = path.trim();
    if (!cleanPath) {
      setErrorMessage('Endpoint path is required.');
      toast.warning('Endpoint path is required.');
      return;
    }

    if (statusCode < 100 || statusCode > 599) {
      setErrorMessage('Status code must be between 100 and 599.');
      toast.warning('Status code must be between 100 and 599.');
      return;
    }

    if (responseBody.trim()) {
      try {
        JSON.parse(responseBody);
      } catch {
        setErrorMessage('Response body contains invalid JSON. Please correct the syntax.');
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

    const payload: MockEndpointCreate = {
      name: name.trim() || undefined,
      method,
      path: cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`,
      statusCode,
      responseHeaders: headersMap,
      responseBody,
      responseType: 'json',
    };

    try {
      setIsSubmitting(true);
      await onSave(payload, isEdit, initialMock?.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save mock endpoint.');
      toast.error(err.message || 'Failed to save mock endpoint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wb-mock-editor-card">
      {/* Editor Header: [ 📝 Edit Mock ] [ ✕ ] */}
      <div className="wb-mock-editor-header">
        <div className="wb-mock-editor-title-group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1860ec" strokeWidth="2.2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <h3 className="wb-mock-editor-title">{isEdit ? 'Edit Mock' : 'Create Mock'}</h3>
        </div>

        <button type="button" className="wb-mock-btn-close" onClick={onClose} title="Close editor">
          ✕
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="wb-mock-form">
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* 1. Mock Name */}
        <div className="wb-form-field">
          <label className="wb-form-label">Mock Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="wb-form-input"
          />
        </div>

        {/* 2. Method & Endpoint Path */}
        <div className="wb-form-field">
          <div className="wb-form-row-2">
            <div>
              <label className="wb-form-label">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="wb-form-select"
                style={{ width: '100%' }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="wb-form-label">Endpoint Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="wb-form-input"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '0.825rem' }}
                required
              />
            </div>
          </div>
        </div>

        {/* 3. Status Code */}
        <div className="wb-form-field">
          <label className="wb-form-label">Status Code</label>
          <input
            type="number"
            min={100}
            max={599}
            value={statusCode}
            onChange={(e) => setStatusCode(parseInt(e.target.value, 10) || 200)}
            className="wb-form-input"
            style={{ width: '100%', maxWidth: '140px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}
            required
          />
        </div>

        {/* 4. Response Headers */}
        <div className="wb-mock-headers-section">
          <div className="wb-mock-headers-header">
            <label className="wb-form-label" style={{ margin: 0 }}>Response Headers</label>
            <button type="button" className="wb-btn-add-header-link" onClick={handleAddHeader}>
              + Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {headers.map((h) => (
              <div key={h.id} className="wb-mock-header-row">
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => handleUpdateHeader(h.id, 'key', e.target.value)}
                  className="wb-form-input"
                  style={{ padding: '0.5rem 0.65rem', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }}
                />
                <span className="wb-mock-header-colon">:</span>
                <input
                  type="text"
                  value={h.value}
                  onChange={(e) => handleUpdateHeader(h.id, 'value', e.target.value)}
                  className="wb-form-input"
                  style={{ padding: '0.5rem 0.65rem', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }}
                />
                <button
                  type="button"
                  className="wb-btn-remove-hdr"
                  onClick={() => handleRemoveHeader(h.id)}
                  title="Remove header"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Response Body (JSON) */}
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
            <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
              ⚠ {jsonError}
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="wb-mock-editor-footer">
          <button type="button" className="wb-btn-mock-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="wb-btn-mock-save" disabled={isSubmitting || !path.trim()}>
            {isSubmitting ? 'Saving...' : 'Save Mock'}
          </button>
        </div>
      </form>
    </div>
  );
};
