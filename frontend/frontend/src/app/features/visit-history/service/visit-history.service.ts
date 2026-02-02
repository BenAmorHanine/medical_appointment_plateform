import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VisitHistoryResponse } from '../model/visit-history.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisitHistoryService {
  private readonly API = `${environment.apiUrl}/visit-history`;

  constructor(private http: HttpClient) {}

  // 🔹 Helper pagination (centralisé)
  private buildPaginationParams(page: number, limit: number): HttpParams {
    return new HttpParams()
      .set('page', page)
      .set('limit', limit);
  }

  // 🔹 Patient → SON historique
  getMyHistory(page = 1, limit = 10): Observable<VisitHistoryResponse> {
    const params = this.buildPaginationParams(page, limit);

    return this.http.get<VisitHistoryResponse>(
      `${this.API}/me`,
      { params }
    );
  }

  // 🔹 Doctor → liste des patients
  getDoctorPatients(page = 1, limit = 10): Observable<any> {
    const params = this.buildPaginationParams(page, limit);

    return this.http.get<any>(
      `${this.API}/doctor/patients`,
      { params }
    );
  }

  // 🔹 Doctor → historique d’un patient
  getDoctorPatientHistory(
    patientId: string,
    page = 1,
    limit = 10
  ): Observable<VisitHistoryResponse> {
    const params = this.buildPaginationParams(page, limit)
      .set('patientId', patientId);

    return this.http.get<VisitHistoryResponse>(
      `${this.API}/doctor/patient-history`,
      { params }
    );
  }
}
