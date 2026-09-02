import React, { useState } from 'react';
import './account.css';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';
import { NavToggle } from '../common/NavToggle';

interface ProfileFormProps {
  initialName: string;
  initialUsername: string;
  email: string;
  onUpdate: (payload: { name: string; username: string; email: string }) => Promise<void>;
  isSaving: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialName,
  initialUsername,
  email,
  onUpdate,
  isSaving,
}) => {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);

  const isProfileChanged =
    (name.trim() !== initialName.trim() ||
      username.trim().toLowerCase() !== initialUsername.trim().toLowerCase()) &&
    name.trim().length > 0 &&
    username.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="wb-settings-form">
      <div className="wb-settings-form-fields">
        {/* Full Name */}
        <div className="wb-field-group">
          <label htmlFor="settings-fullname" className="wb-field-label">
            Full Name
          </label>
          <input
            id="settings-fullname"
            type="text"
            className="wb-field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>

        {/* Username */}
        <div className="wb-field-group">
          <label htmlFor="settings-username" className="wb-field-label">
            Username
          </label>
          <div className="wb-input-prefix-container">
            <span className="wb-input-prefix-adornment">@</span>
            <input
              id="settings-username"
              type="text"
              className="wb-field-input-prefixed"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
              placeholder="username"
              required
            />
          </div>
          <span className="wb-field-hint">Your unique username identifier across API Workbench.</span>
        </div>

        {/* Email Address */}
        <div className="wb-field-group">
          <div className="wb-field-label-row">
            <label htmlFor="settings-email" className="wb-field-label">
              Email Address
            </label>
            <span className="wb-field-badge-readonly" title="Email is verified and cannot be modified">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Read-only</span>
            </span>
          </div>
          <input
            id="settings-email"
            type="email"
            className="wb-field-input wb-field-input-disabled"
            value={email}
            disabled
            readOnly
            title="Email address is tied to your login authentication and cannot be changed."
          />
        </div>
      </div>

      <div className="wb-settings-form-actions">
        <button
          type="submit"
          className="wb-btn-settings-primary"
          disabled={isSaving || !isProfileChanged}
        >
          {isSaving ? (
            <>
              <span className="wb-btn-spinner" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
};

export const AccountSettingsPage: React.FC = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const initialCleanUsername = (user.username || '').replace(/^@/, '').toLowerCase().trim();
  const initialCleanName = (user.name || '').trim();

  const isPasswordReady =
    currentPassword.trim().length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length >= 6;

  const handleUpdateProfile = async (payload: { name: string; username: string; email: string }) => {
    if (!payload.name) {
      toast.warning('Full name cannot be empty.');
      return;
    }
    if (!payload.username) {
      toast.warning('Username cannot be empty.');
      return;
    }

    const confirmed = await confirm({
      title: 'Save Profile Changes',
      message: 'Are you sure you want to update your public profile information?',
      confirmText: 'Save Changes',
      cancelText: 'Cancel',
      variant: 'primary',
    });

    if (!confirmed) return;

    setIsSavingProfile(true);
    try {
      await updateProfile(payload);
      toast.success('Profile updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile details.';
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.warning('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('New passwords do not match.');
      return;
    }

    const confirmed = await confirm({
      title: 'Update Password',
      message: 'Are you sure you want to update your account password? You will use this new password next time you sign in.',
      confirmText: 'Update Password',
      cancelText: 'Cancel',
      variant: 'primary',
    });

    if (!confirmed) return;

    setIsSavingPassword(true);
    try {
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
      };

      await updateProfile(payload);
      toast.success('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      toast.error(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Permanently Delete Account',
      message: 'Are you sure you want to permanently delete your account and all associated workspace data?',
      details: 'This action is irreversible. All your saved APIs, mock endpoints, personal history, and test configurations will be permanently erased.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      variant: 'danger',
      requireInputText: 'DELETE',
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.info('Your account has been permanently deleted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account.';
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your API Workbench session?',
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
    <div className="wb-account-workspace">
      {/* Top Header Bar */}
      <header className="wb-account-header">
        <div className="wb-account-left-wrap">
          <NavToggle />
          <div className="wb-account-header-info">
            <div className="wb-account-title-meta">
              <h2 className="wb-account-title">Account Settings</h2>
              <p className="wb-account-subtitle">
                Manage your account credentials, security options, and workspace preferences.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="wb-btn-account-logout"
          onClick={handleLogoutClick}
          title="Sign out of your account"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Settings Container */}
      <div className="wb-account-body">
        <div className="wb-account-sections">

          {/* Section: Profile */}
          <section className="wb-account-section">
            <div className="wb-section-aside">
              <h3 className="wb-section-title">Profile Information</h3>
              <p className="wb-section-desc">
                Update your display name and public username identifier.
              </p>
            </div>

            <div className="wb-section-content">
              <ProfileForm
                key={`${user.id || 'user'}_${user.name}_${user.username}`}
                initialName={initialCleanName}
                initialUsername={initialCleanUsername}
                email={user.email || ''}
                onUpdate={handleUpdateProfile}
                isSaving={isSavingProfile}
              />
            </div>
          </section>

          {/* Section: Password Security */}
          <section className="wb-account-section">
            <div className="wb-section-aside">
              <h3 className="wb-section-title">Password & Security</h3>
              <p className="wb-section-desc">
                Update your authentication password to maintain account security.
              </p>
            </div>

            <div className="wb-section-content">
              <form onSubmit={handleUpdatePassword} className="wb-settings-form">
                <div className="wb-settings-form-fields">
                  <div className="wb-field-group">
                    <label htmlFor="settings-current-pwd" className="wb-field-label">
                      Current Password
                    </label>
                    <input
                      id="settings-current-pwd"
                      type="password"
                      className="wb-field-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="wb-field-group">
                    <label htmlFor="settings-new-pwd" className="wb-field-label">
                      New Password
                    </label>
                    <input
                      id="settings-new-pwd"
                      type="password"
                      className="wb-field-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                      autoComplete="new-password"
                    />
                    <span className="wb-field-hint">Must contain at least 6 characters.</span>
                  </div>

                  <div className="wb-field-group">
                    <label htmlFor="settings-confirm-pwd" className="wb-field-label">
                      Confirm New Password
                    </label>
                    <input
                      id="settings-confirm-pwd"
                      type="password"
                      className="wb-field-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="wb-settings-form-actions">
                  <button
                    type="submit"
                    className="wb-btn-settings-primary"
                    disabled={isSavingPassword || !isPasswordReady}
                  >
                    {isSavingPassword ? (
                      <>
                        <span className="wb-btn-spinner" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Section: Delete Account */}
          <section className="wb-account-section wb-account-section-danger">
            <div className="wb-section-aside">
              <h3 className="wb-section-title">Delete Account</h3>
              <p className="wb-section-desc">
                Permanently delete your account and all associated workspace resources.
              </p>
            </div>

            <div className="wb-section-content">
              <div className="wb-danger-box">
                <div className="wb-danger-box-text">
                  <h4 className="wb-danger-box-title">Delete this account</h4>
                  <p className="wb-danger-box-desc">
                    Once you delete your account, there is no going back. All saved APIs, mock endpoints, and test runs will be permanently deleted.
                  </p>
                </div>
                <button
                  type="button"
                  className="wb-btn-settings-danger"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="wb-btn-spinner" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Account</span>
                  )}
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="wb-account-footer">
          <div className="wb-account-footer-meta">
            <span>API Workbench</span>
            <span className="wb-footer-bullet">&bull;</span>
            <span>&copy; {new Date().getFullYear()} API Workbench. All rights reserved.</span>
          </div>
          <div className="wb-account-footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#security">Security</a>
            <a href="#docs">Documentation</a>
          </div>
        </footer>
      </div>
    </div>
  );
};
