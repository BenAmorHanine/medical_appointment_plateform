export interface Appointment {
  id: string;
  patientId: string;
  availabilityId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'reserved' | 'cancelled' | 'done';
  doctorId: string;
  createdAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  availabilityId: string;
}

export interface UpdateAppointmentDto {
  status: 'cancelled';
}
