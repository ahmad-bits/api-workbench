import React, { useState, useEffect } from 'react';
import './account.css';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

export const AccountSettingsPage: React.FC = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      toast.warning('Full name cannot be empty.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username cannot be empty.');
      toast.warning('Username cannot be empty.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email address cannot be empty.');
      toast.warning('Email address cannot be empty.');
      return;
    }

    if (showPasswordSection) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password to set a new password.');
        toast.warning('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        toast.warning('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match.');
        toast.warning('New passwords do not match.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
      };

      if (showPasswordSection && newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      await updateProfile(payload);
      setSuccessMsg('Account details saved successfully!');
      toast.success('Account profile updated successfully!');
      setIsEditing(false);
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update account details.');
      toast.error(err.message || 'Failed to update account details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Delete Account',
      message: 'Are you sure you want to permanently delete your account?',
      details: 'This action cannot be undone. All your saved APIs, mock endpoints, and personal workspace configurations will be permanently removed.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      variant: 'danger',
      requireInputText: 'DELETE',
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.info('Your account has been deleted.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  const handleLogoutClick = async () => {
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
    }
  };

  return (
    <div className="wb-account-root">
      {/* 1. Top Header: Title + Subtitle + Logout Button */}
      <header className="wb-account-topbar">
        <div className="wb-account-title-block">
          <h2 className="wb-account-heading">Account Settings</h2>
          <p className="wb-account-subheading">Manage your profile, preferences, and security settings.</p>
        </div>

        <button
          type="button"
          className="wb-btn-logout-pill"
          onClick={handleLogoutClick}
          title="Sign out of API Workbench"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </header>

      {/* 2. Main Content Viewport (2-Column Grid) */}
      <div className="wb-account-content-viewport">
        <div>
          {successMsg && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                maxWidth: '1150px',
                margin: '0 auto 1.5rem auto',
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                maxWidth: '1150px',
                margin: '0 auto 1.5rem auto',
              }}
            >
              ⚠ {errorMsg}
            </div>
          )}

          <div className="wb-account-grid">
            {/* Profile Details & Danger Zone */}
            <div className="wb-account-left-col">
              {/* Profile Details Card */}
              <div className="wb-profile-card">
                <div className="wb-profile-card-header">
                  <h3 className="wb-profile-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1860ec" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Profile Details</span>
                  </h3>

                  <button
                    type="button"
                    className="wb-btn-edit-toggle"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit'}
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Full Name Row */}
                  <div className="wb-field-block">
                    <label className="wb-field-lbl">Full Name</label>
                    <input
                      type="text"
                      className="wb-field-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  {/* Username Row */}
                  <div className="wb-field-block">
                    <label className="wb-field-lbl">Username</label>
                    <input
                      type="text"
                      className="wb-field-input"
                      value={username.startsWith('@') ? username : `@${username}`}
                      onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  {/* Email Address Row */}
                  <div className="wb-field-block">
                    <label className="wb-field-lbl">Email Address</label>
                    <input
                      type="email"
                      className="wb-field-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={true}
                      readOnly
                      title="Your email address cannot be changed."
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                      required
                    />
                  </div>

                  {/* Change Password Toggle */}
                  {isEditing && (
                    <div style={{ paddingTop: '0.25rem' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1860ec',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                      >
                        {showPasswordSection ? '▲ Hide Password Change' : '▼ Change Account Password'}
                      </button>
                    </div>
                  )}

                  {/* Password Form Fields */}
                  {isEditing && showPasswordSection && (
                    <div className="wb-password-section">
                      <div className="wb-field-block">
                        <label className="wb-field-lbl">Current Password</label>
                        <input
                          type="password"
                          className="wb-field-input"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>

                      <div className="wb-field-block">
                        <label className="wb-field-lbl">New Password</label>
                        <input
                          type="password"
                          className="wb-field-input"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>

                      <div className="wb-field-block">
                        <label className="wb-field-lbl">Confirm New Password</label>
                        <input
                          type="password"
                          className="wb-field-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  {isEditing && (
                    <button
                      type="submit"
                      className="wb-btn-save-profile"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  )}
                </form>
              </div>

              {/* Danger Zone Section */}
              <div className="wb-danger-zone-wrap">
                <div className="wb-danger-card">
                  <div className="wb-danger-info">
                    <h4 className="wb-danger-title">Delete Account</h4>
                    <p className="wb-danger-subtitle">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="wb-btn-danger-pill"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="wb-account-page-footer">
          <div>
            <strong>API Workbench</strong> &bull; &copy; {new Date().getFullYear()} API Workbench. All rights reserved.
          </div>
          <div className="wb-footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#security">Security</a>
            <a href="#status">Status</a>
          </div>
        </footer>
      </div>
    </div>
  );
};
