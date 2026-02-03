import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Appointment, CreateAppointmentDto } from '../models/appointment.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;
  private http = inject(HttpClient);



getAppointmentsByRole(profileId: string, role: string): Observable<Appointment[]> {
  const rolePath = role.toLowerCase(); 
  return this.http.get<Appointment[]>(`${this.apiUrl}/${rolePath}/${profileId}`);
}

  /**
  getAppointmentsByDoctor(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}`, { withCredentials: true });
  }

  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`, { withCredentials: true });
  }
*/
  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl, { withCredentials: true });
  }

  createAppointment(dto: CreateAppointmentDto): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, dto, { withCredentials: true });
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  updateAppointmentDetails(id: string, formData: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, formData);
  }

  markAsDone(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/done`, {}, { withCredentials: true });
  }

}
export { Appointment } from '../models/appointment.interface';
