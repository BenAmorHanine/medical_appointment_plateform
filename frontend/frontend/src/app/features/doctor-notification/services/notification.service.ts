import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SendNotificationPayload {
  name: string;
  recipientEmail: string;
  subject: string;
  message: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {  

  private readonly apiUrl = `${environment.apiUrl}/contact/send-notification`;

  constructor(private http: HttpClient) {}

  sendNotification(payload: SendNotificationPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }
}
