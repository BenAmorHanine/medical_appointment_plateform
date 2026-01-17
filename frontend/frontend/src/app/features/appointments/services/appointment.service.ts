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
    return this.http.get<Appointment[]>(`${this.apiUrl}?patientId=${patientId}`);
  }

  createAppointment(dto: any): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, dto);
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.apiUrl}/${id}`);
  }

  loadAppointmentsForPatient(patientId: string) {
    this.loading.set(true);
    /*this.getAppointmentsByPatient(patientId).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erreur chargement RDV');
        this.loading.set(false);
      }
    });
  }*/
 //
  const mockRDV: Appointment[] = [
    {
      id: '1',
      patientId: patientId,
      availabilityId: 'slot-001',
      appointmentDate: '2026-01-03',
      startTime: '09:00',
      endTime: '10:00',
      status: 'reserved' as const,
      doctorId: 'Dr House',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      patientId: patientId,
      availabilityId: 'slot-002',
      appointmentDate: '2026-01-05',
      startTime: '14:30',
      endTime: '15:30',
      status: 'reserved' as const,
      doctorId: 'Dr Jenni',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      patientId: patientId,
      availabilityId: 'slot-003',
      appointmentDate: '2026-01-07',
      startTime: '11:00',
      endTime: '12:00',
      status: 'cancelled' as const,
      doctorId: 'Dr Morco',
      createdAt: new Date().toISOString()
    }
  ];

  setTimeout(() => {
    this.appointments.set(mockRDV);
    this.loading.set(false);
  }, 1500);
}
}
export { Appointment };

