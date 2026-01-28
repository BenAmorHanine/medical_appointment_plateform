import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PatientProfile } from '../models/patient.model';
@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patient-profiles`;
  private adminPatientsUrl = `${environment.apiUrl}/patients`;


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
   getAllPatients(): Observable<PatientProfile[]> {
    return this.http.get<PatientProfile[]>(this.adminPatientsUrl);
  }
}

