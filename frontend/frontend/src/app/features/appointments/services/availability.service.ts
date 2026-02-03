import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,switchMap } from 'rxjs'; 
import { Availability } from '../models/availability.interface';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/availabilities`;
  private profileUrl = `${environment.apiUrl}/doctor-profiles`;

  getAvailabilitiesByUserId(userId: string): Observable<Availability[]> {
    return this.http.get<any>(`${this.profileUrl}/user/${userId}`).pipe(
      switchMap(profile => this.http.get<Availability[]>(`${this.baseUrl}/doctor/${profile.id}`))
    );
  }

  loadAvailabilitiesForDoctor(doctorId: string): Observable<Availability[]> { 
    return this.http.get<Availability[]>(`${this.baseUrl}/doctor/${doctorId}`);
  }


  getDoctorProfile(userId: string): Observable<any> {
    return this.http.get<any>(`${this.profileUrl}/user/${userId}`);
  }

  createAvailability(dto: any): Observable<Availability> {
    return this.http.post<Availability>(this.baseUrl, dto);
  }

  deleteAvailability(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
