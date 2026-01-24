// src/app/features/dashboard/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalConsultations: number;
}

interface DashboardUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private baseUrl = 'http://localhost:3000/dashboard'; // replace with environment.apiUrl if needed

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  getUsers(): Observable<DashboardUser[]> {
    return this.http.get<DashboardUser[]>(`${this.baseUrl}/users`);
  }

  changeUserRole(userId: string, role: string): Observable<DashboardUser> {
    return this.http.patch<DashboardUser>(`${this.baseUrl}/users/${userId}/role`, { role });
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/users/${userId}`);
  }
}
