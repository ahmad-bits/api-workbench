import React from 'react';
import './landing.css';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="wb-landing-footer">
      <div className="wb-footer-inner-container">
        {/* Brand */}
        <div className="wb-footer-brand">
          <div className="wb-brand-logo-icon">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M16 3.5L26.5 9.5L16 15.5L5.5 9.5Z" fill="#60a5fa" />
              <path d="M4.5 11.2L15 17.2V29.5L4.5 23.5Z" fill="#1860ec" />
              <path d="M27.5 11.2L17 17.2V29.5L27.5 23.5Z" fill="#1d4ed8" />
            </svg>
          </div>
          <span className="wb-footer-brand-title">API Workbench</span>
        </div>

        {/* Copyright */}
        <span className="wb-footer-copyright">
          &copy; 2026 API Workbench. All rights reserved.
        </span>
      </div>
    </footer>
  );
};
