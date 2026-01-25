// src/app/services/profile.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/profile`;

  getProfile() {
    //return this.http.get(this.API_URL);
    return this.http.get<any>(this.API_URL);
  }

  /*updateProfile(data: any) {
    return this.http.patch(this.API_URL, data);
  }*/
  // NEW
  updateProfile(payload: any, file?: File): Observable<any> {
    const formData = new FormData();

    // 1. Append the text fields (firstName, phone, specialty, etc.)
    Object.keys(payload).forEach(key => {
      if (payload[key] !== undefined && payload[key] !== null) {
        formData.append(key, payload[key]);
      }
    });

    // 2. Append the physical file
    // 'image' must match @UploadedFile('image') in NestJS
    if (file) {
      formData.append('image', file);
    }

    // 3. Send via PATCH
    // Note: HttpClient automatically handles the headers for FormData
    return this.http.patch(this.API_URL, formData);
  }
}
