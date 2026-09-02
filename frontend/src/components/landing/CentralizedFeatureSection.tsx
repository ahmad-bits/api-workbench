import React from 'react';

export const CentralizedFeatureSection: React.FC = () => {
  const features = [
    {
      id: 0,
      title: 'Real-time Synchronization',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      ),
    },
    {
      id: 1,
      title: 'Team Collaboration',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Version Control Integration',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      ),
    },
  ];

  return (
    <section className="wb-centralized-feature-section" id="centralized-workspace">
      <div className="wb-centered-section-container">
        {/* Header */}
        <div className="wb-centered-header-box">
          <div className="wb-section-badge-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Centralized Workspace</span>
          </div>

          <h2 className="wb-centered-heading">Everything you need, in one place</h2>

          <p className="wb-centered-subtitle">
            No more switching between different tools for design, testing, and mocking. API Workbench
            integrates the entire API lifecycle into a single, seamless environment.
          </p>
        </div>

        {/* Bento Unified Card Container */}
        <div className="wb-bento-card-wrapper">
          <div className="wb-bento-grid">
            {/* Left Column: A Unified View */}
            <div className="wb-bento-left-col">
              <h3 className="wb-bento-title">A Unified View</h3>
              <p className="wb-bento-description">
                Navigate effortlessly between your active environments, collections, and mock servers from
                a unified dashboard designed for maximum productivity.
              </p>

              <div className="wb-bento-tiles-list">
                {features.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`wb-bento-tile-btn ${idx === 0 ? 'active' : ''}`}
                  >
                    <span className="wb-bento-tile-icon">{item.icon}</span>
                    <span className="wb-bento-tile-text">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Activity Feed Widget */}
            <div className="wb-bento-right-col">
              <div className="wb-activity-widget-card">
                {/* Item 1 */}
                <div className="wb-activity-item">
                  <div className="wb-activity-icon green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="wb-activity-info">
                    <span className="wb-activity-title">Production Data Sync</span>
                  </div>
                  <span className="wb-activity-time">Just now</span>
                </div>

                {/* Item 2 */}
                <div className="wb-activity-item">
                  <div className="wb-activity-icon purple">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 2l-2 2m-1.5 1.5L16 7m-1.5 1.5L13 10m-1.5 1.5L10 13" />
                      <circle cx="7.5" cy="16.5" r="4.5" />
                    </svg>
                  </div>
                  <div className="wb-activity-info">
                    <span className="wb-activity-title">OAuth 2.0 Auth set up</span>
                  </div>
                  <span className="wb-activity-time">5m ago</span>
                </div>

                {/* Item 3 */}
                <div className="wb-activity-item">
                  <div className="wb-activity-icon amber">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="wb-activity-info">
                    <span className="wb-activity-title">Monitor Alert: Checkout</span>
                  </div>
                  <span className="wb-activity-time">1h ago</span>
                </div>

                {/* Add Widget Button */}
                <div className="wb-add-widget-box">
                  <button type="button" className="wb-btn-add-widget">
                    <span>+ Add Widget</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
