export interface Availability {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedSlots: number;
 
}

export interface AvailabilitySlot {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    rating: number;
  };
  slots: Availability[];
}
export interface CreateAvailabilityDto {
  doctorId: string;
  date: string;     
  startTime: string; 
  endTime: string;
  capacity: number;
}