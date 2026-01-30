export interface Appointment {
  id: string;
  patientId: string;
  availabilityId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'reserved' | 'cancelled' | 'done' | 'RESERVED' | 'CANCELLED' | 'DONE'; // Backend renvoie en minuscules
  doctorId: string;
  createdAt: string;
  patientNote?: string;   
  documentUrl?: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  availabilityId: string;
}

export interface UpdateAppointmentDto {
  status: 'cancelled';
}
