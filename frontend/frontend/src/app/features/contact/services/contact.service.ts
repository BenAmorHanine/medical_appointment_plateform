import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { inject } from '@angular/core';
import { ContactEmailData } from '../models/contact-email-data.model';


@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/contact`;


  sendContactEmail(data: ContactEmailData): Observable<any> {
    return this.http.post(`${this.apiUrl}/contact-us-email`, data);
  }
}
