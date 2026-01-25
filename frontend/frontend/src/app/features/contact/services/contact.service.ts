import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:3000/contact';

  constructor(private http: HttpClient) {}

  sendContactEmail(data: ContactEmailData): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-email`, data);
  }
}
