export interface DoctorPatientItem {
  patientId: string;
  fullName: string;
  visits: number;
  lastVisit: string;
}

export interface DoctorPatientsResponse {
  data: DoctorPatientItem[];
  page: number;
  limit: number;
  total: number;
}
