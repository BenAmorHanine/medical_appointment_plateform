export type UserGender = 'male' | 'female' | 'unknown';
export interface PatientProfile {
  id: string;
  age?: number;
  phone?: string;
  gender?: UserGender;
  medicalRecordNumber: string;
  address?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}