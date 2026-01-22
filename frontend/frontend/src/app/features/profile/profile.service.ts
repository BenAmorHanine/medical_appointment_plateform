// src/app/services/profile.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/profile`;

  getProfile() {
    //return this.http.get(this.API_URL);
    return this.http.get<any>(this.API_URL);
  }

  updateProfile(data: any) {
    return this.http.patch(this.API_URL, data);
  }
}
