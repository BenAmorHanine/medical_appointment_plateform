export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'doctor' | 'patient';
}
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetVerify {
  email: string;
  code: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface PasswordResetResponse {
  token?: string;
  message: string;
}