import React from 'react';

export const TestingFeatureSection: React.FC = () => {
  return (
    <section className="wb-testing-feature-section" id="testing-workspace">
      <div className="wb-centered-section-container">
        <div className="wb-centered-header-box">
          <h2 className="wb-centered-heading">Comprehensive Testing Workspace</h2>

          <p className="wb-centered-subtitle">
            Validate requests against any local or remote endpoint. Full support for complex
            authentication flows, environment variables and automated assertions written in JavaScript.
          </p>
        </div>

        <div className="wb-testing-window-wrapper">
          <div className="wb-window-card">
            <div className="wb-window-titlebar">
              <div className="wb-traffic-dots">
                <span className="wb-traffic-dot wb-dot-red" />
                <span className="wb-traffic-dot wb-dot-yellow" />
                <span className="wb-traffic-dot wb-dot-green" />
              </div>
              <div className="wb-window-title">Test Workspace — Production env</div>
              <div className="wb-traffic-dots-spacer" />
            </div>

            <div className="wb-testing-body-grid">
              <aside className="wb-testing-sidebar">
                <div className="wb-sidebar-heading">Collections</div>

                <div className="wb-collections-tree">
                  <div className="wb-tree-folder">
                    <div className="wb-folder-title">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span>Authentication</span>
                    </div>

                    <div className="wb-folder-items">
                      <div className="wb-tree-item active">
                        <span className="wb-mini-badge post">POST</span>
                        <span className="wb-tree-item-name">Login User</span>
                      </div>

                      <div className="wb-tree-item">
                        <span className="wb-mini-badge post">POST</span>
                        <span className="wb-tree-item-name">Refresh Token</span>
                      </div>
                    </div>
                  </div>

                  <div className="wb-tree-folder collapsed">
                    <div className="wb-folder-title">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span>Users API</span>
                    </div>
                  </div>

                  <div className="wb-tree-folder collapsed">
                    <div className="wb-folder-title">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span>Products API</span>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="wb-testing-main-pane">
                <div className="wb-testing-req-bar">
                  <div className="wb-method-selector-pill">
                    <span>POST</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <div className="wb-testing-url-box">
                    <span className="wb-env-var">&#123;&#123;base_url&#125;&#125;</span>
                    <span>/api/v1/auth/login</span>
                  </div>
                  <button
                    type="button"
                    className="wb-btn-send-request wb-btn-demo-only"
                    disabled
                    aria-disabled="true"
                    tabIndex={-1}
                  >
                    Send Request
                  </button>
                </div>

                <div className="wb-testing-subtabs-row">
                  <span className="wb-subtab">Params</span>
                  <span className="wb-subtab">Headers</span>
                  <span className="wb-subtab">Auth</span>
                  <span className="wb-subtab active">Body (JSON)</span>
                  <span className="wb-subtab">Tests</span>
                </div>

                <div className="wb-testing-code-box">
                  <div className="wb-code-block-inner">
                    <div className="wb-code-line"><span className="wb-code-punc">&#123;</span></div>
                    <div className="wb-code-line indent-1">
                      <span className="wb-code-key">"email"</span>: <span className="wb-code-str">"developer@workbench.dev"</span>,
                    </div>
                    <div className="wb-code-line indent-1">
                      <span className="wb-code-key">"password"</span>: <span className="wb-code-str">"pass_7327_workbench!"</span>,
                    </div>
                    <div className="wb-code-line indent-1">
                      <span className="wb-code-key">"device_id"</span>: <span className="wb-code-str">"dev_41903"</span>,
                    </div>
                    <div className="wb-code-line indent-1">
                      <span className="wb-code-key">"remember_me"</span>: <span className="wb-code-bool">true</span>
                    </div>
                    <div className="wb-code-line"><span className="wb-code-punc">&#125;</span></div>
                  </div>
                </div>

                <div className="wb-testing-response-section">
                  <div className="wb-resp-top-bar">
                    <div className="wb-resp-tabs-group">
                      <span className="wb-resp-tab-btn active">Response</span>
                      <span className="wb-resp-tab-btn">Headers (12)</span>
                      <span className="wb-resp-tab-btn">Test Results (3/3)</span>
                    </div>

                    <div className="wb-resp-metrics-group">
                      <span className="wb-metric-badge-green">● 200 OK</span>
                      <span className="wb-metric-badge-subtle">⏱ 124ms</span>
                      <span className="wb-metric-badge-subtle">842B</span>
                    </div>
                  </div>

                  <div className="wb-resp-body-code">
                    <div className="wb-code-block-inner">
                      <div className="wb-code-line"><span className="wb-code-punc">&#123;</span></div>
                      <div className="wb-code-line indent-1">
                        <span className="wb-code-key">"success"</span>: <span className="wb-code-bool">true</span>,
                      </div>
                      <div className="wb-code-line indent-1">
                        <span className="wb-code-key">"data"</span>: <span className="wb-code-punc">&#123;</span>
                      </div>
                      <div className="wb-code-line indent-2">
                        <span className="wb-code-key">"token"</span>: <span className="wb-code-str">"eyJhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."</span>,
                      </div>
                      <div className="wb-code-line indent-2">
                        <span className="wb-code-key">"user"</span>: <span className="wb-code-punc">&#123;</span>
                      </div>
                      <div className="wb-code-line indent-3">
                        <span className="wb-code-key">"id"</span>: <span className="wb-code-str">"usr_92847a9b1"</span>,
                      </div>
                      <div className="wb-code-line indent-3">
                        <span className="wb-code-key">"name"</span>: <span className="wb-code-str">"Alex Developer"</span>,
                      </div>
                      <div className="wb-code-line indent-3">
                        <span className="wb-code-key">"email"</span>: <span className="wb-code-str">"developer@workbench.dev"</span>
                      </div>
                      <div className="wb-code-line indent-2"><span className="wb-code-punc">&#125;</span></div>
                      <div className="wb-code-line indent-1"><span className="wb-code-punc">&#125;</span></div>
                      <div className="wb-code-line"><span className="wb-code-punc">&#125;</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
