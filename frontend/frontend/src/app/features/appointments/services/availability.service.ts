import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AvailabilitySlot } from '../models/availability.interface';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private http = inject(HttpClient);
  private baseUrl = '/api/availability';

  availabilities = signal<AvailabilitySlot[]>([]);
  loading = signal(false);

  loadAvailabilities(doctorId?: string, date?: string) {
    this.loading.set(true);
    const params = new URLSearchParams();
    if (doctorId) params.set('doctorId', doctorId);
    if (date) params.set('date', date);

    this.http.get<AvailabilitySlot[]>(`${this.baseUrl}?${params.toString()}`)
      .subscribe({
        next: (data) => {
          this.availabilities.set(data);
          this.loading.set(false);
        }
      });
  }
}
