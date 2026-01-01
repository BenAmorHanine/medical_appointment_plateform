export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  image: string;     
  rating: number;
  phone?: string;      
  available?: boolean; 
}
