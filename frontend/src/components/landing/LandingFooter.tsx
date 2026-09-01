import React from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

interface LandingFooterProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onNavigateSection,
}) => {
  const navigate = useNavigate();

  const handleNav = (sectionId: string) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      navigate('/#' + sectionId);
    }
  };

  return (
    <footer className="wb-landing-footer">
      <div className="wb-footer-inner-container">
        {/* Left Column: Brand & Copyright */}
        <div className="wb-footer-left">
          <div className="wb-footer-brand">
            <div className="wb-brand-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.2C12 7.6 7.6 12 2.2 12C7.6 12 12 16.4 12 21.8C12 16.4 16.4 12 21.8 12C16.4 12 12 7.6 12 2.2Z"
                  fill="#1860ec"
                />
                <circle cx="12" cy="12" r="2" fill="#ffffff" />
              </svg>
            </div>
            <span className="wb-footer-brand-title">API Workbench</span>
          </div>
          <span className="wb-footer-copyright">
            &copy; 2024 API Workbench. All rights reserved.
          </span>
        </div>

        {/* Right Column: Links matching Figma design */}
        <div className="wb-footer-links-row">
          <button
            type="button"
            className="wb-footer-link-btn"
            onClick={() => handleNav('features')}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            className="wb-footer-link-btn"
            onClick={() => handleNav('about')}
          >
            Terms of Service
          </button>
          <button
            type="button"
            className="wb-footer-link-btn"
            onClick={() => handleNav('how-it-works')}
          >
            Pricing
          </button>
        </div>
      </div>
    </footer>
  );
};
