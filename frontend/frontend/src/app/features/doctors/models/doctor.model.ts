export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  avatar?: string;
  rating: number;
  available: boolean;
}
