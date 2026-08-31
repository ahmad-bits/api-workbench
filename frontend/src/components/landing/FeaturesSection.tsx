import React from 'react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      id: 'testing',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      title: 'API Testing',
      description: 'Send requests and inspect responses with full header, param, and payload support.',
      pills: ['GET / POST / PUT', 'Query & Headers', 'JSON Payload'],
    },
    {
      id: 'analysis',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      title: 'Request Analysis',
      description: 'See status code, response time, size, and header breakdowns at a single glance.',
      pills: ['Exact Latency (ms)', 'Status Inspection', 'Header Breakdown'],
    },
    {
      id: 'mock',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
      title: 'Mock APIs',
      description: 'Create customizable mock endpoints for rapid frontend development and isolated testing.',
      pills: ['Instant Endpoints', 'Custom Delays', 'Simulated Errors'],
    },
  ];

  return (
    <section className="wb-features-section" id="features">
      <div className="wb-section-container">
        <div className="wb-section-header">
          <h2 className="wb-section-title">Everything You Need to Work With APIs</h2>
          <p className="wb-section-subtitle">
            A comprehensive, clean developer environment designed for speed, clarity, and precision.
          </p>
        </div>

        <div className="wb-features-grid">
          {features.map((feat) => (
            <div key={feat.id} className="wb-feature-card">
              <div className="wb-feature-icon-box">{feat.icon}</div>
              <h3 className="wb-feature-title">{feat.title}</h3>
              <p className="wb-feature-desc">{feat.description}</p>
              <div className="wb-feature-pills">
                {feat.pills.map((pill) => (
                  <span key={pill} className="wb-feature-pill">
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
