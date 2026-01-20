import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.interface';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/appointments';

  loading = signal(false);
  error = signal<string | null>(null);
  appointments = signal<Appointment[]>([]);

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

  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
  console.log('🔍 Appel API patientId:', patientId); // DEBUG
  return this.http.get<Appointment[]>(`${this.apiUrl}?patientId=${patientId}`);
}


  createAppointment(dto: any): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, dto);
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.apiUrl}/${id}`);
  }

  loadAppointmentsForPatient(patientId: string) {
    console.log('🔍 Loading patient appointments for:', patientId);
    this.loading.set(true);
    this.getAppointmentsByPatient(patientId).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error loading appointments');
        this.loading.set(false);
      }
    });
  }
}
export { Appointment };

