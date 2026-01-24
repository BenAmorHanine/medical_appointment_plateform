export interface User {
  id: string;
  username: string;
  email: string;
  role: 'doctor' | 'patient' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
