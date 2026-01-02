export interface Availability {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  isAvailable: boolean;
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
