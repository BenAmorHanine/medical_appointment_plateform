import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Doctor } from '../models/doctor.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DoctorsService {
  private apiUrl = `${environment.apiUrl}/doctor-profiles`;
  private doctorsCache = new BehaviorSubject<Doctor[]>([]);
  private featuredCache = new BehaviorSubject<Doctor[]>([]);

  constructor(private http: HttpClient) {}

  getDoctors(specialty?: string): Observable<Doctor[]> {
    const url = specialty ? `${this.apiUrl}?specialty=${encodeURIComponent(specialty)}` : this.apiUrl;
    return this.http.get<Doctor[]>(url).pipe(
      tap(doctors => this.doctorsCache.next(doctors)),
      catchError(() => of([]))
    );
  }

  getByUserId(userId: string): Observable<Doctor | null> {
  return this.http.get<Doctor>(`${this.apiUrl}/user/${userId}`).pipe(
    catchError(() => of(null))
  );
}

  getFeaturedDoctors(): Observable<Doctor[]> {
    if (this.featuredCache.value.length > 0) {
      return this.featuredCache.asObservable();
    }
    return this.http.get<Doctor[]>(`${this.apiUrl}/featured`).pipe(
      tap(doctors => this.featuredCache.next(doctors)),
      catchError(() => of([]))
    );
  }

  getDoctor(id: string): Observable<Doctor| null> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  refresh(): void {
    this.doctorsCache.next([]);
    this.featuredCache.next([]);
  }
  rateDoctor(doctorId: number, score: number): Observable<Doctor> {
  return this.http.post<Doctor>(`${this.apiUrl}/rate`, { score, doctorId });
}


}
