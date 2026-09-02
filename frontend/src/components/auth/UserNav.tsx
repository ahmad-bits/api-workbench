import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

interface UserNavProps {
  onOpenProfileModal?: () => void;
}

export const UserNav: React.FC<UserNavProps> = ({ onOpenProfileModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const handleSignOut = async () => {
    setDropdownOpen(false);
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your account?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'primary',
    });
    if (confirmed) {
      logout();
      toast.info('You have been signed out.');
      navigate('/');
    }
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    if (onOpenProfileModal) {
      onOpenProfileModal();
    } else {
      navigate('/settings');
    }
  };

  return (
    <div className="user-nav-container" ref={dropdownRef}>
      <button
        type="button"
        className={`user-nav-badge ${dropdownOpen ? 'active' : ''}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="Open Account Menu"
        aria-expanded={dropdownOpen}
      >
        <div className="user-avatar-chip">
          <span>{initials}</span>
          <span className="user-online-dot"></span>
        </div>
        <div className="user-nav-text-col">
          <span className="user-display-name">{user.name}</span>
        </div>
        <svg
          className={`user-chevron ${dropdownOpen ? 'rotate' : ''}`}
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-header">
            <div className="user-dropdown-name">{user.name}</div>
            <div className="user-dropdown-email">{user.email}</div>
          </div>

          <div className="user-dropdown-divider"></div>

          <button
            type="button"
            className="user-dropdown-item"
            onClick={handleSettingsClick}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.85rem', background: 'none', border: 'none', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', textAlign: 'left' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Account Settings</span>
          </button>

          <div className="user-dropdown-divider"></div>

          <button
            type="button"
            className="user-dropdown-item signout-item"
            onClick={handleSignOut}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
