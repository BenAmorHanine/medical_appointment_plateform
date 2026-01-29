import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/profile`;

  getProfile() {
    return this.http.get<any>(this.API_URL);
  }

  updateProfile(payload: any, file?: File): Observable<any> {
    const formData = new FormData();

    //Append the text fields: firstName, phone, specialty..
    Object.keys(payload).forEach(key => {
      if (payload[key] !== undefined && payload[key] !== null) {
        formData.append(key, payload[key]);
      }
    });

    // 'image' must match @UploadedFile('image')
    if (file) {
      formData.append('image', file);
    }

    return this.http.patch(this.API_URL, formData);
  }
}
