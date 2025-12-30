import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PatientProfile {
  id: string;
  age?: number;
  phone?: string;
  medicalRecordNumber: string;
  address?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private apiUrl = 'http://localhost:3000/patient-profiles';

  constructor(private http: HttpClient) {}

  getPatientProfile(patientId: string): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${this.apiUrl}/${patientId}`);
  }

  getPatientName(patientId: string): Observable<string> {
    return this.getPatientProfile(patientId).pipe(
      map((profile) => {
        if (profile.user) {
          // Utiliser username comme nom (puisque UserEntity n'a pas firstName/lastName)
          // Le username peut être formaté comme "prenom.nom" ou simplement le nom
          return profile.user.username || 'Patient inconnu';
        }
        return 'Patient inconnu';
      })
    );
  }
}

