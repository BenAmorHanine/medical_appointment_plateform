import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VisitHistoryResponse } from '../model/visit-history.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisitHistoryService {
  private readonly API = `${environment.apiUrl}/visit-history`;

  constructor(private http: HttpClient) {}

  // 👤 Patient
  getMyHistory(page = 1, limit = 10) {
    return this.http.get<VisitHistoryResponse>(
      `${this.API}/me?page=${page}&limit=${limit}`
    );
  }

  //  Doctor → liste patients
  getDoctorPatients(page = 1, limit = 10) {
    return this.http.get<any>(
      `${this.API}/doctor/patients?page=${page}&limit=${limit}`
    );
  }

  //  Doctor → historique d’un patient
 getDoctorPatientHistory(
  patientId: string,
  page = 1,
  limit = 10
): Observable<VisitHistoryResponse> {
  return this.http.get<VisitHistoryResponse>(
    `${this.API}/doctor/patient-history`,
    {
      params: { patientId, page, limit },
    }
  );
}

}
