import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '1. Create a Request',
      description:
        'Enter endpoint URL, choose HTTP method, and configure query parameters, custom headers, or JSON body data.',
    },
    {
      step: '2. Send & Inspect',
      description:
        'Get instant live responses for your API requests with formatted JSON highlighting, response status, and latency metrics.',
    },
    {
      step: '3. Build & Test',
      description:
        'Use built-in tools during development: spin up custom mock endpoints, save request collections, and benchmark performance.',
    },
  ];

  return (
    <section className="wb-how-section" id="how-it-works">
      <div className="wb-section-container">
        <div className="wb-section-header">
          <h2 className="wb-section-title">How It Works</h2>
          <p className="wb-section-subtitle">
            Three simple steps to test, debug, and streamline your entire API workflow.
          </p>
        </div>

        <div className="wb-how-grid">
          {steps.map((item, idx) => (
            <div key={idx} className="wb-how-step">
              <div className="wb-step-badge">{item.step}</div>
              <p className="wb-step-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
