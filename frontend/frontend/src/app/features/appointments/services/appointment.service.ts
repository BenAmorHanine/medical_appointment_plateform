import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  patientId: string;
  availabilityId: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/appointments';

  constructor(private http: HttpClient) {}

  getAppointmentsByDoctor(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }
}

