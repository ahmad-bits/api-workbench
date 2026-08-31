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
        {/* Brand Logo */}
        <button
          type="button"
          className="wb-brand-link"
          onClick={() => handleNavClick('hero')}
          aria-label="API Workbench Home"
        >
          <div className="wb-brand-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.2C12 7.6 7.6 12 2.2 12C7.6 12 12 16.4 12 21.8C12 16.4 16.4 12 21.8 12C16.4 12 12 7.6 12 2.2Z"
                fill="#1860ec"
              />
              <circle cx="12" cy="12" r="2" fill="#ffffff" />
            </svg>
          </div>
          <span className="wb-brand-text">API Workbench</span>
        </button>

        {/* Center Navigation Links */}
        <nav className="wb-header-nav" aria-label="Main Navigation">
          <ul className="wb-nav-links">
            <li className="wb-nav-item">
              <button type="button" onClick={() => handleNavClick('features')}>
                Features
              </button>
            </li>
            <li className="wb-nav-item">
              <button type="button" onClick={() => handleNavClick('how-it-works')}>
                How It Works
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
              <span>{userName ? `Open Workbench (${userName})` : 'Open Workbench'}</span>
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
              <button type="button" onClick={() => handleNavClick('how-it-works')}>
                How It Works
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
