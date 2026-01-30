import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'; 
import { Availability } from '../models/availability.interface';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/availabilities`;

  availabilities = signal<Availability[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  loadAvailabilitiesForDoctor(doctorId: string): Observable<Availability[]> { 
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<Availability[]>(`${this.baseUrl}/doctor/${doctorId}`);
  }

createAvailability(dto: { 
  doctorId: string; 
  date: string; 
  startTime: string; 
  endTime: string; 
  capacity: number; 
}): Observable<Availability> {
  return this.http.post<Availability>(this.baseUrl, dto);
}


  deleteAvailability(id: string): Observable<void> {  
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
