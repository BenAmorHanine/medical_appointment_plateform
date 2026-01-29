import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationsService {
  private baseUrl = 'http://localhost:3000/notifications';

  constructor(private http: HttpClient) {}

  // ✅ returns ONLY logged-in user notifications (backend uses JWT)
  getMyNotifications(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.baseUrl);
  }

  getMyUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`);
  }

  markAllRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/mark-all-read`, {});
  }

  markOneRead(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/read`, {});
  }
}
