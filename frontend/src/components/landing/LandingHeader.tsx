import React, { useState } from 'react';

interface LandingHeaderProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onWorkbenchClick: () => void;
  onNavigateSection: (sectionId: string) => void;
  isAuthenticated: boolean;
  userName?: string;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onLoginClick,
  onSignUpClick,
  onWorkbenchClick,
  onNavigateSection,
  isAuthenticated,
  userName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigateSection(sectionId);
  };

  return (
    <header className="wb-header-wrapper">
      <div className="wb-header-container">
        {/* Brand Logo (Static, Non-Interactive) */}
        <div className="wb-brand-link">
          <div className="wb-brand-logo-icon">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 3.5L26.5 9.5L16 15.5L5.5 9.5Z" fill="#60a5fa" />
              <path d="M4.5 11.2L15 17.2V29.5L4.5 23.5Z" fill="#1860ec" />
              <path d="M27.5 11.2L17 17.2V29.5L27.5 23.5Z" fill="#1d4ed8" />
            </svg>
          </div>
          <span className="wb-brand-text">API Workbench</span>
        </div>

        {/* Center Navigation Links */}
        <nav className="wb-header-nav" aria-label="Main Navigation">
          <ul className="wb-nav-links">
            <li className="wb-nav-item">
              <button type="button" onClick={() => handleNavClick('features')}>
                Features
              </button>
            </li>
            <li className="wb-nav-item">
              <button type="button" onClick={() => handleNavClick('about')}>
                About
              </button>
            </li>
          </ul>
        </nav>

        {/* Right Action Buttons */}
        <div className="wb-header-actions">
          {isAuthenticated ? (
            <button
              type="button"
              className="wb-btn-workbench-nav"
              onClick={onWorkbenchClick}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <span>Open Workbench</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="wb-btn-login"
                onClick={onLoginClick}
              >
                Login
              </button>
              <button
                type="button"
                className="wb-btn-signup"
                onClick={onSignUpClick}
              >
                Sign Up
              </button>
            </>
          )}

          {/* Mobile Toggle */}
          <button
            type="button"
            className="wb-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="wb-mobile-menu">
          <ul className="wb-mobile-nav-links">
            <li>
              <button type="button" onClick={() => handleNavClick('features')}>
                Features
              </button>
            </li>
            <li>
              <button type="button" onClick={() => handleNavClick('about')}>
                About
              </button>
            </li>
          </ul>
          <div className="wb-mobile-actions">
            {isAuthenticated ? (
              <button
                type="button"
                className="wb-btn-workbench-nav"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onWorkbenchClick();
                }}
              >
                Open Workbench
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="wb-btn-login"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLoginClick();
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="wb-btn-signup"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignUpClick();
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
