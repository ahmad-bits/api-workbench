import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');

  // Profile Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Danger Zone States
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // Initialize form values from current user
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email);
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);
      setPasswordSuccessMsg(null);
      setPasswordErrorMsg(null);
      setDeleteErrorMsg(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDeleteConfirmText('');
    }
  }, [user, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!name.trim()) {
      setProfileErrorMsg('Full name cannot be empty.');
      return;
    }
    if (!username.trim()) {
      setProfileErrorMsg('Username cannot be empty.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username.trim())) {
      setProfileErrorMsg('Username must be 3-30 characters (letters, numbers, hyphens, underscores).');
      return;
    }
    if (!email.trim()) {
      setProfileErrorMsg('Email address cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
      });
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccessMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 4000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setDeleteErrorMsg('Please type DELETE to confirm permanent deletion.');
      return;
    }

    const confirmed = window.confirm(
      'Are you absolutely sure you want to permanently delete your account? All your Mock APIs will also be permanently deleted.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteErrorMsg(null);
    try {
      await deleteAccount();
      onClose();
    } catch (err: any) {
      setDeleteErrorMsg(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header with User Card */}
        <div className="modal-header profile-modal-header">
          <div className="profile-hero">
            <div className="profile-avatar-badge">
              <span className="avatar-initials">{initials}</span>
              <span className="online-indicator" title="Active session"></span>
            </div>
            <div className="profile-hero-info">
              <div className="profile-hero-name-row">
                <h2 className="modal-title">{user.name}</h2>
                <span className="badge-tag">@{user.username}</span>
              </div>
              <p className="profile-hero-email">{user.email}</p>
              <div className="profile-meta-pills">
                <span className="meta-pill">🗓️ Joined {memberSince}</span>
                <span className="meta-pill">🎭 Mock Base: /mock/{user.username}/</span>
                <span className="meta-pill status-active">● Active Session</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Profile Settings Navigation Tabs */}
        <div className="profile-nav-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile Details
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Password & Security
          </button>
          <button
            type="button"
            className={`profile-tab-btn danger-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            ⚠️ Danger Zone
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="profile-tab-content">
            {profileSuccessMsg && (
              <div className="auth-alert success">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="auth-alert error">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSavingProfile}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="profile-username">
                  Username
                </label>
                <span className="form-label-hint">Defines your public /mock/{username}/... path</span>
              </div>
              <input
                id="profile-username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSavingProfile}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">
                Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSavingProfile}
                required
              />
            </div>

            <div className="profile-actions-bar">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Password & Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="profile-tab-content">
            {passwordSuccessMsg && (
              <div className="auth-alert success">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{passwordSuccessMsg}</span>
              </div>
            )}
            {passwordErrorMsg && (
              <div className="auth-alert error">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="current-pw">
                Current Password
              </label>
              <input
                id="current-pw"
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="new-pw">
                  New Password
                </label>
                <span className="form-label-hint">Min. 6 characters</span>
              </div>
              <input
                id="new-pw"
                type="password"
                className="form-input"
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-new-pw">
                Confirm New Password
              </label>
              <input
                id="confirm-new-pw"
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
                required
              />
            </div>

            <div className="profile-actions-bar">
              <button
                type="submit"
                className="btn-primary"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Danger Zone */}
        {activeTab === 'danger' && (
          <div className="profile-tab-content danger-zone-container">
            {deleteErrorMsg && (
              <div className="auth-alert error">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <div className="danger-zone-card">
              <div className="danger-header">
                <div className="danger-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className="danger-title">Permanently Delete Account</h3>
                  <p className="danger-desc">
                    Once you delete your account, there is no going back. All your Mock APIs and profile records will be permanently removed from the system.
                  </p>
                </div>
              </div>

              <div className="danger-confirm-group">
                <label className="form-label" htmlFor="delete-confirm-input">
                  Type <strong style={{ color: '#ef4444' }}>DELETE</strong> to confirm:
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  className="form-input danger-input"
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleting}
                />
              </div>

              <div className="danger-actions-row">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                >
                  {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
                </button>
              </div>
            </div>

            <div className="logout-section">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
