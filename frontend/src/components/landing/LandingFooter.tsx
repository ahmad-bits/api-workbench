import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './landing.css';

interface LandingFooterProps {
  hideDocsLink?: boolean;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ hideDocsLink }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDocsPage = hideDocsLink || location.pathname.startsWith('/docs');

  return (
    <footer className="wb-landing-footer">
      <div className="wb-footer-inner-container">
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

        {!isDocsPage && (
          <div className="wb-footer-links">
            <button
              type="button"
              className="wb-footer-link-btn"
              onClick={() => navigate('/docs')}
            >
              Documentation
            </button>
          </div>
        )}

        <span className="wb-footer-copyright">
          &copy; {new Date().getFullYear()} API Workbench. All rights reserved.
        </span>
      </div>
    </footer>
  );
};
