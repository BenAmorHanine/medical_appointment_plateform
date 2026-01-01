export interface User {
  id: string;
  username: string;
  email: string;
  role: 'doctor' | 'patient';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
