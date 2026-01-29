import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;

  loading = signal(false);
  error = signal<string | null>(null);
  appointments = signal<Appointment[]>([]);

  constructor(private http: HttpClient) {}

  getAppointmentsByDoctor(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}`, { withCredentials: true });
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl, { withCredentials: true });
  }

  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`, { withCredentials: true });
  }

  createAppointment(dto: any): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, dto, { withCredentials: true });
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  markAsDone(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/done`, {}, { withCredentials: true });
  }

  loadAppointmentsForPatient(patientId: string) {
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
export { Appointment } from '../models/appointment.interface';
