import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, requestOtp, verifyOtp, resendOtp, error: authError, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'form' | 'verify' | 'reset'>('form');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus OTP input when switching to verify step
  useEffect(() => {
    if (registerStep === 'verify' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [registerStep]);

  // Reset mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRegisterStep('form');
      setOtp('');
      setLocalError(null);
      setSuccessInfo(null);
      clearError();
    }
  }, [isOpen, initialMode, clearError]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTabSwitch = (newMode: 'login' | 'register' | 'forgot_password') => {
    setMode(newMode);
    setRegisterStep('form');
    setForgotPasswordStep('form');
    setOtp('');
    setResetToken('');
    setLocalError(null);
    setSuccessInfo(null);
    clearError();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!usernameOrEmail.trim()) {
      setLocalError('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        username_or_email: usernameOrEmail.trim(),
        password,
      });
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessInfo(null);
    clearError();

    if (!name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!username.trim()) {
      setLocalError('Please enter a username.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username.trim())) {
      setLocalError('Username must be 3-30 characters (letters, numbers, hyphens, underscores).');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await requestOtp({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });
      setRegisterStep('verify');
      setResendCooldown(resp.resend_cooldown_seconds || 60);
      setSuccessInfo(`Verification code sent to ${resp.email}.`);
    } catch (err: any) {
      setLocalError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }
    if (cleanOtp.length < 6) {
      setLocalError('Verification code must be 6 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), cleanOtp);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setLocalError(null);
    setSuccessInfo(null);
    clearError();
    setIsResending(true);

    try {
      const resp = await resendOtp(email.trim().toLowerCase());
      setResendCooldown(resp.resend_cooldown_seconds || 60);
      setSuccessInfo(`A fresh verification code has been sent to ${email}.`);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPasswordClick = () => {
    if (!usernameOrEmail.trim()) {
      setLocalError('Please enter your username or email address above first to reset your password.');
      return;
    }
    setLocalError(null);
    clearError();
    handleTabSwitch('forgot_password');
  };

  const handleInitiateForgotPassword = async () => {
    setLocalError(null);
    setSuccessInfo(null);
    clearError();
    setIsSubmitting(true);
    try {
      const resp = await api.requestPasswordResetOtp(usernameOrEmail);
      setEmail(resp.email);
      setForgotPasswordStep('verify');
      setResendCooldown(resp.resend_cooldown_seconds || 60);
      setSuccessInfo(`Verification code sent to ${resp.email}.`);
    } catch (err: any) {
      setLocalError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setLocalError('Verification code must be 6 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await api.verifyPasswordResetOtp(email, cleanOtp);
      setResetToken(resp.reset_token);
      setForgotPasswordStep('reset');
      setSuccessInfo(resp.message);
      setOtp('');
    } catch (err: any) {
      setLocalError(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await api.resetPassword(email, resetToken, password);
      setSuccessInfo(resp.message);
      setTimeout(() => {
        handleTabSwitch('login');
      }, 2500);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendForgotPasswordOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setLocalError(null);
    setSuccessInfo(null);
    clearError();
    setIsResending(true);

    try {
      const resp = await api.resendPasswordResetOtp(email);
      setResendCooldown(resp.resend_cooldown_seconds || 60);
      setSuccessInfo(`A fresh verification code has been sent to ${resp.email}.`);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="auth-header-title-group">
            <div className="auth-header-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="modal-title">
                {mode === 'login'
                  ? 'Welcome Back'
                  : mode === 'forgot_password'
                  ? 'Reset Password'
                  : registerStep === 'verify'
                  ? 'Verify Your Email'
                  : 'Create an Account'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'login'
                  ? 'Sign in to access your secure API developer environment'
                  : mode === 'forgot_password'
                  ? 'Recover access to your account'
                  : registerStep === 'verify'
                  ? `Enter the 6-digit code sent to ${email}`
                  : 'Get started with powerful API testing and mock servers'}
              </p>
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

        {/* Tab Switcher (Visible when not in verify step and not in forgot password) */}
        {mode !== 'forgot_password' && registerStep === 'form' && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Alert */}
        {displayedError && (
          <div className="auth-alert error">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{displayedError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successInfo && !displayedError && (
          <div className="auth-alert success" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successInfo}</span>
          </div>
        )}

        {/* VIEW 1: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="auth-identifier">
                Username or Email
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="auth-identifier"
                  type="text"
                  className="form-input"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  autoComplete="username"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="auth-password">
                  Password
                </label>
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={handleForgotPasswordClick}
                  style={{ fontSize: '12px' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* VIEW 2: Register Step 1 Form */}
        {mode === 'register' && registerStep === 'form' && (
          <form onSubmit={handleInitiateRegistration} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="register-name">
                Full Name
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="register-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="register-username">
                  Unique Username
                </label>
                <span className="form-label-hint">/mock/username/...</span>
              </div>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                </svg>
                <input
                  id="register-username"
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-email">
                Email Address
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="register-email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="register-password">
                  Password
                </label>
                <span className="form-label-hint">Min. 6 characters</span>
              </div>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm-password">
                Confirm Password
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <span>Continue &rarr; Verify Email</span>
              )}
            </button>
          </form>
        )}

        {/* VIEW 3: Register Step 2 Verify OTP */}
        {mode === 'register' && registerStep === 'verify' && (
          <div className="otp-verification-container">
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="modal-otp-input" style={{ textAlign: 'center', display: 'block' }}>
                  Enter 6-Digit Verification Code
                </label>
                <div className="otp-input-wrapper">
                  <input
                    id="modal-otp-input"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="otp-digit-input"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(val);
                      if (localError) setLocalError(null);
                    }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <span className="otp-expiry-hint">
                  ⏱️ Code expires in 10 minutes
                </span>
              </div>

              <button
                type="submit"
                className="btn-auth-submit"
                disabled={isSubmitting || otp.length < 6}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    <span>Verifying Code & Creating Account...</span>
                  </>
                ) : (
                  <span>Verify Email & Create Account</span>
                )}
              </button>
            </form>

            <div className="otp-actions-row">
              <button
                type="button"
                className="btn-link-action"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
              >
                {isResending ? (
                  'Resending code...'
                ) : resendCooldown > 0 ? (
                  <span>Resend code in <strong>{resendCooldown}s</strong></span>
                ) : (
                  '🔄 Resend Code'
                )}
              </button>

              <span className="action-separator">&bull;</span>

              <button
                type="button"
                className="btn-link-action"
                onClick={() => {
                  setRegisterStep('form');
                  setLocalError(null);
                  setSuccessInfo(null);
                  clearError();
                }}
              >
                ✏️ Edit Info
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: Forgot Password - Request OTP */}
        {mode === 'forgot_password' && forgotPasswordStep === 'form' && (
          <div className="auth-form">
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ color: '#8b949e', marginBottom: '16px' }}>
                We will send a password reset code to the email associated with:
              </p>
              <div style={{ padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', fontWeight: 'bold' }}>
                {usernameOrEmail}
              </div>
            </div>

            <button
              type="button"
              className="btn-auth-submit"
              onClick={handleInitiateForgotPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Send Verification Code</span>
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => handleTabSwitch('login')}
              >
                &larr; Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: Forgot Password - Verify OTP */}
        {mode === 'forgot_password' && forgotPasswordStep === 'verify' && (
          <div className="otp-verification-container">
            <form onSubmit={handleVerifyForgotPasswordOtp} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-otp-input" style={{ textAlign: 'center', display: 'block' }}>
                  Enter 6-Digit Verification Code
                </label>
                <div className="otp-input-wrapper">
                  <input
                    id="forgot-otp-input"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="otp-digit-input"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(val);
                      if (localError) setLocalError(null);
                    }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <span className="otp-expiry-hint">
                  ⏱️ Code expires in 10 minutes
                </span>
              </div>

              <button
                type="submit"
                className="btn-auth-submit"
                disabled={isSubmitting || otp.length < 6}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify Code</span>
                )}
              </button>
            </form>

            <div className="otp-actions-row">
              <button
                type="button"
                className="btn-link-action"
                onClick={handleResendForgotPasswordOtp}
                disabled={resendCooldown > 0 || isResending}
              >
                {isResending ? (
                  'Resending code...'
                ) : resendCooldown > 0 ? (
                  <span>Resend code in <strong>{resendCooldown}s</strong></span>
                ) : (
                  '🔄 Resend Code'
                )}
              </button>

              <span className="action-separator">&bull;</span>

              <button
                type="button"
                className="btn-link-action"
                onClick={() => {
                  setForgotPasswordStep('form');
                  setLocalError(null);
                  setSuccessInfo(null);
                  clearError();
                }}
              >
                &larr; Back
              </button>
            </div>
          </div>
        )}

        {/* VIEW 6: Forgot Password - Reset Password */}
        {mode === 'forgot_password' && forgotPasswordStep === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="auth-form">
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="reset-new-password">
                  New Password
                </label>
                <span className="form-label-hint">Min. 6 characters</span>
              </div>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm-password">
                Confirm New Password
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save New Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
