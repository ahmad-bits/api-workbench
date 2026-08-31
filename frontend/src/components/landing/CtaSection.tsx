import React from 'react';

interface CtaSectionProps {
  onCreateAccountClick: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onCreateAccountClick }) => {
  return (
    <section className="wb-cta-banner-section" id="about">
      <div className="wb-cta-banner-container">
        <div className="wb-cta-banner-card">
          <h2 className="wb-cta-banner-heading">Ready to build better APIs?</h2>
          <p className="wb-cta-banner-subheading">
            Join thousands of developers who upgraded their API workflow. Start for free in under a minute.
          </p>
          <div className="wb-cta-banner-action">
            <button
              type="button"
              className="wb-btn-cta-white-pill"
              onClick={onCreateAccountClick}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
