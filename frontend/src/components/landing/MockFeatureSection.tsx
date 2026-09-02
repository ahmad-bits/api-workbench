import React from 'react';

interface MockFeatureSectionProps {
  onExploreMockingClick?: () => void;
}

export const MockFeatureSection: React.FC<MockFeatureSectionProps> = ({
  onExploreMockingClick,
}) => {
  const mockEndpoints = [
    {
      id: 0,
      method: 'GET',
      methodClass: 'wb-badge-method-get',
      path: '/api/v1/products',
      status: '200 OK',
      statusClass: 'wb-status-tag-green',
      templateTitle: 'Response Template (GET /api/v1/products)',
      lines: [
        { indent: 0, content: <span className="wb-code-punc">&#123;</span> },
        {
          indent: 1,
          content: (
            <>
              <span className="wb-code-key">"data"</span>: <span className="wb-code-punc">[</span>
            </>
          ),
        },
        { indent: 2, content: <span className="wb-code-punc">&#123;</span> },
        {
          indent: 3,
          content: (
            <>
              <span className="wb-code-key">"id"</span>: <span className="wb-code-str">"&#123;&#123;faker.id&#125;&#125;"</span>,
            </>
          ),
        },
        {
          indent: 3,
          content: (
            <>
              <span className="wb-code-key">"name"</span>: <span className="wb-code-str">"&#123;&#123;faker.commerce.productName&#125;&#125;"</span>,
            </>
          ),
        },
        {
          indent: 3,
          content: (
            <>
              <span className="wb-code-key">"price"</span>: <span className="wb-code-str">"&#123;&#123;faker.commerce.price&#125;&#125;"</span>,
            </>
          ),
        },
        {
          indent: 3,
          content: (
            <>
              <span className="wb-code-key">"in_stock"</span>: <span className="wb-code-str">"&#123;&#123;faker.datatype.boolean&#125;&#125;"</span>
            </>
          ),
        },
        { indent: 2, content: <span className="wb-code-punc">&#125;</span> },
        { indent: 1, content: <span className="wb-code-punc">]</span> },
        { indent: 0, content: <span className="wb-code-punc">&#125;</span> },
      ],
    },
    {
      id: 1,
      method: 'POST',
      methodClass: 'wb-badge-method-post',
      path: '/api/v1/orders',
      status: '201 Created',
      statusClass: 'wb-status-tag-green',
      templateTitle: 'Response Template (POST /api/v1/orders)',
      lines: [],
    },
    {
      id: 2,
      method: 'DELETE',
      methodClass: 'wb-badge-method-delete',
      path: '/api/v1/products/42',
      status: '204 No Content',
      statusClass: 'wb-status-tag-gray',
      templateTitle: 'Response Template (DELETE /api/v1/products/42)',
      lines: [],
    },
  ];

  const current = mockEndpoints[0];

  return (
    <section className="wb-mock-feature-section" id="mock-engine">
      <div className="wb-feature-container">
        {/* Left Column: Information */}
        <div className="wb-mock-feature-content">
          <h2 className="wb-feature-heading">
            Instant Simulated
            <br />
            Endpoints
          </h2>

          <p className="wb-feature-description">
            Don't block frontend developers waiting for the backend. Create, manage, and deploy
            robust mock APIs in seconds. Generate dynamic response data using fakers or raw and handle
            complex testing scenarios effortlessly.
          </p>

          {/* Feature List Points */}
          <div className="wb-feature-points-list">
            <div className="wb-feature-point-item">
              <div className="wb-point-icon-circle green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div className="wb-point-text">
                <h4 className="wb-point-title">Dynamic Data Generation</h4>
                <p className="wb-point-subtitle">Auto-generate realistic mock test data on the fly.</p>
              </div>
            </div>

            <div className="wb-feature-point-item">
              <div className="wb-point-icon-circle green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div className="wb-point-text">
                <h4 className="wb-point-title">Stateful Mocks</h4>
                <p className="wb-point-subtitle">Simulate real database interactions with persistent in-memory store.</p>
              </div>
            </div>
          </div>

          {/* CTA: Takes user to login */}
          <div className="wb-feature-cta-box">
            <button
              type="button"
              className="wb-btn-primary-pill"
              onClick={onExploreMockingClick}
            >
              <span>Explore Mocking</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Column: Static Mock Endpoints Demonstration Card */}
        <div className="wb-mock-feature-card">
          {/* Card Header */}
          <div className="wb-mock-card-header">
            <h3 className="wb-mock-card-title">Mock Endpoints</h3>
            {/* New Endpoint is demonstration only */}
            <button
              type="button"
              className="wb-btn-new-endpoint wb-btn-demo-only"
              disabled
              aria-disabled="true"
              tabIndex={-1}
            >
              + New Endpoint
            </button>
          </div>

          {/* Endpoints List (Static Demonstration) */}
          <div className="wb-mock-endpoints-list">
            {mockEndpoints.map((ep, idx) => (
              <div
                key={ep.id}
                className={`wb-mock-endpoint-row ${idx === 0 ? 'active-row' : ''}`}
              >
                <div className="wb-mock-ep-left">
                  <span className={`wb-badge-method ${ep.methodClass}`}>{ep.method}</span>
                  <span className="wb-mock-ep-path">{ep.path}</span>
                </div>
                <div className="wb-mock-ep-right">
                  <span className={`wb-mock-status-pill ${ep.statusClass}`}>{ep.status}</span>
                  <span className="wb-btn-icon-edit" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Response Template Editor Container */}
          <div className="wb-mock-template-container">
            <div className="wb-mock-template-label">{current.templateTitle}</div>
            <div className="wb-mock-template-code">
              {current.lines.map((line, i) => (
                <div key={i} className={`wb-code-line indent-${line.indent}`}>
                  {line.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
