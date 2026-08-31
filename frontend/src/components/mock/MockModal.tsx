import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { HttpMethod } from '../../types/workbench';
import type {
  MockEndpoint,
  MockEndpointCreate,
  MockEndpointUpdate,
  MockHeaderRow,
} from '../../types/mock';


interface MockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MockEndpointCreate | MockEndpointUpdate, isEdit: boolean, id?: string) => Promise<void>;
  initialMock?: MockEndpoint | null;
}

const COMMON_STATUS_CODES = [
  { code: 200, label: '200 OK' },
  { code: 201, label: '201 Created' },
  { code: 204, label: '204 No Content' },
  { code: 400, label: '400 Bad Request' },
  { code: 401, label: '401 Unauthorized' },
  { code: 404, label: '404 Not Found' },
  { code: 500, label: '500 Server Error' },
];

const SAMPLE_TEMPLATES = [
  {
    name: 'User Object',
    body: JSON.stringify(
      {
        id: 1,
        name: 'Ahmad Ali',
        email: 'ahmad@example.com',
        role: 'Admin',
        created_at: new Date().toISOString(),
      },
      null,
      2
    ),
  },
  {
    name: 'Items Array',
    body: JSON.stringify(
      [
        { id: 1, title: 'Learn API Workbench', completed: true },
        { id: 2, title: 'Build Mock Endpoints', completed: false },
        { id: 3, title: 'Deploy Full-Stack App', completed: false },
      ],
      null,
      2
    ),
  },
  {
    name: 'Success Message',
    body: JSON.stringify(
      {
        success: true,
        message: 'Resource processed successfully',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
  },
  {
    name: 'Error Payload',
    body: JSON.stringify(
      {
        error: 'ResourceNotFound',
        message: 'The requested entity does not exist.',
        code: 404,
      },
      null,
      2
    ),
  },
];

export const MockModal: React.FC<MockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMock,
}) => {
  const { user } = useAuth();
  const isEdit = !!initialMock;

  const [name, setName] = useState('');

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [path, setPath] = useState('/users');
  const [statusCode, setStatusCode] = useState<number>(200);
  const [responseType, setResponseType] = useState<'json' | 'text'>('json');
  const [responseBody, setResponseBody] = useState('{\n  "message": "Hello from Mock Server!"\n}');
  const [description, setDescription] = useState('');
  const [headers, setHeaders] = useState<MockHeaderRow[]>([
    { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);

  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

  useEffect(() => {
    if (initialMock) {
      setName(initialMock.name || '');
      setMethod(initialMock.method);
      setPath(initialMock.path);
      setStatusCode(initialMock.statusCode);
      setResponseType(initialMock.responseType || 'json');
      setResponseBody(initialMock.responseBody || '');
      setDescription(initialMock.description || '');

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
      setName('');
      setMethod('GET');
      setPath('/users');
      setStatusCode(200);
      setResponseType('json');
      setResponseBody('{\n  "message": "Hello from Mock Server!"\n}');
      setDescription('');
      setHeaders([
        { id: 'h_default', key: 'Content-Type', value: 'application/json', enabled: true },
      ]);
    }
    setJsonError(null);
    setErrorMessage(null);
  }, [initialMock, isOpen]);

  // Validate JSON on change
  useEffect(() => {
    if (responseType === 'json' && responseBody.trim()) {
      try {
        JSON.parse(responseBody);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON syntax');
      }
    } else {
      setJsonError(null);
    }
  }, [responseBody, responseType]);

  if (!isOpen) return null;

  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(responseBody);
      setResponseBody(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Cannot format invalid JSON');
    }
  };

  const handleAddHeader = () => {
    setHeaders([
      ...headers,
      { id: `h_${Date.now()}`, key: '', value: '', enabled: true },
    ]);
  };

  const handleUpdateHeader = (id: string, field: 'key' | 'value' | 'enabled', val: any) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const cleanPath = path.trim();
    if (!cleanPath) {
      setErrorMessage('Endpoint path is required.');
      return;
    }

    if (statusCode < 100 || statusCode > 599) {
      setErrorMessage('Status code must be between 100 and 599.');
      return;
    }

    if (responseType === 'json' && responseBody.trim()) {
      try {
        JSON.parse(responseBody);
      } catch {
        setErrorMessage('Response body contains invalid JSON. Please fix errors or switch to Text.');
        return;
      }
    }

    // Build headers object
    const headersMap: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => {
        headersMap[h.key.trim()] = h.value;
      });

    if (responseType === 'json' && !Object.keys(headersMap).some((k) => k.toLowerCase() === 'content-type')) {
      headersMap['Content-Type'] = 'application/json';
    }

    const payload: MockEndpointCreate = {
      name: name.trim() || undefined,
      method,
      path: cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`,
      statusCode,
      responseHeaders: headersMap,
      responseBody,
      responseType,
      description: description.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSave(payload, isEdit, initialMock?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save mock endpoint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">🎭</div>
            <div>
              <h3 className="modal-title">
                {isEdit ? 'Edit Mock Endpoint' : 'Create Mock Endpoint'}
              </h3>
              <p className="modal-subtitle">
                Configure HTTP method, URL route path, status code, and mock response body
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Close modal">
            ✕
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="modal-error-banner">
            <span className="modal-error-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mock-form">
          {/* Row 1: Name & Method */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Mock Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">HTTP Method</label>
              <div className="method-pill-selector">
                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`method-toggle-btn ${m.toLowerCase()} ${method === m ? 'active' : ''}`}
                    onClick={() => setMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Route Path & Status Code */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Endpoint Path <span className="required-star">*</span>
              </label>
              <div className="path-input-wrapper">
                <span className="path-prefix">/mock/{user?.username || 'username'}</span>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="form-input path-input"
                  required
                />
              </div>

            </div>

            <div className="form-group">
              <label className="form-label">
                Response Status Code <span className="required-star">*</span>
              </label>
              <div className="status-code-row">
                <input
                  type="number"
                  min={100}
                  max={599}
                  value={statusCode}
                  onChange={(e) => setStatusCode(parseInt(e.target.value, 10) || 200)}
                  className="form-input status-num-input"
                  required
                />
                <div className="status-quick-pills">
                  {COMMON_STATUS_CODES.map((sc) => (
                    <button
                      key={sc.code}
                      type="button"
                      className={`status-chip ${statusCode === sc.code ? 'active' : ''}`}
                      onClick={() => setStatusCode(sc.code)}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Response Body vs Headers */}
          <div className="modal-tabs">
            <button
              type="button"
              className={`tab-nav-item ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              Response Body {responseType === 'json' && <span className="tab-counter">JSON</span>}
            </button>
            <button
              type="button"
              className={`tab-nav-item ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Response Headers <span className="tab-counter">{headers.filter((h) => h.enabled && h.key).length}</span>
            </button>
          </div>

          {/* TAB 1: Response Body */}
          {activeTab === 'body' && (
            <div className="form-body-section">
              <div className="body-section-toolbar">
                <div className="body-type-radios">
                  <label className={`radio-label ${responseType === 'json' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="responseType"
                      value="json"
                      checked={responseType === 'json'}
                      onChange={() => setResponseType('json')}
                    />
                    JSON
                  </label>
                  <label className={`radio-label ${responseType === 'text' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="responseType"
                      value="text"
                      checked={responseType === 'text'}
                      onChange={() => setResponseType('text')}
                    />
                    Plain Text
                  </label>
                </div>

                <div className="template-actions">
                  <span className="template-label">Load Template:</span>
                  {SAMPLE_TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      className="btn-template-pill"
                      onClick={() => {
                        setResponseBody(t.body);
                        setResponseType('json');
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                  {responseType === 'json' && (
                    <button
                      type="button"
                      className="btn-format"
                      onClick={handlePrettifyJson}
                      title="Prettify JSON"
                    >
                      ✨ Prettify
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
                className={`form-textarea body-textarea ${jsonError ? 'textarea-error' : ''}`}
                rows={8}
                spellCheck={false}
              />

              {jsonError && (
                <div className="json-error-banner">
                  <span className="error-icon">⚠️</span>
                  <span>{jsonError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Response Headers */}
          {activeTab === 'headers' && (
            <div className="form-headers-section">
              <div className="headers-editor-header">
                <span className="headers-editor-title">Custom Response Headers</span>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={handleAddHeader}
                >
                  + Add Header
                </button>
              </div>

              <div className="kv-table-container">
                <table className="kv-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th style={{ width: '45%' }}>Header Name</th>
                      <th>Header Value</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((h) => (
                      <tr key={h.id} className={!h.enabled ? 'row-disabled' : ''}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={h.enabled}
                            onChange={(e) => handleUpdateHeader(h.id, 'enabled', e.target.checked)}
                            className="kv-checkbox"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={h.key}
                            onChange={(e) => handleUpdateHeader(h.id, 'key', e.target.value)}
                            className="kv-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={h.value}
                            onChange={(e) => handleUpdateHeader(h.id, 'value', e.target.value)}
                            className="kv-input"
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon-danger"
                            onClick={() => handleRemoveHeader(h.id)}
                            title="Remove header"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                    {headers.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                          No headers configured. Defaulting to Content-Type: application/json.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Notes / Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !path.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Mock Endpoint' : 'Create Mock Endpoint'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
