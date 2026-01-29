export interface Doctor {
  id: number;
  specialty: string;
  image: string;
  rating: number;
  available?: boolean;
  consultationFee: number;
  consultationDuration: number;
  office: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };


}
