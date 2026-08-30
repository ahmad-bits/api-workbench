import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface UserNavProps {
  onOpenProfileModal: () => void;
}

export const UserNav: React.FC<UserNavProps> = ({ onOpenProfileModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
          <span className="user-nav-handle">@{user.username}</span>
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
            <div className="user-dropdown-handle-sub">@{user.username} &bull; {user.email}</div>
          </div>

          <div className="user-dropdown-divider"></div>

          <button
            type="button"
            className="user-dropdown-item"
            onClick={() => {
              setDropdownOpen(false);
              onOpenProfileModal();
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Account Settings & Profile</span>
          </button>

          <div className="user-dropdown-divider"></div>

          <button
            type="button"
            className="user-dropdown-item signout-item"
            onClick={() => {
              setDropdownOpen(false);
              logout();
            }}
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
