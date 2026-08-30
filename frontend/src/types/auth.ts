export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username_or_email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface UserProfileUpdateData {
  name?: string;
  username?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}

export interface DeleteAccountResponse {
  message: string;
  user_id: number;
}

export interface OtpInitiateResponse {
  message: string;
  email: string;
  resend_cooldown_seconds: number;
  expires_in_minutes: number;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface OtpResendRequest {
  email: string;
}

export interface OtpResendResponse {
  message: string;
  email: string;
  resend_cooldown_seconds: number;
  expires_in_minutes: number;
}

