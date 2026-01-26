import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VisitHistoryResponse } from '../model/visit-history.model';

@Injectable({
  providedIn: 'root',
})
export class VisitHistoryService {
  private readonly API = 'http://localhost:3000/visit-history';

  constructor(private http: HttpClient) {}

  getMyHistory(page = 1, limit = 10): Observable<VisitHistoryResponse> {
  return this.http.get<VisitHistoryResponse>(
    `${this.API}/me?page=${page}&limit=${limit}`
  );
}

getPatientHistory(
  patientId: string,
  page = 1,
  limit = 10,
): Observable<VisitHistoryResponse> {
  return this.http.get<VisitHistoryResponse>(
    `${this.API}/patient/${patientId}?page=${page}&limit=${limit}`
  );
}

}