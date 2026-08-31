import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
}) => {
  const navigate = useNavigate();
  const { login, requestOtp, verifyOtp, resendOtp, error: authError, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);

  // Sync mode if initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
    setRegisterStep('form');
    setForgotPasswordStep('form');
    setOtp('');
    setResetToken('');
    setLocalError(null);
    setSuccessInfo(null);
    clearError();
  }, [initialMode, clearError]);

  // Step 1: 'form' | Step 2: 'verify' (for registration)
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'form' | 'verify' | 'reset'>('form');
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

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot_password') => {
    setMode(newMode);
    setRegisterStep('form');
    setForgotPasswordStep('form');
    setOtp('');
    setResetToken('');
    setLocalError(null);
    setSuccessInfo(null);
    clearError();
  };



  // Step 1: Initiate registration and send OTP
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
      setLocalError('Please choose a unique username.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username.trim())) {
      setLocalError('Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.');
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
      setLocalError(err.message || 'Failed to initiate registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP and create account
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
    } catch (err: any) {
      setLocalError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
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
      setLocalError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  // Forgot Password flow handlers
  const handleForgotPasswordClick = () => {
    if (!usernameOrEmail.trim()) {
      setLocalError('Please enter your username or email address above first to reset your password.');
      return;
    }
    setLocalError(null);
    clearError();
    handleSwitchMode('forgot_password');
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
        handleSwitchMode('login');
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

  // Login handler
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
    } catch (err: any) {
      setLocalError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="wb-auth-page-root">


      {/* 2-Column Split Modal Card matching Figma Design */}
      <div className="wb-auth-card-split">
        {/* Left Column: Branding, Decorative Circles, Code Preview, Headline */}
        <div className="wb-auth-left-col">
          {/* Decorative Concentric Rings */}
          <div className="wb-auth-circle-bg">
            <div className="wb-auth-circle-ring ring-1" />
            <div className="wb-auth-circle-ring ring-2" />
            <div className="wb-auth-circle-ring ring-3" />
          </div>

          {/* Top Brand Info */}
          <div
            className="wb-auth-brand-box"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="wb-auth-brand-logo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#1860ec" />
                <path
                  d="M7 8.5L11 12L7 15.5"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="13"
                  y1="16"
                  x2="17"
                  y2="16"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="wb-auth-brand-name">API Workbench</span>
          </div>

          {/* Middle Floating Code Mockup */}
          <div className="wb-auth-middle-graphic">
            <div className="wb-auth-code-card">
              <div className="wb-code-req-line">GET /v1/users/profile</div>
              <div className="wb-code-auth-line">Authorization: Bearer ***</div>
              <div className="wb-code-body-line">&#123;</div>
              <div className="wb-code-body-line" style={{ paddingLeft: '0.65rem' }}>
                <span style={{ color: '#0284c7' }}>"status"</span>: <span style={{ color: '#15803d' }}>"success"</span>,
              </div>
              <div className="wb-code-body-line" style={{ paddingLeft: '0.65rem' }}>
                <span style={{ color: '#0284c7' }}>"data"</span>: &#123;
              </div>
              <div className="wb-code-body-line" style={{ paddingLeft: '1.25rem' }}>
                <span style={{ color: '#0284c7' }}>"role"</span>: <span style={{ color: '#15803d' }}>"engineer"</span>
              </div>
              <div className="wb-code-body-line" style={{ paddingLeft: '0.65rem' }}>&#125;</div>
              <div className="wb-code-body-line">&#125;</div>
            </div>
          </div>

          {/* Bottom Headline & Tagline */}
          <div className="wb-auth-bottom-content">
            <h2 className="wb-auth-main-headline">
              Build faster,
              <br />
              scale better.
            </h2>
            <p className="wb-auth-sub-description">
              The ultimate toolset for designing, testing, and managing your APIs in a high-performance environment.
            </p>
          </div>
        </div>

        {/* Right Column: Form (Login, Register, OTP) */}
        <div className="wb-auth-right-col">
          {/* Header */}
          <div className="wb-auth-form-header">
            <h1 className="wb-auth-form-title">
              {mode === 'login'
                ? 'Welcome back'
                : mode === 'forgot_password'
                ? 'Reset Password'
                : registerStep === 'verify'
                ? 'Verify Email'
                : 'Create an account'}
            </h1>
            <p className="wb-auth-form-subtitle">
              {mode === 'login'
                ? 'Sign in to access your workspace.'
                : mode === 'forgot_password'
                ? 'Recover access to your account'
                : registerStep === 'verify'
                ? `Enter the code sent to ${email}`
                : 'Sign up to start building and testing APIs.'}
            </p>
          </div>

          {/* Alerts */}
          {displayedError && (
            <div className="wb-auth-alert error">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{displayedError}</span>
            </div>
          )}

          {successInfo && !displayedError && (
            <div className="wb-auth-alert success">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successInfo}</span>
            </div>
          )}

          {/* VIEW 1: Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="wb-auth-form">
              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="login-email">
                  Email
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="login-email"
                    type="text"
                    className="wb-auth-input"

                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    autoComplete="username"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="wb-auth-field">
                <div className="wb-auth-label-row">
                  <label className="wb-auth-label" htmlFor="login-password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="wb-auth-forgot-link"
                    onClick={handleForgotPasswordClick}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="wb-auth-input"

                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="wb-auth-eye-btn"
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
                className="wb-auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <div className="wb-auth-switch-text">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="wb-auth-switch-link"
                  onClick={() => handleSwitchMode('register')}
                >
                  Sign up
                </button>
              </div>


            </form>
          )}

          {/* VIEW 2: Sign Up (Register Step 1) */}
          {mode === 'register' && registerStep === 'form' && (
            <form onSubmit={handleInitiateRegistration} className="wb-auth-form">
              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="reg-name">
                  Full Name
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="reg-name"
                    type="text"
                    className="wb-auth-input"

                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="reg-username">
                  Username
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="reg-username"
                    type="text"
                    className="wb-auth-input"

                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="reg-email">
                  Email Address
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="reg-email"
                    type="email"
                    className="wb-auth-input"

                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="reg-password">
                  Password
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="wb-auth-input"

                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="reg-confirm-password">
                  Confirm Password
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="wb-auth-input"

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
                className="wb-auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Sending code...</span>
                ) : (
                  <>
                    <span>Continue → Verify Email</span>
                  </>
                )}
              </button>

              <div className="wb-auth-switch-text">
                Already have an account?{' '}
                <button
                  type="button"
                  className="wb-auth-switch-link"
                  onClick={() => handleSwitchMode('login')}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: OTP Verification Screen */}
          {mode === 'register' && registerStep === 'verify' && (
            <div className="wb-otp-box">
              <div className="wb-otp-badge">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Email Verification</span>
              </div>

              <form onSubmit={handleVerifyOtp} className="wb-auth-form">
                <div className="wb-auth-field">
                  <label className="wb-auth-label" htmlFor="otp-input" style={{ textAlign: 'center' }}>
                    Enter 6-Digit Code
                  </label>
                  <input
                    id="otp-input"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="wb-otp-digit-input"
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

                <button
                  type="submit"
                  className="wb-auth-submit-btn"
                  disabled={isSubmitting || otp.length < 6}
                >
                  {isSubmitting ? (
                    <span>Verifying...</span>
                  ) : (
                    <span>Verify & Create Account →</span>
                  )}
                </button>
              </form>

              <div className="wb-otp-actions">
                <button
                  type="button"
                  className="wb-otp-link"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                >
                  {isResending ? (
                    'Resending...'
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend Code'
                  )}
                </button>

                <span>•</span>

                <button
                  type="button"
                  className="wb-otp-link"
                  onClick={() => {
                    setRegisterStep('form');
                    setLocalError(null);
                    setSuccessInfo(null);
                    clearError();
                  }}
                >
                  Change Email
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: Forgot Password - Request OTP */}
          {mode === 'forgot_password' && forgotPasswordStep === 'form' && (
            <div className="wb-auth-form">
              <div className="wb-auth-field" style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ color: '#8b949e', marginBottom: '16px', fontSize: '14px' }}>
                  We will send a password reset code to the email associated with:
                </p>
                <div style={{ padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', fontWeight: 'bold' }}>
                  {usernameOrEmail}
                </div>
              </div>

              <button
                type="button"
                className="wb-auth-submit-btn"
                onClick={handleInitiateForgotPassword}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Sending Code...</span>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
              
              <div className="wb-auth-switch-text" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="wb-auth-switch-link"
                  onClick={() => handleSwitchMode('login')}
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* VIEW 5: Forgot Password - Verify OTP */}
          {mode === 'forgot_password' && forgotPasswordStep === 'verify' && (
            <div className="wb-otp-box">
              <div className="wb-otp-badge">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Password Reset Verification</span>
              </div>

              <form onSubmit={handleVerifyForgotPasswordOtp} className="wb-auth-form">
                <div className="wb-auth-field">
                  <label className="wb-auth-label" htmlFor="forgot-otp-input" style={{ textAlign: 'center' }}>
                    Enter 6-Digit Code
                  </label>
                  <input
                    id="forgot-otp-input"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="wb-otp-digit-input"
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

                <button
                  type="submit"
                  className="wb-auth-submit-btn"
                  disabled={isSubmitting || otp.length < 6}
                >
                  {isSubmitting ? (
                    <span>Verifying...</span>
                  ) : (
                    <span>Verify Code &rarr;</span>
                  )}
                </button>
              </form>

              <div className="wb-otp-actions">
                <button
                  type="button"
                  className="wb-otp-link"
                  onClick={handleResendForgotPasswordOtp}
                  disabled={resendCooldown > 0 || isResending}
                >
                  {isResending ? (
                    'Resending...'
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend Code'
                  )}
                </button>
                <span>•</span>
                <button
                  type="button"
                  className="wb-otp-link"
                  onClick={() => {
                    setForgotPasswordStep('form');
                    setLocalError(null);
                    setSuccessInfo(null);
                    clearError();
                  }}
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* VIEW 6: Forgot Password - Reset Password */}
          {mode === 'forgot_password' && forgotPasswordStep === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="wb-auth-form">
              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="reset-new-password">
                  New Password
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="wb-auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="wb-auth-eye-btn"
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

              <div className="wb-auth-field">
                <label className="wb-auth-label" htmlFor="reset-confirm-password">
                  Confirm New Password
                </label>
                <div className="wb-auth-input-wrapper">
                  <input
                    id="reset-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="wb-auth-input"
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
                className="wb-auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <span>Save New Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
