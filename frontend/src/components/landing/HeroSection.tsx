import React from 'react';

interface HeroSectionProps {
  onGetStartedClick: () => void;
  onViewDocsClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStartedClick,
  onViewDocsClick,
}) => {
  return (
    <section className="wb-hero-section" id="hero">
      <div className="wb-hero-container">
        {/* Top Header & Copy */}
        <div className="wb-hero-header-box">
          <h1 className="wb-hero-title">
            Your workspace for
            <br />
            <span className="wb-hero-title-accent">better APIs.</span>
          </h1>

          <p className="wb-hero-subtitle">
            The fastest way to design, test, and monitor APIs. Built for developers who demand
            precision and speed.
          </p>

          {/* CTA Buttons */}
          <div className="wb-hero-cta-row">
            <button
              type="button"
              className="wb-btn-primary-pill"
              onClick={onGetStartedClick}
            >
              <span>Start Working For Free</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              className="wb-btn-secondary-pill"
              onClick={onViewDocsClick}
            >
              <span>View Documentation</span>
            </button>
          </div>
        </div>

        {/* macOS Window Mockup */}
        <div className="wb-hero-mockup-wrapper">
          <div className="wb-window-card">
            {/* Window Title Bar */}
            <div className="wb-window-titlebar">
              <div className="wb-traffic-dots">
                <span className="wb-traffic-dot wb-dot-red" />
                <span className="wb-traffic-dot wb-dot-yellow" />
                <span className="wb-traffic-dot wb-dot-green" />
              </div>
              <div className="wb-window-title">api.workbench.dev/users</div>
              <div className="wb-traffic-dots-spacer" />
            </div>

            {/* Window Content: 2-Column Split */}
            <div className="wb-hero-preview-body">
              {/* Left Column: Request Configuration */}
              <div className="wb-hero-request-pane">
                <div className="wb-hero-url-row">
                  <span className="wb-badge-method-get">GET</span>
                  <input
                    type="text"
                    className="wb-hero-url-input"
                    value="https://api.workbench.dev/users/me"
                    readOnly
                    tabIndex={-1}
                  />
                  {/* Send button is for demonstration only - disabled / non-clickable */}
                  <button
                    type="button"
                    className="wb-hero-send-btn wb-btn-demo-only"
                    disabled
                    aria-disabled="true"
                    tabIndex={-1}
                  >
                    Send
                  </button>
                </div>

                {/* Sub-tabs (Static Display) */}
                <div className="wb-hero-tabs-row">
                  <span className="wb-hero-tab active">
                    Params
                  </span>
                  <span className="wb-hero-tab">
                    Headers (2)
                  </span>
                  <span className="wb-hero-tab">
                    Body
                  </span>
                </div>

                {/* Tab content row (Static Display) */}
                <div className="wb-hero-params-table">
                  <div className="wb-hero-param-row">
                    <div className="wb-checkbox-mock checked">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="wb-param-key-box">include_profile</div>
                    <div className="wb-param-val-box">true</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Response Details */}
              <div className="wb-hero-response-pane">
                <div className="wb-hero-resp-header">
                  <div className="wb-hero-status-tag">
                    <span className="wb-status-dot" />
                    <span>200 OK</span>
                  </div>
                  <div className="wb-hero-metrics">
                    <span className="wb-metric-badge">⏱ 43ms</span>
                    <span className="wb-metric-badge">2KB</span>
                  </div>
                </div>

                {/* Formatted JSON */}
                <div className="wb-hero-json-container">
                  <div className="wb-hero-json-line">
                    <span className="wb-code-punc">&#123;</span>
                  </div>
                  <div className="wb-hero-json-line indent-1">
                    <span className="wb-code-key">"id"</span>: <span className="wb-code-str">"usr_92847a9b1"</span>,
                  </div>
                  <div className="wb-hero-json-line indent-1">
                    <span className="wb-code-key">"status"</span>: <span className="wb-code-str">"active"</span>,
                  </div>
                  <div className="wb-hero-json-line indent-1">
                    <span className="wb-code-key">"email"</span>: <span className="wb-code-str">"developer@workbench.dev"</span>,
                  </div>
                  <div className="wb-hero-json-line indent-1">
                    <span className="wb-code-key">"name"</span>: <span className="wb-code-str">"Alex Developer"</span>,
                  </div>
                  <div className="wb-hero-json-line indent-1">
                    <span className="wb-code-key">"profile"</span>: <span className="wb-code-punc">&#123;</span>
                  </div>
                  <div className="wb-hero-json-line indent-2">
                    <span className="wb-code-key">"avatar"</span>: <span className="wb-code-str">"https://avatar.workbench.dev/alex.png"</span>,
                  </div>
                  <div className="wb-hero-json-line indent-2">
                    <span className="wb-code-key">"role"</span>: <span className="wb-code-str">"admin"</span>,
                  </div>
                  <div className="wb-hero-json-line indent-2">
                    <span className="wb-code-key">"created_at"</span>: <span className="wb-code-str">"2024-01-15T08:30:00Z"</span>
                  </div>
                  <div className="wb-hero-json-line indent-1">
                    <span className="wb-code-punc">&#125;</span>
                  </div>
                  <div className="wb-hero-json-line">
                    <span className="wb-code-punc">&#125;</span>
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
